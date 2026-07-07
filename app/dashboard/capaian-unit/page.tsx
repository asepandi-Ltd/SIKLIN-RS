"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { TrendingUp, Info } from "lucide-react";
import { motion } from "motion/react";

const months = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function CapaianUnitPage() {
  const { indikatorList, capaianList, currentUser } = useAppStore();
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [multipliers, setMultipliers] = useState<Record<string, number>>({});
  
  // Extract unique units
  const units = Array.from(new Set(indikatorList.map(i => i.unit))).sort();
  
  useEffect(() => {
    if (currentUser && currentUser.role !== "Super Admin" && currentUser.role !== "Supervisor" && currentUser.unit) {
      setSelectedUnit(currentUser.unit);
    }
  }, [currentUser]);

  // Load multipliers from local storage
  useEffect(() => {
    const saved = localStorage.getItem("sipak_multipliers");
    if (saved) {
      try {
        setMultipliers(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleMultiplierChange = (indikatorId: string, value: string) => {
    const num = parseFloat(value);
    const newMultipliers = { ...multipliers, [indikatorId]: isNaN(num) ? 0 : num };
    setMultipliers(newMultipliers);
    localStorage.setItem("sipak_multipliers", JSON.stringify(newMultipliers));
  };

  const filteredIndikators = indikatorList.filter(i => i.unit === selectedUnit);
  let totalKinerjaUnit = 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-teal-500 rounded-xl text-white shadow-lg shadow-teal-500/30">
              <TrendingUp size={24} />
            </div>
            Capaian Indikator Unit
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Kategori nilai hasil skor penilaian mutu indikator per unit.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Pilih Unit
          </label>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            disabled={currentUser?.role !== "Super Admin" && currentUser?.role !== "Supervisor"}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <option value="" disabled>-- Pilih Unit --</option>
            {units.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-48">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Tahun
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Content */}
      {selectedUnit ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden overflow-x-auto"
        >
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[1200px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-4 text-center w-12" rowSpan={2}>No</th>
                <th className="px-4 py-4 min-w-[250px]" rowSpan={2}>Indikator KPI</th>
                <th className="px-4 py-3 text-center border-x border-slate-200" colSpan={12}>
                  Capaian SKOR PENILAIAN MUTU ({selectedYear})
                </th>
                <th className="px-4 py-4 text-center border-r border-slate-200" rowSpan={2}>Total<br/>Nilai<br/>Capaian</th>
                <th className="px-4 py-4 text-center border-r border-slate-200 w-28" rowSpan={2}>Rumus<br/>Pengali</th>
                <th className="px-4 py-4 text-center bg-teal-50 text-teal-700" rowSpan={2}>Hasil<br/>Kinerja<br/>Indikator</th>
              </tr>
              <tr className="bg-slate-100/50 text-xs text-slate-500 border-b border-slate-200">
                {months.map(m => (
                  <th key={m} className="px-2 py-2 text-center border-x border-slate-200 w-12 font-medium">
                    {m.substring(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIndikators.length > 0 ? (
                filteredIndikators.map((ind, index) => {
                  let totalSkor = 0;
                  
                  const monthlyData = Array.from({ length: 12 }).map((_, i) => {
                    const month = i + 1;
                    const capaian = capaianList.find(
                      c => c.indikator_id === ind.id && c.bulan === month && c.tahun === selectedYear
                    );
                    // Gunakan "nilai" dari objek capaian (asumsi nilai merupakan Skor Penilaian Mutu)
                    const skor = capaian?.nilai || 0;
                    totalSkor += skor;
                    return skor;
                  });

                  const pengali = multipliers[ind.id] || 0;
                  const hasilKinerja = totalSkor * pengali;
                  totalKinerjaUnit += hasilKinerja;

                  return (
                    <tr key={ind.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-normal">
                        {ind.nama}
                      </td>
                      
                      {/* 12 Months Skor */}
                      {monthlyData.map((skor, i) => (
                        <td key={i} className="px-2 py-3 text-center border-x border-slate-100">
                          {skor > 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-teal-100 text-teal-700 font-bold text-xs">
                              {skor}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      ))}

                      {/* Total Skor */}
                      <td className="px-4 py-3 text-center font-bold text-slate-700 border-x border-slate-100 bg-slate-50/50">
                        {totalSkor}
                      </td>

                      {/* Pengali Input */}
                      <td className="px-3 py-3 border-r border-slate-100">
                        <input
                          type="number"
                          step="0.01"
                          value={multipliers[ind.id] !== undefined ? multipliers[ind.id] : ""}
                          onChange={(e) => handleMultiplierChange(ind.id, e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-center text-sm font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                          placeholder="0"
                        />
                      </td>

                      {/* Hasil Kinerja */}
                      <td className="px-4 py-3 text-center font-extrabold text-teal-600 bg-teal-50/30">
                        {hasilKinerja % 1 !== 0 ? hasilKinerja.toFixed(2) : hasilKinerja}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={17} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada indikator untuk unit ini.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
              <tr>
                <td colSpan={16} className="px-4 py-5 text-right text-slate-700">
                  TOTAL CAPAIAN KINERJA INDIKATOR {selectedUnit.toUpperCase()}:
                </td>
                <td className="px-4 py-5 text-center text-lg text-teal-700 bg-teal-100/50">
                  {totalKinerjaUnit % 1 !== 0 ? totalKinerjaUnit.toFixed(2) : totalKinerjaUnit}
                </td>
              </tr>
            </tfoot>
          </table>
        </motion.div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">Belum Ada Unit Terpilih</h3>
          <p className="text-slate-500">Silakan pilih unit pada form di atas untuk melihat capaian kinerja.</p>
        </div>
      )}
    </div>
  );
}
