"use client";

import { useState, useEffect } from "react";
import { useAppStore, User, Pengaturan } from "@/lib/store";
import { 
  Settings, 
  Users, 
  ShieldAlert, 
  History, 
  Trash2, 
  Edit, 
  Plus, 
  Save, 
  RotateCcw, 
  CheckCircle, 
  Building,
  UserCheck,
  Search,
  Lock,
  X,
  Database,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Sparkles,
  Upload,
  AlertCircle
} from "lucide-react";
import Swal from "sweetalert2";

const imagePresets = [
  {
    id: 'img-1',
    name: 'Lobi Rumah Sakit Modern',
    description: 'Tampilan bersih, modern, dan profesional lobi klinik/RS',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'img-2',
    name: 'Kolaborasi Tenaga Medis',
    description: 'Tim dokter dan perawat mendiskusikan hasil analisis medis',
    url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'img-3',
    name: 'Green Hospital & Nature',
    description: 'Tampilan lingkungan luar rumah sakit yang asri dan hijau',
    url: 'https://images.unsplash.com/photo-1504813184591-015556c5c522?auto=format&fit=crop&q=80&w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1504813184591-015556c5c522?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'img-4',
    name: 'Laboratorium & Alat Medis',
    description: 'Peralatan analisis laboratorium berteknologi tinggi',
    url: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&q=80&w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&q=80&w=300'
  }
];

const videoPresets = [
  {
    id: 'vid-1',
    name: 'Penelitian Laboratorium',
    description: 'Peneliti menganalisis sampel medis menggunakan mikroskop secara dinamis',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-medical-laboratory-researcher-analyzing-samples-41614-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'vid-2',
    name: 'Dokumentasi Klinis Dokter',
    description: 'Dokter menulis catatan medis di atas clipboard secara sinematik',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-doctor-writing-on-a-clipboard-41618-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'vid-3',
    name: 'Aliran Sungai & Alam Asri',
    description: 'Sungai di tengah hutan pinus dengan sorotan sinar matahari yang menyembuhkan',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'vid-4',
    name: 'Protokol Higiene Tangan',
    description: 'Petugas mencuci tangan menggunakan sabun sesuai standar klinis',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-slow-motion-of-a-doctors-hands-washing-with-soap-41611-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=300'
  }
];

