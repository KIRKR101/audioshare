import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { id } = req.query;
  const audioFileDir = path.join(process.cwd(), 'public', 'audio');
  const metadataFilePath = path.join(audioFileDir, `${id}.metadata.json`);

  try {
    const metadataContent = fs.readFileSync(metadataFilePath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    res.status(200).json(metadata);
  } catch (error) {
    res.status(404).json({ error: 'File metadata not found' });
  }
}