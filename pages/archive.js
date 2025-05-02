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

const ITEMS_PER_PAGE = 40;

// Helper function to format file sizes
function formatBytes(bytes, decimals = 2) {
  // Ensure bytes is a number
  const numericBytes = Number(bytes);
  if (isNaN(numericBytes) || numericBytes < 0) return "Invalid size";
  if (numericBytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(numericBytes) / Math.log(k));
  // Ensure index is within bounds
  const index = Math.max(0, Math.min(i, sizes.length - 1));

  return (
    parseFloat((numericBytes / Math.pow(k, index)).toFixed(dm)) +
    " " +
    sizes[index]
  );
}

// main page component
export default function ArchivePage({
  files,
  totalItems,
  currentPage,
  totalPages,
  nextPageDocId,
  error,
}) {
  const router = useRouter();

  // Handler for the "Next" button
  const handleNextPage = () => {
    if (nextPageDocId && currentPage < totalPages) {
      // Navigate to the next page using the last document ID as a cursor
      router.push(
        `/archive?lastDocId=${nextPageDocId}&page=${currentPage + 1}`
      );
    }
  };

  // Handler for the "Previous" button
  const handlePrevPage = () => {
    if (currentPage > 1) {
      // Navigate back. For simplicity, this goes back page by page.
      router.push(`/archive?page=${currentPage - 1}`); // Simple page number decrement
      // Alternatively, reset to page 1:
      // router.push('/archive');
    }
  };

  // Fallback title generation (e.g., remove extension)
  const getFallbackTitle = (filename) => {
    if (!filename || typeof filename !== "string") return "N/A";
    const lastDotIndex = filename.lastIndexOf(".");
    if (lastDotIndex === -1 || lastDotIndex === 0) return filename; // No extension or starts with dot
    return filename.substring(0, lastDotIndex);
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-black dark:text-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Audio Archive
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
                      key={file.id}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-900"
                    >
                      {/* Filename: Truncate long names */}
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                        {file.originalName || file.id || "N/A"}
                      </TableCell>
                      {/* Title: Use common.title or fallback */}
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {file.common?.title ||
                          getFallbackTitle(file.originalName) ||
                          "N/A"}
                      </TableCell>
                      {/* Artist */}
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {file.common?.artist || "N/A"}
                      </TableCell>
                      {/* Album */}
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {file.common?.album || "N/A"}
                      </TableCell>
                      {/* Filesize */}
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-right">
                        {formatBytes(file.size)}
                      </TableCell>
                      {/* Download Link */}
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <Link
                          href={`/audio/${file.id}`}
                          passHref
                          legacyBehavior
                        >
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                            title={`Download ${file.originalName || "file"}`} // Added title attribute
                          >
                            View
                          </a>
                        </Link>
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
                        No audio files found.
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

        {/* Pagination Controls - only show if there are pages */}
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
              disabled={currentPage >= totalPages || !nextPageDocId}
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
  // Only import the Firebase Admin SDK modules needed
  let db;
  try {
    // Dynamically import only your admin setup
    const admin = await import("../lib/firebaseAdmin");
    db = admin.db; // Get the exported db instance
  } catch (importError) {
    console.error("Error importing Firebase Admin module:", importError);
    return {
      props: {
        files: [],
        totalItems: 0,
        currentPage: 1,
        totalPages: 0,
        nextPageDocId: null,
        error:
          "Server configuration error: Failed to load Firebase Admin module.",
      },
    };
  }

  const { lastDocId, page } = context.query;
  const currentPage = parseInt(page) || 1;
 
  try {
     const audioFilesRef = db.collection("audioFiles"); // Make sure 'audioFiles' is your correct collection name

    // --- Get Total Count using Admin SDK ---
    let totalItems = 0;
    try {
      const countSnapshot = await audioFilesRef.count().get(); // Use Admin SDK count()
      totalItems = countSnapshot.data().count;
    } catch (countError) {
      console.error("Error fetching total count:", countError);
      // Proceeding without total count, totalPages will be 0 or based on fetched items
    }
    const totalPages =
      totalItems > 0 ? Math.ceil(totalItems / ITEMS_PER_PAGE) : 0;

    // --- Build Query using Admin SDK ---
    // Make sure 'uploadDate' exists and is indexed in Firestore for ordering
    let query = audioFilesRef.orderBy("uploadDate", "desc");
    let startAfterDoc = null;

    // --- Handle Pagination Cursor ---
    if (lastDocId && currentPage > 1) {
      try {
        // Fetch the document snapshot using Admin SDK to use as cursor
        const lastDocSnap = await audioFilesRef.doc(lastDocId).get();
        if (lastDocSnap.exists) {
          startAfterDoc = lastDocSnap;
          query = query.startAfter(startAfterDoc); // Chain startAfter for cursor pagination
        } else {
          console.warn(
            `Admin SDK: lastDocId ${lastDocId} for page ${currentPage} not found. Querying without cursor.`
          );
        }
      } catch (docError) {
        console.error(
          `Admin SDK: Error fetching lastDocId ${lastDocId}:`,
          docError
        );
      }
    }

    // --- Apply Limit and Fetch Docs using Admin SDK ---
    query = query.limit(ITEMS_PER_PAGE);
    const documentSnapshots = await query.get();

    // --- Map Results ---
    const fetchedFiles = documentSnapshots.docs.map((docSnap) => {
      const data = docSnap.data();
      // Convert Firestore Timestamps to ISO strings for serialization
      const uploadDateISO = data.uploadDate?.toDate
        ? data.uploadDate.toDate().toISOString()
        : data.uploadDate || null;

      const fileData = {
        id: docSnap.id,
        originalName: data.originalName || null,
        size: data.size || 0,
        common: data.common || {},
        uploadDate: uploadDateISO,
      };
      return fileData;
    });

    // --- Determine next page cursor ---
    // The ID of the last document fetched is the cursor for the *next* page
    const nextPageDocId =
      documentSnapshots.docs.length === ITEMS_PER_PAGE
        ? documentSnapshots.docs[documentSnapshots.docs.length - 1]?.id
        : null; // No next page if fewer items than limit were returned

    // --- Return Props ---
    return {
      props: {
        files: JSON.parse(JSON.stringify(fetchedFiles)),
        totalItems,
        currentPage,
        totalPages,
        nextPageDocId, 
        error: null,
      },
    };
  } catch (err) {
    console.error("Error in getServerSideProps (Admin SDK):", err);
    return {
      props: {
        files: [],
        totalItems: 0,
        currentPage: 1,
        totalPages: 0,
        nextPageDocId: null,
        error: `Failed to load files: ${
          err.message || "Unknown server error"
        }. Check server logs for details.`,
      },
    };
  }
}
