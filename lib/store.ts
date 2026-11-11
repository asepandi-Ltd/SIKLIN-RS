import { create } from 'zustand';
import { supabase } from './supabaseClient';
import {
  isSupabaseConfigured,
  checkSupabaseReachability,
  isSupabaseReachableCached,
  setSupabaseReachability,
  dbGetUsers,
  dbUpsertUser,
  dbDeleteUser,
  dbGetIndikators,
  dbUpsertIndikator,
  dbDeleteIndikator,
  dbGetCapaianList,
  dbUpsertCapaian,
  dbDeleteCapaian,
  dbGetSupervisiList,
  dbUpsertSupervisi,
  dbDeleteSupervisi,
  dbGetPengaturan,
  dbUpsertPengaturan,
  dbGetActivityLogs,
  dbAddActivityLog
} from './supabaseService';

// Types
export interface User {
  id: string;
  nama: string;
  email: string;
  role: 'Super Admin' | 'Kepala Seksi' | 'Kepala Unit' | 'Supervisor';
  unit?: string;
  foto?: string;
}

export interface Indikator {
  id: string;
  kode: string;
  nama: string;
  unit: string;
  kategori: 'Penunjang Medis' | 'Penunjang Non Medis';
  numerator: string;
  denominator: string;
  formula: string;
  target: number;
  satuan: string;
  frekuensi: string;
  pic: string;
  status: boolean; // true = aktif
  created_at: string;
  arah_target?: 'Semakin Tinggi' | 'Semakin Rendah';
  bobot?: number;
  jenis_pengukuran?: 'Persentase' | 'Jumlah' | 'Durasi';
  metode_agregasi?: 'Rata-rata' | 'Akumulasi' | 'Rasio' | 'Nilai Terakhir';
}

export interface Capaian {
  id: string;
  indikator_id: string;
  user_id: string;
  bulan: number; // 1-12
  tahun: number;
  numerator: number;
  denominator: number;
  capaian: number; // calculated auto: (num/denom) * 100
  target: number;
  status: 'Tercapai' | 'Mendekati Target' | 'Tidak Tercapai'; // Green, Yellow, Red
  keterangan: string;
  eviden: string; // File name or URL
  status_submit: 'Draft' | 'Submitted';
  created_at: string;
  nilai?: number; // Skor Penilaian (0, 1, 2, 3)
}

export interface Supervisi {
  id: string;
  unit: string;
  tanggal: string;
  supervisor: string;
  temuan: string;
  rekomendasi?: string;
  akar_masalah?: string;
  tindak_lanjut?: string;
  tindak_lanjut_catatan?: string;
  deadline?: string;
  status: 'Belum Tindak Lanjut' | 'Dalam Proses' | 'Selesai' | 'Belum ditindaklanjuti' | 'Proses';
  dokumentasi?: string;
  supervisor_id?: string;
  created_at: string;
}

export interface Pengaturan {
  nama_rs: string;
  logo: string;
  alamat: string;
  email: string;
  telepon: string;
  target_default: number;
  deadline_day: number; // e.g. 10th of next month
  reminder_input: boolean;
  reminder_supervisi: boolean;
  dashboard_media_type?: 'image' | 'video';
  dashboard_media_url?: string;
  dashboard_banner_title?: string;
  dashboard_banner_subtitle?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user_nama: string;
  user_role: string;
  aktivitas: string;
}

export interface PendingOperation {
  id: string;
  table: 'users' | 'indikator' | 'capaian_indikator' | 'supervisi' | 'pengaturan' | 'activity_logs';
  action: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

interface AppState {
  currentUser: User | null;
  users: User[];
  indikatorList: Indikator[];
  capaianList: Capaian[];
  supervisiList: Supervisi[];
  pengaturan: Pengaturan;
  activityLogs: ActivityLog[];
  isDbConnected: boolean;
  isSyncing: boolean;
  isOnline: boolean;
  pendingQueue: PendingOperation[];
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updated: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  addIndikator: (ind: Omit<Indikator, 'id' | 'created_at'>) => void;
  updateIndikator: (id: string, updated: Partial<Indikator>) => void;
  deleteIndikator: (id: string) => void;
  
  addCapaian: (cap: Omit<Capaian, 'id' | 'created_at' | 'status' | 'capaian'>) => void;
  updateCapaian: (id: string, updated: Partial<Capaian>) => void;
  deleteCapaian: (id: string) => void;
  
  addSupervisi: (sup: Omit<Supervisi, 'id' | 'created_at'>) => void;
  updateSupervisi: (id: string, updated: Partial<Supervisi>) => void;
  deleteSupervisi: (id: string) => void;
  
  updatePengaturan: (updated: Partial<Pengaturan>) => void;
  addLog: (aktivitas: string) => void;
  clearAllData: () => void;
  syncWithSupabase: () => Promise<void>;
  initializeSupabase: () => Promise<void>;
  
