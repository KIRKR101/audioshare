import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from 'lucide-react';

const shortcuts = [
  { key: "Space", description: "Play/Pause" },
  { key: "M", description: "Mute/Unmute" },
  { key: "←", description: "Seek backward 10 seconds" },
  { key: "→", description: "Seek forward 10 seconds" },
  { key: "↑", description: "Increase volume 10%" },
  { key: "↓", description: "Decrease volume 10%" },
  { key: "Home", description: "Go to beginning" },
  { key: "End", description: "Go to end" },
  { key: "0-9", description: "Seek to 0%-90%" },
  { key: ",", description: "Frame backward (1 second)" },
  { key: ".", description: "Frame forward (1 second)" },
  { key: "J", description: "Skip backward 5 seconds" },
  { key: "L", description: "Skip forward 5 seconds" },
];

export default function KeyboardShortcutsDialog({ isOpen, onClose }) {
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
        <div className="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl overflow-hidden max-w-[90%] md:max-w-[425px] w-full border dark:border-neutral-700">
          <div className="px-6 py-6 flex justify-between items-center">
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </div>
            <Button variant="ghost" onClick={onClose} size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
              <X className="h-5 w-5 dark:text-white" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <ScrollArea className="max-h-[60vh] w-full px-6 pb-6">
            <div className="space-y-4">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    {shortcut.description}
                  </span>
                  <kbd className="px-2 py-1.5 text-xs font-semibold text-neutral-800 bg-neutral-100 border border-neutral-200 rounded-lg dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
