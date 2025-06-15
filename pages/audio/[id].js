import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, Download, MoreVertical, X } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils";
import Navbar from '@/components/Navbar';
import { ScrollArea } from "@/components/ui/scroll-area";
import React from 'react';


// Helper function for getting metadata value or "Unknown"
const getMetadataValue = (value, unknownText = 'Unknown') => {
    if (value == null || value === undefined || value === "") { // Handle null, undefined, and empty string
        return unknownText;
    }
    if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : unknownText; // Handle empty arrays
    }
    return String(value); // Ensure value is converted to String for display
};


// Reusable MetadataRow Component (within the same file)
function MetadataRow({ category, property, value, isCategoryRow = false }) {
    if (!isCategoryRow && getMetadataValue(value) === 'Unknown') {
        return null; // Don't render if value is "Unknown" and not a category row
    }

    return (
        <tr className={`border-b dark:border-neutral-700 ${isCategoryRow ? 'bg-gray-50 dark:bg-neutral-800' : ''}`}>
            {isCategoryRow ? (
                <td className="py-2 px-3 font-medium text-gray-700 dark:text-white" colSpan="3">{category}</td>
            ) : (
                <>
                    <td className="py-2 px-3">{category}</td>
                    <td className="py-2 px-3 font-medium text-gray-600 dark:text-neutral-300">{property}</td>
                    <td className="py-2 px-3 text-gray-500 dark:text-neutral-200">{getMetadataValue(value)}</td>
                </>
            )}
        </tr>
    );
}


