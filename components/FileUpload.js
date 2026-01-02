"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { X, Copy, Check } from "lucide-react"; 

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shareableLink, setShareableLink] = useState("");
  const fileInputRef = useRef(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const progressRef = useRef(null);
  const [isCopying, setIsCopying] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setProgress(0);
      setShareableLink("");
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first!");
      return;
    }

    setUploading(true);
    setUploadSuccess(false);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentCompleted = Math.round((event.loaded * 100) / event.total);
          setProgress(percentCompleted);
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.response);
          setShareableLink(`${window.location.origin}/audio/${data.fileId}`);
          setUploadSuccess(true);
          toast.success("Upload successful!");
        } else {
          setUploadSuccess(false);
          let errorMessage = "Upload failed. Try again.";
          try {
            const errorData = JSON.parse(xhr.response);
            if (errorData && errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            console.error("Failed to parse error response:", e);
          }
          toast.error(errorMessage);
          console.error("Upload failed", xhr.status, xhr.statusText, errorMessage);
        }
      };

      xhr.onerror = () => {
        toast.error("Upload failed.  Network error.");
        setUploadSuccess(false);
        console.error("Upload failed: Network Error");
        setProgress(0);
      };

      xhr.onloadend = () => {
        setUploading(false);
      };

      xhr.send(formData);
    } catch (error) {
      toast.error("An unexpected error occurred.");
      setUploadSuccess(false);
      console.error("An unexpected error occurred:", error);
    }
  };

  const handleDeselectFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setProgress(0);
    setShareableLink("");
    setUploadSuccess(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink).then(
      () => {
        toast.success("Link copied to clipboard!");
        setIsCopying(true); // Start the animation
        setTimeout(() => setIsCopying(false), 2000); // Reset after 2 seconds
      },
      () => {
        toast.error("Failed to copy link.");
      }
    );
  };

  return (
    <Card className="max-w-md mx-auto p-6">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4 dark:text-white">
          Upload an Audio File
        </h2>

        {file ? (
          <div className="mb-4">
            <div className="p-4 border rounded-md light:border-gray-200 flex items-center justify-between">
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

            <Button
              className="w-full mt-3"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed rounded-lg p-8 mb-4 cursor-pointer flex flex-col items-center justify-center hover:border-neutral-500 dark:hover:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-900/50 hover:shadow-lg transition-all duration-200"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
            <div className="flex flex-col items-center text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="dark:text-neutral-200 mb-2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-sm font-medium dark:text-white">
                Click to upload or drag and drop
              </p>
              <p className="text-xs dark:text-neutral-200 mt-1" title="Supported formats: MP3, WAV, FLAC, OGG, AAC, M4A, WMA, OPUS">
                Supported formats: MP3, WAV, FLAC
              </p>
              <p className="text-xs dark:text-neutral-200 mt-1">
                Max size: 300MB
              </p>
            </div>
          </div>
        )}

        {uploading && (
          <div ref={progressRef}>
            <Progress
              value={progress}
              className="mt-2 dark:bg-neutral-900"
              color="blue"
              style={{ height: "8px" }}
            />
          </div>
        )}

        {shareableLink && (
          <div className="mt-4 p-4 border rounded-md">
            {uploadSuccess && (
              <div className="mb-2 text-sm flex items-center">
                File uploaded successfully!
              </div>
            )}
            <p className="text-sm dark:text-white">Shareable link:</p>
            <div className="flex items-center gap-2">
              <a
                href={shareableLink}
                className="text-blue-600 underline break-all"
                target="_blank"
                rel="noopener noreferrer"
              >
                {shareableLink}
              </a>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  // Create a temporary textarea element
                  const textarea = document.createElement("textarea");
                  textarea.value = shareableLink;
                  textarea.style.position = "fixed"; // Make it invisible
                  document.body.appendChild(textarea);
                  textarea.focus();
                  textarea.select();

                  try {
                    // Execute copy command
                    document.execCommand("copy");
                    // Handle success animation
                    setIsCopying(true);
                    setTimeout(() => setIsCopying(false), 1500);
                  } catch (err) {
                    console.error("Failed to copy: ", err);
                  } finally {
                    // Clean up
                    document.body.removeChild(textarea);
                  }
                }}
                className="dark:text-white"
                disabled={isCopying}
              >
                {isCopying ? (
                  <Check className="h-4 w-4 animate-pulse" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
