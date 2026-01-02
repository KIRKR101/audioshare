"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { X, Copy, Check, Music, Upload, ExternalLink } from "lucide-react";
import { parseBlob } from "music-metadata";

export default function FileUpload() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [shareableLink, setShareableLink] = useState("");
    const fileInputRef = useRef(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const progressRef = useRef(null);
    const [isCopying, setIsCopying] = useState(false);
    const [metadata, setMetadata] = useState(null);
    const [albumArtUrl, setAlbumArtUrl] = useState(null);
    const [loadingMetadata, setLoadingMetadata] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    useEffect(() => {
        return () => {
            if (albumArtUrl) {
                URL.revokeObjectURL(albumArtUrl);
            }
        };
    }, [albumArtUrl]);

    const extractMetadata = async (file) => {
        setLoadingMetadata(true);
        try {
            const parsedMetadata = await parseBlob(file);
            const title =
                parsedMetadata.common.title ||
                file.name.replace(/\.[^/.]+$/, "");
            const artist = parsedMetadata.common.artist || "Unknown Artist";
            const albumArt =
                parsedMetadata.common.picture &&
                parsedMetadata.common.picture.length > 0
                    ? URL.createObjectURL(
                          new Blob([parsedMetadata.common.picture[0].data], {
                              type: parsedMetadata.common.picture[0].format,
                          })
                      )
                    : null;
            setMetadata({ title, artist });
            setAlbumArtUrl(albumArt);
        } catch (error) {
            console.error("Error extracting metadata:", error);
            setMetadata({
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: "Unknown Artist",
            });
            setAlbumArtUrl(null);
        } finally {
            setLoadingMetadata(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setProgress(0);
            setShareableLink("");
            setUploadSuccess(false);
            extractMetadata(selectedFile);
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith("audio/")) {
            setFile(droppedFile);
            setProgress(0);
            setShareableLink("");
            setUploadSuccess(false);
            extractMetadata(droppedFile);
        } else {
            toast.error("Please drop an audio file.");
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
                    const percentCompleted = Math.round(
                        (event.loaded * 100) / event.total
                    );
                    setProgress(percentCompleted);
                }
            };

            xhr.onload = async () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const data = JSON.parse(xhr.response);
                    setShareableLink(
                        `${window.location.origin}/audio/${data.fileId}`
                    );
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
                    console.error(
                        "Upload failed",
                        xhr.status,
                        xhr.statusText,
                        errorMessage
                    );
                }
            };

            xhr.onerror = () => {
                toast.error("Upload failed. Network error.");
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
        setMetadata(null);
        setAlbumArtUrl(null);
    };

    const handleCopyLink = () => {
        const textarea = document.createElement("textarea");
        textarea.value = shareableLink;
        textarea.style.position = "fixed";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            document.execCommand("copy");
            toast.success("Link copied to clipboard!");
            setIsCopying(true);
            setTimeout(() => setIsCopying(false), 1500);
        } catch (err) {
            console.error("Failed to copy: ", err);
            toast.error("Failed to copy link.");
        } finally {
            document.body.removeChild(textarea);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-lg">
            <CardContent className="p-6 sm:p-8">
                <div className="mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold dark:text-white mb-2">
                        Upload Audio File
                    </h2>
                </div>

                {file ? (
                    <div className="space-y-4">
                        <div className="p-5 border rounded-lg border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 transition-all">
                            <div className="flex items-start gap-4">
                                {loadingMetadata ? (
                                    <div className="w-20 h-20 bg-neutral-300 dark:bg-neutral-700 rounded animate-pulse flex-shrink-0" />
                                ) : albumArtUrl ? (
                                    <img
                                        src={albumArtUrl}
                                        alt="Album Art"
                                        className="w-20 h-20 rounded object-cover flex-shrink-0 shadow-md"
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-gradient-to-br from-neutral-400 to-neutral-600 dark:from-neutral-600 dark:to-neutral-800 rounded flex items-center justify-center flex-shrink-0 shadow-md">
                                        <Music className="w-10 h-10 text-white" />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    {loadingMetadata ? (
                                        <div className="space-y-2">
                                            <div className="h-5 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4 animate-pulse" />
                                            <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-1/2 animate-pulse" />
                                            <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-1/4 animate-pulse" />
                                        </div>
                                    ) : (
                                        <>
                                            <p className="font-semibold text-lg dark:text-white truncate mb-1">
                                                {metadata?.title}
                                            </p>
                                            <p className="text-lg text-neutral-600 dark:text-neutral-400 truncate mb-1">
                                                {metadata?.artist}
                                            </p>
                                            <p className="text-base text-neutral-500 dark:text-neutral-500">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </>
                                    )}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleDeselectFile}
                                    className="hover:bg-neutral-200 dark:hover:bg-neutral-800 flex-shrink-0"
                                    disabled={uploading}
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">
                                        Deselect file
                                    </span>
                                </Button>
                            </div>
                        </div>

                        {uploading && (
                            <div className="space-y-2" ref={progressRef}>
                                <div className="flex justify-between text-base text-neutral-600 dark:text-neutral-400">
                                    <span>Uploading...</span>
                                    <span>{progress}%</span>
                                </div>
                                <Progress
                                    value={progress}
                                    className="h-2 dark:bg-neutral-900"
                                />
                            </div>
                        )}

                        {!shareableLink && (
                            <Button
                                className="w-full h-11 text-base font-medium"
                                onClick={handleUpload}
                                disabled={uploading || loadingMetadata}
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Uploading... {progress}%
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload File
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                ) : (
                    <div
                        className={`border border-dashed rounded-xl p-12 cursor-pointer flex flex-col items-center justify-center transition-all duration-200 ${
                            isDragging
                                ? "border-neutral-400 bg-neutral-100 dark:bg-neutral-800/30 scale-[1.02]"
                                : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-900/30"
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className="hidden"
                        />
                        <div className="flex flex-col items-center text-center">
                            <div
                                className="mb-4 p-4"
                            >
                                <Upload
                                    className={`w-10 h-10 transition-colors ${
                                        isDragging
                                            ? "text-neutral-600 dark:text-neutral-400"
                                            : "text-neutral-600 dark:text-neutral-400"
                                    }`}
                                />
                            </div>
                            <p className="text-lg font-semibold dark:text-white mb-2">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-base text-neutral-600 dark:text-neutral-400 mb-1">
                                Supports MP3, WAV, FLAC, OGG, AAC, M4A, WMA,
                                OPUS
                            </p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-500">
                                Maximum file size: 300MB
                            </p>
                        </div>
                    </div>
                )}

                {shareableLink && (
                    <div className="mt-6 p-5 border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg space-y-3">
                        <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                            <Check className="w-5 h-5" />
                            <p className="font-semibold text-base">Upload successful!</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">
                                Shareable link:
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 min-w-0 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                    <a
                                        href={shareableLink}
                                        className="text-base text-blue-600 dark:text-blue-400 hover:underline break-all flex items-center gap-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {shareableLink}
                                        <ExternalLink className="w-3 h-3 flex-shrink-0 inline" />
                                    </a>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopyLink}
                                    className="dark:text-white h-12 w-12 flex-shrink-0"
                                    disabled={isCopying}
                                >
                                    {isCopying ? (
                                        <Check className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">Copy link</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
