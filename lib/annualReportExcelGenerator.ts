import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AnnualReportFullData } from './annualReportTypes';
import { ACTIVE_MASTER_UNITS } from './units';

export function generateAnnualReportExcel(data: AnnualReportFullData) {
  const wb = XLSX.utils.book_new();
  const year = data.report.report_year;

  // ==========================================
  // SHEET 1: REKAPITULASI KINERJA KPI
  // ==========================================
  const kpiData: any[][] = [
    ['LAPORAN TAHUNAN - REKAPITULASI CAPAIAN KPI MUTU SEKSI PENUNJANG'],
    [`UOBK RSUD AL-MULK KOTA SUKABUMI - TAHUN ${year}`],
    [],
    ['No', 'Unit Penunjang', 'Kode KPI', 'Nama Indikator Mutu', 'Target', 'Satuan', 'Arah Target', 'Numerator Kumulatif', 'Denominator Kumulatif', 'Realisasi Tahunan', 'Status Capaian', 'Jumlah Bulan Melapor', 'Analisis / Keterangan']
  ];

  let kpiCounter = 1;
  ACTIVE_MASTER_UNITS.forEach(u => {
    const list = data.kpiSummaries[u.id] || [];
    list.forEach(k => {
      kpiData.push([
        kpiCounter++,
        u.name,
        k.kode,
        k.nama,
        k.target,
        k.satuan,
        k.arah_target || 'Semakin Tinggi',
        k.numerator_total,
        k.denominator_total,
        k.months_reported > 0 ? k.capaian_annual : 'Belum Ada',
        k.status,
        k.months_reported,
        k.analisa
      ]);
    });
  });

  const wsKpi = XLSX.utils.aoa_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(wb, wsKpi, 'Rekap KPI');

  // ==========================================
  // SHEET 2: REKAPITULASI SDM
  // ==========================================
  const sdmData: any[][] = [
    ['REKAPITULASI KEBUTUHAN DAN KETERSEDIAAN SDM UNIT PENUNJANG'],
    [`UOBK RSUD AL-MULK KOTA SUKABUMI - TAHUN ${year}`],
    [],
    ['No', 'Unit Penunjang', 'Nama Pegawai', 'Pendidikan', 'Profesi', 'Jabatan / Posisi', 'Status Kepegawaian', 'Tersedia', 'Kebutuhan', 'Kekurangan']
  ];

  let sdmCounter = 1;
  ACTIVE_MASTER_UNITS.forEach(u => {
    const list = data.unitStaffing[u.id] || [];
    list.forEach(s => {
      const avail = s.available_count || 1;
      const req = s.required_count || 1;
      sdmData.push([
        sdmCounter++,
        u.name,
        s.employee_name,
        s.education || '-',
        s.profession || '-',
        s.position || '-',
        s.employment_status || 'PNS',
        avail,
        req,
        Math.max(0, req - avail)
      ]);
    });
  });

  const wsSdm = XLSX.utils.aoa_to_sheet(sdmData);
  XLSX.utils.book_append_sheet(wb, wsSdm, 'Rekap SDM');

  // ==========================================
  // SHEET 3: RENCANA KERJA SEKSI & UNIT
  // ==========================================
  const planData: any[][] = [
    ['RENCANA KERJA DAN TINDAK LANJUT SEKSI PENUNJANG'],
    [`UOBK RSUD AL-MULK KOTA SUKABUMI - PERIODE PERENCANAAN ${year + 1}`],
    [],
    ['Level', 'Unit / Asal', 'Masalah Terkait', 'Rencana Tindakan / Strategis', 'Target Waktu', 'Kebutuhan Sumber Daya', 'Indikator Keberhasilan', 'Prioritas']
  ];

  // Section plans
  (data.sectionPlans || []).forEach(sp => {
    planData.push([
      'Seksi Penunjang',
      'Lintas Unit',
      sp.problem || '-',
      sp.strategic_action || sp.section_plan_title,
      sp.target_completion || '-',
      sp.resource_needs || '-',
      sp.success_indicator || '-',
      sp.priority || 'Sedang'
    ]);
  });

  // Unit plans
  ACTIVE_MASTER_UNITS.forEach(u => {
    const list = data.unitPlans[u.id] || [];
    list.forEach(p => {
      planData.push([
        'Unit Kerja',
        u.name,
        p.problem || '-',
        p.action_plan,
        p.target_completion || '-',
        p.resource_needs || '-',
        p.success_indicator || '-',
        p.priority || 'Sedang'
      ]);
    });
  });

  const wsPlan = XLSX.utils.aoa_to_sheet(planData);
  XLSX.utils.book_append_sheet(wb, wsPlan, 'Rencana Kerja');

  // ==========================================
  // SHEET 4: HAMBATAN DAN MASALAH
  // ==========================================
  const obsData: any[][] = [
    ['REKAPITULASI HAMBATAN DAN PERMASALAHAN UNIT'],
    [`UOBK RSUD AL-MULK KOTA SUKABUMI - TAHUN ${year}`],
    [],
    ['No', 'Unit Penunjang', 'Permasalahan', 'Kategori', 'Akar Masalah', 'Dampak Pelayanan', 'Dukungan Manajemen Dibutuhkan', 'Prioritas']
  ];

  let obsCounter = 1;
  ACTIVE_MASTER_UNITS.forEach(u => {
    const list = data.unitObstacles[u.id] || [];
    list.forEach(o => {
      obsData.push([
        obsCounter++,
        u.name,
        o.problem_title,
        o.category,
        o.root_cause || '-',
        o.service_impact || '-',
        o.management_support || '-',
        o.priority || 'Sedang'
      ]);
    });
  });

  const wsObs = XLSX.utils.aoa_to_sheet(obsData);
  XLSX.utils.book_append_sheet(wb, wsObs, 'Hambatan Unit');

  // ==========================================
  // SHEET 5: PROGRAM & KEGIATAN UNIT
  // ==========================================
  const progData: any[][] = [
    ['REKAPITULASI PROGRAM DAN KEGIATAN UNIT PENUNJANG'],
    [`UOBK RSUD AL-MULK KOTA SUKABUMI - TAHUN ${year}`],
    [],
    ['No', 'Unit Penunjang', 'Judul Tabel', 'Jumlah Kegiatan', 'Analisa Capaian', 'Rekomendasi Tindak Lanjut']
  ];

  let progCounter = 1;
  ACTIVE_MASTER_UNITS.forEach(u => {
    const list = data.unitProgramTables[u.id] || [];
    list.forEach(pt => {
      progData.push([
        progCounter++,
        u.name,
        pt.table_title,
        `${(pt.rows_data || []).length} Kegiatan Operasional`,
        pt.analisa || '-',
        pt.rekomendasi || '-'
      ]);
    });
  });

  const wsProg = XLSX.utils.aoa_to_sheet(progData);
  XLSX.utils.book_append_sheet(wb, wsProg, 'Program & Kegiatan');

  // Generate buffer and trigger real XLSX download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Rekapitulasi_Laporan_Tahunan_RSUD_Al-Mulk_${year}.xlsx`);
}
