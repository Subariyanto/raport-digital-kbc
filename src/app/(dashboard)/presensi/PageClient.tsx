"use client";

import { useState, useEffect, useCallback } from "react";
import { demoStore } from "@/lib/demo-store";
import { Kelas } from "@/lib/types";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

interface PresensiRow {
  siswa_id: string;
  nama: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
}

export default function PresensiPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [rows, setRows] = useState<PresensiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setKelasList(demoStore.getKelas()); }, []);

  const fetchPresensi = useCallback(() => {
    if (!selectedKelas) { setRows([]); return; }
    setLoading(true);
    const siswa = demoStore.getSiswa().filter(s => s.kelas_id === selectedKelas);
    const allPresensi = demoStore.getPresensi();

    const result: PresensiRow[] = siswa.map(s => {
      const existing = allPresensi.find(p => p.siswa_id === s.id && p.kelas_id === selectedKelas);
      return {
        siswa_id: s.id,
        nama: s.nama,
        hadir: existing?.hadir ?? 0,
        izin: existing?.izin ?? 0,
        sakit: existing?.sakit ?? 0,
        alpa: existing?.alpa ?? 0,
      };
    });
    setRows(result);
    setLoading(false);
  }, [selectedKelas]);

  useEffect(() => { fetchPresensi(); }, [fetchPresensi]);

  const updateRow = (idx: number, field: keyof PresensiRow, value: number) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const handleSave = () => {
    setSaving(true);
    const allPresensi = demoStore.getPresensi();
    // Remove existing for this kelas
    const filtered = allPresensi.filter(p => p.kelas_id !== selectedKelas);
    // Add new
    const newEntries = rows.map(r => ({
      id: demoStore.generateId(),
      siswa_id: r.siswa_id,
      kelas_id: selectedKelas,
      semester: 1,
      tahun_pelajaran: "2024/2025",
      hadir: r.hadir,
      izin: r.izin,
      sakit: r.sakit,
      alpa: r.alpa,
      madrasah_id: "11111111-1111-1111-1111-111111111111",
      created_at: "",
      updated_at: "",
    }));
    demoStore.setPresensi([...filtered, ...newEntries]);
    toast.success("Presensi berhasil disimpan");
    setSaving(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Rekap Presensi</h1>

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
        <div className="text-center py-12 text-gray-400">Pilih kelas untuk input presensi</div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : rows.length === 0 ? (
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
                    <th className="text-center px-3 py-3 font-medium text-gray-600">Hadir</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-600">Izin</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-600">Sakit</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-600">Alpa</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.siswa_id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium">{row.nama}</td>
                      <td className="px-3 py-2"><input type="number" min={0} value={row.hadir} onChange={(e) => updateRow(idx, "hadir", Number(e.target.value))} className="w-14 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none" /></td>
                      <td className="px-3 py-2"><input type="number" min={0} value={row.izin} onChange={(e) => updateRow(idx, "izin", Number(e.target.value))} className="w-14 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none" /></td>
                      <td className="px-3 py-2"><input type="number" min={0} value={row.sakit} onChange={(e) => updateRow(idx, "sakit", Number(e.target.value))} className="w-14 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none" /></td>
                      <td className="px-3 py-2"><input type="number" min={0} value={row.alpa} onChange={(e) => updateRow(idx, "alpa", Number(e.target.value))} className="w-14 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none" /></td>
                      <td className="px-3 py-2 text-center font-bold">{row.hadir + row.izin + row.sakit + row.alpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
              <Save size={16} /> {saving ? "Menyimpan..." : "Simpan Presensi"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
