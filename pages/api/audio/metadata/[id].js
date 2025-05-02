import { db } from '../../../../lib/firebaseAdmin'; // Import Firestore instance

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing file ID' });
  }

  try {
    const docRef = db.collection('audioFiles').doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists()) {
      // Return the document data
      res.status(200).json(docSnap.data());
    } else {
      // Document not found
      res.status(404).json({ error: 'File metadata not found' });
    }
  } catch (error) {
    console.error('Error fetching metadata from Firestore:', error);
    res.status(500).json({ error: 'Internal server error fetching metadata' });
  }
}
