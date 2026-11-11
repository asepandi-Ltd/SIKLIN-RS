import { supabase } from './supabaseClient';
import { isSupabaseConfigured, isSupabaseReachableCached, logDbError } from './supabaseService';
import {
  AnnualReport,
  AnnualSectionProfile,
  AnnualUnitProfile,
  AnnualUnitStaffing,
  AnnualUnitAuthority,
  AnnualUnitProgramTable,
  AnnualUnitObstacle,
  AnnualUnitPlan,
  AnnualSectionPlan,
  AnnualReportSnapshot,
  AnnualReportFullData,
  AnnualKpiSummaryItem
} from './annualReportTypes';
import { ACTIVE_MASTER_UNITS, normalizeUnit, MasterUnit } from './units';
import { Indikator, Capaian } from './store';
import { calculateAnnualKpiForUnit } from './annualKpiCalculator';

// Local storage helper
const getStored = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setStored = <T>(key: string, val: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn(`Failed writing to storage: ${key}`, e);
  }
};

// Reachability flag for annual report tables in Supabase
let hasAnnualTablesInDb: boolean | null = null;

export async function checkAnnualTablesExist(): Promise<boolean> {
  if (hasAnnualTablesInDb !== null) return hasAnnualTablesInDb;
  if (!isSupabaseConfigured() || !isSupabaseReachableCached()) {
    hasAnnualTablesInDb = false;
    return false;
  }
  try {
    const { error } = await supabase.from('annual_reports').select('id').limit(1);
    if (error && (error.code === 'PGRST205' || String(error.message).includes('schema cache'))) {
      hasAnnualTablesInDb = false;
      return false;
    }
    hasAnnualTablesInDb = !error;
    return hasAnnualTablesInDb;
  } catch {
    hasAnnualTablesInDb = false;
    return false;
  }
}

// ==========================================
// 1. Annual Reports
// ==========================================
export async function getAnnualReports(): Promise<AnnualReport[]> {
  const canUseDb = await checkAnnualTablesExist();
  if (canUseDb) {
    try {
      const { data, error } = await supabase
        .from('annual_reports')
        .select('*')
        .order('report_year', { ascending: false });
      if (!error && data) {
        setStored('sipakar_annual_reports', data);
        return data as AnnualReport[];
      }
      logDbError('getAnnualReports', error);
    } catch (err) {
      logDbError('getAnnualReports catch', err);
    }
  }
  return getStored<AnnualReport[]>('sipakar_annual_reports', [
    {
      id: 'rep-2026',
      report_year: 2026,
      report_title: 'Laporan Tahunan Seksi Penunjang, Mutu, Humas dan Pemasaran UOBK RSUD Al-Mulk Tahun 2026',
      created_by: 'Dr. Fitri Wulandari',
      created_at: new Date('2026-01-01').toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'rep-2025',
      report_year: 2025,
      report_title: 'Laporan Tahunan Seksi Penunjang, Mutu, Humas dan Pemasaran UOBK RSUD Al-Mulk Tahun 2025',
      created_by: 'Dr. Fitri Wulandari',
      created_at: new Date('2025-01-01').toISOString(),
      updated_at: new Date('2025-12-31').toISOString()
    }
  ]);
}

