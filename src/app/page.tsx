import TtsGenerator from "@/components/TtsGenerator";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans flex flex-col items-center px-4 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-3 md:px-8 md:pt-6 md:pb-3">
      {/* Main Generator Component */}
      <main className="w-full max-w-3xl flex-1 flex flex-col">
        <TtsGenerator />
      </main>
    </div>
  );
}

