// pages/audio/[id].js
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, Download, MoreVertical, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils";
import Navbar from '@/components/Navbar'; // Import Navbar

export default function AudioPage({ fileMetadata, fileId, fileName }) {
    const audioSrc = `/api/audio/${fileId}`;
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showMetadata, setShowMetadata] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setProgress(0);
        setIsPlaying(false);
        setDuration(0);
        if (audioRef.current) {
            audioRef.current.load();
        }
    }, [audioSrc]);


    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
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
            setVolume(audioRef.current.lastVolumeValue || 1);
        }
        setIsMuted((prev) => !prev);
    };


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
        }

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("play", handlePlay);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("volumechange", handleVolumeChangeBeforeMute);


        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("play", handlePlay);
            audio.removeEventListener("pause", handlePause);
            audio.removeEventListener("volumechange", handleVolumeChangeBeforeMute);
        };
    }, [isMuted]);


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

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = audioSrc;
        link.download = fileName || 'audio_file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleMetadata = () => {
        setShowMetadata(!showMetadata);
    };


    return (
        <div className="bg-neutral-100 dark:bg-neutral-950 h-dvh">
            <Navbar />
            <main className="container mx-auto pt-16 md:pt-32">
                <Card className="max-w-xl mx-auto p-6 bg-white dark:bg-neutral-900 shadow-xl rounded-xl overflow-hidden"> {/* Added dark mode classes and styling similar to FileUpload */}
                    <CardHeader className="pb-0 pt-6 px-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-semibold tracking-tight dark:text-white">{fileMetadata.title || fileName}</h2> {/* Dark text */}
                                {fileMetadata.artist && (
                                    <p className="text-sm text-muted-foreground dark:text-neutral-400">{fileMetadata.artist}</p>
                                )}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"> {/* Dark hover */}
                                        <MoreVertical className="h-4 w-4 dark:text-white" /> {/* Dark icon */}
                                        <span className="sr-only">Open dropdown</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-neutral-800 border dark:border-neutral-700"> {/* Dark dropdown */}
                                    <DropdownMenuItem onClick={toggleMetadata} className="dark:text-white hover:bg-neutral-700 hover:text-white"> {/* Dark text and hover */}
                                        {showMetadata ? "Hide Metadata" : "Show Metadata"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDownload} className="dark:text-white hover:bg-neutral-700 hover:text-white"> {/* Dark text and hover */}
                                        Download
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        <div className="aspect-w-1 aspect-h-1 overflow-hidden rounded-lg mb-4">
                            <img
                                src={fileMetadata.albumArt || "/placeholder.jpg"}
                                alt="Album Art"
                                className="object-cover w-full h-full"
                            />
                        </div>

                        <audio ref={audioRef} src={audioSrc} preload="metadata" className="hidden" />

                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground dark:text-neutral-400">{formatTime(progress)}</span> {/* Dark text */}
                            <span className="text-sm text-muted-foreground dark:text-neutral-400">{formatTime(duration)}</span> {/* Dark text */}
                        </div>
                        <div className="group relative">
                            <Slider
                                value={[progress]}
                                max={duration}
                                step={0.1}
                                onValueChange={handleSliderChange}
                                className="mb-4"
                                thumbClassName={cn(
                                    "group-hover:block block h-4 w-4 rounded-full bg-blue-500 ring-0 transition-opacity duration-200 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-blue-600 group-hover:scale-110 dark:bg-blue-500 dark:hover:bg-blue-600", // Dark thumb
                                    "absolute top-1/2 left-0 -translate-y-1/2 -mt-2",
                                    "opacity-0 group-hover:opacity-100",
                                    "z-10" // ADDED: Ensure thumb is always on top
                                )}
                                trackClassName="relative h-1.5 w-full grow rounded-full bg-gray-500 dark:bg-neutral-700 data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5" // Dark track
                                rangeClassName="absolute h-1.5 rounded-full bg-blue-500 dark:bg-blue-500 data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5" // Dark range
                            />
                        </div>


                        <div className="flex justify-around items-center">
                            <button onClick={togglePlay} className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400"> {/* Dark button */}
                                {isPlaying ? <Pause size={24} className="dark:text-white" /> : <Play size={24} className="dark:text-white" />} {/* Dark icons */}
                            </button>
                            <div className="flex items-center space-x-2">
                                <button onClick={toggleMute} className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-full dark:text-neutral-400 dark:hover:text-neutral-200 dark:focus:ring-neutral-500"> {/* Dark mute button */}
                                    {isMuted ? <VolumeX size={20} className="dark:text-white" /> : <Volume2 size={20} className="dark:text-white" />} {/* Dark icons */}
                                </button>
                                <div className="group relative w-24 md:w-32">
                                    <Slider
                                        defaultValue={[1]}
                                        max={1}
                                        step={0.01}
                                        value={[volume]}
                                        onValueChange={handleVolumeChange}
                                        className=""
                                        thumbClassName={cn(
                                            "group-hover:block block h-3 w-3 rounded-full bg-red-700 ring-0 transition-opacity duration-200 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-gray-800 dark:bg-red-700 dark:hover:bg-neutral-200", // Dark volume thumb
                                            "absolute top-1/2 left-0 -translate-y-1/2 -mt-1.5",
                                            "opacity-0 group-hover:opacity-100",
                                            "z-10" // ADDED: Ensure thumb is always on top
                                        )}
                                        trackClassName="relative h-1 w-full grow rounded-full bg-gray-500 dark:bg-neutral-700 data-[orientation=horizontal]:h-1 data-[orientation=vertical]:w-1" // Dark volume track
                                        rangeClassName="absolute h-1 rounded-full bg-blue-500 dark:bg-blue-500 data-[orientation=horizontal]:h-1 data-[orientation=vertical]:w-1" // Dark volume range
                                    />
                                </div>
                            </div>
                        </div>


                    </CardContent>
                    {showMetadata && (
                        <CardFooter className="p-6 border-t dark:border-neutral-700 bg-white dark:bg-neutral-900"> {/* Dark footer */}
                            <details className="group w-full">
                            <summary className="flex items-center justify-between cursor-pointer list-none">
                                <span className="font-medium text-sm text-gray-600">Raw Metadata</span>
                                <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180")} />
                            </summary>
                                <div className="mt-3 group-open:animate-fadeIn">
                                    <pre className="mt-4 p-4 bg-gray-100 dark:bg-neutral-800 rounded-md text-xs overflow-x-auto text-gray-800 dark:text-neutral-200"> {/* Dark pre and text */}
                                        {JSON.stringify(fileMetadata, null, 2)}
                                    </pre>
                                </div>
                            </details>
                        </CardFooter>
                    )}
                </Card>
            </main>
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
    const { MongoClient, ObjectId } = require("mongodb");
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db();

    const files = await db
        .collection("audio.files")
        .find({ _id: new ObjectId(id)})
        .toArray();

    if (!files || files.length === 0) {
        client.close();
        return { notFound: true };
    }

    const file = files[0];
    client.close();

    return {
        props: {
            fileMetadata: file.metadata || {},
            fileId: id,
            fileName: file.filename || "Unknown File",
        },
    };
}