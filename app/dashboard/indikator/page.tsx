"use client";

import { useState, useEffect } from "react";
import { useAppStore, Indikator } from "@/lib/store";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  AlertCircle,
  Lock,
  Layers,
  Check,
  FileSpreadsheet
} from "lucide-react";
import Swal from "sweetalert2";

export default function ProfilIndikatorPage() {
  const { 
    indikatorList, 
    addIndikator, 
    updateIndikator, 
    deleteIndikator, 
    currentUser,
    users
  } = useAppStore();

  const kepalaUnitUsers = (users || []).filter(u => u.role === 'Kepala Unit');

  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("Semua Unit");
  const [selectedKategori, setSelectedKategori] = useState("Semua Kategori");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formKode, setFormKode] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formUnit, setFormUnit] = useState("Laboratorium");
  const [formKategori, setFormKategori] = useState<'Penunjang Medis' | 'Penunjang Non Medis'>("Penunjang Medis");
  const [formNumerator, setFormNumerator] = useState("");
  const [formDenominator, setFormDenominator] = useState("");
  const [formFormula, setFormFormula] = useState("");
  const [formTarget, setFormTarget] = useState(95);
  const [formArahTarget, setFormArahTarget] = useState<'Semakin Tinggi' | 'Semakin Rendah'>('Semakin Tinggi');
  const [formSatuan, setFormSatuan] = useState<string>("%");
  const [formFrekuensi, setFormFrekuensi] = useState("Bulanan");
  const [formPic, setFormPic] = useState("");
  const [formStatus, setFormStatus] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const isWriteAllowed = currentUser?.role === 'Super Admin' || currentUser?.role === 'Kepala Seksi';

  // List of all units
  const unitsList = [
    "Laboratorium", "Farmasi", "Rekam Medis", "Radiologi", "Mutu", "Gizi",
    "IT Rumah Sakit / ITRS", "IPSRS", "CSSD & Laundry", "Humas dan Pemasaran", "Kesehatan Lingkungan"
  ];

  // Filtering Logic
  const filteredIndikator = indikatorList.filter(ind => {
    const matchesSearch = ind.nama.toLowerCase().includes(search.toLowerCase()) || 
                          ind.kode.toLowerCase().includes(search.toLowerCase());
    const matchesUnit = selectedUnit === "Semua Unit" || ind.unit === selectedUnit;
    const matchesKategori = selectedKategori === "Semua Kategori" || ind.kategori === selectedKategori;
    return matchesSearch && matchesUnit && matchesKategori;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredIndikator.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredIndikator.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setFormKode("");
    setFormNama("");
    setFormUnit("Laboratorium");
    setFormKategori("Penunjang Medis");
    setFormNumerator("");
    setFormDenominator("");
    setFormFormula("");
    setFormTarget(95);
    setFormArahTarget('Semakin Tinggi');
    setFormSatuan("%");
    setFormFrekuensi("Bulanan");
    
    // Default to the first Kepala Unit user if available
    const kuList = (users || []).filter(u => u.role === 'Kepala Unit');
    setFormPic(kuList.length > 0 ? kuList[0].nama : "");
    
    setFormStatus(true);
  };

  // Open Modal for Add
  const openAddModal = () => {
    if (!isWriteAllowed) {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Hanya Super Admin atau Kepala Seksi yang dapat membuat Indikator Baru.',
        confirmButtonColor: '#00A8A8',
      });
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const openEditModal = (ind: Indikator) => {
    if (!isWriteAllowed) {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Hanya Super Admin atau Kepala Seksi yang dapat mengubah data Indikator.',
        confirmButtonColor: '#00A8A8',
      });
      return;
    }
    setEditingId(ind.id);
    setFormKode(ind.kode);
    setFormNama(ind.nama);
    setFormUnit(ind.unit);
    setFormKategori(ind.kategori);
    setFormNumerator(ind.numerator);
    setFormDenominator(ind.denominator);
    setFormFormula(ind.formula);
    setFormTarget(ind.target);
    setFormArahTarget(ind.arah_target || 'Semakin Tinggi');
    setFormSatuan(ind.satuan);
    setFormFrekuensi(ind.frekuensi);
    setFormPic(ind.pic);
    setFormStatus(ind.status);
    setIsModalOpen(true);
  };

  // Save / Update Indicator
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKode || !formNama || !formPic) {
      Swal.fire({
        icon: 'warning',
        title: 'Lengkapi Formulir',
        text: 'Kode, Nama Indikator, dan Kepala Unit wajib diisi!',
        confirmButtonColor: '#00A8A8',
      });
      return;
    }

    const payload = {
      kode: formKode.toUpperCase(),
      nama: formNama,
      unit: formUnit,
      kategori: formKategori,
      numerator: formNumerator || "Realisasi Kasus",
      denominator: formDenominator || "Populasi Target",
      formula: formFormula || "(Numerator ÷ Denominator) × 100%",
      target: Number(formTarget),
      arah_target: formArahTarget,
      satuan: formSatuan,
      frekuensi: formFrekuensi,
      pic: formPic,
      status: formStatus
    };

    if (editingId) {
      updateIndikator(editingId, payload);
      Swal.fire({
        icon: 'success',
        title: 'Indikator Diperbarui',
        text: 'Informasi KPI berhasil diperbarui!',
        showConfirmButton: false,
        timer: 1500
      });
    } else {
      // Check duplicate code
      const duplicate = indikatorList.some(ind => ind.kode.toLowerCase() === formKode.toLowerCase());
      if (duplicate) {
        Swal.fire({
          icon: 'error',
          title: 'Kode Duplikat',
          text: 'Indikator dengan kode ini sudah ada di sistem!',
          confirmButtonColor: '#00A8A8',
        });
        return;
      }

      addIndikator(payload);
      Swal.fire({
        icon: 'success',
        title: 'Indikator Ditambahkan',
        text: 'Indikator KPI baru berhasil didaftarkan!',
        showConfirmButton: false,
        timer: 1500
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Delete Handler
  const handleDelete = (id: string, kode: string) => {
    if (!isWriteAllowed) {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Hanya Super Admin atau Kepala Seksi yang dapat menghapus indikator.',
        confirmButtonColor: '#00A8A8',
      });
      return;
    }

    Swal.fire({
      title: 'Hapus Indikator?',
      text: `Apakah Anda yakin ingin menghapus indikator ${kode}? Seluruh riwayat pengisian yang bersangkutan juga akan ikut terhapus!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteIndikator(id);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Dihapus',
          text: `Indikator ${kode} telah dihapus dari database.`,
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  };

  // Export Excel / CSV
  const exportExcel = () => {
    const headers = ["Kode,Nama Indikator,Unit Kerja,Kategori,Target,Satuan,Frekuensi,Kepala Unit,Status"];
    const rows = filteredIndikator.map(ind => 
      `"${ind.kode}","${ind.nama.replace(/"/g, '""')}","${ind.unit}","${ind.kategori}",${ind.target},"${ind.satuan}","${ind.frekuensi}","${ind.pic}","${ind.status ? 'Aktif' : 'Nonaktif'}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Master_KPI_Penunjang_${selectedUnit.replace(" ", "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'File CSV berhasil diunduh',
      showConfirmButton: false,
      timer: 1500
    });
  };

  // Export PDF / Print Layout
  const exportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableRows = filteredIndikator.map(ind => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${ind.kode}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${ind.nama}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${ind.unit}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${ind.kategori}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${ind.target}${ind.satuan}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${ind.pic}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${ind.status ? 'Aktif' : 'Nonaktif'}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html lang="id">
        <head>
          <title>Master KPI Seksi Penunjang - RSUD Al-Mulk</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            h1 { font-size: 20px; font-weight: bold; margin-bottom: 5px; color: #00A8A8; }
            h2 { font-size: 14px; font-weight: normal; margin-bottom: 25px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            th { background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd; text-align: left; }
            .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <h1>RSUD AL-MULK</h1>
          <h2>DAFTAR PROFIL INDIKATOR (MASTER KPI) - SEKSI PENUNJANG</h2>
          <p>Kategori: <strong>${selectedKategori}</strong> | Unit: <strong>${selectedUnit}</strong></p>
          <p>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Indikator</th>
                <th>Unit Kerja</th>
                <th>Divisi</th>
                <th>Target</th>
                <th>Kepala Unit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            Sistem Informasi SIPAKAR &copy; ${new Date().getFullYear()} RSUD Al-Mulk
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Profil Indikator</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">
            Master KPI Penunjang Medis & Non Medis
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={exportExcel}
            className="px-3.5 py-2 border border-gray-200 bg-white rounded-xl text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 hover:text-teal-600 transition-colors shadow-sm cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>Ekspor Excel</span>
          </button>
          
          <button 
            onClick={exportPDF}
            className="px-3.5 py-2 border border-gray-200 bg-white rounded-xl text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 hover:text-teal-600 transition-colors shadow-sm cursor-pointer"
          >
            <Printer size={15} />
            <span>Cetak PDF</span>
          </button>

          <button 
            onClick={openAddModal}
            className="px-4 py-2 bg-[#00A8A8] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#008f8f] transition-all shadow-md shadow-[#00A8A8]/10 cursor-pointer active:scale-95"
          >
            <Plus size={15} />
            <span>Tambah Indikator</span>
          </button>
        </div>
      </div>

      {/* Main Filter & Table Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        
        {/* Filters Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Cari berdasarkan kode atau nama indikator..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:border-transparent transition-all"
            />
          </div>

          {/* Unit Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              <Filter size={14} className="text-teal-600" />
              <span>Filter:</span>
            </div>

            <select
              value={selectedUnit}
              onChange={(e) => {
                setSelectedUnit(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
            >
              <option value="Semua Unit">Semua Unit</option>
              {unitsList.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>

            {/* Division Kategori Filter */}
            <select
              value={selectedKategori}
              onChange={(e) => {
                setSelectedKategori(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
            >
              <option value="Semua Kategori">Semua Divisi</option>
              <option value="Penunjang Medis">Penunjang Medis</option>
              <option value="Penunjang Non Medis">Penunjang Non Medis</option>
            </select>
          </div>
        </div>

        {/* Master KPIs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/20 border-b border-gray-100 text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">
                <th className="p-4 pl-6">Kode</th>
                <th className="p-4">Nama Indikator KPI</th>
                <th className="p-4">Unit / Divisi</th>
                <th className="p-4">Formula Hitung</th>
                <th className="p-4 text-center">Target</th>
                <th className="p-4">Kepala Unit</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-bold">
                    <Layers size={40} className="mx-auto mb-3 text-slate-300" />
                    <span>Tidak ada indikator yang sesuai dengan filter pencarian.</span>
                  </td>
                </tr>
              ) : (
                currentItems.map((ind) => (
                  <tr key={ind.id} className="hover:bg-slate-50/50 transition-colors group">
                    
                    {/* Kode */}
                    <td className="p-4 pl-6 font-extrabold text-slate-800 tracking-tight whitespace-nowrap">
                      {ind.kode}
                    </td>

                    {/* Nama */}
                    <td className="p-4 text-slate-700 font-medium max-w-sm">
                      <p className="font-extrabold text-slate-800 leading-normal">{ind.nama}</p>
                      <div className="mt-1 text-[10px] text-slate-400 font-medium space-y-0.5">
                        <p>&bull; Num: {ind.numerator}</p>
                        <p>&bull; Den: {ind.denominator}</p>
                      </div>
                    </td>

                    {/* Unit */}
                    <td className="p-4 whitespace-nowrap">
                      <p className="font-bold text-slate-700">{ind.unit}</p>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                        {ind.kategori}
                      </span>
                    </td>

                    {/* Formula */}
                    <td className="p-4 text-slate-500 font-mono text-[10px] max-w-[160px] truncate" title={ind.formula}>
                      {ind.formula}
                    </td>

                    {/* Target */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 bg-teal-50 text-teal-800 rounded-md font-black text-xs">
                        {ind.target}{ind.satuan}
                      </span>
                      {ind.arah_target === 'Semakin Rendah' && (
                        <div className="mt-1 text-[9px] text-amber-600 font-extrabold uppercase tracking-tight">
                          Semakin Kecil &darr;
                        </div>
                      )}
                    </td>

                    {/* PIC */}
                    <td className="p-4 text-slate-600 font-semibold whitespace-nowrap">
                      {ind.pic}
                    </td>

                    {/* Status */}
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        ind.status 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {ind.status ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center pr-6 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {isWriteAllowed ? (
                          <>
                            <button
                              onClick={() => openEditModal(ind)}
                              className="p-1.5 hover:bg-teal-50 text-teal-600 rounded-lg transition-colors cursor-pointer"
                              title="Ubah Indikator"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(ind.id, ind.kode)}
                              className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Indikator"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center justify-center p-1 bg-gray-50 border rounded text-gray-400" title="Akses Terkunci">
                            <Lock size={12} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">
              Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredIndikator.length)} dari {filteredIndikator.length} Indikator
            </span>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-slate-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePageChange(idx + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-black transition-colors ${
                    currentPage === idx + 1 
                      ? 'bg-[#00A8A8] text-white' 
                      : 'border border-gray-200 text-slate-600 hover:bg-gray-50'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-slate-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over or Inline Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-base font-black text-slate-800">
                  {editingId ? "Ubah Profil Indikator KPI" : "Tambah Profil Indikator Baru"}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Seksi Penunjang RSUD Al-Mulk</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
              
              {/* Row 1: Kode & Nama */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Kode KPI</label>
                  <input
                    type="text"
                    required
                    value={formKode}
                    onChange={(e) => setFormKode(e.target.value)}
                    placeholder="Contoh: PM-LAB-02"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:bg-white transition-all uppercase"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Nama Indikator KPI</label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Masukkan deskripsi indikator mutu kinerja"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Unit Kerja & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Unit Kerja</label>
                  <select
                    value={formUnit}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setFormUnit(selected);
                      const isMedis = ["Laboratorium", "Farmasi", "Rekam Medis", "Radiologi", "Mutu", "Gizi"].includes(selected);
                      setFormKategori(isMedis ? "Penunjang Medis" : "Penunjang Non Medis");
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
                  >
                    {unitsList.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Divisi Kategori</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as 'Penunjang Medis' | 'Penunjang Non Medis')}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
                  >
                    <option value="Penunjang Medis">Penunjang Medis</option>
                    <option value="Penunjang Non Medis">Penunjang Non Medis</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Numerator & Denominator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Numerator</label>
                  <textarea
                    rows={2}
                    value={formNumerator}
                    onChange={(e) => setFormNumerator(e.target.value)}
                    placeholder="Contoh: Jumlah resep dilayani tepat waktu"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Denominator</label>
                  <textarea
                    rows={2}
                    value={formDenominator}
                    onChange={(e) => setFormDenominator(e.target.value)}
                    placeholder="Contoh: Jumlah resep dilayani keseluruhan"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:bg-white transition-all resize-none"
                  />
                </div>
              </div>

              {/* Formula */}
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Formula Rumus Capaian</label>
                <input
                  type="text"
                  value={formFormula}
                  onChange={(e) => setFormFormula(e.target.value)}
                  placeholder="Contoh: (Jumlah tepat waktu ÷ Jumlah resep keseluruhan) × 100%"
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:bg-white transition-all"
                />
              </div>

              {/* Row 4: Target, Satuan, Frekuensi */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Target Kinerja</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formTarget}
                    onChange={(e) => setFormTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Arah Target</label>
                  <select
                    value={formArahTarget}
                    onChange={(e) => {
                      const val = e.target.value as 'Semakin Tinggi' | 'Semakin Rendah';
                      setFormArahTarget(val);
                      if (val === 'Semakin Rendah') {
                        setFormTarget(0);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
                  >
                    <option value="Semakin Tinggi">Semakin Tinggi &uarr;</option>
                    <option value="Semakin Rendah">Semakin Kecil / 0 &darr;</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Satuan</label>
                  <select
                    value={formSatuan === "%" || formSatuan === "Menit" ? formSatuan : "Lainnya"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== "Lainnya") {
                        setFormSatuan(val);
                      } else {
                        setFormSatuan("");
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
                  >
                    <option value="%">% (Persentase)</option>
                    <option value="Menit">Menit (Rata-rata Menit)</option>
                    <option value="Lainnya">Lainnya (Ketik Manual...)</option>
                  </select>
                  {formSatuan !== "%" && formSatuan !== "Menit" && (
                    <input
                      type="text"
                      required
                      value={formSatuan}
                      onChange={(e) => setFormSatuan(e.target.value)}
                      placeholder="Masukkan satuan kustom..."
                      className="w-full px-3 py-2 mt-1 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:bg-white transition-all"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Frekuensi Laporan</label>
                  <select
                    value={formFrekuensi}
                    onChange={(e) => setFormFrekuensi(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
                  >
                    <option value="Bulanan">Bulanan</option>
                    <option value="Triwulanan">Triwulanan</option>
                    <option value="Semester">Semester</option>
                    <option value="Tahunan">Tahunan</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Kepala Unit (Penanggung Jawab)</label>
                  {kepalaUnitUsers.length > 0 ? (
                    <select
                      required
                      value={formPic}
                      onChange={(e) => setFormPic(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:bg-white transition-all"
                    >
                      <option value="" disabled>Pilih Kepala Unit...</option>
                      {kepalaUnitUsers.map(user => (
                        <option key={user.id} value={user.nama}>
                          {user.nama} {user.unit ? `— Unit ${user.unit}` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-1">
                      <select
                        disabled
                        className="w-full px-3 py-2 bg-red-50 border border-red-200 text-red-500 rounded-xl text-xs focus:outline-none"
                      >
                        <option>Tidak ada akun Kepala Unit! Silakan tambah di Manajemen Akun.</option>
                      </select>
                      <input
                        type="hidden"
                        required
                        value={formPic}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Status Switch */}
              <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-xl border border-gray-100">
                <input
                  type="checkbox"
                  id="formStatusCheckbox"
                  checked={formStatus}
                  onChange={(e) => setFormStatus(e.target.checked)}
                  className="rounded bg-white border-gray-300 text-[#00A8A8] focus:ring-[#00A8A8] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="formStatusCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  Aktifkan Indikator KPI ini untuk pelaporan bulanan seksi penunjang
                </label>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-[#00A8A8] hover:bg-[#008f8f] text-white rounded-xl text-xs font-black shadow-md shadow-[#00A8A8]/10 transition-all cursor-pointer"
                >
                  {editingId ? "Simpan Perubahan" : "Simpan Indikator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
