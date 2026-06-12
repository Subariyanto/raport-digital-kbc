"use client";

import { useState, useEffect, useCallback } from "react";
import { demoStore } from "@/lib/demo-store";
import toast from "react-hot-toast";
import { Search, Printer, User } from "lucide-react";

interface SiswaDetail {
  id: string;
  nis: string;
  nisn: string;
  nama: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  agama: string;
  alamat: string;
  nama_ayah: string;
  nama_ibu: string;
  nama_wali: string | null;
  hp_ortu: string;
  jenjang: string;
  fase: string;
  status: string;
  kelas_id: string | null;
}

export default function BukuIndukPage() {
  const [siswaList, setSiswaList] = useState<SiswaDetail[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaDetail | null>(null);
  const [filterKelas, setFilterKelas] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    setSiswaList(demoStore.getSiswa() as any[]);
    setKelasList(demoStore.getKelas());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredSiswa = siswaList.filter(s => {
    const matchSearch = s.nama.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search) || s.nisn.includes(search);
    const matchKelas = !filterKelas || s.kelas_id === filterKelas;
    return matchSearch && matchKelas;
  });

  const getKelasName = (kelasId: string | null) => {
    if (!kelasId) return "-";
    const kelas = kelasList.find(k => k.id === kelasId);
    return kelas ? kelas.nama_rombel : "-";
  };

  const handlePrint = () => {
    if (!selectedSiswa) return;
    window.print();
  };

  if (selectedSiswa) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button onClick={() => setSelectedSiswa(null)} className="text-green-700 hover:text-green-900 font-medium">
            ← Kembali ke Daftar
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800">
            <Printer size={16} />
            Cetak
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
          <div className="text-center mb-6 border-b pb-4">
            <h1 className="text-xl font-bold text-gray-800">BUKU INDUK SISWA</h1>
            <p className="text-sm text-gray-500">MI Nurul Hikmah</p>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-24 h-32 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
              <User size={40} className="text-gray-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{selectedSiswa.nama}</h2>
              <p className="text-sm text-gray-500">NIS: {selectedSiswa.nis} | NISN: {selectedSiswa.nisn}</p>
              <p className="text-sm text-gray-500">Kelas: {getKelasName(selectedSiswa.kelas_id)}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${selectedSiswa.status === "aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {selectedSiswa.status}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 border-b border-green-200 pb-1">A. Data Pribadi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Nama Lengkap:</span> <span className="font-medium">{selectedSiswa.nama}</span></div>
                <div><span className="text-gray-500">NIS:</span> <span className="font-medium">{selectedSiswa.nis}</span></div>
                <div><span className="text-gray-500">NISN:</span> <span className="font-medium">{selectedSiswa.nisn}</span></div>
                <div><span className="text-gray-500">Tempat, Tgl Lahir:</span> <span className="font-medium">{selectedSiswa.tempat_lahir}, {selectedSiswa.tanggal_lahir}</span></div>
                <div><span className="text-gray-500">Jenis Kelamin:</span> <span className="font-medium">{selectedSiswa.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</span></div>
                <div><span className="text-gray-500">Agama:</span> <span className="font-medium">{selectedSiswa.agama}</span></div>
                <div className="md:col-span-2"><span className="text-gray-500">Alamat:</span> <span className="font-medium">{selectedSiswa.alamat}</span></div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 border-b border-green-200 pb-1">B. Data Orang Tua / Wali</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Nama Ayah:</span> <span className="font-medium">{selectedSiswa.nama_ayah}</span></div>
                <div><span className="text-gray-500">Nama Ibu:</span> <span className="font-medium">{selectedSiswa.nama_ibu}</span></div>
                <div><span className="text-gray-500">Nama Wali:</span> <span className="font-medium">{selectedSiswa.nama_wali || "-"}</span></div>
                <div><span className="text-gray-500">No. HP Orang Tua:</span> <span className="font-medium">{selectedSiswa.hp_ortu}</span></div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 border-b border-green-200 pb-1">C. Data Akademik</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Jenjang:</span> <span className="font-medium">{selectedSiswa.jenjang}</span></div>
                <div><span className="text-gray-500">Fase:</span> <span className="font-medium">{selectedSiswa.fase}</span></div>
                <div><span className="text-gray-500">Kelas:</span> <span className="font-medium">{getKelasName(selectedSiswa.kelas_id)}</span></div>
                <div><span className="text-gray-500">Status:</span> <span className="font-medium capitalize">{selectedSiswa.status}</span></div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 border-b border-green-200 pb-1">D. Riwayat Nilai</h3>
              {(() => {
                const nilaiSiswa = demoStore.getNilai().filter(n => n.siswa_id === selectedSiswa.id);
                const mapelList = demoStore.getMapel();
                const tpList = demoStore.getTP();
                if (nilaiSiswa.length === 0) return <p className="text-sm text-gray-400 italic">Belum ada data nilai</p>;
                return (
                  <table className="w-full text-sm border border-gray-200 rounded">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left border-b">Mata Pelajaran</th>
                        <th className="px-3 py-2 text-left border-b">TP</th>
                        <th className="px-3 py-2 text-center border-b">Nilai Akhir</th>
                        <th className="px-3 py-2 text-center border-b">Predikat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nilaiSiswa.map((n, i) => {
                        const mapel = mapelList.find(m => m.id === n.mapel_id);
                        const tp = tpList.find(t => t.id === n.tp_id);
                        return (
                          <tr key={i} className="border-b last:border-0">
                            <td className="px-3 py-2">{mapel?.nama || "-"}</td>
                            <td className="px-3 py-2">{tp?.kode || "-"}</td>
                            <td className="px-3 py-2 text-center font-medium">{n.nilai_akhir}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                n.predikat === "A" ? "bg-green-100 text-green-700" :
                                n.predikat === "B" ? "bg-blue-100 text-blue-700" :
                                n.predikat === "C" ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-700"
                              }`}>{n.predikat}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </section>

            <section>
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 border-b border-green-200 pb-1">E. Presensi</h3>
              {(() => {
                const presensi = demoStore.getPresensi().filter(p => p.siswa_id === selectedSiswa.id);
                if (presensi.length === 0) return <p className="text-sm text-gray-400 italic">Belum ada data presensi</p>;
                const hadir = presensi.filter(p => p.status === "hadir").length;
                const sakit = presensi.filter(p => p.status === "sakit").length;
                const izin = presensi.filter(p => p.status === "izin").length;
                const alpa = presensi.filter(p => p.status === "alpa").length;
                return (
                  <div className="grid grid-cols-4 gap-3 text-sm text-center">
                    <div className="bg-green-50 rounded-lg p-3"><p className="text-lg font-bold text-green-700">{hadir}</p><p className="text-xs text-gray-500">Hadir</p></div>
                    <div className="bg-yellow-50 rounded-lg p-3"><p className="text-lg font-bold text-yellow-700">{sakit}</p><p className="text-xs text-gray-500">Sakit</p></div>
                    <div className="bg-blue-50 rounded-lg p-3"><p className="text-lg font-bold text-blue-700">{izin}</p><p className="text-xs text-gray-500">Izin</p></div>
                    <div className="bg-red-50 rounded-lg p-3"><p className="text-lg font-bold text-red-700">{alpa}</p><p className="text-xs text-gray-500">Alpa</p></div>
                  </div>
                );
              })()}
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Buku Induk Siswa</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, NIS, atau NISN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="">Semua Kelas</option>
          {kelasList.map(k => (
            <option key={k.id} value={k.id}>{k.nama_rombel}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-green-800">No</th>
              <th className="px-4 py-3 text-left font-medium text-green-800">NIS</th>
              <th className="px-4 py-3 text-left font-medium text-green-800">Nama</th>
              <th className="px-4 py-3 text-left font-medium text-green-800">L/P</th>
              <th className="px-4 py-3 text-left font-medium text-green-800">Kelas</th>
              <th className="px-4 py-3 text-left font-medium text-green-800">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>
            ) : filteredSiswa.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada data siswa</td></tr>
            ) : (
              filteredSiswa.map((s, i) => (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3">{s.nis}</td>
                  <td className="px-4 py-3 font-medium">{s.nama}</td>
                  <td className="px-4 py-3">{s.jenis_kelamin}</td>
                  <td className="px-4 py-3">{getKelasName(s.kelas_id)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedSiswa(s)}
                      className="text-green-700 hover:text-green-900 font-medium text-sm"
                    >
                      Lihat Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
