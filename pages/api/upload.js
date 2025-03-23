import multer from 'multer';
import { parseBuffer, parseFile } from 'music-metadata';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';

// Disable default body parser
export const config = {
    api: {
        bodyParser: false,
        responseLimit: '2mb',
        externalResolver: true,
    },
};

const ALLOWED_MIME_TYPES = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
    'audio/x-wav', 'audio/flac', 'audio/ogg', 'audio/aac',
    'audio/m4a', 'audio/mp4', 'audio/x-m4a', 'audio/webm',
    'audio/aiff'
];

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
};

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const tempDir = path.join(process.cwd(), 'temp-uploads');
        try {
            await fs.mkdir(tempDir, { recursive: true });
            cb(null, tempDir);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${uniqueSuffix}-${sanitizedName}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 300 * 1024 * 1024, files: 1 },
    fileFilter: fileFilter
});

const runMiddleware = (req, res, fn) =>
    new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });

const logger = {
    info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
    error: (message, error) => console.error(`[ERROR] ${message}`, error),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    debug: (message, ...args) => process.env.NODE_ENV !== 'production' ?
        console.log(`[DEBUG] ${message}`, ...args) : null
};

export default async function handler(req, res) {
    const startTime = process.hrtime();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    let tempFilePath = null;

    try {
        await runMiddleware(req, res, upload.single('file'));

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        tempFilePath = req.file.path;
        logger.info(`File received: ${req.file.originalname} (${req.file.size} bytes)`);

        const result = await processAudioFile(req.file);

        const endTime = process.hrtime(startTime);
        const processingTime = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);

        logger.info(`File processed in ${processingTime}ms: ${result.fileId}`);
        res.status(200).json(result);

    } catch (err) {
        logger.error('Error processing upload', err);

        if (tempFilePath && existsSync(tempFilePath)) {
            try {
                await fs.unlink(tempFilePath);
            } catch (cleanupErr) {
                logger.error('Failed to clean up temp file', cleanupErr);
            }
        }

        const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413
            : err.message?.includes('Unsupported file type') ? 415
                : 500;

        const errorMessage = process.env.NODE_ENV === 'production' && statusCode === 500
            ? 'File processing failed'
            : err.message;

        res.status(statusCode).json({ error: errorMessage });
    }
}

async function processAudioFile(file) {
    let metadata;
    const tempFilePath = file.path;
    const fileExt = path.extname(file.originalname).toLowerCase();

    try {
        if (['.flac', '.ogg', '.wav', '.aiff', '.m4a'].includes(fileExt)) {
            logger.debug(`Using parseFile for ${fileExt} file`);
            metadata = await parseFile(tempFilePath, {
                skipCovers: false,
                skipPostHeaders: false,
                duration: true
            });
        } else {
            logger.debug(`Using parseBuffer for ${fileExt} file`);
            const fileBuffer = await fs.readFile(tempFilePath);
            metadata = await parseBuffer(fileBuffer, {
                mimeType: file.mimetype,
                skipCovers: false,
                skipPostHeaders: false,
                duration: true
            });
        }

        const fileId = crypto.randomBytes(16).toString('hex');
        const albumArtPath = await processAlbumArt(metadata, fileId);
        const storedFilePath = await storeAudioFile(tempFilePath, fileId, file.originalname);
        const commonMetadataWithoutPicture = { ...metadata.common }; // Create a shallow copy
        delete commonMetadataWithoutPicture.picture; // Remove the picture property from the copy

        // Remove image data from native metadata using format-specific logic
        const nativeMetadataWithoutImage = removeImageDataFromNative(metadata.native, metadata.format.codec);

        const fileMetadata = {
            fileId,
            originalName: file.originalname,
            fileExtension: fileExt.slice(1),
            mimetype: file.mimetype,
            size: file.size,
            albumArt: albumArtPath,
            publicPath: storedFilePath,
            format: metadata.format,
            common: commonMetadataWithoutPicture,
            native: nativeMetadataWithoutImage,
            uploadDate: new Date().toISOString(),
        };

        await storeMetadata(fileId, fileMetadata);
        return fileMetadata;

    } finally {
        if (tempFilePath && existsSync(tempFilePath)) {
            try {
                await fs.unlink(tempFilePath);
            } catch (err) {
                logger.error('Failed to clean up temp file', err);
            }
        }
    }
}

