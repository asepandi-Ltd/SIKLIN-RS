"use client";

import { useState } from "react";

export default function InputDataPage() {
  const [numerator, setNumerator] = useState<number | "">("");
  const [denominator, setDenominator] = useState<number | "">("");

  const capaian = typeof numerator === "number" && typeof denominator === "number" && denominator > 0
    ? ((numerator / denominator) * 100).toFixed(2)
    : 0;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-700">Input Capaian Indikator</h2>
        <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider font-bold">Pelaporan Data Bulanan</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Periode Bulan</label>
              <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:bg-white">
                <option value="6">Juni</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Periode Tahun</label>
              <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:bg-white">
                <option value="2024">2024</option>
              </select>
            </div>
          </div>

          <div>
             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Indikator</label>
             <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:bg-white">
                <option value="" disabled selected>-- Pilih Indikator --</option>
                <option value="IND-01">IND-01: Kualitas air bersih memenuhi syarat</option>
             </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 border border-gray-100 rounded-xl">
             <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Numerator (Pembilang)</label>
                <input 
                  type="number" 
                  value={numerator}
                  onChange={(e) => setNumerator(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
                  placeholder="0"
                />
             </div>
             <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Denominator (Penyebut)</label>
                <input 
                  type="number" 
                  value={denominator}
                  onChange={(e) => setDenominator(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
                  placeholder="0"
                />
             </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
             <div className="text-green-800 text-sm font-bold uppercase tracking-wider">Hasil Kalkulasi Capaian:</div>
             <div className="text-3xl font-black text-green-600">{capaian}%</div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
             <button type="button" className="px-6 py-3 border border-gray-200 bg-white rounded-lg text-gray-600 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors">
               Draft
             </button>
             <button type="button" className="px-6 py-3 bg-[#00A8A8] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#008f8f] transition-colors shadow-sm">
               Submit Capaian
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
