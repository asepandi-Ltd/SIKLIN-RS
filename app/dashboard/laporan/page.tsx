"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { ACTIVE_MASTER_UNITS, normalizeUnit, MasterUnit } from "@/lib/units";
import SectionReportDashboard from "@/components/laporan/SectionReportDashboard";
import UnitReportForm from "@/components/laporan/UnitReportForm";
import { getOrCreateAnnualReport } from "@/lib/annualReportService";
import { AnnualReport } from "@/lib/annualReportTypes";
import {
  FileText,
  Calendar,
  Building2,
  Users,
  ShieldCheck,
  UserCheck,
  Eye
} from "lucide-react";

export default function LaporanPage() {
  const { indikatorList, capaianList, currentUser, pengaturan } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [annualReport, setAnnualReport] = useState<AnnualReport | null>(null);

  // For Kepala Unit or previewing as a specific unit
  const [unitMode, setUnitMode] = useState<MasterUnit | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Role Notification Bar (if Super Admin or viewing as unit) */}
      {isSuperAdminOrKasi && (
        <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldCheck size={16} className="text-teal-600 shrink-0" />
            <span>
              Mode Akses: <b>{currentUser?.role || 'Kepala Seksi'}</b> ({currentUser?.nama})
            </span>
          </div>

          <div className="flex items-center gap-2">
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
      )}

      {/* Main View Router */}
      {isKepalaUnit || unitMode ? (
        <div className="space-y-4">
          {/* Year selector for Kepala Unit view */}
          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex items-center justify-between">
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
            <span className="text-xs text-slate-500 font-semibold">
              Formulir Pengisian Laporan Unit
            </span>
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
