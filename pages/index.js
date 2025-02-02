import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';

export default function Home() {
  return (
    <div className="bg-neutral-100 dark:bg-neutral-950 h-dvh">
      <Navbar />
      <main className="container mx-auto bg-neutral-100 dark:bg-neutral-950 pt-64">
        <FileUpload/>
      </main>
    </div>
  );
}