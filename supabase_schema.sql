-- Database Schema and Setup for SIKLIN-RS (Supabase)
-- Copy and run this script in the Supabase SQL Editor to set up your tables and policies.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: users
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(255) PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(100) NOT NULL, -- 'Super Admin', 'Kepala Seksi', 'Kepala Unit', 'Supervisor'
  unit VARCHAR(255),
  foto TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: indikator
CREATE TABLE IF NOT EXISTS public.indikator (
  id VARCHAR(255) PRIMARY KEY,
  kode VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  unit VARCHAR(255) NOT NULL,
  kategori VARCHAR(100) NOT NULL, -- 'Penunjang Medis', 'Penunjang Non Medis'
  numerator TEXT NOT NULL,
  denominator TEXT NOT NULL,
  formula TEXT NOT NULL,
  target NUMERIC NOT NULL,
  satuan VARCHAR(50) NOT NULL,
  frekuensi VARCHAR(100) NOT NULL,
  pic VARCHAR(255) NOT NULL,
  status BOOLEAN DEFAULT true,
  arah_target VARCHAR(100) DEFAULT 'Semakin Tinggi', -- 'Semakin Tinggi', 'Semakin Rendah'
  bobot NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: capaian_indikator
CREATE TABLE IF NOT EXISTS public.capaian_indikator (
  id VARCHAR(255) PRIMARY KEY,
  indikator_id VARCHAR(255) REFERENCES public.indikator(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  bulan INTEGER NOT NULL, -- 1-12
  tahun INTEGER NOT NULL,
  numerator NUMERIC NOT NULL,
  denominator NUMERIC NOT NULL,
  capaian NUMERIC NOT NULL,
  target NUMERIC NOT NULL,
  status VARCHAR(100) NOT NULL, -- 'Tercapai', 'Mendekati Target', 'Tidak Tercapai'
  keterangan TEXT,
  eviden TEXT, -- File name or URL
  status_submit VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Submitted'
  nilai INTEGER DEFAULT 3, -- Skor Penilaian (0, 1, 2, 3)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table: supervisi
CREATE TABLE IF NOT EXISTS public.supervisi (
  id VARCHAR(255) PRIMARY KEY,
  unit VARCHAR(255) NOT NULL,
  tanggal VARCHAR(100) NOT NULL,
  supervisor VARCHAR(255) NOT NULL,
  temuan TEXT NOT NULL,
  rekomendasi TEXT,
  akar_masalah TEXT,
  tindak_lanjut TEXT,
  tindak_lanjut_catatan TEXT,
  deadline VARCHAR(100),
  status VARCHAR(100) DEFAULT 'Belum Tindak Lanjut', -- 'Belum Tindak Lanjut', 'Dalam Proses', 'Selesai', etc.
  dokumentasi TEXT,
  supervisor_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table: pengaturan
CREATE TABLE IF NOT EXISTS public.pengaturan (
  id VARCHAR(255) PRIMARY KEY DEFAULT 'default',
  nama_rs VARCHAR(255) NOT NULL,
  logo TEXT,
  alamat TEXT,
  email VARCHAR(255),
  telepon VARCHAR(50),
  target_default NUMERIC DEFAULT 95,
  deadline_day INTEGER DEFAULT 10,
  reminder_input BOOLEAN DEFAULT true,
  reminder_supervisi BOOLEAN DEFAULT true,
  dashboard_media_type VARCHAR(50) DEFAULT 'image',
  dashboard_media_url TEXT,
  dashboard_banner_title TEXT,
  dashboard_banner_subtitle TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table: activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id VARCHAR(255) PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_nama VARCHAR(255) NOT NULL,
  user_role VARCHAR(100) NOT NULL,
  aktivitas TEXT NOT NULL
);

-- Disable Row Level Security (RLS) by default for easier integration, or enable if you want full auth.
-- To enable full Row Level Security, uncomment the lines below and set up your Supabase policies.
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.indikator ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.capaian_indikator ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.supervisi ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pengaturan ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- If you enable RLS, you can add simple public access policies:
-- CREATE POLICY "Allow public read" ON public.users FOR SELECT USING (true);
-- CREATE POLICY "Allow public write" ON public.users FOR ALL USING (true);
-- (Apply similar policies to other tables if needed)

-- Seed Initial Default Users
INSERT INTO public.users (id, nama, email, role, unit) VALUES 
('usr-1', 'Bono Andi', 'Bonoandi@gmail.com', 'Super Admin', 'IT Rumah Sakit / ITRS'),
('usr-2', 'Dr. Fitri Wulandari', 'fitriwul@rsudalmulk.id', 'Kepala Seksi', 'Penunjang Medis'),
('usr-3', 'Ahmad Kurnia', 'ahmad@rsudalmulk.id', 'Kepala Unit', 'Laboratorium'),
('usr-4', 'Hendra Wijaya', 'hendra@rsudalmulk.id', 'Supervisor', 'Mutu'),
('usr-5', 'Siti Rahma', 'siti@rsudalmulk.id', 'Kepala Unit', 'CSSD & Laundry')
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Default Indicators
INSERT INTO public.indikator (id, kode, nama, unit, kategori, numerator, denominator, formula, target, satuan, frekuensi, pic, status, arah_target, bobot) VALUES
('ind-1', 'PM-LAB-01', 'Waktu Tunggu Hasil Pelayanan Laboratorium Darurat (Cito)', 'Laboratorium', 'Penunjang Medis', 'Jumlah pemeriksaan lab Cito selesai < 140 menit', 'Jumlah seluruh sampel lab Cito', '(Jumlah selesai < 140 mnt ÷ Total sampel) × 100%', 100, '%', 'Bulanan', 'Ahmad Kurnia', true, 'Semakin Tinggi', 0),
('ind-2', 'PM-RAD-01', 'Kepatuhan Pemakaian APD pada Petugas Radiologi', 'Radiologi', 'Penunjang Medis', 'Jumlah petugas memakai APD lengkap sesuai standar', 'Jumlah seluruh petugas radiologi yang diamati', '(Jumlah patuh ÷ Total diamati) × 100%', 95, '%', 'Bulanan', 'Rendi Pratama', true, 'Semakin Tinggi', 0),
('ind-3', 'PM-FAR-01', 'Waktu Tunggu Pelayanan Resep Obat Jadi', 'Farmasi', 'Penunjang Medis', 'Jumlah resep obat jadi yang dilayani < 30 menit', 'Jumlah seluruh resep obat jadi', '(Jumlah resep < 30 mnt ÷ Total resep) × 100%', 90, '%', 'Bulanan', 'Apt. Linda', true, 'Semakin Tinggi', 0),
('ind-4', 'PM-GIZ-01', 'Ketepatan Waktu Pemberian Makanan Pasien Rawat Inap', 'Gizi', 'Penunjang Medis', 'Jumlah makanan yang disajikan tepat waktu', 'Jumlah seluruh penyajian makanan', '(Penyajian tepat waktu ÷ Total penyajian) × 100%', 100, '%', 'Bulanan', 'Sari Gizi', true, 'Semakin Tinggi', 0),
('ind-5', 'PNM-LAU-01', 'Ketiadaan Linen yang Ternoda setelah Proses Pencucian', 'CSSD & Laundry', 'Penunjang Non Medis', 'Jumlah linen bersih bebas noda', 'Jumlah seluruh linen yang dicuci', '(Linen bebas noda ÷ Total linen dicuci) × 100%', 98, '%', 'Bulanan', 'Siti Rahma', true, 'Semakin Tinggi', 0),
('ind-6', 'PNM-SAN-01', 'Kepatuhan Pengelolaan Limbah Medis B3 Cair', 'Kesehatan Lingkungan', 'Penunjang Non Medis', 'Jumlah hari dengan volume IPAL terkelola sesuai baku mutu', 'Jumlah hari dalam bulan berjalan', '(Hari sesuai standar ÷ Hari sebulan) × 100%', 100, '%', 'Bulanan', 'Bambang Sanitasi', true, 'Semakin Tinggi', 0),
('ind-7', 'PNM-IPS-01', 'Kecepatan Respon Perbaikan Alat Medis Kerusakan Ringan', 'IPSRS', 'Penunjang Non Medis', 'Jumlah alat medis selesai diperbaiki < 24 jam', 'Jumlah laporan kerusakan alat medis', '(Alat diperbaiki < 24j ÷ Total laporan) × 100%', 90, '%', 'Bulanan', 'Roni Teknik', true, 'Semakin Tinggi', 0)
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Default Settings
INSERT INTO public.pengaturan (id, nama_rs, logo, alamat, email, telepon, target_default, deadline_day, reminder_input, reminder_supervisi) VALUES
('default', 'RSUD Al-Mulk', 'https://ui-avatars.com/api/?name=RSUD+AlMulk&background=00A8A8&color=fff', 'Jl. Jenderal Sudirman No. 123, Kota Bengkulu', 'info@rsudalmulk.go.id', '(0736) 345678', 95, 10, true, true)
ON CONFLICT (id) DO NOTHING;

-- Enable Realtime replica identity full for complete updates/deletes in payload and add to publication
DO $$
BEGIN
  -- Enable replica identity
  ALTER TABLE public.users REPLICA IDENTITY FULL;
  ALTER TABLE public.indikator REPLICA IDENTITY FULL;
  ALTER TABLE public.capaian_indikator REPLICA IDENTITY FULL;
  ALTER TABLE public.supervisi REPLICA IDENTITY FULL;
  ALTER TABLE public.pengaturan REPLICA IDENTITY FULL;
  ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;

  -- Add to publication (ignore errors if already added or publication doesn't exist)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.indikator;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.capaian_indikator;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.supervisi;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pengaturan;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;


-- ==========================================
-- 6. Supabase Storage Setup
-- ==========================================

-- Create "uploads" bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'uploads' bucket to allow public uploads, reads, updates, and deletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow public uploads'
  ) THEN
    CREATE POLICY "Allow public uploads" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'uploads');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow public select'
  ) THEN
    CREATE POLICY "Allow public select" ON storage.objects
      FOR SELECT USING (bucket_id = 'uploads');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow public update'
  ) THEN
    CREATE POLICY "Allow public update" ON storage.objects
      FOR UPDATE WITH CHECK (bucket_id = 'uploads');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow public delete'
  ) THEN
    CREATE POLICY "Allow public delete" ON storage.objects
      FOR DELETE USING (bucket_id = 'uploads');
  END IF;
