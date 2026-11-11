import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  ShadingType,
  convertInchesToTwip
} from 'docx';
import { saveAs } from 'file-saver';
import { AnnualReportFullData } from './annualReportTypes';
import { ACTIVE_MASTER_UNITS } from './units';
import { Pengaturan } from './store';

export async function generateAnnualReportDocx(data: AnnualReportFullData, pengaturan?: Pengaturan) {
  const year = data.report.report_year;
  const hospitalName = pengaturan?.nama_rs || 'UOBK RSUD AL-MULK';
  const hospitalAddress = pengaturan?.alamat || 'Jl. Pelabuhan II No. Km. 6, Lembursitu, Kota Sukabumi';
  const pejabatNama = data.sectionProfile.pejabat_nama || 'Dr. Fitri Wulandari';
  const pejabatNip = data.sectionProfile.pejabat_nip || '19820415 200801 2 011';
  const pejabatJabatan = data.sectionProfile.pejabat_jabatan || 'Kepala Seksi Penunjang, Mutu, Humas dan Pemasaran';

  const titleFont = 'Arial';
  const bodyFont = 'Arial';

  // Helper for paragraphs
  const p = (text: string, bold = false, size = 22, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT, spaceAfter = 120) => {
    return new Paragraph({
      alignment: align,
      spacing: { after: spaceAfter, line: 276 },
      children: [
        new TextRun({
          text,
          bold,
          size,
          font: bodyFont
        })
      ]
    });
  };

  const h1 = (text: string) => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 28,
          color: '0D5C75',
          font: titleFont
        })
      ]
    });
  };

  const h2 = (text: string) => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 180, after: 100 },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 24,
          color: '047857',
          font: titleFont
        })
      ]
    });
  };

  const h3 = (text: string) => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 140, after: 80 },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 22,
          color: '1E293B',
          font: titleFont
        })
      ]
    });
  };

  const tableCell = (text: string, isHeader = false, widthPercent?: number, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT) => {
    return new TableCell({
      width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,
      shading: isHeader ? { fill: '0D5C75', type: ShadingType.CLEAR } : undefined,
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [
        new Paragraph({
          alignment: align,
          children: [
            new TextRun({
              text: text || '-',
              bold: isHeader,
              color: isHeader ? 'FFFFFF' : '000000',
              size: isHeader ? 19 : 18,
              font: bodyFont
            })
          ]
        })
      ]
    });
  };

  const sectionsChildren: any[] = [];

  // ==========================================
  // COVER PAGE
  // ==========================================
  sectionsChildren.push(
    new Paragraph({ spacing: { before: 1200 } }),
    p(hospitalName.toUpperCase(), true, 36, AlignmentType.CENTER, 80),
    p('PEMERINTAH KOTA SUKABUMI', true, 26, AlignmentType.CENTER, 200),
    p('------------------------------------------------------------------------', false, 20, AlignmentType.CENTER, 400),
    new Paragraph({ spacing: { before: 800 } }),
    p('LAPORAN TAHUNAN', true, 44, AlignmentType.CENTER, 140),
    p('SEKSI PENUNJANG, MUTU, HUMAS DAN PEMASARAN', true, 30, AlignmentType.CENTER, 120),
    p(`TAHUN ANGGARAN ${year}`, true, 32, AlignmentType.CENTER, 400),
    new Paragraph({ spacing: { before: 1800 } }),
    p(`Alamat: ${hospitalAddress}`, false, 20, AlignmentType.CENTER, 60),
    p(`KOTA SUKABUMI - JAWA BARAT`, true, 20, AlignmentType.CENTER, 60),
    p(`Dokumen Resmi Akuntabilitas Kinerja Pelayanan`, false, 18, AlignmentType.CENTER, 0),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ==========================================
  // BAB I: PENDAHULUAN
  // ==========================================
  sectionsChildren.push(
    h1('BAB I. PENDAHULUAN'),
    h2('1.1 Latar Belakang'),
    p(data.sectionProfile.background || '-'),
    h2('1.2 Tujuan Penyusunan'),
    p(data.sectionProfile.objectives || '-'),
    h2('1.3 Gambaran Umum Seksi'),
    p(data.sectionProfile.section_overview || '-'),
    h2('1.4 Struktur Organisasi'),
    p(data.sectionProfile.organizational_structure || '-'),
    h2('1.5 Tugas Pokok dan Fungsi'),
    p(data.sectionProfile.main_duties || '-'),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ==========================================
  // BAB II: ANALISIS SITUASI
  // ==========================================
  sectionsChildren.push(
    h1('BAB II. ANALISIS SITUASI'),
    h2('2.1 Gambaran Kondisi Umum'),
    p(data.sectionProfile.general_conditions || '-'),
    h2('2.2 Analisis SWOT'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            tableCell('KEKUATAN (STRENGTHS)', true, 50),
            tableCell('KELEMAHAN (WEAKNESSES)', true, 50)
          ]
        }),
        new TableRow({
          children: [
            tableCell(data.sectionProfile.swot_strength || '-'),
            tableCell(data.sectionProfile.swot_weakness || '-')
          ]
        }),
        new TableRow({
          children: [
            tableCell('PELUANG (OPPORTUNITIES)', true, 50),
            tableCell('ANCAMAN (THREATS)', true, 50)
          ]
        }),
        new TableRow({
          children: [
            tableCell(data.sectionProfile.swot_opportunity || '-'),
            tableCell(data.sectionProfile.swot_threat || '-')
          ]
        })
      ]
    }),
    p('', false, 12, AlignmentType.LEFT, 140),
    h2('2.3 Sumber Daya Manusia Seksi'),
    p(`Total tenaga yang mengampu pelayanan pada 11 unit penunjang berjumlah ${data.staffingSummary.totalPegawai} orang (PNS: ${data.staffingSummary.totalPns}, PPPK: ${data.staffingSummary.totalPppk}, THL: ${data.staffingSummary.totalThl}, Kontrak: ${data.staffingSummary.totalKontrak}), dengan total analisis kebutuhan tenaga sebanyak ${data.staffingSummary.totalKebutuhan} orang dan defisit kekurangan ${data.staffingSummary.totalKekurangan} orang.`),
    h2('2.4 Target Kinerja Unit'),
    p(`Seksi Penunjang menetapkan ${data.overallKpiStats.totalIndikator} indikator kinerja mutu. Hingga akhir Tahun ${year}, sebanyak ${data.overallKpiStats.totalTercapai} indikator (${data.overallKpiStats.persenTercapai}%) berhasil mencapai target kinerja, ${data.overallKpiStats.totalMendekati} indikator mendekati target, dan ${data.overallKpiStats.totalTidakTercapai} indikator belum mencapai target.`),
    h2('2.5 Permasalahan dan Isu Strategis'),
    p(data.sectionProfile.strategic_issues || '-'),
    h2('2.6 Rencana Kerja Seksi'),
    p('Konsolidasi rencana strategis Seksi Penunjang untuk tahun berikutnya:')
  );

  // Section plans table
  if (data.sectionPlans && data.sectionPlans.length > 0) {
    const planRows = [
      new TableRow({
        children: [
          tableCell('No', true, 5, AlignmentType.CENTER),
          tableCell('Program / Rencana Strategis', true, 30),
          tableCell('Akar Masalah / Latar Belakang', true, 25),
          tableCell('Target Waktu', true, 15, AlignmentType.CENTER),
          tableCell('Kebutuhan Sumber Daya', true, 15),
          tableCell('Prioritas', true, 10, AlignmentType.CENTER)
        ]
      })
    ];

    data.sectionPlans.forEach((plan, idx) => {
      planRows.push(
        new TableRow({
          children: [
            tableCell(String(idx + 1), false, 5, AlignmentType.CENTER),
            tableCell(plan.strategic_action || plan.section_plan_title),
            tableCell(plan.problem || '-'),
            tableCell(plan.target_completion || '-', false, 15, AlignmentType.CENTER),
            tableCell(plan.resource_needs || '-'),
            tableCell(plan.priority || 'Sedang', false, 10, AlignmentType.CENTER)
          ]
        })
      );
    });

    sectionsChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: planRows }));
  } else {
    sectionsChildren.push(p('Belum ada rencana kerja strategis seksi yang difinalisasi.'));
  }

  sectionsChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // ==========================================
  // BAB III: LAPORAN PROGRAM UNIT PENUNJANG
  // ==========================================
  sectionsChildren.push(
    h1('BAB III. LAPORAN PROGRAM UNIT PENUNJANG'),
    p('Berikut rincian laporan program kerja, komposisi SDM, capaian KPI, hambatan, serta rencana kerja pada masing-masing 11 unit penunjang:')
  );

  ACTIVE_MASTER_UNITS.forEach((unit, unitIdx) => {
    const uNum = `3.${unitIdx + 1}`;
    const prof = data.unitProfiles[unit.id] || {};
    const staffing = data.unitStaffing[unit.id] || [];
    const auths = data.unitAuthorities[unit.id] || [];
    const progs = data.unitProgramTables[unit.id] || [];
    const kpis = data.kpiSummaries[unit.id] || [];
    const obstacles = data.unitObstacles[unit.id] || [];
    const plans = data.unitPlans[unit.id] || [];

    sectionsChildren.push(
      h2(`${uNum} Unit ${unit.name}`),
      
      // A. Profil Unit
      h3('A. Profil Unit'),
      p(`Gambaran Umum: ${prof.unit_overview || '-'}`),
      p(`Tugas Pokok & Fungsi: ${prof.main_duties || '-'}`),
      p(`Ruang Lingkup & Jenis Pelayanan: ${prof.service_scope || '-'} (${prof.service_types || '-'})`),
      p(`Jam Operasional: ${prof.operating_hours || '-'}`),
      p(`Sarana & Prasarana: ${prof.facilities || '-'}`),

      // B. SDM Unit & Pembagian Tugas
      h3('B. SDM Unit dan Pembagian Tugas Staf')
    );

    if (staffing.length > 0) {
      const sRows = [
        new TableRow({
          children: [
            tableCell('No', true, 5, AlignmentType.CENTER),
            tableCell('Nama Pegawai', true, 25),
            tableCell('Pendidikan', true, 15),
            tableCell('Profesi / Posisi', true, 25),
            tableCell('Status', true, 15, AlignmentType.CENTER),
            tableCell('Tersedia', true, 8, AlignmentType.CENTER),
            tableCell('Kebutuhan', true, 7, AlignmentType.CENTER)
          ]
        })
      ];
      staffing.forEach((s, sIdx) => {
        sRows.push(
          new TableRow({
            children: [
              tableCell(String(sIdx + 1), false, 5, AlignmentType.CENTER),
              tableCell(s.employee_name),
              tableCell(s.education || '-'),
              tableCell(`${s.profession || ''} / ${s.position || ''}`),
              tableCell(s.employment_status || 'PNS', false, 15, AlignmentType.CENTER),
              tableCell(String(s.available_count || 1), false, 8, AlignmentType.CENTER),
              tableCell(String(s.required_count || 1), false, 7, AlignmentType.CENTER)
            ]
          })
        );
      });
      sectionsChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: sRows }));
    } else {
      sectionsChildren.push(p('Data SDM unit belum diinput.'));
    }

    if (auths.length > 0) {
      p('Pembagian Tugas dan Kewenangan:', true, 20);
      const aRows = [
        new TableRow({
          children: [
            tableCell('No', true, 5, AlignmentType.CENTER),
            tableCell('Nama Staf', true, 25),
            tableCell('Jabatan', true, 20),
            tableCell('Tugas Pokok & Tanggung Jawab', true, 30),
            tableCell('Kewenangan', true, 20)
          ]
        })
      ];
      auths.forEach((a, aIdx) => {
        aRows.push(
          new TableRow({
            children: [
              tableCell(String(aIdx + 1), false, 5, AlignmentType.CENTER),
              tableCell(a.employee_name),
              tableCell(a.position || '-'),
              tableCell(`${a.main_duties || ''} ${a.responsibilities ? ' | ' + a.responsibilities : ''}`),
              tableCell(a.authorities || '-')
            ]
          })
        );
      });
      sectionsChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: aRows }));
    }

    // C. Program dan Kegiatan Unit (Dynamic Table Builder)
    sectionsChildren.push(h3('C. Program dan Kegiatan Unit'));
    if (progs.length > 0) {
      progs.forEach(prog => {
        sectionsChildren.push(p(`Tabel: ${prog.table_title}`, true, 20));
        const cols = prog.columns_definition || [];
        const rows = prog.rows_data || [];

        if (cols.length > 0) {
          const tRows = [
            new TableRow({
              children: cols.map(c => tableCell(c.label, true))
            })
          ];

          rows.forEach(r => {
            tRows.push(
              new TableRow({
                children: cols.map(c => tableCell(String(r[c.key] ?? '-')))
              })
            );
          });

          sectionsChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tRows }));
        }

        if (prog.analisa) {
          sectionsChildren.push(p(`Analisa Capaian: ${prog.analisa}`, false, 19));
        }
        if (prog.rekomendasi) {
          sectionsChildren.push(p(`Rekomendasi Tindak Lanjut: ${prog.rekomendasi}`, false, 19));
        }
      });
    } else {
      sectionsChildren.push(p('Belum ada tabel kegiatan dinamis yang dibuat unit ini.'));
    }

    // D. Capaian Kinerja KPI Unit
    sectionsChildren.push(h3('D. Capaian Kinerja KPI Unit'));
    if (kpis.length > 0) {
      const kpiRows = [
        new TableRow({
          children: [
            tableCell('No', true, 5, AlignmentType.CENTER),
            tableCell('Kode', true, 15),
            tableCell('Indikator Mutu', true, 35),
            tableCell('Target', true, 15, AlignmentType.CENTER),
            tableCell('Realisasi', true, 15, AlignmentType.CENTER),
            tableCell('Status', true, 15, AlignmentType.CENTER)
          ]
        })
      ];

      kpis.forEach((k, kIdx) => {
        kpiRows.push(
          new TableRow({
            children: [
              tableCell(String(kIdx + 1), false, 5, AlignmentType.CENTER),
              tableCell(k.kode),
              tableCell(k.nama),
              tableCell(`${k.target}${k.satuan}`, false, 15, AlignmentType.CENTER),
              tableCell(k.months_reported > 0 ? `${k.capaian_annual}${k.satuan}` : 'Belum Ada', false, 15, AlignmentType.CENTER),
              tableCell(k.status, false, 15, AlignmentType.CENTER)
            ]
          })
        );
      });
      sectionsChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: kpiRows }));
    } else {
      sectionsChildren.push(p('Belum ada indikator KPI aktif untuk unit ini.'));
    }

    // E. Hambatan dan Permasalahan
    sectionsChildren.push(h3('E. Hambatan dan Permasalahan Unit'));
    if (obstacles.length > 0) {
      const obsRows = [
        new TableRow({
          children: [
            tableCell('No', true, 5, AlignmentType.CENTER),
            tableCell('Permasalahan', true, 25),
            tableCell('Kategori', true, 15),
            tableCell('Akar Masalah', true, 25),
            tableCell('Dampak Pelayanan', true, 20),
            tableCell('Prioritas', true, 10, AlignmentType.CENTER)
          ]
        })
      ];
      obstacles.forEach((o, oIdx) => {
        obsRows.push(
          new TableRow({
            children: [
              tableCell(String(oIdx + 1), false, 5, AlignmentType.CENTER),
              tableCell(o.problem_title),
              tableCell(o.category),
              tableCell(o.root_cause || '-'),
              tableCell(o.service_impact || '-'),
              tableCell(o.priority || 'Sedang', false, 10, AlignmentType.CENTER)
            ]
          })
        );
      });
      sectionsChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: obsRows }));
    } else {
      sectionsChildren.push(p('Tidak ada hambatan signifikan yang dilaporkan.'));
    }

    // F. Rencana Kerja Unit
    sectionsChildren.push(h3('F. Rencana Kerja Unit'));
    if (plans.length > 0) {
      const pRows = [
        new TableRow({
          children: [
            tableCell('No', true, 5, AlignmentType.CENTER),
            tableCell('Rencana Tindakan / Kegiatan', true, 30),
            tableCell('Masalah Terkait', true, 20),
            tableCell('Target Waktu', true, 15, AlignmentType.CENTER),
            tableCell('Kebutuhan Sumber Daya', true, 20),
            tableCell('Indikator Keberhasilan', true, 10)
          ]
        })
      ];
      plans.forEach((pl, plIdx) => {
        pRows.push(
          new TableRow({
            children: [
              tableCell(String(plIdx + 1), false, 5, AlignmentType.CENTER),
              tableCell(pl.action_plan),
              tableCell(pl.problem || '-'),
              tableCell(pl.target_completion || '-', false, 15, AlignmentType.CENTER),
              tableCell(pl.resource_needs || '-'),
              tableCell(pl.success_indicator || '-')
            ]
          })
        );
      });
      sectionsChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: pRows }));
    } else {
      sectionsChildren.push(p('Rencana kerja unit belum diisi.'));
    }

    sectionsChildren.push(p('', false, 12, AlignmentType.LEFT, 180));
  });

  sectionsChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // ==========================================
  // BAB IV: CAPAIAN KINERJA UNIT PENUNJANG
  // ==========================================
  sectionsChildren.push(
    h1('BAB IV. CAPAIAN KINERJA UNIT PENUNJANG'),
    p(`Rekapitulasi total capaian indikator mutu seluruh unit penunjang selama Tahun ${year}:`),
    p(`• Total Indikator: ${data.overallKpiStats.totalIndikator}`),
    p(`• Indikator Tercapai: ${data.overallKpiStats.totalTercapai} (${data.overallKpiStats.persenTercapai}%)`),
    p(`• Indikator Mendekati Target: ${data.overallKpiStats.totalMendekati}`),
    p(`• Indikator Belum Tercapai: ${data.overallKpiStats.totalTidakTercapai}`),
    p(`• Indikator Belum Melapor: ${data.overallKpiStats.totalBelumMelapor}`)
  );

  // Consolidated KPI Table
  const allKpiRows = [
    new TableRow({
      children: [
        tableCell('No', true, 5, AlignmentType.CENTER),
        tableCell('Unit Kerja', true, 20),
        tableCell('Kode', true, 15),
        tableCell('Indikator Mutu', true, 30),
        tableCell('Target', true, 10, AlignmentType.CENTER),
        tableCell('Realisasi', true, 10, AlignmentType.CENTER),
        tableCell('Status', true, 10, AlignmentType.CENTER)
      ]
    })
  ];

  let kpiCounter = 1;
  ACTIVE_MASTER_UNITS.forEach(u => {
    const list = data.kpiSummaries[u.id] || [];
    list.forEach(k => {
      allKpiRows.push(
        new TableRow({
          children: [
            tableCell(String(kpiCounter++), false, 5, AlignmentType.CENTER),
            tableCell(u.name),
            tableCell(k.kode),
            tableCell(k.nama),
            tableCell(`${k.target}${k.satuan}`, false, 10, AlignmentType.CENTER),
            tableCell(k.months_reported > 0 ? `${k.capaian_annual}${k.satuan}` : '-', false, 10, AlignmentType.CENTER),
            tableCell(k.status, false, 10, AlignmentType.CENTER)
          ]
        })
      );
    });
  });

  sectionsChildren.push(
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: allKpiRows }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ==========================================
  // BAB V: PENUTUP & TANDA TANGAN
  // ==========================================
  sectionsChildren.push(
    h1('BAB V. PENUTUP'),
    h2('5.1 Kesimpulan'),
    p(data.sectionProfile.conclusion || '-'),
    h2('5.2 Rekomendasi'),
    p(data.sectionProfile.recommendation || '-'),
    h2('5.3 Rencana Perbaikan'),
    p(data.sectionProfile.improvement_plan || '-'),
    new Paragraph({ spacing: { before: 400 } }),
    
    // Tanda Tangan
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              children: [new Paragraph({})]
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              children: [
                p(`Sukabumi, 31 Desember ${year}`, false, 20, AlignmentType.CENTER, 40),
                p(pejabatJabatan, true, 20, AlignmentType.CENTER, 40),
                p('UOBK RSUD Al-Mulk Kota Sukabumi', false, 18, AlignmentType.CENTER, 600),
                p(pejabatNama, true, 22, AlignmentType.CENTER, 20),
                p(`NIP. ${pejabatNip}`, false, 20, AlignmentType.CENTER, 0)
              ]
            })
          ]
        })
      ]
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.2),
              right: convertInchesToTwip(1)
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Laporan Tahunan Seksi Penunjang RSUD Al-Mulk - Tahun ${year}`,
                    size: 16,
                    color: '94A3B8',
                    font: bodyFont
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Halaman ', size: 16, color: '94A3B8' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '94A3B8' }),
                  new TextRun({ text: ' dari ', size: 16, color: '94A3B8' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '94A3B8' })
                ]
              })
            ]
          })
        },
        children: sectionsChildren
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Laporan_Tahunan_Seksi_Penunjang_RSUD_Al-Mulk_${year}.docx`);
}
