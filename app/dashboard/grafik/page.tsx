"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppStore, Indikator, Capaian, getJenisPengukuran } from "@/lib/store";
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
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Filter, 
  Activity,
  Layers,
  Sparkles,
  Percent,
  Hash,
  Clock,
  BarChart3,
  HelpCircle
} from "lucide-react";

export default function GrafikCapaianPage() {
  const { indikatorList, capaianList } = useAppStore();
  const [mounted, setMounted] = useState(false);

  // Filters
  const [selectedTahun, setSelectedTahun] = useState(2026);
  const [selectedUnit, setSelectedUnit] = useState("Semua Unit");
  const [selectedKategori, setSelectedKategori] = useState("Semua Kategori");
  const [selectedJenisPengukuran, setSelectedJenisPengukuran] = useState<string>("Semua Jenis");
  const [selectedFrekuensi, setSelectedFrekuensi] = useState<string>("Semua Frekuensi");
  const [selectedIndikatorDetail, setSelectedIndikatorDetail] = useState<string>("Semua Indikator");

  // Tab View for Multi-Metric Breakdown
  const [activeMetricTab, setActiveMetricTab] = useState<'Semua' | 'Persentase' | 'Jumlah' | 'Durasi'>('Semua');

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

  // Active units list
  const allUnits = Array.from(new Set(indikatorList.filter(i => i.status).map(ind => ind.unit)));

  // Full 12 Months List (Januari - Desember)
  const fullMonthsList = [
    { num: 1, name: "Januari", short: "Jan" },
    { num: 2, name: "Februari", short: "Feb" },
    { num: 3, name: "Maret", short: "Mar" },
    { num: 4, name: "April", short: "Apr" },
    { num: 5, name: "Mei", short: "Mei" },
    { num: 6, name: "Juni", short: "Jun" },
    { num: 7, name: "Juli", short: "Jul" },
    { num: 8, name: "Agustus", short: "Agu" },
    { num: 9, name: "September", short: "Sep" },
    { num: 10, name: "Oktober", short: "Okt" },
    { num: 11, name: "November", short: "Nov" },
    { num: 12, name: "Desember", short: "Des" }
  ];

  // Triwulan List
  const quartersList = [
    { num: 3, name: "Triwulan I (Maret)", short: "TW 1" },
    { num: 6, name: "Triwulan II (Juni)", short: "TW 2" },
    { num: 9, name: "Triwulan III (September)", short: "TW 3" },
    { num: 12, name: "Triwulan IV (Desember)", short: "TW 4" }
  ];

  // Semester List
  const semestersList = [
    { num: 6, name: "Semester I (Juni)", short: "Sem 1" },
    { num: 12, name: "Semester II (Desember)", short: "Sem 2" }
  ];

  // Active Period Timeline based on selected frequency
  const activeTimeline = selectedFrekuensi === "Triwulanan" 
    ? quartersList 
    : selectedFrekuensi === "Semester" 
    ? semestersList 
    : fullMonthsList;

  // Filter indicators (only active ones)
  const filteredInds = indikatorList.filter(ind => {
    const matchesUnit = selectedUnit === "Semua Unit" || ind.unit === selectedUnit;
    const matchesKategori = selectedKategori === "Semua Kategori" || ind.kategori === selectedKategori;
    const jenis = getJenisPengukuran(ind);
    const matchesJenis = selectedJenisPengukuran === "Semua Jenis" || jenis === selectedJenisPengukuran;
    const matchesTab = activeMetricTab === 'Semua' || jenis === activeMetricTab;
    const matchesFrekuensi = selectedFrekuensi === "Semua Frekuensi" || (ind.frekuensi || "Bulanan") === selectedFrekuensi;
    const matchesIndDetail = selectedIndikatorDetail === "Semua Indikator" || ind.id === selectedIndikatorDetail;
    return matchesUnit && matchesKategori && matchesJenis && matchesTab && matchesFrekuensi && matchesIndDetail && ind.status;
  });

  const filteredIndIds = filteredInds.map(i => i.id);

  // Filter Capaian (only submitted)
  const filteredCapaians = capaianList.filter(cap => {
    const matchesYear = Number(cap.tahun) === Number(selectedTahun);
    const matchesInd = filteredIndIds.includes(cap.indikator_id);
    const matchesSubmit = cap.status_submit === 'Submitted';
    return matchesYear && matchesInd && matchesSubmit;
  });

  // Group Indicators by measurement type
  const percentInds = filteredInds.filter(i => getJenisPengukuran(i) === 'Persentase');
  const countInds = filteredInds.filter(i => getJenisPengukuran(i) === 'Jumlah');
  const durationInds = filteredInds.filter(i => getJenisPengukuran(i) === 'Durasi');

  // =========================================================================
  // 1. Trend Bulanan (Januari - Desember) Berdasarkan Jenis Pengukuran
  // =========================================================================

  // A. Trend Persentase (%)
  const percentTrendData = activeTimeline.map(m => {
    const caps = filteredCapaians.filter(c => {
      const ind = filteredInds.find(i => i.id === c.indikator_id);
      return c.bulan === m.num && ind && getJenisPengukuran(ind) === 'Persentase';
    });
    const avg = caps.length > 0 
      ? Math.round((caps.reduce((sum, curr) => sum + curr.capaian, 0) / caps.length) * 10) / 10
      : null;
    return {
      name: m.short,
      realisasi: avg,
      target: 95
    };
  });

  // B. Trend Jumlah (Kunjungan / Dokumen / Kegiatan / Kali) - Absolut
  const countTrendData = activeTimeline.map(m => {
    const caps = filteredCapaians.filter(c => {
      const ind = filteredInds.find(i => i.id === c.indikator_id);
      return c.bulan === m.num && ind && getJenisPengukuran(ind) === 'Jumlah';
    });
    const total = caps.length > 0 
      ? Math.round(caps.reduce((sum, curr) => sum + curr.capaian, 0))
      : null;
    return {
      name: m.short,
      realisasi: total
    };
  });

  // C. Trend Durasi (Menit)
  const durationTrendData = activeTimeline.map(m => {
    const caps = filteredCapaians.filter(c => {
      const ind = filteredInds.find(i => i.id === c.indikator_id);
      return c.bulan === m.num && ind && getJenisPengukuran(ind) === 'Durasi';
    });
    const avg = caps.length > 0 
      ? Math.round((caps.reduce((sum, curr) => sum + curr.capaian, 0) / caps.length) * 10) / 10
      : null;
    return {
      name: m.short,
      realisasi: avg,
      target: 60 // Standar acuan umum
    };
  });

  // =========================================================================
  // 2. Perbandingan Antar Unit Berdasarkan Persentase KPI yang Mencapai Target
  // (Bukan rata-rata nilai mentah dari satuan yang campur aduk)
  // =========================================================================
  const unitPerformanceData = allUnits.map(unit => {
    const unitInds = indikatorList.filter(i => i.unit === unit && i.status);
    const unitIndIds = unitInds.map(i => i.id);
    const unitCaps = capaianList.filter(c => 
      unitIndIds.includes(c.indikator_id) && 
      Number(c.tahun) === Number(selectedTahun) && 
      c.status_submit === 'Submitted'
    );

    const totalSubmitted = unitCaps.length;
    const totalTercapai = unitCaps.filter(c => c.status === 'Tercapai').length;
    const totalMendekati = unitCaps.filter(c => c.status === 'Mendekati Target').length;
    const totalTidakTercapai = unitCaps.filter(c => c.status === 'Tidak Tercapai').length;

    // Indeks Kinerja Berbasis Kepatuhan Target (% KPI Tercapai terhadap total laporan terkirim)
    const successRate = totalSubmitted > 0 
      ? Math.round((totalTercapai / totalSubmitted) * 100) 
      : 0;

    // Indeks Skor Mutu Terbobot (Nilai 3 = Tercapai, 2 = Mendekati, 1 = Gagal)
    const weightedScore = totalSubmitted > 0
      ? Math.round((((totalTercapai * 3) + (totalMendekati * 2) + (totalTidakTercapai * 1)) / (totalSubmitted * 3)) * 100)
      : 0;

    return {
      unit,
      successRate,
      weightedScore,
      totalSubmitted,
      totalTercapai,
      totalTidakTercapai,
      totalIndikator: unitInds.length
    };
  }).sort((a, b) => b.successRate - a.successRate);

  // =========================================================================
  // 3. Status KPI Pie Chart
  // =========================================================================
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

  // =========================================================================
  // 4. Heatmap Kepatuhan Penginputan 12 Bulan (Januari - Desember)
  // =========================================================================
  const getComplianceStatus = (unit: string, month: number) => {
    const unitInds = indikatorList.filter(i => i.unit === unit && i.status);
    if (unitInds.length === 0) return 'neutral';
    const unitIndIds = unitInds.map(i => i.id);
    const submitted = capaianList.filter(c => 
      unitIndIds.includes(c.indikator_id) && 
      c.bulan === month && 
      Number(c.tahun) === Number(selectedTahun) && 
      c.status_submit === 'Submitted'
    );
    if (submitted.length === unitInds.length) return 'complete'; // 100%
    if (submitted.length > 0) return 'partial'; // Sebagian
    return 'none'; // Belum ada
  };

  // =========================================================================
  // 5. Leaderboard & Summary Analysis
  // =========================================================================
  const topUnits = [...unitPerformanceData].filter(u => u.totalSubmitted > 0).slice(0, 3);
  const bottomUnits = [...unitPerformanceData].filter(u => u.totalSubmitted > 0 && u.successRate < 100).slice(-3).reverse();

  const bestUnit = topUnits[0] || null;
  const worstUnit = bottomUnits[bottomUnits.length - 1] || null;

  // Most frequently failed indicator
  const failedKpisMap: { [key: string]: { count: number; name: string; code: string; unit: string; satuan: string; jenis: string } } = {};
  capaianList.filter(c => c.status === 'Tidak Tercapai' && c.status_submit === 'Submitted' && Number(c.tahun) === Number(selectedTahun)).forEach(c => {
    const ind = indikatorList.find(i => i.id === c.indikator_id);
    if (ind && ind.status) {
      if (!failedKpisMap[ind.id]) {
        failedKpisMap[ind.id] = { 
          count: 0, 
          name: ind.nama, 
          code: ind.kode, 
          unit: ind.unit,
          satuan: ind.satuan,
          jenis: getJenisPengukuran(ind)
        };
      }
      failedKpisMap[ind.id].count += 1;
    }
  });

  const mostFailedKpi = Object.values(failedKpisMap).sort((a, b) => b.count - a.count)[0];

  const overallSubmittedCount = filteredCapaians.length;
  const overallExpectedCount = filteredInds.length * activeTimeline.length;
  const overallComplianceRate = overallExpectedCount > 0 
    ? Math.round((overallSubmittedCount / overallExpectedCount) * 100)
    : 0;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title & Real-time Filters */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <BarChart3 size={20} />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800">Grafik Analisis & Performa Kinerja</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visualisasi multi-dimensi (Persentase, Jumlah, Durasi) dengan perbandingan kinerja berbobot tahun {selectedTahun}
            </p>
          </div>

          {/* Quick Year & Division Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
            </select>

            <select
              value={selectedUnit}
              onChange={(e) => {
                setSelectedUnit(e.target.value);
                setSelectedIndikatorDetail("Semua Indikator");
              }}
              className="px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
            >
              <option value="Semua Unit">Semua Unit</option>
              {allUnits.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Detailed Secondary Filters (Jenis Pengukuran, Frekuensi, Divisi, Indikator Spesifik) */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
            <Filter size={13} className="text-teal-600" />
            <span>Kategori Filter:</span>
          </div>

          {/* Jenis Pengukuran Filter */}
          <select
            value={selectedJenisPengukuran}
            onChange={(e) => setSelectedJenisPengukuran(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg font-bold text-slate-700 outline-none"
          >
            <option value="Semua Jenis">Semua Jenis Pengukuran</option>
            <option value="Persentase">Persentase (%)</option>
            <option value="Jumlah">Jumlah (Kali, Laporan, Dokumen)</option>
            <option value="Durasi">Durasi (Menit/Waktu Tunggu)</option>
          </select>

          {/* Frekuensi Filter */}
          <select
            value={selectedFrekuensi}
            onChange={(e) => setSelectedFrekuensi(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg font-bold text-slate-700 outline-none"
          >
            <option value="Semua Frekuensi">Semua Frekuensi</option>
            <option value="Bulanan">Bulanan (12 Bulan)</option>
            <option value="Triwulanan">Triwulanan (TW 1 - 4)</option>
            <option value="Semester">Semester (Sem 1 - 2)</option>
            <option value="Tahunan">Tahunan</option>
          </select>

          {/* Divisi Filter */}
          <select
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg font-bold text-slate-700 outline-none"
          >
            <option value="Semua Kategori">Semua Divisi</option>
            <option value="Penunjang Medis">Penunjang Medis</option>
            <option value="Penunjang Non Medis">Penunjang Non Medis</option>
          </select>

          {/* Specific Indicator Filter */}
          {selectedUnit !== "Semua Unit" && (
            <select
              value={selectedIndikatorDetail}
              onChange={(e) => setSelectedIndikatorDetail(e.target.value)}
              className="px-3 py-1.5 bg-teal-50/70 border border-teal-200 rounded-lg font-bold text-teal-900 outline-none max-w-xs truncate"
            >
              <option value="Semua Indikator">-- Semua Indikator {selectedUnit} --</option>
              {indikatorList
                .filter(i => i.unit === selectedUnit && i.status)
                .map(i => (
                  <option key={i.id} value={i.id}>
                    {i.kode} - {i.nama} ({i.satuan || '%'})
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      {/* Narrative Executive Analysis Card */}
      <div className="bg-gradient-to-tr from-slate-900 to-teal-950 p-6 rounded-2xl border border-slate-800 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-bl-full" />
        
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-1.5 bg-teal-500/20 rounded-lg text-teal-400">
            <Sparkles size={16} />
          </div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider">Hasil Analisis Eksekutif Seksi Penunjang ({selectedTahun})</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-slate-300">
          <div className="space-y-1 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Kepatuhan Penginputan</p>
            <h4 className="text-xl font-black text-teal-400">{overallComplianceRate}%</h4>
            <p className="text-[10px] text-slate-400 leading-normal mt-1">
              Total <strong>{overallSubmittedCount}</strong> laporan berstatus submitted dari <strong>{overallExpectedCount}</strong> target periode.
            </p>
          </div>

          <div className="space-y-1 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Unit Berkinerja Terbaik</p>
            <h4 className="text-xl font-black text-emerald-400 truncate" title={bestUnit?.unit || "Belum Ada"}>
              {bestUnit ? bestUnit.unit : 'Tidak Ada Data'}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">
              Tingkat Ketercapaian Target: <strong className="text-emerald-400">{bestUnit ? `${bestUnit.successRate}%` : '-'}</strong> (Skor: {bestUnit?.weightedScore || 0})
            </p>
          </div>

          <div className="space-y-1 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Unit Perlu Evaluasi</p>
            <h4 className="text-xl font-black text-amber-400 truncate" title={worstUnit?.unit || "Aman"}>
              {worstUnit ? worstUnit.unit : 'Semua Unit Sesuai Target'}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">
              Ketercapaian Target: <strong className="text-amber-400">{worstUnit ? `${worstUnit.successRate}%` : '100%'}</strong>
            </p>
          </div>

          <div className="space-y-1 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Indikator Paling Terkendala</p>
            <h4 className="text-sm font-black text-red-400 truncate" title={mostFailedKpi?.name || "Aman"}>
              {mostFailedKpi ? `${mostFailedKpi.code} - ${mostFailedKpi.name}` : 'Aman (0 Gagal)'}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">
              {mostFailedKpi ? (
                <>Terjadi <strong className="text-red-400">{mostFailedKpi.count} kali</strong> deviasi ({mostFailedKpi.unit} - {mostFailedKpi.jenis}).</>
              ) : (
                'Seluruh KPI terlaporkan mencapai target'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Pemisahan Berdasarkan Jenis Pengukuran */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveMetricTab('Semua')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeMetricTab === 'Semua' 
              ? 'bg-teal-600 text-white shadow-xs' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers size={14} />
          <span>Semua Metrik ({filteredInds.length})</span>
        </button>

        <button
          onClick={() => setActiveMetricTab('Persentase')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeMetricTab === 'Persentase' 
              ? 'bg-teal-600 text-white shadow-xs' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Percent size={14} />
          <span>1. Persentase ({percentInds.length} KPI)</span>
        </button>

        <button
          onClick={() => setActiveMetricTab('Jumlah')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeMetricTab === 'Jumlah' 
              ? 'bg-teal-600 text-white shadow-xs' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Hash size={14} />
          <span>2. Jumlah / Absolut ({countInds.length} KPI)</span>
        </button>

        <button
          onClick={() => setActiveMetricTab('Durasi')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeMetricTab === 'Durasi' 
              ? 'bg-teal-600 text-white shadow-xs' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock size={14} />
          <span>3. Durasi / Waktu ({durationInds.length} KPI)</span>
        </button>
      </div>

      {/* Main Charts Row 1: Line Chart & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Line Chart: Multi-Type KPI Trend (12 Bulan / Periode Terpilih) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <span>Grafik Tren Kinerja KPI</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-teal-50 text-teal-700">
                  {activeMetricTab === 'Semua' ? 'Persentase (%)' : activeMetricTab}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                {activeTimeline[0]?.name} - {activeTimeline[activeTimeline.length - 1]?.name} {selectedTahun} ({selectedUnit})
              </p>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <Calendar size={12} className="text-teal-600" />
              <span>{activeTimeline.length} Titik Evaluasi</span>
            </div>
          </div>

          <div className="h-64 w-full min-w-0">
            {activeMetricTab === 'Jumlah' ? (
              // B. Bar / Line Chart for Absolute Counts
              <ResponsiveContainer width="100%" height={256} minWidth={0}>
                <BarChart data={countTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }} 
                    formatter={(val) => [`${val ?? '-'} ${countInds[0]?.satuan || 'Kegiatan'}`, 'Total Realisasi']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar dataKey="realisasi" name="Total Realisasi (Angka Absolut)" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : activeMetricTab === 'Durasi' ? (
              // C. Line Chart for Duration (Minutes)
              <ResponsiveContainer width="100%" height={256} minWidth={0}>
                <LineChart data={durationTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit=" m" fontWeight="bold" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val) => [`${val ?? '-'} Menit`, 'Rerata Waktu']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="realisasi" name="Rata-rata Durasi (Menit)" stroke="#0284c7" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="target" name="Batas Waktu Standar" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              // A. Line Chart for Percentage (%) - Default
              <ResponsiveContainer width="100%" height={256} minWidth={0}>
                <LineChart data={percentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" fontWeight="bold" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }} 
                    formatter={(val) => [`${val ?? '-'}%`, 'Realisasi Rasio']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="realisasi" name="Rata-rata Capaian (%)" stroke="#00A8A8" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="target" name="Standar Target Mutu (95%)" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart: Status Dist */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Distribusi Status Capaian</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Proporsi pencapaian target tahun {selectedTahun}</p>
          </div>

          <div className="h-44 w-full min-w-0 relative flex items-center justify-center">
            {pieChartData.length === 0 ? (
              <div className="text-center text-slate-400 font-bold text-xs p-6">
                Belum ada data realisasi terinput untuk filter ini.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={176} minWidth={0}>
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
                  <Tooltip formatter={(value) => [`${value} Laporan`, 'Jumlah']} />
                </PieChart>
              </ResponsiveContainer>
            )}

            {pieChartData.length > 0 && (
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-800">{filteredCapaians.length}</span>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Laporan Masuk</p>
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-xs font-semibold">
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
                <span>Tercapai (Hijau)</span>
              </div>
              <span className="font-bold text-slate-800">{statusCounts.Tercapai}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" />
                <span>Mendekati Target (Kuning)</span>
              </div>
              <span className="font-bold text-slate-800">{statusCounts.Mendekati}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block" />
                <span>Tidak Tercapai (Merah)</span>
              </div>
              <span className="font-bold text-slate-800">{statusCounts.Gagal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Perbandingan Kinerja Antar Unit (Berbobot & Bebas Bias Satuan) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <TrendingUp className="text-teal-600" size={16} />
              <span>Perbandingan Kinerja Antar Unit (Tingkat Ketercapaian Target)</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              Dihitung dari persentase KPI yang berhasil mencapai target mutu (% Success Rate), bukan rata-rata nilai mentah satuan.
            </p>
          </div>
          <div className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
            Standar Akuntabilitas Penunjang
          </div>
        </div>

        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height={288} minWidth={0}>
            <BarChart data={unitPerformanceData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} unit="%" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
              <YAxis dataKey="unit" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" width={120} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any, name: any, item: any) => {
                  return [
                    `${val}% (${item.payload.totalTercapai} dari ${item.payload.totalSubmitted} laporan)`,
                    'Tingkat Target Tercapai'
                  ];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              <Bar dataKey="successRate" name="% KPI Mencapai Target" fill="#00A8A8" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap Kepatuhan Penginputan 12 Bulan Penuh (Januari - Desember) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Heatmap Kepatuhan Pelaporan Unit Kerja (Januari – Desember)</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
              Pemetaan status pengisian data realisasi 12 bulan penuh tahun {selectedTahun}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-green-100 border border-green-300 inline-block" /> Lengkap
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-300 inline-block" /> Sebagian
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-red-100 border border-red-300 inline-block" /> Belum
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">
                <th className="p-3 pl-4">Unit Kerja Penunjang</th>
                {fullMonthsList.map(m => (
                  <th key={m.num} className="p-3 text-center">{m.short}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {allUnits.map(unit => (
                <tr key={unit} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 pl-4 font-bold text-slate-700 whitespace-nowrap">{unit}</td>
                  {fullMonthsList.map(m => {
                    const status = getComplianceStatus(unit, m.num);
                    return (
                      <td key={m.num} className="p-2.5 text-center">
                        {status === 'complete' ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-green-100 text-green-700 font-black text-xs" title={`${unit} - ${m.name}: Lengkap`}>
                            ✓
                          </span>
                        ) : status === 'partial' ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-100 text-amber-700 font-black text-xs" title={`${unit} - ${m.name}: Sebagian Terisi`}>
                            ~
                          </span>
                        ) : status === 'neutral' ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-400 text-xs" title="Tidak ada indikator">
                            -
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-red-100 text-red-600 font-black text-xs" title={`${unit} - ${m.name}: Belum Melapor`}>
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
      </div>

      {/* Row 3: Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Ranking Unit Terbaik */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <Award className="text-emerald-500 w-4.5 h-4.5" />
              <span>Unit Penunjang Berkinerja Tinggi (3 Besar)</span>
            </h3>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded uppercase">Target Tercapai</span>
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
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{u.totalTercapai} dari {u.totalSubmitted} target tercapai</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-600">{u.successRate}%</span>
                  <p className="text-[9px] text-slate-400">Tingkat Capaian</p>
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
              <span>Unit Memerlukan Monitoring & Supervisi</span>
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
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{u.totalTidakTercapai} target tidak tercapai</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-red-500">{u.successRate}%</span>
                  <p className="text-[9px] text-slate-400">Tingkat Capaian</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