  // Resilient / Offline Sync Actions
  addToQueue: (table: PendingOperation['table'], action: PendingOperation['action'], data: any) => void;
  processPendingQueue: () => Promise<void>;
  setupRealtimeSubscription: () => void;
}

// Initial Seeds
const defaultUsers: User[] = [
  { id: 'usr-1', nama: 'Bono Andi', email: 'Bonoandi@gmail.com', role: 'Super Admin', unit: 'IT Rumah Sakit / ITRS' },
  { id: 'usr-2', nama: 'Dr. Fitri Wulandari', email: 'fitriwul@rsudalmulk.id', role: 'Kepala Seksi', unit: 'Penunjang Medis' },
  { id: 'usr-3', nama: 'Ahmad Kurnia', email: 'ahmad@rsudalmulk.id', role: 'Kepala Unit', unit: 'Laboratorium' },
  { id: 'usr-4', nama: 'Hendra Wijaya', email: 'hendra@rsudalmulk.id', role: 'Supervisor', unit: 'Mutu' },
  { id: 'usr-5', nama: 'Siti Rahma', email: 'siti@rsudalmulk.id', role: 'Kepala Unit', unit: 'CSSD & Laundry' },
  { id: 'usr-6', nama: 'Giandeno', email: 'giandeno@rsudalmulk.id', role: 'Kepala Unit', unit: 'IT Rumah Sakit / ITRS' },
];

const defaultIndikator: Indikator[] = [
  {
    id: 'ind-1',
    kode: 'PM-LAB-01',
    nama: 'Waktu Tunggu Hasil Pelayanan Laboratorium Darurat (Cito)',
    unit: 'Laboratorium',
    kategori: 'Penunjang Medis',
    numerator: 'Jumlah pemeriksaan lab Cito selesai < 140 menit',
    denominator: 'Jumlah seluruh sampel lab Cito',
    formula: '(Jumlah selesai < 140 mnt ÷ Total sampel) × 100%',
    target: 100,
    satuan: '%',
    frekuensi: 'Bulanan',
    pic: 'Ahmad Kurnia',
    status: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'ind-2',
    kode: 'PM-RAD-01',
    nama: 'Kepatuhan Pemakaian APD pada Petugas Radiologi',
    unit: 'Radiologi',
    kategori: 'Penunjang Medis',
    numerator: 'Jumlah petugas memakai APD lengkap sesuai standar',
    denominator: 'Jumlah seluruh petugas radiologi yang diamati',
    formula: '(Jumlah patuh ÷ Total diamati) × 100%',
    target: 95,
    satuan: '%',
    frekuensi: 'Bulanan',
    pic: 'Rendi Pratama',
    status: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'ind-3',
    kode: 'PM-FAR-01',
    nama: 'Waktu Tunggu Pelayanan Resep Obat Jadi',
    unit: 'Farmasi',
    kategori: 'Penunjang Medis',
    numerator: 'Jumlah resep obat jadi yang dilayani < 30 menit',
    denominator: 'Jumlah seluruh resep obat jadi',
    formula: '(Jumlah resep < 30 mnt ÷ Total resep) × 100%',
    target: 90,
    satuan: '%',
    frekuensi: 'Bulanan',
    pic: 'Apt. Linda',
    status: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'ind-4',
    kode: 'PM-GIZ-01',
    nama: 'Ketepatan Waktu Pemberian Makanan Pasien Rawat Inap',
    unit: 'Gizi',
    kategori: 'Penunjang Medis',
    numerator: 'Jumlah makanan yang disajikan tepat waktu',
    denominator: 'Jumlah seluruh penyajian makanan',
    formula: '(Penyajian tepat waktu ÷ Total penyajian) × 100%',
    target: 100,
    satuan: '%',
    frekuensi: 'Bulanan',
    pic: 'Sari Gizi',
    status: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'ind-5',
    kode: 'PNM-LAU-01',
    nama: 'Ketiadaan Linen yang Ternoda setelah Proses Pencucian',
    unit: 'CSSD & Laundry',
    kategori: 'Penunjang Non Medis',
    numerator: 'Jumlah linen bersih bebas noda',
    denominator: 'Jumlah seluruh linen yang dicuci',
    formula: '(Linen bebas noda ÷ Total linen dicuci) × 100%',
    target: 98,
    satuan: '%',
    frekuensi: 'Bulanan',
    pic: 'Siti Rahma',
    status: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'ind-6',
    kode: 'PNM-SAN-01',
    nama: 'Kepatuhan Pengelolaan Limbah Medis B3 Cair',
    unit: 'Kesehatan Lingkungan',
    kategori: 'Penunjang Non Medis',
    numerator: 'Jumlah hari dengan volume IPAL terkelola sesuai baku mutu',
    denominator: 'Jumlah hari dalam bulan berjalan',
    formula: '(Hari sesuai standar ÷ Hari sebulan) × 100%',
    target: 100,
    satuan: '%',
    frekuensi: 'Bulanan',
    pic: 'Bambang Sanitasi',
    status: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'ind-7',
    kode: 'PNM-IPS-01',
    nama: 'Kecepatan Respon Perbaikan Alat Medis Kerusakan Ringan',
    unit: 'IPSRS',
    kategori: 'Penunjang Non Medis',
    numerator: 'Jumlah alat medis selesai diperbaiki < 24 jam',
    denominator: 'Jumlah laporan kerusakan alat medis',
    formula: '(Alat diperbaiki < 24j ÷ Total laporan) × 100%',
    target: 90,
    satuan: '%',
    frekuensi: 'Bulanan',
    pic: 'Roni Teknik',
    status: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'ind-lab-07',
    kode: 'LAB-07',
    nama: 'Indikator Kepuasan Pelanggan Unit Laboratorium',
    unit: 'Laboratorium',
    kategori: 'Penunjang Medis',
    numerator: 'Jumlah pasien puas terhadap pelayanan laboratorium',
    denominator: 'Jumlah total responden survei laboratorium',
    formula: '(Pasien Puas ÷ Total Responden) × 100%',
    target: 85,
    satuan: '%',
    frekuensi: 'Bulanan',
    pic: 'Ahmad Kurnia',
    status: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'ind-rad-05',
    kode: 'RAD-05',
    nama: 'Indikator Kepuasan Pelanggan Unit Radiologi',
    unit: 'Radiologi',
    kategori: 'Penunjang Medis',
    numerator: 'Jumlah pasien puas terhadap pelayanan radiologi',
    denominator: 'Jumlah total responden survei radiologi',
    formula: '(Pasien Puas ÷ Total Responden) × 100%',
    target: 85,
    satuan: '%',
    frekuensi: 'Bulanan',
    pic: 'Rendi Pratama',
    status: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'ind-far-05',
    kode: 'FAR-05',
    nama: 'Indikator Kepuasan Pelanggan Unit Farmasi',
    unit: 'Farmasi',
    kategori: 'Penunjang Medis',
    numerator: 'Jumlah pasien puas terhadap pelayanan farmasi',
    denominator: 'Jumlah total responden survei farmasi',
    formula: '(Pasien Puas ÷ Total Responden) × 100%',
    target: 85,
    satuan: '%',
    frekuensi: 'Bulanan',
    pic: 'Apt. Linda',
    status: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'ind-rm-05',
    kode: 'RM-05',
    nama: 'Indikator Kepuasan Pelanggan Unit Rekam Medis',
    unit: 'Rekam Medis',
    kategori: 'Penunjang Non Medis',
    numerator: 'Jumlah pasien puas terhadap pelayanan rekam medis',
    denominator: 'Jumlah total responden survei rekam medis',
    formula: '(Pasien Puas ÷ Total Responden) × 100%',
    target: 85,
    satuan: '%',
    frekuensi: 'Bulanan',
    pic: 'Dewi Rekam Medis',
    status: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'ind-giz-05',
    kode: 'GIZ-05',
    nama: 'Indikator Kepuasan Pelanggan Unit Gizi',
    unit: 'Gizi',
    kategori: 'Penunjang Medis',
    numerator: 'Jumlah pasien puas terhadap penyajian makanan & gizi',
    denominator: 'Jumlah total responden survei gizi',
    formula: '(Pasien Puas ÷ Total Responden) × 100%',
    target: 85,
    satuan: '%',
    frekuensi: 'Bulanan',
    pic: 'Sari Gizi',
    status: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'ind-hum-07',
    kode: 'HUM-07',
    nama: 'Rating Google Review & KESSAN BPJS (Humas & Pemasaran)',
    unit: 'Humas & Pemasaran',
    kategori: 'Penunjang Non Medis',
    numerator: 'Jumlah ulasan/responden positif (Bintang 4-5 / Puas KESSAN)',
    denominator: 'Total ulasan Google Review & KESSAN BPJS',
    formula: '(Ulasan Positif ÷ Total Ulasan) × 100%',
    target: 85,
    satuan: '%',
    frekuensi: 'Bulanan',
    pic: 'Budi Humas',
    status: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'ind-it-01',
    kode: 'PNM-IT-01',
    nama: 'Response Time Penanganan Gangguan SIMRS & Jaringan < 15 Menit',
    unit: 'IT Rumah Sakit / ITRS',
    kategori: 'Penunjang Non Medis',
    numerator: 'Jumlah laporan gangguan IT / SIMRS ditangani < 15 menit',
    denominator: 'Jumlah total laporan gangguan IT / SIMRS',
    formula: '(Laporan ditangani < 15 mnt ÷ Total laporan) × 100%',
    target: 95,
    satuan: '%',
    frekuensi: 'Bulanan',
    pic: 'Giandeno',
    status: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'ind-it-02',
    kode: 'PNM-IT-02',
    nama: 'Keandalan & Server Uptime SIMRS (Target 99%)',
    unit: 'IT Rumah Sakit / ITRS',
    kategori: 'Penunjang Non Medis',
    numerator: 'Jumlah jam server & SIMRS berjalan lancar tanpa terhenti',
    denominator: 'Jumlah jam operasional bulanan',
    formula: '(Jam aktif ÷ Total jam operasional) × 100%',
    target: 99,
    satuan: '%',
    frekuensi: 'Bulanan',
    pic: 'Giandeno',
    status: true,
    created_at: new Date('2026-01-01').toISOString(),
  }
];

const defaultCapaian: Capaian[] = [
  // Jan 2026
  {
    id: 'cap-1',
    indikator_id: 'ind-1',
    user_id: 'usr-3',
    bulan: 1,
    tahun: 2026,
    numerator: 98,
    denominator: 100,
    capaian: 98,
    target: 100,
    status: 'Mendekati Target',
    keterangan: 'Ada kendala keterlambatan pengiriman reagen darurat.',
    eviden: 'Eviden_Lab_Jan_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-02-05').toISOString()
  },
  {
    id: 'cap-2',
    indikator_id: 'ind-5',
    user_id: 'usr-5',
    bulan: 1,
    tahun: 2026,
    numerator: 395,
    denominator: 400,
    capaian: 98.75,
    target: 98,
    status: 'Tercapai',
    keterangan: 'Pencucian berjalan lancar dengan mesin baru.',
    eviden: 'Linen_Jan.xlsx',
    status_submit: 'Submitted',
    created_at: new Date('2026-02-04').toISOString()
  },
  // Feb 2026
  {
    id: 'cap-3',
    indikator_id: 'ind-1',
    user_id: 'usr-3',
    bulan: 2,
    tahun: 2026,
    numerator: 120,
    denominator: 120,
    capaian: 100,
    target: 100,
    status: 'Tercapai',
    keterangan: 'Semua pemeriksaan darurat ditangani < 140 menit.',
    eviden: 'Eviden_Lab_Feb_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-03-03').toISOString()
  },
  {
    id: 'cap-4',
    indikator_id: 'ind-5',
    user_id: 'usr-5',
    bulan: 2,
    tahun: 2026,
    numerator: 350,
    denominator: 370,
    capaian: 94.59,
    target: 98,
    status: 'Tidak Tercapai',
    keterangan: 'Kendala pada mesin pengering menyebabkan linen agak lembab dan sedikit bernoda.',
    eviden: 'Linen_Feb.xlsx',
    status_submit: 'Submitted',
    created_at: new Date('2026-03-05').toISOString()
  },
  {
    id: 'cap-5',
    indikator_id: 'ind-2',
    user_id: 'usr-3',
    bulan: 2,
    tahun: 2026,
    numerator: 19,
    denominator: 20,
    capaian: 95,
    target: 95,
    status: 'Tercapai',
    keterangan: 'Kepatuhan APD berjalan baik.',
    eviden: 'APD_Feb.png',
    status_submit: 'Submitted',
    created_at: new Date('2026-03-05').toISOString()
  },
  {
    id: 'cap-6',
    indikator_id: 'ind-3',
    user_id: 'usr-3',
    bulan: 2,
    tahun: 2026,
    numerator: 88,
    denominator: 100,
    capaian: 88,
    target: 90,
    status: 'Mendekati Target',
    keterangan: 'Kekurangan staf di sore hari.',
    eviden: 'Farmasi_Feb.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-03-06').toISOString()
  },
  // Maret 2026
  {
    id: 'cap-7',
    indikator_id: 'ind-1',
    user_id: 'usr-3',
    bulan: 3,
    tahun: 2026,
    numerator: 150,
    denominator: 150,
    capaian: 100,
    target: 100,
    status: 'Tercapai',
    keterangan: 'Kinerja optimal, target tercapai.',
    eviden: 'Lab_Mar_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-04-02').toISOString()
  },
  {
    id: 'cap-8',
    indikator_id: 'ind-5',
    user_id: 'usr-5',
    bulan: 3,
    tahun: 2026,
    numerator: 420,
    denominator: 425,
    capaian: 98.82,
    target: 98,
    status: 'Tercapai',
    keterangan: 'Mesin pengering sudah diperbaiki.',
    eviden: 'Linen_Mar.xlsx',
    status_submit: 'Submitted',
    created_at: new Date('2026-04-03').toISOString()
  },
  {
    id: 'cap-9',
    indikator_id: 'ind-6',
    user_id: 'usr-5',
    bulan: 3,
    tahun: 2026,
    numerator: 25,
    denominator: 31,
    capaian: 80.64,
    target: 100,
    status: 'Tidak Tercapai',
    keterangan: 'Ada kebocoran pipa inlet IPAL pada pertengahan bulan.',
    eviden: 'Sanitasi_Maret.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-04-04').toISOString()
  },
  {
    id: 'cap-sat-lab-3',
    indikator_id: 'ind-lab-07',
    user_id: 'usr-3',
    bulan: 3,
    tahun: 2026,
    numerator: 92,
    denominator: 100,
    capaian: 92,
    target: 85,
    status: 'Tercapai',
    keterangan: 'Survei kepuasan pelanggan laboratorium mencapai target 92%.',
    eviden: 'Survei_Lab_Mar_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-04-02').toISOString()
  },
  {
    id: 'cap-sat-rad-3',
    indikator_id: 'ind-rad-05',
    user_id: 'usr-3',
    bulan: 3,
    tahun: 2026,
    numerator: 90,
    denominator: 100,
    capaian: 90,
    target: 85,
    status: 'Tercapai',
    keterangan: 'Survei kepuasan pelanggan pelayanan radiologi mencapai target 90%.',
    eviden: 'Survei_Radiologi_Mar_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-04-02').toISOString()
  },
  {
    id: 'cap-sat-far-3',
    indikator_id: 'ind-far-05',
    user_id: 'usr-3',
    bulan: 3,
    tahun: 2026,
    numerator: 89,
    denominator: 100,
    capaian: 89,
    target: 85,
    status: 'Tercapai',
    keterangan: 'Survei kepuasan pelanggan pelayanan farmasi mencapai 89%.',
    eviden: 'Survei_Farmasi_Mar_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-04-02').toISOString()
  },
  {
    id: 'cap-sat-rm-3',
    indikator_id: 'ind-rm-05',
    user_id: 'usr-3',
    bulan: 3,
    tahun: 2026,
    numerator: 86,
    denominator: 100,
    capaian: 86,
    target: 85,
    status: 'Tercapai',
    keterangan: 'Survei kepuasan pelanggan rekam medis melampaui target 85%.',
    eviden: 'Survei_RM_Mar_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-04-02').toISOString()
  },
  {
    id: 'cap-sat-giz-3',
    indikator_id: 'ind-giz-05',
    user_id: 'usr-5',
    bulan: 3,
    tahun: 2026,
    numerator: 94,
    denominator: 100,
    capaian: 94,
    target: 85,
    status: 'Tercapai',
    keterangan: 'Kepuasan pelayanan makanan pasien rawat inap sangat tinggi.',
    eviden: 'Survei_Gizi_Mar_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-04-02').toISOString()
  },
  {
    id: 'cap-sat-hum-3',
    indikator_id: 'ind-hum-07',
    user_id: 'usr-1',
    bulan: 3,
    tahun: 2026,
    numerator: 91,
    denominator: 100,
    capaian: 91,
    target: 85,
    status: 'Tercapai',
    keterangan: 'Rating Google Review (4.8 bintang) & KESSAN BPJS sangat positif.',
    eviden: 'Review_Google_BPJS_Mar_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-04-02').toISOString()
  },
  // IT Unit Capaian (Giandeno) - Maret 2026
  {
    id: 'cap-it-3-1',
    indikator_id: 'ind-it-01',
    user_id: 'usr-6',
    bulan: 3,
    tahun: 2026,
    numerator: 48,
    denominator: 50,
    capaian: 96,
    target: 95,
    status: 'Tercapai',
    keterangan: 'Penanganan laporan kendala SIMRS berjalan responsif.',
    eviden: 'Eviden_IT_Maret_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-04-03T08:00:00Z').toISOString()
  },
  {
    id: 'cap-it-3-2',
    indikator_id: 'ind-it-02',
    user_id: 'usr-6',
    bulan: 3,
    tahun: 2026,
    numerator: 99.8,
    denominator: 100,
    capaian: 99.8,
    target: 99,
    status: 'Tercapai',
    keterangan: 'Server utama & database SIMRS aktif tanpa gangguan.',
    eviden: 'Uptime_IT_Maret_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-04-03T08:30:00Z').toISOString()
  },
  // IT Unit Capaian (Giandeno) - Juli 2026 (Bulan 7)
  {
    id: 'cap-it-7-1',
    indikator_id: 'ind-it-01',
    user_id: 'usr-6',
    bulan: 7,
    tahun: 2026,
    numerator: 49,
    denominator: 50,
    capaian: 98,
    target: 95,
    status: 'Tercapai',
    keterangan: 'Input capaian kinerja unit IT / ITRS bulan Juli disubmit oleh Giandeno.',
    eviden: 'Eviden_IT_Juli_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-07-04T08:30:00Z').toISOString()
  },
  {
    id: 'cap-it-7-2',
    indikator_id: 'ind-it-02',
    user_id: 'usr-6',
    bulan: 7,
    tahun: 2026,
    numerator: 99.6,
    denominator: 100,
    capaian: 99.6,
    target: 99,
    status: 'Tercapai',
    keterangan: 'Server dan jaringan SIMRS beroperasi stabil penuh selama bulan Juli.',
    eviden: 'Server_Uptime_Juli_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-07-05T09:15:00Z').toISOString()
  },
  // IPSRS Unit Capaian - Juli 2026 (Bulan 7)
  {
    id: 'cap-ips-7-1',
    indikator_id: 'ind-7',
    user_id: 'usr-1',
    bulan: 7,
    tahun: 2026,
    numerator: 18,
    denominator: 20,
    capaian: 90,
    target: 90,
    status: 'Tercapai',
    keterangan: 'Respon cepat perbaikan alat medis kerusakan ringan bulan Juli.',
    eviden: 'Eviden_IPSRS_Juli_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-07-06T09:00:00Z').toISOString()
  },
  // Laboratorium Capaian - Juli 2026
  {
    id: 'cap-lab-7-1',
    indikator_id: 'ind-1',
    user_id: 'usr-3',
    bulan: 7,
    tahun: 2026,
    numerator: 140,
    denominator: 140,
    capaian: 100,
    target: 100,
    status: 'Tercapai',
    keterangan: 'Pemeriksaan lab cito bulan Juli ditangani 100% tepat waktu.',
    eviden: 'Lab_Juli_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-07-03T10:00:00Z').toISOString()
  },
  {
    id: 'cap-lab-7-2',
    indikator_id: 'ind-lab-07',
    user_id: 'usr-3',
    bulan: 7,
    tahun: 2026,
    numerator: 93,
    denominator: 100,
    capaian: 93,
    target: 85,
    status: 'Tercapai',
    keterangan: 'Kepuasan pelanggan lab bulan Juli mencapai 93%.',
    eviden: 'Survei_Lab_Juli_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-07-03T10:15:00Z').toISOString()
  },
  // Radiologi Capaian - Juli 2026
  {
    id: 'cap-rad-7-1',
    indikator_id: 'ind-2',
    user_id: 'usr-3',
    bulan: 7,
    tahun: 2026,
    numerator: 20,
    denominator: 20,
    capaian: 100,
    target: 95,
    status: 'Tercapai',
    keterangan: 'Petugas radiologi patuh menggunakan APD lengkap.',
    eviden: 'Radiologi_Juli_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-07-04T11:00:00Z').toISOString()
  },
  {
    id: 'cap-rad-7-2',
    indikator_id: 'ind-rad-05',
    user_id: 'usr-3',
    bulan: 7,
    tahun: 2026,
    numerator: 91,
    denominator: 100,
    capaian: 91,
    target: 85,
    status: 'Tercapai',
    keterangan: 'Survei kepuasan radiologi melampaui target.',
    eviden: 'Survei_Rad_Juli_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-07-04T11:30:00Z').toISOString()
  },
  // Farmasi Capaian - Juli 2026
  {
    id: 'cap-far-7-1',
    indikator_id: 'ind-3',
    user_id: 'usr-3',
    bulan: 7,
    tahun: 2026,
    numerator: 92,
    denominator: 100,
    capaian: 92,
    target: 90,
    status: 'Tercapai',
    keterangan: 'Waktu tunggu resep obat jadi berjalan lancar.',
    eviden: 'Farmasi_Juli_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-07-05T08:00:00Z').toISOString()
  },
  {
    id: 'cap-far-7-2',
    indikator_id: 'ind-far-05',
    user_id: 'usr-3',
    bulan: 7,
    tahun: 2026,
    numerator: 90,
    denominator: 100,
    capaian: 90,
    target: 85,
    status: 'Tercapai',
    keterangan: 'Kepuasan pelayanan farmasi mencapai 90%.',
    eviden: 'Survei_Far_Juli_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-07-05T08:30:00Z').toISOString()
  },
  // Gizi Capaian - Juli 2026
  {
    id: 'cap-giz-7-1',
    indikator_id: 'ind-4',
    user_id: 'usr-5',
    bulan: 7,
    tahun: 2026,
    numerator: 300,
    denominator: 300,
    capaian: 100,
    target: 100,
    status: 'Tercapai',
    keterangan: 'Pemberian makanan pasien 100% tepat waktu.',
    eviden: 'Gizi_Juli_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-07-05T09:00:00Z').toISOString()
  },
  {
    id: 'cap-giz-7-2',
    indikator_id: 'ind-giz-05',
    user_id: 'usr-5',
    bulan: 7,
    tahun: 2026,
    numerator: 95,
    denominator: 100,
    capaian: 95,
    target: 85,
    status: 'Tercapai',
    keterangan: 'Tingkat kepuasan gizi pasien sangat baik.',
    eviden: 'Survei_Gizi_Juli_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-07-05T09:30:00Z').toISOString()
  },
  // CSSD & Laundry Capaian - Juli 2026
  {
    id: 'cap-lau-7-1',
    indikator_id: 'ind-5',
    user_id: 'usr-5',
    bulan: 7,
    tahun: 2026,
    numerator: 490,
    denominator: 500,
    capaian: 98,
    target: 98,
    status: 'Tercapai',
    keterangan: 'Ketiadaan linen bernoda tercapai 98%.',
    eviden: 'Laundry_Juli_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-07-06T10:00:00Z').toISOString()
  },
  // Kesehatan Lingkungan Capaian - Juli 2026
  {
    id: 'cap-san-7-1',
    indikator_id: 'ind-6',
    user_id: 'usr-5',
    bulan: 7,
    tahun: 2026,
    numerator: 31,
    denominator: 31,
    capaian: 100,
    target: 100,
    status: 'Tercapai',
    keterangan: 'Pengelolaan limbah B3 cair terkelola sempurna sepanjang Juli.',
    eviden: 'Kesling_Juli_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-07-06T11:00:00Z').toISOString()
  },
  // Rekam Medis Capaian - Juli 2026
  {
    id: 'cap-rm-7-1',
    indikator_id: 'ind-rm-05',
    user_id: 'usr-3',
    bulan: 7,
    tahun: 2026,
    numerator: 88,
    denominator: 100,
    capaian: 88,
    target: 85,
    status: 'Tercapai',
    keterangan: 'Kepuasan rekam medis mencapai 88%.',
    eviden: 'Survei_RM_Juli_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-07-07T08:00:00Z').toISOString()
  },
  // Humas & Pemasaran Capaian - Juli 2026
  {
    id: 'cap-hum-7-1',
    indikator_id: 'ind-hum-07',
    user_id: 'usr-1',
    bulan: 7,
    tahun: 2026,
    numerator: 92,
    denominator: 100,
    capaian: 92,
    target: 85,
    status: 'Tercapai',
    keterangan: 'Rating Google Review dan KESSAN BPJS tetap tinggi.',
    eviden: 'Humas_Juli_2026.pdf',
    status_submit: 'Submitted',
    created_at: new Date('2026-07-07T09:00:00Z').toISOString()
  }
];

