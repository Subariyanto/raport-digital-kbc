"use client";

import { GraduationCap, Users, Layers, BookOpen, CheckCircle, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Props {
  siswaCount: number;
  guruCount: number;
  kelasCount: number;
  mapelCount: number;
  raportLengkap: number;
  raportBelum: number;
  nilaiPerKelas: { nama: string; rataRata: number }[];
}

const COLORS = ["#4CAF50", "#FF9800", "#2196F3", "#9C27B0", "#F44336", "#00BCD4"];
void COLORS; // used for future chart extensions

export default function DashboardClient({
  siswaCount, guruCount, kelasCount, mapelCount,
  raportLengkap, raportBelum, nilaiPerKelas,
}: Props) {
  const cards = [
    { label: "Total Siswa", value: siswaCount, icon: <GraduationCap size={28} />, color: "bg-blue-500" },
    { label: "Total Guru", value: guruCount, icon: <Users size={28} />, color: "bg-green-500" },
    { label: "Total Kelas", value: kelasCount, icon: <Layers size={28} />, color: "bg-purple-500" },
    { label: "Mata Pelajaran", value: mapelCount, icon: <BookOpen size={28} />, color: "bg-orange-500" },
    { label: "Raport Lengkap", value: raportLengkap, icon: <CheckCircle size={28} />, color: "bg-emerald-500" },
    { label: "Raport Belum Lengkap", value: raportBelum, icon: <AlertCircle size={28} />, color: "bg-red-500" },
  ];

  const pieData = [
    { name: "Lengkap", value: raportLengkap },
    { name: "Belum Lengkap", value: raportBelum },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
            <div className={`${card.color} text-white p-3 rounded-lg`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bar Chart - Rata-rata Nilai per Kelas */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Rata-rata Nilai per Kelas</h2>
          {nilaiPerKelas.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={nilaiPerKelas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nama" fontSize={12} />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip />
                <Bar dataKey="rataRata" fill="#4CAF50" radius={[4, 4, 0, 0]} name="Rata-rata" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-12">Belum ada data nilai</p>
          )}
        </div>

        {/* Pie Chart - Status Raport */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Status Kelengkapan Raport</h2>
          {(raportLengkap + raportBelum) > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#4CAF50" : "#FF9800"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-12">Belum ada data raport</p>
          )}
        </div>
      </div>

      {/* Welcome */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Selamat Datang</h2>
        <p className="text-gray-600 text-sm">
          Aplikasi Raport Digital Madrasah berbasis Kurikulum Berbasis Cinta (KBC).
          Gunakan menu di samping untuk mengelola data dan mencetak raport.
        </p>
      </div>
    </div>
  );
}
