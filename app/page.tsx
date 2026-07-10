"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { motion } from "motion/react";

export default function Page() {
  const router = useRouter();
  const { currentUser, initializeSupabase } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeSupabase();
  }, [initializeSupabase]);

  useEffect(() => {
    if (!mounted) return;

    // Small delay to allow store initialization and session lookup
    const timer = setTimeout(() => {
      if (currentUser) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [currentUser, router, mounted]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
      <div className="flex flex-col items-center space-y-6 max-w-sm text-center">
        {/* Animated outer ring spinner */}
        <div className="relative flex items-center justify-center w-16 h-16">
          <motion.div
            className="absolute w-full h-full border-4 border-teal-500/20 border-t-teal-400 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
          <motion.div
            className="absolute w-10 h-10 border-4 border-emerald-500/10 border-b-emerald-400 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-black tracking-wider text-teal-300 uppercase">
            SIPAKAR
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Memuat dashboard dan menyelaraskan basis data...
          </p>
        </div>
      </div>
    </div>
  );
}

