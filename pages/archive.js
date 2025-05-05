import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import sqlite3 from 'sqlite3';
import path from 'path';

const ITEMS_PER_PAGE = 40;

// Helper function to format file sizes
function formatBytes(bytes, decimals = 2) {
  const numericBytes = Number(bytes);
  if (isNaN(numericBytes) || numericBytes < 0) return "Invalid size";
  if (numericBytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(numericBytes) / Math.log(k));
  const index = Math.max(0, Math.min(i, sizes.length - 1));

  return (
    parseFloat((numericBytes / Math.pow(k, index)).toFixed(dm)) +
    " " +
    sizes[index]
  );
}

// Fallback title generation (e.g., remove extension)
const getFallbackTitle = (filename) => {
    if (!filename || typeof filename !== "string") return "N/A";
    const lastDotIndex = filename.lastIndexOf(".");
    if (lastDotIndex === -1 || lastDotIndex === 0) return filename; // No extension or starts with dot
    return filename.substring(0, lastDotIndex);
};


// Main page component
export default function DbArchivePage({
  files,
  totalItems,
  currentPage,
  totalPages,
  error,
}) {
  const router = useRouter();

  // Handler for the "Next" button
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      router.push(`/db-archive?page=${currentPage + 1}`);
    }
  };

  // Handler for the "Previous" button
  const handlePrevPage = () => {
    if (currentPage > 1) {
      router.push(`/db-archive?page=${currentPage - 1}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-black dark:text-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Archive
        </h1>

        {/* Display error message if fetching failed */}
        {error && (
          <div className="mb-4 p-4 border border-red-300 bg-red-100 text-red-700 rounded-md dark:bg-red-900 dark:text-red-200 dark:border-red-700">
            <p className="font-semibold">Error loading files:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Table container */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-neutral-800">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-neutral-900">
              <TableRow>
                <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Filename
                </TableHead>
                <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Title
                </TableHead>
                <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Artist
                </TableHead>
                <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Album
                </TableHead>
                <TableHead className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Size
                </TableHead>
                <TableHead className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  View
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200 dark:bg-neutral-950 dark:divide-neutral-800">
              {!error && files.length > 0
                ? files.map((file) => (
                    <TableRow
                      key={file.id} // Use database ID as key
                      className="hover:bg-gray-50 dark:hover:bg-neutral-900"
                    >
                      {/* Filename */}
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                        {file.originalName || "N/A"}
                      </TableCell>
                      {/* Title */}
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {file.title || getFallbackTitle(file.originalName) || "N/A"}
                      </TableCell>
                      {/* Artist */}
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {file.artist || "N/A"}
                      </TableCell>
                      {/* Album */}
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {file.album || "N/A"}
                      </TableCell>
                      {/* Filesize */}
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-right">
                        {formatBytes(file.size)}
                      </TableCell>
                      {/* Link to view/play */}
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        {file.filepath ? (
                           <Link
                             href={file.link} // Use the stored public path
                             passHref
                             legacyBehavior
                           >
                             <a
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                               title={`View ${file.originalName || "file"}`}
                             >
                               View
                             </a>
                           </Link>
                        ) : (
                           <span className="text-gray-400 dark:text-gray-600">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                : /* Display message when no files are found (and no error occurred) */
                  !error && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No audio files found in the database.
                      </TableCell>
                    </TableRow>
                  )}
              {/* Display a specific message if there was an error preventing rendering */}
              {error && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-red-600 dark:text-red-400"
                  >
                    Could not display files due to an error.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 0 && !error && (
          <div className="flex items-center justify-between mt-6 px-1">
            {/* Previous Button */}
            <Button
              variant="outline"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="disabled:opacity-50 disabled:cursor-not-allowed dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800"
            >
              Previous
            </Button>

            {/* Page Information */}
            <span className="text-sm text-neutral-800 dark:text-neutral-300">
              Page {currentPage} of {totalPages}
              <span className="hidden sm:inline">
                {" "}
                (Total: {totalItems} files)
              </span>
            </span>

            {/* Next Button */}
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages} // Use totalPages for disabling
              className="disabled:opacity-50 disabled:cursor-not-allowed dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800"
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

// --- getServerSideProps ---
export async function getServerSideProps(context) {
  const dbPath = path.resolve(process.cwd(), 'lib/database.db');
  const { page } = context.query;
  const currentPage = parseInt(page) || 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  let db;

  try {
    // Promise wrapper for database connection
    db = await new Promise((resolve, reject) => {
      const connection = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('Error connecting to SQLite database:', err);
          reject(new Error('Failed to connect to the database.'));
        } else {
          console.log('Connected to SQLite database for reading.');
          resolve(connection);
        }
      });
    });

    // Promise wrapper for getting total count
    const countResult = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM songs', [], (err, row) => {
        if (err) {
          console.error('Error fetching total count from DB:', err);
          reject(new Error('Failed to fetch total file count.'));
        } else {
          resolve(row);
        }
      });
    });
    const totalItems = countResult?.count || 0;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    // Promise wrapper for fetching paginated data
    const rows = await new Promise((resolve, reject) => {
      const sql = `
        SELECT id, filename, filepath, size, title, artist, album, uploadDate, link
        FROM songs
        ORDER BY uploadDate DESC, id DESC -- Order by date, then ID for stable pagination
        LIMIT ? OFFSET ?
      `;
      db.all(sql, [ITEMS_PER_PAGE, offset], (err, rows) => {
        if (err) {
          console.error('Error fetching paginated data from DB:', err);
          reject(new Error('Failed to fetch file data.'));
        } else {
          resolve(rows);
        }
      });
    });

    // Map database rows to the structure expected by the frontend component
    const fetchedFiles = rows.map(row => ({
      id: row.id,
      originalName: row.filename,
      filepath: row.filepath,
      size: row.size,
      title: row.title,
      artist: row.artist,
      album: row.album,
      uploadDate: row.uploadDate,
      link: row.link
    }));

    return {
      props: {
        files: fetchedFiles, // Already serializable
        totalItems,
        currentPage,
        totalPages,
        error: null,
      },
    };

  } catch (err) {
    console.error("Error in getServerSideProps (SQLite):", err);
    return {
      props: {
        files: [],
        totalItems: 0,
        currentPage: 1,
        totalPages: 0,
        error: `Failed to load files: ${err.message || "Unknown server error"}. Check server logs.`,
      },
    };
  } finally {
    // Ensure database connection is closed
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing SQLite database connection:', err);
        } else {
          console.log('SQLite database connection closed.');
        }
      });
    }
  }
}