export default function PengaturanPage() {
  const { 
    currentUser, 
    users, 
    addUser, 
    updateUser, 
    deleteUser, 
    pengaturan, 
    updatePengaturan, 
    activityLogs, 
    clearAllData 
  } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'profil' | 'media' | 'users' | 'logs' | 'maintenance'>('profil');

  // Tab: Media & Banner states
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Tab: User management states
  const [userSearch, setUserSearch] = useState("");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // User Form fields
  const [formNama, setFormNama] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<'Super Admin' | 'Kepala Seksi' | 'Kepala Unit' | 'Supervisor'>('Kepala Unit');
  const [formUnit, setFormUnit] = useState("Laboratorium");

  // Tab: General Profil states
  const [rsNama, setRsNama] = useState("");
  const [rsAlamat, setRsAlamat] = useState("");
  const [rsEmail, setRsEmail] = useState("");
  const [rsTelepon, setRsTelepon] = useState("");
  const [targetDefault, setTargetDefault] = useState(95);

  useEffect(() => {
    setMounted(true);
    if (pengaturan) {
      setRsNama(pengaturan.nama_rs);
      setRsAlamat(pengaturan.alamat);
      setRsEmail(pengaturan.email);
      setRsTelepon(pengaturan.telepon);
      setTargetDefault(pengaturan.target_default);
      setMediaType(pengaturan.dashboard_media_type || 'image');
      setMediaUrl(pengaturan.dashboard_media_url || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200');
      setBannerTitle(pengaturan.dashboard_banner_title || 'Portal Analisis Kinerja Pelayanan Seksi Penunjang');
      setBannerSubtitle(pengaturan.dashboard_banner_subtitle || 'Sistem Informasi Pemantauan Aktivitas Kinerja Rumah Sakit (SIPAKAR)');
    }
  }, [pengaturan]);

  if (!mounted || !currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const isSuperAdmin = currentUser.role === 'Super Admin';
  const isKasiOrAdmin = currentUser.role === 'Super Admin' || currentUser.role === 'Kepala Seksi';

  const unitsList = [
    "Laboratorium", "Farmasi", "Rekam Medis", "Radiologi", "Mutu", "Gizi",
    "IT Rumah Sakit / ITRS", "IPSRS", "CSSD & Laundry", "Humas dan Pemasaran", "Kesehatan Lingkungan"
  ];

  const handleFileUpload = async (file: File) => {
    if (!isKasiOrAdmin) return;
    
    // Validate size (10 MB = 10 * 1024 * 1024)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError("Ukuran file melebihi batas 10 MB.");
      Swal.fire({
        icon: 'error',
        title: 'File Terlalu Besar',
        text: 'Ukuran file maksimal adalah 10 MB.',
        confirmButtonColor: '#00A8A8'
      });
      return;
    }

    // Validate type based on active mediaType
    const isImage = mediaType === 'image';
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const allowedVideoTypes = ['video/mp4'];
    
    if (isImage && !allowedImageTypes.includes(file.type)) {
      setUploadError("Format gambar harus berupa JPG atau PNG.");
      Swal.fire({
        icon: 'error',
        title: 'Format Salah',
        text: 'Untuk tipe Gambar, silakan unggah file JPG atau PNG.',
        confirmButtonColor: '#00A8A8'
      });
      return;
    }

    if (!isImage && !allowedVideoTypes.includes(file.type)) {
      setUploadError("Format video harus berupa MP4.");
      Swal.fire({
        icon: 'error',
        title: 'Format Salah',
        text: 'Untuk tipe Video, silakan unggah file MP4.',
        confirmButtonColor: '#00A8A8'
      });
      return;
    }

    setUploadError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

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
      setMediaUrl(data.url);
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Diunggah',
        text: `File ${file.name} berhasil disimpan di server!`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Gagal mengunggah file ke server.");
      Swal.fire({
        icon: 'error',
        title: 'Gagal Unggah',
        text: err.message || 'Gagal mengunggah file ke server. Silakan coba lagi.',
        confirmButtonColor: '#00A8A8'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Save general hospital settings
  const handleSaveProfil = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKasiOrAdmin) {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Hanya Kepala Seksi atau Super Admin yang dapat mengubah konfigurasi rumah sakit.',
        confirmButtonColor: '#00A8A8'
      });
      return;
    }

    updatePengaturan({
      nama_rs: rsNama,
      alamat: rsAlamat,
      email: rsEmail,
      telepon: rsTelepon,
      target_default: Number(targetDefault)
    });

    Swal.fire({
      icon: 'success',
      title: 'Pengaturan Disimpan',
      text: 'Profil dan parameter operasional RSUD Al-Mulk berhasil diperbarui!',
      showConfirmButton: false,
      timer: 1500
    });
  };

  // Save dashboard media settings
  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKasiOrAdmin) {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Hanya Kepala Seksi atau Super Admin yang dapat mengubah media dashboard.',
        confirmButtonColor: '#00A8A8'
      });
      return;
    }

    updatePengaturan({
      dashboard_media_type: mediaType,
      dashboard_media_url: mediaUrl,
      dashboard_banner_title: bannerTitle,
      dashboard_banner_subtitle: bannerSubtitle
    });

    Swal.fire({
      icon: 'success',
      title: 'Media Dashboard Disimpan',
      text: 'Media banner dashboard awal berhasil diperbarui!',
      showConfirmButton: false,
      timer: 1500
    });
  };

  // User management: open modal for Add
  const openAddUserModal = () => {
    if (!isSuperAdmin) {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Hanya Super Admin yang memiliki wewenang untuk menambah user baru.',
        confirmButtonColor: '#00A8A8'
      });
      return;
    }
    setEditingUserId(null);
    setFormNama("");
    setFormEmail("");
    setFormRole("Kepala Unit");
    setFormUnit("Laboratorium");
    setIsUserModalOpen(true);
  };

  // User management: open modal for Edit
  const openEditUserModal = (u: User) => {
    if (!isSuperAdmin) {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Hanya Super Admin yang dapat mengedit hak akses user.',
        confirmButtonColor: '#00A8A8'
      });
      return;
    }
    setEditingUserId(u.id);
    setFormNama(u.nama);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormUnit(u.unit || "Laboratorium");
    setIsUserModalOpen(true);
  };

  // Save / Update User
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama || !formEmail) {
      Swal.fire({
        icon: 'warning',
        title: 'Lengkapi Data',
        text: 'Nama lengkap dan Email wajib diisi!',
        confirmButtonColor: '#00A8A8'
      });
      return;
    }

    if (editingUserId) {
      updateUser(editingUserId, {
        nama: formNama,
        email: formEmail,
        role: formRole,
        unit: formRole === 'Kepala Unit' ? formUnit : undefined
      });
      Swal.fire({
        icon: 'success',
        title: 'User Diperbarui',
        text: 'Informasi akun berhasil disimpan!',
        showConfirmButton: false,
        timer: 1500
      });
    } else {
      const newUser: User = {
        id: `usr-${Date.now()}`,
        nama: formNama,
        email: formEmail,
        role: formRole,
        unit: formRole === 'Kepala Unit' ? formUnit : undefined
      };
      addUser(newUser);
      Swal.fire({
        icon: 'success',
        title: 'User Ditambahkan',
        text: 'Akun baru berhasil didaftarkan!',
        showConfirmButton: false,
        timer: 1500
      });
    }

    setIsUserModalOpen(false);
  };

  // Delete User
  const handleDeleteUser = (id: string, nama: string) => {
    if (id === currentUser.id) {
      Swal.fire({
        icon: 'error',
        title: 'Tindakan Dilarang',
        text: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif!',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    Swal.fire({
      title: 'Hapus Akun?',
      text: `Apakah Anda yakin ingin menghapus user ${nama}? Akses masuk akan segera dinonaktifkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteUser(id);
        Swal.fire({
          icon: 'success',
          title: 'Dihapus',
          text: `Akun ${nama} telah dihapus dari sistem.`,
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  };

  // Reset System State
  const handleResetSystem = () => {
    Swal.fire({
      title: 'Reset Seluruh Data?',
      text: 'Semua data transaksi input kpi, supervisi, indikator kustom, dan audit logs yang tersimpan di cache lokal akan dihapus permanen dan di-seed ulang!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Reset Total',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        clearAllData();
        Swal.fire({
          icon: 'success',
          title: 'Sistem Direset',
          text: 'Database cache lokal berhasil dikembalikan ke kondisi awal pabrikan.',
          confirmButtonColor: '#00A8A8'
        });
      }
    });
  };

  // Filtering User list
  const filteredUsers = users.filter(u => 
    u.nama.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Settings Navigation tab */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-800">Sistem Pengaturan</h2>
          <p className="text-xs text-slate-500">Konfigurasi profile, manajemen akun, audit logs, dan pemeliharaan platform</p>
        </div>

        {/* Tab Selector Links */}
        <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-xl gap-0.5">
          <button
            onClick={() => setActiveTab('profil')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profil' ? 'bg-[#00A8A8] text-white shadow' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Profil RS
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'media' ? 'bg-[#00A8A8] text-white shadow' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Media Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-[#00A8A8] text-white shadow' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Manajemen Akun
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'logs' ? 'bg-[#00A8A8] text-white shadow' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Audit Logs
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'maintenance' ? 'bg-[#00A8A8] text-white shadow' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Pemeliharaan
          </button>
        </div>
      </div>

      {/* Tab Content 1: Profil Rumah Sakit */}
      {activeTab === 'profil' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-3xl">
          <div className="flex items-center gap-2 mb-6 border-b pb-3">
            <Building className="text-[#00A8A8] w-5 h-5 shrink-0" />
            <h3 className="font-extrabold text-slate-800 text-sm">Profil Rumah Sakit & Parameter</h3>
          </div>

          <form onSubmit={handleSaveProfil} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nama Institusi</label>
                <input
                  type="text"
                  required
                  value={rsNama}
                  onChange={(e) => setRsNama(e.target.value)}
                  disabled={!isKasiOrAdmin}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 disabled:opacity-60 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Target Default KPI (%)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={targetDefault}
                  onChange={(e) => setTargetDefault(Number(e.target.value))}
                  disabled={!isKasiOrAdmin}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 disabled:opacity-60 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Alamat Lengkap</label>
              <textarea
                rows={2}
                required
                value={rsAlamat}
                onChange={(e) => setRsAlamat(e.target.value)}
                disabled={!isKasiOrAdmin}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 disabled:opacity-60 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Alamat Surat Elektronik (Email)</label>
                <input
                  type="email"
                  required
                  value={rsEmail}
                  onChange={(e) => setRsEmail(e.target.value)}
                  disabled={!isKasiOrAdmin}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 disabled:opacity-60 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nomor Telepon Operasional</label>
                <input
                  type="text"
                  required
                  value={rsTelepon}
                  onChange={(e) => setRsTelepon(e.target.value)}
                  disabled={!isKasiOrAdmin}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 disabled:opacity-60 focus:outline-none"
                />
              </div>
            </div>

            {isKasiOrAdmin && (
              <div className="pt-4 border-t flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#00A8A8] hover:bg-[#008f8f] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-[#00A8A8]/10 cursor-pointer"
                >
                  <Save size={15} />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab Content: Media Dashboard */}
      {activeTab === 'media' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-4xl space-y-6">
          <div className="flex items-center gap-2 mb-4 border-b pb-3">
            <ImageIcon className="text-[#00A8A8] w-5 h-5 shrink-0" />
            <h3 className="font-extrabold text-slate-800 text-sm">Pengaturan Media & Banner Dashboard</h3>
          </div>

          <form onSubmit={handleSaveMedia} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Form Fields */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Judul Banner Utama (Welcome Message)</label>
                  <input
                    type="text"
                    required
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    disabled={!isKasiOrAdmin}
                    placeholder="Contoh: Portal Analisis Kinerja Pelayanan"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Subjudul Banner</label>
                  <input
                    type="text"
                    required
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    disabled={!isKasiOrAdmin}
                    placeholder="Contoh: Sistem Informasi Pemantauan Aktivitas Kinerja"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#00A8A8] focus:bg-white transition-all"
                  />
                </div>

                {/* Media Type Buttons */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tipe Media Latar Belakang</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isKasiOrAdmin) {
                          setMediaType('image');
                          setMediaUrl(imagePresets[0].url);
                        }
                      }}
                      disabled={!isKasiOrAdmin}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        mediaType === 'image'
                          ? 'border-[#00A8A8] bg-teal-50/40 text-[#00A8A8] shadow-sm font-black'
                          : 'border-gray-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ImageIcon size={16} />
                      <div className="text-xs">
                        <div>Gambar Statis</div>
                        <div className="text-[9px] opacity-70 font-normal">Foto resolusi tinggi</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isKasiOrAdmin) {
                          setMediaType('video');
                          setMediaUrl(videoPresets[0].url);
                        }
                      }}
                      disabled={!isKasiOrAdmin}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        mediaType === 'video'
                          ? 'border-[#00A8A8] bg-teal-50/40 text-[#00A8A8] shadow-sm font-black'
                          : 'border-gray-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <VideoIcon size={16} />
                      <div className="text-xs">
                        <div>Video Sinematik</div>
                        <div className="text-[9px] opacity-70 font-normal">Video klip loop estetik</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Media Upload Area */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {mediaType === 'image' ? 'Unggah Gambar Kustom (JPG, PNG)' : 'Unggah Video Kustom (MP4)'}
                  </label>
                  
                  <div
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isKasiOrAdmin) setDragActive(true);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isKasiOrAdmin) setDragActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragActive(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragActive(false);
                      if (isKasiOrAdmin && e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all ${
                      dragActive 
                        ? 'border-[#00A8A8] bg-teal-50/50' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                    } ${!isKasiOrAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <input
                      type="file"
                      id="media-uploader"
                      disabled={!isKasiOrAdmin || isUploading}
                      accept={mediaType === 'image' ? ".jpg,.jpeg,.png" : ".mp4"}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {isUploading ? (
                      <div className="flex flex-col items-center space-y-2.5 py-4">
                        <div className="w-8 h-8 border-4 border-t-transparent border-[#00A8A8] rounded-full animate-spin" />
                        <p className="text-xs font-bold text-slate-600 animate-pulse">Mengunggah ke server...</p>
                      </div>
                    ) : (
                      <label
                        htmlFor="media-uploader"
                        className="flex flex-col items-center text-center space-y-2 cursor-pointer w-full py-4 h-full"
                      >
                        <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100 text-[#00A8A8]">
                          <Upload size={22} className="animate-bounce" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-black text-slate-700">
                            Seret & Taruh file Anda di sini, atau <span className="text-[#00A8A8] underline">Pilih File</span>
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium">
                            Mendukung {mediaType === 'image' ? 'JPG, JPEG, PNG' : 'MP4'} (Maks. 10 MB)
                          </p>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Display Current URL or uploaded file */}
                  {mediaUrl && (
                    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100/80 rounded-xl border border-slate-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">File Aktif saat ini</p>
                        <p className="text-xs font-bold text-slate-700 truncate">{mediaUrl}</p>
                      </div>
                      {mediaUrl.startsWith('/uploads/') && (
                        <span className="shrink-0 text-[8px] font-black uppercase text-teal-600 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                          Tersimpan Lokal
                        </span>
                      )}
                    </div>
                  )}

                  {/* Info Location */}
                  <div className="flex items-start gap-2 p-3 bg-[#00A8A8]/5 border border-[#00A8A8]/10 rounded-xl text-slate-600">
                    <AlertCircle size={14} className="text-[#00A8A8] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-700">Lokasi Penyimpanan File:</p>
                      <p className="text-[9px] text-slate-500 leading-normal font-mono">
                        Folder <code className="bg-slate-200/60 px-1 py-0.5 rounded text-slate-800">/public/uploads/</code> di server utama.
                      </p>
                    </div>
                  </div>

                  {uploadError && (
                    <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                      <span>⚠️</span> {uploadError}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Live Interactive Media Preview Card */}
              <div className="space-y-3">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pratinjau Banner Interaktif</label>
                
                <div className="relative rounded-2xl overflow-hidden shadow-md aspect-video bg-slate-900 border border-slate-800 flex flex-col justify-end p-5">
                  {/* Media source background */}
                  {mediaType === 'image' ? (
                    mediaUrl ? (
                      <img
                        src={mediaUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-semibold">Tidak ada tautan gambar</div>
                    )
                  ) : (
                    mediaUrl ? (
                      <video
                        key={mediaUrl}
                        src={mediaUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-semibold">Tidak ada tautan video</div>
                    )
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

                  {/* Live Glassmorphism content card mock */}
                  <div className="relative z-10 space-y-1">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[8px] uppercase tracking-widest font-extrabold rounded">
                      <Sparkles size={8} /> Live Preview
                    </div>
                    <h4 className="text-sm font-black text-white line-clamp-1">{bannerTitle || "Portal Analisis Kinerja"}</h4>
                    <p className="text-[10px] text-slate-300 line-clamp-1">{bannerSubtitle || "SIPAKAR Rumah Sakit"}</p>
                    <div className="pt-2 text-[8px] font-mono text-teal-400">
                      Tipe: {mediaType === 'image' ? 'GAMBAR' : 'VIDEO CINEMATIC'}
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  * Pratinjau di atas menampilkan rendering langsung dari media latar belakang dan overlay tipografi di halaman dashboard awal.
                </p>
              </div>
            </div>

            {/* Presets Grid Selector */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <Sparkles className="text-teal-600 w-4 h-4 shrink-0" />
                <h4 className="text-xs font-extrabold text-slate-700">Pilih dari Preset Premium yang Tersedia</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {(mediaType === 'image' ? imagePresets : videoPresets).map((preset) => {
                  const isSelected = mediaUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={!isKasiOrAdmin}
                      onClick={() => setMediaUrl(preset.url)}
                      className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between h-36 relative overflow-hidden group cursor-pointer ${
                        isSelected 
                          ? 'border-[#00A8A8] ring-2 ring-[#00A8A8]/20 bg-teal-50/10' 
                          : 'border-gray-100 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <img
                        src={preset.thumbnail}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-20 object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all"
                      />
                      <div className="h-20 bg-gradient-to-t from-slate-900 via-transparent to-transparent absolute inset-x-0 bottom-0" />

                      <div className="mt-20 pt-1.5 space-y-0.5 z-10 w-full">
                        <div className="text-[10px] font-extrabold text-slate-800 line-clamp-1 flex items-center justify-between gap-1">
                          <span>{preset.name}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#00A8A8]" />}
                        </div>
                        <p className="text-[9px] text-slate-400 line-clamp-2 leading-tight">{preset.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button for media settings */}
            {isKasiOrAdmin ? (
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#00A8A8] hover:bg-[#008f8f] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-[#00A8A8]/10 cursor-pointer"
                >
                  <Save size={15} />
                  <span>Simpan Konfigurasi Media</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/40 text-[11px] text-amber-700 font-bold flex items-center gap-2">
                <Lock size={14} />
                <span>Hanya Kepala Seksi atau Super Admin yang dapat menyimpan perubahan konfigurasi media.</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab Content 2: User Accounts Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3">
            <div className="flex items-center gap-2">
              <Users className="text-[#00A8A8] w-5 h-5" />
              <h3 className="font-extrabold text-slate-800 text-sm">Manajemen Akun Hak Akses</h3>
            </div>

            {/* Quick search user */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Cari akun..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none w-44"
                />
              </div>

              {isSuperAdmin && (
                <button
                  onClick={openAddUserModal}
                  className="px-3 py-1.5 bg-[#00A8A8] hover:bg-[#008f8f] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Tambah User</span>
                </button>
              )}
            </div>
          </div>

          {/* User list Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">
                  <th className="p-3 pl-4">Nama Lengkap</th>
                  <th className="p-3">Email Akun</th>
                  <th className="p-3">Hak Akses Role</th>
                  <th className="p-3">Tugas Unit Kerja</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center pr-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 pl-4 font-extrabold text-slate-800">{u.nama}</td>
                    <td className="p-3 text-slate-500 font-medium">{u.email}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        u.role === 'Super Admin' ? 'bg-red-50 text-red-600 border border-red-100' :
                        u.role === 'Kepala Seksi' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        u.role === 'Supervisor' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-bold">{u.unit || "Seksi Penunjang"}</td>
                    <td className="p-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-green-50 text-green-600 rounded text-[9px] font-bold">
                        Aktif
                      </span>
                    </td>
                    <td className="p-3 text-center pr-4">
                      {isSuperAdmin ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditUserModal(u)}
                            className="p-1 hover:bg-slate-100 text-[#00A8A8] rounded transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.nama)}
                            className="p-1 hover:bg-slate-100 text-red-500 rounded transition-colors cursor-pointer"
                            title="Hapus User"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Terkunci</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 3: Audit Activity Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <History className="text-[#00A8A8] w-5 h-5" />
              <h3 className="font-extrabold text-slate-800 text-sm">Audit Trail & Log Aktivitas</h3>
            </div>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded uppercase">
              Riwayat Sistem
            </span>
          </div>

          <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
            {activityLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                Belum ada log terekam.
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-xl flex items-start justify-between text-xs gap-3">
                  <div className="space-y-1">
                    <p className="text-slate-800 font-bold leading-normal">{log.aktivitas}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span className="text-teal-600 font-extrabold">{log.user_nama}</span>
                      <span>&bull;</span>
                      <span>{log.user_role}</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab Content 4: System Maintenance */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl space-y-5">
          <div className="flex items-center gap-2 mb-4 border-b pb-3">
            <Database className="text-[#00A8A8] w-5 h-5 shrink-0" />
            <h3 className="font-extrabold text-slate-800 text-sm">Sistem Pemeliharaan</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="text-red-500 shrink-0 w-5 h-5 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-red-900 uppercase tracking-wide">Pemberitahuan Bahaya</h4>
                <p className="text-[11px] text-red-700 leading-normal">
                  Fitur reset ini akan membersihkan seluruh database simulasi pada cache local storage browser Anda, menghapus seluruh masukan capaian KPI, draf pengisian, log aktivitas, dan laporan supervisi, lalu mengembalikannya ke seed data awal RSUD Al-Mulk.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-gray-200/40 text-xs">
              <div>
                <p className="font-black text-slate-800">Kembalikan Data Bawaan Pabrik</p>
                <p className="text-slate-400">Gunakan jika data demo terasa penuh atau ingin memulai pengujian baru.</p>
              </div>

              <button
                onClick={handleResetSystem}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit User (Super Admin only) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-800">
                  {editingUserId ? "Ubah Hak Akses Akun" : "Daftarkan Akun Baru"}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Seksi Penunjang RSUD Al-Mulk</p>
              </div>
              <button 
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: dr. Fitri Wulandari"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-sans">Alamat Email</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Contoh: fitri@rsudalmulk.id"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Hak Akses Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <option value="Kepala Unit">Kepala Unit</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Kepala Seksi">Kepala Seksi</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                {formRole === 'Kepala Unit' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Unit Kerja</label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700"
                    >
                      {unitsList.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00A8A8] hover:bg-[#008f8f] text-white rounded-xl text-xs font-black shadow-md shadow-[#00A8A8]/10 transition-all cursor-pointer"
                >
                  <span>Simpan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