export async function getOrCreateAnnualReport(year: number, userNama = 'Kepala Seksi'): Promise<AnnualReport> {
  const existingList = await getAnnualReports();
  const found = existingList.find(r => Number(r.report_year) === Number(year));
  if (found) return found;

  const newReport: AnnualReport = {
    id: `rep-${year}`,
    report_year: year,
    report_title: `Laporan Tahunan Seksi Penunjang, Mutu, Humas dan Pemasaran UOBK RSUD Al-Mulk Tahun ${year}`,
    created_by: userNama,
    updated_by: userNama,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const updatedList = [newReport, ...existingList];
  setStored('sipakar_annual_reports', updatedList);

  if (await checkAnnualTablesExist()) {
    try {
      await supabase.from('annual_reports').upsert(newReport, { onConflict: 'report_year' });
    } catch (err) {
      logDbError('getOrCreateAnnualReport upsert', err);
    }
  }

  return newReport;
}

// ==========================================
// 2. Section Profile (Bab I, II, V)
// ==========================================
export async function getSectionProfile(reportId: string, year = 2026): Promise<AnnualSectionProfile> {
  if (await checkAnnualTablesExist()) {
    try {
      const { data, error } = await supabase
        .from('annual_section_profile')
        .select('*')
        .eq('report_id', reportId)
        .maybeSingle();
      if (!error && data) {
        setStored(`sipakar_sec_prof_${reportId}`, data);
        return data as AnnualSectionProfile;
      }
    } catch (err) {
      logDbError('getSectionProfile catch', err);
    }
  }

  const defaultProfile: AnnualSectionProfile = {
    id: `sec-prof-${reportId}`,
    report_id: reportId,
    background: `Rumah Sakit Umum Daerah (RSUD) Al-Mulk Kota Sukabumi berkomitmen memberikan pelayanan kesehatan berkualitas prima, merata, dan terjangkau bagi seluruh lapisan masyarakat. Seksi Penunjang, Mutu, Humas dan Pemasaran memegang peranan krusial sebagai pilar operasional klinis dan non-klinis dalam mendukung keselamatan pasien (patient safety) serta kepuasan pelanggan secara berkesinambungan pada Tahun Anggaran ${year}.`,
    objectives: `1. Menyajikan pertanggungjawaban akuntabilitas kinerja Seksi Penunjang, Mutu, Humas dan Pemasaran selama Tahun ${year}.\n2. Mengevaluasi pencapaian target Indikator Kinerja Utama (KPI) seluruh unit penunjang.\n3. Mengidentifikasi kendala, hambatan, serta kebutuhan sumber daya manusia, sarana prasarana, dan pembiayaan.\n4. Merumuskan rencana kerja operasional dan strategis seksi untuk peningkatan mutu pelayanan tahun berikutnya.`,
    section_overview: `Seksi Penunjang, Mutu, Humas dan Pemasaran RSUD Al-Mulk membawahi 11 unit kerja aktif yang terbagi atas Penunjang Medis (Laboratorium, Radiologi, Farmasi, Gizi, Mutu) dan Penunjang Non Medis (Rekam Medis, IT Rumah Sakit / ITRS, IPSRS, CSSD & Laundry, Humas dan Pemasaran, Kesehatan Lingkungan).`,
    organizational_structure: `Seksi Penunjang dipimpin oleh Kepala Seksi Penunjang, Mutu, Humas dan Pemasaran yang bertanggung jawab langsung kepada Direktur UOBK RSUD Al-Mulk. Di bawah Kepala Seksi terdapat 11 Kepala Unit / Penanggung Jawab Unit fungsional beserta staf pelaksana teknis.`,
    main_duties: `Melaksanakan perencanaan, pengorganisasian, koordinasi, pembinaan, pemantauan, evaluasi, dan pelaporan penyelenggaraan pelayanan penunjang medis, penunjang non medis, manajemen mutu rumah sakit, serta kehumasan dan pemasaran layanan RSUD Al-Mulk.`,
    general_conditions: `Sepanjang Tahun ${year}, pelayanan penunjang berjalan secara konsisten dengan peningkatan volume utilisasi layanan laboratorium, farmasi, digitalisasi SIMRS melalui ITRS, perbaikan sarana sanitasi IPAL, serta optimalisasi pemeliharaan alat elektromedik oleh IPSRS.`,
    swot_strength: `• Komitmen manajemen tinggi dalam peningkatan mutu & keselamatan pasien.\n• Sistem pelaporan kinerja digital SIPAKAR terintegrasi secara real-time.\n• Tenaga teknis profesional pada setiap unit berdedikasi tinggi.\n• Ketersediaan sarana laboratorium dan radiologi yang telah terkalibrasi.`,
    swot_weakness: `• Masih terdapat kesenjangan jumlah kebutuhan tenaga teknis (SDM) pada beberapa unit seperti CSSD, Farmasi, dan IT.\n• Ruang penyimpanan logistik dan rekam medis yang mendekati kapasitas maksimal.\n• Ketergantungan terhadap vendor eksternal untuk suku cadang alat berteknologi tinggi.`,
    swot_opportunity: `• Dukungan penuh Pemerintah Kota Sukabumi dalam penguatan layanan rujukan daerah.\n• Peluang pengembangan layanan penunjang unggulan (laboratorium terpadu & tele-radiologi).\n• Integrasi SATUSEHAT Kemenkes RI dan BPJS Kesehatan secara menyeluruh.`,
    swot_threat: `• Dinamika regulasi perizinan dan standar akreditasi rumah sakit yang semakin ketat.\n• Kenaikan harga reagen laboratorium dan bahan medis habis pakai impor.\n• Risiko fluktuasi pasokan obat dari distributor nasional.`,
    strategic_issues: `1. Pemenuhan rasio kecukupan tenaga kesehatan dan tenaga penunjang sesuai analisis beban kerja.\n2. Optimalisasi waktu tunggu layanan farmasi dan laboratorium darurat (cito).\n3. Percepatan digitalisasi rekam medis elektronik (RME) dan infrastruktur jaringan rumah sakit.\n4. Pemeliharaan preventif sarana prasarana dan IPAL secara berkelanjutan.`,
    conclusion: `Secara umum, kinerja Seksi Penunjang, Mutu, Humas dan Pemasaran RSUD Al-Mulk Tahun ${year} telah berjalan dengan sangat baik dan memenuhi standar akuntabilitas pelayanan publik. Sinergi lintas unit terbukti mampu menjaga mutu pelayanan dan keselamatan pasien.`,
    recommendation: `1. Melakukan rekrutmen atau penambahan tenaga formasi PPPK/kontrak untuk unit-unit yang mengalami defisit SDM.\n2. Mengalokasikan anggaran pemeliharaan preventif berkala untuk alat elektromedik dan sistem informasi.\n3. Memperkuat program pelatihan kompetensi berkelanjutan bagi staf penunjang.`,
    improvement_plan: `Menyusun SOP terpadu pemeliharaan alat kerja sama IPSRS-ITRS, menerapkan sistem antrean farmasi terintegrasi display, serta memperluas kapasitas pengarsipan digital rekam medis pada awal triwulan pertama tahun depan.`,
    pejabat_nama: 'Dr. Fitri Wulandari',
    pejabat_nip: '19820415 200801 2 011',
    pejabat_jabatan: 'Kepala Seksi Penunjang, Mutu, Humas dan Pemasaran'
  };

  return getStored<AnnualSectionProfile>(`sipakar_sec_prof_${reportId}`, defaultProfile);
}

export async function upsertSectionProfile(profile: AnnualSectionProfile): Promise<boolean> {
  setStored(`sipakar_sec_prof_${profile.report_id}`, profile);
  if (await checkAnnualTablesExist()) {
    try {
      const { error } = await supabase
        .from('annual_section_profile')
        .upsert(profile, { onConflict: 'report_id' });
      if (error) {
        logDbError('upsertSectionProfile', error);
        return false;
      }
      return true;
    } catch (err) {
      logDbError('upsertSectionProfile catch', err);
      return false;
    }
  }
  return true;
}

// ==========================================
// 3. Unit Profiles (Modul 6.1)
// ==========================================
export async function getUnitProfiles(reportId: string): Promise<Record<string, AnnualUnitProfile>> {
  const result: Record<string, AnnualUnitProfile> = {};

  if (await checkAnnualTablesExist()) {
    try {
      const { data, error } = await supabase
        .from('annual_unit_profiles')
        .select('*')
        .eq('report_id', reportId);
      if (!error && data) {
        data.forEach(p => {
          result[p.unit_id] = p;
        });
        setStored(`sipakar_unit_profs_${reportId}`, result);
        return result;
      }
    } catch (err) {
      logDbError('getUnitProfiles catch', err);
    }
  }

  const stored = getStored<Record<string, AnnualUnitProfile>>(`sipakar_unit_profs_${reportId}`, {});
  return stored;
}

export async function getOrCreateUnitProfile(reportId: string, unit: MasterUnit): Promise<AnnualUnitProfile> {
  const all = await getUnitProfiles(reportId);
  if (all[unit.id]) return all[unit.id];

  const initial = getDefaultUnitProfile(reportId, unit.id);

  all[unit.id] = initial;
  setStored(`sipakar_unit_profs_${reportId}`, all);

  if (await checkAnnualTablesExist()) {
    try {
      await supabase.from('annual_unit_profiles').upsert(initial, { onConflict: 'report_id,unit_id' });
    } catch (err) {
      logDbError('getOrCreateUnitProfile catch', err);
    }
  }

  return initial;
}

export async function upsertUnitProfile(profile: AnnualUnitProfile): Promise<boolean> {
  const all = getStored<Record<string, AnnualUnitProfile>>(`sipakar_unit_profs_${profile.report_id}`, {});
  all[profile.unit_id] = profile;
  setStored(`sipakar_unit_profs_${profile.report_id}`, all);

  if (await checkAnnualTablesExist()) {
    try {
      const { error } = await supabase
        .from('annual_unit_profiles')
        .upsert(profile, { onConflict: 'report_id,unit_id' });
      if (error) {
        logDbError('upsertUnitProfile', error);
        return false;
      }
      return true;
    } catch (err) {
      logDbError('upsertUnitProfile catch', err);
      return false;
    }
  }
  return true;
}

// ==========================================
// 4. Unit Staffing & Authorities (Modul 6.2)
// ==========================================
export async function getUnitStaffing(reportId: string, unitId?: string): Promise<AnnualUnitStaffing[]> {
  if (await checkAnnualTablesExist()) {
    try {
      let query = supabase.from('annual_unit_staffing').select('*').eq('report_id', reportId);
      if (unitId) query = query.eq('unit_id', unitId);
      const { data, error } = await query.order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as AnnualUnitStaffing[];
      }
    } catch (err) {
      logDbError('getUnitStaffing catch', err);
    }
  }

  const all = getStored<AnnualUnitStaffing[]>(`sipakar_staffing_${reportId}`, []);
  const filtered = unitId ? all.filter(s => s.unit_id === unitId) : all;
  
  if (unitId && filtered.length === 0) {
    const defaults = getDefaultStaffingForUnit(reportId, unitId);
    if (defaults.length > 0) {
      const merged = [...all, ...defaults];
      setStored(`sipakar_staffing_${reportId}`, merged);
      return defaults;
    }
  }

  return filtered;
}

