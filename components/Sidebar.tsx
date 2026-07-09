"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Layers, 
  PenTool, 
  BarChart3, 
  FileText, 
  ShieldAlert, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Sparkles,
  Lock,
  TrendingUp
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import Swal from "sweetalert2";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  isMobile: boolean;
}

export function Sidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser } = useAppStore();
  const [mounted, setMounted] = useState(false);

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

  const menuItems = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: <LayoutDashboard size={20} />,
      roles: ["Super Admin", "Kepala Seksi", "Kepala Unit", "Supervisor"]
    },
    { 
      name: "Profil Indikator", 
      href: "/dashboard/indikator", 
      icon: <Layers size={20} />,
      roles: ["Super Admin", "Kepala Seksi", "Kepala Unit", "Supervisor"]
    },
    { 
      name: "Input Data", 
      href: "/dashboard/input", 
      icon: <PenTool size={20} />,
      roles: ["Super Admin", "Kepala Unit", "Kepala Seksi", "Supervisor"] // everyone can view, but write is guarded
    },
    { 
      name: "Grafik Analisis", 
      href: "/dashboard/grafik", 
      icon: <BarChart3 size={20} />,
      roles: ["Super Admin", "Kepala Seksi", "Kepala Unit", "Supervisor"]
    },
    { 
      name: "Laporan", 
      href: "/dashboard/laporan", 
      icon: <FileText size={20} />,
      roles: ["Super Admin", "Kepala Seksi", "Kepala Unit", "Supervisor"]
    },
    { 
      name: "Monitoring Supervisi", 
      href: "/dashboard/supervisi", 
      icon: <ClipboardList size={20} />,
      roles: ["Super Admin", "Supervisor", "Kepala Seksi", "Kepala Unit"]
    },
    { 
      name: "Capaian Indikator Unit", 
      href: "/dashboard/capaian-unit", 
      icon: <TrendingUp size={20} />,
      roles: ["Super Admin", "Kepala Seksi", "Kepala Unit", "Supervisor"]
    },
    { 
      name: "Pengaturan", 
      href: "/dashboard/pengaturan", 
      icon: <Settings size={20} />,
      roles: ["Super Admin", "Kepala Seksi", "Kepala Unit", "Supervisor"] // view profile for all, modify restricted
    },
  ];

  if (!mounted || !currentUser) {
    return (
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 shrink-0"></aside>
    );
  }

  // Check if a role is allowed to view the link
  const isAllowed = (itemRoles: string[]) => {
    return itemRoles.includes(currentUser.role);
  };

  const navClasses = "fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-950 border-r border-slate-800 transition-all duration-300 ease-in-out font-sans";
  const sizeClasses = isOpen ? "w-64" : "w-20";
  const mobileClasses = isMobile 
    ? (isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64") 
    : "translate-x-0";

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 z-35 backdrop-blur-sm" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`${navClasses} ${sizeClasses} ${mobileClasses}`}>
        
        {/* Header Block with App Logo */}
        <div className="p-4 flex items-center border-b border-slate-800 shrink-0 h-16 bg-slate-900/40">
          <Link href="/dashboard" className="flex items-center space-x-3 truncate">
            <div className="w-9 h-9 bg-gradient-to-tr from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg text-slate-950">
              <Sparkles className="w-4 h-4" />
            </div>
            {(isOpen || isMobile) && (
              <div className="text-left">
                <h1 className="text-white font-extrabold text-sm tracking-tight leading-none uppercase">SIPAKAR</h1>
                <p className="text-[9px] text-teal-400 font-bold uppercase tracking-wider mt-0.5">RSUD Al-Mulk</p>
              </div>
            )}
          </Link>
        </div>

        {/* Scrollable Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname && pathname.startsWith(item.href));
            const allowed = isAllowed(item.roles);

            return (
              <Link
                key={item.href}
                href={allowed ? item.href : "#"}
                onClick={(e) => {
                  if (!allowed) {
                    e.preventDefault();
                    Swal.fire({
                      icon: 'warning',
                      title: 'Akses Terbatas',
                      text: `Halaman ini hanya dapat diakses oleh peran: ${item.roles.join(', ')}.`,
                      confirmButtonColor: '#00A8A8',
                    });
                    return;
                  }
                  if (isMobile) setIsOpen(false);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 group text-sm relative ${
                  isActive 
                    ? "bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-400 font-bold border-l-4 border-teal-500 pl-2" 
                    : allowed 
                      ? "text-slate-400 hover:bg-slate-900 hover:text-white"
                      : "text-slate-600 cursor-not-allowed"
                }`}
                title={(!isOpen && !isMobile) ? item.name : undefined}
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className={`shrink-0 ${isActive ? "text-teal-400" : allowed ? "text-slate-400 group-hover:text-white" : "text-slate-600"}`}>
                    {item.icon}
                  </div>
                  {(isOpen || isMobile) && <span className="truncate">{item.name}</span>}
                </div>

                {(!allowed && (isOpen || isMobile)) && (
                  <Lock size={12} className="text-slate-600" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (User session details & Logout) */}
        <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-900/20">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-slate-400 hover:text-red-400 hover:bg-red-500/5 w-full px-3.5 py-2.5 rounded-xl transition-colors text-sm"
            title={(!isOpen && !isMobile) ? "Logout" : undefined}
          >
            <LogOut size={20} className="shrink-0 text-slate-400 group-hover:text-red-400" />
            {(isOpen || isMobile) && <span className="font-semibold">Keluar</span>}
          </button>

          {/* Toggle button on Desktop */}
          {!isMobile && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="absolute -right-3 top-20 bg-slate-900 border border-slate-800 text-teal-400 hover:text-white rounded-full p-1 shadow-xl z-50 hover:bg-slate-800 cursor-pointer"
            >
              {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
