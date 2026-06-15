"use client";

import { Users, GraduationCap, BookOpen, FileText } from "lucide-react";
import { demoStore } from "@/lib/demo-store";
import { useState, useEffect } from "react";

export default function DashboardClient() {
  const [stats, setStats] = useState({ guru: 0, siswa: 0, kelas: 0, mapel: 0 });
  const [madrasah, setMadrasah] = useState<{ nama: string; tahun_pelajaran: string | null; semester: number | null } | null>(null);

  useEffect(() => {
    setStats({
      guru: demoStore.getGuru().length,
      siswa: demoStore.getSiswa().length,
      kelas: demoStore.getKelas().length,
      mapel: demoStore.getMapel().length,
    });
    const m = demoStore.getMadrasah();
    if (m && m.nama && m.nama.trim()) {
      setMadrasah({ nama: m.nama, tahun_pelajaran: m.tahun_pelajaran, semester: m.semester });
    }
  }, []);

  const cards = [
    { label: "Guru", value: stats.guru, icon: Users, color: "bg-blue-500" },
    { label: "Siswa", value: stats.siswa, icon: GraduationCap, color: "bg-purple-500" },
    { label: "Kelas", value: stats.kelas, icon: BookOpen, color: "bg-orange-500" },
    { label: "Mata Pelajaran", value: stats.mapel, icon: FileText, color: "bg-teal-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Selamat Datang!</h2>
        <p className="text-gray-500">Gunakan menu di samping kiri untuk mengakses fitur-fitur Raport Digital Madrasah KBC.</p>
        {madrasah ? (
          <p className="text-gray-400 text-sm mt-2">
            {madrasah.nama}
            {madrasah.tahun_pelajaran ? ` · TA ${madrasah.tahun_pelajaran}` : ""}
            {madrasah.semester ? ` · Semester ${madrasah.semester} (${madrasah.semester === 1 ? "Ganjil" : "Genap"})` : ""}
          </p>
        ) : (
          <p className="text-gray-400 text-sm mt-2">
            Lengkapi data madrasah Anda di menu <strong>Data Madrasah</strong>.
          </p>
        )}
      </div>
    </div>
  );
}
