"use client";

import { useState, useEffect } from "react";
import { useAppStore, Capaian, Indikator, determineStatus } from "@/lib/store";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  UploadCloud, 
  History, 
  FileText, 
  ChevronDown, 
  X,
  FileSpreadsheet,
  Lock,
  ArrowRight
} from "lucide-react";
import Swal from "sweetalert2";

export default function InputDataPage() {
  const { 
    indikatorList, 
    capaianList, 
    addCapaian, 
    updateCapaian, 
    deleteCapaian, 
    currentUser 
  } = useAppStore();

  const [mounted, setMounted] = useState(false);
  
  // Form State
  const [selectedUnit, setSelectedUnit] = useState("Laboratorium");
  const [selectedIndikatorId, setSelectedIndikatorId] = useState("");
  const [bulan, setBulan] = useState(3); // default March
  const [tahun, setTahun] = useState(2026);
  const [numeratorVal, setNumeratorVal] = useState<number | "">("");
  const [denominatorVal, setDenominatorVal] = useState<number | "">("");
  const [keterangan, setKeterangan] = useState("");
  const [evidenFile, setEvidenFile] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Edit State (when editing previous inputs)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNilai, setFormNilai] = useState<number>(3);
  const [isManualScoreSet, setIsManualScoreSet] = useState(false);

  // Retrieve selected indicator metadata
  const activeIndikator = indikatorList.find(i => i.id === selectedIndikatorId);

  // Calculate live achievement
  const isMenit = activeIndikator?.satuan?.toLowerCase()?.includes("menit") || false;
  const calculatedCapaian = typeof numeratorVal === "number" && typeof denominatorVal === "number" && denominatorVal > 0
    ? (isMenit 
       ? Math.round((numeratorVal / denominatorVal) * 100) / 100 
       : Math.round(((numeratorVal / denominatorVal) * 100) * 100) / 100)
    : 0;

  const targetValue = activeIndikator?.target !== undefined ? activeIndikator.target : 95;
  const currentStatus = determineStatus(calculatedCapaian, targetValue, activeIndikator?.arah_target);

  const canEditScore = currentUser?.role === 'Super Admin' || currentUser?.role === 'Kepala Seksi' || currentUser?.role === 'Supervisor';

  useEffect(() => {
    setMounted(true);
    // If current user is restricted to a unit, pre-set it and freeze
    if (currentUser?.unit && currentUser?.role === 'Kepala Unit') {
      setSelectedUnit(currentUser.unit);
    }
  }, [currentUser]);

  // Sync recommended score when values change (only if manual has not been clicked, or if user cannot edit manually)
  useEffect(() => {
    if (!canEditScore || !isManualScoreSet) {
      if (activeIndikator && typeof numeratorVal === "number" && typeof denominatorVal === "number" && denominatorVal > 0) {
        const calculatedScore = currentStatus === 'Tercapai' ? 3 : currentStatus === 'Mendekati Target' ? 2 : 1;
        setFormNilai(calculatedScore);
      } else {
        setFormNilai(3);
      }
    }
  }, [currentStatus, activeIndikator, numeratorVal, denominatorVal, isManualScoreSet, canEditScore]);

  if (!mounted || !currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // Indonesian months mapper
  const monthsMap: { [key: number]: string } = {
    1: "Januari", 2: "Februari", 3: "Maret", 4: "April", 5: "Mei", 6: "Juni",
    7: "Juli", 8: "Agustus", 9: "September", 10: "Oktober", 11: "November", 12: "Desember"
  };

  const unitsList = [
    "Laboratorium", "Farmasi", "Rekam Medis", "Radiologi", "Mutu", "Gizi",
    "IT Rumah Sakit / ITRS", "IPSRS", "CSSD & Laundry", "Humas dan Pemasaran", "Kesehatan Lingkungan"
  ];

  // Filter indicators based on selected unit
  const filteredIndikators = indikatorList.filter(ind => ind.unit === selectedUnit && ind.status);

  // Drag and Drop simulated upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);
    setUploadError("");

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 80) {
          clearInterval(progressInterval);
          return 80;
        }
        return prev + 10;
      });
    }, 150);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (!response.ok) {
        if (isJson) {
          const errData = await response.json();
          throw new Error(errData.error || `Gagal mengunggah file (Status: ${response.status})`);
        } else {
          const text = await response.text();
          console.error("Non-JSON Error Response:", text);
          if (response.status === 413) {
            throw new Error("Ukuran file terlalu besar untuk diproses server (Maks. 10 MB).");
          }
          throw new Error(`Gagal mengunggah file ke server (Status: ${response.status}).`);
        }
      }

      if (!isJson) {
        throw new Error("Format respon server tidak valid (Bukan JSON).");
      }

      const data = await response.json();
      
      // Set the returned fileUrl as the evidence link
      setEvidenFile(data.url);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Berhasil mengunggah: ${file.name}`,
        showConfirmButton: false,
        timer: 1500
      });
    } catch (err: any) {
      console.error("Gagal mengunggah:", err);
      setUploadError(err.message || "Gagal mengunggah file.");
      Swal.fire({
        icon: 'error',
        title: 'Gagal Unggah',
        text: err.message || 'Gagal mengunggah file ke server.',
        confirmButtonColor: '#00A8A8'
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Reset form inputs
  const resetForm = () => {
    setEditingId(null);
    setNumeratorVal("");
    setDenominatorVal("");
    setKeterangan("");
    setEvidenFile("");
    setSelectedIndikatorId("");
    setFormNilai(3);
    setIsManualScoreSet(false);
  };

  // Save draft or Submit handler
  const saveInput = (statusSubmit: 'Draft' | 'Submitted') => {
    if (!selectedIndikatorId) {
      Swal.fire({
        icon: 'warning',
        title: 'Pilih Indikator',
        text: 'Anda harus memilih indikator KPI terlebih dahulu!',
        confirmButtonColor: '#00A8A8'
      });
      return;
    }
    if (numeratorVal === "" || denominatorVal === "") {
      Swal.fire({
        icon: 'warning',
        title: 'Lengkapi Data',
        text: 'Numerator dan denominator wajib diisi!',
        confirmButtonColor: '#00A8A8'
      });
      return;
    }
    if (Number(denominatorVal) <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Input Tidak Valid',
        text: 'Denominator harus bernilai lebih besar dari 0!',
        confirmButtonColor: '#00A8A8'
      });
      return;
    }

    const isDuplicate = capaianList.some(c => 
      c.indikator_id === selectedIndikatorId && 
      c.bulan === Number(bulan) && 
      c.tahun === Number(tahun) && 
      c.id !== editingId
    );

    if (isDuplicate) {
      Swal.fire({
        icon: 'error',
        title: 'Data Sudah Ada',
        text: `Data capaian untuk indikator ini pada periode ${monthsMap[bulan]} ${tahun} sudah diinput sebelumnya! Silakan edit data lama atau pilih periode lain.`,
        confirmButtonColor: '#00A8A8'
      });
      return;
    }

    const payload = {
      indikator_id: selectedIndikatorId,
      user_id: currentUser.id,
      bulan: Number(bulan),
      tahun: Number(tahun),
      numerator: Number(numeratorVal),
      denominator: Number(denominatorVal),
      target: targetValue,
      keterangan,
      eviden: evidenFile || "Eviden_Default_Upload.pdf",
      status_submit: statusSubmit,
      nilai: formNilai
    };

    if (editingId) {
      updateCapaian(editingId, payload);
      Swal.fire({
        icon: 'success',
        title: statusSubmit === 'Submitted' ? 'Berhasil Dikirim' : 'Berhasil Disimpan',
        text: statusSubmit === 'Submitted' ? 'Capaian KPI terkirim untuk verifikasi!' : 'Draf berhasil diperbarui.',
        showConfirmButton: false,
        timer: 1500
      });
    } else {
      addCapaian(payload);
      Swal.fire({
        icon: 'success',
        title: statusSubmit === 'Submitted' ? 'Capaian Terkirim' : 'Draf Disimpan',
        text: statusSubmit === 'Submitted' ? 'Capaian KPI berhasil disubmit ke database!' : 'Draf disimpan dengan aman.',
        showConfirmButton: false,
        timer: 1500
      });
    }

    resetForm();
  };

  // Edit preloaded entry handler
  const startEdit = (cap: Capaian) => {
    const ind = indikatorList.find(i => i.id === cap.indikator_id);
    if (!ind) return;

    // Check if user is restricted
    if (currentUser.role === 'Kepala Unit' && ind.unit !== currentUser.unit) {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Terbatas',
        text: 'Anda hanya dapat mengedit draf/realisasi milik unit Anda sendiri!',
        confirmButtonColor: '#00A8A8'
      });
      return;
    }

    setEditingId(cap.id);
    setSelectedUnit(ind.unit);
    setSelectedIndikatorId(cap.indikator_id);
    setBulan(cap.bulan);
    setTahun(cap.tahun);
    setNumeratorVal(cap.numerator);
    setDenominatorVal(cap.denominator);
    setKeterangan(cap.keterangan || "");
    setEvidenFile(cap.eviden || "");
    setFormNilai(cap.nilai !== undefined ? cap.nilai : (cap.status === 'Tercapai' ? 3 : cap.status === 'Mendekati Target' ? 2 : 1));
    setIsManualScoreSet(true);
    
    // Scroll to form smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete preloaded entry handler
  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'Hapus Capaian?',
      text: 'Apakah Anda yakin ingin menghapus catatan capaian KPI ini dari database?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteCapaian(id);
        Swal.fire({
          icon: 'success',
          title: 'Dihapus',
          text: 'Catatan capaian berhasil dihapus.',
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  };

  // Filtered Input History List
  const userHistoryList = capaianList.filter(cap => {
    const ind = indikatorList.find(i => i.id === cap.indikator_id);
    if (!ind) return false;
    // If Kepala Unit, only show history of their own unit
    if (currentUser.role === 'Kepala Unit') {
      return ind.unit === currentUser.unit;
    }
    return true; // Admin, Ka Seksi, Supervisor can see everything
  }).sort((a, b) => b.tahun - a.tahun || b.bulan - a.bulan);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      
      {/* Input Form Column */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-5 sm:p-6 space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
            {editingId ? "Ubah Entri Capaian KPI" : "Input Realisasi KPI Bulanan"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Formulir pelaporan indikator mutu kinerja seksi penunjang
          </p>
        </div>

        <div className="space-y-4">
          
          {/* Row 1: Bulan & Tahun */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Periode Bulan</label>
              <select 
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
              >
                {Object.entries(monthsMap).map(([num, name]) => (
                  <option key={num} value={num}>{name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Periode Tahun</label>
              <select 
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>

          {/* Row 2: Unit Kerja Selector */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Unit Kerja</label>
            <div className="relative">
              <select
                value={selectedUnit}
                onChange={(e) => {
                  setSelectedUnit(e.target.value);
                  setSelectedIndikatorId(""); // clear selected indicator
                }}
                disabled={currentUser?.role === 'Kepala Unit'}
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
              >
                {unitsList.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                <ChevronDown size={14} />
              </div>
            </div>
            {currentUser?.role === 'Kepala Unit' && (
              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1">
                <Lock size={10} className="text-teal-600 shrink-0" />
                <span>Unit Anda terkunci sesuai izin hak akses petugas.</span>
              </p>
            )}
          </div>

          {/* Row 3: Indikator Selector */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pilih Indikator KPI</label>
            <select
              value={selectedIndikatorId}
              onChange={(e) => setSelectedIndikatorId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
            >
              <option value="">-- Pilih Indikator Mutu Aktif --</option>
              {filteredIndikators.map(ind => (
                <option key={ind.id} value={ind.id}>{ind.kode}: {ind.nama}</option>
              ))}
            </select>
            {filteredIndikators.length === 0 && (
              <p className="text-[10px] text-red-500 font-bold mt-1">
                Belum ada Indikator aktif untuk unit ini. Daftarkan di menu &quot;Profil Indikator&quot; dahulu.
              </p>
            )}
          </div>

          {/* Numerator & Denominator Form Box */}
          {activeIndikator && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 animate-in fade-in duration-200">
              <div className="border-b pb-2">
                <span className="text-[10px] font-black px-2 py-0.5 bg-teal-50 text-teal-800 rounded uppercase">
                  Target KPI: {activeIndikator.target}{activeIndikator.satuan}
                </span>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Formula: {activeIndikator.formula}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wide">Numerator (Pembilang)</label>
                  <p className="text-[9px] text-slate-400 font-medium leading-tight mb-1">{activeIndikator.numerator}</p>
                  <input
                    type="number"
                    min={0}
                    value={numeratorVal}
                    onChange={(e) => setNumeratorVal(e.target.value !== "" ? Number(e.target.value) : "")}
                    placeholder="Masukkan angka pembilang"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wide">Denominator (Penyebut)</label>
                  <p className="text-[9px] text-slate-400 font-medium leading-tight mb-1">{activeIndikator.denominator}</p>
                  <input
                    type="number"
                    min={0}
                    value={denominatorVal}
                    onChange={(e) => setDenominatorVal(e.target.value !== "" ? Number(e.target.value) : "")}
                    placeholder="Masukkan angka penyebut"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Calculations Outcome Feedback */}
          {activeIndikator && typeof numeratorVal === "number" && typeof denominatorVal === "number" && denominatorVal > 0 && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
              currentStatus === 'Tercapai' 
                ? 'bg-green-50/50 border-green-200 text-green-800' 
                : currentStatus === 'Mendekati Target'
                  ? 'bg-amber-50/50 border-amber-200 text-amber-800'
                  : 'bg-red-50/50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-3">
                {currentStatus === 'Tercapai' ? (
                  <CheckCircle className="text-green-600 shrink-0" size={24} />
                ) : currentStatus === 'Mendekati Target' ? (
                  <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                ) : (
                  <XCircle className="text-red-500 shrink-0" size={24} />
                )}
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">Hasil Kalkulasi Capaian</p>
                  <p className="text-[10px] opacity-70">KPI status: <strong>{currentStatus}</strong></p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-3xl font-black">{calculatedCapaian}{activeIndikator.satuan || "%"}</span>
                <p className="text-[9px] opacity-60">Target: {activeIndikator.target}{activeIndikator.satuan || "%"}</p>
              </div>
            </div>
          )}

          {/* Pilihan Skor Penilaian Manual (0, 1, 2, 3) */}
          {activeIndikator && canEditScore && (
            <div className="space-y-2.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Skor Penilaian Mutu (Pilihan Manual)
                  </label>
                  <p className="text-[9px] text-slate-400 font-medium">
                    Tentukan kategori nilai untuk pencapaian indikator ini secara manual (0-3)
                  </p>
                </div>
                {isManualScoreSet && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualScoreSet(false);
                      const defaultScore = currentStatus === 'Tercapai' ? 3 : currentStatus === 'Mendekati Target' ? 2 : 1;
                      setFormNilai(defaultScore);
                    }}
                    className="text-[9px] bg-teal-50 text-[#00A8A8] hover:bg-teal-100 font-bold px-2 py-1 rounded-md transition-all self-start sm:self-center"
                  >
                    Reset ke Auto-Hitung
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((val) => {
                  let label = "";
                  let activeStyle = "";
                  let baseStyle = "border-slate-200 hover:bg-slate-100 text-slate-600 bg-white cursor-pointer";
                  
                  if (val === 3) {
                    label = "Sangat Baik";
                    activeStyle = "bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10";
                  } else if (val === 2) {
                    label = "Baik";
                    activeStyle = "bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/10";
                  } else if (val === 1) {
                    label = "Kurang";
                    activeStyle = "bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-500/10";
                  } else {
                    label = "Sangat Kurang";
                    activeStyle = "bg-slate-600 border-slate-600 text-white shadow-sm shadow-slate-600/10";
                  }

                  const isSelected = formNilai === val;

                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setFormNilai(val);
                        setIsManualScoreSet(true);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all h-14 cursor-pointer outline-none focus:ring-2 focus:ring-[#00A8A8]/30 ${
                        isSelected ? activeStyle : baseStyle
                      }`}
                    >
                      <span className="text-sm font-black">{val}</span>
                      <span className="text-[9px] font-bold tracking-tighter truncate w-full">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Keterangan / Analisis Masalah */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Analisis / Catatan Keterangan</label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Berikan analisis capaian (wajib diisi apabila target tidak tercapai)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:bg-white transition-all"
            />
          </div>

          {/* Drag & Drop File Upload component */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Unggah Eviden Bukti Dukung (PDF, JPG, PNG, XLSX)</label>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInputBtn')?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragOver ? 'border-[#00A8A8] bg-teal-50/20' : 'border-gray-200 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input 
                type="file" 
                id="fileInputBtn" 
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.xlsx"
                className="hidden" 
              />
              <UploadCloud className="text-slate-400 w-10 h-10" />
              <div className="text-xs text-slate-600 font-bold">
                Tarik & Lepas dokumen Anda di sini, atau <span className="text-[#00A8A8]">klik untuk telusuri</span>
              </div>
              <p className="text-[10px] text-slate-400">PDF, JPG, PNG, XLSX (Maks. 10MB)</p>
            </div>

            {/* Upload Progress Bar */}
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#00A8A8] h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}

            {/* Upload Error message */}
            {uploadError && (
              <p className="text-[10px] font-bold text-rose-500 mt-1">
                ⚠️ {uploadError}
              </p>
            )}

            {/* Uploaded File Indicator */}
            {evidenFile && (
              <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-between text-xs font-semibold text-teal-800">
                <div className="flex items-center space-x-2 truncate">
                  <FileText className="text-teal-600 shrink-0" size={16} />
                  <span className="truncate">{evidenFile}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setEvidenFile("")}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
          {editingId && (
            <button
              onClick={resetForm}
              className="px-4 py-2.5 border border-gray-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Batal Edit
            </button>
          )}

          <button
            onClick={() => saveInput('Draft')}
            className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Simpan Draft
          </button>

          <button
            onClick={() => saveInput('Submitted')}
            className="px-5 py-2.5 bg-[#00A8A8] hover:bg-[#008f8f] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-[#00A8A8]/10 transition-all cursor-pointer"
          >
            <CheckCircle size={15} />
            <span>Kirim Capaian (Submit)</span>
          </button>
        </div>
      </div>

      {/* History Log Column */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 border-b pb-3">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <History className="text-[#00A8A8] w-4.5 h-4.5 shrink-0" />
              <span>Riwayat Pengisian KPI</span>
            </h3>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black rounded uppercase">
              {currentUser.role === 'Kepala Unit' ? 'Unit Anda' : 'Semua Unit'}
            </span>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {userHistoryList.length === 0 ? (
              <div className="text-center p-8 text-slate-400 font-bold">
                <FileText size={36} className="mx-auto mb-2 text-slate-300" />
                <span>Belum ada riwayat pengisian.</span>
              </div>
            ) : (
              userHistoryList.map((cap) => {
                const ind = indikatorList.find(i => i.id === cap.indikator_id);
                if (!ind) return null;

                return (
                  <div key={cap.id} className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl transition-all space-y-2 relative group">
                    
                    {/* Period & Submission badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#00A8A8] uppercase">
                        {monthsMap[cap.bulan]} {cap.tahun}
                      </span>

                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase ${
                          cap.status_submit === 'Submitted' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {cap.status_submit}
                        </span>

                        <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase ${
                          cap.status === 'Tercapai' 
                            ? 'bg-green-100 text-green-700' 
                            : cap.status === 'Mendekati Target' 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {cap.status}
                        </span>

                        {canEditScore && (
                          <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase border ${
                            (cap.nilai !== undefined ? cap.nilai : (cap.status === 'Tercapai' ? 3 : cap.status === 'Mendekati Target' ? 2 : 1)) === 3
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : (cap.nilai !== undefined ? cap.nilai : (cap.status === 'Tercapai' ? 3 : cap.status === 'Mendekati Target' ? 2 : 1)) === 2
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : (cap.nilai !== undefined ? cap.nilai : (cap.status === 'Tercapai' ? 3 : cap.status === 'Mendekati Target' ? 2 : 1)) === 1
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            Skor: {cap.nilai !== undefined ? cap.nilai : (cap.status === 'Tercapai' ? 3 : cap.status === 'Mendekati Target' ? 2 : 1)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* KPI Details */}
                    <div>
                      <h4 className="text-xs font-black text-slate-800 line-clamp-1">{ind.kode}: {ind.nama}</h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-0.5">
                        <span>Unit: <strong>{ind.unit}</strong></span>
                        <span>&bull;</span>
                        <span>Kepala Unit: {ind.pic}</span>
                      </div>
                    </div>

                    {/* Numerical Data */}
                    <div className="flex items-center justify-between bg-white p-2 border border-slate-200/40 rounded-lg text-[10px] font-bold">
                      <span className="text-slate-500">Nilai: {cap.numerator} / {cap.denominator}</span>
                      {(() => {
                        const ind = indikatorList.find(i => i.id === cap.indikator_id);
                        const sat = ind?.satuan || '%';
                        return (
                          <span className="text-slate-800">
                            Capaian: <strong className="text-teal-600">{cap.capaian}{sat}</strong> (Target: {cap.target}{sat})
                          </span>
                        );
                      })()}
                    </div>

                    {/* Action buttons on hover */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/50">
                      <button
                        onClick={() => startEdit(cap)}
                        className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-0.5 cursor-pointer"
                        title="Edit Data"
                      >
                        <Edit size={12} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(cap.id)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                        title="Hapus Data"
                      >
                        <Trash2 size={12} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info stats */}
        <div className="mt-4 pt-4 border-t text-[11px] font-semibold text-slate-400 flex justify-between items-center bg-slate-50/20 px-1">
          <span>Pengisian: {userHistoryList.length} total</span>
          <span>Selesai (Submit): {userHistoryList.filter(c => c.status_submit === 'Submitted').length}</span>
        </div>
      </div>
    </div>
  );
}
