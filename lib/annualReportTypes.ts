import { Indikator, Capaian } from './store';

export interface AnnualReport {
  id: string;
  report_year: number;
  report_title: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AnnualSectionProfile {
  id: string;
  report_id: string;
  background: string;               // 1.1 Latar Belakang
  objectives: string;               // 1.2 Tujuan Penyusunan
  section_overview: string;         // 1.3 Gambaran Umum Seksi
  organizational_structure: string; // 1.4 Struktur Organisasi
  main_duties: string;              // 1.5 Tugas Pokok dan Fungsi
  general_conditions: string;       // 2.1 Gambaran Kondisi Umum
  swot_strength: string;            // 2.2 Kekuatan (Strengths)
  swot_weakness: string;            // 2.2 Kelemahan (Weaknesses)
  swot_opportunity: string;         // 2.2 Peluang (Opportunities)
  swot_threat: string;              // 2.2 Ancaman (Threats)
  strategic_issues: string;         // 2.5 Permasalahan dan Isu Strategis
  conclusion: string;               // 5.1 Kesimpulan
  recommendation: string;           // 5.2 Rekomendasi
  improvement_plan: string;         // 5.3 Rencana Perbaikan
  pejabat_nama?: string;
  pejabat_nip?: string;
  pejabat_jabatan?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AnnualUnitProfile {
  id: string;
  report_id: string;
  unit_id: string;
  unit_name: string;
  unit_overview: string;
  background?: string;
  main_duties?: string;
  service_scope?: string;
  service_types?: string;
  operating_hours?: string;
  facilities?: string;
  other_information?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AnnualUnitStaffing {
  id: string;
  report_id: string;
  unit_id: string;
  employee_identifier?: string;
  employee_name: string;
  education: string;
  profession: string;
  position: string;
  employment_status: 'PNS' | 'PPPK' | 'THL' | 'Kontrak' | string;
  available_count: number;
  required_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface AnnualUnitAuthority {
  id: string;
  report_id: string;
  unit_id: string;
  employee_identifier?: string;
  employee_name: string;
  position: string;
  main_duties: string;
  responsibilities: string;
  authorities: string;
  created_at?: string;
  updated_at?: string;
}

export interface DynamicTableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: string[];
  width?: number | string;
  align?: 'left' | 'center' | 'right';
}

export interface AnnualUnitProgramTable {
  id: string;
  report_id: string;
  unit_id: string;
  table_title: string;
  columns_definition: DynamicTableColumn[];
  rows_data: Record<string, any>[];
  analisa?: string;
  rekomendasi?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface AnnualUnitObstacle {
  id: string;
  report_id: string;
  unit_id: string;
  problem_title: string;
  description: string;
  category: 
    | 'SDM' 
    | 'Kompetensi' 
    | 'Sarana dan prasarana' 
    | 'Alat kesehatan' 
    | 'Alat nonmedis' 
    | 'Anggaran' 
    | 'Regulasi dan perizinan' 
    | 'Sistem informasi' 
    | 'Koordinasi' 
    | 'Mutu dan keselamatan pasien' 
    | 'Lainnya' 
    | string;
  root_cause: string;
  service_impact: string;
  management_support: string;
  priority: 'Tinggi' | 'Sedang' | 'Rendah';
  created_at?: string;
  updated_at?: string;
}

export interface AnnualUnitPlan {
  id: string;
  report_id: string;
  unit_id: string;
  problem_reference?: string;
  problem: string;
  cause: string;
  action_plan: string;
  target_completion: string;
  resource_needs: string;
  success_indicator: string;
  priority: 'Tinggi' | 'Sedang' | 'Rendah';
  created_at?: string;
  updated_at?: string;
}

export interface AnnualSectionPlan {
  id: string;
  report_id: string;
  section_plan_title: string;
  source_unit_ids: string[];
  problem: string;
  strategic_action: string;
  target_completion: string;
  resource_needs: string;
  success_indicator: string;
  priority: 'Tinggi' | 'Sedang' | 'Rendah';
  created_at?: string;
  updated_at?: string;
}

export interface AnnualKpiSummaryItem {
  indikator_id: string;
  kode: string;
  nama: string;
  unit: string;
  kategori: string;
  target: number;
  satuan: string;
  frekuensi: string;
  arah_target?: 'Semakin Tinggi' | 'Semakin Rendah';
  numerator_total: number;
  denominator_total: number;
  capaian_annual: number;
  status: 'Tercapai' | 'Mendekati Target' | 'Tidak Tercapai' | 'Belum Melapor';
  months_reported: number;
  draft_count: number;
  submitted_count: number;
  monthly_details: {
    bulan: number;
    numerator: number;
    denominator: number;
    capaian: number;
    status: string;
    keterangan: string;
    eviden: string;
    nilai?: number;
  }[];
  analisa: string;
  analisis?: string;
}

export interface AnnualReportFullData {
  report: AnnualReport;
  sectionProfile: AnnualSectionProfile;
  unitProfiles: Record<string, AnnualUnitProfile>; // keyed by unit_id
  unitStaffing: Record<string, AnnualUnitStaffing[]>; // keyed by unit_id
  unitAuthorities: Record<string, AnnualUnitAuthority[]>; // keyed by unit_id
  unitProgramTables: Record<string, AnnualUnitProgramTable[]>; // keyed by unit_id
  unitObstacles: Record<string, AnnualUnitObstacle[]>; // keyed by unit_id
  unitPlans: Record<string, AnnualUnitPlan[]>; // keyed by unit_id
  sectionPlans: AnnualSectionPlan[];
  kpiSummaries: Record<string, AnnualKpiSummaryItem[]>; // keyed by unit_id
  overallKpiStats: {
    totalIndikator: number;
    totalTercapai: number;
    totalMendekati: number;
    totalTidakTercapai: number;
    totalBelumMelapor: number;
    persenTercapai: number;
  };
  staffingSummary: {
    totalPegawai: number;
    totalPns: number;
    totalPppk: number;
    totalThl: number;
    totalKontrak: number;
    totalKebutuhan: number;
    totalKekurangan: number;
  };
  generated_at?: string;
}

export interface AnnualReportSnapshot {
  id: string;
  report_id: string;
  report_title: string;
  updated_by: string;
  revision_number: number;
  snapshot_json: AnnualReportFullData;
  created_at?: string;
  updated_at?: string;
}
