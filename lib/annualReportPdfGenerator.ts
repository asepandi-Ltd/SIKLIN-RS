import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnnualReportFullData } from './annualReportTypes';
import { ACTIVE_MASTER_UNITS } from './units';
import { Pengaturan } from './store';

export function generateAnnualReportPdf(data: AnnualReportFullData, pengaturan?: Pengaturan) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const year = data.report.report_year;
  const hospitalName = (pengaturan?.nama_rs || 'UOBK RSUD AL-MULK').toUpperCase();
  const hospitalAddress = pengaturan?.alamat || 'Jl. Pelabuhan II No. Km. 6, Lembursitu, Kota Sukabumi';
  const pejabatNama = data.sectionProfile.pejabat_nama || 'Dr. Fitri Wulandari';
  const pejabatNip = data.sectionProfile.pejabat_nip || '19820415 200801 2 011';
  const pejabatJabatan = data.sectionProfile.pejabat_jabatan || 'Kepala Seksi Penunjang, Mutu, Humas dan Pemasaran';

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper for text wrapping & auto page
  let currentY = 20;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
      addPageHeaderFooter();
    }
  };

  const addPageHeaderFooter = () => {
    const pageNum = doc.getNumberOfPages();
    if (pageNum === 1) return; // Skip cover

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    // Header
    doc.text(`Laporan Tahunan Seksi Penunjang RSUD Al-Mulk - Tahun ${year}`, pageWidth - 15, 12, { align: 'right' });
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(15, 14, pageWidth - 15, 14);

    // Footer
    doc.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);
    doc.text(`Halaman ${pageNum}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
    doc.text(`UOBK RSUD Al-Mulk Kota Sukabumi`, 15, pageHeight - 8);
  };

  // ==========================================
  // 1. COVER PAGE
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(13, 92, 117); // Teal dark
  doc.text('PEMERINTAH KOTA SUKABUMI', pageWidth / 2, 45, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text(hospitalName, pageWidth / 2, 53, { align: 'center' });

  doc.setDrawColor(13, 92, 117);
  doc.setLineWidth(0.8);
  doc.line(30, 58, pageWidth - 30, 58);

  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text('LAPORAN TAHUNAN', pageWidth / 2, 100, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(4, 120, 87); // Emerald dark
  doc.text('SEKSI PENUNJANG, MUTU, HUMAS DAN PEMASARAN', pageWidth / 2, 110, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(`TAHUN ANGGARAN ${year}`, pageWidth / 2, 120, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Alamat: ${hospitalAddress}`, pageWidth / 2, 235, { align: 'center' });
  doc.text('Kota Sukabumi, Jawa Barat', pageWidth / 2, 241, { align: 'center' });
  doc.text('Dokumen Resmi Akuntabilitas Kinerja Pelayanan', pageWidth / 2, 247, { align: 'center' });

  // ==========================================
  // 2. BAB I: PENDAHULUAN
  // ==========================================
  doc.addPage();
  currentY = 25;
  addPageHeaderFooter();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(13, 92, 117);
  doc.text('BAB I. PENDAHULUAN', 15, currentY);
  currentY += 8;

  const renderSection = (title: string, content: string) => {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(4, 120, 87);
    doc.text(title, 15, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(content || '-', pageWidth - 30);
    checkPageBreak(lines.length * 5 + 4);
    doc.text(lines, 15, currentY);
    currentY += lines.length * 5 + 5;
  };

  renderSection('1.1 Latar Belakang', data.sectionProfile.background);
  renderSection('1.2 Tujuan Penyusunan', data.sectionProfile.objectives);
  renderSection('1.3 Gambaran Umum Seksi', data.sectionProfile.section_overview);
  renderSection('1.4 Struktur Organisasi', data.sectionProfile.organizational_structure);
  renderSection('1.5 Tugas Pokok dan Fungsi', data.sectionProfile.main_duties);

  // ==========================================
  // 3. BAB II: ANALISIS SITUASI
  // ==========================================
  doc.addPage();
  currentY = 25;
  addPageHeaderFooter();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(13, 92, 117);
  doc.text('BAB II. ANALISIS SITUASI', 15, currentY);
  currentY += 8;

  renderSection('2.1 Gambaran Kondisi Umum', data.sectionProfile.general_conditions);

  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(4, 120, 87);
  doc.text('2.2 Analisis SWOT Seksi Penunjang', 15, currentY);
  currentY += 6;

  autoTable(doc, {
    startY: currentY,
    head: [['KEKUATAN (STRENGTHS)', 'KELEMAHAN (WEAKNESSES)']],
    body: [
      [data.sectionProfile.swot_strength || '-', data.sectionProfile.swot_weakness || '-'],
      [{ content: 'PELUANG (OPPORTUNITIES)', styles: { fontStyle: 'bold', fillColor: [240, 245, 245] } }, { content: 'ANCAMAN (THREATS)', styles: { fontStyle: 'bold', fillColor: [240, 245, 245] } }],
      [data.sectionProfile.swot_opportunity || '-', data.sectionProfile.swot_threat || '-']
    ],
    theme: 'grid',
    headStyles: { fillColor: [13, 92, 117], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    margin: { left: 15, right: 15 },
    didDrawPage: () => addPageHeaderFooter()
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  renderSection('2.3 Sumber Daya Manusia Seksi', 
    `Total tenaga yang mengampu pelayanan pada 11 unit penunjang berjumlah ${data.staffingSummary.totalPegawai} orang (PNS: ${data.staffingSummary.totalPns}, PPPK: ${data.staffingSummary.totalPppk}, THL: ${data.staffingSummary.totalThl}, Kontrak: ${data.staffingSummary.totalKontrak}), dengan total analisis kebutuhan tenaga sebanyak ${data.staffingSummary.totalKebutuhan} orang dan kekurangan ${data.staffingSummary.totalKekurangan} orang.`
  );

  renderSection('2.4 Target Kinerja Unit',
    `Seksi Penunjang menetapkan ${data.overallKpiStats.totalIndikator} indikator kinerja mutu. Sebanyak ${data.overallKpiStats.totalTercapai} indikator (${data.overallKpiStats.persenTercapai}%) berhasil mencapai target kinerja pada tahun ini.`
  );

  renderSection('2.5 Permasalahan dan Isu Strategis', data.sectionProfile.strategic_issues);

  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(4, 120, 87);
  doc.text('2.6 Rencana Kerja Strategis Seksi', 15, currentY);
  currentY += 6;

  if (data.sectionPlans && data.sectionPlans.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Rencana Tindakan', 'Akar Masalah', 'Waktu', 'Prioritas']],
      body: data.sectionPlans.map((sp, idx) => [
        idx + 1,
        sp.strategic_action || sp.section_plan_title,
        sp.problem || '-',
        sp.target_completion || '-',
        sp.priority || 'Sedang'
      ]),
      headStyles: { fillColor: [13, 92, 117], fontSize: 8.5 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 15, right: 15 },
      didDrawPage: () => addPageHeaderFooter()
    });
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // ==========================================
  // 4. BAB III: LAPORAN PROGRAM 11 UNIT
  // ==========================================
  doc.addPage();
  currentY = 25;
  addPageHeaderFooter();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(13, 92, 117);
  doc.text('BAB III. LAPORAN PROGRAM UNIT PENUNJANG', 15, currentY);
  currentY += 8;

  ACTIVE_MASTER_UNITS.forEach((unit, idx) => {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(13, 92, 117);
    doc.text(`3.${idx + 1} Unit ${unit.name}`, 15, currentY);
    currentY += 6;

    const prof = data.unitProfiles[unit.id] || {};
    const staffing = data.unitStaffing[unit.id] || [];
    const progs = data.unitProgramTables[unit.id] || [];
    const kpis = data.kpiSummaries[unit.id] || [];
    const obstacles = data.unitObstacles[unit.id] || [];
    const plans = data.unitPlans[unit.id] || [];

    // A. Profil
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(4, 120, 87);
    doc.text('A. Profil Unit', 15, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    const pText = `Gambaran Umum: ${prof.unit_overview || '-'}\nTupoksi: ${prof.main_duties || '-'}\nPelayanan: ${prof.service_scope || '-'} (${prof.service_types || '-'})\nJam Operasional: ${prof.operating_hours || '-'}\nSarana: ${prof.facilities || '-'}`;
    const pLines = doc.splitTextToSize(pText, pageWidth - 30);
    checkPageBreak(pLines.length * 4.5 + 4);
    doc.text(pLines, 15, currentY);
    currentY += pLines.length * 4.5 + 6;

    // B. SDM Unit
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(4, 120, 87);
    doc.text('B. SDM Unit', 15, currentY);
    currentY += 4;

    if (staffing.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['No', 'Nama Pegawai', 'Pendidikan', 'Profesi / Jabatan', 'Status', 'Tersedia', 'Kebutuhan']],
        body: staffing.map((s, sIdx) => [
          sIdx + 1,
          s.employee_name,
          s.education || '-',
          `${s.profession || ''} / ${s.position || ''}`,
          s.employment_status || 'PNS',
          s.available_count || 1,
          s.required_count || 1
        ]),
        headStyles: { fillColor: [13, 92, 117], fontSize: 8 },
        bodyStyles: { fontSize: 7.5 },
        margin: { left: 15, right: 15 },
        didDrawPage: () => addPageHeaderFooter()
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('(Belum ada data SDM yang dimasukkan)', 15, currentY);
      currentY += 6;
    }

    // C. Dynamic Table Builder
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(4, 120, 87);
    doc.text('C. Program dan Kegiatan Unit', 15, currentY);
    currentY += 4;

    if (progs.length > 0) {
      progs.forEach(prog => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(`Tabel: ${prog.table_title}`, 15, currentY);
        currentY += 4;

        const cols = prog.columns_definition || [];
        const rows = prog.rows_data || [];
        if (cols.length > 0) {
          autoTable(doc, {
            startY: currentY,
            head: [cols.map(c => c.label)],
            body: rows.map(r => cols.map(c => String(r[c.key] ?? '-'))),
            headStyles: { fillColor: [4, 120, 87], fontSize: 7.5 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 15, right: 15 },
            didDrawPage: () => addPageHeaderFooter()
          });
          currentY = (doc as any).lastAutoTable.finalY + 4;

          if (prog.analisa) {
            checkPageBreak(12);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(30, 41, 59);
            doc.text('Analisa Capaian:', 15, currentY);
            currentY += 3.5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            const splitA = doc.splitTextToSize(prog.analisa, 180);
            doc.text(splitA, 15, currentY);
            currentY += splitA.length * 3.5 + 2;
          }

          if (prog.rekomendasi) {
            checkPageBreak(12);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(30, 41, 59);
            doc.text('Rekomendasi Tindak Lanjut:', 15, currentY);
            currentY += 3.5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            const splitR = doc.splitTextToSize(prog.rekomendasi, 180);
            doc.text(splitR, 15, currentY);
            currentY += splitR.length * 3.5 + 4;
          }
        }
      });
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('(Belum ada tabel kegiatan unit)', 15, currentY);
      currentY += 6;
    }

    // D. KPI Unit
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(4, 120, 87);
    doc.text('D. Capaian Kinerja KPI Unit', 15, currentY);
    currentY += 4;

    if (kpis.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['No', 'Kode', 'Indikator Mutu', 'Target', 'Realisasi', 'Status']],
        body: kpis.map((k, kIdx) => [
          kIdx + 1,
          k.kode,
          k.nama,
          `${k.target}${k.satuan}`,
          k.months_reported > 0 ? `${k.capaian_annual}${k.satuan}` : 'Belum Ada',
          k.status
        ]),
        headStyles: { fillColor: [13, 92, 117], fontSize: 8 },
        bodyStyles: { fontSize: 7.5 },
        margin: { left: 15, right: 15 },
        didDrawPage: () => addPageHeaderFooter()
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // E. Hambatan
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(4, 120, 87);
    doc.text('E. Hambatan dan Permasalahan', 15, currentY);
    currentY += 4;

    if (obstacles.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['No', 'Permasalahan', 'Kategori', 'Akar Masalah', 'Prioritas']],
        body: obstacles.map((o, oIdx) => [
          oIdx + 1,
          o.problem_title,
          o.category,
          o.root_cause || '-',
          o.priority || 'Sedang'
        ]),
        headStyles: { fillColor: [13, 92, 117], fontSize: 8 },
        bodyStyles: { fontSize: 7.5 },
        margin: { left: 15, right: 15 },
        didDrawPage: () => addPageHeaderFooter()
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // F. Rencana Kerja
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(4, 120, 87);
    doc.text('F. Rencana Kerja Unit', 15, currentY);
    currentY += 4;

    if (plans.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['No', 'Rencana Kegiatan', 'Target Waktu', 'Kebutuhan']],
        body: plans.map((p, pIdx) => [
          pIdx + 1,
          p.action_plan,
          p.target_completion || '-',
          p.resource_needs || '-'
        ]),
        headStyles: { fillColor: [13, 92, 117], fontSize: 8 },
        bodyStyles: { fontSize: 7.5 },
        margin: { left: 15, right: 15 },
        didDrawPage: () => addPageHeaderFooter()
      });
      currentY = (doc as any).lastAutoTable.finalY + 8;
    }
  });

  // ==========================================
  // 5. BAB IV: CAPAIAN KINERJA KESELURUHAN
  // ==========================================
  doc.addPage();
  currentY = 25;
  addPageHeaderFooter();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(13, 92, 117);
  doc.text('BAB IV. CAPAIAN KINERJA UNIT PENUNJANG', 15, currentY);
  currentY += 8;

  const allKpiRows: any[] = [];
  let kCounter = 1;
  ACTIVE_MASTER_UNITS.forEach(u => {
    const list = data.kpiSummaries[u.id] || [];
    list.forEach(k => {
      allKpiRows.push([
        kCounter++,
        u.name,
        k.kode,
        k.nama,
        `${k.target}${k.satuan}`,
        k.months_reported > 0 ? `${k.capaian_annual}${k.satuan}` : '-',
        k.status
      ]);
    });
  });

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Unit', 'Kode', 'Indikator Mutu', 'Target', 'Realisasi', 'Status']],
    body: allKpiRows,
    headStyles: { fillColor: [13, 92, 117], fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    margin: { left: 15, right: 15 },
    didDrawPage: () => addPageHeaderFooter()
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // ==========================================
  // 6. BAB V: PENUTUP & TANDA TANGAN
  // ==========================================
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(13, 92, 117);
  doc.text('BAB V. PENUTUP', 15, currentY);
  currentY += 8;

  renderSection('5.1 Kesimpulan', data.sectionProfile.conclusion);
  renderSection('5.2 Rekomendasi', data.sectionProfile.recommendation);
  renderSection('5.3 Rencana Perbaikan', data.sectionProfile.improvement_plan);

  checkPageBreak(45);
  currentY += 8;
  const signX = pageWidth - 70;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Sukabumi, 31 Desember ${year}`, signX, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(pejabatJabatan, signX, currentY);
  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.text('UOBK RSUD Al-Mulk Kota Sukabumi', signX, currentY);
  currentY += 24;
  doc.setFont('helvetica', 'bold');
  doc.text(pejabatNama, signX, currentY);
  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${pejabatNip}`, signX, currentY);

  doc.save(`Laporan_Tahunan_Seksi_Penunjang_RSUD_Al-Mulk_${year}.pdf`);
}
