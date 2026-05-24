"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Kelas, Siswa, Presensi } from "@/lib/types";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

export default function PresensiPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [presensiData, setPresensiData] = useState<Record<string, Partial<Presensi>>>({});
  const [selectedKelas, setSelectedKelas] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchKelas = async () => {
      const { data } = await supabase.from("kelas").select("*").order("jenjang").order("tingkat");
      setKelasList(data || []);
    };
    fetchKelas();
  }, [supabase]);

  const fetchData = useCallback(async () => {
    if (!selectedKelas) return;
    setLoading(true);

    const kelas = kelasList.find((k) => k.id === selectedKelas);

    const [siswaRes, presensiRes] = await Promise.all([
      supabase.from("siswa").select("*").eq("kelas_id", selectedKelas).eq("status", "aktif").order("nama"),
      supabase.from("presensi").select("*").eq("kelas_id", selectedKelas).eq("semester", kelas?.semester || 1).eq("tahun_pelajaran", kelas?.tahun_pelajaran || "2024/2025"),
    ]);

    setSiswaList(siswaRes.data || []);

    const mapped: Record<string, Partial<Presensi>> = {};
    (presensiRes.data || []).forEach((p: Presensi) => {
      mapped[p.siswa_id] = p;
    });
    setPresensiData(mapped);
    setLoading(false);
  }, [selectedKelas, kelasList, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updatePresensi = (siswaId: string, field: string, value: string) => {
    setPresensiData((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        [field]: value === "" ? 0 : Number(value),
      },
    }));
  };

  const saveAll = async () => {
    if (!selectedKelas) return;
    setSaving(true);

    const kelas = kelasList.find((k) => k.id === selectedKelas);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data: userData } = await supabase.from("users").select("madrasah_id").eq("id", user.id).single();

    for (const siswa of siswaList) {
      const p = presensiData[siswa.id];
      if (!p) continue;

      const payload = {
        siswa_id: siswa.id,
        kelas_id: selectedKelas,
        semester: kelas?.semester || 1,
        tahun_pelajaran: kelas?.tahun_pelajaran || "2024/2025",
        sakit: Number(p.sakit) || 0,
        izin: Number(p.izin) || 0,
        alpa: Number(p.alpa) || 0,
        hadir: Number(p.hadir) || 0,
        madrasah_id: userData?.madrasah_id,
      };

      if ((p as Presensi).id) {
        await supabase.from("presensi").update(payload).eq("id", (p as Presensi).id);
      } else {
        await supabase.from("presensi").insert(payload);
      }
    }

    toast.success("Presensi berhasil disimpan");
    setSaving(false);
    fetchData();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Presensi</h1>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>
          <select value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="">-- Pilih Kelas --</option>
            {kelasList.map((k) => <option key={k.id} value={k.id}>{k.jenjang} - {k.nama_rombel} (Smt {k.semester})</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : selectedKelas && siswaList.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">No</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nama Siswa</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Hadir</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Sakit</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Izin</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Alpa</th>
                </tr>
              </thead>
              <tbody>
                {siswaList.map((siswa, idx) => {
                  const p = presensiData[siswa.id] || {};
                  return (
                    <tr key={siswa.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{siswa.nama}</td>
                      <td className="px-4 py-3">
                        <input type="number" min={0} value={p.hadir ?? ""} onChange={(e) => updatePresensi(siswa.id, "hadir", e.target.value)} className="w-16 mx-auto block px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min={0} value={p.sakit ?? ""} onChange={(e) => updatePresensi(siswa.id, "sakit", e.target.value)} className="w-16 mx-auto block px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min={0} value={p.izin ?? ""} onChange={(e) => updatePresensi(siswa.id, "izin", e.target.value)} className="w-16 mx-auto block px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min={0} value={p.alpa ?? ""} onChange={(e) => updatePresensi(siswa.id, "alpa", e.target.value)} className="w-16 mx-auto block px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t bg-gray-50">
            <button onClick={saveAll} disabled={saving} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
              <Save size={16} /> {saving ? "Menyimpan..." : "Simpan Presensi"}
            </button>
          </div>
        </div>
      ) : selectedKelas ? (
        <div className="text-center py-12 text-gray-400">Tidak ada siswa di kelas ini</div>
      ) : (
        <div className="text-center py-12 text-gray-400">Pilih kelas untuk input presensi</div>
      )}
    </div>
  );
}
