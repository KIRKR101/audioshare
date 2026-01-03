import fs from "fs";
import path from "path";
import mime from "mime-types";

export default async function handler(req, res) {
  const { filename } = req.query;

  if (!filename || typeof filename !== "string") {
    return res.status(400).json({ error: "Filename is required." });
  }

  // Prevent path traversal attacks
  if (filename.includes("..")) {
    return res.status(400).json({ error: "Invalid filename." });
  }

  const imageFileDir = path.join(process.cwd(), "public", "album-art");
  const imageFilePath = path.join(imageFileDir, filename);

  try {
    const stat = await fs.promises.stat(imageFilePath);

    const contentType =
      mime.lookup(imageFilePath) || "application/octet-stream"; // Default if type unknown

    // Set headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", stat.size);

    // Create a read stream and pipe it to the response
    const readStream = fs.createReadStream(imageFilePath);

    // Pipe the stream to the response object
    readStream.pipe(res);

    // Handle stream errors (e.g., file deleted during streaming)
    readStream.on("error", (err) => {
      console.error("Stream error serving image:", err);
      // Avoid sending JSON if headers might have already been sent
      if (!res.headersSent) {
        res.status(500).json({ error: "Error reading image file." });
      } else {
        res.end(); // Gracefully end the response if possible
      }
    });
  } catch (error) {
    // Handle errors, specifically file not found
    if (error.code === "ENOENT") {
      console.log(`Album art not found: ${imageFilePath}`);
      res.status(404).json({ error: "Album art image not found." });
    } else {
      // Handle other potential errors (e.g., permissions)
      console.error(`Error accessing album art ${imageFilePath}:`, error);
      res.status(500).json({ error: "Could not retrieve album art." });
    }
  }
}

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false,
    responseLimit: false,
  },
};
