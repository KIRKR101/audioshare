import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, Volume1, VolumeX, Download, MoreVertical, Info, Keyboard } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils";
import Navbar from '@/components/Navbar';
import MetadataDialog from '@/components/MetadataDialog';
import KeyboardShortcutsDialog from '@/components/KeyboardShortcutsDialog';
import React from 'react';


export default function AudioPage({ fileMetadata, fileId, fileName }) {
  const audioSrc = `/api/audio/${fileId}`;
  const audioRef = useRef(null);
  const playButtonRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showMetadataDialogOpen, setShowMetadataDialogOpen] = useState(false);
  const [showShortcutsDialogOpen, setShowShortcutsDialogOpen] = useState(false);
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []);

  useEffect(() => {
    setProgress(0);
    setIsPlaying(false);
    setDuration(0);
    setError(null);
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
        setError(
          "Playback failed. Please check browser settings or try again."
        );
        setIsPlaying(false);
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
          audio.currentTime = Math.max(0, audio.currentTime - 10);
          setProgress(audio.currentTime);
          break;
        case "ArrowRight":
          e.preventDefault();
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
          setProgress(audio.currentTime);
          break;
        case "ArrowUp":
          e.preventDefault();
          handleVolumeChange([Math.min(1, volume + 0.1)]);
          break;
        case "ArrowDown":
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume - 0.1)]);
          break;
        case "Home":
          e.preventDefault();
          audio.currentTime = 0;
          setProgress(0);
          break;
        case "End":
          e.preventDefault();
          audio.currentTime = audio.duration;
          setProgress(audio.duration);
          break;
        // Number keys 0-9 for percentage skipping
        case "Digit0": case "Numpad0": e.preventDefault(); audio.currentTime = 0; setProgress(0); break;
        case "Digit1": case "Numpad1": e.preventDefault(); audio.currentTime = audio.duration * 0.1; setProgress(audio.currentTime); break;
        case "Digit2": case "Numpad2": e.preventDefault(); audio.currentTime = audio.duration * 0.2; setProgress(audio.currentTime); break;
        case "Digit3": case "Numpad3": e.preventDefault(); audio.currentTime = audio.duration * 0.3; setProgress(audio.currentTime); break;
        case "Digit4": case "Numpad4": e.preventDefault(); audio.currentTime = audio.duration * 0.4; setProgress(audio.currentTime); break;
        case "Digit5": case "Numpad5": e.preventDefault(); audio.currentTime = audio.duration * 0.5; setProgress(audio.currentTime); break;
        case "Digit6": case "Numpad6": e.preventDefault(); audio.currentTime = audio.duration * 0.6; setProgress(audio.currentTime); break;
        case "Digit7": case "Numpad7": e.preventDefault(); audio.currentTime = audio.duration * 0.7; setProgress(audio.currentTime); break;
        case "Digit8": case "Numpad8": e.preventDefault(); audio.currentTime = audio.duration * 0.8; setProgress(audio.currentTime); break;
        case "Digit9": case "Numpad9": e.preventDefault(); audio.currentTime = audio.duration * 0.9; setProgress(audio.currentTime); break;
        case "Comma":
          e.preventDefault();
          audio.currentTime = Math.max(0, audio.currentTime - 1);
          setProgress(audio.currentTime);
          break;
        case "Period":
          e.preventDefault();
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 1);
          setProgress(audio.currentTime);
          break;
        case "KeyJ":
          e.preventDefault();
          audio.currentTime = Math.max(0, audio.currentTime - 5);
          setProgress(audio.currentTime);
          break;
        case "KeyL":
          e.preventDefault();
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
          setProgress(audio.currentTime);
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
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
      setError("Error loading audio. Please try again.");
      setIsPlaying(false);
      console.error("Audio playback error");
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("volumechange", handleVolumeChangeBeforeMute);
    audio.addEventListener("error", handleAudioError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("volumechange", handleVolumeChangeBeforeMute);
      audio.removeEventListener("error", handleAudioError);
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

  const openMetadataDialog = () => {
    setShowMetadataDialogOpen(true);
  };

  const closeMetadataDialog = () => {
    setShowMetadataDialogOpen(false);
  };

  const openShortcutsDialog = () => {
    setShowShortcutsDialogOpen(true);
  };

  const closeShortcutsDialog = () => {
    setShowShortcutsDialogOpen(false);
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX size={24} className="text-neutral-500 dark:text-neutral-400" />;
    }
    if (volume < 0.5) {
      return <Volume1 size={24} className="text-neutral-500 dark:text-neutral-400" />;
    }
    return <Volume2 size={24} className="text-neutral-500 dark:text-neutral-400" />;
  };

  return (
    <div className="bg-neutral-100 dark:bg-neutral-950 h-dvh flex flex-col">
      <Navbar />
      <main
        role="main"
        className="container mx-auto flex flex-grow items-center px-4 sm:px-6 lg:px-8"
      >
        <Card
          role="region"
          aria-labelledby="track-title"
          className="max-w-xl mx-auto bg-neutral-100 dark:bg-neutral-950 shadow-xl rounded-xl overflow-hidden"
        >
          <CardHeader className="pb-0 pt-6 px-6">
            <div className="flex justify-between items-center">
              <div>
                <h2
                  id="track-title"
                  className="text-2xl font-semibold dark:text-neutral-100"
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
                    <MoreVertical className="h-4 w-4 dark:text-neutral-100" />
                    <span className="sr-only">Open track options menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  role="menu"
                  aria-label="Track options"
                  className="w-40 bg-neutral-100 dark:bg-neutral-900 border dark:border-neutral-700"
                >
                  <DropdownMenuItem
                    role="menuitem"
                    onClick={openMetadataDialog}
                    className="cursor-pointer dark:text-neutral-100 hover:bg-neutral-700 hover:text-neutral-100 flex justify-between items-center"
                  >
                    Show Metadata
                    <Info className="h-4 w-4" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    role="menuitem"
                    onClick={handleDownload}
                    className="cursor-pointer dark:text-neutral-100 hover:bg-neutral-700 hover:text-neutral-100 flex justify-between items-center"
                  >
                    Download
                    <Download className="h-4 w-4" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    role="menuitem"
                    onClick={openShortcutsDialog}
                    className="cursor-pointer dark:text-neutral-100 hover:bg-neutral-700 hover:text-neutral-100 flex justify-between items-center"
                  >
                    Keyboard Shortcuts
                    <Keyboard className="h-4 w-4" />
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
            
            {/* Scrubber Controls */}
            <div className="group relative w-full mb-1">
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
                className="cursor-pointer py-1.5"
                thumbclassname={cn(
                  "block h-4 w-4 rounded-full bg-neutral-900 dark:bg-neutral-100 border-none shadow-sm transition-all duration-200",
                  "opacity-0 group-hover:opacity-100 hover:scale-125 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2"
                )}
                trackClassName="relative h-2 w-full grow rounded-full bg-neutral-200/80 dark:bg-neutral-800"
                rangeClassName="absolute h-full rounded-full bg-neutral-500/80 dark:bg-neutral-400 group-hover:bg-neutral-700 dark:group-hover:bg-neutral-200 transition-colors"
              />
            </div>
            
            {/* Time Labels */}
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-sm font-medium text-neutral-500 dark:text-neutral-400 tabular-nums"
                aria-label="Current time"
              >
                {formatTime(progress)}
              </span>
              <span
                className="text-sm font-medium text-neutral-500 dark:text-neutral-400 tabular-nums"
                aria-label="Total duration"
              >
                {formatTime(duration)}
              </span>
            </div>

            {/* Main Controls Grid */}
            <div className="grid grid-cols-3 items-center w-full">
              {/* Empty Left Spacer (Could hold Shuffle/Repeat in future) */}
              <div className="flex justify-start"></div>

              {/* Center Play Button */}
              <div className="flex justify-center">
                <Button
                  ref={playButtonRef}
                  onClick={togglePlay}
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 shadow-md hover:scale-105 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all duration-200 active:scale-95"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause size={24} fill="currentColor" className="ml-0.5" />
                  ) : (
                    <Play size={24} fill="currentColor" className="ml-1" />
                  )}
                </Button>
              </div>

              {/* Right Volume Controls */}
              <div className="flex items-center justify-end space-x-2">
                <div className="group flex items-center bg-transparent">
                    <Button
                    onClick={toggleMute}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                    {getVolumeIcon()}
                    </Button>
                    <div className="w-28 mx-1">
                    <Slider
                        aria-label="Volume"
                        aria-valuemin={0}
                        aria-valuemax={1}
                        aria-valuenow={volume}
                        aria-valuetext={`${Math.round(volume * 100)}%`}
                        max={1}
                        step={0.01}
                        value={[volume]}
                        onValueChange={handleVolumeChange}
                        className="cursor-pointer"
                        thumbclassname={cn(
                          "block h-3 w-3 rounded-full bg-neutral-900 dark:bg-neutral-100 border-none shadow-sm transition-all duration-200",
                          "opacity-0 group-hover:opacity-100 hover:scale-125 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2"
                        )}
                        trackClassName="relative h-1.5 w-full grow rounded-full bg-neutral-200 dark:bg-neutral-800"
                        rangeClassName="absolute h-full rounded-full bg-neutral-500/80 dark:bg-neutral-400 group-hover:bg-neutral-700 dark:group-hover:bg-neutral-200 transition-colors"
                    />
                    </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <MetadataDialog
        isOpen={showMetadataDialogOpen}
        onClose={closeMetadataDialog}
        fileMetadata={fileMetadata}
        fileName={fileName}
      />
      <KeyboardShortcutsDialog
        isOpen={showShortcutsDialogOpen}
        onClose={closeShortcutsDialog}
      />
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
