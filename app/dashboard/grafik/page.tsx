"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { CheckCircle2, TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from "lucide-react";

const dataBulan = [
  { name: 'Jan', realisasi: 85, target: 100 },
  { name: 'Feb', realisasi: 88, target: 100 },
  { name: 'Mar', realisasi: 82, target: 100 },
  { name: 'Apr', realisasi: 95, target: 100 },
  { name: 'Mei', realisasi: 92, target: 100 },
  { name: 'Jun', realisasi: 89, target: 100 },
];

const dataTahun = [
  { name: '2023', realisasi: 88.5 },
  { name: '2024', realisasi: 91.2 },
];

export default function GrafikCapaianPage() {
  const currentMonth = dataBulan[dataBulan.length - 1].realisasi;
  const previousMonth = dataBulan[dataBulan.length - 2].realisasi;
  const gap = currentMonth - previousMonth;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Analisa & Grafik Capaian</h2>
          <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider font-bold">Visualisasi & Rekomendasi Kesehatan Lingkungan</p>
        </div>
        <select className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00A8A8]">
            <option>Semua Indikator</option>
            <option>IND-01 Kualitas Air Bersih</option>
            <option>IND-02 Pengelolaan Limbah</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp size={64} />
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Capaian Terkini (Juni)</p>
            <div className="flex items-end space-x-2">
                <span className="text-4xl font-black text-gray-800">{currentMonth}%</span>
                <span className="text-sm font-bold text-gray-400 mb-1">/ 100% Target</span>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold">
                {gap >= 0 ? (
                    <span className="text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-md">
                        <TrendingUp size={16} className="mr-1" />
                        +{gap.toFixed(1)}% dari Mei
                    </span>
                ) : (
                    <span className="text-red-500 flex items-center bg-red-50 px-2 py-1 rounded-md">
                        <TrendingDown size={16} className="mr-1" />
                        {gap.toFixed(1)}% dari Mei
                    </span>
                )}
            </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <CheckCircle2 size={64} />
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Rata-rata 6 Bulan</p>
            <div className="flex items-end space-x-2">
                <span className="text-4xl font-black text-[#00A8A8]">{(dataBulan.reduce((a,b)=>a+b.realisasi,0)/dataBulan.length).toFixed(1)}%</span>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md w-fit">
                Masih di bawah target 100%
            </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp size={64} />
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Year over Year (YoY)</p>
            <div className="flex items-end space-x-2">
                <span className="text-4xl font-black text-indigo-600">+{(dataTahun[1].realisasi - dataTahun[0].realisasi).toFixed(1)}%</span>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md w-fit">
                Peningkatan dibanding 2023
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
           <h3 className="font-bold text-gray-700 mb-6 flex items-center">
             <BarChart className="w-5 h-5 mr-2 text-[#00A8A8]" />
             Tren Realisasi vs Target Bulanan
           </h3>
           <div className="flex-1 min-h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={dataBulan} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                 <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                 <YAxis stroke="#9ca3af" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} domain={[0, 100]} />
                 <RechartsTooltip 
                   cursor={{fill: '#f9fafb'}}
                   contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                 />
                 <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                 <Bar dataKey="target" name="Target (%)" fill="#e5e7eb" radius={[4, 4, 0, 0]} barSize={24} />
                 <Bar dataKey="realisasi" name="Realisasi (%)" fill="#00A8A8" radius={[4, 4, 0, 0]} barSize={24} />
               </BarChart>
             </ResponsiveContainer>
           </div>
         </div>

         <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100/50 shadow-sm flex flex-col">
            <h3 className="font-bold text-amber-900 mb-6 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
              Gap Analysis & Rekomendasi
            </h3>
            
            <div className="space-y-5 overflow-y-auto pr-1">
                <div className="bg-white/60 p-4 rounded-xl border border-amber-100">
                    <div className="flex items-start">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 mr-2 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-amber-900">Penurunan Kinerja Limbah (-3.0%)</p>
                            <p className="text-[11px] text-amber-700/80 mt-1 leading-relaxed">
                                Terdapat penurunan capaian kepatuhan pemilahan limbah medis di ruangan OK dan IGD dibandingkan bulan lalu.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-emerald-100">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 mb-2">Tindakan Preventif</p>
                    <ul className="text-[11px] text-gray-700 space-y-2 list-disc pl-4 leading-relaxed font-medium">
                        <li>Lakukan re-edukasi on-site (briefing 5 menit) di ruang operasi terkait kode warna tempat sampah.</li>
                        <li>Pastikan ketersediaan plastik limbah kuning dan hitam selalu mencukupi sebelum pergantian shift.</li>
                        <li>Tingkatkan supervisi insidental oleh kepala ruangan dua kali sepekan.</li>
                    </ul>
                </div>

                <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-blue-100">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-blue-600 mb-2">Pedoman Kemenkes</p>
                    <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
                        Berdasarkan Permenkes No. 7 Tahun 2019, pemilahan limbah B3 harus dilakukan pewadahan dan tidak boleh bercampur dengan limbah domestik untuk meminimalisir risiko infeksi nosokomial.
                    </p>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}
