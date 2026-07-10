"use client";

import { useAppStore, determineStatus, Capaian } from "@/lib/store";
import { useEffect, useState } from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FileSpreadsheet, 
  Users, 
  Clock, 
  ArrowUpRight, 
  Plus,
  Activity,
  Award,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function DashboardPage() {
  const { indikatorList, capaianList, supervisiList, currentUser, pengaturan } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [selectedBulan, setSelectedBulan] = useState(3); // March (seeded latest)
  const [selectedTahun, setSelectedTahun] = useState(2026);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const namaRS = pengaturan?.nama_rs || 'RSUD Al-Mulk';
  const mediaType = pengaturan?.dashboard_media_type || 'image';
  const mediaUrl = pengaturan?.dashboard_media_url || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200';
  const bannerTitle = pengaturan?.dashboard_banner_title || 'Portal Analisis Kinerja Pelayanan Seksi Penunjang';
  const bannerSubtitle = pengaturan?.dashboard_banner_subtitle || 'Sistem Informasi Pemantauan Aktivitas Kinerja Rumah Sakit (SIPAKAR)';

  // Monthly stats calculations based on selectedBulan and selectedTahun
  const totalIndikatorCount = indikatorList.filter(i => i.status).length;
  
  // Filter achievements for selected period (only active indicators)
  const monthlyCapaian = capaianList.filter(c => {
    const ind = indikatorList.find(i => i.id === c.indikator_id);
    return c.bulan === selectedBulan && c.tahun === selectedTahun && ind?.status;
  });
  const submittedMonthlyCapaian = monthlyCapaian.filter(c => c.status_submit === 'Submitted');
  
  // Compliance Rate
  const compliancePercentage = totalIndikatorCount > 0 
    ? Math.round((submittedMonthlyCapaian.length / totalIndikatorCount) * 100) 
    : 0;

  // Achieved vs Not Achieved (from submitted)
  const achievedCapaian = submittedMonthlyCapaian.filter(c => c.status === 'Tercapai');
  const mendekatiCapaian = submittedMonthlyCapaian.filter(c => c.status === 'Mendekati Target');
  const gagalCapaian = submittedMonthlyCapaian.filter(c => c.status === 'Tidak Tercapai');

  // Units with delayed input (Units that have indicators but no SUBMITTED capaian for selected month)
  const allUnits = Array.from(new Set(indikatorList.filter(i => i.status).map(ind => ind.unit)));
  const submittedUnitsForMonth = Array.from(new Set(
    submittedMonthlyCapaian.map(c => {
      const ind = indikatorList.find(i => i.id === c.indikator_id);
      return ind && ind.status ? ind.unit : null;
    }).filter(Boolean)
  ));
  const delayedUnits = allUnits.filter(u => !submittedUnitsForMonth.includes(u));

  // --- CHART 1: Monthly Average KPI Trend (Jan - Dec 2026) ---
  const monthsList = [
    { num: 1, label: 'Jan' },
    { num: 2, label: 'Feb' },
    { num: 3, label: 'Mar' },
    { num: 4, label: 'Apr' },
    { num: 5, label: 'Mei' },
    { num: 6, label: 'Jun' }
  ];

  const trendData = monthsList.map(m => {
    const caps = capaianList.filter(c => {
      const ind = indikatorList.find(i => i.id === c.indikator_id);
      return c.bulan === m.num && c.tahun === 2026 && c.status_submit === 'Submitted' && ind?.status;
    });
    const avg = caps.length > 0 
      ? Math.round(caps.reduce((sum, current) => sum + current.capaian, 0) / caps.length)
      : 0;
    return {
      name: m.label,
      capaian: avg || null,
      target: 95 // generic target benchmark
    };
  });

  // --- CHART 2: Peringkat Total Capaian Indikator Unit ---
  const unitTotalCapaianData = allUnits.map(unit => {
    // find indicators of this unit
    const unitInds = indikatorList.filter(i => i.unit === unit && i.status);
    
    let totalKinerjaUnit = 0;
    unitInds.forEach(ind => {
      let totalSkor = 0;
      // loop through 12 months for the selected year
      for (let month = 1; month <= 12; month++) {
        const capaian = capaianList.find(
          c => c.indikator_id === ind.id && c.bulan === month && c.tahun === selectedTahun
        );
        totalSkor += capaian?.nilai || 0;
      }
      const pengali = ind.bobot !== undefined ? ind.bobot : 0;
      totalKinerjaUnit += totalSkor * pengali;
    });

    return {
      unit,
      totalCapaian: Number(totalKinerjaUnit.toFixed(2)),
      indicatorCount: unitInds.length
    };
  }).sort((a, b) => b.totalCapaian - a.totalCapaian);

  // --- CHART 3: Input Compliance Trend by Month ---
  const complianceTrendData = monthsList.map(m => {
    const caps = capaianList.filter(c => {
      const ind = indikatorList.find(i => i.id === c.indikator_id);
      return c.bulan === m.num && c.tahun === 2026 && c.status_submit === 'Submitted' && ind?.status;
    });
    const rate = totalIndikatorCount > 0 
      ? Math.round((caps.length / totalIndikatorCount) * 100)
      : 0;
    return {
      name: m.label,
      "Tingkat Kepatuhan (%)": rate
    };
  });

  // --- CHART 4: Status KPI pie distribution ---
  const statusDistributionData = [
    { name: 'Tercapai', value: achievedCapaian.length, color: '#10B981' },
    { name: 'Mendekati', value: mendekatiCapaian.length, color: '#F59E0B' },
    { name: 'Tidak Tercapai', value: gagalCapaian.length, color: '#EF4444' }
  ].filter(d => d.value > 0);

  // Default if empty
  const statusPieData = statusDistributionData.length > 0 
    ? statusDistributionData 
    : [{ name: 'Belum Ada Data', value: 1, color: '#94A3B8' }];

  const monthsNameMap: { [key: number]: string } = {
    1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April', 5: 'Mei', 6: 'Juni',
    7: 'Juli', 8: 'Agustus', 9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
  };

  // --- KEPATUHAN PENGINPUTAN BERDASARKAN UNIT DI BAWAH TANGGAL 10 ---
  const monthlyUnitCompliance = allUnits.map(unit => {
    const unitInds = indikatorList.filter(ind => ind.unit === unit && ind.status);
    const totalCount = unitInds.length;
    
    if (totalCount === 0) {
      return {
        unit,
        percentage: 0,
        compliant: 0,
        late: 0,
        missing: 0,
        total: 0,
        details: [] as { kode: string; nama: string; status: 'PATUH' | 'TERLAMBAT' | 'BELUM'; tglSubmit: string }[]
      };
    }
    
    let compliantCount = 0;
    let lateCount = 0;
    let missingCount = 0;
    
    const details = unitInds.map(ind => {
      const cap = capaianList.find(c => c.indikator_id === ind.id && c.bulan === selectedBulan && c.tahun === selectedTahun);
      let status: 'PATUH' | 'TERLAMBAT' | 'BELUM' = 'BELUM';
      let tglSubmit = '';
      
      if (cap && cap.status_submit === 'Submitted') {
        const dateObj = new Date(cap.created_at);
        const day = dateObj.getDate();
        tglSubmit = `${day} ${monthsNameMap[selectedBulan]}`;
        if (day < 10) {
          status = 'PATUH';
          compliantCount++;
        } else {
          status = 'TERLAMBAT';
          lateCount++;
        }
      } else {
        missingCount++;
      }
      
      return {
        kode: ind.kode,
        nama: ind.nama,
        status,
        tglSubmit
      };
    });
    
    const percentage = Math.round((compliantCount / totalCount) * 100);
    
    return {
      unit,
      percentage,
      compliant: compliantCount,
      late: lateCount,
      missing: missingCount,
      total: totalCount,
      details
    };
  }).sort((a, b) => b.percentage - a.percentage || b.compliant - a.compliant);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Cinematic Media Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/50 min-h-[180px] sm:min-h-[220px] bg-slate-950 flex flex-col justify-end p-6 sm:p-8">
        {/* Media elements */}
        {mediaType === 'video' ? (
          <video
            key={mediaUrl}
            src={mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        ) : (
          <img
            src={mediaUrl}
            alt="Dashboard Banner background"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200';
            }}
          />
        )}

        {/* Ambient Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

        {/* Content with Glassmorphism overlay card */}
        <div className="relative z-10 max-w-3xl space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00A8A8]/20 border border-[#00A8A8]/30 text-teal-300 text-[10px] uppercase tracking-widest font-extrabold rounded-full backdrop-blur-md">
            <Sparkles size={11} className="animate-pulse text-[#00A8A8]" />
            <span>Sistem Informasi Pemantauan Aktivitas Kinerja Rumah Sakit (SIPAKAR)</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
            {bannerTitle}
          </h2>
          
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed drop-shadow-sm">
            {bannerSubtitle}
          </p>

          <div className="pt-2 flex flex-wrap gap-x-4 gap-y-2 text-[10px] sm:text-xs font-bold text-[#00A8A8]">
            <span>Rumah Sakit: <strong className="text-white">{namaRS}</strong></span>
            <span className="text-slate-500">•</span>
            <span>Status Media: <strong className="text-white uppercase">{mediaType === 'image' ? 'Gambar Statis' : 'Video Sinematik'}</strong></span>
          </div>
        </div>
      </div>
      
      {/* Page Title & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Capaian Kinerja Eksekutif</h1>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan data untuk periode <strong className="text-teal-600">{monthsNameMap[selectedBulan]} {selectedTahun}</strong>
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(Number(e.target.value))}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {Object.entries(monthsNameMap).map(([num, name]) => (
              <option key={num} value={num}>{name}</option>
            ))}
          </select>

          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(Number(e.target.value))}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>

          {currentUser && (currentUser.role === 'Kepala Unit' || currentUser.role === 'Super Admin') && (
            <Link
              href="/dashboard/input"
              className="px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:from-teal-400 hover:to-emerald-400 rounded-lg text-xs font-black flex items-center gap-1 shadow-sm uppercase tracking-wide shrink-0 transition-all"
            >
              <Plus size={14} />
              <span>Input Realisasi</span>
            </Link>
          )}
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        
        {/* Total Indicators */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total KPI</span>
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800">{totalIndikatorCount}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Indikator penunjang aktif</p>
          </div>
        </div>

        {/* Inputs Received */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Laporan Masuk</span>
            <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center">
              <FileSpreadsheet size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800">
              {submittedMonthlyCapaian.length} <span className="text-xs text-slate-400 font-bold">/ {totalIndikatorCount}</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Termasuk draf: {monthlyCapaian.length}</p>
          </div>
        </div>

        {/* Compliance percentage */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Kepatuhan Input</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              compliancePercentage >= 90 ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
            }`}>
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-black ${
              compliancePercentage >= 90 ? 'text-green-600' : 'text-yellow-600'
            }`}>{compliancePercentage}%</h3>
            <p className="text-[10px] text-slate-400 mt-1">Kepatuhan pelaporan unit</p>
          </div>
        </div>

        {/* Achieved Indicators */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Status Tercapai</span>
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-emerald-600">
              {achievedCapaian.length} <span className="text-xs text-slate-400 font-bold">KPI</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Realisasi &ge; Target kinerja</p>
          </div>
        </div>

        {/* Underachieved/Alert Indicators */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Status Kurang</span>
            <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
              <XCircle size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-red-600">
              {gagalCapaian.length} <span className="text-xs text-slate-400 font-semibold">KPI</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Mendekati target: {mendekatiCapaian.length}</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Trend Line Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Tren Capaian Realisasi KPI Bulanan</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Januari - Juni 2026 (Kumulatif Seluruh Unit)</p>
            </div>
            <span className="px-2 py-0.5 bg-teal-50 text-teal-600 text-[10px] font-black rounded uppercase">Rata-rata</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" fontWeight="bold" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="capaian" name="Rata-rata Realisasi" stroke="#00A8A8" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4, strokeWidth: 2 }} />
                <Line type="monotone" dataKey="target" name="Standar Target RS" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Distribusi Status KPI</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Proporsi Bulan {monthsNameMap[selectedBulan]}</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} KPI`, 'Jumlah']} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute text-center">
              <span className="text-2xl font-black text-slate-800">{submittedMonthlyCapaian.length}</span>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Total Laporan</p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-semibold">
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
                <span>Tercapai (Realisasi &ge; Target)</span>
              </div>
              <span className="font-bold text-slate-800">{achievedCapaian.length}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" />
                <span>Mendekati (Selisih &le; 10%)</span>
              </div>
              <span className="font-bold text-slate-800">{mendekatiCapaian.length}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block" />
                <span>Tidak Tercapai</span>
              </div>
              <span className="font-bold text-slate-800">{gagalCapaian.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Unit Performance Ranking */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm">Peringkat Total Capaian Indikator Unit</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
              Berdasarkan Akumulasi Nilai Capaian Kinerja ({selectedTahun})
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitTotalCapaianData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="unit" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" allowDecimals={true} domain={[0, 'auto']} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs font-semibold space-y-1">
                          <p className="font-extrabold text-teal-300">{data.unit}</p>
                          <p className="text-[10px] text-emerald-400">Total Nilai Capaian: <strong className="text-white text-xs">{data.totalCapaian}</strong></p>
                          <p className="text-[10px] text-slate-300">Jumlah Indikator: {data.indicatorCount} KPI</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalCapaian" radius={[6, 6, 0, 0]}>
                  {unitTotalCapaianData.map((entry, index) => {
                    let barColor = '#00A8A8';
                    if (index === 0 && entry.totalCapaian > 0) {
                      barColor = '#10B981';
                    } else if (entry.totalCapaian === 0) {
                      barColor = '#EF4444';
                    }
                    return <Cell key={`cell-${index}`} fill={barColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kepatuhan Penginputan Bulanan Berdasarkan Unit */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-slate-800 text-sm">Persentase Kepatuhan Unit (Bulan Ini)</h3>
              <span className="px-2 py-0.5 bg-teal-50 text-teal-600 text-[10px] font-black rounded uppercase">Cut-off: &lt; Tanggal 10</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">
              Kepatuhan Pengisian Realisasi sebelum Tanggal 10 {monthsNameMap[selectedBulan]} {selectedTahun}
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyUnitCompliance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="unit" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" unit="%" domain={[0, 100]} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs font-semibold space-y-1">
                          <p className="font-extrabold text-teal-300">{data.unit}</p>
                          <p className="text-[10px] text-slate-300">Tingkat Kepatuhan: <strong className="text-white text-xs">{data.percentage}%</strong></p>
                          <p className="text-[10px] text-emerald-400">Tepat Waktu: {data.compliant} KPI</p>
                          <p className="text-[10px] text-amber-400">Terlambat (&ge; Tgl 10): {data.late} KPI</p>
                          <p className="text-[10px] text-rose-400">Belum Penginputan: {data.missing} KPI</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                  {monthlyUnitCompliance.map((entry, index) => {
                    let barColor = "#EF4444"; // Red (0%)
                    if (entry.percentage === 100) {
                      barColor = "#10B981"; // Green (100%)
                    } else if (entry.percentage > 0) {
                      barColor = "#F59E0B"; // Amber (partial)
                    }
                    return <Cell key={`cell-${index}`} fill={barColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Unit list with expansion toggles */}
          <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 max-h-56 overflow-y-auto pr-1">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase mb-1">Rincian & Status Kepatuhan Unit:</p>
            {monthlyUnitCompliance.map((unitData) => {
              const isOpen = expandedUnit === unitData.unit;
              return (
                <div key={unitData.unit} className="border border-slate-100 rounded-xl overflow-hidden transition-all bg-slate-50/30">
                  <button
                    onClick={() => setExpandedUnit(isOpen ? null : unitData.unit)}
                    className="w-full flex items-center justify-between p-2.5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        unitData.percentage === 100 
                          ? 'bg-emerald-500' 
                          : unitData.percentage > 0 
                            ? 'bg-amber-500' 
                            : 'bg-rose-500'
                      }`} />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">{unitData.unit}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                          {unitData.compliant} dari {unitData.total} Tepat Waktu
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                        unitData.percentage === 100 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : unitData.percentage > 0 
                            ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {unitData.percentage}%
                      </span>
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="bg-white border-t border-slate-100 p-3 space-y-2 text-[11px]">
                      {unitData.details.length === 0 ? (
                        <p className="text-slate-400 italic">Tidak ada indikator terdaftar untuk unit ini.</p>
                      ) : (
                        unitData.details.map((detail, dIdx) => (
                          <div key={dIdx} className="flex items-start justify-between gap-3 pb-1.5 border-b border-slate-50 last:border-0 last:pb-0">
                            <div className="min-w-0 space-y-0.5">
                              <p className="font-extrabold text-slate-700 truncate">[{detail.kode}] {detail.nama}</p>
                              {detail.tglSubmit && (
                                <p className="text-[9px] text-slate-400 font-medium">Diinput pada: <strong className="text-slate-600">{detail.tglSubmit}</strong></p>
                              )}
                            </div>
                            <span className={`shrink-0 px-1.5 py-0.5 text-[8px] font-black rounded uppercase ${
                              detail.status === 'PATUH'
                                ? 'bg-emerald-100 text-emerald-800'
                                : detail.status === 'TERLAMBAT'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                            }`}>
                              {detail.status === 'PATUH' ? 'Tepat Waktu (<10)' : detail.status === 'TERLAMBAT' ? 'Terlambat (>=10)' : 'Belum Input'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Exception Monitoring (Late inputs & Active Supervisi) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Late units warning list */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <AlertTriangle className="text-amber-500 w-4 h-4 shrink-0" />
                <span>Unit Belum Melapor Bulan Ini</span>
              </h3>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded uppercase">Evaluasi Kepatuhan</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Daftar unit kerja Seksi Penunjang yang belum melakukan kirim/submit data realisasi kinerja pada bulan <strong>{monthsNameMap[selectedBulan]} {selectedTahun}</strong>:
            </p>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {delayedUnits.length === 0 ? (
                <div className="text-center p-6 bg-green-50 border border-green-100 rounded-xl">
                  <CheckCircle className="text-green-600 w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs font-bold text-green-800">Hebat! Semua Unit Sudah Melapor</p>
                  <p className="text-[10px] text-green-600 mt-0.5">Tingkat kepatuhan seksi mencapai 100%.</p>
                </div>
              ) : (
                delayedUnits.map((u, idx) => {
                  const masterCount = indikatorList.filter(i => i.unit === u && i.status).length;
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50/50 hover:bg-red-50 border border-red-100/50 rounded-xl transition-all">
                      <div className="flex items-center space-x-3">
                        <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">{u}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Seksi Penunjang</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 bg-red-100 text-red-700 rounded-md">
                        {masterCount} Indikator Terhambat
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href="/dashboard/laporan"
              className="w-full block text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-extrabold rounded-lg transition-colors border"
            >
              Kirim Pengingat Input KPI &rarr;
            </Link>
          </div>
        </div>

        {/* Hot Supervisi Bulletins */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Status Supervisi Mutu Terkini</h3>
              <Link href="/dashboard/supervisi" className="text-xs font-bold text-[#00A8A8] hover:underline flex items-center gap-0.5">
                <span>Kelola Supervisi</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="space-y-3.5">
              {supervisiList.slice(0, 3).map((sup) => (
                <div key={sup.id} className="p-3.5 bg-slate-50 hover:bg-gray-50 border border-gray-100 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-extrabold text-slate-800">{sup.unit}</p>
                      <span className="text-[10px] text-slate-400 font-bold">&bull; {new Date(sup.tanggal).toLocaleDateString('id-ID')}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 italic">
                      &quot;{sup.temuan}&quot;
                    </p>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Deadline: <strong className="text-slate-600">{sup.deadline ? new Date(sup.deadline).toLocaleDateString('id-ID') : '-'}</strong>
                    </div>
                  </div>

                  <span className={`inline-block self-start sm:self-auto px-2.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wide ${
                    sup.status === 'Selesai' 
                      ? 'bg-green-100 text-green-700' 
                      : sup.status === 'Proses' 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {sup.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Total Aktif: {supervisiList.filter(s => s.status !== 'Selesai').length} kasus</span>
            <span>Rasio Penyelesaian: {Math.round((supervisiList.filter(s => s.status === 'Selesai').length / supervisiList.length) * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
