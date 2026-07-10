'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
          <h2 className="text-4xl font-bold mb-4">Terjadi Kesalahan Fatal!</h2>
          <button onClick={() => reset()} className="px-6 py-3 bg-teal-500 rounded-lg text-slate-950 font-bold">
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