export async function upsertUnitStaffing(staff: AnnualUnitStaffing): Promise<boolean> {
  const all = getStored<AnnualUnitStaffing[]>(`sipakar_staffing_${staff.report_id}`, []);
  const idx = all.findIndex(s => s.id === staff.id);
  if (idx >= 0) {
    all[idx] = staff;
  } else {
    all.push(staff);
  }
  setStored(`sipakar_staffing_${staff.report_id}`, all);

  if (await checkAnnualTablesExist()) {
    try {
      await supabase.from('annual_unit_staffing').upsert(staff);
    } catch (err) {
      logDbError('upsertUnitStaffing catch', err);
    }
  }
  return true;
}

export async function deleteUnitStaffing(reportId: string, id: string): Promise<boolean> {
  const all = getStored<AnnualUnitStaffing[]>(`sipakar_staffing_${reportId}`, []);
  const filtered = all.filter(s => s.id !== id);
  setStored(`sipakar_staffing_${reportId}`, filtered);

  if (await checkAnnualTablesExist()) {
    try {
      await supabase.from('annual_unit_staffing').delete().eq('id', id);
    } catch (err) {
      logDbError('deleteUnitStaffing catch', err);
    }
  }
  return true;
}

export async function getUnitAuthorities(reportId: string, unitId?: string): Promise<AnnualUnitAuthority[]> {
  if (await checkAnnualTablesExist()) {
    try {
      let query = supabase.from('annual_unit_authorities').select('*').eq('report_id', reportId);
      if (unitId) query = query.eq('unit_id', unitId);
      const { data, error } = await query.order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as AnnualUnitAuthority[];
      }
    } catch (err) {
      logDbError('getUnitAuthorities catch', err);
    }
  }

  const all = getStored<AnnualUnitAuthority[]>(`sipakar_authorities_${reportId}`, []);
  const filtered = unitId ? all.filter(a => a.unit_id === unitId) : all;

  if (unitId && filtered.length === 0) {
    const defaults = getDefaultAuthoritiesForUnit(reportId, unitId);
    if (defaults.length > 0) {
      const merged = [...all, ...defaults];
      setStored(`sipakar_authorities_${reportId}`, merged);
      return defaults;
    }
  }

  return filtered;
}

