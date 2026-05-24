"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Kelas, Siswa, Nilai, DeskripsiRapor, Presensi, Ekstrakurikuler, Madrasah } from "@/lib/types";
import { FileText, Download, Eye } from "lucide-react";

interface RaportData {
  siswa: Siswa;
  madrasah: Madrasah;
  kelas: Kelas;
  nilai: { mapel_nama: string; nilai_akhir: number; predikat: string; deskripsi: string }[];
  presensi: Presensi | null;
  ekstrakurikuler: Ekstrakurikuler[];
  catatan_wali_kelas: string;
}

export default function CetakRaportPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedSiswa, setSelectedSiswa] = useState("");
  const [loading, setLoading] = useState(false);
  const [raportData, setRaportData] = useState<RaportData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchKelas = async () => {
      const { data } = await supabase.from("kelas").select("*").order("jenjang").order("tingkat");
      setKelasList(data || []);
    };
    fetchKelas();
  }, [supabase]);

  useEffect(() => {
    if (!selectedKelas) { setSiswaList([]); return; }
    const fetchSiswa = async () => {
      const { data } = await supabase.from("siswa").select("*").eq("kelas_id", selectedKelas).eq("status", "aktif").order("nama");
      setSiswaList(data || []);
    };
    fetchSiswa();
  }, [selectedKelas, supabase]);

  const generateRaport = useCallback(async (siswaId: string) => {
    setLoading(true);
    const kelas = kelasList.find((k) => k.id === selectedKelas);
    if (!kelas) { setLoading(false); return; }

    const siswa = siswaList.find((s) => s.id === siswaId);
    if (!siswa) { setLoading(false); return; }

    // Fetch madrasah
    const { data: madrasah } = await supabase.from("madrasah").select("*").eq("id", siswa.madrasah_id).single();

    // Fetch nilai grouped by mapel
    const { data: nilaiData } = await supabase
      .from("nilai").select("*, mata_pelajaran:mapel_id(nama)")
      .eq("siswa_id", siswaId).eq("kelas_id", selectedKelas)
      .eq("semester", kelas.semester).eq("tahun_pelajaran", kelas.tahun_pelajaran);

    // Fetch deskripsi
    const { data: deskripsiData } = await supabase
      .from("deskripsi_rapor").select("*")
      .eq("siswa_id", siswaId).eq("kelas_id", selectedKelas)
      .eq("semester", kelas.semester).eq("tahun_pelajaran", kelas.tahun_pelajaran);

    // Group nilai by mapel and calculate average
    const mapelNilai: Record<string, { nama: string; values: number[]; predikat: string }> = {};
    (nilaiData || []).forEach((n: Nilai & { mata_pelajaran: { nama: string } }) => {
      const mapelNama = n.mata_pelajaran?.nama || "Unknown";
      if (!mapelNilai[n.mapel_id]) {
        mapelNilai[n.mapel_id] = { nama: mapelNama, values: [], predikat: "" };
      }
      if (n.nilai_akhir) mapelNilai[n.mapel_id].values.push(n.nilai_akhir);
    });

    const deskripsiMap: Record<string, string> = {};
    (deskripsiData || []).forEach((d: DeskripsiRapor) => {
      deskripsiMap[d.mapel_id] = d.deskripsi_text || "";
    });

    const nilaiResult = Object.entries(mapelNilai).map(([mapelId, data]) => {
      const avg = data.values.length > 0 ? Math.round(data.values.reduce((a, b) => a + b, 0) / data.values.length) : 0;
      const predikat = avg >= 90 ? "A" : avg >= 80 ? "B" : avg >= 70 ? "C" : avg >= 60 ? "D" : "E";
      return {
        mapel_nama: data.nama,
        nilai_akhir: avg,
        predikat,
        deskripsi: deskripsiMap[mapelId] || "-",
      };
    });

    // Fetch presensi
    const { data: presensi } = await supabase
      .from("presensi").select("*")
      .eq("siswa_id", siswaId).eq("kelas_id", selectedKelas)
      .eq("semester", kelas.semester).eq("tahun_pelajaran", kelas.tahun_pelajaran)
      .single();

    // Fetch ekstrakurikuler
    const { data: ekskul } = await supabase
      .from("ekstrakurikuler").select("*")
      .eq("siswa_id", siswaId).eq("kelas_id", selectedKelas)
      .eq("semester", kelas.semester).eq("tahun_pelajaran", kelas.tahun_pelajaran);

    // Fetch catatan wali kelas
    const { data: catatan } = await supabase
      .from("catatan_wali_kelas").select("*")
      .eq("siswa_id", siswaId).eq("kelas_id", selectedKelas)
      .eq("semester", kelas.semester).eq("tahun_pelajaran", kelas.tahun_pelajaran)
      .single();

    setRaportData({
      siswa,
      madrasah: madrasah!,
      kelas,
      nilai: nilaiResult,
      presensi: presensi || null,
      ekstrakurikuler: ekskul || [],
      catatan_wali_kelas: catatan?.catatan || "",
    });

    setShowPreview(true);
    setLoading(false);
  }, [selectedKelas, kelasList, siswaList, supabase]);

  const printRaport = () => {
    window.print();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6 print:hidden">Cetak Raport</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>
            <select value={selectedKelas} onChange={(e) => { setSelectedKelas(e.target.value); setSelectedSiswa(""); setShowPreview(false); }} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map((k) => <option key={k.id} value={k.id}>{k.jenjang} - {k.nama_rombel} (Smt {k.semester})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Siswa</label>
            <select value={selectedSiswa} onChange={(e) => { setSelectedSiswa(e.target.value); setShowPreview(false); }} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Pilih Siswa --</option>
              {siswaList.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            {selectedSiswa && (
              <button onClick={() => generateRaport(selectedSiswa)} disabled={loading} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                <Eye size={16} /> {loading ? "Memuat..." : "Preview"}
              </button>
            )}
            {showPreview && (
              <button onClick={printRaport} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Download size={16} /> Cetak/PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Raport Preview */}
      {showPreview && raportData && (
        <div className="bg-white rounded-xl shadow-sm border p-8 print:shadow-none print:border-none print:p-0" id="raport-preview">
          {/* Kop */}
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h2 className="text-sm font-bold uppercase">Kementerian Agama Republik Indonesia</h2>
            <h1 className="text-lg font-bold uppercase">{raportData.madrasah.nama}</h1>
            <p className="text-xs">NSM: {raportData.madrasah.nsm} | NPSN: {raportData.madrasah.npsn}</p>
            <p className="text-xs">{raportData.madrasah.alamat}, {raportData.madrasah.desa}, {raportData.madrasah.kecamatan}, {raportData.madrasah.kabupaten}</p>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-base font-bold uppercase">Laporan Hasil Belajar Peserta Didik</h2>
            <p className="text-sm">Semester {raportData.kelas.semester} Tahun Pelajaran {raportData.kelas.tahun_pelajaran}</p>
          </div>

          {/* Identitas Siswa */}
          <div className="mb-6 text-sm">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <div className="flex"><span className="w-32">Nama</span><span>: {raportData.siswa.nama}</span></div>
              <div className="flex"><span className="w-32">NIS/NISN</span><span>: {raportData.siswa.nis} / {raportData.siswa.nisn || "-"}</span></div>
              <div className="flex"><span className="w-32">Kelas</span><span>: {raportData.kelas.nama_rombel}</span></div>
              <div className="flex"><span className="w-32">Fase</span><span>: {raportData.kelas.fase}</span></div>
              <div className="flex"><span className="w-32">TTL</span><span>: {raportData.siswa.tempat_lahir}, {raportData.siswa.tanggal_lahir}</span></div>
              <div className="flex"><span className="w-32">Jenis Kelamin</span><span>: {raportData.siswa.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</span></div>
            </div>
          </div>

          {/* Tabel Nilai */}
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-2">A. Nilai Akademik</h3>
            <table className="w-full text-xs border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-2 py-1.5 text-center w-8">No</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left">Mata Pelajaran</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-center w-16">Nilai</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-center w-16">Predikat</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left">Deskripsi</th>
                </tr>
              </thead>
              <tbody>
                {raportData.nilai.map((n, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-400 px-2 py-1.5 text-center">{idx + 1}</td>
                    <td className="border border-gray-400 px-2 py-1.5">{n.mapel_nama}</td>
                    <td className="border border-gray-400 px-2 py-1.5 text-center font-bold">{n.nilai_akhir}</td>
                    <td className="border border-gray-400 px-2 py-1.5 text-center">{n.predikat}</td>
                    <td className="border border-gray-400 px-2 py-1.5 text-justify leading-relaxed">{n.deskripsi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ekstrakurikuler */}
          {raportData.ekstrakurikuler.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-2">B. Kegiatan Ekstrakurikuler</h3>
              <table className="w-full text-xs border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-2 py-1.5 text-center w-8">No</th>
                    <th className="border border-gray-400 px-2 py-1.5 text-left">Kegiatan</th>
                    <th className="border border-gray-400 px-2 py-1.5 text-center w-24">Predikat</th>
                    <th className="border border-gray-400 px-2 py-1.5 text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {raportData.ekstrakurikuler.map((e, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-400 px-2 py-1.5 text-center">{idx + 1}</td>
                      <td className="border border-gray-400 px-2 py-1.5">{e.nama_kegiatan}</td>
                      <td className="border border-gray-400 px-2 py-1.5 text-center">{e.predikat}</td>
                      <td className="border border-gray-400 px-2 py-1.5">{e.keterangan || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Presensi */}
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-2">C. Ketidakhadiran</h3>
            <table className="text-xs border-collapse border border-gray-400">
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-3 py-1.5 w-32">Sakit</td>
                  <td className="border border-gray-400 px-3 py-1.5 w-16 text-center">{raportData.presensi?.sakit || 0}</td>
                  <td className="border border-gray-400 px-3 py-1.5">hari</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-3 py-1.5">Izin</td>
                  <td className="border border-gray-400 px-3 py-1.5 text-center">{raportData.presensi?.izin || 0}</td>
                  <td className="border border-gray-400 px-3 py-1.5">hari</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-3 py-1.5">Tanpa Keterangan</td>
                  <td className="border border-gray-400 px-3 py-1.5 text-center">{raportData.presensi?.alpa || 0}</td>
                  <td className="border border-gray-400 px-3 py-1.5">hari</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Catatan Wali Kelas */}
          {raportData.catatan_wali_kelas && (
            <div className="mb-8">
              <h3 className="text-sm font-bold mb-2">D. Catatan Wali Kelas</h3>
              <div className="border border-gray-400 p-3 text-xs leading-relaxed min-h-[60px]">
                {raportData.catatan_wali_kelas}
              </div>
            </div>
          )}

          {/* Tanda Tangan */}
          <div className="mt-8 text-xs">
            <div className="flex justify-between">
              <div className="text-center">
                <p>Mengetahui,</p>
                <p>Orang Tua/Wali</p>
                <div className="h-16"></div>
                <p className="border-b border-black inline-block px-8">........................</p>
              </div>
              <div className="text-center">
                <p>{raportData.madrasah.kabupaten}, .................... 20....</p>
                <p>Wali Kelas</p>
                <div className="h-16"></div>
                <p className="border-b border-black inline-block px-8 font-bold">........................</p>
                <p className="text-[10px]">NIP. ........................</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <p>Mengetahui,</p>
              <p>Kepala Madrasah</p>
              <div className="h-16"></div>
              <p className="border-b border-black inline-block px-8 font-bold">{raportData.madrasah.kepala_madrasah}</p>
              <p className="text-[10px]">NIP. {raportData.madrasah.nip_kepala}</p>
            </div>
          </div>
        </div>
      )}

      {!showPreview && !loading && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center print:hidden">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-600 mb-2">Preview Raport</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Pilih kelas dan siswa, lalu klik Preview untuk melihat raport. 
            Gunakan tombol Cetak/PDF untuk menyimpan sebagai PDF.
          </p>
        </div>
      )}
    </div>
  );
}
