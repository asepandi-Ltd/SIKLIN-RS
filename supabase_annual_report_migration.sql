-- ==============================================================================
-- SIPAKAR - RSUD AL-MULK KOTA SUKABUMI
-- SQL MIGRATION: MODUL PENYUSUNAN LAPORAN TAHUNAN SEKSI PENUNJANG
-- ==============================================================================
-- Petunjuk:
-- Salin dan jalankan script SQL ini pada Supabase SQL Editor.
-- Migrasi ini bersifat non-destruktif dan TIDAK merusak tabel existing.
-- ==============================================================================

-- 1. Tabel Identitas Laporan Tahunan
CREATE TABLE IF NOT EXISTS public.annual_reports (
  id VARCHAR(255) PRIMARY KEY,
  report_year INTEGER UNIQUE NOT NULL,
  report_title TEXT NOT NULL,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_annual_reports_year ON public.annual_reports(report_year);

-- 2. Tabel Gambaran Umum dan Analisis Situasi Seksi (BAB I, BAB II, BAB V)
CREATE TABLE IF NOT EXISTS public.annual_section_profile (
  id VARCHAR(255) PRIMARY KEY,
  report_id VARCHAR(255) REFERENCES public.annual_reports(id) ON DELETE CASCADE,
  background TEXT,
  objectives TEXT,
  section_overview TEXT,
  organizational_structure TEXT,
  main_duties TEXT,
  general_conditions TEXT,
  swot_strength TEXT,
  swot_weakness TEXT,
  swot_opportunity TEXT,
  swot_threat TEXT,
  strategic_issues TEXT,
  conclusion TEXT,
  recommendation TEXT,
  improvement_plan TEXT,
  pejabat_nama VARCHAR(255),
  pejabat_nip VARCHAR(255),
  pejabat_jabatan VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_section_profile_report UNIQUE (report_id)
);

CREATE INDEX IF NOT EXISTS idx_section_profile_report ON public.annual_section_profile(report_id);

-- 3. Tabel Profil Unit per Tahun (BAB III A)
CREATE TABLE IF NOT EXISTS public.annual_unit_profiles (
  id VARCHAR(255) PRIMARY KEY,
  report_id VARCHAR(255) REFERENCES public.annual_reports(id) ON DELETE CASCADE,
  unit_id VARCHAR(255) NOT NULL,
  unit_name VARCHAR(255) NOT NULL,
  unit_overview TEXT,
  background TEXT,
  main_duties TEXT,
  service_scope TEXT,
  service_types TEXT,
  operating_hours TEXT,
  facilities TEXT,
  other_information TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_unit_profile UNIQUE (report_id, unit_id)
);

CREATE INDEX IF NOT EXISTS idx_unit_profiles_report_unit ON public.annual_unit_profiles(report_id, unit_id);

-- 4. Tabel Komposisi SDM Unit (BAB III B)
CREATE TABLE IF NOT EXISTS public.annual_unit_staffing (
  id VARCHAR(255) PRIMARY KEY,
  report_id VARCHAR(255) REFERENCES public.annual_reports(id) ON DELETE CASCADE,
  unit_id VARCHAR(255) NOT NULL,
  employee_identifier VARCHAR(255),
  employee_name VARCHAR(255) NOT NULL,
  education VARCHAR(255),
  profession VARCHAR(255),
  position VARCHAR(255),
  employment_status VARCHAR(50) DEFAULT 'PNS', -- PNS, PPPK, THL, Kontrak
  available_count INTEGER DEFAULT 1,
  required_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_unit_staffing_report_unit ON public.annual_unit_staffing(report_id, unit_id);

-- 5. Tabel Pembagian Tugas dan Kewenangan Staf (BAB III B lanjutan)
CREATE TABLE IF NOT EXISTS public.annual_unit_authorities (
  id VARCHAR(255) PRIMARY KEY,
  report_id VARCHAR(255) REFERENCES public.annual_reports(id) ON DELETE CASCADE,
  unit_id VARCHAR(255) NOT NULL,
  employee_identifier VARCHAR(255),
  employee_name VARCHAR(255) NOT NULL,
  position VARCHAR(255),
  main_duties TEXT,
  responsibilities TEXT,
  authorities TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_unit_auth_report_unit ON public.annual_unit_authorities(report_id, unit_id);

-- 6. Tabel Dynamic Table Builder Program & Kegiatan Unit (BAB III C)
CREATE TABLE IF NOT EXISTS public.annual_unit_program_tables (
  id VARCHAR(255) PRIMARY KEY,
  report_id VARCHAR(255) REFERENCES public.annual_reports(id) ON DELETE CASCADE,
  unit_id VARCHAR(255) NOT NULL,
  table_title VARCHAR(255) NOT NULL,
  columns_definition JSONB NOT NULL DEFAULT '[]'::jsonb,
  rows_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_unit_prog_tables_report_unit ON public.annual_unit_program_tables(report_id, unit_id);

-- 7. Tabel Hambatan dan Permasalahan Unit (BAB III E)
CREATE TABLE IF NOT EXISTS public.annual_unit_obstacles (
  id VARCHAR(255) PRIMARY KEY,
  report_id VARCHAR(255) REFERENCES public.annual_reports(id) ON DELETE CASCADE,
  unit_id VARCHAR(255) NOT NULL,
  problem_title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  root_cause TEXT,
  service_impact TEXT,
  management_support TEXT,
  priority VARCHAR(50) DEFAULT 'Sedang', -- Tinggi, Sedang, Rendah
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_unit_obstacles_report_unit ON public.annual_unit_obstacles(report_id, unit_id);

-- 8. Tabel Rencana Kerja Unit (BAB III F)
CREATE TABLE IF NOT EXISTS public.annual_unit_plans (
  id VARCHAR(255) PRIMARY KEY,
  report_id VARCHAR(255) REFERENCES public.annual_reports(id) ON DELETE CASCADE,
  unit_id VARCHAR(255) NOT NULL,
  problem_reference VARCHAR(255),
  problem TEXT NOT NULL,
  cause TEXT,
  action_plan TEXT NOT NULL,
  target_completion VARCHAR(100),
  resource_needs TEXT,
  success_indicator TEXT,
  priority VARCHAR(50) DEFAULT 'Sedang', -- Tinggi, Sedang, Rendah
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_unit_plans_report_unit ON public.annual_unit_plans(report_id, unit_id);

-- 9. Tabel Rencana Kerja Seksi / Konsolidasi (BAB II 2.6)
CREATE TABLE IF NOT EXISTS public.annual_section_plans (
  id VARCHAR(255) PRIMARY KEY,
  report_id VARCHAR(255) REFERENCES public.annual_reports(id) ON DELETE CASCADE,
  section_plan_title TEXT NOT NULL,
  source_unit_ids JSONB DEFAULT '[]'::jsonb,
  problem TEXT,
  strategic_action TEXT NOT NULL,
  target_completion VARCHAR(100),
  resource_needs TEXT,
  success_indicator TEXT,
  priority VARCHAR(50) DEFAULT 'Sedang',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_section_plans_report ON public.annual_section_plans(report_id);

-- 10. Tabel Snapshot Data Final Laporan Tahunan (Frozen snapshot untuk Word/PDF)
CREATE TABLE IF NOT EXISTS public.annual_report_snapshots (
  id VARCHAR(255) PRIMARY KEY,
  report_id VARCHAR(255) REFERENCES public.annual_reports(id) ON DELETE CASCADE,
  snapshot_json JSONB NOT NULL,
  report_title TEXT NOT NULL,
  updated_by VARCHAR(255),
  revision_number INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_report_snapshot UNIQUE (report_id)
);

CREATE INDEX IF NOT EXISTS idx_report_snapshots_report ON public.annual_report_snapshots(report_id);

-- ==============================================================================
-- Keamanan & RLS (Row Level Security)
-- ==============================================================================
-- Sejalan dengan konfigurasi default SIKLIN/SIPAKAR yang menggunakan anon key,
-- RLS dinonaktifkan secara eksplisit pada tabel baru agar operasi client-side aman.
-- Jika ingin mengaktifkan RLS penuh, lihat blok alternatif di bawah.

ALTER TABLE public.annual_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_section_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_unit_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_unit_staffing DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_unit_authorities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_unit_program_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_unit_obstacles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_unit_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_section_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_report_snapshots DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- Realtime Replication
-- ==============================================================================
DO $$
BEGIN
  ALTER TABLE public.annual_reports REPLICA IDENTITY FULL;
  ALTER TABLE public.annual_section_profile REPLICA IDENTITY FULL;
  ALTER TABLE public.annual_unit_profiles REPLICA IDENTITY FULL;
  ALTER TABLE public.annual_unit_staffing REPLICA IDENTITY FULL;
  ALTER TABLE public.annual_unit_authorities REPLICA IDENTITY FULL;
  ALTER TABLE public.annual_unit_program_tables REPLICA IDENTITY FULL;
  ALTER TABLE public.annual_unit_obstacles REPLICA IDENTITY FULL;
  ALTER TABLE public.annual_unit_plans REPLICA IDENTITY FULL;
  ALTER TABLE public.annual_section_plans REPLICA IDENTITY FULL;
  ALTER TABLE public.annual_report_snapshots REPLICA IDENTITY FULL;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.annual_reports;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.annual_section_profile;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.annual_unit_profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.annual_unit_staffing;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.annual_unit_authorities;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.annual_unit_program_tables;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.annual_unit_obstacles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.annual_unit_plans;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.annual_section_plans;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.annual_report_snapshots;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
