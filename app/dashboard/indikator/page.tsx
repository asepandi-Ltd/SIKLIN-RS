"use client";

import { useState } from "react";

export default function ProfilIndikatorPage() {
  const [search, setSearch] = useState("");

  const indikatorData = [
    { kode: "IND-01", nama: "Kualitas air bersih memenuhi syarat", target: 100, satuan: "%", frekuensi: "Bulanan", penanggungJawab: "Sanitarian", status: true },
    { kode: "IND-02", nama: "Kepatuhan pengelolaan limbah medis", target: 100, satuan: "%", frekuensi: "Bulanan", penanggungJawab: "Koordinator Kesling", status: true },
    { kode: "IND-03", nama: "Kepatuhan sanitasi makanan", target: 90, satuan: "%", frekuensi: "Bulanan", penanggungJawab: "Kepala Instalasi Gizi", status: true },
    { kode: "IND-04", nama: "Pengawasan kebisingan", target: 100, satuan: "%", frekuensi: "Semester", penanggungJawab: "Sanitarian", status: true },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-700">Profil Indikator</h2>
          <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider font-bold">Master Data</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-gray-600 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors shadow-sm">
             Export Data
          </button>
          <button className="px-4 py-2 bg-[#00A8A8] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#008f8f] transition-colors shadow-sm">
             Tambah Indikator
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <input 
            type="text" 
            placeholder="Cari indikator..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A8A8]"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                <th className="p-4">Kode</th>
                <th className="p-4">Nama Indikator</th>
                <th className="p-4">Target (%)</th>
                <th className="p-4">Frekuensi</th>
                <th className="p-4">Unit Penanggung Jawab</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {indikatorData.map((ind, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{ind.kode}</td>
                  <td className="p-4 text-gray-600 max-w-xs">{ind.nama}</td>
                  <td className="p-4 text-gray-800 font-black">{ind.target}</td>
                  <td className="p-4 text-gray-500">{ind.frekuensi}</td>
                  <td className="p-4 text-gray-600 font-medium">{ind.penanggungJawab}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${ind.status ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                      {ind.status ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
