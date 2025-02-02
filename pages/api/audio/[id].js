// pages/api/audio/[id].js
import { MongoClient, ObjectId, GridFSBucket } from 'mongodb';

export default async function handler(req, res) {
  const { id } = req.query;
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db();
  const bucket = new GridFSBucket(db, { bucketName: 'audio' });
  const fileId = new ObjectId(id);

  try {
    const fileInfo = await db.collection('audio.files').findOne({ _id: fileId });
    if (!fileInfo) {
      res.status(404).json({ error: 'File not found.' });
      client.close();
      return;
    }

    const fileSize = fileInfo.length;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      const downloadStream = bucket.openDownloadStream(fileId, {
        start,
        end: end + 1, // GridFSBucket is inclusive of the end byte
      });

      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Content-Type', 'audio/mpeg'); // Or get from fileInfo.metadata.contentType if you store it
      res.status(206); // Partial Content

      downloadStream.on('error', (err) => {
        console.error("Download stream error:", err); // Log the error for debugging
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`); // Range Not Satisfiable
        res.statusMessage = 'Range Not Satisfiable';
        res.end();
        client.close();
      });

      downloadStream.pipe(res);


    } else {
      // No range requested, send the whole file
      const downloadStream = bucket.openDownloadStream(fileId);

      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Type', 'audio/mpeg'); // Or get from fileInfo.metadata.contentType

      downloadStream.on('error', (err) => {
        res.status(404).json({ error: 'File not found.' });
        client.close();
      });

      downloadStream.pipe(res);
    }

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: 'Could not retrieve file.' });
    client.close();
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
};