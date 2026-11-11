"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  AnnualReport,
  AnnualSectionProfile,
  AnnualReportFullData,
  AnnualReportSnapshot,
  AnnualSectionPlan
} from '@/lib/annualReportTypes';
import { ACTIVE_MASTER_UNITS, MasterUnit } from '@/lib/units';
import { Indikator, Capaian, Pengaturan, User } from '@/lib/store';
import {
  getOrCreateAnnualReport,
  getSectionProfile,
  upsertSectionProfile,
  getSectionPlans,
  upsertSectionPlan,
  deleteSectionPlan,
  consolidateAnnualReportData,
  getReportSnapshot,
  upsertReportSnapshot
} from '@/lib/annualReportService';
import { generateAnnualReportDocx } from '@/lib/annualReportDocxGenerator';
import { generateAnnualReportPdf } from '@/lib/annualReportPdfGenerator';
import { generateAnnualReportExcel } from '@/lib/annualReportExcelGenerator';
import UnitReportForm from './UnitReportForm';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  Calendar,
  Building,
  CheckCircle,
  AlertTriangle,
  Layers,
  Sparkles,
  Download,
  Printer,
  Save,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Lock,
  Eye,
  FileCheck,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface SectionReportDashboardProps {
  initialYear?: number;
  allIndikators: Indikator[];
  allCapaian: Capaian[];
  pengaturan?: Pengaturan;
  currentUser?: User | null;
}

