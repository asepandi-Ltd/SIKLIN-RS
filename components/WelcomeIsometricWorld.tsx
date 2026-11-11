"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore, User } from "@/lib/store";
import {
  Sparkles,
  LogIn,
  ShieldCheck,
  Activity,
  FileText,
  BarChart3,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  ArrowRight,
  HelpCircle,
  X,
  HeartPulse
} from "lucide-react";

export default function WelcomeIsometricWorld() {
  const router = useRouter();
  const { users, setCurrentUser, currentUser, initializeSupabase } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Login Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeSupabase();
  }, [initializeSupabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Lengkapi Kredensial",
        text: "Silakan masukkan ID/Email dan Password Anda!",
        confirmButtonColor: "#00A8A8"
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const matchedUser = users.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() ||
          u.nama.toLowerCase() === email.toLowerCase()
      );

      if (matchedUser && password === "123456") {
        setCurrentUser(matchedUser);
        try {
          document.cookie = "sb-mock-auth-token=true; path=/";
          localStorage.setItem("sipakar_auth", "true");
        } catch {}

        await Swal.fire({
          icon: "success",
          title: "Selamat Datang di SIPAKAR!",
          text: `Halo ${matchedUser.nama} (${matchedUser.role})`,
          showConfirmButton: false,
          timer: 1200
        });

        router.push("/dashboard");
      } else if (email === "admin@sipakar.id" && password === "admin") {
        const defaultAdmin = users.find((u) => u.role === "Super Admin") || users[0];
        setCurrentUser(defaultAdmin);
        router.push("/dashboard");
      } else {
        Swal.fire({
          icon: "error",
          title: "Akses Ditolak",
          text: "ID/Email atau Password tidak sesuai. Gunakan tombol 'Pilih Akun Simulasi Cepat' untuk mencoba langsung!",
          confirmButtonColor: "#00A8A8"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const selectQuickAccount = (user: User) => {
    setEmail(user.email);
    setPassword("123456");
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "info",
      title: `Akun dipilih: ${user.nama} (${user.role})`,
      showConfirmButton: false,
      timer: 1400
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#3AB09E] flex flex-col items-center justify-center text-slate-900">
        <div className="animate-bounce bg-white p-4 rounded-3xl shadow-xl border-4 border-slate-900">
          <Sparkles className="w-10 h-10 text-teal-600 animate-spin" />
        </div>
        <p className="mt-4 font-black text-sm uppercase tracking-widest text-slate-900 bg-yellow-300 px-4 py-1.5 rounded-full border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
          Memuat SIPAKAR RSUD Al-Mulk...
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 font-sans select-none flex flex-col justify-between">
      
      {/* ===================================================================== */}
      {/* 1. TOP NAVIGATION BAR                                                 */}
      {/* ===================================================================== */}
      <header className="relative z-40 w-full px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-b from-slate-950/90 via-slate-900/60 to-transparent">
        {/* Brand Badge (Top-Left with requested welcome text) */}
        <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-400 border-2 border-slate-900 flex items-center justify-center text-slate-900 font-black shadow-xs shrink-0">
            <HeartPulse className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-slate-900 leading-none">
                SIPAKAR
              </span>
              <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-yellow-300 text-slate-900 rounded-full border border-slate-900">
                v2.0
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-black text-teal-900 tracking-tight mt-0.5">
              SELAMAT DATANG DI SIPAKAR (SISTEM PELAPORAN KINERJA PENUNJANG RSUD AL-MULK)
            </p>
          </div>
        </div>

        {/* Live System Indicator Pill */}
        <div className="hidden md:flex items-center gap-2 bg-emerald-950/80 border-2 border-emerald-400/50 backdrop-blur-md px-4 py-2 rounded-full text-emerald-300 text-xs font-black shadow-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>11 Unit Pelayanan Terkoneksi &bull; Periode 2026 Aktif</span>
        </div>

        {/* Interactive Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="px-4 py-2.5 bg-[#FFF176] hover:bg-[#FFEE58] text-slate-900 font-black text-xs rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] active:translate-y-0.5 active:shadow-[2px_2px_0px_#0f172a] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Fitur &amp; Cara Akses</span>
          </button>

          {currentUser ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2.5 bg-[#00E676] hover:bg-[#00C853] text-slate-900 font-black text-xs rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Lanjut ke Dashboard ({currentUser.nama})</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          ) : (
            <button
              onClick={() => setIsLoginDrawerOpen(true)}
              className="px-5 py-2.5 bg-[#FF5252] hover:bg-[#FF1744] text-white font-black text-xs rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer animate-pulse"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              <span>MASUK APLIKASI (LOGIN)</span>
            </button>
          )}
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. MAIN CENTER: LIVELY ISOMETRIC HOSPITAL CANVAS (CLEAN & SIMPLE)     */}
      {/* ===================================================================== */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        
        {/* Full Interactive Canvas Box */}
        <div className="relative w-full max-w-[1550px] aspect-[16/9] max-h-[86vh] mx-auto overflow-hidden rounded-2xl sm:rounded-3xl border-4 border-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] bg-slate-900">
          
          {/* Base Background: User Uploaded High-Res Image (Completely Clean & Unobstructed) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/welcome-sipakar-bg.jpg"
            alt="SIPAKAR RSUD Al-Mulk Unit Penunjang"
            className="w-full h-full object-cover select-none pointer-events-none transform scale-[1.01]"
          />

          {/* =================================================================== */}
          {/* LIVELY ANIMATION LAYER 1: SKY & ATMOSPHERE                          */}
          {/* =================================================================== */}
          
          {/* Animated Drifting Soft Cloud 1 */}
          <motion.div
            animate={{ x: ["-10%", "110%"] }}
            transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
            className="absolute top-2 left-0 pointer-events-none opacity-85 z-10 hidden sm:block"
          >
            <div className="w-40 h-14 bg-white/75 backdrop-blur-xs rounded-full blur-[2px] shadow-sm" />
          </motion.div>

          {/* Animated Drifting Soft Cloud 2 */}
          <motion.div
            animate={{ x: ["100%", "-20%"] }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            className="absolute top-6 right-0 pointer-events-none opacity-80 z-10 hidden sm:block"
          >
            <div className="w-52 h-16 bg-white/80 backdrop-blur-xs rounded-full blur-[2px] shadow-sm" />
          </motion.div>

          {/* Animated Flying Birds */}
          <motion.div
            animate={{
              x: ["-5%", "105%"],
              y: [0, -12, 4, -8, 2, 0]
            }}
            transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-8 left-0 pointer-events-none z-10 opacity-70"
          >
            <svg width="45" height="18" viewBox="0 0 50 20" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round">
              <path d="M2 14 Q 12 2, 22 10 Q 32 2, 42 14" />
            </svg>
          </motion.div>

          {/* Animated Hot Air Balloon "RSUD AL-MULK" floating smoothly */}
          <motion.div
            animate={{
              y: [0, -15, 0],
              x: [0, 8, -6, 0],
              rotate: [-2, 2, -2]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-4 left-[2%] md:left-[5%] z-20 hidden md:block cursor-pointer hover:scale-110 transition-transform"
            onClick={() => setIsGuideModalOpen(true)}
            title="Klik untuk melihat Panduan SIPAKAR"
          >
            <div className="relative group">
              <svg width="90" height="120" viewBox="0 0 110 145" className="drop-shadow-lg">
                <ellipse cx="55" cy="52" rx="44" ry="48" fill="#FF5252" stroke="#0F172A" strokeWidth="3" />
                <path d="M55 4 C32 22 32 82 55 100 C78 82 78 22 55 4 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
                <path d="M55 4 C45 25 45 79 55 100 C65 79 65 25 55 4 Z" fill="#00BFA5" stroke="#0F172A" strokeWidth="2.5" />
                <rect x="20" y="42" width="70" height="20" rx="5" fill="#FFD600" stroke="#0F172A" strokeWidth="2.5" />
                <text x="55" y="55" textAnchor="middle" fill="#0F172A" fontSize="9" fontWeight="900">
                  RSUD AL-MULK
                </text>
                <line x1="42" y1="98" x2="46" y2="116" stroke="#0F172A" strokeWidth="2.5" />
                <line x1="68" y1="98" x2="64" y2="116" stroke="#0F172A" strokeWidth="2.5" />
                <rect x="42" y="115" width="26" height="20" rx="4" fill="#D97706" stroke="#0F172A" strokeWidth="2.5" />
                <circle cx="55" cy="110" r="5" fill="#FDE047" stroke="#0F172A" strokeWidth="2" />
              </svg>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-300 text-slate-900 border border-slate-900 px-2 py-0.5 rounded-full text-[8px] font-black uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                SIPAKAR Air
              </div>
            </div>
          </motion.div>

          {/* =================================================================== */}
          {/* LIVELY ANIMATION LAYER 2: UNIT SPECIAL EFFECTS (Subtle Ambient)      */}
          {/* =================================================================== */}

          {/* Unit IT: Blinking Server Rack LED Lights */}
          <div className="absolute left-[16%] top-[19%] pointer-events-none z-15 flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping delay-300" />
          </div>

          {/* Unit Laboratorium: Steaming/Bubbling micro-effect */}
          <motion.div
            animate={{ y: [0, -10], opacity: [0.8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            className="absolute left-[41%] top-[35%] pointer-events-none z-15 text-cyan-300 font-black text-xs"
          >
            🫧
          </motion.div>

          {/* Unit CSSD: Sparkle Autoclave Effect */}
          <motion.div
            animate={{ scale: [0.8, 1.2, 0.8], rotate: [0, 90, 180] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[12%] top-[37%] pointer-events-none z-15 text-emerald-300 font-bold text-sm"
          >
            ✨
          </motion.div>

          {/* Unit Radiologi: Subtle Scanning Ray Bar */}
          <motion.div
            animate={{ opacity: [0.2, 0.9, 0.2], y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[62%] top-[38%] pointer-events-none z-15 w-8 h-1 bg-violet-400/80 rounded-full blur-[1px] shadow-[0_0_8px_#a78bfa]"
          />

          {/* Unit Gizi: Steaming Food Tray Vapor */}
          <motion.div
            animate={{ y: [0, -12], opacity: [0.7, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
            className="absolute left-[83%] top-[23%] pointer-events-none z-15 text-orange-200 text-xs"
          >
            ♨️
          </motion.div>

          {/* Unit Humas: Camera Flash & Social Media Pulsing Icons */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute left-[88%] top-[62%] pointer-events-none z-15 text-blue-300 text-xs"
          >
            📸
          </motion.div>

          {/* Main Entrance: Golden Neon Glow on the Marquee Arch */}
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[40%] top-[72%] w-[20%] h-6 bg-amber-400/25 rounded-full blur-md pointer-events-none z-15"
          />

          {/* Twinkling Garden Lanterns (Front Courtyard) */}
          <div className="absolute left-[8%] bottom-[8%] pointer-events-none z-15">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 inline-block shadow-[0_0_12px_#fde047] animate-pulse" />
          </div>
          <div className="absolute right-[8%] bottom-[8%] pointer-events-none z-15">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 inline-block shadow-[0_0_12px_#fde047] animate-pulse" />
          </div>
          <div className="absolute left-[26%] bottom-[5%] pointer-events-none z-15">
            <span className="w-2 h-2 rounded-full bg-yellow-200 inline-block shadow-[0_0_10px_#fef08a] animate-ping" />
          </div>
          <div className="absolute right-[26%] bottom-[5%] pointer-events-none z-15">
            <span className="w-2 h-2 rounded-full bg-yellow-200 inline-block shadow-[0_0_10px_#fef08a] animate-ping delay-500" />
          </div>

          {/* =================================================================== */}
          {/* INTERACTIVE ENTRANCE CALL TO ACTION                                 */}
          {/* =================================================================== */}
          <button
            type="button"
            onClick={() => setIsLoginDrawerOpen(true)}
            className="absolute left-1/2 bottom-[14%] -translate-x-1/2 z-25 group cursor-pointer focus:outline-none"
            title="Masuk ke Aplikasi SIPAKAR"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-xs sm:text-sm rounded-full border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] flex items-center gap-2 group-hover:scale-105 active:scale-95 transition-transform"
            >
              <LogIn className="w-4 h-4 stroke-[3]" />
              <span className="uppercase tracking-wider">KLIK UNTUK MASUK SIPAKAR</span>
            </motion.div>
          </button>

        </div>
      </main>

      {/* ===================================================================== */}
      {/* 3. BOTTOM LIVE RUNNING DISPATCH TICKER (LIVELY MARQUEE)               */}
      {/* ===================================================================== */}
      <footer className="relative z-30 w-full bg-slate-900/95 border-t-[3px] border-slate-900 py-2.5 px-4 overflow-hidden">
        <div className="flex items-center gap-4 text-xs font-black">
          <div className="shrink-0 flex items-center gap-2 bg-yellow-400 text-slate-950 px-3 py-1 rounded-xl border-2 border-slate-950 uppercase tracking-wider text-[11px] shadow-[2px_2px_0px_#000]">
            <Activity className="w-3.5 h-3.5 stroke-[3]" />
            <span>DISPATCH LIVE</span>
          </div>

          <div className="overflow-hidden relative flex-1 whitespace-nowrap">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
              className="inline-flex gap-8 text-slate-200 tracking-wide text-xs font-bold"
            >
              <span>⚡ SIPAKAR RSUD AL-MULK KOTA SUKABUMI AKTIF</span>
              <span>&bull;</span>
              <span>🏥 11 UNIT PENUNJANG TERKONEKSI: Lab, Radiologi, Farmasi, Gizi, CSSD, Rekam Medis, IPSRS, IT, Kesling, Humas, &amp; MUTU</span>
              <span>&bull;</span>
              <span>📊 DUKUNGAN MULTI-METRIK: Persentase (%), Jumlah Absolut, dan Durasi (Menit)</span>
              <span>&bull;</span>
              <span>📄 LAPORAN TAHUNAN OTOMATIS: Ekspor Word (.docx), PDF, &amp; Excel dengan Standar Akreditasi</span>
              <span>&bull;</span>
              <span>⚡ SIPAKAR RSUD AL-MULK KOTA SUKABUMI AKTIF</span>
              <span>&bull;</span>
              <span>🏥 11 UNIT PENUNJANG TERKONEKSI: Lab, Radiologi, Farmasi, Gizi, CSSD, Rekam Medis, IPSRS, IT, Kesling, Humas, &amp; MUTU</span>
              <span>&bull;</span>
              <span>📊 DUKUNGAN MULTI-METRIK: Persentase (%), Jumlah Absolut, dan Durasi (Menit)</span>
              <span>&bull;</span>
              <span>📄 LAPORAN TAHUNAN OTOMATIS: Ekspor Word (.docx), PDF, &amp; Excel dengan Standar Akreditasi</span>
            </motion.div>
          </div>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* MODAL 1: FITUR & CARA AKSES GUIDE                                     */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {isGuideModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl max-w-2xl w-full border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="bg-[#FFF176] p-5 border-b-4 border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                    <Sparkles className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      Panduan &amp; Fitur SIPAKAR
                    </h3>
                    <p className="text-xs font-bold text-slate-700">
                      Sistem Pelaporan Kinerja Penunjang RSUD Al-Mulk Kota Sukabumi
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGuideModalOpen(false)}
                  className="p-2 bg-white hover:bg-red-100 rounded-xl border-2 border-slate-900 cursor-pointer shadow-[2px_2px_0px_#0f172a]"
                >
                  <X className="w-4 h-4 stroke-[3]" />
                </button>
              </div>

              {/* Body Modal */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
                {/* Fitur Utama */}
                <div>
                  <h4 className="font-black text-sm text-slate-900 uppercase tracking-wider mb-3">
                    🌟 4 Fitur Utama Aplikasi SIPAKAR:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-teal-50 rounded-2xl border-2 border-slate-900 space-y-1">
                      <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-teal-600" />
                        1. Multi-Metrik KPI (%, Jumlah, Durasi)
                      </span>
                      <p className="text-[11px] font-medium">
                        Mendukung indikator berbasis Persentase (%), Angka Absolut (Kali/Laporan/Dokumen), dan Durasi (Menit) secara akurat.
                      </p>
                    </div>

                    <div className="p-3.5 bg-amber-50 rounded-2xl border-2 border-slate-900 space-y-1">
                      <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-600" />
                        2. Penyusunan Laporan Tahunan Otomatis
                      </span>
                      <p className="text-[11px] font-medium">
                        Satu kali input KPI, langsung terintegrasi menjadi Laporan Tahunan Seksi Penunjang dan siap diunduh ke Word (.docx), PDF, &amp; Excel.
                      </p>
                    </div>

                    <div className="p-3.5 bg-blue-50 rounded-2xl border-2 border-slate-900 space-y-1">
                      <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        3. Dynamic Table Builder Unit
                      </span>
                      <p className="text-[11px] font-medium">
                        Setiap Kepala Unit dapat merancang tabel program &amp; kegiatan kustom sesuai karakteristik unitnya masing-masing.
                      </p>
                    </div>

                    <div className="p-3.5 bg-pink-50 rounded-2xl border-2 border-slate-900 space-y-1">
                      <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-pink-600" />
                        4. Analisis Grafik Kinerja &amp; Capaian
                      </span>
                      <p className="text-[11px] font-medium">
                        Visualisasi perbandingan capaian 11 unit penunjang 12 bulan penuh (Januari–Desember) dengan pemantauan keberhasilan target.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cara Akses Masuk */}
                <div className="p-4 bg-slate-100 rounded-2xl border-2 border-slate-900 space-y-2.5">
                  <h4 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                    🔑 Cara Akses Masuk (Login ID &amp; Password):
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 font-semibold text-slate-800">
                    <li>
                      Klik tombol merah <strong>&quot;MASUK APLIKASI (LOGIN)&quot;</strong> di pojok kanan atas atau tombol kuning <strong>&quot;KLIK UNTUK MASUK SIPAKAR&quot;</strong> di depan lobi.
                    </li>
                    <li>
                      Masukkan <strong>ID / Alamat Email Petugas</strong> (contoh: <code>admin@almulk.go.id</code> atau <code>kasi@almulk.go.id</code>).
                    </li>
                    <li>
                      Masukkan <strong>Password</strong> (Password standar pengujian: <code>123456</code>).
                    </li>
                    <li>
                      Atau gunakan fitur <strong>&quot;Pilih Akun Simulasi Cepat&quot;</strong> di dalam panel login untuk langsung mencoba hak akses sebagai <em>Super Admin</em>, <em>Kepala Seksi</em>, <em>Supervisor</em>, atau <em>Kepala Unit</em>.
                    </li>
                  </ol>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t-4 border-slate-900 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsGuideModalOpen(false);
                    setIsLoginDrawerOpen(true);
                  }}
                  className="px-5 py-2.5 bg-[#00E676] hover:bg-[#00C853] text-slate-950 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Buka Form Login Sekarang</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MODAL / DRAWER 2: LOGIN DENGAN ID & PASSWORD                          */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {isLoginDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/65 backdrop-blur-xs">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-white w-full max-w-md h-full border-l-4 border-slate-900 shadow-2xl flex flex-col justify-between overflow-y-auto p-6 sm:p-8"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#00E676] border-2 border-slate-900 flex items-center justify-center shadow-[3px_3px_0px_#0f172a]">
                      <Lock className="w-5 h-5 text-slate-900 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 leading-none">
                        Masuk ke SIPAKAR
                      </h3>
                      <p className="text-[11px] font-bold text-slate-500 mt-1">
                        Login dengan ID/Email &amp; Password Petugas
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsLoginDrawerOpen(false)}
                    className="p-2 bg-slate-100 hover:bg-red-100 rounded-xl border-2 border-slate-900 cursor-pointer"
                  >
                    <X className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>

                {/* Form Login */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                      ID Pengguna / Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Masukkan email atau nama pengguna..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-yellow-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                        Password
                      </label>
                      <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-300">
                        Default: 123456
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border-2 border-slate-900 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-yellow-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#00E676] hover:bg-[#00C853] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Memverifikasi Kredensial...</span>
                    ) : (
                      <>
                        <span>Masuk Sekarang</span>
                        <ArrowRight className="w-4 h-4 stroke-[3]" />
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Account Selector for Easy Testing */}
                <div className="pt-4 border-t-2 border-dashed border-slate-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-800 uppercase flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-teal-600" />
                      Pilih Akun Simulasi Cepat:
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">1-Klik Isi Otomatis</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {users.map((u) => (
                      <button
                          key={u.id}
                          type="button"
                          onClick={() => selectQuickAccount(u)}
                          className="p-2.5 bg-slate-50 hover:bg-yellow-100 border-2 border-slate-900 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between shadow-[2px_2px_0px_#0f172a]"
                        >
                          <div className="font-black text-slate-900 text-[11px] truncate">
                            {u.nama}
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-1">
                            <span className="px-1.5 py-0.5 bg-white border border-slate-900 rounded text-[8px] font-black uppercase text-teal-800">
                              {u.role}
                            </span>
                            {u.unit && (
                              <span className="text-[9px] font-bold text-slate-600 truncate max-w-[65px]">
                                {u.unit}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 text-center text-[10px] font-bold text-slate-500">
                UOBK RSUD Al-Mulk Kota Sukabumi &bull; Keamanan Terenkripsi
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