export async function upsertUnitAuthority(auth: AnnualUnitAuthority): Promise<boolean> {
  const all = getStored<AnnualUnitAuthority[]>(`sipakar_authorities_${auth.report_id}`, []);
  const idx = all.findIndex(a => a.id === auth.id);
  if (idx >= 0) {
    all[idx] = auth;
  } else {
    all.push(auth);
  }
  setStored(`sipakar_authorities_${auth.report_id}`, all);

  if (await checkAnnualTablesExist()) {
    try {
      await supabase.from('annual_unit_authorities').upsert(auth);
    } catch (err) {
      logDbError('upsertUnitAuthority catch', err);
    }
  }
  return true;
}

export async function deleteUnitAuthority(reportId: string, id: string): Promise<boolean> {
  const all = getStored<AnnualUnitAuthority[]>(`sipakar_authorities_${reportId}`, []);
  const filtered = all.filter(a => a.id !== id);
  setStored(`sipakar_authorities_${reportId}`, filtered);

  if (await checkAnnualTablesExist()) {
    try {
      await supabase.from('annual_unit_authorities').delete().eq('id', id);
    } catch (err) {
      logDbError('deleteUnitAuthority catch', err);
    }
  }
  return true;
}

import { getDefaultProgramTableForUnit } from './defaultUnitPrograms';
import {
  getDefaultUnitProfile,
  getDefaultStaffingForUnit,
  getDefaultAuthoritiesForUnit,
  getDefaultObstaclesForUnit,
  getDefaultPlansForUnit
} from './defaultUnitProfiles';

