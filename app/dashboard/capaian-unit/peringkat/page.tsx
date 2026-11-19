"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore, Capaian } from "@/lib/store";
import { 
  Award, 
  TrendingUp, 
  Trophy, 
  Medal, 
  Printer, 
  ArrowUpRight,
  BarChart3,
  Sparkles
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from "recharts";
import { motion } from "motion/react";
import { ACTIVE_MASTER_UNITS, getCanonicalUnitName, normalizeUnit } from "@/lib/units";

export default function PeringkatCapaianUnitPage() {
  const router = useRouter();
  const { indikatorList, capaianList } = useAppStore();
  
  // Filter State: Cukup Pemilihan Tahun Saja
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Helper Quality Score Calculator
  const getSkorMutu = (capaian?: Capaian | null): number => {
    if (!capaian) return 0;
    if (typeof capaian.nilai === 'number' && !isNaN(capaian.nilai) && capaian.nilai > 0) {
      return capaian.nilai;
    }
    if (capaian.status === 'Tercapai') return 3;
    if (capaian.status === 'Mendekati Target') return 2;
    if (capaian.status === 'Tidak Tercapai') return 1;

    if (typeof capaian.capaian === 'number' && typeof capaian.target === 'number' && capaian.target > 0) {
      if (capaian.capaian >= capaian.target) return 3;
      if (capaian.capaian >= capaian.target * 0.8) return 2;
      return 1;
    }
    return 0;
  };

  // Master List of all units
  const allMasterUnits = useMemo(() => {
    const fromMaster = ACTIVE_MASTER_UNITS.map(u => ({
      name: u.name,
      kategori: u.kategori
    }));
    const fromInds = indikatorList.filter(i => i.status).map(i => ({
      name: getCanonicalUnitName(i.unit),
      kategori: i.kategori || 'Penunjang Non Medis'
    }));

    const map = new Map<string, { name: string; kategori: string }>();
    [...fromMaster, ...fromInds].forEach(item => {
      if (item.name && !map.has(item.name)) {
        map.set(item.name, item);
      }
    });
    return Array.from(map.values());
  }, [indikatorList]);

  // Recapitulate and Rank all units (Peringkat 1 selalu di paling atas)
  const rankedUnits = useMemo(() => {
    const data = allMasterUnits.map(master => {
      // Find indicators for this unit
      const unitInds = indikatorList.filter(i => {
        if (!i.status) return false;
        const c1 = getCanonicalUnitName(i.unit);
        const c2 = getCanonicalUnitName(master.name);
        const n1 = normalizeUnit(i.unit);
        const n2 = normalizeUnit(master.name);
        return i.unit === master.name || c1 === c2 || (n1 && n2 && n1.id === n2.id);
      });

      let totalNilaiKinerja = 0;
      let totalLaporanMasuk = 0;
      let countSkor3 = 0;
      let countSkor2 = 0;
      let countSkor1 = 0;
      let totalRawSkor = 0;

      unitInds.forEach(ind => {
        let indTotalSkor = 0;
        for (let month = 1; month <= 12; month++) {
          const capaian = capaianList.find(c => {
            const matchInd = c.indikator_id === ind.id;
            const matchBulan = Number(c.bulan) === Number(month);
            const matchTahun = Number(c.tahun) === Number(selectedYear);
            return matchInd && matchBulan && matchTahun;
          });

          const skor = getSkorMutu(capaian);
          if (skor > 0) {
            indTotalSkor += skor;
            totalRawSkor += skor;
            totalLaporanMasuk += 1;
            if (skor === 3) countSkor3 += 1;
            else if (skor === 2) countSkor2 += 1;
            else if (skor === 1) countSkor1 += 1;
          }
        }

        const pengali = (typeof ind.bobot === 'number' && !isNaN(ind.bobot) && ind.bobot > 0) ? ind.bobot : 1;
        totalNilaiKinerja += indTotalSkor * pengali;
      });

      const indicatorCount = unitInds.length;
      const expectedReports = indicatorCount * 12;
      const kepatuhanInput = expectedReports > 0 ? Math.round((totalLaporanMasuk / expectedReports) * 100) : 0;
      const successRate = totalLaporanMasuk > 0 ? Math.round((countSkor3 / totalLaporanMasuk) * 100) : 0;
      const avgScorePerIndicator = indicatorCount > 0 ? Number((totalNilaiKinerja / indicatorCount).toFixed(1)) : 0;

      // Quality Performance Grade
      let predikat = "Belum Ada Data";
      let predikatColor = "bg-slate-100 text-slate-600 border-slate-200";
      if (totalLaporanMasuk > 0) {
        if (successRate >= 85) {
          predikat = "Sangat Baik (A)";
          predikatColor = "bg-emerald-50 text-emerald-700 border-emerald-300";
        } else if (successRate >= 70) {
          predikat = "Baik (B)";
          predikatColor = "bg-teal-50 text-teal-700 border-teal-300";
        } else if (successRate >= 50) {
          predikat = "Cukup (C)";
          predikatColor = "bg-amber-50 text-amber-700 border-amber-300";
        } else {
          predikat = "Perlu Evaluasi (D)";
          predikatColor = "bg-rose-50 text-rose-700 border-rose-300";
        }
      }

      return {
        unit: master.name,
        kategori: master.kategori,
        indicatorCount,
        totalLaporanMasuk,
        countSkor3,
        countSkor2,
        countSkor1,
        totalRawSkor,
        totalNilaiKinerja: Number(totalNilaiKinerja.toFixed(2)),
        avgScorePerIndicator,
        successRate,
        kepatuhanInput,
        predikat,
        predikatColor
      };
    });

    // Sort descending by Total Nilai Kinerja, then by Success Rate (Peringkat 1 selalu di paling atas)
    return data.sort((a, b) => {
      if (b.totalNilaiKinerja !== a.totalNilaiKinerja) {
        return b.totalNilaiKinerja - a.totalNilaiKinerja;
      }
      return b.successRate - a.successRate;
    });
  }, [allMasterUnits, indikatorList, capaianList, selectedYear]);

  // Top 3 Podium Winners
  const top1 = rankedUnits[0] || null;
  const top2 = rankedUnits[1] || null;
  const top3 = rankedUnits[2] || null;

  // Aggregate Metrics
  const totalSeluruhLaporan = rankedUnits.reduce((acc, curr) => acc + curr.totalLaporanMasuk, 0);
  const avgNilaiSeluruhUnit = rankedUnits.length > 0 
    ? Number((rankedUnits.reduce((acc, curr) => acc + curr.totalNilaiKinerja, 0) / rankedUnits.length).toFixed(1))
    : 0;
  const unitsWithData = rankedUnits.filter(u => u.totalLaporanMasuk > 0);
  const overallSuccessRate = unitsWithData.length > 0
    ? Math.round(unitsWithData.reduce((acc, curr) => acc + curr.successRate, 0) / unitsWithData.length)
    : 0;

  // Chart Data
  const chartData = rankedUnits.map(u => ({
    name: u.unit.length > 15 ? u.unit.substring(0, 15) + "..." : u.unit,
    fullName: u.unit,
    nilai: u.totalNilaiKinerja,
    ketercapaian: u.successRate
  }));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 print:p-0 print:space-y-4">
      
      {/* Header Web View */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-amber-400 rounded-xl text-white shadow-lg shadow-amber-500/30">
              <Trophy size={24} />
            </div>
            Rekapitulasi & Pemeringkatan Capaian Unit
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-sm">
            Klasifikasi peringkat kinerja dan rekapitulasi total nilai capaian indikator seluruh unit penunjang tahun {selectedYear}.
          </p>
        </div>

        {/* Print Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Printer size={16} className="text-teal-600" />
            <span>Cetak Rekapitulasi</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs (Di dalam halaman Capaian Indikator Unit) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden">
        <Link
          href="/dashboard/capaian-unit"
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
        >
          <TrendingUp size={15} />
          <span>Matriks Capaian Per Unit</span>
        </Link>
        <Link
          href="/dashboard/capaian-unit/peringkat"
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-teal-600 text-white shadow-xs"
        >
          <Award size={15} />
          <span>🏆 Rekapitulasi & Pemeringkatan Semua Unit</span>
        </Link>
      </div>

      {/* Controls: CUKUP PEMILIHAN TAHUN SAJA (Filter divisi & cari nama unit sudah dihilangkan) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Tahun Evaluasi:
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2 text-sm font-extrabold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
          >
            {[2024, 2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y}>Tahun {y}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-semibold hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
          <span>Menampilkan rekapitulasi nilai capaian seluruh {rankedUnits.length} unit penunjang</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* KHUSUS MENU PRINT: KOP SURAT RESMI & PERINGKAT 1 PALING ATAS  */}
      {/* ============================================================== */}
      <div className="hidden print:block space-y-4 mb-4">
        {/* Kop Surat Rumah Sakit */}
        <div className="text-center border-b-2 border-slate-900 pb-3">
          <h1 className="text-base font-black uppercase text-slate-900 tracking-wider">
            PEMERINTAH KOTA SUKABUMI - RSUD AL-MULK
          </h1>
          <h2 className="text-xs font-bold uppercase text-slate-700">
            SEKSI PENUNJANG MEDIS DAN NON MEDIS
          </h2>
          <p className="text-[10px] text-slate-500">
            Jl. Pelabuhan II No. KM. 6, Lembursitu, Kota Sukabumi, Jawa Barat
          </p>
          <div className="mt-3 bg-slate-100 py-1.5 border border-slate-400">
            <h3 className="text-sm font-black uppercase text-slate-900">
              REKAPITULASI & PEMERINGKATAN NILAI CAPAIAN INDIKATOR KINERJA SELURUH UNIT (TAHUN {selectedYear})
            </h3>
          </div>
        </div>

        {/* Posisi Peringkat 1 Ditempatkan di Posisi Paling Atas */}
        {top1 && (
          <div className="p-4 border-2 border-slate-900 bg-amber-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-900 block">
                  🥇 PERINGKAT 1 (TERBAIK) TAHUN {selectedYear}
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">{top1.unit}</h2>
                <p className="text-xs text-slate-700 font-bold">{top1.kategori} • {top1.indicatorCount} Indikator Kinerja</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-600 uppercase font-black tracking-wider block">Total Nilai Capaian</span>
                <span className="text-2xl font-black text-slate-900">{top1.totalNilaiKinerja} Poin</span>
                <span className="text-xs font-extrabold text-emerald-800 block mt-0.5">Ketercapaian Mutu: {top1.successRate}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top 3 Champion Podium Leaderboard (Hanya di Layar, saat Print disembunyikan karena sudah ada banner Peringkat 1 di atas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 print:hidden">
        {/* Juara 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-b from-slate-50 to-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <Medal size={64} className="text-slate-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-700 mb-3">
              <span>🥈 Peringkat 2</span>
            </div>
            <h3 className="text-lg font-black text-slate-800 truncate" title={top2?.unit || '-'}>
              {top2 ? top2.unit : '-'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">{top2?.kategori || 'Penunjang'}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Total Nilai</span>
              <span className="text-2xl font-black text-slate-700">{top2?.totalNilaiKinerja || 0}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Target Tercapai</span>
              <span className="text-sm font-bold text-teal-600">{top2?.successRate || 0}%</span>
            </div>
          </div>
        </motion.div>

        {/* Juara 1 (Utama) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-b from-amber-50 via-white to-amber-50/30 rounded-2xl border-2 border-amber-300 p-6 shadow-md relative overflow-hidden flex flex-col justify-between transform md:-translate-y-2"
        >
          <div className="absolute top-0 right-0 p-3 opacity-20">
            <Trophy size={80} className="text-amber-500" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-xs mb-3">
              <Sparkles size={13} />
              <span>🥇 Juara 1 (Terbaik)</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 truncate" title={top1?.unit || '-'}>
              {top1 ? top1.unit : '-'}
            </h3>
            <p className="text-xs text-amber-800 font-semibold">{top1?.kategori || 'Penunjang'}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-amber-700 uppercase font-black tracking-wider block">Total Nilai Kinerja</span>
              <span className="text-3xl font-black text-amber-600">{top1?.totalNilaiKinerja || 0}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-amber-700 uppercase font-black tracking-wider block">Ketercapaian Mutu</span>
              <span className="text-base font-black text-emerald-600">{top1?.successRate || 0}%</span>
            </div>
          </div>
        </motion.div>

        {/* Juara 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-b from-orange-50/40 to-white rounded-2xl border-2 border-orange-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <Medal size={64} className="text-orange-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-800 mb-3">
              <span>🥉 Peringkat 3</span>
            </div>
            <h3 className="text-lg font-black text-slate-800 truncate" title={top3?.unit || '-'}>
              {top3 ? top3.unit : '-'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">{top3?.kategori || 'Penunjang'}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Total Nilai</span>
              <span className="text-2xl font-black text-slate-700">{top3?.totalNilaiKinerja || 0}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Target Tercapai</span>
              <span className="text-sm font-bold text-teal-600">{top3?.successRate || 0}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Summary Statistical Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium print:grid-cols-4 print:gap-2">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs space-y-1 print:p-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Unit Dievaluasi</span>
          <div className="text-xl font-black text-slate-800">{rankedUnits.length} Unit</div>
          <p className="text-[10px] text-slate-500">Seluruh unit penunjang aktif</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs space-y-1 print:p-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rata-rata Nilai Unit</span>
          <div className="text-xl font-black text-teal-600">{avgNilaiSeluruhUnit} Poin</div>
          <p className="text-[10px] text-slate-500">Benchmark nilai penunjang</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs space-y-1 print:p-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rasio Mutu Tercapai</span>
          <div className="text-xl font-black text-emerald-600">{overallSuccessRate}%</div>
          <p className="text-[10px] text-slate-500">Persentase indikator Skor 3</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs space-y-1 print:p-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Laporan Masuk</span>
          <div className="text-xl font-black text-slate-800">{totalSeluruhLaporan} Laporan</div>
          <p className="text-[10px] text-slate-500">Tercatat tahun {selectedYear}</p>
        </div>
      </div>

      {/* Main Ranking Table (Peringkat 1 Berada di Paling Atas Baris 1) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden space-y-3 print:border print:border-slate-300">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 print:p-3">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <span>Tabel Klasemen Pemeringkatan Kinerja Unit</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-teal-50 text-teal-700 print:bg-slate-100 print:text-slate-800">
                Tahun {selectedYear}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Urutan berdasarkan Total Nilai Capaian Kinerja (Akumulasi Skor Mutu × Rumus Pengali).
            </p>
          </div>
          <div className="text-xs font-bold text-slate-500 print:hidden">
            Total {rankedUnits.length} Unit Penunjang
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[1000px] print:min-w-full">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider border-b border-slate-200 print:bg-slate-100">
              <tr>
                <th className="px-4 py-3.5 text-center w-16">Peringkat</th>
                <th className="px-5 py-3.5">Unit Penunjang</th>
                <th className="px-4 py-3.5 text-center">Jml Indikator</th>
                <th className="px-4 py-3.5 text-center">Laporan Masuk</th>
                <th className="px-4 py-3.5 text-center">Komposisi Skor (3 / 2 / 1)</th>
                <th className="px-4 py-3.5 text-center">% Tercapai</th>
                <th className="px-5 py-3.5 text-center bg-teal-50/70 text-teal-900 font-black print:bg-slate-100">
                  Total Nilai Kinerja
                </th>
                <th className="px-4 py-3.5 text-center">Predikat Mutu</th>
                <th className="px-4 py-3.5 text-center print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {rankedUnits.map((u, idx) => {
                const rankNumber = idx + 1;
                return (
                  <tr 
                    key={u.unit} 
                    className={`hover:bg-slate-50/80 transition-colors ${
                      rankNumber === 1 ? 'bg-amber-50/30 font-semibold print:bg-amber-50/20' : ''
                    }`}
                  >
                    {/* Peringkat Badge (Peringkat 1 paling atas) */}
                    <td className="px-4 py-3.5 text-center">
                      {rankNumber === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white font-black text-xs shadow-xs print:border print:border-amber-600 print:text-black">
                          1
                        </span>
                      ) : rankNumber === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-black text-xs">
                          2
                        </span>
                      ) : rankNumber === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-300 text-orange-900 font-black text-xs">
                          3
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold text-xs">
                          {rankNumber}
                        </span>
                      )}
                    </td>

                    {/* Nama Unit & Kategori */}
                    <td className="px-5 py-3.5">
                      <div className="font-extrabold text-slate-800 text-sm">{u.unit}</div>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 ${
                        u.kategori === 'Penunjang Medis' 
                          ? 'bg-blue-50 text-blue-700 print:bg-slate-50' 
                          : 'bg-purple-50 text-purple-700 print:bg-slate-50'
                      }`}>
                        {u.kategori}
                      </span>
                    </td>

                    {/* Jumlah Indikator */}
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                      {u.indicatorCount} KPI
                    </td>

                    {/* Laporan Masuk */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-slate-800">{u.totalLaporanMasuk}</span>
                      <span className="text-slate-400 text-[10px] block">Bulan Terisi</span>
                    </td>

                    {/* Komposisi Skor (3 / 2 / 1) */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5 font-bold">
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px]" title="Skor 3: Tercapai">
                          {u.countSkor3}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px]" title="Skor 2: Mendekati">
                          {u.countSkor2}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px]" title="Skor 1: Tidak Tercapai">
                          {u.countSkor1}
                        </span>
                      </div>
                    </td>

                    {/* % Tercapai */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="w-24 mx-auto space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span>{u.successRate}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden print:border print:border-slate-300">
                          <div 
                            className={`h-full rounded-full ${
                              u.successRate >= 80 ? 'bg-emerald-500' : u.successRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`} 
                            style={{ width: `${u.successRate}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Total Nilai Kinerja (Basis Penentu Peringkat Utama) */}
                    <td className="px-5 py-3.5 text-center bg-teal-50/50 print:bg-slate-50">
                      <span className="text-base font-black text-teal-800 print:text-black">
                        {u.totalNilaiKinerja}
                      </span>
                      <span className="text-[10px] text-teal-600 block font-semibold print:text-slate-600">Poin Akumulasi</span>
                    </td>

                    {/* Predikat Mutu */}
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${u.predikatColor}`}>
                        {u.predikat}
                      </span>
                    </td>

                    {/* Aksi Button */}
                    <td className="px-4 py-3.5 text-center print:hidden">
                      <button
                        onClick={() => {
                          router.push(`/dashboard/capaian-unit`);
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 font-bold rounded-lg text-xs transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Matriks</span>
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Bar Chart: Perbandingan Total Nilai Antar Unit (Hanya Layar Web) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 print:hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <BarChart3 size={18} className="text-teal-600" />
              <span>Grafik Perbandingan Total Nilai Capaian Kinerja Unit</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
              Urutan dari nilai tertinggi hingga terendah (Tahun {selectedYear})
            </p>
          </div>
          <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg">
            Nilai Poin
          </span>
        </div>

        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height={280} minWidth={0}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={10} 
                fontWeight="bold" 
                angle={-25} 
                textAnchor="end" 
                interval={0}
              />
              <YAxis stroke="#94a3b8" fontSize={11} fontWeight="bold" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                formatter={(val: any, name: any, item: any) => [
                  `${val} Poin (${item?.payload?.ketercapaian || 0}% Tercapai)`,
                  'Total Nilai Kinerja'
                ]}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
              />
              <Bar dataKey="nilai" name="Total Nilai Kinerja" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#fb923c' : '#0d9488'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lembar Tanda Tangan Khusus Hasil Cetak Print */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-8 text-xs text-slate-800">
        <div className="text-center space-y-16">
          <p>Mengetahui,<br/><strong>Kepala Seksi Penunjang Medis & Non Medis</strong></p>
          <div>
            <p className="font-bold underline">Bono Andi, S.Kep., Ners</p>
            <p className="text-[10px] text-slate-600">NIP. 19820415 200801 1 005</p>
          </div>
        </div>

        <div className="text-center space-y-16">
          <p>Sukabumi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/><strong>Petugas Evaluasi Kinerja</strong></p>
          <div>
            <p className="font-bold underline">Asep Andi, A.Md.Kes</p>
            <p className="text-[10px] text-slate-600">Pengelola Data Kinerja</p>
          </div>
        </div>
      </div>

      {/* Scoring Explanation Footnote */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-1.5 print:hidden">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
          <Sparkles size={14} className="text-teal-600" />
          <span>Dasar Perhitungan Pemeringkatan Kinerja:</span>
        </h4>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500">
          <li>
            <strong>Total Nilai Kinerja</strong> dihitung dari akumulasi bulanan: <code>Total Nilai = &Sigma; (Total Skor Mutu Indikator &times; Rumus Pengali)</code>.
          </li>
          <li>
            <strong>Komposisi Skor Mutu</strong> per bulan: Skor 3 (Tercapai / Hijau), Skor 2 (Mendekati Target / Kuning), Skor 1 (Tidak Tercapai / Merah).
          </li>
          <li>
            Unit diurutkan secara obyektif berdasarkan akumulasi nilai capaian kinerja tertinggi hingga terendah.
          </li>
        </ul>
      </div>
    </div>
  );
}
