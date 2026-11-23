"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { ACTIVE_MASTER_UNITS, normalizeUnit, MasterUnit } from "@/lib/units";
import SectionReportDashboard from "@/components/laporan/SectionReportDashboard";
import UnitReportForm from "@/components/laporan/UnitReportForm";
import { getOrCreateAnnualReport, checkAnnualTablesExist, pullAllCloudDataToLocal } from "@/lib/annualReportService";
import { AnnualReport } from "@/lib/annualReportTypes";
import Swal from "sweetalert2";
import {
  FileText,
  Calendar,
  Building2,
  Users,
  ShieldCheck,
  UserCheck,
  Eye,
  AlertTriangle,
  Cloud,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

export default function LaporanPage() {
  const { indikatorList, capaianList, currentUser, pengaturan } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [annualReport, setAnnualReport] = useState<AnnualReport | null>(null);
  const [isCloudActive, setIsCloudActive] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // For Kepala Unit or previewing as a specific unit
  const [unitMode, setUnitMode] = useState<MasterUnit | null>(null);

  useEffect(() => {
    setMounted(true);
    checkAnnualTablesExist().then(active => setIsCloudActive(active));
  }, []);

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    try {
      const res = await pullAllCloudDataToLocal();
      if (res.success) {
        const rep = await getOrCreateAnnualReport(selectedYear, currentUser?.nama || 'Kepala Seksi');
        setAnnualReport(rep);
        Swal.fire({
          icon: 'success',
          title: 'Data Berhasil Disinkronkan',
          text: `Berhasil menarik ${res.pulledCount} data terbaru dari Supabase Cloud!`,
          timer: 1800,
          showConfirmButton: false
        });
      }
    } catch (e: any) {
      console.error(e);
      Swal.fire('Gagal Sinkronisasi', e?.message || 'Gagal menghubungi server', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Determine user unit
  useEffect(() => {
    if (currentUser?.role === 'Kepala Unit' && currentUser?.unit) {
      const matched = normalizeUnit(currentUser.unit);
      if (matched) {
        setUnitMode(matched);
      } else {
        setUnitMode(ACTIVE_MASTER_UNITS[0]);
      }
    }
  }, [currentUser]);

  // Load report object for selected year
  useEffect(() => {
    async function initReport() {
      try {
        const rep = await getOrCreateAnnualReport(selectedYear, currentUser?.nama || 'Kepala Seksi');
        setAnnualReport(rep);
      } catch (err) {
        console.error('Failed initializing annual report:', err);
      }
    }
    initReport();
  }, [selectedYear, currentUser]);

  if (!mounted || !annualReport) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
        <p className="text-xs text-slate-500 font-medium">Memuat Modul Penyusunan Laporan Tahunan SIPAKAR...</p>
      </div>
    );
  }

  const isKepalaUnit = currentUser?.role === 'Kepala Unit';
  const isSuperAdminOrKasi = currentUser?.role === 'Super Admin' || currentUser?.role === 'Kepala Seksi' || currentUser?.role === 'Supervisor';

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none print:space-y-0">
      {/* Cloud Database Sync Status Alert */}
      {isCloudActive === false && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs print:hidden">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-amber-900">
              Pemberitahuan Sinkronisasi Cloud: Mode Penyimpanan Lokal Browser Aktif
            </p>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Perubahan yang diisi oleh masing-masing unit saat ini tersimpan di memori peramban (Local Storage) perangkat masing-masing, sehingga belum otomatis tampil pada perangkat lain. Agar seluruh unit dan pimpinan dapat saling melihat hasil pengisian secara langsung dan real-time lintas komputer, jalankan script SQL migrasi <code className="bg-amber-100/90 text-amber-900 px-1 py-0.5 rounded font-mono font-bold">supabase_annual_report_migration.sql</code> pada menu SQL Editor Supabase.
            </p>
          </div>
        </div>
      )}

      {/* Top Banner / Role Notification Bar (if Super Admin or viewing as unit) */}
      {isSuperAdminOrKasi && (
        <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between text-xs gap-3 print:hidden">
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldCheck size={16} className="text-teal-600 shrink-0" />
            <span>
              Mode Akses: <b>{currentUser?.role || 'Kepala Seksi'}</b> ({currentUser?.nama})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncCloud}
              disabled={isSyncing}
              title="Tarik data terbaru yang diinputkan dari perangkat lain ke peramban ini"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isSyncing ? "animate-spin text-teal-600" : "text-teal-600"} />
              <span>{isSyncing ? "Menyinkronkan..." : "Tarik Data Cloud"}</span>
            </button>

            <div className="flex items-center gap-2 border-l border-slate-300 pl-3">
              <span className="text-slate-500">Tampilan Saat Ini:</span>
              <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
                <button
                  onClick={() => setUnitMode(null)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    !unitMode ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Konsolidasi Seksi
                </button>
                <button
                  onClick={() => setUnitMode(ACTIVE_MASTER_UNITS[0])}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    unitMode ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pratinjau Pengisian Unit
                </button>
              </div>
              {unitMode && (
                <select
                  value={unitMode.id}
                  onChange={e => {
                    const u = ACTIVE_MASTER_UNITS.find(item => item.id === e.target.value);
                    if (u) setUnitMode(u);
                  }}
                  className="bg-white border border-slate-300 font-bold text-xs text-slate-800 rounded-lg px-2.5 py-1 outline-none"
                >
                  {ACTIVE_MASTER_UNITS.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main View Router */}
      {isKepalaUnit || unitMode ? (
        <div className="space-y-4 print:space-y-0">
          {/* Year selector for Kepala Unit view */}
          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Calendar size={15} className="text-teal-600" />
              <span>Tahun Laporan:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 outline-none"
              >
                {[2024, 2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>
                    Tahun {y}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncCloud}
                disabled={isSyncing}
                title="Tarik data terbaru yang diinputkan dari perangkat lain ke peramban ini"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={isSyncing ? "animate-spin text-teal-600" : "text-teal-600"} />
                <span>{isSyncing ? "Menyinkronkan..." : "Tarik Data Cloud"}</span>
              </button>
              <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                Formulir Pengisian Laporan Unit
              </span>
            </div>
          </div>

          <UnitReportForm
            key={`${unitMode?.id || 'unit'}-${selectedYear}`}
            report={annualReport}
            unit={unitMode || ACTIVE_MASTER_UNITS[0]}
            allIndikators={indikatorList}
            allCapaian={capaianList}
            readOnly={false}
          />
        </div>
      ) : (
        <SectionReportDashboard
          initialYear={selectedYear}
          allIndikators={indikatorList}
          allCapaian={capaianList}
          pengaturan={pengaturan}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
