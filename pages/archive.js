import React, { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import sqlite3 from "sqlite3";
import path from "path";
import { ArrowUpDown, Search, X } from "lucide-react";

const ITEMS_PER_PAGE = 20;

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

// Fallback title generation
const getFallbackTitle = (filename) => {
  if (!filename || typeof filename !== "string") return "N/A";
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1 || lastDotIndex === 0) return filename;
  return filename.substring(0, lastDotIndex);
};

// Main page component
export default function DbArchivePage({
  files,
  totalItems,
  currentPage,
  totalPages,
  error,
  search: initialSearch,
  sortBy: initialSortBy,
  sortOrder: initialSortOrder,
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialSearch || "");

  useEffect(() => {
    setSearchTerm(initialSearch || "");
  }, [initialSearch]);

  const handleStateChange = (newQuery) => {
    const query = { ...router.query, ...newQuery };
    if ("search" in newQuery) {
      query.page = 1;
    }
    if (query.search === "") delete query.search;
    router.push({ pathname: "/archive", query });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleStateChange({ search: searchTerm.trim() });
  };

  // Handler for the inline clear button
  const handleClearSearch = () => {
    setSearchTerm("");
    handleStateChange({ search: "" });
  };

  const handleSort = (column) => {
    const newSortOrder =
      initialSortBy === column && initialSortOrder === "asc" ? "desc" : "asc";
    handleStateChange({ sortBy: column, sortOrder: newSortOrder });
  };

  const SortableHeader = ({ column, label }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(column)}
      className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-neutral-800"
    >
      {label}
      {initialSortBy === column && <ArrowUpDown className="ml-2 h-4 w-4" />}
    </Button>
  );

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-black dark:text-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Archive
        </h1>

        {/* --- Search bar --- */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-grow w-full">
            {/* The relative container is key for positioning the icons */}
            <div className="relative">
              {/* Search Icon */}
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
              </div>

              {/* Input Field */}
              <Input
                type="search"
                placeholder="Search by title, artist, album..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="hide-search-cancel w-full h-11 pl-10 pr-10 dark:bg-neutral-900 dark:border-neutral-700 transition-shadow"
              />

              {/* Conditional Clear Button */}
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1 -mr-1 rounded-full text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>


        {error && (
          <div className="mb-4 p-4 border border-red-300 bg-red-100 text-red-700 rounded-md dark:bg-red-900 dark:text-red-200 dark:border-red-700">
            <p className="font-semibold">Error loading files:</p>
            <p>{error}</p>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-neutral-800 overflow-x-auto rounded-lg border border-gray-200 dark:border-neutral-800 custom-scrollbar">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-neutral-900">
              <TableRow>
                <TableHead className="px-4 py-2">
                  <SortableHeader column="title" label="Title" />
                </TableHead>
                <TableHead className="px-4 py-2">
                  <SortableHeader column="artist" label="Artist" />
                </TableHead>
                <TableHead className="hidden md:table-cell px-4 py-2">
                  <SortableHeader column="album" label="Album" />
                </TableHead>
                <TableHead className="hidden lg:table-cell px-4 py-2">
                  <SortableHeader column="filename" label="Filename" />
                </TableHead>
                <TableHead className="px-4 py-2 text-right">
                  <SortableHeader column="size" label="Size" />
                </TableHead>
                <TableHead className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  View
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200 dark:bg-neutral-950 dark:divide-neutral-800">
              {!error && files.length > 0 ? (
                files.map((file) => (
                  <TableRow
                    key={file.id}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-900"
                  >
                    <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                      {file.title ||
                        getFallbackTitle(file.originalName) ||
                        "N/A"}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {file.artist || "N/A"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {file.album || "N/A"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 truncate max-w-xs">
                      {file.originalName || "N/A"}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-right">
                      {formatBytes(file.size)}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      {file.link ? (
                        <Link href={file.link} passHref legacyBehavior>
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                          >
                            View
                          </a>
                        </Link>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">
                          N/A
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {initialSearch
                      ? `No results found for "${initialSearch}".`
                      : "No audio files found in the database."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 0 && !error && (
          <div className="flex items-center justify-between mt-6 px-1">
            <Button
              variant="outline"
              onClick={() => handleStateChange({ page: currentPage - 1 })}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-neutral-800 dark:text-neutral-300">
              Page {currentPage} of {totalPages}
              <span className="hidden sm:inline">
                {" "}
                (Total: {totalItems} files)
              </span>
            </span>
            <Button
              variant="outline"
              onClick={() => handleStateChange({ page: currentPage + 1 })}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export async function getServerSideProps(context) {
  const dbPath = path.resolve(process.cwd(), "lib/database.db");

  // --- Extract params from URL query ---
  const {
    page = "1",
    search = "",
    sortBy = "uploadDate", // Default sort
    sortOrder = "desc",
  } = context.query;

  const currentPage = parseInt(page, 10) || 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // --- Validate and sanitize sorting params ---
  const allowedSortColumns = [
    "filename",
    "title",
    "artist",
    "album",
    "size",
    "uploadDate",
  ];
  const safeSortBy = allowedSortColumns.includes(sortBy)
    ? sortBy
    : "uploadDate";
  const safeSortOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

  let db;
  try {
    db = await new Promise((resolve, reject) => {
      const conn = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) =>
        err ? reject(err) : resolve(conn)
      );
    });

    // --- Dynamically build query ---
    let whereClause = "";
    const queryParams = [];

    if (search) {
      // Search across multiple relevant fields
      whereClause = `WHERE (filename LIKE ? OR title LIKE ? OR artist LIKE ? OR album LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // --- Get total count with the same search filter ---
    const countResult = await new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) as count FROM songs ${whereClause}`;
      db.get(sql, queryParams, (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });
    const totalItems = countResult?.count || 0;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    // --- Get paginated data with search and sort ---
    const dataParams = [...queryParams, ITEMS_PER_PAGE, offset];
    const rows = await new Promise((resolve, reject) => {
      const sql = `
        SELECT id, filename, filepath, size, title, artist, album, uploadDate, link
        FROM songs
        ${whereClause}
        ORDER BY ${safeSortBy} ${safeSortOrder}, id DESC
        LIMIT ? OFFSET ?
      `;
      db.all(sql, dataParams, (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });

    const fetchedFiles = rows.map((row) => ({
      id: row.id,
      originalName: row.filename,
      filepath: row.filepath,
      size: row.size,
      title: row.title,
      artist: row.artist,
      album: row.album,
      uploadDate: row.uploadDate,
      link: row.link,
    }));

    return {
      props: {
        files: fetchedFiles,
        totalItems,
        currentPage: Math.min(currentPage, totalPages) || 1,
        totalPages,
        error: null,
        // Pass the state back to the frontend
        search,
        sortBy: safeSortBy,
        sortOrder: safeSortOrder.toLowerCase(),
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
        error: `Failed to load files: ${
          err.message || "Unknown server error"
        }.`,
        search: "",
        sortBy: "uploadDate",
        sortOrder: "desc",
      },
    };
  } finally {
    if (db) {
      db.close((err) => {
        if (err) console.error("Error closing SQLite connection:", err);
      });
    }
  }
}
