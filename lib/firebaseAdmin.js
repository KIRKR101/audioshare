import admin from 'firebase-admin';

// Make sure the path to your service account key is correct
// or provide the key object directly if not using a file.
// Ensure serviceAccountKey.json is populated with your actual key.
import serviceAccount from '../serviceAccountKey.json'; // Adjust path if needed

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Optional: Add databaseURL if using Realtime Database
      // databaseURL: "YOUR_DATABASE_URL"
    });
    console.log('Firebase Admin Initialized.');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error.stack);
}

export default admin;
export const db = admin.firestore();
