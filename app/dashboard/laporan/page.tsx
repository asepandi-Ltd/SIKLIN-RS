"use client";

import { useState, useEffect } from "react";
import { useAppStore, Capaian, Indikator } from "@/lib/store";
import { 
  FileSpreadsheet, 
  Printer, 
  Search, 
  Filter, 
  Layers, 
  ChevronDown, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Award
} from "lucide-react";
import Swal from "sweetalert2";

export default function LaporanPage() {
  const { indikatorList, capaianList, currentUser } = useAppStore();
  const [mounted, setMounted] = useState(false);

  const canViewScore = currentUser?.role === 'Super Admin' || currentUser?.role === 'Kepala Seksi' || currentUser?.role === 'Supervisor';

  // Filters state
  const [reportType, setReportType] = useState<'Bulanan' | 'Triwulanan' | 'Semesteran' | 'Tahunan'>('Bulanan');
  const [bulan, setBulan] = useState(3); // default March
  const [triwulan, setTriwulan] = useState(1); // TW 1 (Jan-Mar)
  const [semester, setSemester] = useState(1); // Sem 1 (Jan-Jun)
  const [tahun, setTahun] = useState(2026);
  const [selectedUnit, setSelectedUnit] = useState("Semua Unit");
  const [selectedStatus, setSelectedStatus] = useState("Semua Status");

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

  // Indonesian names
  const monthsMap: { [key: number]: string } = {
    1: "Januari", 2: "Februari", 3: "Maret", 4: "April", 5: "Mei", 6: "Juni",
    7: "Juli", 8: "Agustus", 9: "September", 10: "Oktober", 11: "November", 12: "Desember"
  };

  const unitsList = [
    "Laboratorium", "Farmasi", "Rekam Medis", "Radiologi", "Mutu", "Gizi",
    "IT Rumah Sakit / ITRS", "IPSRS", "CSSD & Laundry", "Humas dan Pemasaran", "Kesehatan Lingkungan"
  ];

  // Helper: check if a record falls within selected timeframe
  const isWithinTimeframe = (record: Capaian) => {
    if (record.tahun !== tahun) return false;

    if (reportType === 'Bulanan') {
      return record.bulan === bulan;
    } else if (reportType === 'Triwulanan') {
      if (triwulan === 1) return record.bulan >= 1 && record.bulan <= 3;
      if (triwulan === 2) return record.bulan >= 4 && record.bulan <= 6;
      if (triwulan === 3) return record.bulan >= 7 && record.bulan <= 9;
      return record.bulan >= 10 && record.bulan <= 12;
    } else if (reportType === 'Semesteran') {
      if (semester === 1) return record.bulan >= 1 && record.bulan <= 6;
      return record.bulan >= 7 && record.bulan <= 12;
    } else {
      // Tahunan
      return true;
    }
  };

  // Compile report list (group by indicator to average multiple months if needed)
  const compiledReportRows = filteredInds().map(ind => {
    // Find all submitted capaian for this indicator in selected timeframe
    const caps = capaianList.filter(c => 
      c.indikator_id === ind.id && 
      c.status_submit === 'Submitted' && 
      isWithinTimeframe(c)
    );

    if (caps.length === 0) {
      return {
        ...ind,
        numeratorAvg: 0,
        denominatorAvg: 0,
        capaianAvg: 0,
        status: 'Belum Melapor',
        analisa: "Belum dilakukan penginputan data realisasi pada periode ini.",
        tindakLanjut: "-",
        isReported: false,
        nilai: 0
      };
    }

    const numSum = caps.reduce((sum, curr) => sum + curr.numerator, 0);
    const denSum = caps.reduce((sum, curr) => sum + curr.denominator, 0);
    const capAvg = Math.round((caps.reduce((sum, curr) => sum + curr.capaian, 0) / caps.length) * 100) / 100;
    
    // Status label based on average achievement
    let statusLabel = 'Tercapai';
    if (ind.arah_target === 'Semakin Rendah') {
      if (capAvg > ind.target + 10) {
        statusLabel = 'Tidak Tercapai';
      } else if (capAvg > ind.target) {
        statusLabel = 'Mendekati Target';
      }
    } else {
      if (capAvg < ind.target - 10) {
        statusLabel = 'Tidak Tercapai';
      } else if (capAvg < ind.target) {
        statusLabel = 'Mendekati Target';
      }
    }

    const analyses = caps.map(c => c.keterangan).filter(Boolean).join("; ");
    const followups = caps.map(c => c.eviden).filter(Boolean).map(e => `Verifikasi: ${e}`).join(", ");

    const totalScore = caps.reduce((sum, curr) => sum + (curr.nilai !== undefined ? curr.nilai : (curr.status === 'Tercapai' ? 3 : curr.status === 'Mendekati Target' ? 2 : 1)), 0);
    const score = Math.round((totalScore / caps.length) * 10) / 10;

    return {
      ...ind,
      numeratorAvg: Math.round((numSum / caps.length) * 10) / 10,
      denominatorAvg: Math.round((denSum / caps.length) * 10) / 10,
      capaianAvg: capAvg,
      status: statusLabel,
      analisa: analyses || "Kinerja stabil sesuai standar mutu.",
      tindakLanjut: followups || "Pertahankan performa kerja.",
      isReported: true,
      nilai: score
    };
  }).filter(row => {
    if (selectedStatus === "Semua Status") return true;
    return row.status === selectedStatus;
  });

  // Helper to filter indicators list
  function filteredInds() {
    return indikatorList.filter(ind => {
      return selectedUnit === "Semua Unit" || ind.unit === selectedUnit;
    });
  }

  // Summary Metrics
  const reportedRows = compiledReportRows.filter(r => r.isReported);
  const totalKpis = compiledReportRows.length;
  const tercapaiCount = compiledReportRows.filter(r => r.status === 'Tercapai').length;
  const mendekatiCount = compiledReportRows.filter(r => r.status === 'Mendekati Target').length;
  const gagalCount = compiledReportRows.filter(r => r.status === 'Tidak Tercapai').length;
  const nonReportedCount = compiledReportRows.filter(r => !r.isReported).length;

  const averageCapaian = reportedRows.length > 0
    ? Math.round(reportedRows.reduce((sum, curr) => sum + curr.capaianAvg, 0) / reportedRows.length)
    : 0;

  const averageScore = compiledReportRows.length > 0
    ? (compiledReportRows.reduce((sum, curr) => sum + (curr.nilai || 0), 0) / compiledReportRows.length).toFixed(1)
    : "0.0";

  // Period label descriptor for export
  const getPeriodLabel = () => {
    if (reportType === 'Bulanan') return `${monthsMap[bulan]} ${tahun}`;
    if (reportType === 'Triwulanan') return `Triwulan ${triwulan} (${tahun})`;
    if (reportType === 'Semesteran') return `Semester ${semester} (${tahun})`;
    return `Tahun ${tahun}`;
  };

  // Export Excel / CSV
  const handleExportExcel = () => {
    const headers = ["No,Kode,Indikator KPI,Unit,Target,Numerator (Rata-rata),Denominator (Rata-rata),Capaian,Skor Penilaian (0-3),Status,Analisis,Tindak Lanjut"];
    const rows = compiledReportRows.map((row, idx) => {
      const sat = row.satuan || '%';
      return `"${idx + 1}","${row.kode}","${row.nama.replace(/"/g, '""')}","${row.unit}","${row.target}${sat}","${row.numeratorAvg}","${row.denominatorAvg}","${row.capaianAvg}${sat}","${row.nilai}","${row.status}","${row.analisa.replace(/"/g, '""')}","${row.tindakLanjut.replace(/"/g, '""')}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_SIPAKAR_${getPeriodLabel().replace(" ", "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Berkas Laporan Excel (CSV) diunduh dengan Skor Penilaian!',
      showConfirmButton: false,
      timer: 1500
    });
  };

  // Export PDF with Executive Signatures
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableRows = compiledReportRows.map((row, idx) => {
      const sat = row.satuan || '%';
      return `
      <tr>
        <td style="padding: 7px; border: 1px solid #aaa; text-align: center; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 7px; border: 1px solid #aaa; font-weight: bold; white-space: nowrap;">${row.kode}</td>
        <td style="padding: 7px; border: 1px solid #aaa; max-width: 250px;">${row.nama}</td>
        <td style="padding: 7px; border: 1px solid #aaa; text-align: center; font-weight: bold;">${row.target}${sat}</td>
        <td style="padding: 7px; border: 1px solid #aaa; text-align: center;">${row.numeratorAvg || 0}</td>
        <td style="padding: 7px; border: 1px solid #aaa; text-align: center;">${row.denominatorAvg || 0}</td>
        <td style="padding: 7px; border: 1px solid #aaa; text-align: center; font-weight: 900; color: ${row.status === 'Tercapai' ? '#0d5d36' : row.status === 'Mendekati Target' ? '#b45309' : '#d32f2f'}">${row.capaianAvg || 0}${sat}</td>
        <td style="padding: 7px; border: 1px solid #aaa; text-align: center; font-weight: bold; background-color: #f8fafc;">${row.nilai}</td>
        <td style="padding: 7px; border: 1px solid #aaa; font-size: 9px; max-width: 150px;">${row.status}</td>
        <td style="padding: 7px; border: 1px solid #aaa; font-size: 9px; max-width: 200px;">${row.analisa}</td>
      </tr>
    `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Akuntabilitas Kinerja Seksi Penunjang - RSUD Al-Mulk</title>
          <style>
            @page { size: landscape; margin: 15mm; }
            body { font-family: sans-serif; color: #111; line-height: 1.4; font-size: 11px; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .logo-placeholder { font-size: 24px; font-weight: 900; color: #00A8A8; text-transform: uppercase; }
            .title-section { text-align: center; margin-bottom: 25px; }
            .title-section h1 { font-size: 16px; margin: 0 0 5px 0; font-weight: bold; letter-spacing: 0.5px; }
            .title-section h2 { font-size: 11px; margin: 0; font-weight: bold; color: #555; text-transform: uppercase; }
            .summary-cards-container { display: flex; gap: 15px; margin-bottom: 20px; }
            .sum-card { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 10px; background-color: #fafafa; }
            .sum-card-title { font-size: 9px; text-transform: uppercase; font-weight: bold; color: #777; margin-bottom: 4px; }
            .sum-card-val { font-size: 18px; font-weight: bold; color: #333; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
            table.data-table th { background-color: #f1f5f9; padding: 8px; border: 1px solid #888; text-align: left; font-weight: bold; text-transform: uppercase; font-size: 9px; }
            .signature-container { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
            .sig-block { text-align: center; width: 220px; font-size: 10px; }
            .sig-space { height: 60px; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td class="logo-placeholder" style="width: 60px;">[+]</td>
              <td>
                <div style="font-size: 13px; font-weight: bold; letter-spacing: 1px;">PEMERINTAH KOTA KENDARI</div>
                <div style="font-size: 14px; font-weight: 900; color: #00A8A8;">RSUD AL-MULK KOTA KENDARI</div>
                <div style="font-size: 10px; color: #555;">Jl. Jend. AH. Nasution No.17, Kota Kendari, Sulawesi Tenggara</div>
              </td>
              <td style="text-align: right; font-size: 10px; color: #555;">
                Form SIPAKAR-LAP-02<br/>
                Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}
              </td>
            </tr>
          </table>

          <hr style="border: 1px solid #111; margin-bottom: 20px;"/>

          <div class="title-section">
            <h1>LAPORAN CAPAIAN INDIKATOR MUTU KINERJA SEKSI PENUNJANG</h1>
            <h2>PERIODE: ${getPeriodLabel()} | UNIT: ${selectedUnit}</h2>
          </div>

          <div class="summary-cards-container">
            <div class="sum-card">
              <div class="sum-card-title">Total Indikator KPI</div>
              <div class="sum-card-val">${totalKpis} Indikator</div>
            </div>
            <div class="sum-card">
              <div class="sum-card-title">Rata-rata Kategori Nilai</div>
              <div class="sum-card-val" style="color: #00A8A8;">${averageScore}</div>
            </div>
            <div class="sum-card">
              <div class="sum-card-title">Tercapai Target</div>
              <div class="sum-card-val" style="color: #10B981;">${tercapaiCount} KPI</div>
            </div>
            <div class="sum-card">
              <div class="sum-card-title">Tidak Tercapai</div>
              <div class="sum-card-val" style="color: #EF4444;">${gagalCount} KPI</div>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">No</th>
                <th style="width: 80px;">Kode</th>
                <th>Nama Indikator Pelayanan</th>
                <th style="width: 60px; text-align: center;">Target</th>
                <th style="width: 70px; text-align: center;">Num (Avg)</th>
                <th style="width: 70px; text-align: center;">Den (Avg)</th>
                <th style="width: 80px; text-align: center;">Realisasi</th>
                <th style="width: 60px; text-align: center;">Skor (0-3)</th>
                <th style="width: 100px;">Status</th>
                <th>Analisa & Kendala</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="signature-container">
            <div class="sig-block">
              <p>Mengetahui,</p>
              <p style="font-weight: bold; text-transform: uppercase;">Direktur RSUD Al-Mulk</p>
              <div class="sig-space"></div>
              <p style="text-decoration: underline; font-weight: bold;">dr. Hj. Syariati, M.Kes</p>
              <p>NIP. 19741211 200501 2 008</p>
            </div>

            <div class="sig-block">
              <p>Kendari, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
              <p style="font-weight: bold; text-transform: uppercase;">Kepala Seksi Penunjang</p>
              <div class="sig-space"></div>
              <p style="text-decoration: underline; font-weight: bold;">dr. H. Abdurrahman, M.Kes</p>
              <p>NIP. 19810805 201001 1 012</p>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Search & Period selector bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-800">Laporan Akuntabilitas Mutu</h2>
          <p className="text-xs text-slate-500">
            Kompilasi rekapitulasi data capaian KPI seksi penunjang untuk evaluasi pimpinan
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>Ekspor Excel</span>
          </button>
          
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-[#00A8A8] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#008f8f] transition-all cursor-pointer shadow-md shadow-[#00A8A8]/10"
          >
            <Printer size={15} />
            <span>Cetak PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* Robust Filtering Console */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-1 text-[#00A8A8] text-xs font-extrabold uppercase tracking-widest border-b pb-2">
          <Filter size={14} />
          <span>Konsol Parameter Laporan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Report Type */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Metode Agregasi</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="Bulanan">Laporan Bulanan</option>
              <option value="Triwulanan">Laporan Triwulanan</option>
              <option value="Semesteran">Laporan Semesteran</option>
              <option value="Tahunan">Laporan Tahunan</option>
            </select>
          </div>

          {/* Timeframe Pickers depending on type */}
          {reportType === 'Bulanan' && (
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pilih Bulan</label>
              <select
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                {Object.entries(monthsMap).map(([num, name]) => (
                  <option key={num} value={num}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'Triwulanan' && (
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pilih Triwulan</label>
              <select
                value={triwulan}
                onChange={(e) => setTriwulan(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value={1}>Triwulan I (Jan - Mar)</option>
                <option value={2}>Triwulan II (Apr - Jun)</option>
                <option value={3}>Triwulan III (Jul - Sep)</option>
                <option value={4}>Triwulan IV (Okt - Des)</option>
              </select>
            </div>
          )}

          {reportType === 'Semesteran' && (
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pilih Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value={1}>Semester I (Januari - Juni)</option>
                <option value={2}>Semester II (Juli - Desember)</option>
              </select>
            </div>
          )}

          {/* Year selection */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pilih Tahun</label>
            <select
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          {/* Unit selection */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Unit Penunjang</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="Semua Unit">Semua Unit</option>
              {unitsList.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Status Capaian</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Tercapai">Tercapai Target</option>
              <option value="Mendekati Target">Mendekati Target</option>
              <option value="Tidak Tercapai">Tidak Tercapai</option>
              <option value="Belum Melapor">Belum Melapor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Indikator</p>
            <h4 className="text-xl font-black text-slate-800">{totalKpis} KPI</h4>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
            <Layers size={18} />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Rata-rata Kategori Nilai</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-xl font-black text-[#00A8A8]">{averageScore}</h4>
            </div>
          </div>
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-[#00A8A8]">
            <TrendingUp size={18} />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tercapai Standar</p>
            <h4 className="text-xl font-black text-emerald-600">{tercapaiCount} KPI</h4>
          </div>
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <CheckCircle size={18} />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Belum Melapor</p>
            <h4 className="text-xl font-black text-slate-500">{nonReportedCount} Unit</h4>
          </div>
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-slate-400">
            <XCircle size={18} />
          </div>
        </div>
      </div>

      {/* Main Compiled Reports Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-gray-100 text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">
                <th className="p-4 pl-6 text-center w-12">No</th>
                <th className="p-4 w-24">Kode</th>
                <th className="p-4">Indikator KPI</th>
                <th className="p-4 text-center w-24">Target</th>
                <th className="p-4 text-center w-28">Numerator</th>
                <th className="p-4 text-center w-28">Denominator</th>
                <th className="p-4 text-center w-28">Capaian</th>
                {canViewScore && <th className="p-4 text-center w-36">Kategori Nilai (0-3)</th>}
                <th className="p-4 text-center">Status</th>
                <th className="p-4 max-w-xs">Analisa Masalah & Rencana Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {compiledReportRows.length === 0 ? (
                <tr>
                  <td colSpan={canViewScore ? 10 : 9} className="p-16 text-center text-slate-400 font-bold">
                    <Layers size={40} className="mx-auto mb-3 text-slate-300" />
                    <span>Tidak ada catatan laporan untuk filter terpilih.</span>
                  </td>
                </tr>
              ) : (
                compiledReportRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                    
                    {/* No */}
                    <td className="p-4 pl-6 text-center text-slate-400 font-bold">
                      {idx + 1}
                    </td>

                    {/* Kode */}
                    <td className="p-4 font-extrabold text-slate-800 tracking-tight whitespace-nowrap">
                      {row.kode}
                    </td>

                    {/* Indikator */}
                    <td className="p-4 max-w-xs">
                      <p className="font-extrabold text-slate-800 leading-normal">{row.nama}</p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                        {row.unit}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="p-4 text-center font-extrabold text-slate-800">
                      {row.target}{row.satuan || "%"}
                    </td>

                    {/* Numerator */}
                    <td className="p-4 text-center text-slate-500 font-semibold">
                      {row.isReported ? row.numeratorAvg : "-"}
                    </td>

                    {/* Denominator */}
                    <td className="p-4 text-center text-slate-500 font-semibold">
                      {row.isReported ? row.denominatorAvg : "-"}
                    </td>

                    {/* Capaian */}
                    <td className="p-4 text-center">
                      <span className={`text-sm font-black ${
                        !row.isReported 
                          ? 'text-slate-400' 
                          : row.status === 'Tercapai' 
                            ? 'text-emerald-600' 
                            : row.status === 'Mendekati Target'
                              ? 'text-amber-500'
                              : 'text-red-500'
                      }`}>
                        {row.isReported ? `${row.capaianAvg}${row.satuan || "%"}` : "-"}
                      </span>
                    </td>

                    {/* Kategori Nilai (0-3) */}
                    {canViewScore && (
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black border ${
                            row.nilai >= 2.5 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                              : row.nilai >= 1.5 
                                ? 'bg-amber-50 border-amber-200 text-amber-700' 
                                : row.nilai >= 0.5 
                                  ? 'bg-rose-50 border-rose-200 text-rose-700' 
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}>
                            {row.nilai}
                          </span>
                          <span className={`text-[10px] font-bold ${
                            row.nilai >= 2.5 
                              ? 'text-emerald-600' 
                              : row.nilai >= 1.5 
                                ? 'text-amber-600' 
                                : row.nilai >= 0.5 
                                  ? 'text-rose-500' 
                                  : 'text-slate-400'
                          }`}>
                            {row.nilai >= 2.5 ? 'Sangat Baik' : row.nilai >= 1.5 ? 'Baik' : row.nilai >= 0.5 ? 'Kurang' : row.isReported ? 'Sangat Kurang' : 'Belum Melapor'}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Status Badge */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        row.status === 'Tercapai' 
                          ? 'bg-green-50 text-green-600' 
                          : row.status === 'Mendekati Target' 
                            ? 'bg-amber-50 text-amber-600' 
                            : row.status === 'Tidak Tercapai' 
                              ? 'bg-red-50 text-red-500' 
                              : 'bg-slate-100 text-slate-400'
                      }`}>
                        {row.status}
                      </span>
                    </td>

                    {/* Analisa Masalah */}
                    <td className="p-4 text-slate-500 max-w-xs font-semibold leading-relaxed">
                      <p className="line-clamp-2" title={row.analisa}>{row.analisa}</p>
                      {row.isReported && (
                        <p className="text-[10px] text-teal-600 font-bold mt-1 uppercase truncate" title={row.tindakLanjut}>
                          RTL: {row.tindakLanjut}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
