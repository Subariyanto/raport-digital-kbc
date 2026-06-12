"use client";

import { useState, useEffect, useCallback } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { demoStore } from "@/lib/demo-store";
import { Siswa, Kelas } from "@/lib/types";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

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
          <div className="space-y-3">
            {siswaList.map((siswa, idx) => (
              <div key={siswa.id} className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-gray-500">{idx + 1}.</span>
                  <span className="font-medium text-gray-900">{siswa.nama}</span>
                </div>
                <textarea
                  value={catatanMap[siswa.id] || ""}
                  onChange={(e) => setCatatanMap(prev => ({ ...prev, [siswa.id]: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  placeholder="Catatan untuk siswa ini..."
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
