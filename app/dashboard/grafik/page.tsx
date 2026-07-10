"use client";

import { useState, useEffect } from "react";
import { useAppStore, Indikator, Capaian } from "@/lib/store";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertTriangle, 
  Lightbulb, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Filter, 
  Activity,
  Layers,
  ArrowRight,
  Sparkles
} from "lucide-react";
import Swal from "sweetalert2";

export default function GrafikCapaianPage() {
  const { indikatorList, capaianList } = useAppStore();
  const [mounted, setMounted] = useState(false);

  // Filters
  const [selectedTahun, setSelectedTahun] = useState(2026);
  const [selectedUnit, setSelectedUnit] = useState("Semua Unit");
  const [selectedKategori, setSelectedKategori] = useState("Semua Kategori");

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

  const allUnits = Array.from(new Set(indikatorList.filter(i => i.status).map(ind => ind.unit)));
  const monthsList = [
    { num: 1, name: "Januari", short: "Jan" },
    { num: 2, name: "Februari", short: "Feb" },
    { num: 3, name: "Maret", short: "Mar" },
    { num: 4, name: "April", short: "Apr" },
    { num: 5, name: "Mei", short: "Mei" },
    { num: 6, name: "Juni", short: "Jun" }
  ];

  // Apply filters on capaian & indicators (only active ones)
  const filteredInds = indikatorList.filter(ind => {
    const matchesUnit = selectedUnit === "Semua Unit" || ind.unit === selectedUnit;
    const matchesKategori = selectedKategori === "Semua Kategori" || ind.kategori === selectedKategori;
    return matchesUnit && matchesKategori && ind.status;
  });

  const filteredIndIds = filteredInds.map(i => i.id);

  const filteredCapaians = capaianList.filter(cap => {
    const matchesYear = cap.tahun === selectedTahun;
    const matchesInd = filteredIndIds.includes(cap.indikator_id);
    const matchesSubmit = cap.status_submit === 'Submitted';
    return matchesYear && matchesInd && matchesSubmit;
  });

  // 1. Line Chart: Trend KPI Bulanan
  const lineChartData = monthsList.map(m => {
    const caps = filteredCapaians.filter(c => c.bulan === m.num);
    const avg = caps.length > 0 
      ? Math.round(caps.reduce((sum, curr) => sum + curr.capaian, 0) / caps.length)
      : null;
    return {
      name: m.short,
      realisasi: avg,
      target: 95
    };
  });

  // 2. Bar Chart: Capaian per Unit
  const barChartData = allUnits.map(unit => {
    const unitIndIds = indikatorList.filter(i => i.unit === unit && i.status).map(i => i.id);
    const unitCaps = capaianList.filter(c => 
      unitIndIds.includes(c.indikator_id) && 
      c.tahun === selectedTahun && 
      c.status_submit === 'Submitted'
    );
    const avg = unitCaps.length > 0
      ? Math.round(unitCaps.reduce((sum, curr) => sum + curr.capaian, 0) / unitCaps.length)
      : 0;
    return {
      unit,
      capaian: avg
    };
  }).sort((a, b) => b.capaian - a.capaian);

  // 3. Pie Chart: Status KPI
  const statusCounts = {
    Tercapai: filteredCapaians.filter(c => c.status === 'Tercapai').length,
    Mendekati: filteredCapaians.filter(c => c.status === 'Mendekati Target').length,
    Gagal: filteredCapaians.filter(c => c.status === 'Tidak Tercapai').length,
  };

  const pieChartData = [
    { name: 'Tercapai', value: statusCounts.Tercapai, color: '#10B981' },
    { name: 'Mendekati Target', value: statusCounts.Mendekati, color: '#F59E0B' },
    { name: 'Tidak Tercapai', value: statusCounts.Gagal, color: '#EF4444' }
  ].filter(d => d.value > 0);

  // 4. Heatmap Kepatuhan Penginputan (Tabular Grid Month vs Unit)
  // Maps out submission rate for each unit on each month (e.g. 100% Green, 0% Red)
  const getComplianceStatus = (unit: string, month: number) => {
    const unitInds = indikatorList.filter(i => i.unit === unit && i.status);
    if (unitInds.length === 0) return 'neutral';
    const unitIndIds = unitInds.map(i => i.id);
    const submitted = capaianList.filter(c => 
      unitIndIds.includes(c.indikator_id) && 
      c.bulan === month && 
      c.tahun === selectedTahun && 
      c.status_submit === 'Submitted'
    );
    if (submitted.length === unitInds.length) return 'complete'; // All submitted
    if (submitted.length > 0) return 'partial'; // Some submitted
    return 'none'; // None submitted
  };

  // 5. Leaderboard Rankings
  const topUnits = [...barChartData].slice(0, 3);
  const bottomUnits = [...barChartData].filter(u => u.capaian > 0).slice(-3).reverse();

  // 6. Automatic Executive Analysis Calculations
  const bestUnit = barChartData[0]?.capaian > 0 ? barChartData[0] : null;
  const worstUnit = barChartData[barChartData.length - 1]?.capaian > 0 ? barChartData[barChartData.length - 1] : null;

  // Find most frequently failed indicator
  const failedKpisMap: { [key: string]: { count: number; name: string; code: string } } = {};
  capaianList.filter(c => c.status === 'Tidak Tercapai' && c.status_submit === 'Submitted').forEach(c => {
    const ind = indikatorList.find(i => i.id === c.indikator_id);
    if (ind && ind.status) {
      if (!failedKpisMap[ind.id]) {
        failedKpisMap[ind.id] = { count: 0, name: ind.nama, code: ind.kode };
      }
      failedKpisMap[ind.id].count += 1;
    }
  });

  const mostFailedKpi = Object.values(failedKpisMap).sort((a, b) => b.count - a.count)[0];

  const overallSubmittedCount = filteredCapaians.length;
  const overallExpectedCount = filteredInds.length * monthsList.length;
  const overallComplianceRate = overallExpectedCount > 0 
    ? Math.round((overallSubmittedCount / overallExpectedCount) * 100)
    : 0;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Grafik Analisis & Performa</h2>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi tingkat kepatuhan input dan realisasi capaian indikator kinerja
          </p>
        </div>

        {/* Real-time Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Filter size={14} className="text-[#00A8A8]" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(Number(e.target.value))}
            className="px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>

          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="Semua Unit">Semua Unit</option>
            {allUnits.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>

          <select
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="Semua Kategori">Semua Divisi</option>
            <option value="Penunjang Medis">Penunjang Medis</option>
            <option value="Penunjang Non Medis">Penunjang Non Medis</option>
          </select>
        </div>
      </div>

      {/* Narrative Executive Analysis Card */}
      <div className="bg-gradient-to-tr from-slate-900 to-teal-950 p-6 rounded-2xl border border-slate-800 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-bl-full" />
        
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-1.5 bg-teal-500/20 rounded-lg text-teal-400">
            <Sparkles size={16} />
          </div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider">Hasil Analisis Kinerja Otomatis</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-slate-300">
          <div className="space-y-1 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Kepatuhan Seksi</p>
            <h4 className="text-xl font-black text-teal-400">{overallComplianceRate}%</h4>
            <p className="text-[10px] text-slate-400 leading-normal mt-1">Total {overallSubmittedCount} laporan realisasi dari {overallExpectedCount} target pengisian.</p>
          </div>

          <div className="space-y-1 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Unit Terbaik</p>
            <h4 className="text-xl font-black text-emerald-400 truncate" title={bestUnit?.unit || "Belum Ada"}>
              {bestUnit ? bestUnit.unit : 'Tidak Ada Data'}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Capaian rata-rata KPI: <strong className="text-emerald-400">{bestUnit ? `${bestUnit.capaian}%` : '-'}</strong></p>
          </div>

          <div className="space-y-1 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Unit Terendah</p>
            <h4 className="text-xl font-black text-red-400 truncate" title={worstUnit?.unit || "Belum Ada"}>
              {worstUnit ? worstUnit.unit : 'Tidak Ada Data'}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Capaian rata-rata KPI: <strong className="text-red-400">{worstUnit ? `${worstUnit.capaian}%` : '-'}</strong></p>
          </div>

          <div className="space-y-1 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Indikator Terkendala</p>
            <h4 className="text-sm font-black text-amber-400 truncate" title={mostFailedKpi?.name || "Aman"}>
              {mostFailedKpi ? `${mostFailedKpi.code} - ${mostFailedKpi.name}` : 'Aman (0 Gagal)'}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Terjadi <strong className="text-amber-400">{mostFailedKpi ? mostFailedKpi.count : 0} kali</strong> ketidaktercapaian target.</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Line Chart: Trend KPI */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm">Grafik Tren Realisasi KPI</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Januari - Juni {selectedTahun} ({selectedUnit})</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" fontWeight="bold" />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="realisasi" name="Rata-rata Realisasi" stroke="#00A8A8" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="target" name="Standar Target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Status Dist */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Distribusi Status Capaian</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Proporsi target tahun {selectedTahun}</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            {pieChartData.length === 0 ? (
              <div className="text-center text-slate-400 font-bold text-xs p-6">
                Belum ada data realisasi terinput untuk tahun ini.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} KPI`, 'Jumlah']} />
                </PieChart>
              </ResponsiveContainer>
            )}

            {pieChartData.length > 0 && (
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-800">{filteredCapaians.length}</span>
                <p className="text-[9px] text-slate-400 font-bold uppercase">KPI Terkirim</p>
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-xs font-semibold">
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
                <span>Tercapai</span>
              </div>
              <span className="font-bold text-slate-800">{statusCounts.Tercapai} KPI</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" />
                <span>Mendekati</span>
              </div>
              <span className="font-bold text-slate-800">{statusCounts.Mendekati} KPI</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block" />
                <span>Tidak Tercapai</span>
              </div>
              <span className="font-bold text-slate-800">{statusCounts.Gagal} KPI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Kepatuhan Penginputan */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="mb-4">
          <h3 className="font-extrabold text-slate-800 text-sm">Heatmap Kepatuhan Pelaporan Unit Kerja</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Pemetaan status pengisian data realisasi KPI Bulanan {selectedTahun}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">
                <th className="p-3 pl-4">Unit Kerja Penunjang</th>
                {monthsList.map(m => (
                  <th key={m.num} className="p-3 text-center">{m.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {allUnits.map(unit => (
                <tr key={unit} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 pl-4 font-bold text-slate-700">{unit}</td>
                  {monthsList.map(m => {
                    const status = getComplianceStatus(unit, m.num);
                    return (
                      <td key={m.num} className="p-3 text-center">
                        {status === 'complete' ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-green-100 text-green-700 font-bold" title="Lengkap (100% Terkirim)">
                            ✓
                          </span>
                        ) : status === 'partial' ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-100 text-amber-700 font-bold" title="Sebagian Terisi">
                            ~
                          </span>
                        ) : status === 'neutral' ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-400" title="Tidak Ada Indikator">
                            -
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-red-100 text-red-600 font-bold" title="Belum Melapor (Terlambat)">
                            ✕
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Heatmap Legend */}
        <div className="mt-4 flex items-center justify-end gap-4 text-[10px] font-bold text-slate-500 uppercase">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-100 border border-green-200 rounded block" />
            <span>Semua KPI Terkirim</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-amber-100 border border-amber-200 rounded block" />
            <span>Terisi Sebagian</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-100 border border-red-200 rounded block" />
            <span>Terlambat Pengisian</span>
          </div>
        </div>
      </div>

      {/* Row 2: Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Ranking Unit Terbaik */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <Award className="text-emerald-500 w-4.5 h-4.5" />
              <span>Unit Penunjang Terbaik (3 Besar)</span>
            </h3>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded uppercase">Performa Tinggi</span>
          </div>

          <div className="space-y-3.5">
            {topUnits.map((u, index) => (
              <div key={index} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl transition-all">
                <div className="flex items-center space-x-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                    index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">{u.unit}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Seksi Penunjang</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-600">{u.capaian}%</span>
                  <p className="text-[9px] text-slate-400">Rerata Realisasi</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking Unit Terendah */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <AlertTriangle className="text-red-500 w-4.5 h-4.5" />
              <span>Unit Perlu Perhatian Khusus</span>
            </h3>
            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-black rounded uppercase">Evaluasi Mutu</span>
          </div>

          <div className="space-y-3.5">
            {bottomUnits.map((u, index) => (
              <div key={index} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-black text-xs">
                    ⚠️
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">{u.unit}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Seksi Penunjang</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-red-500">{u.capaian}%</span>
                  <p className="text-[9px] text-slate-400">Rerata Realisasi</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
