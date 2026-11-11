"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SupervisiRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-3">
      <div className="w-10 h-10 border-4 border-[#00A8A8] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-bold text-slate-600">
        Mengalihkan ke Dashboard SIPAKAR...
      </p>
    </div>
  );
}
