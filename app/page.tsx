import Link from "next/link";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      <div className="z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center">
        
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="bg-[#00A8A8] p-4 rounded-xl shadow-lg border border-[#00A8A8]/20 text-white">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-800 mb-4">
          SIKLIN<span className="text-[#00A8A8]">-RS</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-3xl mb-12">
          Sistem Informasi Indikator Kesehatan Lingkungan Rumah Sakit
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/login"
            className="flex items-center justify-center px-8 py-4 text-base font-bold uppercase tracking-wider rounded-lg bg-[#00A8A8] text-white hover:bg-[#008f8f] transition-all shadow-md"
          >
            Masuk Aplikasi
          </Link>
          <a
            href="#tentang"
            className="flex items-center justify-center px-8 py-4 text-base font-bold uppercase tracking-wider rounded-lg bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
          >
            Tentang Aplikasi
          </a>
        </div>
      </div>

      <div className="absolute bottom-6 w-full text-center text-gray-400 text-[10px] uppercase font-bold tracking-widest">
        &copy; {new Date().getFullYear()} RSUD Al-Mulk - SIKLIN-RS
      </div>
    </div>
  );
}
