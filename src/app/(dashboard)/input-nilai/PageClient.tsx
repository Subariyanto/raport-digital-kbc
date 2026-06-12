"use client";

import { useState, useEffect, useCallback } from "react";
import { demoStore } from "@/lib/demo-store";
import { Nilai, Siswa, MataPelajaran, Kelas, TujuanPembelajaran } from "@/lib/types";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

export default function InputNilaiPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [tpList, setTpList] = useState<TujuanPembelajaran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [nilaiMap, setNilaiMap] = useState<Record<string, Nilai>>({});

  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");
  const [selectedTp, setSelectedTp] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setKelasList(demoStore.getKelas());
    setMapelList(demoStore.getMapel());
  }, []);

  useEffect(() => {
    if (!selectedMapel) { setTpList([]); return; }
    const cpIds = demoStore.getCP().filter(cp => cp.mapel_id === selectedMapel).map(cp => cp.id);
    const tps = demoStore.getTP().filter(tp => cpIds.includes(tp.cp_id));
    setTpList(tps);
  }, [selectedMapel]);

  const fetchNilai = useCallback(() => {
    if (!selectedKelas || !selectedMapel || !selectedTp) return;
    setLoading(true);
    const siswa = demoStore.getSiswa().filter(s => s.kelas_id === selectedKelas);
    setSiswaList(siswa);

    const allNilai = demoStore.getNilai();
    const map: Record<string, Nilai> = {};
    siswa.forEach(s => {
      const existing = allNilai.find(n => n.siswa_id === s.id && n.mapel_id === selectedMapel && n.tp_id === selectedTp && n.kelas_id === selectedKelas);
      if (existing) {
        map[s.id] = existing;
      } else {
        map[s.id] = {
          id: demoStore.generateId(), siswa_id: s.id, mapel_id: selectedMapel,
          kelas_id: selectedKelas, tp_id: selectedTp, semester: 1,
          tahun_pelajaran: "2024/2025", nilai_formatif: 0, nilai_sumatif: 0,
          nilai_proyek: null, nilai_akhir: 0, predikat: "D", catatan_formatif: null,
          created_at: "", updated_at: "",
        };
      }
    });
    setNilaiMap(map);
    setLoading(false);
  }, [selectedKelas, selectedMapel, selectedTp]);

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
            <select value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_rombel}</option>)}
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
            <select value={selectedTp} onChange={(e) => setSelectedTp(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Pilih TP --</option>
              {tpList.map(tp => <option key={tp.id} value={tp.id}>{tp.kode} - {tp.deskripsi.substring(0, 50)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!selectedKelas || !selectedMapel || !selectedTp ? (
        <div className="text-center py-12 text-gray-400">Pilih kelas, mata pelajaran, dan TP untuk input nilai</div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : siswaList.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Tidak ada siswa di kelas ini</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-3 font-medium text-gray-600">No</th>
                    <th className="text-left px-3 py-3 font-medium text-gray-600">Nama Siswa</th>
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
                    if (!n) return null;
                    return (
                      <tr key={siswa.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium">{siswa.nama}</td>
                        <td className="px-3 py-2"><input type="number" min={0} max={100} value={n.nilai_formatif || ""} onChange={(e) => updateNilai(siswa.id, "nilai_formatif", Number(e.target.value))} className="w-16 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none" /></td>
                        <td className="px-3 py-2"><input type="number" min={0} max={100} value={n.nilai_sumatif || ""} onChange={(e) => updateNilai(siswa.id, "nilai_sumatif", Number(e.target.value))} className="w-16 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none" /></td>
                        <td className="px-3 py-2"><input type="number" min={0} max={100} value={n.nilai_proyek || ""} onChange={(e) => updateNilai(siswa.id, "nilai_proyek", Number(e.target.value) || null)} className="w-16 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none" /></td>
                        <td className="px-3 py-2 text-center font-bold">{n.nilai_akhir}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${n.predikat === "A" ? "bg-green-100 text-green-800" : n.predikat === "B" ? "bg-blue-100 text-blue-800" : n.predikat === "C" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{n.predikat}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
              <Save size={16} /> {saving ? "Menyimpan..." : "Simpan Nilai"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
