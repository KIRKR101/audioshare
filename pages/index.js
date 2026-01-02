import Navbar from "@/components/Navbar";
import FileUpload from "@/components/FileUpload";

export default function Home() {
  return (
    <div className="bg-neutral-100 dark:bg-neutral-950 min-h-dvh flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-center justify-center pb-8">
        <FileUpload />
      </main>
    </div>
  );
}
