"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { motion, AnimatePresence } from "motion/react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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
          <p>Version 1.2.0-stable</p>
        </footer>
      </main>
    </div>
  );
}