const defaultSupervisi: Supervisi[] = [
  {
    id: 'sup-1',
    unit: 'CSSD & Laundry',
    tanggal: '2026-02-15',
    supervisor: 'Hendra Wijaya',
    temuan: 'Mesin pengering No. 2 mengalami kerusakan heater sehingga proses pengeringan linen terganggu.',
    akar_masalah: 'Kurangnya pemeliharaan rutin terencana dari vendor teknik.',
    tindak_lanjut: 'Melakukan koordinasi dengan IPSRS untuk pemanggilan teknisi vendor luar.',
    deadline: '2026-02-25',
    status: 'Selesai',
    dokumentasi: 'supervisi_laundry_1.png',
    created_at: new Date('2026-02-15').toISOString()
  },
  {
    id: 'sup-2',
    unit: 'Kesehatan Lingkungan',
    tanggal: '2026-03-20',
    supervisor: 'Hendra Wijaya',
    temuan: 'Pipa inlet IPAL retak ringan menyebabkan sedikit bau di area taman penunjang.',
    akar_masalah: 'Faktor usia pipa PVC luar gedung yang terpapar sinar matahari langsung.',
    tindak_lanjut: 'Melakukan penggantian pipa PVC jenis HDPE yang tahan UV.',
    deadline: '2026-04-10',
    status: 'Proses',
    dokumentasi: 'supervisi_sanitasi_1.jpg',
    created_at: new Date('2026-03-20').toISOString()
  },
  {
    id: 'sup-3',
    unit: 'Laboratorium',
    tanggal: '2026-04-12',
    supervisor: 'Hendra Wijaya',
    temuan: 'Penyimpanan reagen cadangan di lemari es tidak dilengkapi dengan log suhu harian.',
    akar_masalah: 'Petugas piket malam lupa mengisi form kertas log harian.',
    tindak_lanjut: 'Membuat QR Code log suhu digital dan menempelkannya di pintu kulkas.',
    deadline: '2026-04-19',
    status: 'Belum ditindaklanjuti',
    created_at: new Date('2026-04-12').toISOString()
  }
];