function removeImageDataFromNative(nativeMetadata, codec) {
    if (!nativeMetadata) {
        return nativeMetadata;
    }

    const cleanedNativeMetadata = {};

    for (const format in nativeMetadata) {
        if (nativeMetadata.hasOwnProperty(format)) {
            let formatSpecificTagsToRemove = [];

            switch (format) {
                case 'id3v2': // MP3, etc.
                    formatSpecificTagsToRemove = ['APIC']; // Attached Picture Frame
                    break;
                case 'vorbis': // FLAC, Ogg Vorbis
                    formatSpecificTagsToRemove = ['METADATA_BLOCK_PICTURE']; // Vorbis Comment for Pictures
                    break;
                case 'iTunes': // MP4, M4A, AAC (iTunes-style metadata)
                    formatSpecificTagsToRemove = ['covr']; // Cover Art Atom
                    break;
                default:
                    break; // No format-specific removal for unknown formats
            }

            cleanedNativeMetadata[format] = nativeMetadata[format].filter(tag => {
                if (format === 'id3v2' && formatSpecificTagsToRemove.includes(tag.id)) {
                    return false; // Exclude specific ID3v2 frames by ID
                } else if (format === 'vorbis' && formatSpecificTagsToRemove.includes(tag.name)) {
                    return false; // Exclude specific Vorbis comments by name
                } else if (format === 'iTunes' && formatSpecificTagsToRemove.includes(tag.id)) {
                    return false; // Exclude specific iTunes atoms by ID
                }
                // For formats without specific logic, fallback to heuristics (optional, can be removed if only format-specific removal is desired)
                if (tag.id) {
                    const tagIdLower = tag.id.toLowerCase();
                    if (tagIdLower.includes('picture') || tagIdLower.includes('coverart') || tagIdLower.includes('cover')) {
                        return false; // Heuristic: Exclude tags with 'picture', 'coverart', or 'cover' in ID
                    }
                }
                if (Array.isArray(tag.value) && tag.value.every(item => typeof item === 'number')) {
                    return false; // Heuristic: Exclude array values that are all numbers
                }
                if (typeof tag.value === 'string' && tag.value.length > 1000) {
                    return false; // Heuristic: Exclude very long string values
                }
                return true;
            });
        }
    }
    return cleanedNativeMetadata;
}


async function processAlbumArt(metadata, fileId) {
    if (!metadata?.common?.picture || metadata.common.picture.length === 0) {
        return null;
    }

    try {
        const picture = metadata.common.picture[0];
        let extension = '.jpg'; // Default
        if (picture.format) {
            switch (picture.format) {
                case 'image/jpeg':
                    extension = '.jpg'; break;
                case 'image/png':
                    extension = '.png'; break;
                case 'image/gif':
                    extension = '.gif'; break;
                case 'image/webp':
                    extenstion = '.webp'; break;
            }
        }

        const albumArtDir = path.join(process.cwd(), 'public', 'album-art');
        await fs.mkdir(albumArtDir, { recursive: true });
        const fileName = `${fileId}${extension}`;
        const filePath = path.join(albumArtDir, fileName);
        await fs.writeFile(filePath, picture.data);
        return `/album-art/${fileName}`;
    } catch (err) {
        logger.error('Failed to save album art', err);
        return null;
    }
}

async function storeAudioFile(sourcePath, fileId, originalName) {
    const audioFileDir = path.join(process.cwd(), 'public', 'audio');
    await fs.mkdir(audioFileDir, { recursive: true });
    let ext = path.extname(originalName);
    if (!ext) {
        ext = '.mp3'; // Fallback
    }
    const destinationPath = path.join(audioFileDir, `${fileId}${ext}`);
    await pipeline(createReadStream(sourcePath), createWriteStream(destinationPath));
    return `/audio/${fileId}${ext}`;
}

async function storeMetadata(fileId, metadata) {
    const audioFileDir = path.join(process.cwd(), 'public', 'audio');
    const metadataFilePath = path.join(audioFileDir, `${fileId}.metadata.json`);
    await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2));
    return metadataFilePath;
}