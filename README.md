This is an audio sharing site used for large audio files

Get started with:
```
npm run dev
```

## Firebase Setup

This project uses Firebase for backend services (like authentication, database, storage). To run the project locally, you need to configure your Firebase credentials:

1.  **Firebase Admin SDK Setup:**
    *   Go to your Firebase project settings > Service accounts.
    *   Generate a new private key and download the JSON file.
    *   Rename the downloaded file to `serviceAccountKey.json` and place it in the root directory of this project.
    *   Alternatively, copy the contents of the downloaded file into `serviceAccountKey.json.example` and rename the example file to `serviceAccountKey.json`.

2.  **Firebase Client SDK Setup:**
    *   Go to your Firebase project settings > General > Your apps.
    *   Find your web app configuration (it will look like `const firebaseConfig = { ... };`).
    *   Copy the configuration object.
    *   Open `lib/firebaseConfig.example.,js`.
    *   Replace the example configuration object with your actual configuration.
    *   Rename the file from `lib/firebaseConfig.example.,js` to `lib/firebaseConfig.js`.

**Important:** The `serviceAccountKey.json` and `lib/firebaseConfig.js` files contain sensitive credentials and are ignored by Git (see `.gitignore`). Do not commit them to your repository.
