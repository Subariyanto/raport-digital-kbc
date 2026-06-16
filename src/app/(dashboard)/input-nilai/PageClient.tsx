"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { demoStore } from "@/lib/demo-store";
import { Nilai, Siswa, MataPelajaran, Kelas, TujuanPembelajaran } from "@/lib/types";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

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

export default function InputNilaiPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [tpList, setTpList] = useState<TujuanPembelajaran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [nilaiMap, setNilaiMap] = useState<Record<string, Nilai>>({});

  const [selectedTingkat, setSelectedTingkat] = useState<string>(""); // "1".."12"
  const [selectedRombel, setSelectedRombel] = useState<string>("");   // kelas.id
  const [selectedMapel, setSelectedMapel] = useState("");
  const [selectedTp, setSelectedTp] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setKelasList(demoStore.getKelas());
    setMapelList(demoStore.getMapel());
  }, []);

  // Daftar tingkat unik dari rombel yang sudah dibuat
  const tingkatOptions = useMemo(() => {
    const set = new Set<number>();
    kelasList.forEach(k => {
      if (typeof k.tingkat === "number" && k.tingkat > 0) set.add(k.tingkat);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [kelasList]);

  // Rombel yang tersedia untuk tingkat terpilih
  const rombelOptions = useMemo(() => {
    if (!selectedTingkat) return [] as Kelas[];
    const t = Number(selectedTingkat);
    return kelasList
      .filter(k => k.tingkat === t)
      .sort((a, b) => (a.nama_rombel || "").localeCompare(b.nama_rombel || ""));
  }, [kelasList, selectedTingkat]);

  // Reset rombel kalau tingkat berubah
  useEffect(() => { setSelectedRombel(""); }, [selectedTingkat]);

  // TP turunan dari mapel
  useEffect(() => {
    if (!selectedMapel) { setTpList([]); return; }
    const cpIds = demoStore.getCP().filter(cp => cp.mapel_id === selectedMapel).map(cp => cp.id);
    const tps = demoStore.getTP().filter(tp => cpIds.includes(tp.cp_id));
    setTpList(tps);
  }, [selectedMapel]);

  // Daftar siswa: muncul setelah Tingkat dipilih.
  // - Kalau Rombel belum dipilih: tampilkan semua siswa di tingkat itu (gabungan semua rombel)
  // - Kalau Rombel dipilih: hanya siswa di rombel itu
  useEffect(() => {
    if (!selectedTingkat) { setSiswaList([]); setNilaiMap({}); return; }
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

  const fetchNilai = useCallback(() => {
    if (!selectedTingkat) return;
    if (!selectedMapel || !selectedTp) {
      setNilaiMap({});
      return;
    }
    setLoading(true);
    const allNilai = demoStore.getNilai();
    const map: Record<string, Nilai> = {};
    siswaList.forEach(s => {
      const existing = allNilai.find(n => n.siswa_id === s.id && n.mapel_id === selectedMapel && n.tp_id === selectedTp);
      if (existing) {
        map[s.id] = existing;
      } else {
        map[s.id] = {
          id: demoStore.generateId(), siswa_id: s.id, mapel_id: selectedMapel,
          kelas_id: s.kelas_id || selectedRombel || "", tp_id: selectedTp, semester: 1,
          tahun_pelajaran: "2024/2025", nilai_formatif: 0, nilai_sumatif: 0,
          nilai_proyek: null, nilai_akhir: 0, predikat: "D", catatan_formatif: null,
          created_at: "", updated_at: "",
        };
      }
    });
    setNilaiMap(map);
    setLoading(false);
  }, [selectedTingkat, selectedRombel, selectedMapel, selectedTp, siswaList]);

  useEffect(() => { fetchNilai(); }, [fetchNilai]);

  const getPredikat = (nilai: number): string => {
    if (nilai >= 90) return "A";
    if (nilai >= 80) return "B";
    if (nilai >= 70) return "C";
    return "D";
  };

  const updateNilai = (siswaId: string, field: keyof Nilai, value: number | string | null) => {
    setNilaiMap(prev => {
      const n = { ...prev[siswaId], [field]: value };
      const formatif = Number(n.nilai_formatif) || 0;
      const sumatif = Number(n.nilai_sumatif) || 0;
      const proyek = Number(n.nilai_proyek) || 0;
      const akhir = Math.round((formatif + sumatif + proyek) / (n.nilai_proyek !== null && n.nilai_proyek !== 0 ? 3 : 2));
      n.nilai_akhir = akhir;
      n.predikat = getPredikat(akhir);
      return { ...prev, [siswaId]: n as Nilai };
    });
  };

  const handleSave = () => {
    setSaving(true);
    const allNilai = demoStore.getNilai();
    const existingIds = Object.values(nilaiMap).map(n => n.id);
    const filtered = allNilai.filter(n => !existingIds.includes(n.id));
    const merged = [...filtered, ...Object.values(nilaiMap)];
    demoStore.setNilai(merged);
    toast.success("Nilai berhasil disimpan");
    setSaving(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Input Nilai</h1>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
            <select value={selectedMapel} onChange={(e) => setSelectedMapel(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Pilih Mapel --</option>
              {mapelList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan Pembelajaran</label>
            <select value={selectedTp} onChange={(e) => setSelectedTp(e.target.value)} disabled={!selectedMapel} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed">
              <option value="">-- Pilih TP --</option>
              {tpList.map(tp => <option key={tp.id} value={tp.id}>{tp.kode} - {tp.deskripsi.substring(0, 50)}</option>)}
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
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-3 font-medium text-gray-600">No</th>
                    <th className="text-left px-3 py-3 font-medium text-gray-600">Nama Siswa</th>
                    <th className="text-left px-3 py-3 font-medium text-gray-600">Rombel</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-600">Formatif</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-600">Sumatif</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-600">Proyek</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-600">Akhir</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-600">Predikat</th>
                  </tr>
                </thead>
                <tbody>
                  {siswaList.map((siswa, idx) => {
                    const n = nilaiMap[siswa.id];
                    const kelas = kelasList.find(k => k.id === siswa.kelas_id);
                    const inputDisabled = !selectedMapel || !selectedTp || !n;
                    const placeholderHint = !selectedMapel ? "Pilih mapel" : !selectedTp ? "Pilih TP" : "";
                    return (
                      <tr key={siswa.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium">{siswa.nama}</td>
                        <td className="px-3 py-2 text-gray-600">{kelas?.nama_rombel || "-"}</td>
                        <td className="px-3 py-2">
                          <input type="number" min={0} max={100}
                            value={n?.nilai_formatif || ""}
                            disabled={inputDisabled}
                            placeholder={placeholderHint}
                            onChange={(e) => updateNilai(siswa.id, "nilai_formatif", Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min={0} max={100}
                            value={n?.nilai_sumatif || ""}
                            disabled={inputDisabled}
                            placeholder={placeholderHint}
                            onChange={(e) => updateNilai(siswa.id, "nilai_sumatif", Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min={0} max={100}
                            value={n?.nilai_proyek || ""}
                            disabled={inputDisabled}
                            placeholder={placeholderHint}
                            onChange={(e) => updateNilai(siswa.id, "nilai_proyek", Number(e.target.value) || null)}
                            className="w-20 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400" />
                        </td>
                        <td className="px-3 py-2 text-center font-bold">{n?.nilai_akhir ?? "-"}</td>
                        <td className="px-3 py-2 text-center">
                          {n?.predikat ? (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${n.predikat === "A" ? "bg-green-100 text-green-800" : n.predikat === "B" ? "bg-blue-100 text-blue-800" : n.predikat === "C" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{n.predikat}</span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={handleSave} disabled={saving || !selectedMapel || !selectedTp} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Save size={16} /> {saving ? "Menyimpan..." : "Simpan Nilai"}
            </button>
            {(!selectedMapel || !selectedTp) && (
              <span className="text-xs text-gray-500">Pilih Mapel dan TP untuk mulai input nilai</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