END $$;


-- ==========================================
-- 7. Comprehensive Row Level Security (RLS) Setup
-- ==========================================

-- RECOMMENDED OPTION FOR SIMPLE SETUP (No authentication gate in frontend):
-- Disable RLS on all tables to allow full client-side read/write access using the anon key.
-- This immediately resolves "new row violates row-level security policy" errors.
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.indikator DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.capaian_indikator DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;

-- ALTERNATIVE SECURE OPTION (If you want to enable RLS and use permissive policies):
-- To use this option, uncomment the lines below and run them in your Supabase SQL Editor.
/*
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indikator ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capaian_indikator ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select users" ON public.users;
DROP POLICY IF EXISTS "Allow public insert users" ON public.users;
DROP POLICY IF EXISTS "Allow public update users" ON public.users;
DROP POLICY IF EXISTS "Allow public delete users" ON public.users;

DROP POLICY IF EXISTS "Allow public select indikator" ON public.indikator;
DROP POLICY IF EXISTS "Allow public insert indikator" ON public.indikator;
DROP POLICY IF EXISTS "Allow public update indikator" ON public.indikator;
DROP POLICY IF EXISTS "Allow public delete indikator" ON public.indikator;

DROP POLICY IF EXISTS "Allow public select capaian" ON public.capaian_indikator;
DROP POLICY IF EXISTS "Allow public insert capaian" ON public.capaian_indikator;
DROP POLICY IF EXISTS "Allow public update capaian" ON public.capaian_indikator;
DROP POLICY IF EXISTS "Allow public delete capaian" ON public.capaian_indikator;

DROP POLICY IF EXISTS "Allow public select supervisi" ON public.supervisi;
DROP POLICY IF EXISTS "Allow public insert supervisi" ON public.supervisi;
DROP POLICY IF EXISTS "Allow public update supervisi" ON public.supervisi;
DROP POLICY IF EXISTS "Allow public delete supervisi" ON public.supervisi;

DROP POLICY IF EXISTS "Allow public select pengaturan" ON public.pengaturan;
DROP POLICY IF EXISTS "Allow public insert pengaturan" ON public.pengaturan;
DROP POLICY IF EXISTS "Allow public update pengaturan" ON public.pengaturan;
DROP POLICY IF EXISTS "Allow public delete pengaturan" ON public.pengaturan;

DROP POLICY IF EXISTS "Allow public select activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow public insert activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow public update activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow public delete activity_logs" ON public.activity_logs;

-- Create highly permissive public policies
CREATE POLICY "Allow public select users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete users" ON public.users FOR DELETE USING (true);

CREATE POLICY "Allow public select indikator" ON public.indikator FOR SELECT USING (true);
CREATE POLICY "Allow public insert indikator" ON public.indikator FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update indikator" ON public.indikator FOR UPDATE USING (true);
CREATE POLICY "Allow public delete indikator" ON public.indikator FOR DELETE USING (true);

CREATE POLICY "Allow public select capaian" ON public.capaian_indikator FOR SELECT USING (true);
CREATE POLICY "Allow public insert capaian" ON public.capaian_indikator FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update capaian" ON public.capaian_indikator FOR UPDATE USING (true);
CREATE POLICY "Allow public delete capaian" ON public.capaian_indikator FOR DELETE USING (true);

CREATE POLICY "Allow public select supervisi" ON public.supervisi FOR SELECT USING (true);
CREATE POLICY "Allow public insert supervisi" ON public.supervisi FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update supervisi" ON public.supervisi FOR UPDATE USING (true);
CREATE POLICY "Allow public delete supervisi" ON public.supervisi FOR DELETE USING (true);

CREATE POLICY "Allow public select pengaturan" ON public.pengaturan FOR SELECT USING (true);
CREATE POLICY "Allow public insert pengaturan" ON public.pengaturan FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update pengaturan" ON public.pengaturan FOR UPDATE USING (true);
CREATE POLICY "Allow public delete pengaturan" ON public.pengaturan FOR DELETE USING (true);

CREATE POLICY "Allow public select activity_logs" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert activity_logs" ON public.activity_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update activity_logs" ON public.activity_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete activity_logs" ON public.activity_logs FOR DELETE USING (true);
*/



