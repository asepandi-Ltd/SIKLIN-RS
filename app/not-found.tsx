
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
      <h2 className="text-4xl font-bold mb-4">404 - Not Found</h2>
      <p className="text-slate-400 mb-8">Halaman tidak ditemukan.</p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="px-6 py-3 bg-teal-500 rounded-lg text-slate-950 font-bold">
        Kembali ke Beranda
      </a>
    </div>
  );
}
