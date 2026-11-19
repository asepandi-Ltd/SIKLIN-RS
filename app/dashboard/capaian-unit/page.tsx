"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppStore, Capaian } from "@/lib/store";
import { TrendingUp, Info, Award, CheckCircle, AlertTriangle, XCircle, Calculator } from "lucide-react";
import { motion } from "motion/react";
import { normalizeUnit, getCanonicalUnitName, ACTIVE_MASTER_UNITS } from "@/lib/units";

const months = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function CapaianUnitPage() {
  const { indikatorList, capaianList, currentUser, updateIndikator } = useAppStore();
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  
  // Extract all active units cleanly
  const units = useMemo(() => {
    const listFromMaster = ACTIVE_MASTER_UNITS.map(u => u.name);
    const listFromIndikators = indikatorList.filter(i => i.status).map(i => getCanonicalUnitName(i.unit));
    return Array.from(new Set([...listFromMaster, ...listFromIndikators])).filter(Boolean).sort();
  }, [indikatorList]);
  
  useEffect(() => {
    if (currentUser && currentUser.role !== "Super Admin" && currentUser.role !== "Supervisor" && currentUser.unit) {
      setSelectedUnit(getCanonicalUnitName(currentUser.unit));
    } else if (!selectedUnit && units.length > 0) {
      // Default to first available unit so Super Admin sees immediate data
      setSelectedUnit(units[0]);
    }
  }, [currentUser, units, selectedUnit]);

  const handleMultiplierChange = (indikatorId: string, value: string) => {
    const num = parseFloat(value);
    const safeNum = isNaN(num) ? 0 : num;
    updateIndikator(indikatorId, { bobot: safeNum });
  };

  // Filter indicators matching selected unit (handling all unit alias variations)
  const filteredIndikators = useMemo(() => {
    if (!selectedUnit) return [];
    return indikatorList.filter(i => {
      if (!i.status) return false;
      const canonicalIndUnit = getCanonicalUnitName(i.unit);
      const canonicalSelected = getCanonicalUnitName(selectedUnit);
      const normInd = normalizeUnit(i.unit);
      const normSel = normalizeUnit(selectedUnit);
      return (
        i.unit === selectedUnit ||
        canonicalIndUnit === canonicalSelected ||
        (normInd && normSel && normInd.id === normSel.id)
      );
    });
  }, [indikatorList, selectedUnit]);

  // Robust Quality Score Calculator (Handles legacy/missing/unpopulated nilai fields)
  const getSkorMutu = (capaian?: Capaian | null): number => {
    if (!capaian) return 0;
    
    // 1. Explicit score property saved in database
    if (typeof capaian.nilai === 'number' && !isNaN(capaian.nilai) && capaian.nilai > 0) {
      return capaian.nilai;
    }
    
    // 2. Standard Quality Assessment Status Mapping
    if (capaian.status === 'Tercapai') return 3;
    if (capaian.status === 'Mendekati Target') return 2;
    if (capaian.status === 'Tidak Tercapai') return 1;

    // 3. Fallback based on realisasi percentage vs target
    if (typeof capaian.capaian === 'number' && typeof capaian.target === 'number' && capaian.target > 0) {
      if (capaian.capaian >= capaian.target) return 3;
      if (capaian.capaian >= capaian.target * 0.8) return 2;
      return 1;
    }

    // 4. Numerator & Denominator fallback
    if (typeof capaian.numerator === 'number' && typeof capaian.denominator === 'number' && capaian.denominator > 0) {
      const ratio = (capaian.numerator / capaian.denominator) * 100;
      const target = capaian.target || 100;
      if (ratio >= target) return 3;
      if (ratio >= target * 0.8) return 2;
      return 1;
    }

    return 0;
  };

  // Calculations for Unit Summary
  let totalKinerjaUnit = 0;
  let totalSubmittedEntries = 0;
  let countSkor3 = 0;
  let countSkor2 = 0;
  let countSkor1 = 0;

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
          <p className="text-slate-500 mt-2 font-medium text-sm">
            Tabel evaluasi dan matriks hasil skor penilaian mutu kinerja indikator tahun {selectedYear}.
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
            {[2024, 2025, 2026, 2027, 2028].map(y => (
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
          className="space-y-4"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[1200px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-4 text-center w-12" rowSpan={2}>No</th>
                  <th className="px-4 py-4 min-w-[280px]" rowSpan={2}>Indikator KPI</th>
                  <th className="px-4 py-3 text-center border-x border-slate-200 bg-teal-50/50 text-teal-900" colSpan={12}>
                    Capaian SKOR PENILAIAN MUTU ({selectedYear})
                  </th>
                  <th className="px-4 py-4 text-center border-r border-slate-200" rowSpan={2}>Total<br/>Nilai<br/>Capaian</th>
                  <th className="px-4 py-4 text-center border-r border-slate-200 w-32" rowSpan={2}>
                    Rumus<br/>Pengali
                  </th>
                  <th className="px-4 py-4 text-center bg-teal-50 text-teal-800" rowSpan={2}>
                    Hasil<br/>Kinerja<br/>Indikator
                  </th>
                </tr>
                <tr className="bg-slate-100/50 text-xs text-slate-500 border-b border-slate-200">
                  {months.map(m => (
                    <th key={m} className="px-2 py-2 text-center border-x border-slate-200 w-14 font-medium">
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
                      
                      // Match capaian with resilient year and month number casting
                      const capaian = capaianList.find(c => {
                        const matchInd = c.indikator_id === ind.id;
                        const matchBulan = Number(c.bulan) === Number(month);
                        const matchTahun = Number(c.tahun) === Number(selectedYear);
                        return matchInd && matchBulan && matchTahun;
                      });

                      const skor = getSkorMutu(capaian);
                      if (skor > 0) {
                        totalSkor += skor;
                        totalSubmittedEntries += 1;
                        if (skor === 3) countSkor3 += 1;
                        else if (skor === 2) countSkor2 += 1;
                        else if (skor === 1) countSkor1 += 1;
                      }

                      return { skor, capaian };
                    });

                    // Multiplier defaults to 1 if not custom set, ensuring valid performance computation
                    const pengali = (typeof ind.bobot === 'number' && !isNaN(ind.bobot) && ind.bobot > 0) ? ind.bobot : 1;
                    const hasilKinerja = totalSkor * pengali;
                    totalKinerjaUnit += hasilKinerja;

                    return (
                      <tr key={ind.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-center text-slate-500 font-semibold">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-normal">
                          <div className="font-bold text-slate-800">{ind.nama}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Kode: <span className="font-mono text-slate-600 font-semibold">{ind.kode}</span> • Target: <span className="font-bold text-teal-600">{ind.target} {ind.satuan || '%'}</span>
                          </div>
                        </td>
                        
                        {/* 12 Months Skor */}
                        {monthlyData.map(({ skor, capaian }, i) => (
                          <td key={i} className="px-2 py-3 text-center border-x border-slate-100">
                            {skor > 0 ? (
                              <div className="flex flex-col items-center justify-center">
                                <span
                                  title={`Bulan ${months[i]}: ${capaian?.status || 'Terinput'} (Realisasi: ${capaian?.capaian ?? '-'}%)`}
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs shadow-xs transition-transform hover:scale-110 cursor-default ${
                                    skor === 3 
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                      : skor === 2 
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                                  }`}
                                >
                                  {skor}
                                </span>
                                <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                  {capaian?.capaian !== undefined ? `${Math.round(capaian.capaian)}%` : ''}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300 font-bold">-</span>
                            )}
                          </td>
                        ))}

                        {/* Total Skor */}
                        <td className="px-4 py-3 text-center font-extrabold text-slate-800 border-x border-slate-100 bg-slate-50/60">
                          {totalSkor}
                        </td>

                        {/* Pengali Input */}
                        <td className="px-3 py-3 border-r border-slate-100">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={ind.bobot !== undefined && ind.bobot !== 0 ? ind.bobot : ""}
                              onChange={(e) => handleMultiplierChange(ind.id, e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-center text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                              placeholder="1"
                              title="Rumus pengali / bobot indikator (default 1)"
                            />
                          </div>
                        </td>

                        {/* Hasil Kinerja */}
                        <td className="px-4 py-3 text-center font-black text-teal-700 bg-teal-50/40">
                          {hasilKinerja % 1 !== 0 ? hasilKinerja.toFixed(2) : hasilKinerja}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={17} className="px-4 py-8 text-center text-slate-500 font-medium">
                      Tidak ada indikator aktif untuk unit {selectedUnit}.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={16} className="px-4 py-5 text-right text-slate-700 font-extrabold">
                    TOTAL CAPAIAN KINERJA INDIKATOR {selectedUnit.toUpperCase()}:
                  </td>
                  <td className="px-4 py-5 text-center text-lg font-black text-teal-800 bg-teal-100/60 border-l border-teal-200">
                    {totalKinerjaUnit % 1 !== 0 ? totalKinerjaUnit.toFixed(2) : totalKinerjaUnit}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legend and Quality Scoring Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[11px]">
                Kategori Nilai Skor Mutu:
              </span>
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Skor 3: Tercapai (Target Terpenuhi)</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>Skor 2: Mendekati Target</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span>Skor 1: Tidak Tercapai</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <span>Tanda (-) : Belum Terinput</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              * Rumus: <strong>Hasil Kinerja = Total Nilai Capaian × Rumus Pengali</strong>
            </div>
          </div>
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
