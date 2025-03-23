"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { X, Copy, Check } from "lucide-react"; // Import Check icon

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shareableLink, setShareableLink] = useState("");
  const fileInputRef = useRef(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const progressRef = useRef(null);
  const [isCopying, setIsCopying] = useState(false); // State for copy animation

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
          toast.error("Upload failed. Try again.");
          setUploadSuccess(false);
          console.error("Upload failed", xhr.status, xhr.statusText);
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

        <Button
          className="w-full mt-3"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload"}
        </Button>

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
              <div className="mb-2 text-sm">
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
                onClick={handleCopyLink}
                className="dark:text-white"
                disabled={isCopying} // Disable during animation
              >
                {isCopying ? (
                  <Check className="h-4 w-4 animate-pulse" /> // Animated checkmark
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