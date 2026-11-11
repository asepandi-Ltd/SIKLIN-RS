import { AnnualUnitProgramTable } from './annualReportTypes';
import { normalizeUnit } from './units';

export function getDefaultProgramTableForUnit(reportId: string, unitId: string): AnnualUnitProgramTable {
  const norm = normalizeUnit(unitId);
  const uId = norm ? norm.id : unitId;
  const uName = norm ? norm.name : unitId;

  const baseCols = [
    { key: 'c1', label: 'No', type: 'number' as const, width: 60, align: 'center' as const },
    { key: 'c2', label: 'Program Kerja', type: 'text' as const, width: 220, align: 'left' as const },
    { key: 'c3', label: 'Kegiatan Operasional', type: 'text' as const, width: 260, align: 'left' as const },
    { key: 'c4', label: 'Target / Sasaran', type: 'text' as const, width: 140, align: 'left' as const },
    { key: 'c5', label: 'Realisasi Capaian', type: 'text' as const, width: 140, align: 'left' as const },
    { key: 'c6', label: 'Keterangan / Evaluasi', type: 'text' as const, width: 180, align: 'left' as const }
  ];

  let title = `Program dan Kegiatan Pelayanan ${uName}`;
  let rows: Record<string, any>[] = [];

  switch (uId) {
    case 'laboratorium':
      title = 'Program dan Kegiatan Pelayanan Laboratorium';
      rows = [
        {
          c1: 1,
          c2: 'Pemantapan Mutu Internal (PMI)',
          c3: 'Pemeriksaan kontrol harian reagen hematologi dan kimia darah sebelum pelayanan',
          c4: '100% setiap hari',
          c5: 'Terlaksana 100%',
          c6: 'Tercatat lengkap pada logbook harian mutu'
        },
        {
          c1: 2,
          c2: 'Pemantapan Mutu Eksternal (PME)',
          c3: 'Mengikuti siklus PME nasional Kemenkes dan PDS PatKLIn',
          c4: '2 Siklus / tahun',
          c5: '2 Siklus terevaluasi',
          c6: 'Hasil sertifikat evaluasi memuaskan'
        },
        {
          c1: 3,
          c2: 'Pelayanan Darurat (Cito)',
          c3: 'Optimalisasi waktu tunggu hasil pemeriksaan lab darurat < 140 menit',
          c4: 'Target 100%',
          c5: 'Realisasi 99.4%',
          c6: 'Reagen cito selalu tersedia cadangan'
        },
        {
          c1: 4,
          c2: 'Peningkatan Keselamatan Pasien',
          c3: 'Pelaporan nilai kritis (critical value) laboratorium < 15 menit ke dokter DPJP',
          c4: 'Target 100%',
          c5: '100% terlaporkan',
          c6: 'Terdokumentasi dalam buku ekspedisi & SIMRS'
        }
      ];
      break;

    case 'radiologi':
      title = 'Program dan Kegiatan Pelayanan Radiologi';
      rows = [
        {
          c1: 1,
          c2: 'Proteksi Radiasi & K3',
          c3: 'Pemantauan dosis radiasi petugas dengan TLD badge dan kepatuhan APD timbal (apron)',
          c4: '100% petugas patuh',
          c5: 'Kepatuhan 100%',
          c6: 'Dosis radiasi di bawah Nilai Batas Dosis (NBD)'
        },
        {
          c1: 2,
          c2: 'Kalibrasi dan Uji Kesesuaian',
          c3: 'Uji kesesuaian berkas radiasi pesawat rontgen oleh BPFK berizin BAPETEN',
          c4: '1 Kali / tahun',
          c5: '1 Kali terlaksana',
          c6: 'Pesawat rontgen laik pakai bersertifikat'
        },
        {
          c1: 3,
          c2: 'Kecepatan Hasil Ekspertise',
          c3: 'Waktu tunggu hasil foto rontgen thoraks cito rawat jalan dan IGD < 3 jam',
          c4: 'Target 90%',
          c5: 'Realisasi 92.5%',
          c6: 'Kerja sama teleradiologi berjalan lancar'
        }
      ];
      break;

    case 'farmasi':
      title = 'Program dan Kegiatan Pelayanan Farmasi';
      rows = [
        {
          c1: 1,
          c2: 'Pengelolaan Perbekalan Farmasi',
          c3: 'Penyusunan Formularium RS, pengadaan obat e-katalog, dan stok opname bulanan',
          c4: 'Ketersediaan obat 98%',
          c5: 'Realisasi 97.8%',
          c6: 'Stok obat esensial dan emergency aman'
        },
        {
          c1: 2,
          c2: 'Waktu Tunggu Resep',
          c3: 'Pelayanan resep obat jadi < 30 menit dan resep racikan < 60 menit',
          c4: 'Target 90%',
          c5: 'Realisasi 91.2%',
          c6: 'Penerapan antrean elektronik farmasi'
        },
        {
          c1: 3,
          c2: 'Pelayanan Farmasi Klinik',
          c3: 'Pengkajian resep, penelusuran riwayat penggunaan obat, dan konseling pasien pulang',
          c4: '100% pasien kronis',
          c5: 'Terlaksana rutin',
          c6: 'Terdokumentasi pada formulir CPPT'
        }
      ];
      break;

    case 'gizi':
      title = 'Program dan Kegiatan Pelayanan Gizi';
      rows = [
        {
          c1: 1,
          c2: 'Penyelenggaraan Makanan Pasien',
          c3: 'Penyajian dan distribusi makanan pasien rawat inap tepat waktu sesuai standar diet',
          c4: 'Target 100%',
          c5: 'Realisasi 99.6%',
          c6: 'Ketepatan jadwal makan pagi, siang, dan sore'
        },
        {
          c1: 2,
          c2: 'Higienitas & Keamanan Pangan',
          c3: 'Pemeriksaan uji usap alat makan dan bahan makanan di dapur gizi',
          c4: '2 Kali / tahun',
          c5: '2 Kali terlaksana',
          c6: 'Bebas kontaminasi bakteri patogen'
        },
        {
          c1: 3,
          c2: 'Asuhan Gizi Terstandar (PAGT)',
          c3: 'Skrining gizi pasien baru < 24 jam dan intervensi gizi klinis',
          c4: '100% pasien rawat',
          c5: '100% terskrining',
          c6: 'Asuhan gizi terintegrasi rekam medis'
        }
      ];
      break;

    case 'rekam-medis':
      title = 'Program dan Kegiatan Unit Rekam Medis';
      rows = [
        {
          c1: 1,
          c2: 'Penyelenggaraan Rekam Medis Elektronik (RME)',
          c3: 'Pemantauan kelengkapan pengisian data RME oleh dokter dan nakes < 24 jam',
          c4: 'Target 95%',
          c5: 'Realisasi 94.2%',
          c6: 'Sosialisasi pengisian resume medis teratur'
        },
        {
          c1: 2,
          c2: 'Koding Diagnosa & Prosedur',
          c3: 'Pengodean penyakit ICD-10 dan tindakan ICD-9-CM untuk klaim BPJS',
          c4: 'Target 95%',
          c5: 'Realisasi 97.0%',
          c6: 'Tingkat dispute klaim BPJS sangat rendah'
        },
        {
          c1: 3,
          c2: 'Penyimpanan & Pelepasan Informasi',
          c3: 'Pengelolaan arsip berkas inaktif dan retensi rekam medis sesuai permenkes',
          c4: '100% tertib arsip',
          c5: 'Terlaksana bertahap',
          c6: 'Digitalisasi berkas inaktif berjalan'
        }
      ];
      break;

    case 'itrs':
      title = 'Program dan Kegiatan IT Rumah Sakit / ITRS';
      rows = [
        {
          c1: 1,
          c2: 'Keandalan Server & SIMRS',
          c3: 'Monitoring server uptime, backup database harian, dan keamanan jaringan lokal (LAN/WLAN)',
          c4: 'Target 99% uptime',
          c5: 'Realisasi 99.8%',
          c6: 'Server beroperasi stabil tanpa downtime berarti'
        },
        {
          c1: 2,
          c2: 'Bridging SATUSEHAT & BPJS',
          c3: 'Integrasi data resume medis elektronik ke platform SATUSEHAT Kemenkes RI dan VClaim BPJS',
          c4: '100% modul terhubung',
          c5: '100% bridging aktif',
          c6: 'Sinkronisasi data pasien berjalan lancar'
        },
        {
          c1: 3,
          c2: 'Response Time Helpdesk IT',
          c3: 'Penanganan keluhan gangguan SIMRS, PC, dan printer di unit pelayanan < 15 menit',
          c4: 'Target 95%',
          c5: 'Realisasi 96.5%',
          c6: 'Dukungan teknis responsif 24 jam'
        }
      ];
      break;

    case 'ipsrs':
      title = 'Program Pemeliharaan Sarana dan Alat Medis (IPSRS)';
      rows = [
        {
          c1: 1,
          c2: 'Pemeliharaan Preventif Alat Medis',
          c3: 'Pemeriksaan berkala fungsi alat elektromedik dan pengisian kartu pemeliharaan',
          c4: 'Target 95% alat',
          c5: 'Realisasi 94.2%',
          c6: 'Jadwal pemeliharaan terlaksana tertib'
        },
        {
          c1: 2,
          c2: 'Kecepatan Respon Perbaikan',
          c3: 'Perbaikan alat medis kerusakan ringan selesai < 24 jam',
          c4: 'Target 90%',
          c5: 'Realisasi 91.8%',
          c6: 'Ketersediaan suku cadang fast-moving memadai'
        },
        {
          c1: 3,
          c2: 'Pemeliharaan Genset & Kelistrikan',
          c3: 'Uji fungsi genset darurat dan pemantauan panel listrik utama rumah sakit',
          c4: '100% siap pakai',
          c5: 'Teruji mingguan',
          c6: 'Pasokan listrik darurat terjamin aman'
        }
      ];
      break;

    case 'cssd-laundry':
      title = 'Program Sterilisasi dan Pengelolaan Linen (CSSD & Laundry)';
      rows = [
        {
          c1: 1,
          c2: 'Pengelolaan Linen Bersih Bebas Noda',
          c3: 'Pencucian, pengeringan, pelipatan, dan distribusi linen ruang rawat inap',
          c4: 'Target 98%',
          c5: 'Realisasi 98.4%',
          c6: 'Mesin cuci dan mesin pengering beroperasi baik'
        },
        {
          c1: 2,
          c2: 'Sterilisasi Instrumen Medis',
          c3: 'Sterilisasi instrumen operasi autoclave dengan kontrol indikator biologi dan kimia',
          c4: '100% instrumen steril',
          c5: '100% steril',
          c6: 'Instrumen operasi aman dan siap pakai'
        },
        {
          c1: 3,
          c2: 'Pemantauan Kebocoran & Noda Linen',
          c3: 'Sortir linen rusak atau sobek serta penanganan linen infeksius sesuai SOP PPI',
          c4: '100% sesuai standar',
          c5: 'Terlaksana 100%',
          c6: 'Alur linen kotor dan bersih terpisah ketat'
        }
      ];
      break;

    case 'humas-pemasaran':
      title = 'Program Kehumasan, Kemitraan dan Pemasaran';
      rows = [
        {
          c1: 1,
          c2: 'Pengelolaan Pengaduan Pelanggan',
          c3: 'Penerimaan, pencatatan, dan respon cepat keluhan pasien < 24 jam',
          c4: '100% aduan terespon',
          c5: '100% selesai ditangani',
          c6: 'Saluran WA aduan dan kotak saran dimonitor aktif'
        },
        {
          c1: 2,
          c2: 'Publikasi dan Edukasi Kesehatan',
          c3: 'Pembuatan konten edukasi dokter spesialis pada media sosial dan website RSUD Al-Mulk',
          c4: 'Minimal 4 konten/bulan',
          c5: '52 Konten / tahun',
          c6: 'Interaksi publik dan jangkauan medsos meningkat'
        },
        {
          c1: 3,
          c2: 'Survei Kepuasan Pasien (SKM & BPJS)',
          c3: 'Pelaksanaan survei kepuasan masyarakat dan pemantauan rating Google Review & KESSAN BPJS',
          c4: 'Target kepuasan > 85%',
          c5: 'Realisasi 89.2%',
          c6: 'Predikat mutu pelayanan sangat baik'
        }
      ];
      break;

    case 'kesling':
      title = 'Program Kesehatan Lingkungan dan Sanitasi RS';
      rows = [
        {
          c1: 1,
          c2: 'Pengelolaan Air Limbah (IPAL)',
          c3: 'Monitoring operasional IPAL harian dan uji baku mutu air limbah cair di lab terakreditasi',
          c4: 'Target 100% hari baku',
          c5: 'Realisasi 98.6%',
          c6: 'Parameter BOD, COD, dan TSS memenuhi baku mutu'
        },
        {
          c1: 2,
          c2: 'Pengelolaan Limbah Medis B3',
          c3: 'Pewadahan, penimbangan, penyimpanan di TPS B3 berizin, dan pengangkutan transporter berizin',
          c4: '100% limbah terkelola',
          c5: '100% tertib manifes',
          c6: 'Manifes elektronik festronik KemenLH tertib'
        },
        {
          c1: 3,
          c2: 'Pengendalian Vektor dan Kualitas Air Bersih',
          c3: 'Pemberantasan sarang nyamuk, pest control berkala, dan uji mikrobiologi air bersih',
          c4: 'Air bersih 100% laik',
          c5: 'Terlaksana berkala',
          c6: 'Hasil uji lab air bersih memenuhi standar permenkes'
        }
      ];
      break;

    case 'mutu':
      title = 'Program Pengendalian Mutu dan Akreditasi';
      rows = [
        {
          c1: 1,
          c2: 'Pengumpulan & Validasi Data KPI Mutu',
          c3: 'Rekapitulasi, verifikasi eviden, dan analisis bulanan indikator mutu 11 unit penunjang',
          c4: '100% unit melapor',
          c5: '100% data tervalidasi',
          c6: 'Platform SIPAKAR digunakan optimal'
        },
        {
          c1: 2,
          c2: 'Ronde Mutu & Keselamatan Pasien',
          c3: 'Inspeksi supervisi langsung kepatuhan SOP dan identifikasi potensi risiko klinis/non-klinis',
          c4: '4 Ronde / tahun',
          c5: '4 Ronde terlaksana',
          c6: 'Temuan supervisi ditindaklanjuti tuntas'
        },
        {
          c1: 3,
          c2: 'Pelaporan Insiden Keselamatan Pasien (IKP)',
          c3: 'Grading matriks risiko dan investigasi sederhana atau RCA terhadap insiden IKP',
          c4: '100% insiden terevaluasi',
          c5: 'Terlaksana 100%',
          c6: 'Laporan triwulanan disampaikan ke Komite Mutu'
        }
      ];
      break;

    default:
      rows = [
        {
          c1: 1,
          c2: 'Peningkatan Mutu Pelayanan',
          c3: 'Monitoring operasional rutin unit',
          c4: '100% terlaksana',
          c5: '100% tercapai',
          c6: 'Sesuai jadwal kerja'
        }
      ];
      break;
  }

  return {
    id: `tbl-${reportId}-${uId}-1`,
    report_id: reportId,
    unit_id: uId,
    table_title: title,
    columns_definition: baseCols,
    rows_data: rows,
    analisa: 'Secara umum seluruh program kerja dan kegiatan operasional unit telah terlaksana dengan baik sesuai dengan target mutu dan standar pelayanan RSUD Al-Mulk.',
    rekomendasi: 'Mempertahankan konsistensi pelaksanaan SOP, optimalisasi koordinasi lintas unit penunjang, serta penguatan sarana prasarana pendukung.',
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
