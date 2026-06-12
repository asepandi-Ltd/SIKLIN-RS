"use client";

import { useTheme } from "next-themes";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Menu, Bell, Sun, Moon, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface TopbarProps {
  toggleSidebar: () => void;
  isMobile: boolean;
}

export function Topbar({ toggleSidebar, isMobile }: TopbarProps) {
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<any>({ name: "Budi Santoso", role: "Administrator" });

  useEffect(() => {
    setMounted(true);
    // fetchUserProfile();
  }, []);

  return (
    <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 border-b border-gray-200 sticky top-0 z-30 shrink-0">
      <div className="flex items-center space-x-4">
        {isMobile && (
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-gray-100 text-gray-600"
          >
            <Menu size={20} />
          </button>
        )}
        <h2 className="text-xl font-bold text-gray-700 hidden sm:block">Dashboard Overview</h2>
        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs hidden md:block">Senin, 24 Mei 2024</span>
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative cursor-pointer hover:bg-gray-50 p-2 rounded-full transition-colors">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">3</span>
        </div>
        
        <div className="flex items-center space-x-3 border-l pl-6 border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-none">{userProfile.name}</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight mt-1">{userProfile.role}</p>
          </div>
          <img src={`https://ui-avatars.com/api/?name=${userProfile.name.replace(" ", "+")}&background=00A8A8&color=fff`} className="w-9 h-9 rounded-full border border-gray-200 shadow-sm" alt="User Avatar" />
        </div>
      </div>
    </header>
  );
}
