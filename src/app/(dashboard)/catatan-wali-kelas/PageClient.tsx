"use client";

import { useState, useEffect, useCallback } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { demoStore } from "@/lib/demo-store";
import { Siswa, Kelas } from "@/lib/types";
import { generateCatatanWaliKelas } from "@/lib/deskripsi-generator";
import toast from "react-hot-toast";
import { Save, Sparkles } from "lucide-react";

export default function CatatanWaliKelasPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [catatanMap, setCatatanMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setKelasList(demoStore.getKelas()); }, []);

  const fetchCatatan = useCallback(() => {
    if (!selectedKelas) { setSiswaList([]); return; }
    setLoading(true);
    const siswa = demoStore.getSiswa().filter(s => s.kelas_id === selectedKelas);
    setSiswaList(siswa);

    const allCatatan = demoStore.getCatatan();
    const map: Record<string, string> = {};
    siswa.forEach(s => {
      const existing = allCatatan.find(c => c.siswa_id === s.id && c.kelas_id === selectedKelas);
      if (existing) map[s.id] = existing.catatan || "";
    });
    setCatatanMap(map);
    setLoading(false);
  }, [selectedKelas]);

  useEffect(() => { fetchCatatan(); }, [fetchCatatan]);

  // Generate catatan otomatis berdasarkan rata-rata mapel + kokurikuler + ekstrakurikuler + presensi
  const generateForSiswa = (siswa: Siswa): string => {
    // 1. Rata-rata intrakurikuler
    const allNilai = demoStore.getNilai().filter(n => n.siswa_id === siswa.id);
    const rataMapel = allNilai.length > 0
      ? allNilai.reduce((s, n) => s + (n.nilai_akhir || 0), 0) / allNilai.length
      : 0;

    // 2. Rata-rata kokurikuler
    const koko = demoStore.getKokurikuler().filter(k => k.siswa_id === siswa.id);
    const kokoNilai = koko.filter(k => k.nilai !== null && k.nilai !== undefined);
    const rataKoko = kokoNilai.length > 0
      ? kokoNilai.reduce((s, k) => s + (k.nilai || 0), 0) / kokoNilai.length
      : null;

    // 3. Rata-rata ekstrakurikuler
    const ekskul = demoStore.getEkskul().filter(e => e.siswa_id === siswa.id);
    const ekskulNilai = ekskul.filter(e => e.nilai !== null && e.nilai !== undefined);
    const rataEkskul = ekskulNilai.length > 0
      ? ekskulNilai.reduce((s, e) => s + (e.nilai || 0), 0) / ekskulNilai.length
      : null;

    // 4. Presensi
    const presensi = demoStore.getPresensi().filter(p => p.siswa_id === siswa.id);
    const hadir = presensi.filter(p => p.status === "hadir").length;
    const sakit = presensi.filter(p => p.status === "sakit").length;
    const izin = presensi.filter(p => p.status === "izin").length;
    const alpa = presensi.filter(p => p.status === "alpa").length;

    return generateCatatanWaliKelas({
      namaSiswa: siswa.nama,
      rataRata: Math.round(rataMapel),
      hadir, sakit, izin, alpa,
      rataKoko: rataKoko ? Math.round(rataKoko) : null,
      rataEkskul: rataEkskul ? Math.round(rataEkskul) : null,
      kegiatanKoko: koko.map(k => k.nama_kegiatan),
      kegiatanEkskul: ekskul.map(e => e.nama_kegiatan),
    });
  };

  const handleGenerateAll = () => {
    if (siswaList.length === 0) {
      toast.error("Pilih kelas dulu");
      return;
    }
    const newMap: Record<string, string> = {};
    siswaList.forEach(s => { newMap[s.id] = generateForSiswa(s); });
    setCatatanMap(newMap);
    toast.success(`Generate ${siswaList.length} catatan selesai. Silakan review & simpan.`);
  };

  const handleGenerateOne = (siswa: Siswa) => {
    const generated = generateForSiswa(siswa);
    setCatatanMap(prev => ({ ...prev, [siswa.id]: generated }));
    toast.success(`Catatan untuk ${siswa.nama} ter-generate`);
  };

  const handleSave = () => {
    setSaving(true);
    const allCatatan = demoStore.getCatatan();
    const filtered = allCatatan.filter(c => c.kelas_id !== selectedKelas);
    const newEntries = Object.entries(catatanMap)
      .filter(([, catatan]) => catatan.trim())
      .map(([siswaId, catatan]) => ({
        id: demoStore.generateId(),
        siswa_id: siswaId,
        kelas_id: selectedKelas,
        semester: 1,
        tahun_pelajaran: "2024/2025",
        catatan,
        is_generated: false,
        madrasah_id: "11111111-1111-1111-1111-111111111111",
        created_at: "",
        updated_at: "",
      }));
    demoStore.setCatatan([...filtered, ...newEntries]);
    toast.success("Catatan wali kelas berhasil disimpan");
    setSaving(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Catatan Wali Kelas</h1>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
            <select value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_rombel}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!selectedKelas ? (
        <div className="text-center py-12 text-gray-400">Pilih kelas untuk input catatan wali kelas</div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : siswaList.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Tidak ada siswa di kelas ini</div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-gray-600">
              {siswaList.length} siswa di kelas ini. Klik ✨ per-siswa atau tombol di kanan untuk generate semua dari nilai mapel + koko + ekskul.
            </p>
            <button
              onClick={handleGenerateAll}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              <Sparkles size={16} /> Generate Otomatis Semua
            </button>
          </div>
          <div className="space-y-3">
            {siswaList.map((siswa, idx) => (
              <div key={siswa.id} className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-500">{idx + 1}.</span>
                    <span className="font-medium text-gray-900">{siswa.nama}</span>
                  </div>
                  <button
                    onClick={() => handleGenerateOne(siswa)}
                    className="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-xs font-medium px-2 py-1 rounded hover:bg-amber-50"
                    title="Generate otomatis dari nilai mapel + koko + ekskul"
                  >
                    <Sparkles size={14} /> Generate
                  </button>
                </div>
                <textarea
                  value={catatanMap[siswa.id] || ""}
                  onChange={(e) => setCatatanMap(prev => ({ ...prev, [siswa.id]: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  placeholder="Catatan untuk siswa ini... (atau klik Generate ✨)"
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
              <Save size={16} /> {saving ? "Menyimpan..." : "Simpan Catatan"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
