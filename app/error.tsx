'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
      <h2 className="text-4xl font-bold mb-4">Terjadi Kesalahan!</h2>
      <p className="text-slate-400 mb-8">{error.message || 'Terjadi kesalahan sistem.'}</p>
      <button onClick={() => reset()} className="px-6 py-3 bg-teal-500 rounded-lg text-slate-950 font-bold">
        Coba Lagi
      </button>
    </div>
  );
}
