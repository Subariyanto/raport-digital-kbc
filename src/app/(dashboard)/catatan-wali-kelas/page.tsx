"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Kelas, Siswa, CatatanWaliKelas } from "@/lib/types";
import { generateCatatanWaliKelas } from "@/lib/deskripsi-generator";
import toast from "react-hot-toast";
import { Wand2, Save } from "lucide-react";

export default function CatatanWaliKelasPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [catatanMap, setCatatanMap] = useState<Record<string, CatatanWaliKelas>>({});
  const [localCatatan, setLocalCatatan] = useState<Record<string, string>>({});
  const [presensiMap, setPresensiMap] = useState<Record<string, { sakit: number; izin: number; alpa: number; hadir: number }>>({});
  const [nilaiRataMap, setNilaiRataMap] = useState<Record<string, number>>({});
  const [selectedKelas, setSelectedKelas] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

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
    const semester = kelas?.semester || 1;
    const tp = kelas?.tahun_pelajaran || "2024/2025";

    // Fetch siswa
    const { data: siswaData } = await supabase
      .from("siswa").select("*").eq("kelas_id", selectedKelas).eq("status", "aktif").order("nama");
    setSiswaList(siswaData || []);

    // Fetch existing catatan
    const { data: catatanData } = await supabase
      .from("catatan_wali_kelas").select("*")
      .eq("kelas_id", selectedKelas).eq("semester", semester).eq("tahun_pelajaran", tp);

    const catMap: Record<string, CatatanWaliKelas> = {};
    const localCat: Record<string, string> = {};
    (catatanData || []).forEach((c: CatatanWaliKelas) => {
      catMap[c.siswa_id] = c;
      localCat[c.siswa_id] = c.catatan || "";
    });
    setCatatanMap(catMap);
    setLocalCatatan(localCat);

    // Fetch presensi
    const { data: presensiData } = await supabase
      .from("presensi").select("*")
      .eq("kelas_id", selectedKelas).eq("semester", semester).eq("tahun_pelajaran", tp);

    const presMap: Record<string, { sakit: number; izin: number; alpa: number; hadir: number }> = {};
    (presensiData || []).forEach((p: { siswa_id: string; sakit: number; izin: number; alpa: number; hadir: number }) => {
      presMap[p.siswa_id] = { sakit: p.sakit, izin: p.izin, alpa: p.alpa, hadir: p.hadir };
    });
    setPresensiMap(presMap);

    // Fetch rata-rata nilai per siswa
    const { data: nilaiData } = await supabase
      .from("nilai").select("siswa_id, nilai_akhir")
      .eq("kelas_id", selectedKelas).eq("semester", semester).eq("tahun_pelajaran", tp);

    const nilaiGroup: Record<string, number[]> = {};
    (nilaiData || []).forEach((n: { siswa_id: string; nilai_akhir: number | null }) => {
      if (n.nilai_akhir !== null) {
        if (!nilaiGroup[n.siswa_id]) nilaiGroup[n.siswa_id] = [];
        nilaiGroup[n.siswa_id].push(n.nilai_akhir);
      }
    });
    const rataMap: Record<string, number> = {};
    Object.entries(nilaiGroup).forEach(([id, values]) => {
      rataMap[id] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    });
    setNilaiRataMap(rataMap);

    setLoading(false);
  }, [selectedKelas, kelasList, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generateForSiswa = (siswa: Siswa) => {
    const pres = presensiMap[siswa.id] || { sakit: 0, izin: 0, alpa: 0, hadir: 0 };
    const rataRata = nilaiRataMap[siswa.id] || 0;

    const catatan = generateCatatanWaliKelas({
      namaSiswa: siswa.nama,
      rataRata,
      hadir: pres.hadir,
      sakit: pres.sakit,
      izin: pres.izin,
      alpa: pres.alpa,
    });

    setLocalCatatan((prev) => ({ ...prev, [siswa.id]: catatan }));
  };

  const generateAll = () => {
    setGenerating(true);
    siswaList.forEach((siswa) => generateForSiswa(siswa));
    setGenerating(false);
    toast.success("Catatan wali kelas berhasil di-generate");
  };

  const saveCatatan = async (siswaId: string) => {
    const text = localCatatan[siswaId];
    if (!text) { toast.error("Catatan kosong"); return; }

    const kelas = kelasList.find((k) => k.id === selectedKelas);
    const existing = catatanMap[siswaId];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from("users").select("madrasah_id").eq("id", user.id).single();

    if (existing) {
      const { error } = await supabase.from("catatan_wali_kelas")
        .update({ catatan: text, is_generated: true })
        .eq("id", existing.id);
      if (error) toast.error("Gagal menyimpan");
      else toast.success("Catatan tersimpan");
    } else {
      const { error } = await supabase.from("catatan_wali_kelas").insert({
        siswa_id: siswaId,
        kelas_id: selectedKelas,
        semester: kelas?.semester || 1,
        tahun_pelajaran: kelas?.tahun_pelajaran || "2024/2025",
        catatan: text,
        is_generated: true,
        madrasah_id: userData?.madrasah_id,
      });
      if (error) toast.error("Gagal menyimpan");
      else toast.success("Catatan tersimpan");
    }
    fetchData();
  };

  const saveAll = async () => {
    for (const siswa of siswaList) {
      if (localCatatan[siswa.id]) {
        await saveCatatan(siswa.id);
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Catatan Wali Kelas</h1>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>
            <select value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map((k) => <option key={k.id} value={k.id}>{k.jenjang} - {k.nama_rombel}</option>)}
            </select>
          </div>
          {selectedKelas && siswaList.length > 0 && (
            <div className="flex gap-2">
              <button onClick={generateAll} disabled={generating} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                <Wand2 size={16} /> Generate Semua
              </button>
              <button onClick={saveAll} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Save size={16} /> Simpan Semua
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : !selectedKelas ? (
        <div className="text-center py-12 text-gray-400">Pilih kelas untuk mengelola catatan wali kelas</div>
      ) : siswaList.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Tidak ada siswa di kelas ini</div>
      ) : (
        <div className="space-y-4">
          {siswaList.map((siswa) => {
            const rataRata = nilaiRataMap[siswa.id] || 0;
            const pres = presensiMap[siswa.id] || { sakit: 0, izin: 0, alpa: 0, hadir: 0 };
            const catText = localCatatan[siswa.id] || "";

            return (
              <div key={siswa.id} className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{siswa.nama}</h3>
                    <p className="text-xs text-gray-500">
                      Rata-rata: <span className="font-bold">{rataRata || "-"}</span> |
                      Hadir: {pres.hadir} | Sakit: {pres.sakit} | Izin: {pres.izin} | Alpa: {pres.alpa}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => generateForSiswa(siswa)} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors">
                      <Wand2 size={12} /> Generate
                    </button>
                    <button onClick={() => saveCatatan(siswa.id)} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors">
                      <Save size={12} /> Simpan
                    </button>
                  </div>
                </div>
                <textarea
                  value={catText}
                  onChange={(e) => setLocalCatatan((prev) => ({ ...prev, [siswa.id]: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-y"
                  placeholder="Klik 'Generate' untuk membuat catatan otomatis, atau ketik manual..."
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
