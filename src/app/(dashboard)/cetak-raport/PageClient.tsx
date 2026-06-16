"use client";

import { useState, useEffect, useMemo } from "react";
import { demoStore } from "@/lib/demo-store";
import { Siswa, Kelas } from "@/lib/types";
import {
  nilaiToPredikat,
  generateDeskripsiKokurikuler,
  generateDeskripsiEkstrakurikuler,
} from "@/lib/deskripsi-generator";
import { Auth } from "@/lib/auth";
import { Tier } from "@/lib/tier";
import { Printer, Eye, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

function toRoman(n: number): string {
  if (n === 12) return "XII";
  if (n === 11) return "XI";
  const map: [number, string][] = [
    [10, "X"], [9, "IX"], [8, "VIII"], [7, "VII"], [6, "VI"],
    [5, "V"], [4, "IV"], [3, "III"], [2, "II"], [1, "I"],
  ];
  for (const [v, s] of map) if (n === v) return s;
  return String(n);
}

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

// Helper: format YYYY-MM-DD -> "16 Juni 2026". Fallback ke garis kosong kalau invalid.
const BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
function formatTanggalIndo(iso: string | undefined | null): string {
  if (!iso) return "....................";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return "....................";
  const tahun = m[1];
  const bulan = BULAN_ID[parseInt(m[2], 10) - 1] || "-";
  const hari = parseInt(m[3], 10);
  if (Number.isNaN(hari)) return "....................";
  return `${hari} ${bulan} ${tahun}`;
}

export default function CetakRaportPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedTingkat, setSelectedTingkat] = useState<string>("");
  const [selectedRombel, setSelectedRombel] = useState<string>("");
  const [selectedSiswa, setSelectedSiswa] = useState("");
  const [raportData, setRaportData] = useState<any>(null);

  useEffect(() => { setKelasList(demoStore.getKelas()); }, []);

  const tingkatOptions = useMemo(() => {
    const set = new Set<number>();
    kelasList.forEach(k => {
      if (typeof k.tingkat === "number" && k.tingkat > 0) set.add(k.tingkat);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [kelasList]);

  const rombelOptions = useMemo(() => {
    if (!selectedTingkat) return [] as Kelas[];
    const t = Number(selectedTingkat);
    return kelasList
      .filter(k => k.tingkat === t)
      .sort((a, b) => (a.nama_rombel || "").localeCompare(b.nama_rombel || ""));
  }, [kelasList, selectedTingkat]);

  // Reset rombel & siswa kalau tingkat berubah
  useEffect(() => { setSelectedRombel(""); setSelectedSiswa(""); setRaportData(null); }, [selectedTingkat]);
  useEffect(() => { setSelectedSiswa(""); setRaportData(null); }, [selectedRombel]);

  // Daftar siswa filter berdasarkan tingkat + rombel
  useEffect(() => {
    if (!selectedTingkat) { setSiswaList([]); return; }
    const allSiswa = demoStore.getSiswa();
    const t = Number(selectedTingkat);
    const kelasIdsAtTingkat = new Set(
      kelasList.filter(k => k.tingkat === t).map(k => k.id)
    );
    let siswa: Siswa[];
    if (selectedRombel) {
      siswa = allSiswa.filter(s => s.kelas_id === selectedRombel);
    } else {
      siswa = allSiswa.filter(s => s.kelas_id && kelasIdsAtTingkat.has(s.kelas_id));
    }
    siswa = siswa.slice().sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
    setSiswaList(siswa);
  }, [selectedTingkat, selectedRombel, kelasList]);

  useEffect(() => {
    if (!selectedSiswa) { setRaportData(null); return; }
    const siswa = demoStore.getSiswa().find(s => s.id === selectedSiswa);
    if (!siswa) { setRaportData(null); return; }
    const effectiveKelasId = siswa.kelas_id || "";

    const madrasah = demoStore.getMadrasah();
    const kelas = demoStore.getKelas().find(k => k.id === effectiveKelasId);
    const mapelList = demoStore.getMapel();
    const allNilai = demoStore.getNilai();
    const allDeskripsi = demoStore.getDeskripsi();
    const allPresensi = demoStore.getPresensi();
    const allEkskul = demoStore.getEkskul();
    const allKoko = demoStore.getKokurikuler();
    const allCatatan = demoStore.getCatatan();

    // Build nilai per mapel (rata-rata semua TP yang ada untuk siswa+mapel)
    const nilaiPerMapel = mapelList.map(mapel => {
      const nilaiSiswa = allNilai.filter(n => n.siswa_id === selectedSiswa && n.mapel_id === mapel.id);
      const avg = nilaiSiswa.length > 0 ? Math.round(nilaiSiswa.reduce((sum, n) => sum + (n.nilai_akhir || 0), 0) / nilaiSiswa.length) : null;
      const deskripsi = allDeskripsi.find(d => d.siswa_id === selectedSiswa && d.mapel_id === mapel.id);
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

    const presensi = allPresensi.find(p => p.siswa_id === selectedSiswa);
    const ekskul = allEkskul.filter(e => e.siswa_id === selectedSiswa);
    const koko = allKoko.filter(k => k.siswa_id === selectedSiswa);
    const catatan = allCatatan.find(c => c.siswa_id === selectedSiswa);

    // Deskripsi naratif kokurikuler & ekstrakurikuler.
    // Prioritas: yang sudah disimpan via menu Deskripsi Otomatis;
    // kalau belum ada, auto-generate dari data kegiatan supaya raport tidak kosong.
    const savedKoko = readAux("deskripsi_kokurikuler").find(
      d => d.siswa_id === selectedSiswa
    )?.deskripsi_text || "";
    const savedEks = readAux("deskripsi_ekstrakurikuler").find(
      d => d.siswa_id === selectedSiswa
    )?.deskripsi_text || "";

    const deskKoko = savedKoko
      ? savedKoko
      : (koko.length > 0
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
      : (ekskul.length > 0
          ? generateDeskripsiEkstrakurikuler({
              namaSiswa: siswa.nama,
              kegiatan: ekskul.map((e: any) => ({
                nama_kegiatan: e.nama_kegiatan,
                nilai: e.nilai ?? null,
                keterangan: e.keterangan,
              })),
            })
          : "");

    setRaportData({ madrasah, siswa, kelas, nilaiPerMapel, presensi, ekskul, koko, catatan, deskKoko, deskEks, tanggalCetak: demoStore.getTanggalCetak(), waliKelas: kelas?.wali_kelas_id ? demoStore.getGuru().find(g => g.id === kelas.wali_kelas_id) || null : null });
  }, [selectedSiswa]);

  const handlePrint = () => {
    const me = Auth.current();
    if (Tier.isLocked(me)) {
      toast.error("Trial sudah habis. Aktivasi kode FULL untuk mencetak raport.");
      return;
    }
    window.print();
  };

  const handleUploadFotoSiswa = async (file: File) => {
    if (!raportData?.siswa?.id) return;
    if (file.size > 800 * 1024) {
      toast.error("Ukuran foto maksimal 800 KB. Kompres dulu lalu upload ulang.");
      return;
    }
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onerror = () => rej(r.error);
      r.onload = () => res(r.result as string);
      r.readAsDataURL(file);
    });
    const all = demoStore.getSiswa();
    const updated = all.map((s: any) => s.id === raportData.siswa.id ? { ...s, foto_url: dataUrl } : s);
    demoStore.setSiswa(updated as any);
    setRaportData({ ...raportData, siswa: { ...raportData.siswa, foto_url: dataUrl } });
    toast.success("Foto siswa disimpan");
  };

  const handleHapusFotoSiswa = () => {
    if (!raportData?.siswa?.id) return;
    if (!confirm("Hapus foto siswa ini?")) return;
    const all = demoStore.getSiswa();
    const updated = all.map((s: any) => s.id === raportData.siswa.id ? { ...s, foto_url: null } : s);
    demoStore.setSiswa(updated as any);
    setRaportData({ ...raportData, siswa: { ...raportData.siswa, foto_url: null } });
    toast.success("Foto siswa dihapus");
  };

  return (
    <div>
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Cetak Raport</h1>

        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
              <select value={selectedTingkat} onChange={(e) => setSelectedTingkat(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="">-- Pilih Kelas --</option>
                {tingkatOptions.map(t => (
                  <option key={t} value={t}>Kelas {toRoman(t)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rombel</label>
              <select value={selectedRombel} onChange={(e) => setSelectedRombel(e.target.value)} disabled={!selectedTingkat} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed">
                <option value="">-- Semua Rombel --</option>
                {rombelOptions.map(k => (
                  <option key={k.id} value={k.id}>{k.nama_rombel || "-"}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Daftar siswa: muncul kalau Kelas dipilih dan belum ada raport yang dipreview */}
        {selectedTingkat && !raportData && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
            <div className="p-4 border-b flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-semibold text-gray-900">Daftar Siswa</h2>
                <p className="text-xs text-gray-500">{siswaList.length} siswa{selectedRombel ? "" : " (gabungan rombel)"}. Klik Detail di kanan untuk preview raport.</p>
              </div>
            </div>
            {siswaList.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {selectedRombel ? "Tidak ada siswa di rombel ini" : "Tidak ada siswa di kelas ini"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-3 py-3 font-medium text-gray-600">No</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-600">Nama Siswa</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-600">NIS / NISN</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-600">Rombel</th>
                      <th className="text-right px-3 py-3 font-medium text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siswaList.map((siswa, idx) => {
                      const kelas = kelasList.find(k => k.id === siswa.kelas_id);
                      return (
                        <tr key={siswa.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium">{siswa.nama}</td>
                          <td className="px-3 py-2 text-gray-600 text-xs">{(siswa.nis || "-")} / {(siswa.nisn || "-")}</td>
                          <td className="px-3 py-2 text-gray-600">{kelas?.nama_rombel || "-"}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => setSelectedSiswa(siswa.id)}
                              className="inline-flex items-center gap-1 bg-primary hover:bg-primary-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                              title="Lihat detail / preview raport"
                            >
                              <Eye size={14} /> Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Toolbar saat preview raport aktif */}
        {raportData && (
          <div className="bg-white rounded-xl shadow-sm border p-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={() => { setSelectedSiswa(""); setRaportData(null); }}
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium"
            >
              <ArrowLeft size={16} /> Kembali ke daftar
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Printer size={16} /> Cetak / Print
            </button>
          </div>
        )}
      </div>

      {!raportData && !selectedTingkat ? (
        <div className="text-center py-12 text-gray-400 print:hidden">Pilih Kelas untuk menampilkan daftar siswa</div>
      ) : !raportData ? (
        <div className="print:hidden" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-6 print:shadow-none print:border-0 print:p-0 raport-print-area">
          {/* KOP Madrasah */}
          <div className="border-b-2 border-gray-800 pb-4 mb-3">
            <div className="flex items-center gap-4">
              {raportData.madrasah.logo_url ? (
                <img
                  src={raportData.madrasah.logo_url}
                  alt="Logo Madrasah"
                  className="w-20 h-20 object-contain flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 flex-shrink-0" />
              )}
              <div className="flex-1 text-center">
                {raportData.madrasah.nama_yayasan && (
                  <p className="text-sm font-semibold uppercase">{raportData.madrasah.nama_yayasan}</p>
                )}
                <h3 className="text-base font-bold uppercase">{raportData.madrasah.nama}</h3>
                <p className="text-sm text-gray-600">{raportData.madrasah.alamat}, {raportData.madrasah.desa}, {raportData.madrasah.kecamatan}</p>
                <p className="text-sm text-gray-600">{raportData.madrasah.kabupaten}, {raportData.madrasah.provinsi}</p>
              </div>
              <div className="w-20 h-20 flex-shrink-0 hidden sm:block" />
            </div>
          </div>

          {/* Judul (di bawah KOP, di bawah garis) */}
          <h2 className="text-lg font-bold uppercase text-center mb-4">LAPORAN HASIL BELAJAR</h2>

          {/* Identitas Siswa (foto kiri + data kanan) */}
          <div className="flex gap-6 mb-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-32 bg-gray-50 border-2 border-gray-300 rounded-md overflow-hidden flex items-center justify-center">
                {raportData.siswa?.foto_url ? (
                  <img
                    src={raportData.siswa.foto_url}
                    alt={`Foto ${raportData.siswa?.nama || "siswa"}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-gray-400 text-center px-1">3 x 4</span>
                )}
              </div>
              <div className="mt-2 print:hidden flex flex-col gap-1">
                <label className="flex items-center justify-center gap-1 bg-primary hover:bg-primary-800 text-white px-2 py-1 rounded text-[11px] font-medium cursor-pointer">
                  {raportData.siswa?.foto_url ? "Ganti Foto" : "Upload Foto"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadFotoSiswa(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                {raportData.siswa?.foto_url && (
                  <button
                    type="button"
                    onClick={handleHapusFotoSiswa}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded text-[11px] font-medium"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 self-center">
              <table className="w-full text-sm border-separate" style={{ borderSpacing: "0 4px" }}>
                <tbody>
                  <tr>
                    <td className="text-gray-600 align-top w-40">Nama</td>
                    <td className="w-3 text-gray-600">:</td>
                    <td className="font-medium">{raportData.siswa?.nama || "-"}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 align-top">NIS / NISN</td>
                    <td className="text-gray-600">:</td>
                    <td>{(raportData.siswa?.nis || "-")} / {(raportData.siswa?.nisn || "-")}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 align-top">Kelas</td>
                    <td className="text-gray-600">:</td>
                    <td>{raportData.kelas?.nama_rombel || "-"}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 align-top">Fase</td>
                    <td className="text-gray-600">:</td>
                    <td>{raportData.kelas?.fase || "-"}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 align-top">Semester</td>
                    <td className="text-gray-600">:</td>
                    <td>{raportData.kelas?.semester === 1 ? "1 (Ganjil)" : raportData.kelas?.semester === 2 ? "2 (Genap)" : "-"}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 align-top">Tahun Pelajaran</td>
                    <td className="text-gray-600">:</td>
                    <td>{raportData.kelas?.tahun_pelajaran || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
          <h4 className="font-bold text-sm mb-2">B. KOKURIKULER (Projek Penguatan Profil Lulusan dan KBC)</h4>
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
            </div>
            <div className="text-center">
              <p>{`${raportData.madrasah.kabupaten || "..."}, ${formatTanggalIndo(raportData.tanggalCetak)}`}</p>
              <p>Wali Kelas</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{raportData.waliKelas?.nama || "................................"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