// ==========================================
// 5. Dynamic Table Builder (Modul 6.3)
// ==========================================
export async function getUnitProgramTables(reportId: string, unitId?: string): Promise<AnnualUnitProgramTable[]> {
  let list: AnnualUnitProgramTable[] = [];

  if (await checkAnnualTablesExist()) {
    try {
      let query = supabase.from('annual_unit_program_tables').select('*').eq('report_id', reportId);
      if (unitId) query = query.eq('unit_id', unitId);
      const { data, error } = await query.order('sort_order', { ascending: true });
      if (!error && data && data.length > 0) {
        list = data as AnnualUnitProgramTable[];
      }
    } catch (err) {
      logDbError('getUnitProgramTables catch', err);
    }
  }

  if (list.length === 0) {
    const all = getStored<AnnualUnitProgramTable[]>(`sipakar_progtables_${reportId}`, []);
    list = unitId ? all.filter(t => t.unit_id === unitId) : all;
  }

  // If specific unit has no tables yet, provide default authentic template
  if (unitId && list.length === 0) {
    const defaultTable = getDefaultProgramTableForUnit(reportId, unitId);
    await upsertUnitProgramTable(defaultTable);
    return [defaultTable];
  }

  return list;
}

export async function upsertUnitProgramTable(table: AnnualUnitProgramTable): Promise<boolean> {
  const all = getStored<AnnualUnitProgramTable[]>(`sipakar_progtables_${table.report_id}`, []);
  const idx = all.findIndex(t => t.id === table.id);
  if (idx >= 0) {
    all[idx] = table;
  } else {
    all.push(table);
  }
  setStored(`sipakar_progtables_${table.report_id}`, all);

  if (await checkAnnualTablesExist()) {
    try {
      await supabase.from('annual_unit_program_tables').upsert(table);
    } catch (err) {
      logDbError('upsertUnitProgramTable catch', err);
    }
  }
  return true;
}

export async function deleteUnitProgramTable(reportId: string, id: string): Promise<boolean> {
  const all = getStored<AnnualUnitProgramTable[]>(`sipakar_progtables_${reportId}`, []);
  const filtered = all.filter(t => t.id !== id);
  setStored(`sipakar_progtables_${reportId}`, filtered);

  if (await checkAnnualTablesExist()) {
    try {
      await supabase.from('annual_unit_program_tables').delete().eq('id', id);
    } catch (err) {
      logDbError('deleteUnitProgramTable catch', err);
    }
  }
  return true;
}

