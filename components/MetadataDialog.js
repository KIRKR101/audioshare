import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Download } from 'lucide-react';

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

// Reusable MetadataRow Component
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

export default function MetadataDialog({ isOpen, onClose, fileMetadata, fileName }) {
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

    // Handle ESC key to close dialog
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-modal="true"
            role="dialog"
        >
            {/* Background Overlay */}
            <div
                className="fixed inset-0 bg-black/50 dark:bg-neutral-900/80 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <div className="relative flex items-center justify-center min-h-screen p-4">
                {/* Dialog Panel */}
                <div className="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl overflow-hidden max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] w-full border dark:border-neutral-700">
                    <div className="px-6 py-6 flex justify-between items-center">
                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                            Metadata
                        </div>
                        <Button variant="ghost" onClick={onClose} size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
                            <X className="h-5 w-5 dark:text-white" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </div>
                    <ScrollArea className="h-[70vh] w-full rounded-md px-4">
                        <div className="pb-4">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-xs md:text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
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
    );
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${secs}`;
}
