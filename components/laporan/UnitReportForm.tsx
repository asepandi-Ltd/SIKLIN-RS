"use client";

import React, { useState, useEffect } from 'react';
import {
  AnnualReport,
  AnnualUnitProfile,
  AnnualUnitStaffing,
  AnnualUnitAuthority,
  AnnualUnitProgramTable,
  AnnualUnitObstacle,
  AnnualUnitPlan,
  AnnualKpiSummaryItem
} from '@/lib/annualReportTypes';
import { MasterUnit } from '@/lib/units';
import { Indikator, Capaian } from '@/lib/store';
import { calculateAnnualKpiForUnit } from '@/lib/annualKpiCalculator';
import DynamicTableBuilder from './DynamicTableBuilder';
import {
  getOrCreateUnitProfile,
  upsertUnitProfile,
  getUnitStaffing,
  upsertUnitStaffing,
  deleteUnitStaffing,
  getUnitAuthorities,
  upsertUnitAuthority,
  deleteUnitAuthority,
  getUnitProgramTables,
  upsertUnitProgramTable,
  deleteUnitProgramTable,
  getUnitObstacles,
  upsertUnitObstacle,
  deleteUnitObstacle,
  getUnitPlans,
  upsertUnitPlan,
  deleteUnitPlan
} from '@/lib/annualReportService';
import {
  Building2,
  Users,
  Briefcase,
  Layers,
  BarChart2,
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  Edit2,
  Info,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Search,
  ExternalLink
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

interface UnitReportFormProps {
  report: AnnualReport;
  unit: MasterUnit;
  allIndikators: Indikator[];
  allCapaian: Capaian[];
  readOnly?: boolean;
}

export default function UnitReportForm({
  report,
  unit,
  allIndikators,
  allCapaian,
  readOnly = false
}: UnitReportFormProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Unit Data States
  const [profile, setProfile] = useState<AnnualUnitProfile | null>(null);
  const [staffing, setStaffing] = useState<AnnualUnitStaffing[]>([]);
  const [authorities, setAuthorities] = useState<AnnualUnitAuthority[]>([]);
  const [programTables, setProgramTables] = useState<AnnualUnitProgramTable[]>([]);
  const [obstacles, setObstacles] = useState<AnnualUnitObstacle[]>([]);
  const [plans, setPlans] = useState<AnnualUnitPlan[]>([]);
  const [kpiList, setKpiList] = useState<AnnualKpiSummaryItem[]>([]);
  const [selectedKpiForDetail, setSelectedKpiForDetail] = useState<AnnualKpiSummaryItem | null>(null);

  // Staffing Form Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<AnnualUnitStaffing> | null>(null);

  // Authority Form Modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingAuth, setEditingAuth] = useState<Partial<AnnualUnitAuthority> | null>(null);

  // Obstacle Modal
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [editingObs, setEditingObs] = useState<Partial<AnnualUnitObstacle> | null>(null);

  // Plan Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<AnnualUnitPlan> | null>(null);

  // Load Unit Data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [prof, staffList, authList, progList, obsList, planList] = await Promise.all([
          getOrCreateUnitProfile(report.id, unit),
          getUnitStaffing(report.id, unit.id),
          getUnitAuthorities(report.id, unit.id),
          getUnitProgramTables(report.id, unit.id),
          getUnitObstacles(report.id, unit.id),
          getUnitPlans(report.id, unit.id)
        ]);

        if (isMounted) {
          setProfile(prof);
          setStaffing(staffList);
          setAuthorities(authList);
          setProgramTables(progList);
          setObstacles(obsList);
          setPlans(planList);

          // Calculate KPI from existing store
          const kpis = calculateAnnualKpiForUnit(unit, allIndikators, allCapaian, report.report_year);
          setKpiList(kpis);
        }
      } catch (err) {
        console.error('Error loading unit report data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [report.id, unit, report.report_year, allIndikators, allCapaian]);

  // Steps configuration (MANDATORY SEQUENCE AS PER BAGIAN 6)
  const steps = [
    { num: 1, title: 'Profil Unit', desc: 'Identitas, Gambaran & Tupoksi', icon: Building2 },
    { num: 2, title: 'SDM & Tugas Staf', desc: 'Komposisi & Kewenangan', icon: Users },
    { num: 3, title: 'Program & Kegiatan', desc: 'Dynamic Table Builder', icon: Layers },
    { num: 4, title: 'Capaian KPI', desc: 'Integrasi Kinerja SIPAKAR', icon: BarChart2 },
    { num: 5, title: 'Hambatan Unit', desc: 'Masalah & Dukungan', icon: AlertTriangle },
    { num: 6, title: 'Rencana Kerja', desc: 'Program & Tindak Lanjut', icon: CalendarCheck }
  ];

  // Completeness check
  const completeness = {
    profile: Boolean(profile?.unit_overview && profile?.main_duties),
    sdm: staffing.length > 0,
    programs: programTables.length > 0,
    kpi: kpiList.length > 0 && kpiList.some(k => k.months_reported > 0),
    obstacles: obstacles.length > 0,
    plans: plans.length > 0
  };

  const completedStepsCount = Object.values(completeness).filter(Boolean).length;
  const progressPercent = Math.round((completedStepsCount / 6) * 100);

  // Save Profile Handler
  const handleSaveProfile = async () => {
    if (!profile) return;
    const ok = await upsertUnitProfile(profile);
    if (ok) {
      Swal.fire({
        icon: 'success',
        title: 'Profil Tersimpan',
        text: 'Data profil unit berhasil disimpan.',
        timer: 1200,
        showConfirmButton: false
      });
    } else {
      Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan profil unit.', 'error');
    }
  };

  // Staffing Handlers
  const handleSaveStaffing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff?.employee_name) return;

    const staffObj: AnnualUnitStaffing = {
      id: editingStaff.id || `stf-${Date.now()}`,
      report_id: report.id,
      unit_id: unit.id,
      employee_name: editingStaff.employee_name,
      education: editingStaff.education || '',
      profession: editingStaff.profession || '',
      position: editingStaff.position || '',
      employment_status: editingStaff.employment_status || 'PNS',
      available_count: Number(editingStaff.available_count) || 1,
      required_count: Number(editingStaff.required_count) || 1
    };

    const ok = await upsertUnitStaffing(staffObj);
    if (ok) {
      const idx = staffing.findIndex(s => s.id === staffObj.id);
      if (idx >= 0) {
        const next = [...staffing];
        next[idx] = staffObj;
        setStaffing(next);
      } else {
        setStaffing([...staffing, staffObj]);
      }
      setIsStaffModalOpen(false);
      setEditingStaff(null);
    }
  };

  const handleDeleteStaffing = (id: string) => {
    Swal.fire({
      title: 'Hapus Pegawai?',
      text: 'Data pegawai akan dihapus dari laporan unit ini.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus'
    }).then(async res => {
      if (res.isConfirmed) {
        await deleteUnitStaffing(report.id, id);
        setStaffing(staffing.filter(s => s.id !== id));
      }
    });
  };

  // Authority Handlers
  const handleSaveAuthority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAuth?.employee_name) return;

    const authObj: AnnualUnitAuthority = {
      id: editingAuth.id || `auth-${Date.now()}`,
      report_id: report.id,
      unit_id: unit.id,
      employee_name: editingAuth.employee_name,
      position: editingAuth.position || '',
      main_duties: editingAuth.main_duties || '',
      responsibilities: editingAuth.responsibilities || '',
      authorities: editingAuth.authorities || ''
    };

    const ok = await upsertUnitAuthority(authObj);
    if (ok) {
      const idx = authorities.findIndex(a => a.id === authObj.id);
      if (idx >= 0) {
        const next = [...authorities];
        next[idx] = authObj;
        setAuthorities(next);
      } else {
        setAuthorities([...authorities, authObj]);
      }
      setIsAuthModalOpen(false);
      setEditingAuth(null);
    }
  };

  const handleDeleteAuthority = (id: string) => {
    Swal.fire({
      title: 'Hapus Pembagian Tugas?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus'
    }).then(async res => {
      if (res.isConfirmed) {
        await deleteUnitAuthority(report.id, id);
        setAuthorities(authorities.filter(a => a.id !== id));
      }
    });
  };

  // Obstacle Handlers
  const handleSaveObstacle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingObs?.problem_title) return;

    const obsObj: AnnualUnitObstacle = {
      id: editingObs.id || `obs-${Date.now()}`,
      report_id: report.id,
      unit_id: unit.id,
      problem_title: editingObs.problem_title,
      description: editingObs.description || '',
      category: editingObs.category || 'SDM',
      root_cause: editingObs.root_cause || '',
      service_impact: editingObs.service_impact || '',
      management_support: editingObs.management_support || '',
      priority: (editingObs.priority as any) || 'Sedang'
    };

    const ok = await upsertUnitObstacle(obsObj);
    if (ok) {
      const idx = obstacles.findIndex(o => o.id === obsObj.id);
      if (idx >= 0) {
        const next = [...obstacles];
        next[idx] = obsObj;
        setObstacles(next);
      } else {
        setObstacles([...obstacles, obsObj]);
      }
      setIsObsModalOpen(false);
      setEditingObs(null);
    }
  };

  const handleDeleteObstacle = (id: string) => {
    Swal.fire({
      title: 'Hapus Masalah/Hambatan?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus'
    }).then(async res => {
      if (res.isConfirmed) {
        await deleteUnitObstacle(report.id, id);
        setObstacles(obstacles.filter(o => o.id !== id));
      }
    });
  };

  // Plan Handlers
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan?.action_plan) return;

    const planObj: AnnualUnitPlan = {
      id: editingPlan.id || `pln-${Date.now()}`,
      report_id: report.id,
      unit_id: unit.id,
      problem: editingPlan.problem || '',
      cause: editingPlan.cause || '',
      action_plan: editingPlan.action_plan,
      target_completion: editingPlan.target_completion || '',
      resource_needs: editingPlan.resource_needs || '',
      success_indicator: editingPlan.success_indicator || '',
      priority: (editingPlan.priority as any) || 'Sedang'
    };

    const ok = await upsertUnitPlan(planObj);
    if (ok) {
      const idx = plans.findIndex(p => p.id === planObj.id);
      if (idx >= 0) {
        const next = [...plans];
        next[idx] = planObj;
        setPlans(next);
      } else {
        setPlans([...plans, planObj]);
      }
      setIsPlanModalOpen(false);
      setEditingPlan(null);
    }
  };

  const handleDeletePlan = (id: string) => {
    Swal.fire({
      title: 'Hapus Rencana Kerja?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus'
    }).then(async res => {
      if (res.isConfirmed) {
        await deleteUnitPlan(report.id, id);
        setPlans(plans.filter(p => p.id !== id));
      }
    });
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3">
        <div className="w-9 h-9 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Memuat data laporan unit {unit.name}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unit Overview Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30 mb-2">
              <Building2 size={13} /> {unit.kategori}
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Laporan Tahunan Unit {unit.name}
            </h2>
            <p className="text-teal-100/80 text-xs mt-1">
              Periode Tahun Anggaran {report.report_year} • UOBK RSUD Al-Mulk Kota Sukabumi
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 min-w-[200px]">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span>Kelengkapan Data</span>
              <span className="text-teal-300">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-teal-200/70 mt-1">
              {completedStepsCount} dari 6 modul telah diisi
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Sequence Steps Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {steps.map(s => {
          const isActive = activeStep === s.num;
          const isDone = 
            (s.num === 1 && completeness.profile) ||
            (s.num === 2 && completeness.sdm) ||
            (s.num === 3 && completeness.programs) ||
            (s.num === 4 && completeness.kpi) ||
            (s.num === 5 && completeness.obstacles) ||
            (s.num === 6 && completeness.plans);

          const IconComponent = s.icon;

          return (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isActive
                  ? 'bg-teal-50 border-teal-600 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                  isActive ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {s.num}
                </span>
                {isDone ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <IconComponent size={16} className={isActive ? 'text-teal-600' : 'text-slate-400'} />
                )}
              </div>
              <div>
                <h4 className={`text-xs font-bold ${isActive ? 'text-teal-900' : 'text-slate-800'}`}>
                  {s.title}
                </h4>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{s.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* STEP CONTENT CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        {/* ========================================================= */}
        {/* STEP 1: PROFIL UNIT */}
        {/* ========================================================= */}
        {activeStep === 1 && profile && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Building2 size={18} className="text-teal-600" /> Profil Unit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi gambaran umum, tugas pokok fungsi, ruang lingkup dan sarana prasarana unit.
                </p>
              </div>
              {!readOnly && (
                <button
                  onClick={handleSaveProfile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  <Save size={14} /> Simpan Profil
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Unit (Master)
                </label>
                <input
                  type="text"
                  value={unit.name}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jam Operasional Unit
                </label>
                <input
                  type="text"
                  value={profile.operating_hours || ''}
                  onChange={e => setProfile({ ...profile, operating_hours: e.target.value })}
                  disabled={readOnly}
                  placeholder="Contoh: 24 Jam (Shift) / Hari Kerja 08.00 - 16.00 WIB"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gambaran Umum Unit
                </label>
                <textarea
                  rows={3}
                  value={profile.unit_overview || ''}
                  onChange={e => setProfile({ ...profile, unit_overview: e.target.value })}
                  disabled={readOnly}
                  placeholder="Jelaskan peran, fungsi, dan kondisi umum unit pelayanan..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tugas Pokok dan Fungsi (Tupoksi)
                </label>
                <textarea
                  rows={3}
                  value={profile.main_duties || ''}
                  onChange={e => setProfile({ ...profile, main_duties: e.target.value })}
                  disabled={readOnly}
                  placeholder="Uraikan tugas pokok dan rincian fungsi pelayanan unit..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ruang Lingkup Pelayanan
                </label>
                <textarea
                  rows={2}
                  value={profile.service_scope || ''}
                  onChange={e => setProfile({ ...profile, service_scope: e.target.value })}
                  disabled={readOnly}
                  placeholder="Contoh: Pasien Rawat Inap, Rawat Jalan, IGD, dan Rujukan..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis Layanan yang Disediakan
                </label>
                <textarea
                  rows={2}
                  value={profile.service_types || ''}
                  onChange={e => setProfile({ ...profile, service_types: e.target.value })}
                  disabled={readOnly}
                  placeholder="Rincian jenis pelayanan spesifik unit..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sarana dan Prasarana Utama
                </label>
                <textarea
                  rows={2}
                  value={profile.facilities || ''}
                  onChange={e => setProfile({ ...profile, facilities: e.target.value })}
                  disabled={readOnly}
                  placeholder="Daftar sarana, alat kerja utama, dan prasarana pendukung..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: SDM DAN PEMBAGIAN TUGAS STAF */}
        {/* ========================================================= */}
        {activeStep === 2 && (
          <div className="space-y-6">
            {/* Staffing List */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <Users size={18} className="text-teal-600" /> Komposisi Sumber Daya Manusia (SDM)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data tenaga kerja, profesi, status kepegawaian, dan analisis kebutuhan tenaga.
                  </p>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => {
                      setEditingStaff({
                        employee_name: '',
                        education: 'D3 / S1',
                        profession: unit.name,
                        position: 'Pelaksana Teknis',
                        employment_status: 'PNS',
                        available_count: 1,
                        required_count: 1
                      });
                      setIsStaffModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    <Plus size={14} /> Tambah Pegawai
                  </button>
                )}
              </div>

              {/* Staffing Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3">Nama Pegawai</th>
                      <th className="p-3">Pendidikan</th>
                      <th className="p-3">Profesi / Posisi</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Tersedia</th>
                      <th className="p-3 text-center">Kebutuhan</th>
                      <th className="p-3 text-center">Defisit</th>
                      {!readOnly && <th className="p-3 text-center w-20">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {staffing.length > 0 ? (
                      staffing.map((s, idx) => {
                        const avail = s.available_count || 1;
                        const req = s.required_count || 1;
                        const deficit = Math.max(0, req - avail);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="p-3 text-center text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-800">{s.employee_name}</td>
                            <td className="p-3 text-slate-600">{s.education || '-'}</td>
                            <td className="p-3 text-slate-600">{s.profession} ({s.position})</td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                s.employment_status === 'PNS'
                                  ? 'bg-blue-100 text-blue-800'
                                  : s.employment_status === 'PPPK'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {s.employment_status}
                              </span>
                            </td>
                            <td className="p-3 text-center font-semibold text-slate-800">{avail}</td>
                            <td className="p-3 text-center font-semibold text-slate-800">{req}</td>
                            <td className="p-3 text-center font-bold text-rose-600">
                              {deficit > 0 ? `-${deficit}` : '0'}
                            </td>
                            {!readOnly && (
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingStaff(s);
                                      setIsStaffModalOpen(true);
                                    }}
                                    className="p-1 text-slate-500 hover:text-teal-600"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStaffing(s.id)}
                                    className="p-1 text-slate-500 hover:text-rose-600"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={readOnly ? 8 : 9} className="p-6 text-center text-slate-400">
                          Belum ada data SDM untuk unit ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Division of Duties & Authorities */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <Briefcase size={18} className="text-teal-600" /> Pembagian Tugas dan Kewenangan Staf
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rincian tugas pokok, tanggung jawab, dan kewenangan formal masing-masing posisi.
                  </p>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => {
                      setEditingAuth({
                        employee_name: '',
                        position: '',
                        main_duties: '',
                        responsibilities: '',
                        authorities: ''
                      });
                      setIsAuthModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    <Plus size={14} /> Tambah Pembagian Tugas
                  </button>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3">Nama Staf</th>
                      <th className="p-3">Jabatan / Posisi</th>
                      <th className="p-3">Tugas Pokok</th>
                      <th className="p-3">Tanggung Jawab</th>
                      <th className="p-3">Kewenangan</th>
                      {!readOnly && <th className="p-3 text-center w-20">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {authorities.length > 0 ? (
                      authorities.map((a, idx) => (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="p-3 text-center text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-800">{a.employee_name}</td>
                          <td className="p-3 font-semibold text-slate-700">{a.position}</td>
                          <td className="p-3 text-slate-600">{a.main_duties}</td>
                          <td className="p-3 text-slate-600">{a.responsibilities || '-'}</td>
                          <td className="p-3 text-slate-600">{a.authorities || '-'}</td>
                          {!readOnly && (
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingAuth(a);
                                    setIsAuthModalOpen(true);
                                  }}
                                  className="p-1 text-slate-500 hover:text-teal-600"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteAuthority(a.id)}
                                  className="p-1 text-slate-500 hover:text-rose-600"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={readOnly ? 6 : 7} className="p-6 text-center text-slate-400">
                          Belum ada data pembagian tugas staf untuk unit ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: PROGRAM DAN KEGIATAN UNIT (DYNAMIC TABLE BUILDER) */}
        {/* ========================================================= */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <DynamicTableBuilder
              tables={programTables}
              unitId={unit.id}
              reportId={report.id}
              readOnly={readOnly}
              onSaveTable={async tbl => {
                const ok = await upsertUnitProgramTable(tbl);
                if (ok) {
                  const idx = programTables.findIndex(t => t.id === tbl.id);
                  if (idx >= 0) {
                    const next = [...programTables];
                    next[idx] = tbl;
                    setProgramTables(next);
                  } else {
                    setProgramTables([...programTables, tbl]);
                  }
                }
                return ok;
              }}
              onDeleteTable={async tblId => {
                const ok = await deleteUnitProgramTable(report.id, tblId);
                if (ok) {
                  setProgramTables(programTables.filter(t => t.id !== tblId));
                }
                return ok;
              }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: CAPAIAN KINERJA KPI UNIT */}
        {/* ========================================================= */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <BarChart2 size={18} className="text-teal-600" /> Capaian Kinerja KPI Unit ({report.report_year})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data diambil otomatis dari modul KPI SIPAKAR (One-time input, multi-use). Hanya data berstatus Submitted yang dihitung secara resmi.
                  </p>
                </div>
              </div>
            </div>

            {/* KPI Performance Comparison Chart */}
            {kpiList.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Grafik Perbandingan Target vs Realisasi Tahunan ({report.report_year})
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={kpiList.map(k => ({
                        kode: k.kode,
                        target: k.target,
                        realisasi: k.capaian_annual
                      }))}
                      margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="kode" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="target" name="Target Kinerja" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="realisasi" name="Realisasi Tahunan" fill="#0D5C75" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* KPI Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3 w-28">Kode KPI</th>
                    <th className="p-3">Nama Indikator Mutu</th>
                    <th className="p-3 text-center">Target</th>
                    <th className="p-3 text-center">Realisasi</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Bulan Lapor</th>
                    <th className="p-3 text-center w-20">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {kpiList.length > 0 ? (
                    kpiList.map((k, idx) => (
                      <tr key={k.indikator_id} className="hover:bg-slate-50">
                        <td className="p-3 text-center text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-teal-700">{k.kode}</td>
                        <td className="p-3 font-semibold text-slate-800">{k.nama}</td>
                        <td className="p-3 text-center font-bold text-slate-700">
                          {k.target}{k.satuan}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-900">
                          {k.months_reported > 0 ? `${k.capaian_annual}${k.satuan}` : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            k.status === 'Tercapai'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : k.status === 'Mendekati Target'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : k.status === 'Tidak Tercapai'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {k.status}
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-600">
                          {k.months_reported} / 12 bln
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedKpiForDetail(k)}
                            className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-all"
                            title="Lihat rincian bulanan"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Belum ada indikator KPI aktif yang dipetakan untuk unit {unit.name}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Monthly KPI Detail Modal */}
            {selectedKpiForDetail && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
                        Rincian Capaian 12 Bulan
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        {selectedKpiForDetail.kode} - {selectedKpiForDetail.nama}
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedKpiForDetail(null)}
                      className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500 block">Target Tahunan</span>
                        <span className="font-bold text-slate-800">{selectedKpiForDetail.target}{selectedKpiForDetail.satuan}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Realisasi Agregat</span>
                        <span className="font-bold text-slate-800">{selectedKpiForDetail.capaian_annual}{selectedKpiForDetail.satuan}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Status Akhir</span>
                        <span className="font-bold text-teal-700">{selectedKpiForDetail.status}</span>
                      </div>
                    </div>

                    <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Bulan</th>
                          <th className="p-2 text-center">Num</th>
                          <th className="p-2 text-center">Denom</th>
                          <th className="p-2 text-center">Capaian</th>
                          <th className="p-2 text-center">Status</th>
                          <th className="p-2">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedKpiForDetail.monthly_details.map(m => (
                          <tr key={m.bulan}>
                            <td className="p-2 font-bold text-slate-800">Bulan {m.bulan}</td>
                            <td className="p-2 text-center">{m.numerator}</td>
                            <td className="p-2 text-center">{m.denominator}</td>
                            <td className="p-2 text-center font-bold">{m.capaian}%</td>
                            <td className="p-2 text-center font-semibold text-teal-700">{m.status}</td>
                            <td className="p-2 text-slate-600">{m.keterangan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 5: HAMBATAN DAN PERMASALAHAN UNIT */}
        {/* ========================================================= */}
        {activeStep === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-teal-600" /> Hambatan dan Permasalahan Unit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dokumentasikan kendala operasional, penyebab, dampak, dan kebutuhan dukungan manajemen rumah sakit.
                </p>
              </div>
              {!readOnly && (
                <button
                  onClick={() => {
                    setEditingObs({
                      problem_title: '',
                      category: 'SDM',
                      description: '',
                      root_cause: '',
                      service_impact: '',
                      management_support: '',
                      priority: 'Sedang'
                    });
                    setIsObsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  <Plus size={14} /> Tambah Permasalahan
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {obstacles.length > 0 ? (
                obstacles.map(o => (
                  <div
                    key={o.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 mb-1">
                          {o.category}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm">{o.problem_title}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.priority === 'Tinggi'
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : o.priority === 'Sedang'
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        Prioritas {o.priority}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p><b>Akar Masalah:</b> {o.root_cause || '-'}</p>
                      <p><b>Dampak Pelayanan:</b> {o.service_impact || '-'}</p>
                      <p><b>Dukungan Dibutuhkan:</b> {o.management_support || '-'}</p>
                    </div>

                    {!readOnly && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                        <button
                          onClick={() => {
                            setEditingObs(o);
                            setIsObsModalOpen(true);
                          }}
                          className="text-xs text-teal-600 font-semibold hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteObstacle(o.id)}
                          className="text-xs text-rose-600 font-semibold hover:underline"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Belum ada hambatan yang didokumentasikan untuk unit {unit.name}.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 6: RENCANA KERJA UNIT */}
        {/* ========================================================= */}
        {activeStep === 6 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <CalendarCheck size={18} className="text-teal-600" /> Rencana Kerja Unit ({report.report_year + 1})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rencana kerja tindak lanjut untuk periode perencanaan berikutnya. Akan dikonsolidasi otomatis ke tingkat seksi.
                </p>
              </div>
              {!readOnly && (
                <button
                  onClick={() => {
                    setEditingPlan({
                      problem: '',
                      cause: '',
                      action_plan: '',
                      target_completion: 'Triwulan I',
                      resource_needs: '',
                      success_indicator: '',
                      priority: 'Sedang'
                    });
                    setIsPlanModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  <Plus size={14} /> Tambah Rencana Kerja
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3">Rencana Tindakan</th>
                    <th className="p-3">Masalah / Latar Belakang</th>
                    <th className="p-3 text-center">Target Waktu</th>
                    <th className="p-3">Kebutuhan Sumber Daya</th>
                    <th className="p-3">Indikator Sukses</th>
                    <th className="p-3 text-center">Prioritas</th>
                    {!readOnly && <th className="p-3 text-center w-20">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {plans.length > 0 ? (
                    plans.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 text-center text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-800">{p.action_plan}</td>
                        <td className="p-3 text-slate-600">{p.problem || '-'}</td>
                        <td className="p-3 text-center font-semibold text-slate-700">
                          {p.target_completion || '-'}
                        </td>
                        <td className="p-3 text-slate-600">{p.resource_needs || '-'}</td>
                        <td className="p-3 text-slate-600">{p.success_indicator || '-'}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.priority === 'Tinggi'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-teal-100 text-teal-700'
                          }`}>
                            {p.priority}
                          </span>
                        </td>
                        {!readOnly && (
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingPlan(p);
                                  setIsPlanModalOpen(true);
                                }}
                                className="p-1 text-slate-500 hover:text-teal-600"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeletePlan(p.id)}
                                className="p-1 text-slate-500 hover:text-rose-600"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={readOnly ? 7 : 8} className="p-6 text-center text-slate-400">
                        Belum ada rencana kerja yang ditambahkan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons (Prev / Next Step) */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-6">
          <button
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Sebelumnya
          </button>
          <span className="text-xs text-slate-500 font-semibold">
            Langkah {activeStep} dari 6: {steps[activeStep - 1].title}
          </span>
          <button
            onClick={() => setActiveStep(prev => Math.min(6, prev + 1))}
            disabled={activeStep === 6}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Selanjutnya <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODALS: STAFFING, AUTHORITY, OBSTACLE, PLAN */}
      {/* ========================================================= */}
      {/* 1. Staff Modal */}
      {isStaffModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveStaffing} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm border-b pb-2">
              {editingStaff.id ? 'Edit Pegawai' : 'Tambah Pegawai Baru'}
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Pegawai / Staf</label>
                <input
                  type="text"
                  required
                  value={editingStaff.employee_name || ''}
                  onChange={e => setEditingStaff({ ...editingStaff, employee_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pendidikan Terakhir</label>
                  <input
                    type="text"
                    value={editingStaff.education || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, education: e.target.value })}
                    placeholder="Contoh: D3 Analis, S1 Farmasi..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Kepegawaian</label>
                  <select
                    value={editingStaff.employment_status || 'PNS'}
                    onChange={e => setEditingStaff({ ...editingStaff, employment_status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="THL">THL</option>
                    <option value="Kontrak">Kontrak</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Profesi</label>
                  <input
                    type="text"
                    value={editingStaff.profession || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, profession: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jabatan / Posisi</label>
                  <input
                    type="text"
                    value={editingStaff.position || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, position: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Tersedia</label>
                  <input
                    type="number"
                    min={1}
                    value={editingStaff.available_count || 1}
                    onChange={e => setEditingStaff({ ...editingStaff, available_count: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kebutuhan Tenaga</label>
                  <input
                    type="number"
                    min={1}
                    value={editingStaff.required_count || 1}
                    onChange={e => setEditingStaff({ ...editingStaff, required_count: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
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

      {/* 2. Authority Modal */}
      {isAuthModalOpen && editingAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveAuthority} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm border-b pb-2">
              {editingAuth.id ? 'Edit Pembagian Tugas' : 'Tambah Pembagian Tugas'}
            </h4>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Staf</label>
                  <input
                    type="text"
                    required
                    value={editingAuth.employee_name || ''}
                    onChange={e => setEditingAuth({ ...editingAuth, employee_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jabatan / Posisi</label>
                  <input
                    type="text"
                    value={editingAuth.position || ''}
                    onChange={e => setEditingAuth({ ...editingAuth, position: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tugas Pokok</label>
                <textarea
                  rows={2}
                  required
                  value={editingAuth.main_duties || ''}
                  onChange={e => setEditingAuth({ ...editingAuth, main_duties: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggung Jawab</label>
                <textarea
                  rows={2}
                  value={editingAuth.responsibilities || ''}
                  onChange={e => setEditingAuth({ ...editingAuth, responsibilities: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kewenangan</label>
                <textarea
                  rows={2}
                  value={editingAuth.authorities || ''}
                  onChange={e => setEditingAuth({ ...editingAuth, authorities: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
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

      {/* 3. Obstacle Modal */}
      {isObsModalOpen && editingObs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveObstacle} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm border-b pb-2">
              {editingObs.id ? 'Edit Permasalahan / Hambatan' : 'Tambah Permasalahan / Hambatan'}
            </h4>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Permasalahan</label>
                  <input
                    type="text"
                    required
                    value={editingObs.problem_title || ''}
                    onChange={e => setEditingObs({ ...editingObs, problem_title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Masalah</label>
                  <select
                    value={editingObs.category || 'SDM'}
                    onChange={e => setEditingObs({ ...editingObs, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="SDM">SDM</option>
                    <option value="Kompetensi">Kompetensi</option>
                    <option value="Sarana dan prasarana">Sarana dan prasarana</option>
                    <option value="Alat kesehatan">Alat kesehatan</option>
                    <option value="Alat nonmedis">Alat nonmedis</option>
                    <option value="Anggaran">Anggaran</option>
                    <option value="Regulasi dan perizinan">Regulasi dan perizinan</option>
                    <option value="Sistem informasi">Sistem informasi</option>
                    <option value="Koordinasi">Koordinasi</option>
                    <option value="Mutu dan keselamatan pasien">Mutu dan keselamatan pasien</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Akar Masalah (Root Cause)</label>
                <textarea
                  rows={2}
                  value={editingObs.root_cause || ''}
                  onChange={e => setEditingObs({ ...editingObs, root_cause: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dampak terhadap Pelayanan</label>
                <textarea
                  rows={2}
                  value={editingObs.service_impact || ''}
                  onChange={e => setEditingObs({ ...editingObs, service_impact: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dukungan Manajemen Dibutuhkan</label>
                  <input
                    type="text"
                    value={editingObs.management_support || ''}
                    onChange={e => setEditingObs({ ...editingObs, management_support: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={editingObs.priority || 'Sedang'}
                    onChange={e => setEditingObs({ ...editingObs, priority: e.target.value as any })}
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
                onClick={() => setIsObsModalOpen(false)}
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

      {/* 4. Plan Modal */}
      {isPlanModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSavePlan} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm border-b pb-2">
              {editingPlan.id ? 'Edit Rencana Kerja' : 'Tambah Rencana Kerja'}
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rencana Tindakan / Kegiatan</label>
                <textarea
                  rows={2}
                  required
                  value={editingPlan.action_plan || ''}
                  onChange={e => setEditingPlan({ ...editingPlan, action_plan: e.target.value })}
                  placeholder="Rencana kegiatan spesifik yang akan dilaksanakan..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Masalah / Latar Belakang</label>
                  <input
                    type="text"
                    value={editingPlan.problem || ''}
                    onChange={e => setEditingPlan({ ...editingPlan, problem: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Waktu Penyelesaian</label>
                  <input
                    type="text"
                    value={editingPlan.target_completion || ''}
                    onChange={e => setEditingPlan({ ...editingPlan, target_completion: e.target.value })}
                    placeholder="Contoh: Triwulan I, Semester II..."
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
                    placeholder="Anggaran, alat, SDM..."
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
              <div>
                <label className="block font-bold text-slate-700 mb-1">Indikator Keberhasilan</label>
                <input
                  type="text"
                  value={editingPlan.success_indicator || ''}
                  onChange={e => setEditingPlan({ ...editingPlan, success_indicator: e.target.value })}
                  placeholder="Ukuran atau bukti ketercapaian kegiatan..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
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
