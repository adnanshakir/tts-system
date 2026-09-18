import TtsGenerator from "@/components/TtsGenerator";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans flex flex-col items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Main Generator Component */}
      <main className="w-full max-w-3xl">
        <TtsGenerator />
      </main>
    </div>
  );
}
