"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Link from "next/link";
import { useAppStore, User } from "@/lib/store";
const Eye = (p:any)=><div/>; const EyeOff = Eye; const Lock = Eye; const Mail = Eye; const ShieldCheck = Eye; const Activity = Eye; const ArrowRight = Eye; const UserCheck = Eye; const Building = Eye;

export default function LoginPage() {
  const router = useRouter();
  const { users, setCurrentUser, currentUser, initializeSupabase } = useAppStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeSupabase();
    // If already logged in, redirect
    if (currentUser) {
      router.push("/dashboard");
    }
  }, [currentUser, router, initializeSupabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      Swal.fire({
        icon: 'warning',
        title: 'Input Diperlukan',
        text: 'Email wajib diisi!',
        confirmButtonColor: '#00A8A8',
      });
      return;
    }
    if (!password) {
      Swal.fire({
        icon: 'warning',
        title: 'Input Diperlukan',
        text: 'Password wajib diisi!',
        confirmButtonColor: '#00A8A8',
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simulate database lookup latency
      await new Promise(resolve => setTimeout(resolve, 850));

      // 1. Try to find user in our store users list
      // For convenience of testing, we accept standard passwords
      const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (matchedUser && password === "123456") {
        // Successful login
        setCurrentUser(matchedUser);

        // Store mock session token
        try {
          document.cookie = "sb-mock-auth-token=true; path=/";
          localStorage.setItem("sipakar_auth", "true");
        } catch (cookieError) {
          console.warn("Cookies are restricted in this environment", cookieError);
        }

        await Swal.fire({
          icon: 'success',
          title: 'Login Berhasil',
          text: `Selamat datang kembali, ${matchedUser.nama}!`,
          showConfirmButton: false,
          timer: 1200,
        });

        router.push("/dashboard");
      } else {
        // Fallback for special default test credentials
        if (email === 'admin@sipakar.id' && password === 'admin') {
          const defaultAdmin = users.find(u => u.role === 'Super Admin') || users[0];
          setCurrentUser(defaultAdmin);
          router.push("/dashboard");
          return;
        }

        Swal.fire({
          icon: 'error',
          title: 'Login Gagal',
          text: 'Kredensial tidak valid. Silakan gunakan salah satu Akun Simulasi di bawah untuk menguji aplikasi dengan cepat.',
          confirmButtonColor: '#00A8A8',
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan pada sistem.',
        confirmButtonColor: '#00A8A8',
      });
    } finally {
      setLoading(false);
    }
  };

  // Quick select helper to make testing role-based features extremely easy
  const selectSimulatedAccount = (user: User) => {
    setEmail(user.email);
    setPassword("123456");
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: `Mengisi kredensial: ${user.role}`,
      showConfirmButton: false,
      timer: 1500
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans text-slate-100">
      
      {/* Brand Column (Left) */}
      <div className="flex-1 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-8 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-teal-950/20 via-slate-900 to-slate-900 -z-10" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />

        {/* Header brand */}
        <Link href="/" className="flex items-center space-x-3 self-start hover:opacity-90 transition-opacity">
          <div className="bg-gradient-to-tr from-teal-500 to-emerald-500 p-2 rounded-lg text-slate-950 font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              SIPAKAR
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">RSUD Al-Mulk</p>
          </div>
        </Link>

        {/* Feature info */}
        <div className="my-12 md:my-auto space-y-6 max-w-md">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-teal-950/40 border border-teal-800/40 rounded-full text-[11px] text-teal-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Aman, Akuntabel & Terintegrasi</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
            Pemantauan Capaian KPI Penunjang Rumah Sakit
          </h2>
          
          <p className="text-slate-400 text-sm leading-relaxed">
            Gunakan portal ini untuk melaporkan capaian indikator, memantau tindak lanjut supervisi klinis/operasional, serta mengevaluasi kepatuhan pelaporan unit seksi penunjang medis & non-medis.
          </p>

          <div className="space-y-3 pt-2 text-xs text-slate-400">
            <div className="flex items-center space-x-2.5">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
              <span>Proteksi Data dengan Supabase Auth & RLS</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
              <span>Kalkulasi Otomatis Persentase Capaian KPI</span>
            </div>
          </div>
        </div>

        {/* Footer brand */}
        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} RSUD Al-Mulk &bull; Subdivisi Pelaporan Kinerja.
        </div>
      </div>

      {/* Form Column (Right) */}
      <div className="flex-1 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-slate-950">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <h3 className="text-2xl font-extrabold text-white">Masuk ke Portal</h3>
            <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider font-semibold">
              Sistem Pelaporan Kinerja Seksi Penunjang
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Alamat Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
                  placeholder="nama@rsudalmulk.id"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  Swal.fire({
                    title: 'Lupa Password?',
                    text: 'Silakan hubungi Unit IT RSUD Al-Mulk (Super Admin) untuk mereset kata sandi Anda.',
                    icon: 'info',
                    confirmButtonColor: '#00A8A8'
                  });
                }} className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors">
                  Lupa Password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-teal-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                <span className="text-xs text-slate-400 font-semibold">Ingat Saya</span>
              </label>
              
              <span className="text-xs text-slate-500">Default Pass: <strong className="text-slate-300">123456</strong></span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-teal-500/10 transition-all text-sm uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-slate-950"></div>
                  <span>Memeriksa Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk Aplikasi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access simulated account panel */}
          <div className="pt-6 border-t border-slate-800 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Klik untuk Memilih Akun Simulasi</span>
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">SIPAKAR mengizinkan pengujian akses sesuai peran dengan mudah:</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => selectSimulatedAccount(u)}
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-left text-xs transition-all flex flex-col justify-between group active:scale-95"
                  type="button"
                >
                  <span className="font-extrabold text-white text-[11px] truncate group-hover:text-teal-400 transition-colors">
                    {u.nama}
                  </span>
                  <div className="flex items-center justify-between mt-1 text-[9px] font-bold text-slate-400">
                    <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded uppercase">
                      {u.role}
                    </span>
                    {u.unit && <span className="truncate max-w-[50px]">{u.unit}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