// ==========================================
// 6. Obstacles & Work Plans (Modul 8 & 9)
// ==========================================
export async function getUnitObstacles(reportId: string, unitId?: string): Promise<AnnualUnitObstacle[]> {
  if (await checkAnnualTablesExist()) {
    try {
      let query = supabase.from('annual_unit_obstacles').select('*').eq('report_id', reportId);
      if (unitId) query = query.eq('unit_id', unitId);
      const { data, error } = await query.order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as AnnualUnitObstacle[];
      }
    } catch (err) {
      logDbError('getUnitObstacles catch', err);
    }
  }

  const all = getStored<AnnualUnitObstacle[]>(`sipakar_obstacles_${reportId}`, []);
  const filtered = unitId ? all.filter(o => o.unit_id === unitId) : all;

  if (unitId && filtered.length === 0) {
    const defaults = getDefaultObstaclesForUnit(reportId, unitId);
    if (defaults.length > 0) {
      const merged = [...all, ...defaults];
      setStored(`sipakar_obstacles_${reportId}`, merged);
      return defaults;
    }
  }

  return filtered;
}

export async function upsertUnitObstacle(obs: AnnualUnitObstacle): Promise<boolean> {
  const all = getStored<AnnualUnitObstacle[]>(`sipakar_obstacles_${obs.report_id}`, []);
  const idx = all.findIndex(o => o.id === obs.id);
  if (idx >= 0) {
    all[idx] = obs;
  } else {
    all.push(obs);
  }
  setStored(`sipakar_obstacles_${obs.report_id}`, all);

  if (await checkAnnualTablesExist()) {
    try {
      await supabase.from('annual_unit_obstacles').upsert(obs);
    } catch (err) {
      logDbError('upsertUnitObstacle catch', err);
    }
  }
  return true;
}

export async function deleteUnitObstacle(reportId: string, id: string): Promise<boolean> {
  const all = getStored<AnnualUnitObstacle[]>(`sipakar_obstacles_${reportId}`, []);
  const filtered = all.filter(o => o.id !== id);
  setStored(`sipakar_obstacles_${reportId}`, filtered);

  if (await checkAnnualTablesExist()) {
    try {
      await supabase.from('annual_unit_obstacles').delete().eq('id', id);
    } catch (err) {
      logDbError('deleteUnitObstacle catch', err);
    }
  }
  return true;
}

export async function getUnitPlans(reportId: string, unitId?: string): Promise<AnnualUnitPlan[]> {
  if (await checkAnnualTablesExist()) {
    try {
      let query = supabase.from('annual_unit_plans').select('*').eq('report_id', reportId);
      if (unitId) query = query.eq('unit_id', unitId);
      const { data, error } = await query.order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as AnnualUnitPlan[];
      }
    } catch (err) {
      logDbError('getUnitPlans catch', err);
    }
  }

  const all = getStored<AnnualUnitPlan[]>(`sipakar_plans_${reportId}`, []);
  const filtered = unitId ? all.filter(p => p.unit_id === unitId) : all;

  if (unitId && filtered.length === 0) {
    const defaults = getDefaultPlansForUnit(reportId, unitId);
    if (defaults.length > 0) {
      const merged = [...all, ...defaults];
      setStored(`sipakar_plans_${reportId}`, merged);
      return defaults;
    }
  }

  return filtered;
}

export async function upsertUnitPlan(plan: AnnualUnitPlan): Promise<boolean> {
  const all = getStored<AnnualUnitPlan[]>(`sipakar_plans_${plan.report_id}`, []);
  const idx = all.findIndex(p => p.id === plan.id);
  if (idx >= 0) {
    all[idx] = plan;
  } else {
    all.push(plan);
  }
  setStored(`sipakar_plans_${plan.report_id}`, all);

  if (await checkAnnualTablesExist()) {
    try {
      await supabase.from('annual_unit_plans').upsert(plan);
    } catch (err) {
      logDbError('upsertUnitPlan catch', err);
    }
  }
  return true;
}

