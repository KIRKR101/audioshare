import React from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
  return (
    <div className="bg-neutral-100 dark:bg-neutral-950 h-dvh">
      <Navbar />
      <main className="container mx-auto pt-16 md:pt-32 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-8 dark:text-white">
          Frequently Asked Questions
        </h1>
        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="dark:text-white">
                What is AudioShare?
              </AccordionTrigger>
              <AccordionContent className="dark:text-neutral-300">
                AudioShare is a platform designed for sharing and managing audio
                files. You can upload, store, and share audio content.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="dark:text-white">
                How do I upload audio files?
              </AccordionTrigger>
              <AccordionContent className="dark:text-neutral-300">
                To upload audio files, navigate to the upload section and select
                the audio files from your device. The platform supports various
                audio formats.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="dark:text-white">
                Is there a limit to file size?
              </AccordionTrigger>
              <AccordionContent className="dark:text-neutral-300">
                Currently, there is a file size limit of 300MB per audio file.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="dark:text-white">
                Can I download my uploaded files?
              </AccordionTrigger>
              <AccordionContent className="dark:text-neutral-300">
                Yes, you can download any audio files that have been uploaded,
                either via{" "}
                <Link href="/audio_files.txt" passHref legacyBehavior>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                  >
                    'audio_files.txt'
                  </a>
                </Link>{" "}
                or the{" "}
                <Link href="/archive" passHref legacyBehavior>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                  >
                    archive
                  </a>
                </Link>{" "}
                section where you can search and sort.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="dark:text-white">
                What audio formats are supported?
              </AccordionTrigger>
              <AccordionContent className="dark:text-neutral-300">
                Currently: mpeg, mp3, wav, flac, ogg, aac, and m4a.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
    </div>
  );
}
