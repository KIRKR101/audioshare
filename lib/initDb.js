const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the path for the database file
const dbPath = path.resolve(__dirname, 'database.db');

// Connect to the database (creates the file if it doesn't exist)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    createTable();
  }
});

// Function to create the songs table
function createTable() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      filepath TEXT NOT NULL,
      uploadDate TEXT DEFAULT CURRENT_TIMESTAMP,
      size INTEGER,
      artist TEXT,
      title TEXT,
      album TEXT,
      year INTEGER,
      trackNumber INTEGER,
      genre TEXT,
      duration REAL, -- Duration in seconds
      bitrate INTEGER, -- Bitrate in kbps
      sampleRate INTEGER, -- Sample rate in Hz
      format TEXT, -- e.g., 'mp3', 'wav'
      albumArtist TEXT,
      composer TEXT,
      diskNumber INTEGER
      -- Add more fields as needed based on available metadata
    );
  `;

  db.run(createTableSql, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
      // Close DB even if table creation fails initially
      closeDb();
    } else {
      console.log('Table "songs" created or already exists.');
      // Attempt to add new columns after table exists check
      addColumn('extension', 'TEXT');
      addColumn('link', 'TEXT');
      closeDb(); // Close DB after last add attempt
    }
  });
}

// add a column if it doesn't exist
function addColumn(columnName, columnType, callback) {
  const checkColumnSql = `PRAGMA table_info(songs);`;
  db.all(checkColumnSql, [], (err, columns) => {
    if (err) {
      console.error(`Error checking columns for ${columnName}:`, err.message);
      if (callback) callback(); // Proceed to next step or close
      return;
    }

    const columnExists = columns.some(col => col.name === columnName);
    if (!columnExists) {
      const addColumnSql = `ALTER TABLE songs ADD COLUMN ${columnName} ${columnType};`;
      db.run(addColumnSql, (err) => {
        if (err) {
          console.error(`Error adding column ${columnName}:`, err.message);
        } else {
          console.log(`Column "${columnName}" added successfully.`);
        }
        if (callback) callback(); // Proceed after attempting add
      });
    } else {
      console.log(`Column "${columnName}" already exists.`);
      if (callback) callback(); // Proceed if column exists
    }
  });
}

// Function to close the database connection
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
  });
}
