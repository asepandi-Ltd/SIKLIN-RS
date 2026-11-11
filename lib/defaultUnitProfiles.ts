import {
  AnnualUnitProfile,
  AnnualUnitStaffing,
  AnnualUnitAuthority,
  AnnualUnitObstacle,
  AnnualUnitPlan
} from './annualReportTypes';
import { normalizeUnit } from './units';

export function getDefaultUnitProfile(reportId: string, unitId: string): AnnualUnitProfile {
  const norm = normalizeUnit(unitId);
  const uId = norm ? norm.id : unitId;
  const uName = norm ? norm.name : unitId;

  const base: AnnualUnitProfile = {
    id: `uprof-${reportId}-${uId}`,
    report_id: reportId,
    unit_id: uId,
    unit_name: uName,
    unit_overview: '',
    background: '',
    main_duties: '',
    service_scope: '',
    service_types: '',
    operating_hours: '24 Jam (Shift) / Hari Kerja (08.00 - 16.00 WIB)',
    facilities: '',
    other_information: 'Melaksanakan pelaporan capaian indikator mutu bulanan secara periodik pada aplikasi SIPAKAR.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  switch (uId) {
    case 'laboratorium':
      base.unit_overview = 'Unit Laboratorium RSUD Al-Mulk menyelenggarakan pelayanan laboratorium diagnostik klinik untuk menunjang penegakan diagnosis penyakit, pemantauan pengobatan, serta evaluasi status klinis pasien rawat jalan, rawat inap, dan IGD.';
      base.background = 'Pelayanan laboratorium mengutamakan mutu, presisi, dan kecepatan hasil pemeriksaan dengan menerapkan Pemantapan Mutu Internal (PMI) harian dan Pemantapan Mutu Eksternal (PME) berkala.';
      base.main_duties = '1. Menyelenggarakan pemeriksaan hematologi, kimia klinik, imunoserologi, urin, feses, dan mikrobiologi rutin.\n2. Melayani pemeriksaan darurat (cito) 24 jam untuk IGD dan rawat inap.\n3. Melaporkan hasil nilai kritis (critical value) secara tepat waktu kepada dokter penanggung jawab pelayanan (DPJP).\n4. Memelihara reagen, peralatan analizer, dan kalibrasi alat laboratorium.';
      base.service_scope = 'Melayani pasien Rawat Jalan, Rawat Inap, Instalasi Gawat Darurat (IGD), Medical Check-Up (MCU), dan rujukan puskesmas se-Kota Sukabumi.';
      base.service_types = 'Hematologi Lengkap, Kimia Darah (Gula, Kolesterol, Asam Urat, Fungsi Hati, Fungsi Ginjal), Serologi, Tes Cepat Molekuler (TCM), Urinalisa, Feses Rutin, Tes Narkoba.';
      base.operating_hours = '24 Jam Penuh (3 Shift: Pagi, Sore, Malam)';
      base.facilities = 'Hematology Analyzer otomatis, Clinical Chemistry Analyzer, Centrifuge, Mikroskop Binokuler, Refrigerator penyimpanan reagen digital, ruang sampling darah, dan sistem barcode SIMRS.';
      break;

    case 'radiologi':
      base.unit_overview = 'Unit Radiologi RSUD Al-Mulk menyelenggarakan pelayanan pencitraan diagnostik medis (radiodiagnostik) menggunakan radiasi pengion dengan menerapkan prinsip keselamatan dan proteksi radiasi (ALARA).';
      base.background = 'Sebagai fasilitas penunjang medis rujukan, instalasi radiologi didukung oleh peralatan pesawat rontgen modern yang telah memenuhi standar uji kesesuaian berkala BAPETEN dan BPFK.';
      base.main_duties = '1. Melaksanakan pemeriksaan radiografi konvensional sesuai indikasi klinis dokter.\n2. Melaksanakan proteksi radiasi bagi pasien, petugas, dan lingkungan sekitar.\n3. Mengirimkan citra digital untuk ekspertise dokter spesialis radiologi via teleradiologi.\n4. Memelihara apron timbal, TLD badge, dan kalibrasi pesawat rontgen.';
      base.service_scope = 'Pasien Instalasi Gawat Darurat, Rawat Inap, Rawat Jalan Spesialis, dan MCU RSUD Al-Mulk.';
      base.service_types = 'Foto Rontgen Thoraks (Paru/Jantung), Foto Ekstremitas (Tulang/Sendi), Foto Abdomen (BNO/Polos), Foto Tulang Belakang (Spine), Foto Kepala/Sinus.';
      base.operating_hours = '24 Jam Penuh (3 Shift Pelayanan)';
      base.facilities = 'Pesawat Rontgen Statis X-Ray, Computerized Radiography (CR) Scanner / Flat Panel Detector, Workstation teleradiologi, ruang kedap radiasi berpintu timbal Pb 2mm, dan apron pelindung.';
      break;

    case 'farmasi':
      base.unit_overview = 'Unit Farmasi RSUD Al-Mulk bertanggung jawab atas pengelolaan perbekalan farmasi rumah sakit (obat dan bahan medis habis pakai) serta penyelenggaraan pelayanan farmasi klinik berorientasi pada keselamatan pasien.';
      base.background = 'Pengelolaan obat mengacu pada Formularium Rumah Sakit dan Formularium Nasional guna menjamin ketersediaan obat yang bermutu, aman, dan rasional bagi masyarakat.';
      base.main_duties = '1. Melakukan perencanaan, pengadaan, penyimpanan, dan pendistribusian obat & BMHP.\n2. Melayani peresepan obat rawat jalan dan rawat inap dengan waktu tunggu terstandar.\n3. Melaksanakan pengkajian resep, rekonsiliasi obat, dan pemberian Pelayanan Informasi Obat (PIO).\n4. Mengelola penyimpanan obat high alert dan narkotika/psikotropika sesuai regulasi.';
      base.service_scope = 'Depo Farmasi Rawat Jalan, Depo Farmasi Rawat Inap & IGD 24 Jam, dan Gudang Logistik Farmasi Induk.';
      base.service_types = 'Dispensing resep obat jadi & racikan, penyiapan obat unit dose dispensing (UDD) rawat inap, konseling obat pasien pulang, pemantauan terapi obat.';
      base.operating_hours = '24 Jam (Depo IGD/Rawat Inap) dan 08.00 - 16.00 WIB (Depo Rawat Jalan)';
      base.facilities = 'Gudang farmasi berpendingin udara dan ber-thermohygrometer, lemari obat narkotika double lock, lemari pendingin 2-8°C, ruang peracikan obat steril, dan antrean farmasi SIMRS.';
      break;

    case 'gizi':
      base.unit_overview = 'Unit Gizi RSUD Al-Mulk menyelenggarakan pelayanan gizi rumah sakit yang mencakup pengadaan dan pengolahan makanan pasien rawat inap serta asuhan gizi klinis terstandar.';
      base.background = 'Makanan disajikan tidak hanya memenuhi selera dan ketepatan waktu, tetapi dirancang tepat diet sesuai kondisi patologis pasien untuk mempercepat masa penyembuhan.';
      base.main_duties = '1. Menyusun siklus menu makanan biasa dan makanan khusus (dietetik).\n2. Memasak dan mendistribusikan makanan pasien rawat inap 3 kali makan utama dan 2 kali selingan.\n3. Melakukan skrining dan asuhan gizi terstandar (PAGT) pada pasien rawat inap.\n4. Menyelenggarakan konseling gizi bagi pasien rawat jalan.';
      base.service_scope = 'Pasien seluruh ruang rawat inap dan klinik konsultasi gizi rawat jalan.';
      base.service_types = 'Penyelenggaraan makanan biasa, makanan lunak, makanan saring/cair, diet rendah garam, diet DM, diet rendah protein, diet enteral, konseling laktasi & gizi anak.';
      base.operating_hours = '05.30 - 19.30 WIB (Distribusi makanan) & 08.00 - 15.00 WIB (Konseling Gizi)';
      base.facilities = 'Dapur instalasi gizi berstandar higienis, troli makanan pemanas stainless, blender makanan enteral, timbangan digital bahan makanan, dan ruang konsultasi gizi.';
      break;

    case 'rekam-medis':
      base.unit_overview = 'Unit Rekam Medis mengelola dokumentasi riwayat kesehatan pasien, sistem pendaftaran, pengelolaan Rekam Medis Elektronik (RME), koding diagnosa, dan pelaporan statistik rumah sakit.';
      base.background = 'RSUD Al-Mulk telah mengimplementasikan transformasi digital Rekam Medis Elektronik (RME) yang terintegrasi secara aman dengan platform SATUSEHAT Kementerian Kesehatan RI.';
      base.main_duties = '1. Melayani pendaftaran pasien rawat jalan, rawat inap, dan IGD.\n2. Melakukan verifikasi dan pemantauan kelengkapan pengisian resume medis elektronik.\n3. Melakukan koding diagnosa (ICD-10) dan prosedur operasi (ICD-9-CM) untuk klaim jaminan kesehatan.\n4. Mengelola keamanan, kerahasiaan, dan pelepasan informasi medis.';
      base.service_scope = 'Loket pendaftaran rawat jalan/inap, ruang koding klaim BPJS, ruang pengolahan data statistik, dan ruang filing arsip inaktif.';
      base.service_types = 'Registrasi pasien, verifikasi SEP BPJS, koding rekam medis elektronik, pembuatan resume medis klaim asuransi, surat keterangan medis, pelaporan RL Kemenkes.';
      base.operating_hours = '24 Jam (Pendaftaran IGD/Rawat Inap) dan 07.30 - 15.30 WIB (Pendaftaran Rawat Jalan)';
      base.facilities = 'Komputer pendaftaran terintegrasi display antrean online, server lokal penyimpanan berkas terenkripsi, scanner dokumen digital, dan ruang filing inaktif.';
      break;

    case 'itrs':
      base.unit_overview = 'Unit IT Rumah Sakit (ITRS) bertanggung jawab atas pengelolaan infrastruktur teknologi informasi, sistem informasi manajemen rumah sakit (SIMRS), jaringan komunikasi data, dan keamanan siber.';
      base.background = 'SIMRS SIPAKAR dan SIMRS operasional klinis menjadi tulang punggung digitalisasi pelayanan tanpa kertas (paperless) serta bridging data antarsistem di RSUD Al-Mulk.';
      base.main_duties = '1. Memelihara keandalan server utama, database, dan koneksi internet 24/7.\n2. Melakukan bridging integrasi SIMRS dengan BPJS Kesehatan (VClaim, PCare, Antrean) dan SATUSEHAT Kemenkes.\n3. Memberikan dukungan teknis helpdesk perbaikan gangguan komputer, jaringan, dan printer unit.\n4. Mengembangkan modul aplikasi kinerja rumah sakit (SIPAKAR).';
      base.service_scope = 'Mencakup seluruh unit penunjang, poliklinik, rawat inap, IGD, kamar operasi, kasir, farmasi, dan manajemen.';
      base.service_types = 'Helpdesk IT, maintenance hardware & software, integrasi API sistem pihak ketiga, backup database harian, manajemen user login dan hak akses.';
      base.operating_hours = '24 Jam On-Call Helpdesk (Hari kerja operasional kantor 08.00 - 16.00 WIB)';
      base.facilities = 'Ruang Server Ber-AC khusus dengan UPS redundan, router mikrotik enterprise, switch jaringan manageable di tiap lantai, firewall server, dan PC workstation helpdesk.';
      break;

    case 'ipsrs':
      base.unit_overview = 'Instalasi Pemeliharaan Sarana dan Prasarana Rumah Sakit (IPSRS) bertugas memastikan seluruh fasilitas fisik, gedung, instalasi kelistrikan, air bersih, gas medis, dan peralatan elektromedik dalam kondisi andal dan laik pakai.';
      base.background = 'Pemeliharaan terencana (preventive maintenance) diterapkan guna mencegah kegagalan alat yang dapat menghentikan pelayanan klinis darurat.';
      base.main_duties = '1. Melaksanakan pemeliharaan rutin dan perbaikan alat medis (elektromedik).\n2. Memantau kelancaran pasokan listrik PLN, sistem genset darurat, dan UPS sentral.\n3. Mengoperasikan dan memelihara instalasi gas medis (oksigen sentral).\n4. Melakukan perbaikan sarana fisik, AC, perpipaan air, dan pertukangan sipil.';
      base.service_scope = 'Seluruh gedung, ruangan perawatan, poliklinik, instalasi penunjang, dan area luar rumah sakit.';
      base.service_types = 'Inspeksi alat medis, kalibrasi berkala kerja sama BPFK, uji fungsi genset mingguan, perbaikan darurat AC/listrik, pemeliharaan manifold oksigen sentral.';
      base.operating_hours = '24 Jam Siaga Teknisi (Shift Siaga Listrik & Oksigen)';
      base.facilities = 'Bengkel elektromedik, workshop pertukangan/mesin, genset otomatis 250 kVA, sentral gas medis oksigen, dan toolkit teknisi lengkap.';
      break;

    case 'cssd-laundry':
      base.unit_overview = 'Unit CSSD & Laundry menyelenggarakan proses dekontaminasi, sterilisasi instrumen medis, serta pencucian dan pengelolaan linen bersih bebas noda untuk mencegah infeksi nosokomial (HAIs).';
      base.background = 'Pemisahan alur bersih dan kotor (unidirectional flow) serta penerapan indikator sterilisasi biologi menjamin tingkat sterilitas instrumen kamar bedah dan kebersihan linen pasien.';
      base.main_duties = '1. Menerima, mendekontaminasi, mengemas, dan mensterilkan alat medis bedah/tindakan.\n2. Mengambil linen kotor, menimbang, mencuci, mengeringkan, dan menyortir linen bersih bebas noda.\n3. Mendistribusikan instrumen steril dan linen siap pakai ke seluruh ruang perawatan.\n4. Melakukan uji mutu sterilisasi menggunakan indikator kimia dan biologi.';
      base.service_scope = 'Melayani Kamar Operasi (IBS), Ruang Bersalin (VK), IGD, Ruang Rawat Inap, Rawat Jalan, dan Laboratorium.';
      base.service_types = 'Sterilisasi suhu tinggi (Steam Autoclave), pencucian linen infeksius & non-infeksius, pelipatan & packing linen, perbaikan linen robek.';
      base.operating_hours = '07.00 - 15.30 WIB (Penerimaan instrumen cito siaga 24 jam)';
      base.facilities = 'Mesin Autoclave sterilisasi uap bertekanan tinggi, mesin cuci komersial kapasitas besar, mesin pengering (dryer), sealer kemasan pouch, dan ruang penyimpanan steril.';
      break;

    case 'humas-pemasaran':
      base.unit_overview = 'Unit Humas dan Pemasaran bertugas mengelola komunikasi publik, penanganan pengaduan masyarakat, kemitraan rujukan, promosi layanan unggulan, serta survei kepuasan pelanggan RSUD Al-Mulk.';
      base.background = 'RSUD Al-Mulk mengedepankan pelayanan prima berbudaya empati, di mana setiap aspirasi dan keluhan pelanggan ditindaklanjuti secara cepat demi kepuasan warga Kota Sukabumi.';
      base.main_duties = '1. Mengelola pusat pengaduan pelanggan (Helpdesk/WA Pengaduan) dengan respon cepat < 24 jam.\n2. Memproduksi konten edukasi kesehatan publik, siaran pers, dan pengelolaan medsos resmi.\n3. Melakukan pengukuran Indeks Kepuasan Masyarakat (IKM) dan survei KESSAN BPJS.\n4. Membangun kemitraan rujukan dengan fasilitas kesehatan tingkat pertama (FKTP) dan puskesmas.';
      base.service_scope = 'Masyarakat umum, pasien, keluarga pasien, media massa, instansi pemerintah, dan FKTP jejaring.';
      base.service_types = 'Penanganan keluhan/komplain, informasi pelayanan dan dokter spesialis, publikasi media sosial, pendampingan kunjungan tamu, survei kepuasan.';
      base.operating_hours = '08.00 - 16.00 WIB (Kanal WhatsApp Pengaduan aktif 24 jam)';
      base.facilities = 'Ruang pengaduan khusus (konsultasi privat), booth informasi terpadu lobi depan, perlengkapan podcast/media publikasi, dan sistem survei elektronik.';
      break;

    case 'kesling':
      base.unit_overview = 'Unit Kesehatan Lingkungan (Sanitasi RS) bertanggung jawab atas pengendalian faktor risiko lingkungan fisik, kimia, dan biologi di rumah sakit guna mewujudkan lingkungan rumah sakit yang bersih, sehat, dan ramah lingkungan (Green Hospital).';
      base.background = 'Pengelolaan air limbah dan limbah medis B3 dilaksanakan secara ketat memenuhi baku mutu lingkungan hidup dan regulasi Kementerian Lingkungan Hidup dan Kehutanan.';
      base.main_duties = '1. Mengoperasikan dan mengawasi baku mutu Instalasi Pengolahan Air Limbah (IPAL) harian.\n2. Mengelola TPS Limbah Medis B3 dan pengangkutan oleh transporter berizin resmi.\n3. Melakukan uji mikrobiologi dan kimia berkala pada air bersih, air minum, dan udara ruang operasi.\n4. Melaksanakan program pengendalian serangga, tikus, dan vektor penyakit (pest control).';
      base.service_scope = 'Mencakup seluruh gedung rumah sakit, ruang rawat inap, kamar bedah, dapur gizi, dan area luar/taman.';
      base.service_types = 'Monitoring IPAL aerob/anaerob, pemilahan limbah B3/domestik, desinfeksi ruangan, uji baku mutu lingkungan, penertiban sanitasi linen & makanan.';
      base.operating_hours = '07.30 - 15.30 WIB (Petugas piket pemantauan IPAL & TPS B3)';
      base.facilities = 'Instalasi Pengolahan Air Limbah (IPAL) kapasitas 40 m³/hari, TPS Limbah Medis B3 berizin cold storage, DO meter, pH meter, thermohygrometer, dan misting pest control.';
      break;

    case 'mutu':
      base.unit_overview = 'Unit Mutu memfasilitasi dan mengkoordinasikan program peningkatan mutu dan keselamatan pasien (PMKP), manajemen risiko klinis dan operasional, serta pemenuhan standar akreditasi rumah sakit.';
      base.background = 'Unit Mutu mengintegrasikan sistem pelaporan kinerja digital SIPAKAR guna memastikan akuntabilitas pencapaian indikator kinerja utama (KPI) seluruh unit penunjang.';
      base.main_duties = '1. Mengkoordinasikan penetapan indikator mutu nasional (INM), indikator prioritas RS, dan indikator unit.\n2. Melakukan validasi data realisasi bulanan dan evaluasi tren capaian indikator pada SIPAKAR.\n3. Mengelola pelaporan dan investigasi insiden keselamatan pasien (IKP).\n4. Memfasilitasi audit klinis, ronde mutu, dan manajemen risiko rumah sakit.';
      base.service_scope = 'Seluruh unit penunjang medis, penunjang non-medis, komite medik, komite keperawatan, dan direksi.';
      base.service_types = 'Validasi data mutu, pelaporan SIMARS Kemenkes, pendampingan akreditasi KARS/Lembaga Akreditasi, workshop PMKP internal.';
      base.operating_hours = '08.00 - 16.00 WIB (Hari Kerja)';
      base.facilities = 'Ruang rapat komite mutu, komputer pengolahan data statistik mutu, aplikasi SIPAKAR, dan dashboard analitik PMKP.';
      break;
  }

  return base;
}

