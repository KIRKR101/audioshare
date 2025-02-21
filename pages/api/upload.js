import multer from 'multer';
import { parseBuffer } from 'music-metadata';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Disable default body parser to use multer
export const config = {
    api: {
        bodyParser: false,
    },
};

// Set up multer to store the file in memory temporarily
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 300 * 1024 * 1024 }, // 300 MB limit
});

// Helper to run middleware
const runMiddleware = (req, res, fn) =>
    new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    try {
        // Run multer middleware to process the file upload
        await runMiddleware(req, res, upload.single('file'));
    } catch (err) {
        return res.status(500).json({ error: 'Error processing file upload.' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    let metadata;
    let title;
    let artist;
    let albumArtLocalPath = null;

    try {
        // Extract metadata from the audio file buffer with more comprehensive options if needed (though defaults are usually good)
        metadata = await parseBuffer(req.file.buffer, req.file.mimetype, {
            duration: true,
            // You can add more options here if necessary, refer to music-metadata docs
        });
        title = metadata.common.title || req.file.originalname;
        artist = metadata.common.artist;

        // If album art exists, store it as a separate image file
        if (metadata.common.picture && metadata.common.picture.length > 0) {
            const picture = metadata.common.picture[0];

            // Determine file extension based on the mime type of the image
            let extension = '';
            switch (picture.format) {
                case 'image/jpeg':
                    extension = '.jpg';
                    break;
                case 'image/png':
                    extension = '.png';
                    break;
                default:
                    extension = '';
            }

            // Generate a unique file name using crypto (if extension is available)
            if (extension) {
                const fileName = crypto.randomBytes(16).toString('hex') + extension;
                const albumArtDir = path.join(process.cwd(), 'public', 'album-art');

                // Ensure the album art directory exists
                fs.mkdirSync(albumArtDir, { recursive: true });

                // Write the album art image to the file system
                const filePath = path.join(albumArtDir, fileName);
                fs.writeFileSync(filePath, picture.data);

                // Store the public path of the album art image for later use
                albumArtLocalPath = `/album-art/${fileName}`;
            }
        }
    } catch (err) {
        console.warn('Metadata extraction failed, using fallback values.');
        title = req.file.originalname;
    }

    // Generate a unique file ID
    const fileId = crypto.randomBytes(16).toString('hex');
    const audioFileDir = path.join(process.cwd(), 'public', 'audio');
    fs.mkdirSync(audioFileDir, { recursive: true });
    const audioFilePath = path.join(audioFileDir, `${fileId}.${path.extname(req.file.originalname).slice(1)}`); // Include original extension

    // Save the audio file locally
    fs.writeFileSync(audioFilePath, req.file.buffer);

    // Save metadata to a JSON file
    const metadataFilePath = path.join(audioFileDir, `${fileId}.metadata.json`);

    // Include format and common metadata directly in fileMetadata
    const fileMetadata = {
        title,
        artist,
        mimetype: req.file.mimetype,
        albumArt: albumArtLocalPath,
        originalName: req.file.originalname,
        fileExtension: path.extname(req.file.originalname).slice(1),
        format: metadata.format, // Include format metadata
        common: metadata.common, // Include common metadata
    };
    fs.writeFileSync(metadataFilePath, JSON.stringify(fileMetadata, null, 2));

    console.log("Extracted Metadata:", metadata); // Add this line
    fs.writeFileSync(metadataFilePath, JSON.stringify(fileMetadata, null, 2));

    res.status(200).json({ fileId });
}