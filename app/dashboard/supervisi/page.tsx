"use client";

import { useState, useEffect } from "react";
import { useAppStore, Supervisi } from "@/lib/store";

interface UnitComplianceAlert {
  unit: string;
  pjName: string;
  pjPhone: string;
  delayDays: number;
  missingCount: number;
}
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  FileText, 
  Camera, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Send, 
  MessageSquare,
  Lock,
  User,
  ExternalLink,
  ChevronRight,
  Filter,
  X,
  PhoneCall
} from "lucide-react";
import Swal from "sweetalert2";

export default function SupervisiPage() {
  const { 
    supervisiList, 
    addSupervisi, 
    updateSupervisi, 
    deleteSupervisi, 
    currentUser, 
    indikatorList, 
    capaianList 
  } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'supervisi' | 'evaluasi'>('supervisi');

  // Tab 1: Supervisi state
  const [search, setSearch] = useState("");
  const [filterUnit, setFilterUnit] = useState("Semua Unit");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formUnit, setFormUnit] = useState("Laboratorium");
  const [formTanggal, setFormTanggal] = useState("");
  const [formTemuan, setFormTemuan] = useState("");
  const [formRekomendasi, setFormRekomendasi] = useState("");
  const [formStatus, setFormStatus] = useState<'Belum Tindak Lanjut' | 'Dalam Proses' | 'Selesai'>('Belum Tindak Lanjut');
  const [formDokumentasi, setFormDokumentasi] = useState("");
  const [formTindakLanjutCatatan, setFormTindakLanjutCatatan] = useState("");

  // Tab 2: Evaluasi compliance state
  const [evalBulan, setEvalBulan] = useState(3); // default March
  const [evalTahun, setEvalTahun] = useState(2026);

  useEffect(() => {
    setMounted(true);
    // Set default date
    const today = new Date().toISOString().split('T')[0];
    setFormTanggal(today);
  }, []);

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

  // RBAC checks
  const isSupervisorOrAdmin = currentUser.role === 'Super Admin' || currentUser.role === 'Kepala Seksi' || currentUser.role === 'Supervisor';
  const isPetugas = currentUser.role === 'Kepala Unit';

  // Filter supervisi list
  const filteredSupervisi = supervisiList.filter(item => {
    const matchesSearch = item.temuan.toLowerCase().includes(search.toLowerCase()) || 
                          (item.rekomendasi || "").toLowerCase().includes(search.toLowerCase());
    const matchesUnit = filterUnit === "Semua Unit" || item.unit === filterUnit;
    
    // If Kepala Unit, they can only see their own unit's supervisions
    if (isPetugas) {
      return item.unit === currentUser.unit && matchesSearch;
    }

    return matchesSearch && matchesUnit;
  });

  // Calculate Late Reporting Units for chosen period
  // For each unit, check if they have submitted all their active indicators
  const getLateUnitsList = (): UnitComplianceAlert[] => {
    const alerts: UnitComplianceAlert[] = [];
    
    unitsList.forEach(unit => {
      // Find active indicators for this unit
      const unitInds = indikatorList.filter(ind => ind.unit === unit && ind.status);
      if (unitInds.length === 0) return; // skip if no indicators

      const submitted = capaianList.filter(cap => 
        unitInds.map(i => i.id).includes(cap.indikator_id) && 
        cap.bulan === evalBulan && 
        cap.tahun === evalTahun && 
        cap.status_submit === 'Submitted'
      );

      const delayCount = unitInds.length - submitted.length;
      if (delayCount > 0) {
        alerts.push({
          unit,
          pjName: unit === "Laboratorium" ? "Ahmad Kurnia, A.Md.AK" : 
                  unit === "CSSD & Laundry" ? "Siti Rahma, A.Md.Kep" : 
                  unit === "Kesehatan Lingkungan" ? "Budi Sanitarian, SKM" : "Kordinator Unit Penunjang",
          pjPhone: unit === "Laboratorium" ? "0812-3456-7890" : 
                   unit === "CSSD & Laundry" ? "0823-4567-8901" : 
                   unit === "Kesehatan Lingkungan" ? "0852-6789-1234" : "0811-9999-8888",
          delayDays: 5, // mock delay
          missingCount: delayCount
        });
      }
    });

    return alerts;
  };

  const lateUnits = getLateUnitsList();

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setFormUnit(currentUser.unit || "Laboratorium");
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormTemuan("");
    setFormRekomendasi("");
    setFormStatus("Belum Tindak Lanjut");
    setFormDokumentasi("");
    setFormTindakLanjutCatatan("");
  };

  // Open Form Modal
  const openAddModal = () => {
    if (!isSupervisorOrAdmin) {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Hanya Supervisor, Kepala Seksi, atau Super Admin yang dapat membuat temuan supervisi baru.',
        confirmButtonColor: '#00A8A8'
      });
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  // Open Edit/Response Modal
  const openEditModal = (item: Supervisi) => {
    setEditingId(item.id);
    setFormUnit(item.unit);
    setFormTanggal(item.tanggal);
    setFormTemuan(item.temuan);
    setFormRekomendasi(item.rekomendasi || "");
    setFormStatus(item.status as any);
    setFormDokumentasi(item.dokumentasi || "");
    setFormTindakLanjutCatatan(item.tindak_lanjut_catatan || "");
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTemuan || !formRekomendasi) {
      Swal.fire({
        icon: 'warning',
        title: 'Lengkapi Formulir',
        text: 'Temuan Masalah dan Rekomendasi wajib diisi!',
        confirmButtonColor: '#00A8A8'
      });
      return;
    }

    const payload = {
      unit: formUnit,
      tanggal: formTanggal,
      temuan: formTemuan,
      rekomendasi: formRekomendasi,
      status: formStatus,
      dokumentasi: formDokumentasi || "Dokumentasi_Supervisi_Def.jpg",
      tindak_lanjut_catatan: formTindakLanjutCatatan,
      supervisor_id: currentUser.id,
      supervisor: currentUser.nama
    };

    if (editingId) {
      updateSupervisi(editingId, payload);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Diperbarui',
        text: 'Data supervisi berhasil disinkronkan ke database!',
        showConfirmButton: false,
        timer: 1500
      });
    } else {
      addSupervisi(payload);
      Swal.fire({
        icon: 'success',
        title: 'Supervisi Ditambahkan',
        text: 'Temuan supervisi baru berhasil dicatat!',
        showConfirmButton: false,
        timer: 1500
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Delete Supervision
  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'Hapus Temuan?',
      text: 'Apakah Anda yakin ingin menghapus catatan supervisi ini? Tindakan tidak dapat dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteSupervisi(id);
        Swal.fire({
          icon: 'success',
          title: 'Dihapus',
          text: 'Temuan supervisi berhasil dibersihkan dari database.',
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  };

  // Send WhatsApp Teguran Warning Broadcaster
  const sendWhatsAppWarning = (alert: UnitComplianceAlert) => {
    Swal.fire({
      title: 'Kirim WA Teguran?',
      text: `Kirim pesan WhatsApp otomatis ke PJ Unit ${alert.unit} (${alert.pjName}) terkait keterlambatan pelaporan ${alert.missingCount} indikator KPI pada periode ${monthsMap[evalBulan]} ${evalTahun}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#25D366',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Kirim WA',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Menyiapkan Whatsapp API...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Teguran WA Terkirim',
            html: `
              <div class="text-left text-xs bg-slate-50 p-3 rounded-lg font-mono border mt-2">
                <strong>Penerima:</strong> ${alert.pjName} (${alert.pjPhone})<br/>
                <strong>Isi Pesan:</strong><br/>
                "PEMBERITAHUAN SIPAKAR RSUD AL-MULK: Yth. PJ Unit ${alert.unit}, terpantau masih ada ${alert.missingCount} indikator KPI Anda yang belum disubmit untuk periode ${monthsMap[evalBulan]} ${evalTahun}. Harap segera melakukan input melalui aplikasi."
              </div>
            `,
            confirmButtonColor: '#00A8A8'
          });
        }, 1200);
      }
    });
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Tab Selectors & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Supervisi & Evaluasi</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen supervisi berkala seksi penunjang dan evaluasi kepatuhan pelaporan
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('supervisi')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'supervisi' ? 'bg-[#00A8A8] text-white shadow' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Temuan Supervisi
          </button>
          <button
            onClick={() => setActiveTab('evaluasi')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'evaluasi' ? 'bg-[#00A8A8] text-white shadow' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Evaluasi Kepatuhan
          </button>
        </div>
      </div>

      {/* Tab Content 1: Supervisi */}
      {activeTab === 'supervisi' && (
        <div className="space-y-6">
          
          {/* Filters Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Cari temuan atau rekomendasi..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Filter Unit */}
              {!isPetugas && (
                <select
                  value={filterUnit}
                  onChange={(e) => setFilterUnit(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
                >
                  <option value="Semua Unit">Semua Unit</option>
                  {unitsList.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              )}

              {isSupervisorOrAdmin && (
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-[#00A8A8] hover:bg-[#008f8f] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-md shadow-[#00A8A8]/10 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Buat Supervisi</span>
                </button>
              )}
            </div>
          </div>

          {/* Findings List Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSupervisi.length === 0 ? (
              <div className="md:col-span-2 text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm text-slate-400 font-bold">
                <FileText size={44} className="mx-auto mb-2 text-slate-300" />
                <span>Tidak ada laporan temuan supervisi yang tercatat.</span>
              </div>
            ) : (
              filteredSupervisi.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 flex flex-col justify-between">
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b pb-3">
                    <div>
                      <span className="px-2.5 py-0.5 bg-teal-50 text-[#00A8A8] text-[9px] font-black rounded uppercase tracking-wider">
                        {item.unit}
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5">Tanggal: {item.tanggal}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                      item.status === 'Selesai' 
                        ? 'bg-green-50 text-green-600' 
                        : item.status === 'Dalam Proses' 
                          ? 'bg-amber-50 text-amber-600' 
                          : 'bg-red-50 text-red-500'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Issue content details */}
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Temuan Temuan Masalah</h4>
                      <p className="text-xs font-bold text-slate-800 leading-normal">{item.temuan}</p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Solusi Rekomendasi</h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">{item.rekomendasi}</p>
                    </div>

                    {item.tindak_lanjut_catatan && (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                        <h4 className="text-[9px] font-extrabold text-teal-600 uppercase tracking-wider">Catatan Progres / Tindak Lanjut</h4>
                        <p className="text-[11px] text-slate-700 font-medium italic">&quot;{item.tindak_lanjut_catatan}&quot;</p>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center text-[10px] font-bold text-slate-400">
                      <User size={12} className="mr-1 text-slate-400" />
                      <span>Oleh Supervisor</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSupervisorOrAdmin ? (
                        <>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 hover:bg-slate-100 text-[#00A8A8] rounded-lg transition-colors cursor-pointer"
                            title="Edit Temuan"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 hover:bg-slate-100 text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Temuan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : isPetugas && item.unit === currentUser.unit ? (
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-extrabold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Send size={11} />
                          <span>Tindak Lanjuti</span>
                        </button>
                      ) : (
                        <div className="p-1 bg-slate-50 border rounded text-slate-400" title="Kunci Akses">
                          <Lock size={12} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Evaluasi kepatuhan input */}
      {activeTab === 'evaluasi' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-6">
          
          {/* Header & period pickers */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Audit Kepatuhan Input KPI Bulanan</h3>
              <p className="text-xs text-slate-400">Deteksi otomatis unit kerja penunjang yang terlambat mengumpulkan laporan realisasi</p>
            </div>

            <div className="flex items-center gap-2">
              <select 
                value={evalBulan}
                onChange={(e) => setEvalBulan(Number(e.target.value))}
                className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
              >
                {Object.entries(monthsMap).map(([num, name]) => (
                  <option key={num} value={num}>{name}</option>
                ))}
              </select>

              <select 
                value={evalTahun}
                onChange={(e) => setEvalTahun(Number(e.target.value))}
                className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>

          {/* Audit Results Table */}
          <div className="space-y-4">
            {lateUnits.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border rounded-2xl border-dashed border-slate-200 text-teal-800 font-bold text-xs space-y-1.5">
                <CheckCircle size={32} className="mx-auto text-green-500" />
                <p className="font-extrabold text-sm text-slate-800">Luar Biasa!</p>
                <p className="text-slate-500">Seluruh unit penunjang patuh 100% melapor untuk periode {monthsMap[evalBulan]} {evalTahun}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lateUnits.map((alert, idx) => (
                  <div key={idx} className="bg-slate-50 hover:bg-slate-100/50 border border-slate-200/50 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between">
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-black rounded uppercase">
                          Keterlambatan Input
                        </span>
                        <span className="text-[10px] text-red-500 font-bold flex items-center gap-0.5">
                          <Clock size={12} />
                          <span>+ {alert.delayDays} Hari</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-slate-800">{alert.unit}</h4>
                        <p className="text-[11px] text-slate-400 font-bold">Kordinator: {alert.pjName}</p>
                      </div>

                      <div className="p-2 bg-white rounded-xl border border-gray-100 flex justify-between text-xs font-bold text-slate-600">
                        <span>Belum Melapor:</span>
                        <span className="text-red-500">{alert.missingCount} Indikator KPI</span>
                      </div>
                    </div>

                    {/* Quick WhatsApp broadcast button (for supervisors and admin roles) */}
                    {isSupervisorOrAdmin ? (
                      <button
                        onClick={() => sendWhatsAppWarning(alert)}
                        className="w-full py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <PhoneCall size={13} />
                        <span>Kirim WA Teguran</span>
                      </button>
                    ) : (
                      <p className="text-[9px] text-slate-400 font-bold italic text-center pt-2">
                        Hubungi Kordinator Unit untuk segera melapor.
                      </p>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Modal for Add/Edit/Respond */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-lg w-full flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-800">
                  {editingId 
                    ? isPetugas 
                      ? "Kirim Tanggapan Tindak Lanjut" 
                      : "Ubah Catatan Supervisi"
                    : "Buat Laporan Supervisi Baru"}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">SIPAKAR RSUD Al-Mulk</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Unit selection (Supervisor/Admin can pick, Petugas is frozen) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Unit Sasaran</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    disabled={editingId !== null || isPetugas}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-60"
                  >
                    {unitsList.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tanggal Inspeksi</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    disabled={isPetugas}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold text-slate-800 disabled:opacity-60 focus:outline-none"
                  />
                </div>
              </div>

              {/* Temuan & Rekomendasi (Supervisor/Admin can write, Petugas can ONLY read) */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Temuan Masalah Lapangan</label>
                  <textarea
                    rows={2}
                    required
                    value={formTemuan}
                    onChange={(e) => setFormTemuan(e.target.value)}
                    disabled={isPetugas}
                    placeholder="Contoh: Pemilahan jarum suntik bekas belum menggunakan safety box khusus"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 disabled:opacity-60 disabled:bg-slate-100 focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-sans">Rekomendasi / Solusi Preventif</label>
                  <textarea
                    rows={2}
                    required
                    value={formRekomendasi}
                    onChange={(e) => setFormRekomendasi(e.target.value)}
                    disabled={isPetugas}
                    placeholder="Contoh: Sediakan safety box tambahan di trolley tindakan keperawatan"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 disabled:opacity-60 disabled:bg-slate-100 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Tindak Lanjut progress section */}
              <div className="p-4 bg-teal-50/40 border border-teal-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black text-teal-800 uppercase tracking-wider">Status Tindak Lanjut</label>
                  
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    <option value="Belum Tindak Lanjut">Belum Tindak Lanjut</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wide">
                    {isPetugas ? "Catatan Penyelesaian Anda (Wajib Diisi)" : "Tambahan Catatan Progres"}
                  </label>
                  <textarea
                    rows={2}
                    value={formTindakLanjutCatatan}
                    onChange={(e) => setFormTindakLanjutCatatan(e.target.value)}
                    placeholder="Contoh: Telah didistribusikan 5 safety box tambahan ke ruang tindakan."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none resize-none"
                  />
                </div>
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
                  className="px-5 py-2 bg-[#00A8A8] hover:bg-[#008f8f] text-white rounded-xl text-xs font-black shadow-md shadow-[#00A8A8]/10 transition-all cursor-pointer"
                >
                  {editingId ? "Kirim Laporan" : "Simpan Supervisi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