export async function deleteUnitPlan(reportId: string, id: string): Promise<boolean> {
  const all = getStored<AnnualUnitPlan[]>(`sipakar_plans_${reportId}`, []);
  const filtered = all.filter(p => p.id !== id);
  setStored(`sipakar_plans_${reportId}`, filtered);

  if (await checkAnnualTablesExist()) {
    try {
      await supabase.from('annual_unit_plans').delete().eq('id', id);
    } catch (err) {
      logDbError('deleteUnitPlan catch', err);
    }
  }
  return true;
}

// ==========================================
// 7. Section Plans (Modul 10.6)
// ==========================================
export async function getSectionPlans(reportId: string): Promise<AnnualSectionPlan[]> {
  if (await checkAnnualTablesExist()) {
    try {
      const { data, error } = await supabase
        .from('annual_section_plans')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });
      if (!error && data) {
        return data as AnnualSectionPlan[];
      }
    } catch (err) {
      logDbError('getSectionPlans catch', err);
    }
  }

  return getStored<AnnualSectionPlan[]>(`sipakar_sec_plans_${reportId}`, []);
}

export async function upsertSectionPlan(plan: AnnualSectionPlan): Promise<boolean> {
  const all = getStored<AnnualSectionPlan[]>(`sipakar_sec_plans_${plan.report_id}`, []);
  const idx = all.findIndex(p => p.id === plan.id);
  if (idx >= 0) {
    all[idx] = plan;
  } else {
    all.push(plan);
  }
  setStored(`sipakar_sec_plans_${plan.report_id}`, all);

  if (await checkAnnualTablesExist()) {
    try {
      await supabase.from('annual_section_plans').upsert(plan);
    } catch (err) {
      logDbError('upsertSectionPlan catch', err);
    }
  }
  return true;
}

export async function deleteSectionPlan(reportId: string, id: string): Promise<boolean> {
  const all = getStored<AnnualSectionPlan[]>(`sipakar_sec_plans_${reportId}`, []);
  const filtered = all.filter(p => p.id !== id);
  setStored(`sipakar_sec_plans_${reportId}`, filtered);

  if (await checkAnnualTablesExist()) {
    try {
      await supabase.from('annual_section_plans').delete().eq('id', id);
    } catch (err) {
      logDbError('deleteSectionPlan catch', err);
    }
  }
  return true;
}

// ==========================================
// 8. Snapshots (Final Data Laporan Tahunan)
// ==========================================
export async function getReportSnapshot(reportId: string): Promise<AnnualReportSnapshot | null> {
  if (await checkAnnualTablesExist()) {
    try {
      const { data, error } = await supabase
        .from('annual_report_snapshots')
        .select('*')
        .eq('report_id', reportId)
        .maybeSingle();
      if (!error && data) {
        setStored(`sipakar_snap_${reportId}`, data);
        return data as AnnualReportSnapshot;
      }
    } catch (err) {
      logDbError('getReportSnapshot catch', err);
    }
  }

  return getStored<AnnualReportSnapshot | null>(`sipakar_snap_${reportId}`, null);
}

export async function upsertReportSnapshot(snapshot: AnnualReportSnapshot): Promise<boolean> {
  setStored(`sipakar_snap_${snapshot.report_id}`, snapshot);

  if (await checkAnnualTablesExist()) {
    try {
      const { error } = await supabase
        .from('annual_report_snapshots')
        .upsert(snapshot, { onConflict: 'report_id' });
      if (error) {
        logDbError('upsertReportSnapshot error', error);
        return false;
      }
      return true;
    } catch (err) {
      logDbError('upsertReportSnapshot catch', err);
      return false;
    }
  }
  return true;
}

