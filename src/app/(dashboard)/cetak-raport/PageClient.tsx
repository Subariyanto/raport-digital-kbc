"use client";

import { useState, useEffect } from "react";
import { demoStore } from "@/lib/demo-store";
import { Siswa, Kelas } from "@/lib/types";
import {
  nilaiToPredikat,
  generateDeskripsiKokurikuler,
  generateDeskripsiEkstrakurikuler,
} from "@/lib/deskripsi-generator";
import { Auth } from "@/lib/auth";
import { Tier } from "@/lib/tier";
import { Printer } from "lucide-react";
import toast from "react-hot-toast";

// Helper: baca deskripsi aux (kokurikuler / ekstrakurikuler) dari localStorage
function readAux(key: string): Array<{
  id: string;
  siswa_id: string;
  kelas_id: string;
  deskripsi_text: string | null;
}> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`rdm_${key}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

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
    const allKoko = demoStore.getKokurikuler();
    const allCatatan = demoStore.getCatatan();

    // Build nilai per mapel
    const nilaiPerMapel = mapelList.map(mapel => {
      const nilaiSiswa = allNilai.filter(n => n.siswa_id === selectedSiswa && n.mapel_id === mapel.id && n.kelas_id === selectedKelas);
      const avg = nilaiSiswa.length > 0 ? Math.round(nilaiSiswa.reduce((sum, n) => sum + (n.nilai_akhir || 0), 0) / nilaiSiswa.length) : null;
      const deskripsi = allDeskripsi.find(d => d.siswa_id === selectedSiswa && d.mapel_id === mapel.id && d.kelas_id === selectedKelas);
      const pred = nilaiToPredikat(avg);
      return {
        mapel: mapel.nama,
        kelompok: mapel.kelompok,
        nilai: avg,
        predikat: pred.huruf,
        predikatLabel: pred.label,
        deskripsi: deskripsi?.deskripsi_text || "",
      };
    });

    const presensi = allPresensi.find(p => p.siswa_id === selectedSiswa && p.kelas_id === selectedKelas);
    const ekskul = allEkskul.filter(e => e.siswa_id === selectedSiswa && e.kelas_id === selectedKelas);
    const koko = allKoko.filter(k => k.siswa_id === selectedSiswa && k.kelas_id === selectedKelas);
    const catatan = allCatatan.find(c => c.siswa_id === selectedSiswa && c.kelas_id === selectedKelas);

    // Deskripsi naratif kokurikuler & ekstrakurikuler.
    // Prioritas: yang sudah disimpan via menu Deskripsi Otomatis;
    // kalau belum ada, auto-generate dari data kegiatan supaya raport tidak kosong.
    const savedKoko = readAux("deskripsi_kokurikuler").find(
      d => d.siswa_id === selectedSiswa && d.kelas_id === selectedKelas
    )?.deskripsi_text || "";
    const savedEks = readAux("deskripsi_ekstrakurikuler").find(
      d => d.siswa_id === selectedSiswa && d.kelas_id === selectedKelas
    )?.deskripsi_text || "";

    const deskKoko = savedKoko
      ? savedKoko
      : (siswa && koko.length > 0
          ? generateDeskripsiKokurikuler({
              namaSiswa: siswa.nama,
              kegiatan: koko.map(k => ({
                nama_kegiatan: k.nama_kegiatan,
                nilai: k.nilai,
                keterangan: k.keterangan,
              })),
            })
          : "");
    const deskEks = savedEks
      ? savedEks
      : (siswa && ekskul.length > 0
          ? generateDeskripsiEkstrakurikuler({
              namaSiswa: siswa.nama,
              kegiatan: ekskul.map((e: any) => ({
                nama_kegiatan: e.nama_kegiatan,
                nilai: e.nilai ?? null,
                keterangan: e.keterangan,
              })),
            })
          : "");

    setRaportData({ madrasah, siswa, kelas, nilaiPerMapel, presensi, ekskul, koko, catatan, deskKoko, deskEks });
  }, [selectedSiswa, selectedKelas]);

  const handlePrint = () => {
    const me = Auth.current();
    if (Tier.isLocked(me)) {
      toast.error("Trial sudah habis. Aktivasi kode FULL untuk mencetak raport.");
      return;
    }
    window.print();
  };

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

          {/* Nilai Akademik (Intrakurikuler) */}
          <h4 className="font-bold text-sm mb-2">A. NILAI AKADEMIK (INTRAKURIKULER)</h4>
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

          {/* Kokurikuler */}
          <h4 className="font-bold text-sm mb-2">B. KOKURIKULER (Projek Penguatan Profil Pelajar Pancasila Rahmatan lil Alamin)</h4>
          <table className="w-full text-sm border border-gray-300 mb-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left">No</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Nama Kegiatan / Proyek</th>
                <th className="border border-gray-300 px-2 py-1 text-center">Nilai</th>
                <th className="border border-gray-300 px-2 py-1 text-center">Predikat</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {raportData.koko.length === 0 ? (
                <tr><td colSpan={5} className="border border-gray-300 px-2 py-1 text-center text-gray-400">-</td></tr>
              ) : (
                raportData.koko.map((k: any, idx: number) => {
                  const pred = nilaiToPredikat(k.nilai ?? null);
                  return (
                    <tr key={idx}>
                      <td className="border border-gray-300 px-2 py-1">{idx + 1}</td>
                      <td className="border border-gray-300 px-2 py-1">{k.nama_kegiatan}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{k.nilai ?? "-"}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{pred.label}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{k.keterangan || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {raportData.deskKoko ? (
            <div className="border border-gray-300 border-t-0 px-3 py-2 text-xs text-gray-700 italic mb-6">
              <span className="font-semibold not-italic text-gray-800">Deskripsi: </span>
              {raportData.deskKoko}
            </div>
          ) : (
            <div className="mb-6"></div>
          )}

          {/* Ekskul */}
          <h4 className="font-bold text-sm mb-2">C. EKSTRAKURIKULER</h4>
          <table className="w-full text-sm border border-gray-300 mb-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left">No</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Kegiatan</th>
                <th className="border border-gray-300 px-2 py-1 text-center">Nilai</th>
                <th className="border border-gray-300 px-2 py-1 text-center">Predikat</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {raportData.ekskul.length === 0 ? (
                <tr><td colSpan={5} className="border border-gray-300 px-2 py-1 text-center text-gray-400">-</td></tr>
              ) : (
                raportData.ekskul.map((ek: any, idx: number) => {
                  const pred = nilaiToPredikat(ek.nilai ?? null);
                  // fallback: kalau nilai null tapi predikat lama (string) ada, pakai itu
                  const labelTampil = pred.label !== "-" ? pred.label : (ek.predikat || "-");
                  return (
                    <tr key={idx}>
                      <td className="border border-gray-300 px-2 py-1">{idx + 1}</td>
                      <td className="border border-gray-300 px-2 py-1">{ek.nama_kegiatan}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{ek.nilai ?? "-"}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{labelTampil}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{ek.keterangan || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {raportData.deskEks ? (
            <div className="border border-gray-300 border-t-0 px-3 py-2 text-xs text-gray-700 italic mb-6">
              <span className="font-semibold not-italic text-gray-800">Deskripsi: </span>
              {raportData.deskEks}
            </div>
          ) : (
            <div className="mb-6"></div>
          )}

          {/* Presensi */}
          <h4 className="font-bold text-sm mb-2">D. KETIDAKHADIRAN</h4>
          <div className="grid grid-cols-4 gap-2 text-sm mb-6">
            <div className="border border-gray-300 px-3 py-2 text-center"><p className="text-gray-600 text-xs">Sakit</p><p className="font-bold">{raportData.presensi?.sakit ?? 0} hari</p></div>
            <div className="border border-gray-300 px-3 py-2 text-center"><p className="text-gray-600 text-xs">Izin</p><p className="font-bold">{raportData.presensi?.izin ?? 0} hari</p></div>
            <div className="border border-gray-300 px-3 py-2 text-center"><p className="text-gray-600 text-xs">Alpa</p><p className="font-bold">{raportData.presensi?.alpa ?? 0} hari</p></div>
            <div className="border border-gray-300 px-3 py-2 text-center"><p className="text-gray-600 text-xs">Total Hadir</p><p className="font-bold">{raportData.presensi?.hadir ?? 0} hari</p></div>
          </div>

          {/* Catatan */}
          <h4 className="font-bold text-sm mb-2">E. CATATAN WALI KELAS</h4>
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
