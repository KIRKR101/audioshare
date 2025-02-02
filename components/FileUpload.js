// components/FileUpload.js
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { X } from "lucide-react";

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shareableLink, setShareableLink] = useState("");
  const fileInputRef = useRef(null);
  const [uploadSuccess, setUploadSuccess] = useState(false); // New state for upload success message

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first!");
      return;
    }

    setUploading(true);
    setProgress(10);
    setUploadSuccess(false); // Reset success message on new upload

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        },
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setShareableLink(`${window.location.origin}/audio/${data.fileId}`);
      setUploadSuccess(true); // Set upload success to true
      toast.success("Upload successful!");
    } catch (error) {
      toast.error("Upload failed. Try again.");
      setUploadSuccess(false); // Ensure success message is hidden on failure
    } finally {
      setUploading(false);
    }
  };

  const handleDeselectFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setProgress(0);
    setShareableLink(""); // Clear shareable link on deselect
    setUploadSuccess(false); // Hide success message on deselect
  };

  return (
    <Card className="max-w-md mx-auto p-6">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Upload an Audio File</h2>

        {file ? (
          <div className="mb-4 p-4 border rounded-md light:border-gray-200 flex items-center justify-between">
            <span className="truncate dark:text-white">{file.name}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeselectFile}
              className="hover:bg-gray-200 dark:hover:bg-neutral-900"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Deselect file</span>
            </Button>
          </div>
        ) : (
          <Input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="mb-4 dark:bg-neutral-950 dark:text-white"
          />
        )}

        <Button className="w-full mt-3" onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </Button>

        {uploading && (
          <Progress
            value={progress}
            className="mt-2 dark:bg-neutral-900"
            color="blue"
            style={{ height: '8px' }}
          />
        )}

        {shareableLink && (
          <div className="mt-4 p-4 rounded-md bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700">
            {uploadSuccess && (
              <div className="text-green-700 dark:text-green-400 font-semibold mb-2">
                File uploaded successfully!
              </div>
            )}
            <p className="text-sm dark:text-gray-400">
              Shareable link:{" "}
              <a
                href={shareableLink}
                className="text-blue-600 underline break-all" // Added break-all to prevent overflow
                target="_blank"
                rel="noopener noreferrer" // Added noreferrer for security best practice
              >
                {shareableLink}
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}