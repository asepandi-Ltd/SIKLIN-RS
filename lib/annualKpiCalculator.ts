import { Indikator, Capaian, getJenisPengukuran, determineStatus } from './store';
import { AnnualKpiSummaryItem } from './annualReportTypes';
import { normalizeUnit, MasterUnit } from './units';

/**
 * Calculates official annual KPI performance per indicator based on existing SIPAKAR database.
 * Principle: One-time input, multi-use. Respects submitted vs draft, deduplicates months,
 * and uses appropriate aggregation (sum of ratio or weighted average based on formula/unit).
 */
export function calculateAnnualKpiForIndicator(
  indikator: Indikator,
  allCapaian: Capaian[],
  year: number
): AnnualKpiSummaryItem {
  // 1. Filter capaian for this indicator and year
  const rawCaps = allCapaian.filter(
    c => c.indikator_id === indikator.id && Number(c.tahun) === Number(year)
  );

  const draftCaps = rawCaps.filter(c => c.status_submit === 'Draft');
  const submittedRawCaps = rawCaps.filter(c => c.status_submit === 'Submitted');

  // 2. Deduplicate submitted monthly entries: take single latest entry for each month (1-12)
  const monthMap = new Map<number, Capaian>();
  submittedRawCaps.forEach(c => {
    const existing = monthMap.get(c.bulan);
    if (!existing) {
      monthMap.set(c.bulan, c);
    } else {
      const existingTime = new Date(existing.created_at || 0).getTime();
      const currTime = new Date(c.created_at || 0).getTime();
      if (currTime >= existingTime || (c.id.startsWith('cap-1') && !existing.id.startsWith('cap-1'))) {
        monthMap.set(c.bulan, c);
      }
    }
  });

  const submittedCaps = Array.from(monthMap.values()).sort((a, b) => a.bulan - b.bulan);
  const monthsReported = submittedCaps.length;

  if (monthsReported === 0) {
    return {
      indikator_id: indikator.id,
      kode: indikator.kode,
      nama: indikator.nama,
      unit: indikator.unit,
      kategori: indikator.kategori,
      target: indikator.target,
      satuan: indikator.satuan || '%',
      frekuensi: indikator.frekuensi || 'Bulanan',
      arah_target: indikator.arah_target || 'Semakin Tinggi',
      numerator_total: 0,
      denominator_total: 0,
      capaian_annual: 0,
      status: 'Belum Melapor',
      months_reported: 0,
      draft_count: draftCaps.length,
      submitted_count: 0,
      monthly_details: [],
      analisa: draftCaps.length > 0 
        ? `Terdapat ${draftCaps.length} laporan bulanan berstatus Draft yang belum disubmit.`
        : 'Belum ada data capaian resmi yang disubmit pada tahun ini.'
    };
  }

  // 3. Aggregation Logic
  const totalNum = submittedCaps.reduce((sum, c) => sum + (Number(c.numerator) || 0), 0);
  const totalDen = submittedCaps.reduce((sum, c) => sum + (Number(c.denominator) || 0), 0);
  const jenis = getJenisPengukuran(indikator);
  const formulaStr = (indikator.formula || '').toLowerCase();
  const satuanStr = (indikator.satuan || '').toLowerCase();

  let annualCapaian = 0;

  if (jenis === 'Jumlah') {
    // For counts (kunjungan, kegiatan, berkas, dll.), aggregate by sum (akumulasi)
    if (indikator.metode_agregasi === 'Rata-rata') {
      const sumCap = submittedCaps.reduce((sum, c) => sum + (Number(c.capaian) || 0), 0);
      annualCapaian = Math.round((sumCap / monthsReported) * 100) / 100;
    } else {
      // Default for Jumlah: Akumulasi (Total Tahunan)
      annualCapaian = Math.round(submittedCaps.reduce((sum, c) => sum + (Number(c.capaian) || 0), 0) * 100) / 100;
    }
  } else if (jenis === 'Durasi') {
    // For duration (e.g. waktu tunggu dalam menit), aggregate by average of reported monthly durations
    if (totalDen > 0 && (formulaStr.includes('÷') || formulaStr.includes('/'))) {
      annualCapaian = Math.round((totalNum / totalDen) * 100) / 100;
    } else {
      const sumCap = submittedCaps.reduce((sum, c) => sum + (Number(c.capaian) || 0), 0);
      annualCapaian = Math.round((sumCap / monthsReported) * 100) / 100;
    }
  } else {
    // Persentase
    const isRatioIndicator = totalDen > 0 && (formulaStr.includes('÷') || formulaStr.includes('/') || formulaStr.includes('total') || satuanStr === '%');
    if (isRatioIndicator && totalDen > 0) {
      annualCapaian = Math.round(((totalNum / totalDen) * 100) * 100) / 100;
    } else {
      const sumCap = submittedCaps.reduce((sum, c) => sum + (Number(c.capaian) || 0), 0);
      annualCapaian = Math.round((sumCap / monthsReported) * 100) / 100;
    }
  }

  // 4. Status determination following arah_target and tolerance
  const targetVal = indikator.target;
  const status = determineStatus(annualCapaian, targetVal, indikator.arah_target, jenis);

  // 5. Gather remarks and notes
  const notes = submittedCaps
    .map(c => c.keterangan?.trim())
    .filter(Boolean);
  
  const uniqueNotes = Array.from(new Set(notes)).join('; ');
  const defaultAnalisa = status === 'Tercapai'
    ? `Kinerja indikator mencapai target ${targetVal}${indikator.satuan} dengan realisasi tahunan ${annualCapaian}${indikator.satuan}.`
    : status === 'Mendekati Target'
    ? `Kinerja mendekati target (${annualCapaian}${indikator.satuan} dari target ${targetVal}${indikator.satuan}). Memerlukan pemantauan berkala.`
    : `Kinerja belum memenuhi target (${annualCapaian}${indikator.satuan} dari target ${targetVal}${indikator.satuan}). Memerlukan evaluasi dan rencana tindak lanjut perbaikan.`;

  return {
    indikator_id: indikator.id,
    kode: indikator.kode,
    nama: indikator.nama,
    unit: indikator.unit,
    kategori: indikator.kategori,
    target: indikator.target,
    satuan: indikator.satuan || '%',
    frekuensi: indikator.frekuensi || 'Bulanan',
    arah_target: indikator.arah_target || 'Semakin Tinggi',
    numerator_total: Math.round(totalNum * 100) / 100,
    denominator_total: Math.round(totalDen * 100) / 100,
    capaian_annual: annualCapaian,
    status,
    months_reported: monthsReported,
    draft_count: draftCaps.length,
    submitted_count: submittedCaps.length,
    monthly_details: submittedCaps.map(c => ({
      bulan: c.bulan,
      numerator: c.numerator,
      denominator: c.denominator,
      capaian: c.capaian,
      status: c.status,
      keterangan: c.keterangan || '',
      eviden: c.eviden || '',
      nilai: c.nilai
    })),
    analisa: uniqueNotes || defaultAnalisa
  };
}

/**
 * Calculates annual KPI performance for a specific unit
 */
export function calculateAnnualKpiForUnit(
  unit: MasterUnit,
  allIndikators: Indikator[],
  allCapaian: Capaian[],
  year: number
): AnnualKpiSummaryItem[] {
  // Find indicators matching this unit (canonical matching)
  const unitIndikators = allIndikators.filter(i => {
    if (!i.status) return false;
    const norm = normalizeUnit(i.unit);
    return norm && norm.id === unit.id;
  });

  return unitIndikators.map(ind => calculateAnnualKpiForIndicator(ind, allCapaian, year));
}
