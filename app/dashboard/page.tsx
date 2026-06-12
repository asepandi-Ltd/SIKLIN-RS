"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";

const mockDataTrend = [
  { name: 'Jan', capaian: 85, target: 100 },
  { name: 'Feb', capaian: 88, target: 100 },
  { name: 'Mar', capaian: 92, target: 100 },
  { name: 'Apr', capaian: 95, target: 100 },
  { name: 'Mei', capaian: 98, target: 100 },
  { name: 'Jun', capaian: 99, target: 100 },
];

export default function DashboardPage() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Indikator Aktif</p>
            <p className="text-2xl font-black text-gray-800">11</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#00A8A8]/10 text-[#00A8A8] rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Data Bulan Ini</p>
            <p className="text-2xl font-black text-gray-800">8</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Rata-rata Capaian</p>
            <p className="text-2xl font-black text-gray-800">93.5%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Supervisi Selesai</p>
            <p className="text-2xl font-black text-gray-800">12</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[400px]">
        <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-700">Tren Capaian Indikator Utama</h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-gray-50 text-[10px] font-bold rounded-md border text-gray-500 uppercase">Mingguan</button>
              <button className="px-3 py-1 bg-[#00A8A8] text-white text-[10px] font-bold rounded-md uppercase">Bulanan</button>
            </div>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockDataTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} fontWeight="bold" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="capaian" name="Realisasi" stroke="#00A8A8" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4, strokeWidth: 2 }} />
                <Line type="monotone" dataKey="target" name="Target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-gray-700 mb-4">Status Monitoring Terkini</h3>
          <div className="space-y-4 overflow-y-auto pr-2">
            <div className="flex items-start space-x-3 pb-3 border-b border-gray-50">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0"></div>
              <div>
                <p className="text-xs font-bold text-gray-800">Limbah Medis Unit OK</p>
                <p className="text-[10px] text-gray-500">Temuan: Penumpukan di TPS B3</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-black rounded uppercase">Belum Selesai</span>
              </div>
            </div>
            <div className="flex items-start space-x-3 pb-3 border-b border-gray-50">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-yellow-500 shrink-0"></div>
              <div>
                <p className="text-xs font-bold text-gray-800">Higiene Penjamah Makanan</p>
                <p className="text-[10px] text-gray-500">Rekomendasi: Pelatihan APD Dasar</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-50 text-yellow-600 text-[9px] font-black rounded uppercase">Proses</span>
              </div>
            </div>
            <div className="flex items-start space-x-3 pb-3 border-b border-gray-50">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 shrink-0"></div>
              <div>
                <p className="text-xs font-bold text-gray-800">Kualitas Air Bersih - Gizi</p>
                <p className="text-[10px] text-gray-500">Pemeriksaan Lab rutin selesai</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black rounded uppercase">Selesai</span>
              </div>
            </div>
          </div>
          <div className="mt-auto pt-4">
            <button className="w-full py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">Lihat Seluruh Monitoring</button>
          </div>
        </div>
      </div>
    </>
  );
}
