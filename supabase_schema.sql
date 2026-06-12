-- RLS Policies and Setup for SIKLIN-RS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) CHECK (role IN ('Administrator', 'Supervisor', 'Petugas')) NOT NULL,
  foto TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: indikator
CREATE TABLE public.indikator (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kode VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  definisi TEXT,
  numerator TEXT,
  denominator TEXT,
  formula TEXT,
  target NUMERIC NOT NULL,
  satuan VARCHAR(50),
  frekuensi VARCHAR(100),
  penanggung_jawab VARCHAR(255),
  status BOOLEAN DEFAULT true, -- true for aktif
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: capaian_indikator
CREATE TABLE public.capaian_indikator (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indikator_id UUID REFERENCES public.indikator(id) ON DELETE CASCADE,
  bulan INTEGER NOT NULL,
  tahun INTEGER NOT NULL,
  numerator NUMERIC NOT NULL,
  denominator NUMERIC NOT NULL,
  capaian NUMERIC NOT NULL,
  target NUMERIC NOT NULL,
  keterangan TEXT,
  bukti_file TEXT,
  user_id UUID REFERENCES public.users(id),
  status_submit VARCHAR(50) DEFAULT 'Draft', -- Draft, Submitted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: supervisi
CREATE TABLE public.supervisi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tanggal DATE NOT NULL,
  unit VARCHAR(255) NOT NULL,
  supervisor UUID REFERENCES public.users(id),
  temuan TEXT,
  kategori VARCHAR(100),
  rekomendasi TEXT,
  tindak_lanjut TEXT,
  deadline DATE,
  status VARCHAR(50) DEFAULT 'Belum ditindaklanjuti', -- Dalam proses, Selesai
  dokumentasi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: pengaturan_rs
CREATE TABLE public.pengaturan_rs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_rs VARCHAR(255),
  alamat TEXT,
  telepon VARCHAR(50),
  email VARCHAR(255),
  logo TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Admin User (Will need proper auth creation first in Supabase)
-- Make sure to create a user in Supabase Auth first, then run an insert like this:
-- INSERT INTO public.users (id, nama, email, role) VALUES ('<auth_user_id>', 'Admin', 'admin@example.com', 'Administrator');

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indikator ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capaian_indikator ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan_rs ENABLE ROW LEVEL SECURITY;

-- Policies Examples

-- Users Table Policies
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Admins can insert/update all" ON public.users FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Administrator')
);

-- Indikator Policies
CREATE POLICY "Anyone can view indikator" ON public.indikator FOR SELECT USING (true);
CREATE POLICY "Admins can manage indikator" ON public.indikator FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Administrator')
);

-- Capaian Policies
CREATE POLICY "Users can view all capaian" ON public.capaian_indikator FOR SELECT USING (true);
CREATE POLICY "Admins and Supervisors can manage all capaian" ON public.capaian_indikator FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Administrator', 'Supervisor'))
);
CREATE POLICY "Petugas can manage their own capaian" ON public.capaian_indikator FOR ALL USING (
  user_id = auth.uid()
);

-- Supervisi Policies
CREATE POLICY "Anyone can view supervisi" ON public.supervisi FOR SELECT USING (true);
CREATE POLICY "Admins and Supervisors can manage supervisi" ON public.supervisi FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Administrator', 'Supervisor'))
);

-- Pengaturan_rs Policies
CREATE POLICY "Anyone can view pengaturan" ON public.pengaturan_rs FOR SELECT USING (true);
CREATE POLICY "Admins can manage pengaturan" ON public.pengaturan_rs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Administrator')
);

-- Create Storage Buckets (Manual via Dashboard recommended, or SQL if exact extension is present)
-- You will need to create 'bukti-indikator', 'dokumentasi-supervisi', 'logo-rs' in Supabase Storage.
