"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  AnnualUnitProgramTable,
  DynamicTableColumn
} from '@/lib/annualReportTypes';
import { getDefaultProgramTableForUnit } from '@/lib/defaultUnitPrograms';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  ArrowLeft,
  ArrowRight,
  Table as TableIcon,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  FileText,
  CheckCircle2,
  UploadCloud,
  Download,
  FileCheck,
  Check,
  X
} from 'lucide-react';
import Swal from 'sweetalert2';

interface DynamicTableBuilderProps {
  tables: AnnualUnitProgramTable[];
  unitId: string;
  reportId: string;
  readOnly?: boolean;
  onSaveTable: (table: AnnualUnitProgramTable) => Promise<boolean>;
  onDeleteTable: (tableId: string) => Promise<boolean>;
}

export default function DynamicTableBuilder({
  tables,
  unitId,
  reportId,
  readOnly = false,
  onSaveTable,
  onDeleteTable
}: DynamicTableBuilderProps) {
  // Ensure we always have at least one table
  const initialList = tables.length > 0 ? tables : [getDefaultProgramTableForUnit(reportId, unitId)];
  const [currentTables, setCurrentTables] = useState<AnnualUnitProgramTable[]>(initialList);
  const [activeTableId, setActiveTableId] = useState<string>(initialList[0]?.id || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Column Modal State
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<{
    isNew: boolean;
    colKey: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'textarea';
    align: 'left' | 'center' | 'right';
  } | null>(null);

  // Excel Upload States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'new_table' | 'replace_active'>('new_table');
  const [parsedExcel, setParsedExcel] = useState<{
    fileName: string;
    sheetName: string;
    tableTitle: string;
    columns: DynamicTableColumn[];
    rows: Record<string, any>[];
  } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync ONLY when tables prop length changes from parent or when switching units
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (tables.length > 0) {
      setCurrentTables(tables);
      if (!tables.some(t => t.id === activeTableId)) {
        setActiveTableId(tables[0].id);
      }
    }
  }, [tables, unitId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const activeTable = currentTables.find(t => t.id === activeTableId) || currentTables[0];

  const markUnsaved = (tableId: string) => {
    setHasUnsavedChanges(prev => ({ ...prev, [tableId]: true }));
  };

  const markSaved = (tableId: string) => {
    setHasUnsavedChanges(prev => ({ ...prev, [tableId]: false }));
  };

  // 1. CREATE NEW TABLE
  const handleAddNewTable = async () => {
    const newId = `tbl-${reportId}-${unitId}-${Date.now()}`;
    const newTable: AnnualUnitProgramTable = {
      id: newId,
      report_id: reportId,
      unit_id: unitId,
      table_title: `Tabel Kegiatan ${currentTables.length + 1}`,
      columns_definition: [
        { key: 'c1', label: 'No', type: 'number', width: 60, align: 'center' },
        { key: 'c2', label: 'Program Kerja', type: 'text', width: 220, align: 'left' },
        { key: 'c3', label: 'Kegiatan Operasional', type: 'text', width: 260, align: 'left' },
        { key: 'c4', label: 'Target / Output', type: 'text', width: 140, align: 'left' },
        { key: 'c5', label: 'Realisasi / Hasil', type: 'text', width: 140, align: 'left' },
        { key: 'c6', label: 'Keterangan', type: 'text', width: 180, align: 'left' }
      ],
      rows_data: [
        {
          c1: 1,
          c2: 'Peningkatan mutu layanan',
          c3: 'Monitoring operasional rutin',
          c4: '100% terlaksana',
          c5: '100% tercapai',
          c6: 'Sesuai standar operasional'
        }
      ],
      analisa: '',
      rekomendasi: '',
      sort_order: currentTables.length + 1
    };

    const next = [...currentTables, newTable];
    setCurrentTables(next);
    setActiveTableId(newId);

    // Save immediately so it's persisted in parent state & DB
    await onSaveTable(newTable);
    markSaved(newId);

    Swal.fire({
      icon: 'success',
      title: 'Tabel Baru Dibuat',
      text: `Format "${newTable.table_title}" telah ditambahkan dan siap diisi.`,
      timer: 1200,
      showConfirmButton: false
    });
  };

  // 2. RESET TO OFFICIAL TEMPLATE
  const handleResetToDefaultTemplate = async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Gunakan Template Standar Unit?',
      text: 'Sistem akan memuat format tabel dan kegiatan resmi standar RSUD Al-Mulk untuk unit ini.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0D5C75',
      confirmButtonText: 'Ya, Terapkan Template'
    });

    if (!isConfirmed) return;

    const defaultTbl = getDefaultProgramTableForUnit(reportId, unitId);
    const next = [defaultTbl];
    setCurrentTables(next);
    setActiveTableId(defaultTbl.id);
    await onSaveTable(defaultTbl);
    markSaved(defaultTbl.id);

    Swal.fire({
      icon: 'success',
      title: 'Template Diterapkan',
      text: `Tabel standar untuk unit ${unitId} berhasil dimuat.`,
      timer: 1200,
      showConfirmButton: false
    });
  };

  // 2b. DOWNLOAD EXCEL TEMPLATE
  const handleDownloadTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();
      const sampleData = [
        ['No', 'Program Kerja', 'Kegiatan Operasional', 'Target / Sasaran', 'Realisasi Capaian', 'Keterangan'],
        [1, 'Peningkatan Mutu Pelayanan', 'Monitoring kepatuhan SOP pelayanan harian', '100% setiap hari', '100% tercapai', 'Terdokumentasi lengkap'],
        [2, 'Pemeliharaan Sarana & Alat', 'Kalibrasi dan pemeliharaan alat secara berkala', '12 Bulan', 'Terlaksana rutin', 'Sertifikat kalibrasi aktif'],
        [3, 'Peningkatan Kompetensi Petugas', 'Pelatihan in-house training dan seminar ilmiah', '2 Sesi / tahun', '2 Sesi terlaksana', 'Evaluasi kompetensi baik']
      ];
      const ws = XLSX.utils.aoa_to_sheet(sampleData);
      XLSX.utils.book_append_sheet(wb, ws, 'Program & Kegiatan');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Template_Tabel_Kegiatan_${unitId}.xlsx`);
    } catch (err: any) {
      Swal.fire('Error', 'Gagal mengunduh template Excel: ' + (err?.message || ''), 'error');
    }
  };

  // 2c. PARSE UPLOADED EXCEL FILE
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
    setIsParsing(true);

    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      const workbook = XLSX.read(data, { type: 'array' });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('File Excel tidak memiliki lembar kerja (sheet).');
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (!rawRows || rawRows.length === 0) {
        throw new Error('Lembar kerja Excel kosong.');
      }

      // Find first row with at least 2 non-empty cells as headers
      let headerIdx = rawRows.findIndex(
        r => Array.isArray(r) && r.filter(c => c !== null && c !== undefined && String(c).trim() !== '').length >= 2
      );
      if (headerIdx === -1) headerIdx = 0;

      const headerRow = rawRows[headerIdx] || [];
      const cols: DynamicTableColumn[] = [];

      headerRow.forEach((cVal: any, idx: number) => {
        const strVal = cVal !== undefined && cVal !== null ? String(cVal).trim() : `Kolom ${idx + 1}`;
        const finalLabel = strVal || `Kolom ${idx + 1}`;
        const lower = finalLabel.toLowerCase();
        const isDate = lower.includes('tanggal') || lower.includes('date') || lower.includes('tgl');
        const isNum = lower === 'no' || lower === 'no.' || lower.includes('jumlah') || lower.includes('target');
        cols.push({
          key: `c${idx + 1}`,
          label: finalLabel,
          type: isDate ? 'date' : isNum ? 'number' : 'text',
          width: lower === 'no' || lower === 'no.' ? 60 : 180,
          align: lower === 'no' || lower === 'no.' ? 'center' : 'left'
        });
      });

      if (cols.length === 0) {
        cols.push(
          { key: 'c1', label: 'No', type: 'number', width: 60, align: 'center' },
          { key: 'c2', label: 'Program / Kegiatan', type: 'text', width: 220, align: 'left' }
        );
      }

      // Extract data rows
      const extractedRows: Record<string, any>[] = [];
      for (let r = headerIdx + 1; r < rawRows.length; r++) {
        const rowArr = rawRows[r];
        if (!rowArr || !Array.isArray(rowArr)) continue;
        const hasContent = rowArr.some(c => c !== null && c !== undefined && String(c).trim() !== '');
        if (!hasContent) continue;

        const rowObj: Record<string, any> = {};
        cols.forEach((col, cIdx) => {
          const val = rowArr[cIdx];
          rowObj[col.key] = val !== undefined && val !== null ? val : '';
        });
        extractedRows.push(rowObj);
      }

      const defaultTitle = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      setParsedExcel({
        fileName: file.name,
        sheetName,
        tableTitle: defaultTitle || `Tabel Impor Excel ${currentTables.length + 1}`,
        columns: cols,
        rows: extractedRows
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membaca File Excel',
        text: err?.message || 'Pastikan file berekstensi .xlsx atau .xls dengan susunan tabel yang benar.'
      });
      setExcelFile(null);
      setParsedExcel(null);
    } finally {
      setIsParsing(false);
    }
  };

  // 2d. APPLY EXCEL IMPORT TO DYNAMIC TABLE BUILDER
  const handleApplyExcelImport = async () => {
    if (!parsedExcel) return;

    if (importMode === 'new_table') {
      const newId = `tbl-${reportId}-${unitId}-${Date.now()}`;
      const newTable: AnnualUnitProgramTable = {
        id: newId,
        report_id: reportId,
        unit_id: unitId,
        table_title: parsedExcel.tableTitle,
        columns_definition: parsedExcel.columns,
        rows_data: parsedExcel.rows,
        analisa: '',
        rekomendasi: '',
        sort_order: currentTables.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const next = [...currentTables, newTable];
      setCurrentTables(next);
      setActiveTableId(newId);
      await onSaveTable(newTable);
      markSaved(newId);

      Swal.fire({
        icon: 'success',
        title: 'Tabel Baru Berhasil Diimpor',
        text: `Tabel "${newTable.table_title}" dengan ${parsedExcel.rows.length} baris data berhasil dibuat dari Excel.`,
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      if (!activeTable) return;
      const updatedTable: AnnualUnitProgramTable = {
        ...activeTable,
        table_title: parsedExcel.tableTitle || activeTable.table_title,
        columns_definition: parsedExcel.columns,
        rows_data: parsedExcel.rows,
        updated_at: new Date().toISOString()
      };

      const next = currentTables.map(t => (t.id === activeTable.id ? updatedTable : t));
      setCurrentTables(next);
      await onSaveTable(updatedTable);
      markSaved(activeTable.id);

      Swal.fire({
        icon: 'success',
        title: 'Tabel Berhasil Diperbarui',
        text: `Data pada tabel "${updatedTable.table_title}" telah digantikan dengan data dari file Excel.`,
        timer: 1500,
        showConfirmButton: false
      });
    }

    setIsUploadModalOpen(false);
    setExcelFile(null);
    setParsedExcel(null);
  };

  // 3. UPDATE TABLE TITLE
  const handleUpdateTitle = (title: string) => {
    if (!activeTable) return;
    const next = currentTables.map(t => {
      if (t.id === activeTable.id) {
        return { ...t, table_title: title };
      }
      return t;
    });
    setCurrentTables(next);
    markUnsaved(activeTable.id);
  };

  // 3b. UPDATE ANALISA & REKOMENDASI
  const handleUpdateAnalisa = (analisa: string) => {
    if (!activeTable) return;
    const next = currentTables.map(t => {
      if (t.id === activeTable.id) {
        return { ...t, analisa };
      }
      return t;
    });
    setCurrentTables(next);
    markUnsaved(activeTable.id);
  };

  const handleUpdateRekomendasi = (rekomendasi: string) => {
    if (!activeTable) return;
    const next = currentTables.map(t => {
      if (t.id === activeTable.id) {
        return { ...t, rekomendasi };
      }
      return t;
    });
    setCurrentTables(next);
    markUnsaved(activeTable.id);
  };

  // 4. OPEN COLUMN MODAL (ADD OR EDIT)
  const handleOpenAddColumn = () => {
    setEditingCol({
      isNew: true,
      colKey: `c_${Date.now().toString(36)}`,
      label: '',
      type: 'text',
      align: 'left'
    });
    setIsColModalOpen(true);
  };

  const handleOpenEditColumn = (col: DynamicTableColumn) => {
    setEditingCol({
      isNew: false,
      colKey: col.key,
      label: col.label,
      type: (col.type as any) || 'text',
      align: col.align || 'left'
    });
    setIsColModalOpen(true);
  };

  // 5. SAVE COLUMN MODAL
  const handleSaveColumnModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTable || !editingCol || !editingCol.label.trim()) return;

    let nextCols: DynamicTableColumn[] = [];

    if (editingCol.isNew) {
      const newCol: DynamicTableColumn = {
        key: editingCol.colKey,
        label: editingCol.label.trim(),
        type: editingCol.type,
        align: editingCol.align,
        width: editingCol.type === 'number' ? 80 : 180
      };
      nextCols = [...activeTable.columns_definition, newCol];
    } else {
      nextCols = activeTable.columns_definition.map(c => {
        if (c.key === editingCol.colKey) {
          return {
            ...c,
            label: editingCol.label.trim(),
            type: editingCol.type,
            align: editingCol.align
          };
        }
        return c;
      });
    }

    const next = currentTables.map(t => {
      if (t.id === activeTable.id) {
        return { ...t, columns_definition: nextCols };
      }
      return t;
    });

    setCurrentTables(next);
    markUnsaved(activeTable.id);
    setIsColModalOpen(false);
    setEditingCol(null);
  };

  // 6. DELETE COLUMN
  const handleDeleteColumn = (colKey: string) => {
    if (!activeTable || activeTable.columns_definition.length <= 1) {
      Swal.fire('Perhatian', 'Tabel harus memiliki minimal 1 kolom.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Hapus Kolom?',
      text: 'Semua isian pada kolom ini akan dihapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus'
    }).then(res => {
      if (res.isConfirmed) {
        const nextCols = activeTable.columns_definition.filter(c => c.key !== colKey);
        const nextRows = (activeTable.rows_data || []).map(r => {
          const newRow = { ...r };
          delete newRow[colKey];
          return newRow;
        });

        const next = currentTables.map(t => {
          if (t.id === activeTable.id) {
            return { ...t, columns_definition: nextCols, rows_data: nextRows };
          }
          return t;
        });
        setCurrentTables(next);
        markUnsaved(activeTable.id);
      }
    });
  };

  // 7. MOVE COLUMN LEFT / RIGHT
  const handleMoveColumn = (index: number, direction: 'left' | 'right') => {
    if (!activeTable) return;
    const cols = [...activeTable.columns_definition];
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cols.length) return;

    const temp = cols[index];
    cols[index] = cols[targetIdx];
    cols[targetIdx] = temp;

    const next = currentTables.map(t => {
      if (t.id === activeTable.id) {
        return { ...t, columns_definition: cols };
      }
      return t;
    });
    setCurrentTables(next);
    markUnsaved(activeTable.id);
  };

  // 8. ADD ROW
  const handleAddRow = () => {
    if (!activeTable) return;
    const newRow: Record<string, any> = {};
    activeTable.columns_definition.forEach(col => {
      if (col.key === 'c1' || col.label.toLowerCase() === 'no') {
        newRow[col.key] = (activeTable.rows_data?.length || 0) + 1;
      } else {
        newRow[col.key] = '';
      }
    });

    const nextRows = [...(activeTable.rows_data || []), newRow];
    const next = currentTables.map(t => {
      if (t.id === activeTable.id) {
        return { ...t, rows_data: nextRows };
      }
      return t;
    });
    setCurrentTables(next);
    markUnsaved(activeTable.id);
  };

  // 9. CELL CHANGE (Direct spreadsheet inline edit)
  const handleCellChange = (rowIndex: number, colKey: string, value: any) => {
    if (!activeTable) return;
    const nextRows = [...(activeTable.rows_data || [])];
    nextRows[rowIndex] = {
      ...nextRows[rowIndex],
      [colKey]: value
    };

    const next = currentTables.map(t => {
      if (t.id === activeTable.id) {
        return { ...t, rows_data: nextRows };
      }
      return t;
    });
    setCurrentTables(next);
    markUnsaved(activeTable.id);
  };

  // 10. DELETE ROW
  const handleDeleteRow = (rowIndex: number) => {
    if (!activeTable) return;
    const nextRows = activeTable.rows_data.filter((_, idx) => idx !== rowIndex);
    const noCol = activeTable.columns_definition.find(c => c.label.toLowerCase() === 'no' || c.key === 'c1');
    if (noCol) {
      nextRows.forEach((r, idx) => {
        r[noCol.key] = idx + 1;
      });
    }

    const next = currentTables.map(t => {
      if (t.id === activeTable.id) {
        return { ...t, rows_data: nextRows };
      }
      return t;
    });
    setCurrentTables(next);
    markUnsaved(activeTable.id);
  };

  // 11. SAVE ACTIVE TABLE TO BACKEND & STORE
  const handleSaveActiveTable = async () => {
    if (!activeTable) return;
    setIsSaving(true);
    try {
      const ok = await onSaveTable(activeTable);
      if (ok) {
        markSaved(activeTable.id);
        Swal.fire({
          icon: 'success',
          title: 'Tabel Berhasil Disimpan',
          text: `Perubahan data pada "${activeTable.table_title}" telah tersimpan di sistem.`,
          timer: 1400,
          showConfirmButton: false
        });
      } else {
        Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan tabel.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // 12. DELETE ENTIRE ACTIVE TABLE
  const handleDeleteActiveTable = () => {
    if (!activeTable) return;
    Swal.fire({
      title: 'Hapus Tabel Ini?',
      text: `Tabel "${activeTable.table_title}" beserta seluruh datanya akan dihapus.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus'
    }).then(async res => {
      if (res.isConfirmed) {
        const ok = await onDeleteTable(activeTable.id);
        if (ok) {
          const next = currentTables.filter(t => t.id !== activeTable.id);
          if (next.length === 0) {
            const fallback = getDefaultProgramTableForUnit(reportId, unitId);
            await onSaveTable(fallback);
            setCurrentTables([fallback]);
            setActiveTableId(fallback.id);
          } else {
            setCurrentTables(next);
            setActiveTableId(next[0].id);
          }
          Swal.fire('Dihapus', 'Tabel berhasil dihapus.', 'success');
        }
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-teal-600 rounded-xl text-white shadow-sm">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              DYNAMIC TABLE BUILDER – Program & Kegiatan Unit
              {activeTable && hasUnsavedChanges[activeTable.id] ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                  <AlertCircle size={12} /> Perubahan Belum Disimpan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle size={12} /> Tersimpan
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Setiap unit bebas menyusun kolom, baris, target, dan realisasi program sesuai karakteristik layanannya.
            </p>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefaultTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all"
              title="Kembalikan format kegiatan standar untuk unit ini"
            >
              <RotateCcw size={13} className="text-slate-500" /> Template Standar
            </button>
            <button
              onClick={handleAddNewTable}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-teal-600/30 hover:bg-teal-50 text-teal-700 text-xs font-bold rounded-xl shadow-2xs transition-all"
            >
              <Plus size={14} className="text-teal-600" /> Tambah Tabel Baru
            </button>
            <button
              onClick={() => {
                setExcelFile(null);
                setParsedExcel(null);
                setImportMode('new_table');
                setIsUploadModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
              title="Unggah file Excel tabel kegiatan Anda sendiri (.xlsx / .xls)"
            >
              <UploadCloud size={14} className="text-emerald-700" /> Unggah Excel
            </button>
            {activeTable && (
              <button
                onClick={handleSaveActiveTable}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Save size={14} /> {isSaving ? 'Menyimpan...' : 'Simpan Tabel'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table Selector Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-100/70 px-4 pt-2.5 gap-1.5 overflow-x-auto">
        {currentTables.map((tbl, idx) => {
          const isActive = tbl.id === activeTable?.id;
          const isUnsaved = hasUnsavedChanges[tbl.id];
          return (
            <button
              key={tbl.id}
              onClick={() => setActiveTableId(tbl.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                isActive
                  ? 'bg-white text-teal-800 border-slate-200 border-b-white -mb-px shadow-sm'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <span>{tbl.table_title || `Tabel ${idx + 1}`}</span>
              {isUnsaved && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
            </button>
          );
        })}
      </div>

      {/* Main Table Content */}
      {activeTable ? (
        <div className="p-5 space-y-4">
          {/* Table Controls (Title & Action Buttons) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
            <div className="flex-1 min-w-[280px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Judul Tabel Kegiatan
              </label>
              <input
                type="text"
                value={activeTable.table_title}
                onChange={e => handleUpdateTitle(e.target.value)}
                disabled={readOnly}
                placeholder="Contoh: Program dan Kegiatan Pelayanan..."
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:bg-slate-100"
              />
            </div>

            {!readOnly && (
              <div className="flex items-center gap-2 self-end">
                <button
                  onClick={handleOpenAddColumn}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 border border-teal-300 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg shadow-2xs transition-all"
                >
                  <Plus size={14} /> Tambah Kolom
                </button>
                <button
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg shadow-2xs transition-all"
                >
                  <Plus size={14} /> Tambah Baris
                </button>
                <button
                  onClick={handleDeleteActiveTable}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-rose-50 border border-rose-300 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg shadow-2xs transition-all"
                  title="Hapus seluruh tabel ini"
                >
                  <Trash2 size={14} /> Hapus Tabel
                </button>
              </div>
            )}
          </div>

          {/* Interactive Spreadsheet Grid */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto max-h-[520px]">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  {!readOnly && (
                    <th className="p-3 text-center w-12 border-r border-slate-800 text-slate-400">
                      Aksi
                    </th>
                  )}
                  {activeTable.columns_definition.map((col, cIdx) => (
                    <th
                      key={col.key}
                      style={{ width: col.width ? `${col.width}px` : 'auto' }}
                      className="p-3 border-r border-slate-800 text-slate-100 group relative"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate font-extrabold text-sm text-teal-200">
                          {col.label}
                        </span>
                        {!readOnly && (
                          <div className="flex items-center gap-1 bg-slate-800/80 px-1 py-0.5 rounded">
                            {cIdx > 0 && (
                              <button
                                onClick={() => handleMoveColumn(cIdx, 'left')}
                                className="text-slate-400 hover:text-white p-0.5"
                                title="Geser kolom ke kiri"
                              >
                                <ArrowLeft size={12} />
                              </button>
                            )}
                            {cIdx < activeTable.columns_definition.length - 1 && (
                              <button
                                onClick={() => handleMoveColumn(cIdx, 'right')}
                                className="text-slate-400 hover:text-white p-0.5"
                                title="Geser kolom ke kanan"
                              >
                                <ArrowRight size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEditColumn(col)}
                              className="text-amber-400 hover:text-amber-300 p-0.5"
                              title="Pengaturan kolom"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteColumn(col.key)}
                              className="text-rose-400 hover:text-rose-300 p-0.5"
                              title="Hapus kolom"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                        Tipe: {col.type} | Alur: {col.align || 'left'}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {(activeTable.rows_data || []).length > 0 ? (
                  activeTable.rows_data.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-teal-50/30 transition-colors">
                      {!readOnly && (
                        <td className="p-2 text-center border-r border-slate-200 w-12 bg-slate-50/50">
                          <button
                            onClick={() => handleDeleteRow(rIdx)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all"
                            title="Hapus baris ini"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                      {activeTable.columns_definition.map(col => {
                        const cellVal = row[col.key] ?? '';
                        return (
                          <td
                            key={col.key}
                            className="p-1 border-r border-slate-200"
                            style={{ textAlign: col.align || 'left' }}
                          >
                            {readOnly ? (
                              <div className="px-3 py-2 text-slate-800 text-xs">
                                {cellVal || '-'}
                              </div>
                            ) : col.type === 'textarea' ? (
                              <textarea
                                rows={2}
                                value={cellVal}
                                onChange={e => handleCellChange(rIdx, col.key, e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-transparent hover:bg-slate-100/60 focus:bg-white focus:ring-2 focus:ring-teal-500/20 rounded border border-transparent focus:border-teal-500 outline-none text-xs text-slate-800 transition-all resize-y"
                                placeholder="..."
                              />
                            ) : (
                              <input
                                type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                                value={cellVal}
                                onChange={e => handleCellChange(rIdx, col.key, e.target.value)}
                                className="w-full px-2.5 py-2 bg-transparent hover:bg-slate-100/60 focus:bg-white focus:ring-2 focus:ring-teal-500/20 rounded border border-transparent focus:border-teal-500 outline-none text-xs text-slate-800 transition-all font-medium"
                                placeholder="..."
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={activeTable.columns_definition.length + (readOnly ? 0 : 1)}
                      className="p-12 text-center text-slate-400 text-xs"
                    >
                      Belum ada baris data. Klik tombol <b>&quot;Tambah Baris&quot;</b> di atas untuk mulai mengisi kegiatan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 pt-1 gap-2">
            <span className="font-semibold">
              Total: {activeTable.rows_data?.length || 0} baris data • {activeTable.columns_definition.length} kolom
            </span>
            <span className="text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              💡 Seluruh sel dapat diklik dan diedit langsung layaknya Microsoft Excel / Google Sheets.
            </span>
          </div>

          {/* ========================================================= */}
          {/* ANALISA & REKOMENDASI CAPAIAN PROGRAM DAN KEGIATAN        */}
          {/* ========================================================= */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    Analisa &amp; Rekomendasi Capaian Program / Kegiatan
                    {hasUnsavedChanges[activeTable.id] && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                        Belum Disimpan
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Isi analisa evaluasi ketercapaian dan rekomendasi tindak lanjut atas pelaksanaan kegiatan di atas.
                  </p>
                </div>
              </div>

              {!readOnly && (
                <button
                  type="button"
                  onClick={handleSaveActiveTable}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all disabled:opacity-50"
                >
                  <Save size={13} /> {isSaving ? 'Menyimpan...' : 'Simpan Analisa & Rekomendasi'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Kolom 1: Analisa Capaian */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText size={14} className="text-teal-600" />
                    1. Analisa Capaian Program &amp; Kegiatan
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Faktor pendukung &amp; kendala</span>
                </label>
                <textarea
                  rows={4}
                  disabled={readOnly}
                  value={activeTable.analisa || ''}
                  onChange={e => handleUpdateAnalisa(e.target.value)}
                  placeholder="Tuliskan analisa ketercapaian program dan kegiatan operasional ini (misalnya: faktor pendukung pencapaian target, kendala yang dihadapi di lapangan, evaluasi efektivitas kegiatan, dll)..."
                  className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-xl p-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none leading-relaxed transition-all resize-y disabled:bg-slate-100"
                />
              </div>

              {/* Kolom 2: Rekomendasi */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    2. Rekomendasi &amp; Tindak Lanjut
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Solusi &amp; rencana perbaikan</span>
                </label>
                <textarea
                  rows={4}
                  disabled={readOnly}
                  value={activeTable.rekomendasi || ''}
                  onChange={e => handleUpdateRekomendasi(e.target.value)}
                  placeholder="Tuliskan rekomendasi tindak lanjut perbaikan (misalnya: usulan penambahan fasilitas/alat, usulan pelatihan SDM, perbaikan koordinasi alur pelayanan, dsb)..."
                  className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-xl p-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none leading-relaxed transition-all resize-y disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 space-y-3">
          <TableIcon className="mx-auto text-slate-300" size={44} />
          <p className="text-sm font-semibold">Tabel kegiatan belum dimuat.</p>
          <button
            onClick={handleResetToDefaultTemplate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Sparkles size={15} /> Muat Format Standar Unit
          </button>
        </div>
      )}

      {/* Column Settings Modal */}
      {isColModalOpen && editingCol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveColumnModal}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-slate-800 text-sm">
                {editingCol.isNew ? 'Tambah Kolom Baru' : 'Pengaturan Kolom'}
              </h4>
              <button
                type="button"
                onClick={() => setIsColModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama / Label Kolom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editingCol.label}
                  onChange={e => setEditingCol({ ...editingCol, label: e.target.value })}
                  placeholder="Misal: Sasaran, Anggaran, Jadwal, PIC..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Data Kolom</label>
                <select
                  value={editingCol.type}
                  onChange={e => setEditingCol({ ...editingCol, type: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 outline-none"
                >
                  <option value="text">Teks Standar</option>
                  <option value="number">Angka / Numerik</option>
                  <option value="date">Tanggal</option>
                  <option value="textarea">Keterangan Panjang (Multi-line)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Perataan Teks</label>
                <select
                  value={editingCol.align}
                  onChange={e => setEditingCol({ ...editingCol, align: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 outline-none"
                >
                  <option value="left">Rata Kiri</option>
                  <option value="center">Rata Tengah</option>
                  <option value="right">Rata Kanan</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsColModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Simpan Kolom
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Excel Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">
                    Unggah Tabel Kegiatan dari File Excel
                  </h4>
                  <p className="text-xs text-slate-500">
                    Pilih untuk membuat tabel baru dari file Excel atau menimpa data tabel yang sedang aktif.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setExcelFile(null);
                  setParsedExcel(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Pemilihan (Buat Tabel Baru vs Gantikan) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Opsi Tindakan Impor:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                    importMode === 'new_table'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    value="new_table"
                    checked={importMode === 'new_table'}
                    onChange={() => setImportMode('new_table')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs block font-extrabold text-slate-900">
                      Buat Tabel Baru dari Excel (Rekomendasi)
                    </span>
                    <span className="text-[11px] font-normal text-slate-500 block mt-0.5">
                      Menambahkan tab tabel baru sehingga data tabel yang lama tetap tersimpan.
                    </span>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                    importMode === 'replace_active'
                      ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-bold'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    value="replace_active"
                    checked={importMode === 'replace_active'}
                    onChange={() => setImportMode('replace_active')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs block font-extrabold text-slate-900">
                      Ganti Data Tabel yang Sedang Aktif
                    </span>
                    <span className="text-[11px] font-normal text-slate-500 block mt-0.5">
                      Menggantikan kolom dan baris pada tabel &quot;{activeTable?.table_title}&quot;.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* File Drag and Drop Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pilih File Excel (.xlsx, .xls, .csv):
                </label>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-xs text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Download size={13} />
                  <span>Unduh Contoh Format Excel Standar</span>
                </button>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onClick={e => { (e.target as HTMLInputElement).value = ''; }}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 bg-white rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto shadow-xs text-emerald-600">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {excelFile ? excelFile.name : 'Klik untuk memilih atau seret file Excel ke sini'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mendukung format Microsoft Excel (.xlsx, .xls) dan CSV
                  </p>
                </div>
              </div>
            </div>

            {/* Parsed Preview Card */}
            {isParsing && (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs font-bold text-slate-600 animate-pulse">
                Sedang memproses dan membaca struktur tabel Excel...
              </div>
            )}

            {parsedExcel && !isParsing && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <FileCheck size={16} className="text-emerald-600" />
                    Hasil Pembacaan Excel ({parsedExcel.sheetName}):
                  </span>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                    {parsedExcel.columns.length} Kolom Terdeteksi &bull; {parsedExcel.rows.length} Baris Data
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Judul Tabel Hasil Impor:
                  </label>
                  <input
                    type="text"
                    value={parsedExcel.tableTitle}
                    onChange={e => setParsedExcel({ ...parsedExcel, tableTitle: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>

                {/* Preview Mini Table */}
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-48 bg-white">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold">
                        {parsedExcel.columns.map(c => (
                          <th key={c.key} className="p-2 border-r border-slate-700 whitespace-nowrap">
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedExcel.rows.slice(0, 4).map((r, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          {parsedExcel.columns.map(c => (
                            <td key={c.key} className="p-2 border-r border-slate-100 text-slate-700 whitespace-nowrap">
                              {String(r[c.key] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedExcel.rows.length > 4 && (
                  <p className="text-[10px] text-slate-500 italic text-center">
                    ... dan {parsedExcel.rows.length - 4} baris lainnya akan diimpor ke Dynamic Table Builder.
                  </p>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setExcelFile(null);
                  setParsedExcel(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!parsedExcel || isParsing}
                onClick={handleApplyExcelImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Terapkan &amp; Impor ke Dynamic Table Builder</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
