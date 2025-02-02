// pages/api/audio/metadata/[id].js
import { MongoClient, ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { id } = req.query;
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db();

  const files = await db
    .collection('audio.files')
    .find({ _id: new ObjectId(id) })
    .toArray();

  if (!files || files.length === 0) {
    res.status(404).json({ error: 'File not found' });
    client.close();
    return;
  }

  const file = files[0];
  res.status(200).json(file.metadata || {});
  client.close();
}
