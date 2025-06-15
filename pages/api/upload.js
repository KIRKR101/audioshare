import multer from 'multer';
import { parseBuffer, parseFile } from 'music-metadata';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import sqlite3 from 'sqlite3';

// Disable default body parser
export const config = {
    api: {
        bodyParser: false,
        responseLimit: '25mb',
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

        const result = await processAudioFile(req, res);  // Pass req and res

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

async function processAudioFile(req, res) {
  const MAX_RETRIES = 5;
  let metadata;
  const tempFilePath = req.file.path;
  const originalName = req.file.originalname;
  const fileExt = path.extname(originalName).toLowerCase();
  const dbPath = path.resolve(process.cwd(), "lib/database.db");
  let db;

  try {
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        logger.error("Error connecting to database in processAudioFile", err);
        throw new Error(`Database connection failed: ${err.message}`);
      }
      logger.debug("Connected to SQLite database for processing.");
    });

    // --- Metadata Parsing ---
    if ([".flac", ".ogg", ".wav", ".aiff", ".m4a"].includes(fileExt)) {
      logger.debug(`Using parseFile for ${fileExt} file`);
      metadata = await parseFile(tempFilePath, {
        skipCovers: false,
        skipPostHeaders: false,
        duration: true,
      });
    } else {
      logger.debug(`Using parseBuffer for ${fileExt} file`);
      const fileBuffer = await fs.readFile(tempFilePath);
      metadata = await parseBuffer(fileBuffer, {
        mimeType: req.file.mimetype,
        skipCovers: false,
        skipPostHeaders: false,
        duration: true,
      });
    }

    const fileId = crypto.randomBytes(16).toString("hex");
    const albumArtPath = await processAlbumArt(metadata, fileId);
    const initialPublicPath = await storeAudioFile(
      tempFilePath,
      fileId,
      originalName
    );
    const commonMetadataWithoutPicture = { ...metadata.common };
    delete commonMetadataWithoutPicture.picture;
    const nativeMetadataWithoutImage = removeImageDataFromNative(
      metadata.native,
      metadata.format.codec
    );

    let fileMetadata = {
      fileId,
      originalName: originalName,
      fileExtension: fileExt.slice(1),
      mimetype: req.file.mimetype,
      size: req.file.size,
      albumArt: albumArtPath,
      publicPath: initialPublicPath,
      format: metadata.format,
      common: commonMetadataWithoutPicture,
      native: nativeMetadataWithoutImage,
      uploadDate: new Date().toISOString(),
    };

    // --- DB Insertion ---

    const sql = `
            INSERT INTO songs (
                filename, filepath, size, artist, title, album, year, trackNumber,
                genre, duration, bitrate, sampleRate, format, albumArtist, composer, diskNumber, extension, link
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

    let success = false;
    for (let i = 0; i <= MAX_RETRIES; i++) {
      try {
        const fileUrl = `${fileMetadata.publicPath.replace(fileExt, "")}`;
        const params = [
          fileMetadata.originalName,
          fileMetadata.publicPath,
          fileMetadata.size ?? null,
          metadata.common?.artist ?? null,
          metadata.common?.title ?? null,
          metadata.common?.album ?? null,
          metadata.common?.year ?? null,
          metadata.common?.track?.no ?? null,
          metadata.common?.genre?.join(", ") ?? null,
          metadata.format?.duration ?? null,
          metadata.format?.bitrate ?? null,
          metadata.format?.sampleRate ?? null,
          metadata.format?.codec ?? null,
          metadata.common?.albumartist ?? null,
          metadata.common?.composer?.join(", ") ?? null,
          metadata.common?.disk?.no ?? null,
          fileMetadata.fileExtension,
          fileUrl,
        ];

        await new Promise((resolve, reject) => {
          db.run(sql, params, function (err) {
            if (err) {
              reject(err);
            } else {
              fileMetadata.dbId = this.lastID;
              resolve();
            }
          });
        });

        logger.info(`Song inserted into DB with ID: ${fileMetadata.dbId}`);
        success = true;
        break;
      } catch (dbErr) {
        if (dbErr.message.includes("SQLITE_CONSTRAINT") && i < MAX_RETRIES) {
          logger.warn(
            `Duplicate filename detected for ${fileMetadata.originalName}. Retrying with modified name.`
          );

          const newTimestamp = Date.now();
          const nameWithoutExt = path.basename(
            fileMetadata.originalName,
            fileExt
          );

          const oldFilesystemPath = path.join(
            process.cwd(),
            "public",
            fileMetadata.publicPath
          );
          const newOriginalName = `${nameWithoutExt}_${newTimestamp}${fileExt}`;
          const newPublicPath = `/audio/${fileId}_${newTimestamp}${fileExt}`;
          const newFilesystemPath = path.join(
            process.cwd(),
            "public",
            newPublicPath
          );

          await fs.rename(oldFilesystemPath, newFilesystemPath);
          logger.debug(
            `Renamed file from ${oldFilesystemPath} to ${newFilesystemPath}`
          );

          fileMetadata.originalName = newOriginalName;
          fileMetadata.publicPath = newPublicPath;

        } else {
          logger.error(
            "Error inserting data into database after retries or for a non-constraint reason.",
            dbErr
          );
          throw new Error(`Database insertion failed: ${dbErr.message}`);
        }
      }
    }

    if (!success) {
      throw new Error(
        "Failed to process file after multiple retries due to database constraints."
      );
    }


    await appendToAudioList(
      fileMetadata.originalName,
      fileMetadata.publicPath,
      fileMetadata
    );

    // Store the metadata in a JSON file
    await storeMetadata(fileMetadata.fileId, fileMetadata);

    return fileMetadata;
  } finally {
    if (db) {
      db.close((err) => {
        if (err) {
          logger.error("Error closing database connection", err);
        } else {
          logger.debug("Database connection closed.");
        }
      });
    }

    if (tempFilePath && existsSync(tempFilePath)) {
      try {
        await fs.unlink(tempFilePath);
      } catch (err) {
        logger.error("Failed to clean up temp file", err);
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
                // For formats without specific logic
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

async function appendToAudioList(originalName, publicPath, metadata) {
    // Log the received metadata object for debugging
    logger.debug('appendToAudioList received metadata:', metadata ? 'Object received' : metadata); // Log if object or null/undefined

    if (!metadata) {
        logger.error('appendToAudioList received undefined/null metadata for file:', originalName);
        const basicEntry = `${originalName || 'Unknown Filename'} | ${publicPath || 'Unknown Path'}\n`;
        try {
            const listFilePathOnError = path.join(process.cwd(), 'public', 'audio_files.txt');
            await fs.appendFile(listFilePathOnError, basicEntry, 'utf8');
        } catch (appendError) {
            logger.error('Failed to append basic info to audio list after metadata error', appendError);
        }
        return;
    }

    const listFilePath = path.join(process.cwd(), 'public', 'audio_files.txt');

    // Extract artist and title safely, providing fallbacks
    const artist = metadata.common?.artist || 'Unknown Artist';
    // Ensure originalName is a string before calling replace
    const fallbackTitleBase = typeof originalName === 'string' ? originalName.replace(/\.[^/.]+$/, "") : 'Unknown Title';
    const title = metadata.common?.title || fallbackTitleBase;

    const entry = `${artist} - ${title} - ${originalName || 'Unknown Filename'} | ${publicPath || 'Unknown Path'}\n`;
    try {
        await fs.appendFile(listFilePath, entry, 'utf8');
    } catch (error) {
        logger.error('Failed to append to audio list', error);
    }
}