const defaultPengaturan: Pengaturan = {
  nama_rs: 'RSUD Al-Mulk',
  logo: 'https://ui-avatars.com/api/?name=RSUD+AlMulk&background=00A8A8&color=fff',
  alamat: 'Jl. Jenderal Sudirman No. 123, Kota Bengkulu',
  email: 'info@rsudalmulk.go.id',
  telepon: '(0736) 345678',
  target_default: 95,
  deadline_day: 10,
  reminder_input: true,
  reminder_supervisi: true,
  dashboard_media_type: 'image',
  dashboard_media_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200',
  dashboard_banner_title: 'Portal Analisis Kinerja Pelayanan Seksi Penunjang',
  dashboard_banner_subtitle: 'Sistem Informasi Pemantauan Aktivitas Kinerja Rumah Sakit (SIPAKAR)',
};

const defaultLogs: ActivityLog[] = [
  { id: 'log-1', timestamp: new Date('2026-04-01T08:00:00Z').toISOString(), user_nama: 'Bono Andi', user_role: 'Super Admin', aktivitas: 'Inisialisasi sistem pertama kali (SIPAKAR).' },
  { id: 'log-2', timestamp: new Date('2026-04-02T09:30:00Z').toISOString(), user_nama: 'Ahmad Kurnia', user_role: 'Kepala Unit', aktivitas: 'Menginput realisasi KPI Laboratorium untuk bulan Maret 2026.' }
];

