"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "@/lib/store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { isDbConnected, isSyncing, syncWithSupabase, initializeSupabase, isOnline, pendingQueue } = useAppStore();

  useEffect(() => {
    initializeSupabase();
  }, [initializeSupabase]);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 1024;
      setIsMobile(isMobileView);
      if (isMobileView) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-800 flex overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
      
      <main className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen && !isMobile ? "ml-64" : !isMobile ? "ml-20" : "ml-0"}`}>
        <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} isMobile={isMobile} />
        
        <div className="p-8 flex-1 flex flex-col space-y-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
               key="page-content"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.3 }}
               className="flex-1 flex flex-col space-y-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="h-10 shrink-0 bg-white border-t border-gray-200 px-8 flex items-center justify-between text-[10px] text-gray-400 font-medium z-10 w-full">
          <p>© 2024 RSUD Al-Mulk - Sistem Informasi Kesehatan Lingkungan</p>
          <div className="flex items-center space-x-3">
            {/* Online/Offline Status */}
            <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
              isOnline
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </span>

            {/* Database Connection Status */}
            <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
              isDbConnected 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isDbConnected ? 'Supabase Terhubung' : 'Penyimpanan Lokal'}</span>
            </span>

            {/* Pending Queue Count indicator */}
            {pendingQueue && pendingQueue.length > 0 && (
              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse animate-duration-1000">
                <span>{pendingQueue.length} Data Tertunda</span>
              </span>
            )}
            <button 
              onClick={async () => {
                await syncWithSupabase();
                const state = useAppStore.getState();
                const Swal = (await import('sweetalert2')).default;
                const { isSupabaseConfigured } = await import('@/lib/supabaseService');
                
                if (state.isDbConnected) {
                  Swal.fire({
                    icon: 'success',
                    title: 'Sinkronisasi Berhasil!',
                    text: 'Semua data telah disinkronkan dengan database cloud Supabase.',
                    showConfirmButton: false,
                    timer: 2000
                  });
                } else {
                  if (!isSupabaseConfigured()) {
                    Swal.fire({
                      icon: 'info',
                      title: 'Supabase Belum Aktif',
                      html: `<div class="text-left text-xs space-y-2 leading-relaxed">
                        <p>Aplikasi saat ini berjalan dalam mode <strong>Penyimpanan Lokal (Offline Cache)</strong> karena kredensial Supabase belum diatur.</p>
                        <p class="font-bold">Untuk mengaktifkan database awan, atur variabel berikut di secrets/env:</p>
                        <ul class="list-disc pl-5 font-mono bg-slate-50 p-2 rounded text-[10px] space-y-1 select-all">
                          <li>NEXT_PUBLIC_SUPABASE_URL</li>
                          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                        </ul>
                      </div>`,
                      confirmButtonText: 'Mengerti',
                      confirmButtonColor: '#00A8A8'
                    });
                  } else {
                    Swal.fire({
                      icon: 'warning',
                      title: 'Koneksi Gagal / Tabel Belum Ada',
                      html: `<div class="text-left text-xs space-y-2 leading-relaxed">
                        <p>Kredensial Supabase terdeteksi, tetapi data tidak dapat dimuat dari database.</p>
                        <p class="font-bold">Solusi Tercepat:</p>
                        <p>Salin isi dari file <strong>supabase_schema.sql</strong> di folder root project dan jalankan (paste) di menu <strong>SQL Editor</strong> pada Supabase Console Anda untuk membuat tabel-tabel yang diperlukan.</p>
                      </div>`,
                      confirmButtonText: 'Mengerti',
                      confirmButtonColor: '#00A8A8'
                    });
                  }
                }
              }}
              disabled={isSyncing}
              className="text-[#00A8A8] hover:text-teal-500 disabled:text-gray-400 font-bold hover:underline transition-all cursor-pointer"
            >
              {isSyncing ? 'Sinkronisasi...' : 'Sinkronkan'}
            </button>
            <span>|</span>
            <p>Version 1.2.0-stable</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
