"use client";

import { useAppStore, User } from "@/lib/store";
import { Menu, Bell, Sun, Moon, LogOut, ChevronDown, UserCheck, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface TopbarProps {
  toggleSidebar: () => void;
  isMobile: boolean;
}

export function Topbar({ toggleSidebar, isMobile }: TopbarProps) {
  const router = useRouter();
  const { currentUser, setCurrentUser, users, activityLogs } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: 'Konfirmasi Keluar',
      text: 'Apakah Anda yakin ingin keluar dari aplikasi SIPAKAR?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#00A8A8',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        document.cookie = "sb-mock-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        localStorage.removeItem("sipakar_auth");
        setCurrentUser(null);
        router.push("/login");
      }
    });
  };

  const showNotifications = () => {
    // Show recent activity log as notification mock
    const recentLogs = activityLogs.slice(0, 5);
    
    Swal.fire({
      title: 'Notifikasi & Riwayat Aktivitas',
      html: `
        <div class="text-left space-y-3 font-sans text-xs">
          ${recentLogs.map(log => `
            <div class="p-2 bg-gray-50 border border-gray-100 rounded-lg">
              <div class="flex justify-between font-bold text-gray-700">
                <span>${log.user_nama} (${log.user_role})</span>
                <span class="text-gray-400 text-[10px]">${new Date(log.timestamp).toLocaleTimeString('id-ID')}</span>
              </div>
              <p class="text-gray-500 mt-1">${log.aktivitas}</p>
            </div>
          `).join('')}
        </div>
      `,
      confirmButtonColor: '#00A8A8',
      confirmButtonText: 'Tutup'
    });
  };

  if (!mounted || !currentUser) {
    return (
      <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center px-8">
        <div className="w-1/3 h-4 bg-gray-100 rounded animate-pulse"></div>
      </header>
    );
  }

  // Indonesian date formatter
  const formattedDate = () => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date());
    } catch (e) {
      return "Rabu, 1 Juli 2026";
    }
  };

  return (
    <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 lg:px-8 border-b border-gray-200 sticky top-0 z-30 shrink-0 font-sans">
      <div className="flex items-center space-x-4">
        {isMobile && (
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-[#00A8A8] border border-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
        
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-800 leading-tight">
            SIPAKAR RSUD Al-Mulk
          </h2>
          <span className="text-[10px] sm:text-xs text-slate-500 font-semibold flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-teal-600 inline shrink-0" />
            <span>{formattedDate()}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4 sm:space-x-6">
        
        {/* Simulating Role Swapper helper */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="hidden md:flex items-center space-x-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-100 rounded-lg text-xs font-black transition-colors"
            title="Klik untuk mensimulasikan login peran lain"
          >
            <UserCheck size={14} className="shrink-0" />
            <span>Simulasi Peran</span>
            <ChevronDown size={12} />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5 text-xs text-left animate-in fade-in duration-150">
              <div className="px-3 py-1 border-b border-gray-100 pb-1.5 text-[10px] uppercase font-black text-gray-400">
                Ganti Akun Simulasi
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setCurrentUser(u);
                    setShowRoleMenu(false);
                    Swal.fire({
                      toast: true,
                      position: 'top-end',
                      icon: 'success',
                      title: `Akses beralih: ${u.role}`,
                      showConfirmButton: false,
                      timer: 1500
                    });
                    // Refresh route to apply new layout/roles if necessary
                    router.refresh();
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-gray-50 flex flex-col ${
                    currentUser.id === u.id ? 'bg-teal-50/50 text-[#00A8A8] font-bold' : 'text-gray-600'
                  }`}
                >
                  <span className="font-extrabold">{u.nama}</span>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">{u.role} {u.unit ? `(${u.unit})` : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Badge */}
        <button 
          onClick={showNotifications}
          className="relative cursor-pointer hover:bg-gray-100 p-2 rounded-full transition-colors border border-transparent hover:border-gray-100"
        >
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
            3
          </span>
        </button>
        
        {/* User Identity Info */}
        <div className="flex items-center space-x-3 border-l pl-4 sm:pl-6 border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-extrabold text-slate-800 leading-none">
              {currentUser.nama}
            </p>
            <div className="flex items-center justify-end space-x-1.5 mt-1">
              <span className="inline-block px-2 py-0.5 bg-[#00A8A8]/10 text-[#00A8A8] text-[9px] font-black rounded uppercase tracking-wide">
                {currentUser.role}
              </span>
              {currentUser.unit && (
                <span className="text-[9px] text-slate-400 font-bold max-w-[80px] truncate" title={currentUser.unit}>
                  &bull; {currentUser.unit}
                </span>
              )}
            </div>
          </div>
          
          <img 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nama)}&background=00A8A8&color=fff&bold=true`} 
            className="w-9 h-9 rounded-full border border-gray-200 shadow-sm hover:ring-2 hover:ring-teal-500/20 transition-all cursor-pointer" 
            alt={currentUser.nama}
            onClick={() => {
              Swal.fire({
                title: currentUser.nama,
                html: `
                  <div class="text-sm space-y-2">
                    <p><strong>Email:</strong> ${currentUser.email}</p>
                    <p><strong>Role:</strong> ${currentUser.role}</p>
                    <p><strong>Unit:</strong> ${currentUser.unit || '-'}</p>
                  </div>
                `,
                imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nama)}&background=00A8A8&color=fff&size=128`,
                imageWidth: 80,
                imageHeight: 80,
                imageAlt: currentUser.nama,
                confirmButtonColor: '#00A8A8'
              });
            }}
          />
        </div>
      </div>
    </header>
  );
}