// Helper to get or infer measurement type
export function getJenisPengukuran(ind?: Partial<Indikator>): 'Persentase' | 'Jumlah' | 'Durasi' {
  if (ind?.jenis_pengukuran) return ind.jenis_pengukuran;
  const satuan = (ind?.satuan || '').toLowerCase().trim();
  if (satuan.includes('menit') || satuan.includes('jam') || satuan.includes('detik') || satuan.includes('hari')) {
    return 'Durasi';
  }
  if (
    satuan === 'kali' || 
    satuan === 'laporan' || 
    satuan === 'dokumen' || 
    satuan === 'kegiatan' || 
    satuan === 'kasus' || 
    satuan === 'pasien' || 
    satuan === 'sampel' || 
    satuan === 'unit' || 
    satuan === 'orang' || 
    satuan === 'berkas' || 
    satuan === 'lembar'
  ) {
    return 'Jumlah';
  }
  return 'Persentase';
}

// Helper to calculate raw value from numerator & denominator based on measurement type
export function calculateCapaianValue(
  numerator: number,
  denominator: number,
  ind?: Partial<Indikator>
): number {
  const jenis = getJenisPengukuran(ind);
  if (jenis === 'Jumlah') {
    // For Jumlah (count/absolute), if denominator is 1 or empty, the value is numerator
    if (!denominator || denominator <= 1) {
      return numerator;
    }
    return numerator;
  }
  if (jenis === 'Durasi') {
    if (denominator > 0) {
      return Math.round((numerator / denominator) * 100) / 100;
    }
    return numerator;
  }
  // Default: Persentase (ratio/percentage)
  if (denominator > 0) {
    return Math.round(((numerator / denominator) * 100) * 100) / 100;
  }
  return 0;
}

// Helper to calculate status
export function determineStatus(
  capaian: number, 
  target: number, 
  arah_target?: 'Semakin Tinggi' | 'Semakin Rendah',
  jenis_pengukuran?: 'Persentase' | 'Jumlah' | 'Durasi'
): 'Tercapai' | 'Mendekati Target' | 'Tidak Tercapai' {
  const tolerance = (jenis_pengukuran === 'Jumlah' || jenis_pengukuran === 'Durasi') 
    ? Math.max(1, target * 0.1) 
    : 10;

  if (arah_target === 'Semakin Rendah') {
    if (capaian <= target) return 'Tercapai';
    if (capaian <= target + tolerance) return 'Mendekati Target';
    return 'Tidak Tercapai';
  }
  if (capaian >= target) return 'Tercapai';
  if (capaian >= target - tolerance) return 'Mendekati Target';
  return 'Tidak Tercapai';
}

