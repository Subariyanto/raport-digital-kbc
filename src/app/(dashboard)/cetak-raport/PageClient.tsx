"use client";

import { useState, useEffect } from "react";
import { demoStore } from "@/lib/demo-store";
import { Siswa, Kelas, MataPelajaran } from "@/lib/types";
import { Printer } from "lucide-react";

export default function CetakRaportPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedSiswa, setSelectedSiswa] = useState("");
  const [raportData, setRaportData] = useState<any>(null);

  useEffect(() => { setKelasList(demoStore.getKelas()); }, []);

  useEffect(() => {
    if (!selectedKelas) { setSiswaList([]); return; }
    setSiswaList(demoStore.getSiswa().filter(s => s.kelas_id === selectedKelas));
  }, [selectedKelas]);

  useEffect(() => {
    if (!selectedSiswa || !selectedKelas) { setRaportData(null); return; }

    const madrasah = demoStore.getMadrasah();
    const siswa = demoStore.getSiswa().find(s => s.id === selectedSiswa);
    const kelas = demoStore.getKelas().find(k => k.id === selectedKelas);
    const mapelList = demoStore.getMapel();
    const allNilai = demoStore.getNilai();
    const allDeskripsi = demoStore.getDeskripsi();
    const allPresensi = demoStore.getPresensi();
    const allEkskul = demoStore.getEkskul();
    const allCatatan = demoStore.getCatatan();
    const allTp = demoStore.getTP();
    const allCp = demoStore.getCP();

    // Build nilai per mapel
    const nilaiPerMapel = mapelList.map(mapel => {
      const nilaiSiswa = allNilai.filter(n => n.siswa_id === selectedSiswa && n.mapel_id === mapel.id && n.kelas_id === selectedKelas);
      const avg = nilaiSiswa.length > 0 ? Math.round(nilaiSiswa.reduce((sum, n) => sum + (n.nilai_akhir || 0), 0) / nilaiSiswa.length) : null;
      const deskripsi = allDeskripsi.find(d => d.siswa_id === selectedSiswa && d.mapel_id === mapel.id && d.kelas_id === selectedKelas);
      return { mapel: mapel.nama, kelompok: mapel.kelompok, nilai: avg, predikat: avg ? (avg >= 90 ? "A" : avg >= 80 ? "B" : avg >= 70 ? "C" : "D") : "-", deskripsi: deskripsi?.deskripsi_text || "" };
    });

    const presensi = allPresensi.find(p => p.siswa_id === selectedSiswa && p.kelas_id === selectedKelas);
    const ekskul = allEkskul.filter(e => e.siswa_id === selectedSiswa);
    const catatan = allCatatan.find(c => c.siswa_id === selectedSiswa && c.kelas_id === selectedKelas);

    setRaportData({ madrasah, siswa, kelas, nilaiPerMapel, presensi, ekskul, catatan });
  }, [selectedSiswa, selectedKelas]);

  const handlePrint = () => { window.print(); };

  return (
    <div>
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Cetak Raport</h1>

        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
              <select value={selectedKelas} onChange={(e) => { setSelectedKelas(e.target.value); setSelectedSiswa(""); }} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_rombel}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Siswa</label>
              <select value={selectedSiswa} onChange={(e) => setSelectedSiswa(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="">-- Pilih Siswa --</option>
                {siswaList.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              {raportData && (
                <button onClick={handlePrint} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Printer size={16} /> Cetak / Print
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {!raportData ? (
        <div className="text-center py-12 text-gray-400 print:hidden">Pilih kelas dan siswa untuk preview raport</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-6 print:shadow-none print:border-0 print:p-0">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
            <h2 className="text-lg font-bold uppercase">LAPORAN HASIL BELAJAR</h2>
            <h3 className="text-base font-bold">{raportData.madrasah.nama}</h3>
            <p className="text-sm text-gray-600">{raportData.madrasah.alamat}, {raportData.madrasah.desa}, {raportData.madrasah.kecamatan}</p>
            <p className="text-sm text-gray-600">{raportData.madrasah.kabupaten}, {raportData.madrasah.provinsi}</p>
          </div>

          {/* Identitas Siswa */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mb-6">
            <div className="flex"><span className="w-32 text-gray-600">Nama</span><span>: {raportData.siswa?.nama}</span></div>
            <div className="flex"><span className="w-32 text-gray-600">NIS/NISN</span><span>: {raportData.siswa?.nis} / {raportData.siswa?.nisn}</span></div>
            <div className="flex"><span className="w-32 text-gray-600">Kelas</span><span>: {raportData.kelas?.nama_rombel}</span></div>
            <div className="flex"><span className="w-32 text-gray-600">Fase</span><span>: {raportData.kelas?.fase}</span></div>
            <div className="flex"><span className="w-32 text-gray-600">Semester</span><span>: {raportData.kelas?.semester === 1 ? "1 (Ganjil)" : "2 (Genap)"}</span></div>
            <div className="flex"><span className="w-32 text-gray-600">Tahun Pelajaran</span><span>: {raportData.kelas?.tahun_pelajaran}</span></div>
          </div>

          {/* Nilai */}
          <h4 className="font-bold text-sm mb-2">A. NILAI AKADEMIK</h4>
          <table className="w-full text-sm border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left">No</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Mata Pelajaran</th>
                <th className="border border-gray-300 px-2 py-1 text-center">Nilai</th>
                <th className="border border-gray-300 px-2 py-1 text-center">Predikat</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {raportData.nilaiPerMapel.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-gray-300 px-2 py-1">{idx + 1}</td>
                  <td className="border border-gray-300 px-2 py-1">{item.mapel}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{item.nilai ?? "-"}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{item.predikat}</td>
                  <td className="border border-gray-300 px-2 py-1 text-xs">{item.deskripsi || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Ekskul */}
          <h4 className="font-bold text-sm mb-2">B. EKSTRAKURIKULER</h4>
          <table className="w-full text-sm border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left">No</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Kegiatan</th>
                <th className="border border-gray-300 px-2 py-1 text-center">Predikat</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {raportData.ekskul.length === 0 ? (
                <tr><td colSpan={4} className="border border-gray-300 px-2 py-1 text-center text-gray-400">-</td></tr>
              ) : (
                  raportData.ekskul.map((ek: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 px-2 py-1">{idx + 1}</td>
                    <td className="border border-gray-300 px-2 py-1">{ek.nama_kegiatan}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{ek.predikat || "-"}</td>
                    <td className="border border-gray-300 px-2 py-1 text-xs">{ek.keterangan || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Presensi */}
          <h4 className="font-bold text-sm mb-2">C. KETIDAKHADIRAN</h4>
          <div className="grid grid-cols-4 gap-2 text-sm mb-6">
            <div className="border border-gray-300 px-3 py-2 text-center"><p className="text-gray-600 text-xs">Sakit</p><p className="font-bold">{raportData.presensi?.sakit ?? 0} hari</p></div>
            <div className="border border-gray-300 px-3 py-2 text-center"><p className="text-gray-600 text-xs">Izin</p><p className="font-bold">{raportData.presensi?.izin ?? 0} hari</p></div>
            <div className="border border-gray-300 px-3 py-2 text-center"><p className="text-gray-600 text-xs">Alpa</p><p className="font-bold">{raportData.presensi?.alpa ?? 0} hari</p></div>
            <div className="border border-gray-300 px-3 py-2 text-center"><p className="text-gray-600 text-xs">Total Hadir</p><p className="font-bold">{raportData.presensi?.hadir ?? 0} hari</p></div>
          </div>

          {/* Catatan */}
          <h4 className="font-bold text-sm mb-2">D. CATATAN WALI KELAS</h4>
          <div className="border border-gray-300 p-3 rounded text-sm mb-6 min-h-[60px]">
            {raportData.catatan?.catatan || <span className="text-gray-400">Belum ada catatan</span>}
          </div>

          {/* TTD */}
          <div className="grid grid-cols-2 gap-8 text-sm mt-8">
            <div className="text-center">
              <p>Mengetahui,</p>
              <p>Kepala Madrasah</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{raportData.madrasah.kepala_madrasah}</p>
              <p>NIP. {raportData.madrasah.nip_kepala || "-"}</p>
            </div>
            <div className="text-center">
              <p>{raportData.madrasah.kabupaten}, .................... 20....</p>
              <p>Wali Kelas</p>
              <div className="h-16"></div>
              <p className="font-bold underline">................................</p>
              <p>NIP. ................................</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
