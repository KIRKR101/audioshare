import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { id } = req.query;
  const audioFileDir = path.join(process.cwd(), 'public', 'audio');
  const metadataFilePath = path.join(audioFileDir, `${id}.metadata.json`);

  let metadata;
  try {
    const metadataContent = fs.readFileSync(metadataFilePath, 'utf-8');
    metadata = JSON.parse(metadataContent);
  } catch (error) {
    return res.status(404).json({ error: 'File metadata not found.' });
  }

  const audioFilePath = path.join(audioFileDir, `${id}.${metadata.fileExtension}`);


  try {
    const stat = fs.statSync(audioFilePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      
      // Define a maximum chunk size (1MB)
      const MAX_CHUNK_SIZE = 1024 * 1024; 
      
      let end = parts[1] ? parseInt(parts[1], 10) : start + MAX_CHUNK_SIZE;
      
      // Ensure end doesn't exceed file size
      if (end >= fileSize) {
        end = fileSize - 1;
      }
      
      // Ensure start doesn't exceed end
      if (start > end) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }

      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(audioFilePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': metadata.mimetype,
      });

      file.pipe(res);

      file.on('error', (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).end();
        } else {
          res.end();
        }
      });
    } else {
      // No range requested, send the whole file
      const file = fs.createReadStream(audioFilePath);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Type', metadata.mimetype); // Use mimetype from metadata
      file.pipe(res);

      file.on('error', (err) => {
        res.status(404).json({ error: 'File not found.' });
      });
    }

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: 'Could not retrieve file.' });
  }
}

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false,
    responseLimit: false,
  },
};
