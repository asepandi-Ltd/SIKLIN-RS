"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  FileBox, 
  PenTool, 
  BarChart3, 
  FileText, 
  Eye, 
  Settings, 
  LogOut,
  ChevronLeft,
  Menu
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  isMobile: boolean;
}

export function Sidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V9zM14 13a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2z"></path></svg> },
    { name: "Profil Indikator", href: "/dashboard/indikator", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg> },
    { name: "Input Data", href: "/dashboard/input", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg> },
    { name: "Laporan Capaian", href: "/dashboard/laporan", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg> },
    { name: "Grafik Capaian", href: "/dashboard/grafik", icon: <BarChart3 className="w-5 h-5" /> },
    { name: "Monitoring Survei", href: "/dashboard/supervisi", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> },
  ];

  const handleLogout = async () => {
    // await supabase.auth.signOut();
    document.cookie = "sb-mock-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
    router.refresh();
  };

  const navClasses = "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-[#00A8A8] shadow-xl transition-transform duration-300 ease-in-out text-white font-sans overflow-hidden";
  const mobileTranslate = isOpen ? "translate-x-0" : "-translate-x-full";
  const desktopTranslate = isOpen ? "translate-x-0 w-64" : "translate-x-0 w-20";

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`${navClasses} ${isMobile ? mobileTranslate : desktopTranslate}`}>
        {/* Header */}
        <div className="p-6 flex items-center space-x-3 border-b border-white/20 shrink-0 h-20">
          <Link href="/dashboard" className={`flex items-center space-x-3 ${!isOpen && !isMobile ? 'hidden' : 'flex'}`}>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
               <svg className="w-6 h-6 text-[#00A8A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight whitespace-nowrap">SIKLIN-RS</h1>
              <p className="text-white/70 text-[10px] uppercase tracking-widest whitespace-nowrap">Kesehatan Lingkungan</p>
            </div>
          </Link>
          {(!isOpen && !isMobile) && (
             <div className="w-full flex justify-center bg-white p-2 rounded-lg shrink-0">
                <svg className="w-6 h-6 text-[#00A8A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
             </div>
          )}
        </div>

        {/* Scrollable Content */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? "bg-white/10 text-white font-medium" 
                    : "text-white/80 hover:bg-white/5"
                }`}
                title={(!isOpen && !isMobile) ? item.name : undefined}
              >
                <div className="shrink-0">{item.icon}</div>
                {(isOpen || isMobile) && <span className="font-medium whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area with Logout */}
        <div className="p-4 border-t border-white/20 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-white/80 w-full px-4 py-3 hover:bg-red-500/20 rounded-lg transition-colors"
            title={(!isOpen && !isMobile) ? "Logout" : undefined}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            {(isOpen || isMobile) && <span className="font-medium whitespace-nowrap">Logout</span>}
          </button>

          {!isMobile && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="absolute -right-3 top-24 bg-white border border-gray-100 text-[#00A8A8] hover:bg-gray-50 rounded-full p-1 shadow-lg"
            >
              <ChevronLeft size={16} className={`transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