export const useAppStore = create<AppState>((set, get) => {
  // Safe localStorage access
  const getStored = (key: string, fallback: any) => {
    if (typeof window === 'undefined') return fallback;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
      console.warn("Storage read fail", e);
      return fallback;
    }
  };

  const setStored = (key: string, val: any) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn("Storage write fail", e);
    }
  };

  // Initial State Loading
  const currentUser = getStored('sipak_currentUser', defaultUsers[0]); // default is Super Admin Bono
  const loadedUsers: User[] = getStored('sipak_users', defaultUsers);
  const loadedIndikator: Indikator[] = getStored('sipak_indikator', defaultIndikator);
  const loadedCapaian: Capaian[] = getStored('sipak_capaian', defaultCapaian);
  const supervisiList = getStored('sipak_supervisi', defaultSupervisi);
  const pengaturan = getStored('sipak_pengaturan', defaultPengaturan);
  const activityLogs = getStored('sipak_logs', defaultLogs);

  // Merge defaults if missing in stored state
  const users = [...loadedUsers];
  defaultUsers.forEach(du => {
    if (!users.some(u => u.id === du.id || u.nama.toLowerCase() === du.nama.toLowerCase())) {
      users.push(du);
    }
  });

  const indikatorList = [...loadedIndikator];
  defaultIndikator.forEach(di => {
    if (!indikatorList.some(i => i.id === di.id || i.kode === di.kode)) {
      indikatorList.push(di);
    }
  });

  const rawCapaianList = [...loadedCapaian];
  defaultCapaian.forEach(dc => {
    if (!rawCapaianList.some(c => c.id === dc.id || (c.indikator_id === dc.indikator_id && c.bulan === dc.bulan && c.tahun === dc.tahun))) {
      rawCapaianList.push(dc);
    }
  });

  // Deduplicate by indicator_id + bulan + tahun, keeping the latest / user-submitted record
  const capaianMap = new Map<string, Capaian>();
  rawCapaianList.forEach(c => {
    const key = `${c.indikator_id}_${c.bulan}_${c.tahun}`;
    const existing = capaianMap.get(key);
    if (!existing) {
      capaianMap.set(key, c);
    } else {
      const existingTime = new Date(existing.created_at || 0).getTime();
      const currTime = new Date(c.created_at || 0).getTime();
      if (currTime >= existingTime || (c.id.startsWith('cap-1') && !existing.id.startsWith('cap-1'))) {
        capaianMap.set(key, c);
      }
    }
  });
  const capaianList = Array.from(capaianMap.values());
  if (typeof window !== 'undefined') {
    setStored('sipak_capaian', capaianList);
  }

  // Initialise pending queue
  const pendingQueue = getStored('sipak_pending_queue', []);

  return {
    currentUser,
    users,
    indikatorList,
    capaianList,
    supervisiList,
    pengaturan,
    activityLogs,
    isDbConnected: false,
    isSyncing: false,
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    pendingQueue,

    initializeSupabase: async () => {
      if (!isSupabaseConfigured()) return;
      
      // Setup online/offline event listeners
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          set({ isOnline: true });
          get().processPendingQueue();
        });
        window.addEventListener('offline', () => {
          set({ isOnline: false, isDbConnected: false });
        });
      }

      set({ isSyncing: true });
      try {
        // Quick reachability verification before firing database queries
        const isReachable = await checkSupabaseReachability();
        if (!isReachable) {
          console.info('Supabase host is unreachable. Running seamlessly in local storage mode.');
          set({ isDbConnected: false, isSyncing: false });
          return;
        }

        // Run automatic migration of local storage data if not done yet
        const migrationDone = getStored('sipak_migration_done', 'false') === 'true';
        if (!migrationDone) {
          // Check if Supabase already has data to prevent overwriting with local defaults
          let hasDbData = false;
          try {
            const [usersDb, indDb] = await Promise.all([
              dbGetUsers(),
              dbGetIndikators(),
            ]);
            hasDbData = !!(usersDb && usersDb.length > 0) || !!(indDb && indDb.length > 0);
          } catch (dbCheckErr) {
            console.warn("Could not check existing Supabase data, will assume empty:", dbCheckErr);
          }

          if (hasDbData) {
            console.log("Supabase already has existing data. Skipping local migration to protect database integrity.");
            setStored('sipak_migration_done', 'true');
          } else {
            console.log("Automatic local storage to Supabase migration starting...");
            try {
              const currentUsers = get().users;
              const currentInd = get().indikatorList;
              const currentCap = get().capaianList;
              const currentSup = get().supervisiList;
              const currentPeng = get().pengaturan;
              const currentLogs = get().activityLogs;

              // Sequentially upsert all tables
              for (const u of currentUsers) {
                await dbUpsertUser(u);
              }
              for (const i of currentInd) {
                await dbUpsertIndikator(i);
              }
              for (const c of currentCap) {
                await dbUpsertCapaian(c);
              }
              for (const s of currentSup) {
                await dbUpsertSupervisi(s);
              }
              await dbUpsertPengaturan(currentPeng);
              
              for (const l of currentLogs) {
                await dbAddActivityLog(l);
              }

              setStored('sipak_migration_done', 'true');
              console.log("Automatic migration of local data completed successfully!");
            } catch (migrationError) {
              console.warn("Local data automatic migration encountered errors, will continue sync:", migrationError);
            }
          }
        }

        // Load latest state from Supabase
        await get().syncWithSupabase();
        
        // Setup Realtime subscriptions
        get().setupRealtimeSubscription();

        // Process any queued changes that were stored offline
        await get().processPendingQueue();

        // Start background periodic queue flushing
        if (typeof window !== 'undefined') {
          setInterval(() => {
            get().processPendingQueue();
          }, 15000);
        }
      } catch (e) {
        console.log('Supabase Sync status: auto-initialization processed');
      } finally {
        set({ isSyncing: false });
      }
    },

    syncWithSupabase: async () => {
      if (!isSupabaseConfigured()) {
        set({ isDbConnected: false });
        return;
      }
      
      const isReachable = await checkSupabaseReachability();
      if (!isReachable) {
        set({ isDbConnected: false, isSyncing: false });
        return;
      }

      set({ isSyncing: true });
      try {
        const [usersDb, indDb, capDb, supDb, pengDb, logsDb] = await Promise.all([
          dbGetUsers(),
          dbGetIndikators(),
          dbGetCapaianList(),
          dbGetSupervisiList(),
          dbGetPengaturan(),
          dbGetActivityLogs(),
        ]);

        const nextState: Partial<AppState> = {};
        let successCount = 0;
        let failCount = 0;

        // 1. Users table
        if (usersDb !== undefined && usersDb !== null) {
          successCount++;
          if (usersDb.length > 0) {
            nextState.users = usersDb;
            setStored('sipak_users', usersDb);
          } else {
            const currentUsers = get().users;
            for (const u of currentUsers) {
              await dbUpsertUser(u);
            }
          }
        } else if (usersDb === undefined) {
          failCount++;
        }

        // 2. Indikator KPI table
        if (indDb !== undefined && indDb !== null) {
          successCount++;
          if (indDb.length > 0) {
            nextState.indikatorList = indDb;
            setStored('sipak_indikator', indDb);
          } else {
            const currentInd = get().indikatorList;
            for (const i of currentInd) {
              await dbUpsertIndikator(i);
            }
          }
        } else if (indDb === undefined) {
          failCount++;
        }

        // 3. Capaian Indikator table
        if (capDb !== undefined && capDb !== null) {
          successCount++;
          if (capDb.length > 0) {
            nextState.capaianList = capDb;
            setStored('sipak_capaian', capDb);
          } else {
            const currentCap = get().capaianList;
            if (currentCap.length > 0) {
              for (const c of currentCap) {
                await dbUpsertCapaian(c);
              }
            }
          }
        } else if (capDb === undefined) {
          failCount++;
        }

        // 4. Supervisi table
        if (supDb !== undefined && supDb !== null) {
          successCount++;
          if (supDb.length > 0) {
            nextState.supervisiList = supDb;
            setStored('sipak_supervisi', supDb);
          } else {
            const currentSup = get().supervisiList;
            if (currentSup.length > 0) {
              for (const s of currentSup) {
                await dbUpsertSupervisi(s);
              }
            }
          }
        } else if (supDb === undefined) {
          failCount++;
        }

        // 5. Pengaturan table
        if (pengDb !== undefined) {
          successCount++;
          if (pengDb !== null) {
            nextState.pengaturan = pengDb;
            setStored('sipak_pengaturan', pengDb);
          } else {
            await dbUpsertPengaturan(get().pengaturan);
          }
        } else if (pengDb === undefined) {
          failCount++;
        }

        // 6. Activity Logs table
        if (logsDb !== undefined && logsDb !== null) {
          successCount++;
          if (logsDb.length > 0) {
            nextState.activityLogs = logsDb;
            setStored('sipak_logs', logsDb);
          } else {
            const currentLogs = get().activityLogs;
            if (currentLogs.length > 0) {
              for (const l of currentLogs) {
                await dbAddActivityLog(l);
              }
            }
          }
        } else if (logsDb === undefined) {
          failCount++;
        }

        // Only mark connected if we had no query failures and successfully fetched at least one table
        if (failCount > 0 || successCount === 0) {
          console.warn(`Supabase sync completed but some tables are missing/query failed. Success: ${successCount}, Failed: ${failCount}. Local storage will be used.`);
          set({ isDbConnected: false });
        } else {
          set({ ...nextState, isDbConnected: true });
        }
      } catch (err) {
        console.log('Supabase Sync status: completed with local backup active');
        set({ isDbConnected: false });
      } finally {
        set({ isSyncing: false });
      }
    },

    addToQueue: (table, action, data) => {
      const op: PendingOperation = {
        id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        table,
        action,
        data,
        timestamp: Date.now()
      };
      const nextQueue = [...get().pendingQueue, op];
      set({ pendingQueue: nextQueue, isDbConnected: false });
      setStored('sipak_pending_queue', nextQueue);
    },

    processPendingQueue: async () => {
      if (!isSupabaseConfigured() || !get().isOnline || !isSupabaseReachableCached()) {
        return;
      }
      
      const queue = [...get().pendingQueue];
      if (queue.length === 0) {
        return;
      }

      console.log(`Processing ${queue.length} pending offline operations...`);

      for (const op of queue) {
        let success = false;
        try {
          if (op.table === 'users') {
            if (op.action === 'insert' || op.action === 'update') {
              success = await dbUpsertUser(op.data);
            } else if (op.action === 'delete') {
              success = await dbDeleteUser(op.data);
            }
          } else if (op.table === 'indikator') {
            if (op.action === 'insert' || op.action === 'update') {
              success = await dbUpsertIndikator(op.data);
            } else if (op.action === 'delete') {
              success = await dbDeleteIndikator(op.data);
            }
          } else if (op.table === 'capaian_indikator') {
            if (op.action === 'insert' || op.action === 'update') {
              success = await dbUpsertCapaian(op.data);
            } else if (op.action === 'delete') {
              success = await dbDeleteCapaian(op.data);
            }
          } else if (op.table === 'supervisi') {
            if (op.action === 'insert' || op.action === 'update') {
              success = await dbUpsertSupervisi(op.data);
            } else if (op.action === 'delete') {
              success = await dbDeleteSupervisi(op.data);
            }
          } else if (op.table === 'pengaturan') {
            if (op.action === 'insert' || op.action === 'update') {
              success = await dbUpsertPengaturan(op.data);
            }
          } else if (op.table === 'activity_logs') {
            if (op.action === 'insert') {
              success = await dbAddActivityLog(op.data);
            }
          }
        } catch (e) {
          console.warn("Could not process queue item:", op.table, op.action, e);
        }

        if (success) {
          const nextQueue = get().pendingQueue.filter(o => o.id !== op.id);
          set({ pendingQueue: nextQueue });
          setStored('sipak_pending_queue', nextQueue);
        } else {
          break;
        }
      }

      if (get().pendingQueue.length === 0 && isSupabaseReachableCached()) {
        set({ isDbConnected: true });
      }
    },

    setupRealtimeSubscription: () => {
      if (!isSupabaseConfigured() || !isSupabaseReachableCached()) return;
      
      const channel = supabase
        .channel('public-db-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
          },
          (payload: any) => {
            console.log('Realtime change received:', payload);
            const { table, eventType, new: newRow, old: oldRow } = payload;
            
            if (table === 'users') {
              const currentList = get().users;
              if (eventType === 'INSERT') {
                if (!currentList.some(u => u.id === newRow.id)) {
                  set({ users: [...currentList, newRow as User] });
                }
              } else if (eventType === 'UPDATE') {
                set({
                  users: currentList.map(u => u.id === newRow.id ? (newRow as User) : u)
                });
                const currentU = get().currentUser;
                if (currentU && currentU.id === newRow.id) {
                  set({ currentUser: newRow as User });
                  setStored('sipak_currentUser', newRow);
                }
              } else if (eventType === 'DELETE') {
                set({
                  users: currentList.filter(u => u.id !== oldRow.id)
                });
              }
            }
            
            else if (table === 'indikator') {
              const currentList = get().indikatorList;
              if (eventType === 'INSERT') {
                if (!currentList.some(i => i.id === newRow.id)) {
                  set({ indikatorList: [...currentList, newRow as Indikator] });
                }
              } else if (eventType === 'UPDATE') {
                set({
                  indikatorList: currentList.map(i => i.id === newRow.id ? (newRow as Indikator) : i)
                });
              } else if (eventType === 'DELETE') {
                set({
                  indikatorList: currentList.filter(i => i.id !== oldRow.id)
                });
              }
            }
            
            else if (table === 'capaian_indikator') {
              const currentList = get().capaianList;
              if (eventType === 'INSERT') {
                if (!currentList.some(c => c.id === newRow.id)) {
                  set({ capaianList: [...currentList, newRow as Capaian] });
                }
              } else if (eventType === 'UPDATE') {
                set({
                  capaianList: currentList.map(c => c.id === newRow.id ? (newRow as Capaian) : c)
                });
              } else if (eventType === 'DELETE') {
                set({
                  capaianList: currentList.filter(c => c.id !== oldRow.id)
                });
              }
            }
            
            else if (table === 'supervisi') {
              const currentList = get().supervisiList;
              if (eventType === 'INSERT') {
                if (!currentList.some(s => s.id === newRow.id)) {
                  set({ supervisiList: [...currentList, newRow as Supervisi] });
                }
              } else if (eventType === 'UPDATE') {
                set({
                  supervisiList: currentList.map(s => s.id === newRow.id ? (newRow as Supervisi) : s)
                });
              } else if (eventType === 'DELETE') {
                set({
                  supervisiList: currentList.filter(s => s.id !== oldRow.id)
                });
              }
            }
            
            else if (table === 'pengaturan') {
              if (eventType === 'INSERT' || eventType === 'UPDATE') {
                set({ pengaturan: newRow as Pengaturan });
              }
            }
            
            else if (table === 'activity_logs') {
              const currentList = get().activityLogs;
              if (eventType === 'INSERT') {
                if (!currentList.some(l => l.id === newRow.id)) {
                  set({ activityLogs: [newRow as ActivityLog, ...currentList].slice(0, 200) });
                }
              }
            }
          }
        )
        .subscribe();
    },

    setCurrentUser: (user) => {
      set({ currentUser: user });
      setStored('sipak_currentUser', user);
      if (user) {
        get().addLog(`User switched session to: ${user.nama} (${user.role})`);
      }
    },

    addUser: (user) => {
      const updated = [...get().users, user];
      set({ users: updated });
      setStored('sipak_users', updated);
      get().addLog(`Menambahkan user baru: ${user.nama} dengan role ${user.role}`);
      
      dbUpsertUser(user).then((success) => {
        if (!success) get().addToQueue('users', 'insert', user);
      }).catch(() => {
        get().addToQueue('users', 'insert', user);
      });
    },

    updateUser: (id, updated) => {
      const updatedList = get().users.map(u => u.id === id ? { ...u, ...updated } : u);
      set({ users: updatedList });
      setStored('sipak_users', updatedList);
      
      // If updating current user, refresh currentUser as well
      const current = get().currentUser;
      if (current && current.id === id) {
        const nextCurrent = { ...current, ...updated };
        set({ currentUser: nextCurrent });
        setStored('sipak_currentUser', nextCurrent);
      }

      get().addLog(`Mengubah informasi user ID: ${id}`);
      const userToUpsert = updatedList.find(u => u.id === id);
      if (userToUpsert) {
        dbUpsertUser(userToUpsert).then((success) => {
          if (!success) get().addToQueue('users', 'update', userToUpsert);
        }).catch(() => {
          get().addToQueue('users', 'update', userToUpsert);
        });
      }
    },

    deleteUser: (id) => {
      const updated = get().users.filter(u => u.id !== id);
      set({ users: updated });
      setStored('sipak_users', updated);
      get().addLog(`Menghapus user ID: ${id}`);
      
      dbDeleteUser(id).then((success) => {
        if (!success) get().addToQueue('users', 'delete', id);
      }).catch(() => {
        get().addToQueue('users', 'delete', id);
      });
    },

    addIndikator: (ind) => {
      const newInd: Indikator = {
        ...ind,
        id: `ind-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      const updated = [...get().indikatorList, newInd];
      set({ indikatorList: updated });
      setStored('sipak_indikator', updated);
      get().addLog(`Menambahkan indikator KPI baru: ${newInd.kode} - ${newInd.nama}`);
      
      dbUpsertIndikator(newInd).then((success) => {
        if (!success) get().addToQueue('indikator', 'insert', newInd);
      }).catch(() => {
        get().addToQueue('indikator', 'insert', newInd);
      });
    },

    updateIndikator: (id, updated) => {
      const updatedList = get().indikatorList.map(ind => ind.id === id ? { ...ind, ...updated } : ind);
      set({ indikatorList: updatedList });
      setStored('sipak_indikator', updatedList);
      get().addLog(`Mengubah indikator KPI ID: ${id}`);
      const indToUpsert = updatedList.find(ind => ind.id === id);
      if (indToUpsert) {
        dbUpsertIndikator(indToUpsert).then((success) => {
          if (!success) get().addToQueue('indikator', 'update', indToUpsert);
        }).catch(() => {
          get().addToQueue('indikator', 'update', indToUpsert);
        });
      }
    },

    deleteIndikator: (id) => {
      const updated = get().indikatorList.filter(ind => ind.id !== id);
      set({ indikatorList: updated });
      setStored('sipak_indikator', updated);
      get().addLog(`Menghapus indikator KPI ID: ${id}`);
      
      dbDeleteIndikator(id).then((success) => {
        if (!success) get().addToQueue('indikator', 'delete', id);
      }).catch(() => {
        get().addToQueue('indikator', 'delete', id);
      });
    },

    addCapaian: (cap) => {
      const ind = get().indikatorList.find(i => i.id === cap.indikator_id);
      const rounded = calculateCapaianValue(cap.numerator, cap.denominator, ind);
      const status = determineStatus(rounded, cap.target, ind?.arah_target, ind ? getJenisPengukuran(ind) : undefined);
      
      const existingIndex = get().capaianList.findIndex(
        c => c.indikator_id === cap.indikator_id && c.bulan === cap.bulan && c.tahun === cap.tahun
      );

      let updated: Capaian[];
      let entryToSave: Capaian;

      if (existingIndex >= 0) {
        const existing = get().capaianList[existingIndex];
        entryToSave = {
          ...existing,
          ...cap,
          capaian: rounded,
          status,
          nilai: cap.nilai !== undefined ? cap.nilai : (status === 'Tercapai' ? 3 : status === 'Mendekati Target' ? 2 : 1),
          created_at: new Date().toISOString()
        };
        updated = [...get().capaianList];
        updated[existingIndex] = entryToSave;
      } else {
        entryToSave = {
          ...cap,
          id: `cap-${Date.now()}`,
          capaian: rounded,
          status,
          nilai: cap.nilai !== undefined ? cap.nilai : (status === 'Tercapai' ? 3 : status === 'Mendekati Target' ? 2 : 1),
          created_at: new Date().toISOString()
        };
        updated = [...get().capaianList, entryToSave];
      }
      
      set({ capaianList: updated });
      setStored('sipak_capaian', updated);
      get().addLog(`Menginput/memperbarui capaian KPI untuk indikator ID: ${cap.indikator_id} (Realisasi: ${rounded}${ind?.satuan || '%'})`);
      
      dbUpsertCapaian(entryToSave).then((success) => {
        if (!success) get().addToQueue('capaian_indikator', existingIndex >= 0 ? 'update' : 'insert', entryToSave);
      }).catch(() => {
        get().addToQueue('capaian_indikator', existingIndex >= 0 ? 'update' : 'insert', entryToSave);
      });
    },

    updateCapaian: (id, updated) => {
      let matchedCap: Capaian | null = null;
      const updatedList = get().capaianList.map(cap => {
        if (cap.id === id) {
          const merged = { ...cap, ...updated };
          const ind = get().indikatorList.find(i => i.id === merged.indikator_id);
          // Re-calculate
          merged.capaian = calculateCapaianValue(merged.numerator, merged.denominator, ind);
          merged.status = determineStatus(merged.capaian, merged.target, ind?.arah_target, ind ? getJenisPengukuran(ind) : undefined);
          if (updated.nilai === undefined) {
            // Keep existing merged.nilai or recalculate if none exists
            if (merged.nilai === undefined) {
              merged.nilai = merged.status === 'Tercapai' ? 3 : merged.status === 'Mendekati Target' ? 2 : 1;
            }
          } else {
            merged.nilai = updated.nilai;
          }
          matchedCap = merged;
          return merged;
        }
        return cap;
      });
      set({ capaianList: updatedList });
      setStored('sipak_capaian', updatedList);
      get().addLog(`Mengubah capaian KPI ID: ${id}`);
      if (matchedCap) {
        const capToUpsert = matchedCap as Capaian;
        dbUpsertCapaian(capToUpsert).then((success) => {
          if (!success) get().addToQueue('capaian_indikator', 'update', capToUpsert);
        }).catch(() => {
          get().addToQueue('capaian_indikator', 'update', capToUpsert);
        });
      }
    },

    deleteCapaian: (id) => {
      const updated = get().capaianList.filter(cap => cap.id !== id);
      set({ capaianList: updated });
      setStored('sipak_capaian', updated);
      get().addLog(`Menghapus capaian KPI ID: ${id}`);
      
      dbDeleteCapaian(id).then((success) => {
        if (!success) get().addToQueue('capaian_indikator', 'delete', id);
      }).catch(() => {
        get().addToQueue('capaian_indikator', 'delete', id);
      });
    },

    addSupervisi: (sup) => {
      const newSup: Supervisi = {
        ...sup,
        id: `sup-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      const updated = [...get().supervisiList, newSup];
      set({ supervisiList: updated });
      setStored('sipak_supervisi', updated);
      get().addLog(`Menambahkan laporan supervisi unit: ${sup.unit}`);
      
      dbUpsertSupervisi(newSup).then((success) => {
        if (!success) get().addToQueue('supervisi', 'insert', newSup);
      }).catch(() => {
        get().addToQueue('supervisi', 'insert', newSup);
      });
    },

    updateSupervisi: (id, updated) => {
      const updatedList = get().supervisiList.map(sup => sup.id === id ? { ...sup, ...updated } : sup);
      set({ supervisiList: updatedList });
      setStored('sipak_supervisi', updatedList);
      get().addLog(`Mengubah laporan supervisi ID: ${id} (Status: ${updated.status || 'No Change'})`);
      const supToUpsert = updatedList.find(sup => sup.id === id);
      if (supToUpsert) {
        dbUpsertSupervisi(supToUpsert).then((success) => {
          if (!success) get().addToQueue('supervisi', 'update', supToUpsert);
        }).catch(() => {
          get().addToQueue('supervisi', 'update', supToUpsert);
        });
      }
    },

    deleteSupervisi: (id) => {
      const updated = get().supervisiList.filter(sup => sup.id !== id);
      set({ supervisiList: updated });
      setStored('sipak_supervisi', updated);
      get().addLog(`Menghapus laporan supervisi ID: ${id}`);
      
      dbDeleteSupervisi(id).then((success) => {
        if (!success) get().addToQueue('supervisi', 'delete', id);
      }).catch(() => {
        get().addToQueue('supervisi', 'delete', id);
      });
    },

    updatePengaturan: (updated) => {
      const next = { ...get().pengaturan, ...updated };
      set({ pengaturan: next });
      setStored('sipak_pengaturan', next);
      get().addLog(`Memperbarui konfigurasi sistem SIPAKAR.`);
      
      dbUpsertPengaturan(next).then((success) => {
        if (!success) get().addToQueue('pengaturan', 'update', next);
      }).catch(() => {
        get().addToQueue('pengaturan', 'update', next);
      });
    },

    addLog: (aktivitas) => {
      const activeUser = get().currentUser;
      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user_nama: activeUser?.nama || 'System',
        user_role: activeUser?.role || 'System',
        aktivitas
      };
      const updated = [newLog, ...get().activityLogs].slice(0, 200); // Limit logs
      set({ activityLogs: updated });
      setStored('sipak_logs', updated);
      
      dbAddActivityLog(newLog).then((success) => {
        if (!success) get().addToQueue('activity_logs', 'insert', newLog);
      }).catch(() => {
        get().addToQueue('activity_logs', 'insert', newLog);
      });
    },

    clearAllData: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sipak_currentUser');
        localStorage.removeItem('sipak_users');
        localStorage.removeItem('sipak_indikator');
        localStorage.removeItem('sipak_capaian');
        localStorage.removeItem('sipak_supervisi');
        localStorage.removeItem('sipak_pengaturan');
        localStorage.removeItem('sipak_logs');
        localStorage.removeItem('sipak_migration_done');
        localStorage.removeItem('sipak_pending_queue');
      }
      set({
        currentUser: defaultUsers[0],
        users: defaultUsers,
        indikatorList: defaultIndikator,
        capaianList: defaultCapaian,
        supervisiList: defaultSupervisi,
        pengaturan: defaultPengaturan,
        activityLogs: defaultLogs,
        pendingQueue: []
      });
      get().addLog(`Reset data sistem ke kondisi awal (seed data).`);
    }
  };
});
