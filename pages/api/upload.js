// pages/api/upload.js
import multer from 'multer';
import { MongoClient, GridFSBucket } from 'mongodb';
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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
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

  // Connect to MongoDB (remove deprecated options)
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db();
  const bucket = new GridFSBucket(db, { bucketName: 'audio' });

  let metadata;
  let title;
  let artist;
  let albumArtLocalPath = null; // Will hold the local URL if album art is saved

  try {
    // Extract metadata from the audio file buffer
    metadata = await parseBuffer(req.file.buffer, req.file.mimetype, { duration: true });
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

  // Upload the audio file to GridFS and include the album art path in metadata
  const uploadStream = bucket.openUploadStream(req.file.originalname, {
    metadata: {
      title,
      artist,
      mimetype: req.file.mimetype,
      albumArt: albumArtLocalPath, // This is now a string pointing to the locally saved image
      // Include any other metadata if needed
    },
  });

  uploadStream.end(req.file.buffer);

  uploadStream.on('finish', () => {
    res.status(200).json({ fileId: uploadStream.id });
    client.close();
  });

  uploadStream.on('error', (error) => {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file.' });
    client.close();
  });
}
