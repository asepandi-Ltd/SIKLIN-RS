"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  ShieldCheck, 
  Layers, 
  Activity, 
  TrendingUp, 
  FileText, 
  Search, 
  Award, 
  Users, 
  Calendar,
  Sparkles,
  ArrowRight,
  Info
} from "lucide-react";

export default function WelcomePage() {
  const { indikatorList, capaianList, initializeSupabase, pengaturan } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeSupabase();
  }, [initializeSupabase]);

  // Read media configuration from settings
  const mediaType = pengaturan?.dashboard_media_type || 'image';
  const mediaUrl = pengaturan?.dashboard_media_url || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200';
  const bannerTitle = pengaturan?.dashboard_banner_title || 'Portal Analisis Kinerja Pelayanan Seksi Penunjang';
  const bannerSubtitle = pengaturan?.dashboard_banner_subtitle || 'Sistem Informasi Pemantauan Aktivitas Kinerja Rumah Sakit (SIPAKAR)';
  const namaRS = pengaturan?.nama_rs || 'RSUD Al-Mulk';

  // Calculate live summary stats from store for hero display
  const totalIndicators = indikatorList.length;
  
  // Calculate average compliance (e.g., submitted reports over available ones in year 2026)
  const currentYear = 2026;
  const submittedCapaian = capaianList.filter(c => c.status_submit === 'Submitted');
  const achievedCount = submittedCapaian.filter(c => c.status === 'Tercapai').length;
  const complianceRate = totalIndicators > 0 
    ? Math.round((submittedCapaian.length / (totalIndicators * 3)) * 100) // normalized over Jan-Mar (3 months seeded)
    : 0;

  const averageCapaian = submittedCapaian.length > 0
    ? Math.round(submittedCapaian.reduce((acc, curr) => acc + curr.capaian, 0) / submittedCapaian.length)
    : 0;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-16 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-teal-500 to-emerald-500 p-2.5 rounded-xl shadow-lg text-slate-950">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-200 bg-clip-text text-transparent">
              SIPAKAR
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{namaRS}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <a href="#tentang" className="text-sm font-semibold text-slate-300 hover:text-white hidden sm:inline-block transition-colors">
            Tentang
          </a>
          <a href="#fitur" className="text-sm font-semibold text-slate-300 hover:text-white hidden sm:inline-block transition-colors">
            Fitur
          </a>
          <Link
            href="/login"
            className="flex items-center space-x-1.5 px-5 py-2.5 rounded-lg bg-teal-500 text-slate-950 hover:bg-teal-400 transition-all font-bold text-sm shadow-md shadow-teal-500/10 active:scale-95"
          >
            <span>Masuk Aplikasi</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Content (Hero) */}
      <main className="flex-1 flex flex-col">
        
        {/* Dynamic Hero Section with Cinematic Background */}
        <section className="relative overflow-hidden min-h-[580px] lg:min-h-[640px] py-16 px-6 lg:px-16 flex flex-col justify-center border-b border-slate-800/50">
          {/* Media background elements */}
          {mediaType === 'video' ? (
            <video
              key={mediaUrl}
              src={mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Cinematic Background"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-35"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200';
              }}
            />
          )}

          {/* Ambient Overlay Gradients for High Contrast Accessibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />
          <div className="absolute inset-0 bg-teal-950/10 pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-teal-500/10 border border-teal-500/25 rounded-full text-xs text-teal-300 font-bold tracking-wide backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Monitoring Kinerja Seksi Penunjang Medis & Non Medis</span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white drop-shadow-md">
                {bannerTitle}
              </h2>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mx-auto lg:mx-0 drop-shadow">
                {bannerSubtitle}
              </p>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center lg:justify-start text-xs font-bold text-[#00A8A8] drop-shadow-sm">
                <span>Rumah Sakit: <strong className="text-white">{namaRS}</strong></span>
                <span className="text-slate-600">•</span>
                <span>Divisi Penunjang Medis & Non Medis</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all text-sm shadow-lg shadow-teal-500/20 text-center uppercase tracking-widest"
                >
                  Mulai Menginput KPI
                </Link>
                <a
                  href="#tentang"
                  className="px-8 py-4 bg-slate-900/80 border border-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-800 hover:text-white transition-all text-sm text-center uppercase tracking-widest inline-flex items-center justify-center space-x-2 backdrop-blur-sm"
                >
                  <Info className="w-5 h-5" />
                  <span>Pelajari Lebih Lanjut</span>
                </a>
              </div>
            </div>

            {/* Interactive Statistics Grid with Glassmorphism Effect */}
            <div className="flex-1 w-full max-w-md mx-auto grid grid-cols-2 gap-4 backdrop-blur-md bg-slate-900/40 p-4 rounded-3xl border border-slate-800/40">
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg hover:border-teal-500/30 transition-colors">
                <div className="text-slate-400 text-xs uppercase font-extrabold tracking-wider flex items-center justify-between">
                  <span>Total Indikator</span>
                  <Layers className="w-4 h-4 text-teal-400" />
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-black text-white">{totalIndicators}</span>
                  <p className="text-[10px] text-slate-500 mt-1">Seksi Penunjang Medis & Non-Medis</p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg hover:border-emerald-500/30 transition-colors">
                <div className="text-slate-400 text-xs uppercase font-extrabold tracking-wider flex items-center justify-between">
                  <span>Rata-rata Capaian</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-black text-emerald-400">{averageCapaian}%</span>
                  <p className="text-[10px] text-slate-500 mt-1">Capaian realisasi kumulatif</p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg hover:border-teal-500/30 transition-colors">
                <div className="text-slate-400 text-xs uppercase font-extrabold tracking-wider flex items-center justify-between">
                  <span>Kepatuhan Input</span>
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-black text-teal-400">{complianceRate}%</span>
                  <p className="text-[10px] text-slate-500 mt-1">Persentase laporan masuk</p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg hover:border-emerald-500/30 transition-colors">
                <div className="text-slate-400 text-xs uppercase font-extrabold tracking-wider flex items-center justify-between">
                  <span>KPI Tercapai</span>
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-black text-white">{achievedCount}</span>
                  <p className="text-[10px] text-slate-500 mt-1">Indikator melampaui target</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tentang Aplikasi Section */}
        <section id="tentang" className="bg-slate-900 py-20 border-y border-slate-800">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="text-center space-y-4 mb-16">
              <span className="text-xs uppercase font-extrabold tracking-widest text-teal-400">Tentang SIPAKAR</span>
              <h3 className="text-3xl md:text-4xl font-black text-white">Struktur Pengawasan Unit Penunjang</h3>
              <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
                Sistem ini merangkum dan memonitor data indikator mutu di bawah naungan seksi penunjang RSUD Al-Mulk yang terbagi ke dalam dua divisi besar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Penunjang Medis */}
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800/80 relative overflow-hidden group hover:border-teal-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-bl-full group-hover:bg-teal-500/10 transition-colors" />
                <h4 className="text-lg font-black text-white flex items-center space-x-2.5 mb-4">
                  <span className="w-2.5 h-2.5 bg-teal-400 rounded-full"></span>
                  <span>Penunjang Medis</span>
                </h4>
                <p className="text-slate-400 text-sm mb-6">
                  Bertanggung jawab atas efektivitas, ketepatan waktu, dan mutu pelayanan diagnostik serta asuhan penunjang langsung bagi pasien.
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 font-semibold">
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">🔬 Laboratorium</div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">💊 Farmasi</div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">📂 Rekam Medis</div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">☢️ Radiologi</div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">🛡️ Mutu</div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">🥗 Gizi</div>
                </div>
              </div>

              {/* Penunjang Non Medis */}
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800/80 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors" />
                <h4 className="text-lg font-black text-white flex items-center space-x-2.5 mb-4">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
                  <span>Penunjang Non Medis</span>
                </h4>
                <p className="text-slate-400 text-sm mb-6">
                  Bertanggung jawab atas kelancaran sarana operasional, keandalan prasarana fisik, kebersihan lingkungan, logistik, dan keamanan rumah sakit.
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 font-semibold">
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">💻 IT Rumah Sakit / ITRS</div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">⚙️ IPSRS</div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">🧺 CSSD & Laundry</div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">📣 Humas dan Pemasaran</div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">💧 Kesehatan Lingkungan</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fitur Utama Section */}
        <section id="fitur" className="py-20 max-w-7xl mx-auto px-6 lg:px-16 w-full">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs uppercase font-extrabold tracking-widest text-teal-400">Kemampuan Sistem</span>
            <h3 className="text-3xl md:text-4xl font-black text-white">Alur Pengawasan yang Terintegrasi</h3>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm">
              Mulai dari entri data realisasi oleh staf di lapangan hingga rekap laporan resmi bertanda-tangan digital untuk direktur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-white text-base mb-2">1. Input & Hitung Otomatis</h5>
              <p className="text-slate-400 text-xs leading-relaxed">
                Petugas unit memasukkan numerator dan denominator. Sistem menghitung realisasi capaian persentase serta membandingkan dengan target secara instan.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-white text-base mb-2">2. Monitoring Supervisi</h5>
              <p className="text-slate-400 text-xs leading-relaxed">
                Supervisor mencatat temuan masalah, merumuskan akar masalah, menetapkan tindak lanjut, serta memantau status penyelesaian hingga deadline berakhir.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-white text-base mb-2">3. Cetak Laporan & Ekspor</h5>
              <p className="text-slate-400 text-xs leading-relaxed">
                Menyajikan laporan rekapitulasi performa bulanan, triwulanan, atau tahunan lengkap dengan diagram visual, dokumen bukti, dan tanda tangan digital.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/40 py-8 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center">
              <span className="text-xs font-bold text-teal-400">S</span>
            </div>
            <span className="font-bold text-slate-400">SIPAKAR RSUD Al-Mulk</span>
          </div>
          <p className="text-slate-500">&copy; {new Date().getFullYear()} RSUD Al-Mulk. Semua Hak Dilindungi Undang-Undang.</p>
        </div>
      </footer>
    </div>
  );
}