// ==========================================
// 9. Full Data Consolidation Engine
// ==========================================
export async function consolidateAnnualReportData(
  report: AnnualReport,
  allIndikators: Indikator[],
  allCapaian: Capaian[]
): Promise<AnnualReportFullData> {
  const reportId = report.id;
  const year = report.report_year;

  // 1. Fetch section profile
  const sectionProfile = await getSectionProfile(reportId, year);

  // 2. Fetch all operational unit profiles
  const rawUnitProfiles = await getUnitProfiles(reportId);
  const unitProfiles: Record<string, AnnualUnitProfile> = {};
  for (const u of ACTIVE_MASTER_UNITS) {
    if (rawUnitProfiles[u.id]) {
      unitProfiles[u.id] = rawUnitProfiles[u.id];
    } else {
      unitProfiles[u.id] = await getOrCreateUnitProfile(reportId, u);
    }
  }

  // 3. Fetch staffing and authorities
  const rawStaffing = await getUnitStaffing(reportId);
  const unitStaffing: Record<string, AnnualUnitStaffing[]> = {};
  ACTIVE_MASTER_UNITS.forEach(u => {
    unitStaffing[u.id] = rawStaffing.filter(s => s.unit_id === u.id);
  });

  const rawAuthorities = await getUnitAuthorities(reportId);
  const unitAuthorities: Record<string, AnnualUnitAuthority[]> = {};
  ACTIVE_MASTER_UNITS.forEach(u => {
    unitAuthorities[u.id] = rawAuthorities.filter(a => a.unit_id === u.id);
  });

  // 4. Fetch dynamic tables
  const rawTables = await getUnitProgramTables(reportId);
  const unitProgramTables: Record<string, AnnualUnitProgramTable[]> = {};
  ACTIVE_MASTER_UNITS.forEach(u => {
    unitProgramTables[u.id] = rawTables.filter(t => t.unit_id === u.id);
  });

  // 5. Fetch obstacles and plans
  const rawObstacles = await getUnitObstacles(reportId);
  const unitObstacles: Record<string, AnnualUnitObstacle[]> = {};
  ACTIVE_MASTER_UNITS.forEach(u => {
    unitObstacles[u.id] = rawObstacles.filter(o => o.unit_id === u.id);
  });

  const rawUnitPlans = await getUnitPlans(reportId);
  const unitPlans: Record<string, AnnualUnitPlan[]> = {};
  ACTIVE_MASTER_UNITS.forEach(u => {
    unitPlans[u.id] = rawUnitPlans.filter(p => p.unit_id === u.id);
  });

  // 6. Section Plans
  const sectionPlans = await getSectionPlans(reportId);

  // 7. Calculate KPI performance for each unit
  const kpiSummaries: Record<string, AnnualKpiSummaryItem[]> = {};
  let totalIndikator = 0;
  let totalTercapai = 0;
  let totalMendekati = 0;
  let totalTidakTercapai = 0;
  let totalBelumMelapor = 0;

  ACTIVE_MASTER_UNITS.forEach(u => {
    const list = calculateAnnualKpiForUnit(u, allIndikators, allCapaian, year);
    kpiSummaries[u.id] = list;
    list.forEach(k => {
      totalIndikator++;
      if (k.status === 'Tercapai') totalTercapai++;
      else if (k.status === 'Mendekati Target') totalMendekati++;
      else if (k.status === 'Tidak Tercapai') totalTidakTercapai++;
      else totalBelumMelapor++;
    });
  });

  const persenTercapai = totalIndikator > 0 
    ? Math.round((totalTercapai / totalIndikator) * 1000) / 10 
    : 0;

  // 8. Staffing summary
  let totalPegawai = 0;
  let totalPns = 0;
  let totalPppk = 0;
  let totalThl = 0;
  let totalKontrak = 0;
  let totalKebutuhan = 0;

  rawStaffing.forEach(s => {
    const avail = Number(s.available_count) || 1;
    const req = Number(s.required_count) || 1;
    totalPegawai += avail;
    totalKebutuhan += req;
    const st = (s.employment_status || '').toUpperCase();
    if (st === 'PNS') totalPns += avail;
    else if (st === 'PPPK') totalPppk += avail;
    else if (st === 'THL') totalThl += avail;
    else totalKontrak += avail;
  });

  const totalKekurangan = Math.max(0, totalKebutuhan - totalPegawai);

  return {
    report,
    sectionProfile,
    unitProfiles,
    unitStaffing,
    unitAuthorities,
    unitProgramTables,
    unitObstacles,
    unitPlans,
    sectionPlans,
    kpiSummaries,
    overallKpiStats: {
      totalIndikator,
      totalTercapai,
      totalMendekati,
      totalTidakTercapai,
      totalBelumMelapor,
      persenTercapai
    },
    staffingSummary: {
      totalPegawai,
      totalPns,
      totalPppk,
      totalThl,
      totalKontrak,
      totalKebutuhan,
      totalKekurangan
    },
    generated_at: new Date().toISOString()
  };
}