export default function SectionReportDashboard({
  initialYear = 2026,
  allIndikators,
  allCapaian,
  pengaturan,
  currentUser
}: SectionReportDashboardProps) {
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);

  // Core Data
  const [report, setReport] = useState<AnnualReport | null>(null);
  const [sectionProfile, setSectionProfile] = useState<AnnualSectionProfile | null>(null);
  const [sectionPlans, setSectionPlans] = useState<AnnualSectionPlan[]>([]);
  const [snapshot, setSnapshot] = useState<AnnualReportSnapshot | null>(null);
  const [consolidatedData, setConsolidatedData] = useState<AnnualReportFullData | null>(null);

  // Inspector unit for Tab 7
  const [inspectorUnit, setInspectorUnit] = useState<MasterUnit>(ACTIVE_MASTER_UNITS[0]);

  // Section Plan Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<AnnualSectionPlan> | null>(null);

  // Filter in Tab 4 (KPI)
  const [kpiFilterUnit, setKpiFilterUnit] = useState<string>('Semua Unit');
  const [kpiFilterStatus, setKpiFilterStatus] = useState<string>('Semua Status');

  // Load Year Data
  const loadYearData = useCallback(async (year: number) => {
    setLoading(true);
    try {
      const rep = await getOrCreateAnnualReport(year, currentUser?.nama || 'Kepala Seksi');
      setReport(rep);

      const [secProf, secPlans, snap] = await Promise.all([
        getSectionProfile(rep.id, year),
        getSectionPlans(rep.id),
        getReportSnapshot(rep.id)
      ]);

      setSectionProfile(secProf);
      setSectionPlans(secPlans);
      setSnapshot(snap);

      // Consolidate live operational data
      const full = await consolidateAnnualReportData(rep, allIndikators, allCapaian);
      setConsolidatedData(full);
    } catch (err) {
      console.error('Error loading annual report dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.nama, allIndikators, allCapaian]);

  useEffect(() => {
    loadYearData(selectedYear);
  }, [selectedYear, loadYearData]);

  // Save Section Profile
  const handleSaveProfile = async () => {
    if (!sectionProfile) return;
    const ok = await upsertSectionProfile(sectionProfile);
    if (ok) {
      Swal.fire({
        icon: 'success',
        title: 'Profil Seksi Tersimpan',
        timer: 1200,
        showConfirmButton: false
      });
      // Refresh consolidated data
      if (report) {
        const full = await consolidateAnnualReportData(report, allIndikators, allCapaian);
        setConsolidatedData(full);
      }
    } else {
      Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan profil seksi.', 'error');
    }
  };

  // Section Plan Handlers
  const handleSaveSectionPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !editingPlan?.strategic_action) return;

    const planObj: AnnualSectionPlan = {
      id: editingPlan.id || `secplan-${Date.now()}`,
      report_id: report.id,
      section_plan_title: editingPlan.section_plan_title || editingPlan.strategic_action,
      source_unit_ids: editingPlan.source_unit_ids || [],
      problem: editingPlan.problem || '',
      strategic_action: editingPlan.strategic_action,
      target_completion: editingPlan.target_completion || 'Triwulan I',
      resource_needs: editingPlan.resource_needs || '',
      success_indicator: editingPlan.success_indicator || '',
      priority: (editingPlan.priority as any) || 'Sedang'
    };

    const ok = await upsertSectionPlan(planObj);
    if (ok) {
      const idx = sectionPlans.findIndex(p => p.id === planObj.id);
      if (idx >= 0) {
        const next = [...sectionPlans];
        next[idx] = planObj;
        setSectionPlans(next);
      } else {
        setSectionPlans([...sectionPlans, planObj]);
      }
      setIsPlanModalOpen(false);
      setEditingPlan(null);

      // Refresh consolidation
      const full = await consolidateAnnualReportData(report, allIndikators, allCapaian);
      setConsolidatedData(full);
    }
  };

  const handleDeleteSectionPlan = (id: string) => {
    if (!report) return;
    Swal.fire({
      title: 'Hapus Rencana Kerja Seksi?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus'
    }).then(async res => {
      if (res.isConfirmed) {
        await deleteSectionPlan(report.id, id);
        setSectionPlans(sectionPlans.filter(p => p.id !== id));
      }
    });
  };

  // Finalize / Snapshot Handlers (Modul 12)
  const handleFinalizeSnapshot = async () => {
    if (!report) return;

    const { isConfirmed } = await Swal.fire({
      title: 'Finalisasi Laporan Tahunan?',
      text: `Data seluruh unit dan capaian KPI Tahun ${report.report_year} akan dibekukan ke dalam snapshot resmi. Dokumen Word dan PDF akan dihasilkan berdasarkan data final ini.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0D5C75',
      confirmButtonText: 'Ya, Finalisasi & Bekukan'
    });

    if (!isConfirmed) return;

    const latestFullData = await consolidateAnnualReportData(report, allIndikators, allCapaian);
    const revNum = (snapshot?.revision_number || 0) + 1;

    const newSnapshot: AnnualReportSnapshot = {
      id: snapshot?.id || `snap-${report.id}`,
      report_id: report.id,
      report_title: report.report_title,
      updated_by: currentUser?.nama || 'Kepala Seksi',
      revision_number: revNum,
      snapshot_json: latestFullData,
      updated_at: new Date().toISOString()
    };

    const ok = await upsertReportSnapshot(newSnapshot);
    if (ok) {
      setSnapshot(newSnapshot);
      setConsolidatedData(latestFullData);
      Swal.fire({
        icon: 'success',
        title: 'Laporan Berhasil Difinalisasi',
        text: `Snapshot resmi (Revisi #${revNum}) berhasil disimpan. Anda dapat mengunduh dokumen atau memperbaruinya kapan saja jika ada revisi operasional.`,
        confirmButtonColor: '#0D5C75'
      });
    } else {
      Swal.fire('Gagal', 'Terjadi kesalahan saat memfinalisasi snapshot.', 'error');
    }
  };

  // AI Assist SWOT Generator (Optional feature from Bagian 10.3)
  const handleAiAssistSwot = () => {
    if (!sectionProfile || !consolidatedData) return;
    Swal.fire({
      title: 'Bantu Susun Analisis SWOT?',
      text: 'Sistem akan merumuskan draft analisis SWOT berdasarkan capaian KPI aktual, rekap SDM, dan hambatan operasional seluruh unit.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#0D5C75',
      confirmButtonText: 'Ya, Susunkan Draft'
    }).then(res => {
      if (res.isConfirmed) {
        const stats = consolidatedData.overallKpiStats;
        const sdm = consolidatedData.staffingSummary;
        
        const generatedStrength = `• Kinerja mutu pelayanan berjalan optimal dengan ${stats.totalTercapai} dari ${stats.totalIndikator} indikator (${stats.persenTercapai}%) memenuhi target mutu.\n• Pelayanan penunjang didukung oleh ${sdm.totalPegawai} tenaga profesional berkompeten di 11 unit kerja.\n• Sistem SIPAKAR memberikan transparansi pelaporan kinerja secara real-time dan terintegrasi.`;
        
        const generatedWeakness = `• Terdapat kekurangan ${sdm.totalKekurangan} tenaga berdasarkan analisis beban kerja pada beberapa unit penunjang.\n• Sebanyak ${stats.totalTidakTercapai} indikator mutu belum mencapai target yang ditetapkan dan memerlukan optimalisasi.\n• Keterbatasan ruang penyimpanan fisik dan sarana penunjang pada unit dengan utilisasi tinggi.`;

        const generatedOpportunity = `• Dukungan penuh Direksi UOBK RSUD Al-Mulk dan Pemkot Sukabumi dalam penguatan layanan rujukan daerah.\n• Percepatan digitalisasi integrasi SATUSEHAT Kemenkes RI dan rekam medis elektronik (RME).\n• Peluang pengembangan kerja sama pendidikan dan penelitian medis di Kota Sukabumi.`;

        const generatedThreat = `• Kenaikan harga reagen impor dan fluktuasi rantai pasok bahan medis habis pakai.\n• Tuntutan kepuasan masyarakat yang terus meningkat terhadap kecepatan layanan rumah sakit.\n• Regulasi perizinan dan standar akreditasi rumah sakit yang terus berkembang dinamis.`;

        setSectionProfile({
          ...sectionProfile,
          swot_strength: generatedStrength,
          swot_weakness: generatedWeakness,
          swot_opportunity: generatedOpportunity,
          swot_threat: generatedThreat
        });

        Swal.fire('Berhasil', 'Draft narasi SWOT berhasil diisikan ke formulir. Anda dapat mengedit dan menyesuaikan narasi tersebut sebelum disimpan.', 'success');
      }
    });
  };

  // Downloads Handlers
  const handleDownloadDocx = async () => {
    const dataToUse = snapshot?.snapshot_json || consolidatedData;
    if (!dataToUse) return;
    try {
      await generateAnnualReportDocx(dataToUse, pengaturan);
    } catch (e) {
      console.error(e);
      Swal.fire('Gagal', 'Terjadi kesalahan saat menghasilkan dokumen Word.', 'error');
    }
  };

  const handleDownloadPdf = () => {
    const dataToUse = snapshot?.snapshot_json || consolidatedData;
    if (!dataToUse) return;
    try {
      generateAnnualReportPdf(dataToUse, pengaturan);
    } catch (e) {
      console.error(e);
      Swal.fire('Gagal', 'Terjadi kesalahan saat menghasilkan dokumen PDF.', 'error');
    }
  };

  const handleDownloadExcel = () => {
    const dataToUse = snapshot?.snapshot_json || consolidatedData;
    if (!dataToUse) return;
    try {
      generateAnnualReportExcel(dataToUse);
    } catch (e) {
      console.error(e);
      Swal.fire('Gagal', 'Terjadi kesalahan saat menghasilkan file Excel.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Data to display in generator preview
  const activeReportData = snapshot?.snapshot_json || consolidatedData;

  if (loading || !report || !sectionProfile || !consolidatedData) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600">
          Mengonsolidasi modul laporan tahunan Seksi Penunjang...
        </p>
      </div>
    );
  }

  // Calculate Unit Completeness
  const unitsStatus = ACTIVE_MASTER_UNITS.map(u => {
    const prof = consolidatedData.unitProfiles[u.id];
    const sdmCount = consolidatedData.unitStaffing[u.id]?.length || 0;
    const progCount = consolidatedData.unitProgramTables[u.id]?.length || 0;
    const kpiCount = consolidatedData.kpiSummaries[u.id]?.length || 0;
    const kpiReported = consolidatedData.kpiSummaries[u.id]?.filter(k => k.months_reported > 0).length || 0;
    const obsCount = consolidatedData.unitObstacles[u.id]?.length || 0;
    const planCount = consolidatedData.unitPlans[u.id]?.length || 0;

    const hasData = sdmCount > 0 || progCount > 0 || kpiReported > 0 || obsCount > 0 || planCount > 0;

    return {
      unit: u,
      prof,
      sdmCount,
      progCount,
      kpiCount,
      kpiReported,
      obsCount,
      planCount,
      hasData
    };
  });

  const unitsWithData = unitsStatus.filter(u => u.hasData).length;
  const unitsWithoutData = 11 - unitsWithData;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30 mb-2">
              <Sparkles size={13} /> Modul Penyusunan Laporan Tahunan Terintegrasi
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
              PENYUSUNAN LAPORAN TAHUNAN
            </h1>
            <p className="text-teal-100/80 text-xs sm:text-sm mt-1 max-w-2xl">
              Sistem Pengelolaan dan Konsolidasi Laporan Seksi Penunjang, Mutu, Humas dan Pemasaran UOBK RSUD Al-Mulk Kota Sukabumi.
            </p>
          </div>

          {/* Year Switcher & Quick Finalize Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/20 flex items-center gap-2">
              <Calendar size={18} className="text-teal-300" />
              <div>
                <span className="block text-[10px] text-teal-200/80 font-bold uppercase">
                  Tahun Anggaran
                </span>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent font-black text-sm text-white outline-none cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y} className="text-slate-900">
                      Tahun {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {snapshot ? (
              <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
                <FileCheck className="text-emerald-300" size={18} />
                <div>
                  <span className="font-bold text-emerald-200 block">Snapshot Final Aktif</span>
                  <span className="text-[10px] text-emerald-100">Revisi #{snapshot.revision_number}</span>
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
                <AlertTriangle className="text-amber-300" size={18} />
                <div>
                  <span className="font-bold text-amber-200 block">Data Operasional</span>
                  <span className="text-[10px] text-amber-100">Belum Difinalisasi</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 9 Main Internal Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 min-w-[900px]">
          {[
            { id: 'dashboard', label: '1. Dashboard Laporan', icon: LayoutDashboard },
            { id: 'gambaran_umum', label: '2. Gambaran Umum Seksi', icon: Building },
            { id: 'analisis_situasi', label: '3. Analisis Situasi', icon: Sparkles },
            { id: 'kpi', label: '4. Target & Capaian KPI', icon: BarChart3 },
            { id: 'sdm', label: '5. Rekapitulasi SDM', icon: Users },
            { id: 'rencana_seksi', label: '6. Rencana Kerja Seksi', icon: Calendar },
            { id: 'laporan_unit', label: '7. Laporan Unit', icon: Layers },
            { id: 'data_final', label: '8. Data Final Laporan', icon: FileCheck },
            { id: 'generator', label: '9. Generator Dokumen', icon: Download }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: DASHBOARD LAPORAN */}
      {/* ==================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Unit Pengisi Laporan
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{unitsWithData}</span>
                <span className="text-xs font-semibold text-slate-500">/ 11 Unit Aktif</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {unitsWithoutData > 0 ? `${unitsWithoutData} unit belum menginput data` : 'Seluruh unit aktif sudah memiliki data'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Kinerja KPI Seksi
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-teal-700">
                  {consolidatedData.overallKpiStats.persenTercapai}%
                </span>
                <span className="text-xs font-semibold text-slate-500">Tercapai</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {consolidatedData.overallKpiStats.totalTercapai} dari {consolidatedData.overallKpiStats.totalIndikator} indikator memenuhi target
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Total SDM Seksi
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {consolidatedData.staffingSummary.totalPegawai}
                </span>
                <span className="text-xs font-semibold text-slate-500">Pegawai</span>
              </div>
              <p className="text-[11px] text-rose-600 font-semibold mt-2">
                Kekurangan tenaga: {consolidatedData.staffingSummary.totalKekurangan} orang
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Rencana Kerja Terhimpun
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {Object.values(consolidatedData.unitPlans).reduce((acc, cur) => acc + cur.length, 0)}
                </span>
                <span className="text-xs font-semibold text-slate-500">Rencana Unit</span>
              </div>
              <p className="text-[11px] text-teal-700 font-semibold mt-2">
                {sectionPlans.length} program strategis seksi
              </p>
            </div>
          </div>

          {/* Unit Status Grid */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  Status Pengisian Laporan 11 Unit Aktif
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klik tombol pada unit terkait untuk memeriksa atau mengedit rincian laporannya.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {unitsStatus.map(st => (
                <div
                  key={st.unit.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-500/50 hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {st.unit.kategori}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{st.unit.name}</h4>
                    </div>
                    {st.hasData ? (
                      <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200/60">
                    <div>SDM: <b>{st.sdmCount}</b> org</div>
                    <div>Tabel: <b>{st.progCount}</b> buah</div>
                    <div>KPI Lapor: <b>{st.kpiReported}/{st.kpiCount}</b></div>
                    <div>Rencana: <b>{st.planCount}</b> prog</div>
                  </div>

                  <button
                    onClick={() => {
                      setInspectorUnit(st.unit);
                      setActiveTab('laporan_unit');
                    }}
                    className="w-full text-center py-1.5 px-3 bg-white border border-slate-200 hover:border-teal-600 hover:text-teal-700 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs"
                  >
                    Buka Laporan Unit →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: GAMBARAN UMUM SEKSI (BAB I) */}
      {/* ==================================================================== */}
      {activeTab === 'gambaran_umum' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Building size={18} className="text-teal-600" /> Gambaran Umum Seksi (BAB I)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Uraian pendahuluan, latar belakang, tujuan, gambaran umum, struktur organisasi, dan tupoksi seksi.
              </p>
            </div>
            <button
              onClick={handleSaveProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Save size={14} /> Simpan Bab I
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">1.1 Latar Belakang</label>
              <textarea
                rows={4}
                value={sectionProfile.background || ''}
                onChange={e => setSectionProfile({ ...sectionProfile, background: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">1.2 Tujuan Penyusunan Laporan</label>
              <textarea
                rows={4}
                value={sectionProfile.objectives || ''}
                onChange={e => setSectionProfile({ ...sectionProfile, objectives: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">1.3 Gambaran Umum Seksi Penunjang</label>
              <textarea
                rows={3}
                value={sectionProfile.section_overview || ''}
                onChange={e => setSectionProfile({ ...sectionProfile, section_overview: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">1.4 Struktur Organisasi</label>
                <textarea
                  rows={3}
                  value={sectionProfile.organizational_structure || ''}
                  onChange={e => setSectionProfile({ ...sectionProfile, organizational_structure: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">1.5 Tugas Pokok dan Fungsi</label>
                <textarea
                  rows={3}
                  value={sectionProfile.main_duties || ''}
                  onChange={e => setSectionProfile({ ...sectionProfile, main_duties: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs">Identitas Pejabat Penandatangan</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Nama Pejabat</label>
                  <input
                    type="text"
                    value={sectionProfile.pejabat_nama || ''}
                    onChange={e => setSectionProfile({ ...sectionProfile, pejabat_nama: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">NIP</label>
                  <input
                    type="text"
                    value={sectionProfile.pejabat_nip || ''}
                    onChange={e => setSectionProfile({ ...sectionProfile, pejabat_nip: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Jabatan</label>
                  <input
                    type="text"
                    value={sectionProfile.pejabat_jabatan || ''}
                    onChange={e => setSectionProfile({ ...sectionProfile, pejabat_jabatan: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: ANALISIS SITUASI & SWOT (BAB II) */}
      {/* ==================================================================== */}
      {activeTab === 'analisis_situasi' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Sparkles size={18} className="text-teal-600" /> Analisis Situasi dan SWOT Seksi (BAB II)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kondisi umum, 4 panel matriks SWOT, isu strategis, dan evaluasi penutup.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAiAssistSwot}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all"
                title="Bantu rumuskan narasi SWOT dari data aktual"
              >
                <Sparkles size={14} /> AI Assist SWOT
              </button>
              <button
                onClick={handleSaveProfile}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Save size={14} /> Simpan Bab II
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">2.1 Gambaran Kondisi Umum</label>
              <textarea
                rows={3}
                value={sectionProfile.general_conditions || ''}
                onChange={e => setSectionProfile({ ...sectionProfile, general_conditions: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 outline-none"
              />
            </div>

            {/* 4-Panel SWOT Matrix */}
            <div>
              <label className="block font-bold text-slate-700 mb-2">2.2 Matriks SWOT Seksi Penunjang</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-2">
                  <div className="flex items-center justify-between text-teal-800 font-bold">
                    <span>KEKUATAN (STRENGTHS)</span>
                    <span className="text-[10px] bg-teal-200 px-2 py-0.5 rounded">Internal</span>
                  </div>
                  <textarea
                    rows={4}
                    value={sectionProfile.swot_strength || ''}
                    onChange={e => setSectionProfile({ ...sectionProfile, swot_strength: e.target.value })}
                    placeholder="Poin kekuatan seksi..."
                    className="w-full bg-white border border-teal-200 rounded-lg p-2.5 text-slate-800 outline-none"
                  />
                </div>

                {/* Weaknesses */}
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                  <div className="flex items-center justify-between text-rose-800 font-bold">
                    <span>KELEMAHAN (WEAKNESSES)</span>
                    <span className="text-[10px] bg-rose-200 px-2 py-0.5 rounded">Internal</span>
                  </div>
                  <textarea
                    rows={4}
                    value={sectionProfile.swot_weakness || ''}
                    onChange={e => setSectionProfile({ ...sectionProfile, swot_weakness: e.target.value })}
                    placeholder="Poin kelemahan seksi..."
                    className="w-full bg-white border border-rose-200 rounded-lg p-2.5 text-slate-800 outline-none"
                  />
                </div>

                {/* Opportunities */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                  <div className="flex items-center justify-between text-blue-800 font-bold">
                    <span>PELUANG (OPPORTUNITIES)</span>
                    <span className="text-[10px] bg-blue-200 px-2 py-0.5 rounded">Eksternal</span>
                  </div>
                  <textarea
                    rows={4}
                    value={sectionProfile.swot_opportunity || ''}
                    onChange={e => setSectionProfile({ ...sectionProfile, swot_opportunity: e.target.value })}
                    placeholder="Poin peluang seksi..."
                    className="w-full bg-white border border-blue-200 rounded-lg p-2.5 text-slate-800 outline-none"
                  />
                </div>

                {/* Threats */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                  <div className="flex items-center justify-between text-amber-800 font-bold">
                    <span>ANCAMAN (THREATS)</span>
                    <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded">Eksternal</span>
                  </div>
                  <textarea
                    rows={4}
                    value={sectionProfile.swot_threat || ''}
                    onChange={e => setSectionProfile({ ...sectionProfile, swot_threat: e.target.value })}
                    placeholder="Poin ancaman / tantangan seksi..."
                    className="w-full bg-white border border-amber-200 rounded-lg p-2.5 text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">2.5 Permasalahan dan Isu Strategis</label>
              <textarea
                rows={3}
                value={sectionProfile.strategic_issues || ''}
                onChange={e => setSectionProfile({ ...sectionProfile, strategic_issues: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
              <div>
                <label className="block font-bold text-slate-700 mb-1">5.1 Kesimpulan (Penutup)</label>
                <textarea
                  rows={3}
                  value={sectionProfile.conclusion || ''}
                  onChange={e => setSectionProfile({ ...sectionProfile, conclusion: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">5.2 Rekomendasi</label>
                <textarea
                  rows={3}
                  value={sectionProfile.recommendation || ''}
                  onChange={e => setSectionProfile({ ...sectionProfile, recommendation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">5.3 Rencana Perbaikan</label>
                <textarea
                  rows={3}
                  value={sectionProfile.improvement_plan || ''}
                  onChange={e => setSectionProfile({ ...sectionProfile, improvement_plan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: TARGET & CAPAIAN KPI (BAB IV) */}
      {/* ==================================================================== */}
      {activeTab === 'kpi' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <BarChart3 size={18} className="text-teal-600" /> Target dan Capaian Kinerja KPI Seksi (BAB IV)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konsolidasi capaian resmi seluruh unit penunjang. Terhubung langsung ke database KPI SIPAKAR.
              </p>
            </div>
            <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              💡 Target dikelola melalui modul <b>Profil Indikator</b>
            </div>
          </div>

          {/* KPI Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Unit</label>
              <select
                value={kpiFilterUnit}
                onChange={e => setKpiFilterUnit(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
              >
                <option value="Semua Unit">Semua Unit</option>
                {ACTIVE_MASTER_UNITS.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status Kinerja</label>
              <select
                value={kpiFilterStatus}
                onChange={e => setKpiFilterStatus(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
              >
                <option value="Semua Status">Semua Status</option>
                <option value="Tercapai">Tercapai</option>
                <option value="Mendekati Target">Mendekati Target</option>
                <option value="Tidak Tercapai">Tidak Tercapai</option>
                <option value="Belum Melapor">Belum Melapor</option>
              </select>
            </div>
          </div>

          {/* Consolidated KPI Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10 text-center">No</th>
                  <th className="p-3">Unit Penunjang</th>
                  <th className="p-3 w-28">Kode KPI</th>
                  <th className="p-3">Indikator Mutu</th>
                  <th className="p-3 text-center">Target</th>
                  <th className="p-3 text-center">Realisasi</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Bulan Lapor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {(() => {
                  let rows: any[] = [];
                  ACTIVE_MASTER_UNITS.forEach(u => {
                    const list = consolidatedData.kpiSummaries[u.id] || [];
                    list.forEach(k => {
                      if (kpiFilterUnit !== 'Semua Unit' && u.name !== kpiFilterUnit) return;
                      if (kpiFilterStatus !== 'Semua Status' && k.status !== kpiFilterStatus) return;
                      rows.push({ unitName: u.name, kpi: k });
                    });
                  });

                  if (rows.length === 0) {
                    return (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          Tidak ada indikator KPI yang cocok dengan filter yang dipilih.
                        </td>
                      </tr>
                    );
                  }

                  return rows.map((r, idx) => (
                    <tr key={`${r.unitName}-${r.kpi.kode}`} className="hover:bg-slate-50">
                      <td className="p-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-700">{r.unitName}</td>
                      <td className="p-3 font-mono font-bold text-teal-700">{r.kpi.kode}</td>
                      <td className="p-3 font-medium text-slate-800">{r.kpi.nama}</td>
                      <td className="p-3 text-center font-bold text-slate-700">
                        {r.kpi.target}{r.kpi.satuan}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-900">
                        {r.kpi.months_reported > 0 ? `${r.kpi.capaian_annual}${r.kpi.satuan}` : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          r.kpi.status === 'Tercapai'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : r.kpi.status === 'Mendekati Target'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : r.kpi.status === 'Tidak Tercapai'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {r.kpi.status}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-600">
                        {r.kpi.months_reported} / 12 bln
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: REKAPITULASI SDM SELURUH SEKSI (BAB II.3) */}
      {/* ==================================================================== */}
      {activeTab === 'sdm' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Users size={18} className="text-teal-600" /> Rekapitulasi Sumber Daya Manusia Seluruh Seksi (BAB II.3)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Gabungan komposisi pegawai dari 11 unit penunjang beserta rekap ketersediaan dan kebutuhan formasi.
              </p>
            </div>
          </div>

          {/* SDM Summary Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-bold block">Total Pegawai</span>
              <span className="text-lg font-black text-slate-800">{consolidatedData.staffingSummary.totalPegawai}</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
              <span className="text-[10px] text-blue-700 font-bold block">PNS</span>
              <span className="text-lg font-black text-blue-900">{consolidatedData.staffingSummary.totalPns}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <span className="text-[10px] text-emerald-700 font-bold block">PPPK</span>
              <span className="text-lg font-black text-emerald-900">{consolidatedData.staffingSummary.totalPppk}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
              <span className="text-[10px] text-amber-700 font-bold block">THL</span>
              <span className="text-lg font-black text-amber-900">{consolidatedData.staffingSummary.totalThl}</span>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
              <span className="text-[10px] text-purple-700 font-bold block">Kontrak</span>
              <span className="text-lg font-black text-purple-900">{consolidatedData.staffingSummary.totalKontrak}</span>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 text-center">
              <span className="text-[10px] text-slate-700 font-bold block">Kebutuhan</span>
              <span className="text-lg font-black text-slate-900">{consolidatedData.staffingSummary.totalKebutuhan}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
              <span className="text-[10px] text-rose-700 font-bold block">Kekurangan</span>
              <span className="text-lg font-black text-rose-700">-{consolidatedData.staffingSummary.totalKekurangan}</span>
            </div>
          </div>

          {/* Full SDM Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10 text-center">No</th>
                  <th className="p-3">Unit Kerja</th>
                  <th className="p-3">Nama Pegawai</th>
                  <th className="p-3">Pendidikan</th>
                  <th className="p-3">Profesi / Posisi</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Tersedia</th>
                  <th className="p-3 text-center">Kebutuhan</th>
                  <th className="p-3 text-center">Defisit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {(() => {
                  let rows: any[] = [];
                  ACTIVE_MASTER_UNITS.forEach(u => {
                    const list = consolidatedData.unitStaffing[u.id] || [];
                    list.forEach(s => {
                      rows.push({ unitName: u.name, staff: s });
                    });
                  });

                  if (rows.length === 0) {
                    return (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">
                          Belum ada data SDM yang dimasukkan oleh masing-masing unit.
                        </td>
                      </tr>
                    );
                  }

                  return rows.map((r, idx) => {
                    const avail = r.staff.available_count || 1;
                    const req = r.staff.required_count || 1;
                    const def = Math.max(0, req - avail);
                    return (
                      <tr key={r.staff.id} className="hover:bg-slate-50">
                        <td className="p-3 text-center text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-700">{r.unitName}</td>
                        <td className="p-3 font-semibold text-slate-800">{r.staff.employee_name}</td>
                        <td className="p-3 text-slate-600">{r.staff.education || '-'}</td>
                        <td className="p-3 text-slate-600">{r.staff.profession} ({r.staff.position})</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {r.staff.employment_status || 'PNS'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">{avail}</td>
                        <td className="p-3 text-center font-bold text-slate-800">{req}</td>
                        <td className="p-3 text-center font-bold text-rose-600">
                          {def > 0 ? `-${def}` : '0'}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: RENCANA KERJA SEKSI (BAB II.6) */}
      {/* ==================================================================== */}
      {activeTab === 'rencana_seksi' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Calendar size={18} className="text-teal-600" /> Rencana Kerja Seksi Penunjang (BAB II.6)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konsolidasi rencana strategis lintas unit untuk periode perencanaan tahun {selectedYear + 1}.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingPlan({
                  section_plan_title: '',
                  problem: '',
                  strategic_action: '',
                  target_completion: 'Triwulan I',
                  resource_needs: '',
                  success_indicator: '',
                  priority: 'Sedang'
                });
                setIsPlanModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Plus size={14} /> Tambah Rencana Strategis Seksi
            </button>
          </div>

          {/* Section Plans Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10 text-center">No</th>
                  <th className="p-3">Program / Tindakan Strategis</th>
                  <th className="p-3">Akar Masalah / Latar Belakang</th>
                  <th className="p-3 text-center">Target Waktu</th>
                  <th className="p-3">Kebutuhan Sumber Daya</th>
                  <th className="p-3">Indikator Sukses</th>
                  <th className="p-3 text-center">Prioritas</th>
                  <th className="p-3 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sectionPlans.length > 0 ? (
                  sectionPlans.map((sp, idx) => (
                    <tr key={sp.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-800">{sp.strategic_action || sp.section_plan_title}</td>
                      <td className="p-3 text-slate-600">{sp.problem || '-'}</td>
                      <td className="p-3 text-center font-semibold text-slate-700">
                        {sp.target_completion || '-'}
                      </td>
                      <td className="p-3 text-slate-600">{sp.resource_needs || '-'}</td>
                      <td className="p-3 text-slate-600">{sp.success_indicator || '-'}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          sp.priority === 'Tinggi' ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700'
                        }`}>
                          {sp.priority}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingPlan(sp);
                              setIsPlanModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-teal-600"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteSectionPlan(sp.id)}
                            className="p-1 text-slate-500 hover:text-rose-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Belum ada rencana kerja strategis seksi yang ditambahkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Quick Consolidation helper from unit plans */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs">
              Rencana Kerja Asli Masing-Masing Unit (Sumber Konsolidasi)
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2 text-xs">
              {ACTIVE_MASTER_UNITS.map(u => {
                const list = consolidatedData.unitPlans[u.id] || [];
                if (list.length === 0) return null;
                return (
                  <div key={u.id} className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-teal-800 block mb-1">{u.name}:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[11px]">
                      {list.map(p => (
                        <li key={p.id}>
                          <b>{p.action_plan}</b> — Target: {p.target_completion || '-'} (Kebutuhan: {p.resource_needs || '-'})
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 7: LAPORAN UNIT */}
      {/* ==================================================================== */}
      {activeTab === 'laporan_unit' && (
        <div className="space-y-4">
          {/* Unit Switcher Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Pilih Unit Penunjang:</span>
              <select
                value={inspectorUnit.id}
                onChange={e => {
                  const found = ACTIVE_MASTER_UNITS.find(u => u.id === e.target.value);
                  if (found) setInspectorUnit(found);
                }}
                className="bg-slate-50 border border-slate-300 font-bold text-xs text-slate-800 rounded-lg px-3 py-1.5 outline-none"
              >
                {ACTIVE_MASTER_UNITS.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.kategori})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-slate-500">
              Menampilkan formulir & data unit <b>{inspectorUnit.name}</b>
            </span>
          </div>

          <UnitReportForm
            key={inspectorUnit.id}
            report={report}
            unit={inspectorUnit}
            allIndikators={allIndikators}
            allCapaian={allCapaian}
            readOnly={false}
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 8: DATA FINAL LAPORAN (SNAPSHOT MODUL 11.10 & 12) */}
      {/* ==================================================================== */}
      {activeTab === 'data_final' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <FileCheck size={18} className="text-teal-600" /> Data Final Laporan Tahunan (Snapshot)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengelolaan snapshot data final yang dibekukan untuk dokumen resmi Word dan PDF.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleFinalizeSnapshot}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Lock size={14} /> {snapshot ? 'Perbarui & Bekukan Ulang Snapshot' : 'Finalisasi & Bekukan Snapshot'}
              </button>
            </div>
          </div>

          {snapshot ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-emerald-900 block text-sm">
                    Snapshot Data Final Aktif (Revisi #{snapshot.revision_number})
                  </span>
                  <span className="text-emerald-700">
                    Difinalisasi oleh: <b>{snapshot.updated_by}</b> pada{' '}
                    {snapshot.updated_at ? new Date(snapshot.updated_at).toLocaleString('id-ID') : '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('generator')}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-all"
                  >
                    Buka Generator Dokumen →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">Capaian KPI Dibekukan</span>
                  <span className="text-xl font-black text-slate-800">
                    {snapshot.snapshot_json.overallKpiStats.persenTercapai}%
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {snapshot.snapshot_json.overallKpiStats.totalTercapai} indikator tercapai
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">Total SDM Terdata</span>
                  <span className="text-xl font-black text-slate-800">
                    {snapshot.snapshot_json.staffingSummary.totalPegawai} Orang
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Defisit: {snapshot.snapshot_json.staffingSummary.totalKekurangan} formasi
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">Total Rencana Strategis</span>
                  <span className="text-xl font-black text-slate-800">
                    {snapshot.snapshot_json.sectionPlans.length} Program
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Siap dituangkan ke dokumen laporan
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl space-y-3">
              <FileCheck size={40} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold">Laporan Tahun {selectedYear} belum difinalisasi.</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Setelah semua unit mengisi data dan Kepala Seksi menyelesaikan analisis BAB I & BAB II, klik tombol <b>&quot;Finalisasi &amp; Bekukan Snapshot&quot;</b> untuk menghasilkan data final laporan.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 9: GENERATOR DOKUMEN (WORD, PDF, EXCEL, CETAK) */}
      {/* ==================================================================== */}
      {activeTab === 'generator' && activeReportData && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                Unduh & Cetak Dokumen Laporan Tahunan
              </h3>
              <p className="text-[11px] text-slate-500">
                Format resmi sesuai standar pelaporan akuntabilitas kinerja RSUD Al-Mulk.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadDocx}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Download size={14} /> Download Word (.docx)
              </button>
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Download size={14} /> Download PDF (.pdf)
              </button>
              <button
                onClick={handleDownloadExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <FileSpreadsheet size={14} /> Download Excel (.xlsx)
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Printer size={14} /> Cetak
              </button>
            </div>
          </div>

          {/* Interactive Document Preview Container */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-md max-w-4xl mx-auto space-y-8 font-sans text-slate-800 print:border-none print:shadow-none print:p-0">
            {/* Cover */}
            <div className="text-center py-12 border-b border-slate-200 space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-700 tracking-wider">PEMERINTAH KOTA SUKABUMI</h3>
                <h2 className="text-2xl font-black text-teal-800 tracking-tight">
                  {pengaturan?.nama_rs || 'UOBK RSUD AL-MULK'}
                </h2>
                <div className="w-32 h-1 bg-teal-600 mx-auto rounded-full my-2" />
              </div>

              <div className="py-8 space-y-2">
                <h1 className="text-3xl font-black text-slate-900">LAPORAN TAHUNAN</h1>
                <h3 className="text-lg font-bold text-emerald-700">
                  SEKSI PENUNJANG, MUTU, HUMAS DAN PEMASARAN
                </h3>
                <h4 className="text-xl font-extrabold text-slate-800">
                  TAHUN ANGGARAN {activeReportData.report.report_year}
                </h4>
              </div>

              <div className="text-xs text-slate-500 pt-8 space-y-1">
                <p>{pengaturan?.alamat || 'Jl. Pelabuhan II No. Km. 6, Lembursitu, Kota Sukabumi, Jawa Barat'}</p>
                <p>Dokumen Resmi Akuntabilitas Kinerja Pelayanan</p>
              </div>
            </div>

            {/* BAB I */}
            <div className="space-y-3">
              <h2 className="text-lg font-extrabold text-teal-900 border-b pb-1">BAB I. PENDAHULUAN</h2>
              <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                <div>
                  <h4 className="font-bold text-emerald-800">1.1 Latar Belakang</h4>
                  <p className="mt-1 whitespace-pre-line">{activeReportData.sectionProfile.background || '-'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800">1.2 Tujuan Penyusunan</h4>
                  <p className="mt-1 whitespace-pre-line">{activeReportData.sectionProfile.objectives || '-'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800">1.3 Gambaran Umum Seksi</h4>
                  <p className="mt-1 whitespace-pre-line">{activeReportData.sectionProfile.section_overview || '-'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800">1.4 Struktur Organisasi</h4>
                  <p className="mt-1 whitespace-pre-line">{activeReportData.sectionProfile.organizational_structure || '-'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800">1.5 Tugas Pokok dan Fungsi</h4>
                  <p className="mt-1 whitespace-pre-line">{activeReportData.sectionProfile.main_duties || '-'}</p>
                </div>
              </div>
            </div>

            {/* BAB II */}
            <div className="space-y-3 pt-6 border-t border-slate-200">
              <h2 className="text-lg font-extrabold text-teal-900 border-b pb-1">BAB II. ANALISIS SITUASI</h2>
              <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                <div>
                  <h4 className="font-bold text-emerald-800">2.1 Gambaran Kondisi Umum</h4>
                  <p className="mt-1 whitespace-pre-line">{activeReportData.sectionProfile.general_conditions || '-'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800">2.2 Analisis SWOT Seksi Penunjang</h4>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                      <b className="text-teal-900 block mb-1">Kekuatan (Strengths):</b>
                      <p className="whitespace-pre-line">{activeReportData.sectionProfile.swot_strength || '-'}</p>
                    </div>
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                      <b className="text-rose-900 block mb-1">Kelemahan (Weaknesses):</b>
                      <p className="whitespace-pre-line">{activeReportData.sectionProfile.swot_weakness || '-'}</p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <b className="text-blue-900 block mb-1">Peluang (Opportunities):</b>
                      <p className="whitespace-pre-line">{activeReportData.sectionProfile.swot_opportunity || '-'}</p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <b className="text-amber-900 block mb-1">Ancaman (Threats):</b>
                      <p className="whitespace-pre-line">{activeReportData.sectionProfile.swot_threat || '-'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800">2.3 Sumber Daya Manusia Seksi</h4>
                  <p className="mt-1">
                    Total pegawai 11 unit penunjang berjumlah {activeReportData.staffingSummary.totalPegawai} orang (PNS: {activeReportData.staffingSummary.totalPns}, PPPK: {activeReportData.staffingSummary.totalPppk}, THL: {activeReportData.staffingSummary.totalThl}, Kontrak: {activeReportData.staffingSummary.totalKontrak}), dengan kebutuhan {activeReportData.staffingSummary.totalKebutuhan} dan kekurangan {activeReportData.staffingSummary.totalKekurangan} orang.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800">2.4 Target Kinerja Unit</h4>
                  <p className="mt-1">
                    Sebanyak {activeReportData.overallKpiStats.totalTercapai} dari {activeReportData.overallKpiStats.totalIndikator} indikator ({activeReportData.overallKpiStats.persenTercapai}%) berhasil mencapai target pada tahun ini.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800">2.5 Permasalahan dan Isu Strategis</h4>
                  <p className="mt-1 whitespace-pre-line">{activeReportData.sectionProfile.strategic_issues || '-'}</p>
                </div>
              </div>
            </div>

            {/* BAB III Summary */}
            <div className="space-y-3 pt-6 border-t border-slate-200">
              <h2 className="text-lg font-extrabold text-teal-900 border-b pb-1">BAB III. LAPORAN PROGRAM UNIT PENUNJANG</h2>
              <p className="text-xs text-slate-600">
                (Pada dokumen unduhan Word dan PDF, seluruh rincian Profil, SDM, Program Tabel Dinamis, Capaian KPI, Hambatan, dan Rencana Kerja dari ke-11 unit penunjang disajikan secara lengkap dan terstruktur).
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {ACTIVE_MASTER_UNITS.map((u, i) => (
                  <div key={u.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="font-bold text-slate-800">3.{i + 1} Unit {u.name}</span>
                    <span className="block text-[10px] text-slate-500">{u.kategori}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BAB IV */}
            <div className="space-y-3 pt-6 border-t border-slate-200">
              <h2 className="text-lg font-extrabold text-teal-900 border-b pb-1">BAB IV. CAPAIAN KINERJA UNIT PENUNJANG</h2>
              <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Unit</th>
                      <th className="p-2">Kode</th>
                      <th className="p-2">Indikator</th>
                      <th className="p-2 text-center">Target</th>
                      <th className="p-2 text-center">Realisasi</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ACTIVE_MASTER_UNITS.slice(0, 5).map(u => {
                      const list = activeReportData.kpiSummaries[u.id] || [];
                      return list.map(k => (
                        <tr key={k.kode}>
                          <td className="p-2 font-bold">{u.name}</td>
                          <td className="p-2 font-mono text-teal-700">{k.kode}</td>
                          <td className="p-2">{k.nama}</td>
                          <td className="p-2 text-center">{k.target}{k.satuan}</td>
                          <td className="p-2 text-center font-bold">{k.months_reported > 0 ? `${k.capaian_annual}${k.satuan}` : '-'}</td>
                          <td className="p-2 text-center font-semibold text-emerald-700">{k.status}</td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BAB V & Tanda Tangan */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <h2 className="text-lg font-extrabold text-teal-900 border-b pb-1">BAB V. PENUTUP</h2>
              <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                <div>
                  <h4 className="font-bold text-emerald-800">5.1 Kesimpulan</h4>
                  <p className="whitespace-pre-line">{activeReportData.sectionProfile.conclusion || '-'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800">5.2 Rekomendasi</h4>
                  <p className="whitespace-pre-line">{activeReportData.sectionProfile.recommendation || '-'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800">5.3 Rencana Perbaikan</h4>
                  <p className="whitespace-pre-line">{activeReportData.sectionProfile.improvement_plan || '-'}</p>
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="pt-8 flex justify-end">
                <div className="text-center text-xs space-y-1 min-w-[220px]">
                  <p>Sukabumi, 31 Desember {activeReportData.report.report_year}</p>
                  <p className="font-bold">{activeReportData.sectionProfile.pejabat_jabatan || 'Kepala Seksi Penunjang, Mutu, Humas dan Pemasaran'}</p>
                  <p>UOBK RSUD Al-Mulk Kota Sukabumi</p>
                  <div className="h-16" />
                  <p className="font-bold underline text-slate-900">{activeReportData.sectionProfile.pejabat_nama || 'Dr. Fitri Wulandari'}</p>
                  <p className="text-slate-600">NIP. {activeReportData.sectionProfile.pejabat_nip || '19820415 200801 2 011'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Modal (For Tab 6) */}
      {isPlanModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveSectionPlan} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm border-b pb-2">
              {editingPlan.id ? 'Edit Rencana Strategis Seksi' : 'Tambah Rencana Strategis Seksi'}
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rencana Strategis Seksi</label>
                <textarea
                  rows={2}
                  required
                  value={editingPlan.strategic_action || ''}
                  onChange={e => setEditingPlan({ ...editingPlan, strategic_action: e.target.value })}
                  placeholder="Program strategis seksi penunjang..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Akar Masalah / Latar Belakang</label>
                  <input
                    type="text"
                    value={editingPlan.problem || ''}
                    onChange={e => setEditingPlan({ ...editingPlan, problem: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Waktu</label>
                  <input
                    type="text"
                    value={editingPlan.target_completion || ''}
                    onChange={e => setEditingPlan({ ...editingPlan, target_completion: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kebutuhan Sumber Daya</label>
                  <input
                    type="text"
                    value={editingPlan.resource_needs || ''}
                    onChange={e => setEditingPlan({ ...editingPlan, resource_needs: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={editingPlan.priority || 'Sedang'}
                    onChange={e => setEditingPlan({ ...editingPlan, priority: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="Tinggi">Tinggi</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