export default function AudioPage({ fileMetadata, fileId, fileName }) {
  const audioSrc = `/api/audio/${fileId}`;
  const audioRef = useRef(null);
  const playButtonRef = useRef(null); // Ref for the play button (still keeping it for potential focus attempt)
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showMetadataDialogOpen, setShowMetadataDialogOpen] = useState(false);
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set initial volume when the component mounts
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    setProgress(0);
    setIsPlaying(false);
    setDuration(0);
    setError(null); // Reset error on new audio source
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [audioSrc]);

  // Keyboard controls
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => {
        // Catch play promise errors (e.g., browser policy)
        setError(
          "Playback failed. Please check browser settings or try again."
        );
        setIsPlaying(false); // Ensure state reflects pause
        console.error("Playback error:", e);
      });
    }
    setIsPlaying((prev) => !prev);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (!isMuted) {
      audioRef.current.muted = true;
      setVolume(0);
    } else {
      audioRef.current.muted = false;
      setVolume(audioRef.current.lastVolumeValue ?? 0.5);
    }
    setIsMuted((prev) => !prev);
  };

  const handleSliderChange = (value) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const handleVolumeChange = (value) => {
    if (audioRef.current) {
      audioRef.current.volume = value[0];
      setVolume(value[0]);
      if (value[0] === 0) {
        setIsMuted(true);
      } else {
        setIsMuted(false);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent keyboard shortcuts when user is typing in input fields
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;

        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;

        case "ArrowLeft":
          e.preventDefault();
          // Skip backward 10 seconds
          audio.currentTime = Math.max(0, audio.currentTime - 10);
          setProgress(audio.currentTime);
          break;

        case "ArrowRight":
          e.preventDefault();
          // Skip forward 10 seconds
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
          setProgress(audio.currentTime);
          break;

        case "ArrowUp":
          e.preventDefault();
          // Increase volume by 0.1 (10%)
          handleVolumeChange([Math.min(1, volume + 0.1)]);
          break;

        case "ArrowDown":
          e.preventDefault();
          // Decrease volume by 0.1 (10%)
          handleVolumeChange([Math.max(0, volume - 0.1)]);
          break;

        case "Home":
          e.preventDefault();
          // Go to beginning
          audio.currentTime = 0;
          setProgress(0);
          break;

        case "End":
          e.preventDefault();
          // Go to end
          audio.currentTime = audio.duration;
          setProgress(audio.duration);
          break;

        case "Digit0":
        case "Numpad0":
          e.preventDefault();
          // Go to beginning (0%)
          audio.currentTime = 0;
          setProgress(0);
          break;

        case "Digit1":
        case "Numpad1":
          e.preventDefault();
          // Go to 10%
          audio.currentTime = audio.duration * 0.1;
          setProgress(audio.currentTime);
          break;

        case "Digit2":
        case "Numpad2":
          e.preventDefault();
          // Go to 20%
          audio.currentTime = audio.duration * 0.2;
          setProgress(audio.currentTime);
          break;

        case "Digit3":
        case "Numpad3":
          e.preventDefault();
          // Go to 30%
          audio.currentTime = audio.duration * 0.3;
          setProgress(audio.currentTime);
          break;

        case "Digit4":
        case "Numpad4":
          e.preventDefault();
          // Go to 40%
          audio.currentTime = audio.duration * 0.4;
          setProgress(audio.currentTime);
          break;

        case "Digit5":
        case "Numpad5":
          e.preventDefault();
          // Go to 50%
          audio.currentTime = audio.duration * 0.5;
          setProgress(audio.currentTime);
          break;

        case "Digit6":
        case "Numpad6":
          e.preventDefault();
          // Go to 60%
          audio.currentTime = audio.duration * 0.6;
          setProgress(audio.currentTime);
          break;

        case "Digit7":
        case "Numpad7":
          e.preventDefault();
          // Go to 70%
          audio.currentTime = audio.duration * 0.7;
          setProgress(audio.currentTime);
          break;

        case "Digit8":
        case "Numpad8":
          e.preventDefault();
          // Go to 80%
          audio.currentTime = audio.duration * 0.8;
          setProgress(audio.currentTime);
          break;

        case "Digit9":
        case "Numpad9":
          e.preventDefault();
          // Go to 90%
          audio.currentTime = audio.duration * 0.9;
          setProgress(audio.currentTime);
          break;

        case "Comma":
          e.preventDefault();
          // Frame backward (1 second)
          audio.currentTime = Math.max(0, audio.currentTime - 1);
          setProgress(audio.currentTime);
          break;

        case "Period":
          e.preventDefault();
          // Frame forward (1 second)
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 1);
          setProgress(audio.currentTime);
          break;

        case "KeyJ":
          e.preventDefault();
          // Skip backward 5 seconds
          audio.currentTime = Math.max(0, audio.currentTime - 5);
          setProgress(audio.currentTime);
          break;

        case "KeyL":
          e.preventDefault();
          // Skip forward 5 seconds
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
          setProgress(audio.currentTime);
          break;

        default:
          break;
      }
    };

    // Add event listener to document
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlaying, volume, isMuted, togglePlay, toggleMute, handleVolumeChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChangeBeforeMute = () => {
      if (!isMuted) {
        audio.lastVolumeValue = audio.volume;
      }
    };
    const handleAudioError = () => {
      // Handle audio loading/playback errors
      setError("Error loading audio. Please try again.");
      setIsPlaying(false); // Stop playing if error occurs
      console.error("Audio playback error");
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("volumechange", handleVolumeChangeBeforeMute);
    audio.addEventListener("error", handleAudioError); // Add error listener

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("volumechange", handleVolumeChangeBeforeMute);
      audio.removeEventListener("error", handleAudioError); // Remove error listener on cleanup
    };
  }, [isMuted]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = audioSrc;
    link.download = fileName || "audio_file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadMetadata = () => {
    const metadataJson = JSON.stringify(fileMetadata, null, 2);
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(metadataJson);
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `${fileName.replace(/\.[^/.]+$/, "") || "audio_metadata"}.json`
    ); // Remove extension from fileName for metadata file
    document.body.appendChild(downloadAnchorNode); // Required for Firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const openMetadataDialog = () => {
    setShowMetadataDialogOpen(true);
  };

  const closeMetadataDialog = () => {
    setShowMetadataDialogOpen(false);
    document.body.focus(); // Basic focus reset to body
  };

  return (
    <div className="bg-neutral-100 dark:bg-neutral-950 h-dvh">
      <Navbar />
      <main
        role="main"
        className="container mx-auto pt-16 md:pt-32 px-4 sm:px-6 lg:px-8"
      >
        <Card
          role="region"
          aria-labelledby="track-title"
          className="max-w-xl mx-auto bg-white dark:bg-neutral-950 shadow-xl rounded-xl overflow-hidden"
        >
          <CardHeader className="pb-0 pt-6 px-6">
            <div className="flex justify-between items-center">
              <div>
                <h2
                  id="track-title"
                  className="text-2xl font-semibold dark:text-white"
                >
                  {fileMetadata.common?.title || fileName}
                </h2>
                {fileMetadata.common?.artist && (
                  <p className="text-sm text-muted-foreground dark:text-neutral-400">
                    {fileMetadata.common.artist}
                  </p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    aria-label="Track options"
                    aria-haspopup="true"
                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
                  >
                    <MoreVertical className="h-4 w-4 dark:text-white" />
                    <span className="sr-only">Open track options menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  role="menu"
                  aria-label="Track options"
                  className="w-40 bg-white dark:bg-neutral-900 border dark:border-neutral-700"
                >
                  <DropdownMenuItem
                    role="menuitem"
                    onClick={openMetadataDialog}
                    className="cursor-pointer dark:text-white hover:bg-neutral-700 hover:text-white"
                  >
                    Show Metadata
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    role="menuitem"
                    onClick={handleDownload}
                    className="cursor-pointer dark:text-white hover:bg-neutral-700 hover:text-white"
                  >
                    Download
                    <Download className="h-4 w-4" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="aspect-w-1 aspect-h-1 overflow-hidden rounded-lg mb-4">
              <img
                src={
                  fileMetadata.albumArt
                    ? `/api${fileMetadata.albumArt}`
                    : "/album-art/placeholder.png"
                }
                alt={
                  fileMetadata.common?.title
                    ? `Album art for ${fileMetadata.common.title}${
                        fileMetadata.common?.artist
                          ? ` by ${fileMetadata.common.artist}`
                          : ""
                      }`
                    : `Album art for ${fileName}`
                }
                className="object-cover w-full h-full"
                onError={(e) => {
                  if (e.target.src !== "/album-art/placeholder.png") {
                    e.target.onerror = null;
                    e.target.src = "/album-art/placeholder.png";
                    e.target.alt = "Placeholder album art";
                  }
                }}
              />
            </div>
            <audio
              ref={audioRef}
              src={audioSrc}
              preload="metadata"
              className="hidden"
              onError={() => setError("Error loading audio.")}
              aria-hidden="true"
            />{" "}
            {error && (
              <p role="alert" className="text-red-500 mb-2">
                {error}
              </p>
            )}{" "}
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-sm text-muted-foreground dark:text-neutral-400"
                aria-label="Current time"
              >
                {formatTime(progress)}
              </span>
              <span
                className="text-sm text-muted-foreground dark:text-neutral-400"
                aria-label="Total duration"
              >
                {formatTime(duration)}
              </span>
            </div>
            <div className="group relative cursor-pointer">
              <Slider
                aria-label="Seek track"
                aria-valuemin={0}
                aria-valuemax={duration || 0}
                aria-valuenow={progress || 0}
                aria-valuetext={`Current time ${formatTime(progress)}`}
                value={[progress]}
                max={duration}
                step={0.1}
                onValueChange={handleSliderChange}
                className="mb-4"
                thumbclassname={cn(
                  "group-hover:block block h-4 w-4 rounded-full bg-blue-500 ring-0 transition-opacity duration-200 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-blue-600 group-hover:scale-110 dark:bg-blue-500 dark:hover:bg-blue-600",
                  "absolute top-1/2 left-0 -translate-y-1/2 -mt-2",
                  "opacity-0 group-hover:opacity-100",
                  "z-10"
                )}
                trackClassName="relative h-1.5 w-full grow rounded-full bg-gray-500 dark:bg-neutral-700 data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5"
                rangeClassName="absolute h-1.5 rounded-full bg-blue-500 dark:bg-blue-500 data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5"
              />
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-x-8 px-4 pt-2">
              {/* Left spacer element */}
              <div></div>

              <Button
                ref={playButtonRef}
                onClick={togglePlay}
                variant="secondary"
                size="icon"
                className="rounded-full"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause
                    size={24}
                    className="dark:text-white"
                    aria-hidden="true"
                  />
                ) : (
                  <Play
                    size={24}
                    className="dark:text-white"
                    aria-hidden="true"
                  />
                )}
              </Button>

              <div className="flex items-center space-x-2 justify-self-start">
                <Button
                  onClick={toggleMute}
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX
                      size={20}
                      className="dark:text-white"
                      aria-hidden="true"
                    />
                  ) : (
                    <Volume2
                      size={20}
                      className="dark:text-white"
                      aria-hidden="true"
                    />
                  )}
                </Button>
                <div className="group relative w-24 md:w-32 cursor-pointer">
                  <Slider
                    aria-label="Volume"
                    aria-valuemin={0}
                    aria-valuemax={1}
                    aria-valuenow={volume}
                    aria-valuetext={`${Math.round(volume * 100)}%`}
                    defaultValue={[0.5]}
                    max={1}
                    step={0.01}
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                    className=""
                    thumbclassname={cn(
                      "group-hover:block block h-3 w-3 rounded-full bg-red-700 ring-0 transition-opacity duration-200 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-gray-800 dark:bg-red-700 dark:hover:bg-neutral-200",
                      "absolute top-1/2 left-0 -translate-y-1/2 -mt-1.5",
                      "opacity-0 group-hover:opacity-100",
                      "z-10"
                    )}
                    trackClassName="relative h-1 w-full grow rounded-full bg-gray-500 dark:bg-neutral-700 data-[orientation=horizontal]:h-1 data-[orientation=vertical]:w-1"
                    rangeClassName="absolute h-1 rounded-full bg-blue-500 dark:bg-blue-500 data-[orientation=horizontal]:h-1 data-[orientation=vertical]:w-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Dialog Implementation */}
      {showMetadataDialogOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-modal="true"
          role="dialog"
        >
          {/* Background Overlay */}
          <div
            className="fixed inset-0 bg-black/50 dark:bg-neutral-900/80 backdrop-blur-[2px] transition-opacity"
            onClick={closeMetadataDialog}
            aria-hidden="true"
          ></div>
          <div className="relative flex items-center justify-center min-h-screen p-4">
            {/* Dialog Panel */}
            <div className="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl overflow-hidden max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] w-full border dark:border-neutral-700">
              <div className="px-6 py-6 flex justify-between items-center">
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  Metadata
                </div>
                <Button variant="secondary" onClick={closeMetadataDialog}>
                  Close
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="h-[70vh] w-full rounded-md px-4">
                <div className="pb-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs md:text-sm">
                      <tbody>
                        {/* === Basic Information === */}
                        <MetadataRow category="Basic" isCategoryRow />
                        {fileMetadata.common?.title && (
                          <MetadataRow
                            category=""
                            property="Filename"
                            value={fileMetadata.originalName}
                          />
                        )}
                        {fileMetadata.common?.title && (
                          <MetadataRow
                            category=""
                            property="Title"
                            value={fileMetadata.common.title}
                          />
                        )}
                        {fileMetadata.common?.artist && (
                          <MetadataRow
                            category=""
                            property="Artist"
                            value={fileMetadata.common.artist}
                          />
                        )}
                        {fileMetadata.common?.album && (
                          <MetadataRow
                            category=""
                            property="Album"
                            value={fileMetadata.common.album}
                          />
                        )}
                        {fileMetadata.common?.year && (
                          <MetadataRow
                            category=""
                            property="Year"
                            value={fileMetadata.common.year}
                          />
                        )}
                        {fileMetadata.common?.genre && (
                          <MetadataRow
                            category=""
                            property="Genre"
                            value={fileMetadata.common.genre}
                          />
                        )}
                        {fileMetadata.common?.comment && (
                          <MetadataRow
                            category=""
                            property="Comment"
                            value={fileMetadata.common.comment}
                          />
                        )}
                        {fileMetadata.common?.disk?.no && (
                          <MetadataRow
                            category=""
                            property="Disc"
                            value={fileMetadata.common.disk.no}
                          />
                        )}
                        {fileMetadata.common?.disk?.total && (
                          <MetadataRow
                            category=""
                            property="Total Discs"
                            value={fileMetadata.common.disk.total}
                          />
                        )}
                        {fileMetadata.common?.track?.no && (
                          <MetadataRow
                            category=""
                            property="Track Number"
                            value={fileMetadata.common.track.no}
                          />
                        )}
                        {fileMetadata.common?.track?.total && (
                          <MetadataRow
                            category=""
                            property="Total Tracks"
                            value={fileMetadata.common.track.total}
                          />
                        )}
                        {fileMetadata.common?.composer && (
                          <MetadataRow
                            category=""
                            property="Composer"
                            value={fileMetadata.common.composer}
                          />
                        )}
                        {fileMetadata.common?.lyrics && (
                          <MetadataRow
                            category=""
                            property="Lyrics"
                            value={fileMetadata.common.lyrics}
                          />
                        )}
                        {fileMetadata.common?.encoder && (
                          <MetadataRow
                            category=""
                            property="Encoder"
                            value={fileMetadata.common.encoder}
                          />
                        )}
                        {fileMetadata.format?.container && (
                          <MetadataRow
                            category=""
                            property="Container Format"
                            value={fileMetadata.format.container}
                          />
                        )}
                        {fileMetadata.format?.codec && (
                          <MetadataRow
                            category=""
                            property="Codec"
                            value={fileMetadata.format.codec}
                          />
                        )}
                        {
                          <MetadataRow
                            category=""
                            property="Lossless"
                            value={fileMetadata.format?.lossless ? "Yes" : "No"}
                          />
                        }{" "}
                        {/* Lossless is boolean, always show */}
                        {fileMetadata.format?.bitrate && (
                          <MetadataRow
                            category=""
                            property="Bitrate"
                            value={`${(
                              fileMetadata.format.bitrate / 1000
                            ).toFixed(0)} kbps`}
                          />
                        )}
                        {fileMetadata.format?.sampleRate && (
                          <MetadataRow
                            category=""
                            property="Sample Rate"
                            value={`${(
                              fileMetadata.format.sampleRate / 1000
                            ).toFixed(0)} kHz`}
                          />
                        )}
                        {fileMetadata.format?.channels && (
                          <MetadataRow
                            category=""
                            property="Channels"
                            value={fileMetadata.format.channels}
                          />
                        )}
                        {fileMetadata.format?.bitsPerSample && (
                          <MetadataRow
                            category=""
                            property="Bits per Sample"
                            value={fileMetadata.format.bitsPerSample}
                          />
                        )}
                        {fileMetadata.format?.duration && (
                          <MetadataRow
                            category=""
                            property="Duration"
                            value={`${formatTime(
                              fileMetadata.format.duration
                            )}`}
                          />
                        )}
                        {fileMetadata.format?.bitrateMode && (
                          <MetadataRow
                            category=""
                            property="Bitrate Mode"
                            value={fileMetadata.format.bitrateMode}
                          />
                        )}
                        {fileMetadata.format?.channelLayout && (
                          <MetadataRow
                            category=""
                            property="Channel Layout"
                            value={fileMetadata.format.channelLayout}
                          />
                        )}
                        {fileMetadata.format?.sampleRatePrecision && (
                          <MetadataRow
                            category=""
                            property="Sample Rate Precision"
                            value={fileMetadata.format.sampleRatePrecision}
                          />
                        )}
                        {fileMetadata.format?.numberOfChannels && (
                          <MetadataRow
                            category=""
                            property="Number of Channels"
                            value={fileMetadata.format.numberOfChannels}
                          />
                        )}
                        {fileMetadata.format?.samplesPerSecond && (
                          <MetadataRow
                            category=""
                            property="Samples per Second"
                            value={fileMetadata.format.samplesPerSecond}
                          />
                        )}
                        {fileMetadata.format?.bitsPerChannel && (
                          <MetadataRow
                            category=""
                            property="Bits per Channel"
                            value={fileMetadata.format.bitsPerChannel}
                          />
                        )}
                        {fileMetadata.format?.encoding && (
                          <MetadataRow
                            category=""
                            property="Encoding"
                            value={fileMetadata.format.encoding}
                          />
                        )}
                        {fileMetadata.format?.sampleRateRatio && (
                          <MetadataRow
                            category=""
                            property="Sample Rate Ratio"
                            value={fileMetadata.format.sampleRateRatio}
                          />
                        )}
                        {/* === Native Metadata === */}
                        <MetadataRow category="Native" isCategoryRow />
                        {fileMetadata.native &&
                          Object.keys(fileMetadata.native).map((formatKey) => (
                            <React.Fragment key={formatKey}>
                              {fileMetadata.native[formatKey].map(
                                (tag, index) => (
                                  <MetadataRow
                                    key={`${formatKey}-${index}`}
                                    category=""
                                    property={
                                      tag.id || tag.name || `Tag ${index + 1}`
                                    } // Use tag.id for ID3, tag.name for Vorbis, fallback to index
                                    value={tag.value}
                                  />
                                )
                              )}
                            </React.Fragment>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ScrollArea>
              <div className="px-6 py-4 border-t dark:border-neutral-700 flex justify-end">
                <Button variant="secondary" onClick={downloadMetadata}>
                  Download JSON
                  <Download className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${secs}`;
}


export async function getServerSideProps({ params }) {
    const { id } = params;
    const fs = require('fs');
    const path = require('path');

    const audioFileDir = path.join(process.cwd(), 'public', 'audio');
    const metadataFilePath = path.join(audioFileDir, `${id}.metadata.json`);

    let fileMetadata = {};
    let fileName = "Unknown File";
    try {
        const metadataContent = fs.readFileSync(metadataFilePath, 'utf-8');
        fileMetadata = JSON.parse(metadataContent);
        fileName = fileMetadata.originalName || "Unknown File";
    } catch (error) {
        console.error("Error reading metadata:", error);
        return { notFound: true };
    }


    return {
        props: {
            fileMetadata: fileMetadata,
            fileId: id,
            fileName: fileName,
        },
    };
}
