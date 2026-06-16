"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { demoStore } from "@/lib/demo-store";
import { Siswa, Kelas } from "@/lib/types";
import { generateCatatanWaliKelas } from "@/lib/deskripsi-generator";
import toast from "react-hot-toast";
import { Save, Sparkles } from "lucide-react";

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

export default function CatatanWaliKelasPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedTingkat, setSelectedTingkat] = useState<string>("");
  const [selectedRombel, setSelectedRombel] = useState<string>("");
  const [catatanMap, setCatatanMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
    const seen = new Set<string>();
    const list: Kelas[] = [];
    kelasList
      .filter(k => k.tingkat === t)
      .sort((a, b) => (a.nama_rombel || "").localeCompare(b.nama_rombel || ""))
      .forEach(k => {
        const key = (k.nama_rombel || "").trim().toLowerCase();
        if (!key) return;
        if (seen.has(key)) return;
        seen.add(key);
        list.push(k);
      });
    return list;
  }, [kelasList, selectedTingkat]);

  // Reset rombel kalau tingkat berubah
  useEffect(() => { setSelectedRombel(""); }, [selectedTingkat]);

  const fetchCatatan = useCallback(() => {
    if (!selectedTingkat) { setSiswaList([]); setCatatanMap({}); return; }
    setLoading(true);
    const allSiswa = demoStore.getSiswa();
    const t = Number(selectedTingkat);
    const kelasIdsAtTingkat = new Set(
      kelasList.filter(k => k.tingkat === t).map(k => k.id)
    );
    let siswa: Siswa[];
    if (selectedRombel) {
      const targetKelas = kelasList.find(k => k.id === selectedRombel);
      const targetRombelKey = (targetKelas?.nama_rombel || "").trim().toLowerCase();
      const sameRombelIds = new Set(
        kelasList
          .filter(k => k.tingkat === t && (k.nama_rombel || "").trim().toLowerCase() === targetRombelKey)
          .map(k => k.id)
      );
      siswa = allSiswa.filter(s => s.kelas_id && sameRombelIds.has(s.kelas_id));
    } else {
      siswa = allSiswa.filter(s => s.kelas_id && kelasIdsAtTingkat.has(s.kelas_id));
    }
    siswa = siswa.slice().sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
    setSiswaList(siswa);

    const allCatatan = demoStore.getCatatan();
    const map: Record<string, string> = {};
    siswa.forEach(s => {
      const existing = allCatatan.find(c => c.siswa_id === s.id && c.kelas_id === s.kelas_id);
      if (existing) map[s.id] = existing.catatan || "";
    });
    setCatatanMap(map);
    setLoading(false);
  }, [selectedTingkat, selectedRombel, kelasList]);

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
    const targetSiswaIds = new Set(siswaList.map(s => s.id));
    // Hanya hapus catatan untuk siswa-siswa yang sedang kita rekap
    const filtered = allCatatan.filter(c => !targetSiswaIds.has(c.siswa_id));
    const newEntries = siswaList
      .filter(s => (catatanMap[s.id] || "").trim())
      .map(s => ({
        id: demoStore.generateId(),
        siswa_id: s.id,
        kelas_id: s.kelas_id || "",
        semester: 1,
        tahun_pelajaran: "2024/2025",
        catatan: catatanMap[s.id],
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

      {!selectedTingkat ? (
        <div className="text-center py-12 text-gray-400">Pilih Kelas untuk menampilkan daftar siswa</div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : siswaList.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {selectedRombel ? "Tidak ada siswa di rombel ini" : "Tidak ada siswa di kelas ini"}
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-gray-600">
              {siswaList.length} siswa{selectedRombel ? "" : " (gabungan rombel)"}. Klik ✨ per-siswa atau tombol di kanan untuk generate semua dari nilai mapel + koko + ekskul.
            </p>
            <button
              onClick={handleGenerateAll}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              <Sparkles size={16} /> Generate Otomatis Semua
            </button>
          </div>
          <div className="space-y-3">
            {siswaList.map((siswa, idx) => {
              const kelas = kelasList.find(k => k.id === siswa.kelas_id);
              return (
                <div key={siswa.id} className="bg-white rounded-xl shadow-sm border p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-500">{idx + 1}.</span>
                      <span className="font-medium text-gray-900">{siswa.nama}</span>
                      <span className="text-xs text-gray-500">({kelas?.nama_rombel || "-"})</span>
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
              );
            })}
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
