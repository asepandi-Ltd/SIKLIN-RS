"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      if (username === "fitriwul" && password === "12345") {
        try {
          // Try to set dummy cookie to pass middleware (might throw in some iframe environments)
          document.cookie = "sb-mock-auth-token=true; path=/";
        } catch (e) {
          console.warn("Could not set cookie, continuing anyway", e);
        }
        
        // Also set localStorage as fallback for client-side auth
        try {
          localStorage.setItem("siklin_auth", "true");
        } catch (e) {
          console.warn("Could not set localStorage", e);
        }
        
        await Swal.fire({
          icon: 'success',
          title: 'Login Berhasil',
          showConfirmButton: false,
          timer: 1000,
        });
        
        window.location.href = "/dashboard";
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login Gagal',
          text: 'Username atau password tidak valid.',
          confirmButtonColor: '#00A8A8',
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan sistem.',
        confirmButtonColor: '#00A8A8',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="flex flex-col items-center mb-8">
            <Link href="/" className="bg-[#00A8A8] p-3 rounded-lg shadow-md mb-4 inline-block hover:scale-105 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </Link>
            <h2 className="text-2xl font-bold text-gray-800">Login SIKLIN-RS</h2>
            <p className="text-gray-500 text-xs uppercase tracking-wider mt-2 text-center font-bold">
              Kredensial Akses
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:border-transparent transition-all"
                placeholder="Masukkan username"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Password
                </label>
                <a href="#" className="text-xs font-bold text-[#00A8A8] hover:text-[#008f8f]">Lupa Password?</a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold uppercase tracking-wider text-white bg-[#00A8A8] hover:bg-[#008f8f] focus:outline-none transition-all disabled:opacity-70"
            >
              {loading ? "Authenticating..." : "Login Aplikasi"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