export function getDefaultStaffingForUnit(reportId: string, unitId: string): AnnualUnitStaffing[] {
  const norm = normalizeUnit(unitId);
  const uId = norm ? norm.id : unitId;
  const uName = norm ? norm.name : unitId;

  const makeStaff = (name: string, edu: string, prof: string, pos: string, status: string, avail: number, req: number): AnnualUnitStaffing => ({
    id: `stf-${reportId}-${uId}-${Math.random().toString(36).substr(2, 6)}`,
    report_id: reportId,
    unit_id: uId,
    employee_name: name,
    education: edu,
    profession: prof,
    position: pos,
    employment_status: status,
    available_count: avail,
    required_count: req,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  switch (uId) {
    case 'laboratorium':
      return [
        makeStaff('Ahmad Kurnia, A.Md.AK', 'D3 Analis Kesehatan', 'Pranata Laboratorium', 'Kepala Unit Laboratorium', 'PNS', 1, 1),
        makeStaff('Nurul Hidayah, S.Tr.Kes', 'D4 Analis Kesehatan', 'Pranata Laboratorium', 'PJ Teknis Kimia Darah & Hematologi', 'PNS', 1, 1),
        makeStaff('Rian Febrianto, A.Md.AK', 'D3 Analis Kesehatan', 'Pranata Laboratorium', 'Pelaksana Teknis Shift Lab 24 Jam', 'PPPK', 1, 2),
        makeStaff('Dewi Anggraeni, A.Md.AK', 'D3 Analis Kesehatan', 'Pranata Laboratorium', 'Pelaksana Teknis Shift Lab 24 Jam', 'THL', 1, 2),
        makeStaff('Fauzi Rahman, A.Md.AK', 'D3 Analis Kesehatan', 'Pranata Laboratorium', 'Pelaksana Teknis Flebotomi & Cito', 'Kontrak', 1, 1)
      ];

    case 'radiologi':
      return [
        makeStaff('Rendi Pratama, A.Md.Rad', 'D3 Radiodiagnostik', 'Radiografer', 'Kepala Unit Radiologi', 'PNS', 1, 1),
        makeStaff('Indah Permatasari, S.Tr.Rad', 'D4 Radiologi', 'Radiografer', 'Petugas Proteksi Radiasi (PPR)', 'PPPK', 1, 1),
        makeStaff('Fajar Nugraha, A.Md.Rad', 'D3 Radiodiagnostik', 'Radiografer', 'Pelaksana Shift Radiologi 24 Jam', 'THL', 1, 2),
        makeStaff('Bayu Setiawan, A.Md.Rad', 'D3 Radiodiagnostik', 'Radiografer', 'Pelaksana Shift Radiologi 24 Jam', 'Kontrak', 1, 1)
      ];

    case 'farmasi':
      return [
        makeStaff('Apt. Linda Marlina, S.Farm', 'Profesi Apoteker', 'Apoteker', 'Kepala Unit Farmasi', 'PNS', 1, 1),
        makeStaff('Apt. Dimas Prasetyo, S.Farm', 'Profesi Apoteker', 'Apoteker', 'PJ Pelayanan Farmasi Klinik & IGD', 'PPPK', 1, 1),
        makeStaff('Yanti Susanti, A.Md.Farm', 'D3 Farmasi', 'Tenaga Teknis Kefarmasian', 'Pelaksana Dispensing Resep Jadi', 'PNS', 1, 2),
        makeStaff('Reza Pahlevi, A.Md.Farm', 'D3 Farmasi', 'Tenaga Teknis Kefarmasian', 'Pelaksana Dispensing Resep Racikan', 'THL', 1, 2),
        makeStaff('Siti Aisyah, A.Md.Farm', 'D3 Farmasi', 'Tenaga Teknis Kefarmasian', 'Pengelola Gudang Obat & BMHP', 'Kontrak', 1, 1)
      ];

    case 'itrs':
      return [
        makeStaff('Giandeno, S.Kom', 'S1 Teknik Informatika', 'Pranata Komputer', 'Kepala Unit IT Rumah Sakit / ITRS', 'PNS', 1, 1),
        makeStaff('Bono Andi, S.Kom', 'S1 Sistem Informasi', 'Network & System Administrator', 'Super Admin SIMRS & Database', 'PNS', 1, 1),
        makeStaff('Gilang Ramadhan, A.Md.Kom', 'D3 Manajemen Informatika', 'Teknisi Komputer & Jaringan', 'Helpdesk Dukungan Pengguna & PC', 'THL', 1, 2),
        makeStaff('Irfan Maulana, S.Kom', 'S1 Ilmu Komputer', 'Software Engineer', 'Programmer & Integrasi API SATUSEHAT', 'Kontrak', 1, 2)
      ];

    case 'ipsrs':
      return [
        makeStaff('Roni Teknik, A.Md.TEM', 'D3 Teknik Elektromedik', 'Teknisi Elektromedis', 'Kepala Unit IPSRS', 'PNS', 1, 1),
        makeStaff('Agus Supriyatna, A.Md.TEM', 'D3 Teknik Elektromedik', 'Teknisi Elektromedis', 'PJ Pemeliharaan Alat Medis Kritis', 'PPPK', 1, 1),
        makeStaff('Dedi Junaedi, SMK Listrik', 'SMK Teknik Ketenagalistrikan', 'Teknisi Listrik & Genset', 'Operator Genset & Panel Listrik', 'THL', 1, 2),
        makeStaff('Ujang Komarudin, STM', 'SMK Bangunan', 'Teknisi Gedung & Sanitasi', 'Pelaksana Pemeliharaan Sipil & Pipa', 'Kontrak', 1, 2)
      ];

    case 'cssd-laundry':
      return [
        makeStaff('Siti Rahma, A.Md.Keb', 'D3 Kebidanan / Manajemen', 'Penanggung Jawab', 'Kepala Unit CSSD & Laundry', 'PNS', 1, 1),
        makeStaff('Lilis Karlina, SMA', 'SMA Sederajat', 'Teknisi Sterilisasi', 'Pelaksana Sterilisasi Autoclave CSSD', 'THL', 1, 2),
        makeStaff('Asep Saepudin, SMA', 'SMA Sederajat', 'Operator Laundry', 'Pelaksana Pencucian & Pengeringan Linen', 'THL', 1, 2),
        makeStaff('Eni Nuraeni, SMA', 'SMA Sederajat', 'Petugas Distribusi Linen', 'Pelaksana Pelipatan & Distribusi Linen', 'Kontrak', 1, 2)
      ];

    default:
      return [
        makeStaff(`PJ ${uName}`, 'D3 / S1', uName, `Kepala Unit ${uName}`, 'PNS', 1, 1),
        makeStaff(`Staf Pelaksana ${uName}`, 'D3 / S1', uName, 'Pelaksana Operasional', 'PPPK', 1, 2),
        makeStaff(`Staf Pendukung ${uName}`, 'SMA / D3', uName, 'Staf Administrasi & Teknis', 'THL', 1, 1)
      ];
  }
}

export function getDefaultAuthoritiesForUnit(reportId: string, unitId: string): AnnualUnitAuthority[] {
  const norm = normalizeUnit(unitId);
  const uId = norm ? norm.id : unitId;
  const uName = norm ? norm.name : unitId;

  const makeAuth = (name: string, pos: string, duties: string, resp: string, auth: string): AnnualUnitAuthority => ({
    id: `auth-${reportId}-${uId}-${Math.random().toString(36).substr(2, 6)}`,
    report_id: reportId,
    unit_id: uId,
    employee_name: name,
    position: pos,
    main_duties: duties,
    responsibilities: resp,
    authorities: auth,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  switch (uId) {
    case 'laboratorium':
      return [
        makeAuth('Ahmad Kurnia, A.Md.AK', 'Kepala Unit Laboratorium', 'Memimpin pelaksanaan pelayanan laboratorium, mengkoordinir staf, dan menyusun laporan mutu tahunan', 'Bertanggung jawab atas akurasi hasil pengujian dan kelancaran pelayanan lab 24 jam', 'Menandatangani hasil validasi akhir pemeriksaan dan mengajukan kebutuhan reagen'),
        makeAuth('Nurul Hidayah, S.Tr.Kes', 'PJ Teknis Analis', 'Melakukan kalibrasi alat, pengawasan mutu internal (PMI), dan penanganan sampel rujukan', 'Bertanggung jawab atas keandalan instrumen analizer dan reagen kerja', 'Memverifikasi hasil kontrol harian sebelum sampel pasien dikerjakan'),
        makeAuth('Rian Febrianto, A.Md.AK', 'Analis Pelaksana Shift', 'Melakukan sampling darah (flebotomi) dan memproses pemeriksaan lab cito IGD', 'Bertanggung jawab atas ketepatan identitas spesimen dan waktu penyerahan hasil cito', 'Melaporkan nilai kritis langsung kepada dokter pengirim')
      ];

    case 'itrs':
      return [
        makeAuth('Giandeno, S.Kom', 'Kepala Unit ITRS', 'Mengkoordinir pengembangan SIMRS, integrasi sistem, pemeliharaan infrastruktur IT, dan pelaporan SIPAKAR', 'Bertanggung jawab atas ketersediaan server utama dan kerahasiaan data rekam medis elektronik', 'Mengatur hak akses pengguna sistem dan menyetujui perubahan konfigurasi jaringan'),
        makeAuth('Bono Andi, S.Kom', 'Administrator SIMRS & Server', 'Mengelola database PostgreSQL/cloud, backup harian otomatis, dan keamanan server', 'Bertanggung jawab atas integritas basis data rumah sakit tanpa kehilangan data', 'Mengelola struktur tabel, skema migrasi, dan performa query database'),
        makeAuth('Gilang Ramadhan, A.Md.Kom', 'Helpdesk Jaringan & PC', 'Merespon keluhan teknis printer, PC, dan jaringan lokal unit pelayanan < 15 menit', 'Bertanggung jawab atas kesiapan perangkat keras operasional pelayanan', 'Melakukan perbaikan fisik hardware dan penggantian suku cadang IT')
      ];

    default:
      return [
        makeAuth(`Kepala Unit ${uName}`, `Kepala Unit ${uName}`, `Merencanakan, mengkoordinir, dan mengevaluasi operasional teknis ${uName}`, 'Bertanggung jawab penuh atas kelancaran dan mutu pelayanan unit', 'Mengatur penugasan shift kerja staf dan menandatangani laporan resmi unit'),
        makeAuth(`Pelaksana Teknis ${uName}`, 'Staf Pelaksana', `Melaksanakan kegiatan teknis harian pelayanan ${uName} sesuai SOP`, 'Bertanggung jawab atas ketertiban administrasi dan kebersihan sarana kerja', 'Mengusulkan perbaikan sarana dan melaporkan kendala operasional ke Kepala Unit')
      ];
  }
}

export function getDefaultObstaclesForUnit(reportId: string, unitId: string): AnnualUnitObstacle[] {
  const norm = normalizeUnit(unitId);
  const uId = norm ? norm.id : unitId;
  const uName = norm ? norm.name : unitId;

  const makeObs = (title: string, desc: string, cat: string, cause: string, impact: string, support: string, prio: 'Tinggi' | 'Sedang' | 'Rendah'): AnnualUnitObstacle => ({
    id: `obs-${reportId}-${uId}-${Math.random().toString(36).substr(2, 6)}`,
    report_id: reportId,
    unit_id: uId,
    problem_title: title,
    description: desc,
    category: cat,
    root_cause: cause,
    service_impact: impact,
    management_support: support,
    priority: prio,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  switch (uId) {
    case 'laboratorium':
      return [
        makeObs('Keterlambatan Pasokan Reagen Tertentu dari Distributor', 'Terjadi kekosongan reagen pemeriksaan elektrolit selama 3 hari pada triwulan kedua', 'Alat kesehatan', 'Distributor tunggal di tingkat provinsi mengalami keterlambatan pengiriman stok impor', 'Pemeriksaan elektrolit cito pasien rawat inap harus dirujuk ke laboratorium jejaring luar', 'Dukungan percepatan koordinasi kontrak pemesanan dengan multi-vendor reagen cadangan', 'Tinggi'),
        makeObs('Beban Kerja Tinggi pada Jam Sibuk Pagi', 'Penumpukan antrean pengambilan sampel darah rawat jalan antara pukul 08.30 - 10.30 WIB', 'SDM', 'Jumlah petugas flebotomi hanya 1 orang saat shift pagi rawat jalan', 'Waktu tunggu sampling pasien meningkat menjadi 25 menit', 'Penambahan 1 orang tenaga analis kesehatan (ATLM) formasi PPPK atau kontrak', 'Sedang')
      ];

    case 'itrs':
      return [
        makeObs('Fluktuasi Jaringan Koneksi Internet ISP Utama', 'Konektivitas bridging BPJS dan SATUSEHAT sesekali mengalami lag pada jam puncak layanan', 'Sistem informasi', 'Gangguan fiber optik provider luar gedung saat cuaca ekstrem', 'Proses cetak SEP BPJS dan bridging resep elektronik sempat tertunda beberapa menit', 'Penyediaan link internet cadangan (failover backup ISP) dengan provider berbeda', 'Tinggi'),
        makeObs('Kebutuhan Peremajaan PC Workstation Ruang Perawatan', 'Sebagian unit PC komputer di bangsal rawat inap memiliki spesifikasi lama (booting lambat)', 'Sarana dan prasarana', 'Usia ekonomis perangkat telah melebihi 5 tahun penggunaan intensif', 'Penginputan data perawat di bangsal membutuhkan waktu respon lebih lama', 'Alokasi anggaran bertahap untuk peremajaan PC all-in-one di setiap nurse station', 'Sedang')
      ];

    case 'ipsrs':
      return [
        makeObs('Waktu Tunggu Pengadaan Suku Cadang Alat Medis Tertentu', 'Perbaikan alat elektromedik dengan kerusakan modul elektronik membutuhkan waktu tunggu suku cadang', 'Alat kesehatan', 'Suku cadang harus dipesan melalui agen resmi pabrikan luar kota', 'Alat sementara waktu tidak dapat dioperasikan selama menunggu spare part', 'Penyediaan stok suku cadang fast-moving (fuse, baterai, sensor) di gudang IPSRS', 'Sedang')
      ];

    default:
      return [
        makeObs(`Kebutuhan Peningkatan Sarana Kerja ${uName}`, `Peralatan pendukung operasional unit ${uName} memerlukan peremajaan berkala`, 'Sarana dan prasarana', 'Tingginya volume pemakaian harian pada jam pelayanan', 'Potensi perlambatan proses administrasi pelayanan', 'Dukungan anggaran pemeliharaan dan pengadaan sarana kerja baru', 'Sedang')
      ];
  }
}

export function getDefaultPlansForUnit(reportId: string, unitId: string): AnnualUnitPlan[] {
  const norm = normalizeUnit(unitId);
  const uId = norm ? norm.id : unitId;
  const uName = norm ? norm.name : unitId;

  const makePlan = (prob: string, cause: string, action: string, time: string, needs: string, ind: string, prio: 'Tinggi' | 'Sedang' | 'Rendah'): AnnualUnitPlan => ({
    id: `pln-${reportId}-${uId}-${Math.random().toString(36).substr(2, 6)}`,
    report_id: reportId,
    unit_id: uId,
    problem: prob,
    cause: cause,
    action_plan: action,
    target_completion: time,
    resource_needs: needs,
    success_indicator: ind,
    priority: prio,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  switch (uId) {
    case 'laboratorium':
      return [
        makePlan('Kekosongan stok reagen darurat', 'Ketergantungan pada satu distributor', 'Menyusun MoU buffer stock reagen dengan 2 distributor farmasi resmi', 'Triwulan I', 'Koordinasi PPK dan Pejabat Pengadaan', 'Ketersediaan reagen lab 100% sepanjang tahun', 'Tinggi'),
        makePlan('Antrean sampling darah rawat jalan', 'Kurangnya loket sampling pagi', 'Membuka loket sampling kedua dan rotasi analis shift pagi jam sibuk', 'Triwulan II', 'Meja sampling tambahan dan 1 tenaga analis', 'Waktu tunggu sampling < 15 menit', 'Sedang')
      ];

    case 'itrs':
      return [
        makePlan('Risiko downtime internet ISP', 'Hanya memiliki satu sambungan fiber optik utama', 'Menerapkan sistem dual-ISP failover otomatis dengan router Mikrotik enterprise', 'Triwulan I', 'Anggaran langganan ISP backup dan IP publik', 'Uptime jaringan internet rumah sakit 99.9%', 'Tinggi'),
        makePlan('PC workstation perawat lambat', 'Komputer lama spesifikasi terbatas', 'Melakukan upgrade SSD & RAM serta peremajaan 10 unit PC nurse station', 'Triwulan II', 'Anggaran belanja modal IT', 'Waktu respons booting SIMRS < 1 menit', 'Sedang')
      ];

    default:
      return [
        makePlan(`Optimalisasi mutu pelayanan ${uName}`, 'Beban kerja dan dinamika regulasi baru', `Pelaksanaan pelatihan kompetensi staf dan audit kepatuhan SOP pelayanan ${uName}`, 'Semester I', 'Anggaran pelatihan diklat internal', '100% staf tersertifikasi kompetensi', 'Sedang'),
        makePlan('Pemeliharaan sarana kerja', 'Usia pemakaian sarana fisik', `Penyusunan jadwal pemeliharaan preventif sarana kerja unit ${uName}`, 'Triwulan I', 'Dukungan koordinasi IPSRS', 'Peralatan operasional laik pakai 100%', 'Sedang')
      ];
  }
}
