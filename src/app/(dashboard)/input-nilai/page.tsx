"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Kelas, MataPelajaran, Siswa, Nilai, TujuanPembelajaran } from "@/lib/types";
import { getPredikat } from "@/lib/deskripsi-generator";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

export default function InputNilaiPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [tpList, setTpList] = useState<TujuanPembelajaran[]>([]);
  const [nilaiData, setNilaiData] = useState<Record<string, Record<string, Partial<Nilai>>>>({});

  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");
  const [selectedTp, setSelectedTp] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchInitial = async () => {
      const [kelasRes, mapelRes] = await Promise.all([
        supabase.from("kelas").select("*").order("jenjang").order("tingkat"),
        supabase.from("mata_pelajaran").select("*").order("nama"),
      ]);
      setKelasList(kelasRes.data || []);
      setMapelList(mapelRes.data || []);
    };
    fetchInitial();
  }, [supabase]);

  // Fetch TP when mapel changes
  useEffect(() => {
    if (!selectedMapel) { setTpList([]); return; }
    const fetchTp = async () => {
      const { data: cpData } = await supabase
        .from("capaian_pembelajaran")
        .select("id")
        .eq("mapel_id", selectedMapel);
      if (cpData && cpData.length > 0) {
        const cpIds = cpData.map((cp: { id: string }) => cp.id);
        const { data: tpData } = await supabase
          .from("tujuan_pembelajaran")
          .select("*")
          .in("cp_id", cpIds)
          .order("urutan");
        setTpList(tpData || []);
      } else {
        setTpList([]);
      }
    };
    fetchTp();
  }, [selectedMapel, supabase]);

  // Fetch siswa + existing nilai
  const fetchData = useCallback(async () => {
    if (!selectedKelas || !selectedMapel) return;
    setLoading(true);

    const { data: siswaData } = await supabase
      .from("siswa")
      .select("*")
      .eq("kelas_id", selectedKelas)
      .eq("status", "aktif")
      .order("nama");
    setSiswaList(siswaData || []);

    // Fetch existing nilai
    let query = supabase
      .from("nilai")
      .select("*")
      .eq("kelas_id", selectedKelas)
      .eq("mapel_id", selectedMapel);

    if (selectedTp) {
      query = query.eq("tp_id", selectedTp);
    }

    const { data: nilaiRes } = await query;

    // Map: siswa_id -> tp_id -> nilai
    const mapped: Record<string, Record<string, Partial<Nilai>>> = {};
    (nilaiRes || []).forEach((n: Nilai) => {
      const tpKey = n.tp_id || "general";
      if (!mapped[n.siswa_id]) mapped[n.siswa_id] = {};
      mapped[n.siswa_id][tpKey] = n;
    });
    setNilaiData(mapped);
    setLoading(false);
  }, [selectedKelas, selectedMapel, selectedTp, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateNilai = (siswaId: string, field: string, value: string) => {
    const tpKey = selectedTp || "general";
    setNilaiData((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        [tpKey]: {
          ...prev[siswaId]?.[tpKey],
          [field]: value === "" ? null : Number(value),
        },
      },
    }));
  };

  const updateCatatan = (siswaId: string, value: string) => {
    const tpKey = selectedTp || "general";
    setNilaiData((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        [tpKey]: {
          ...prev[siswaId]?.[tpKey],
          catatan_formatif: value,
        },
      },
    }));
  };

  const saveAll = async () => {
    if (!selectedKelas || !selectedMapel) return;
    setSaving(true);

    const kelas = kelasList.find((k) => k.id === selectedKelas);
    const tpKey = selectedTp || "general";

    for (const siswa of siswaList) {
      const nilaiSiswa = nilaiData[siswa.id]?.[tpKey];
      if (!nilaiSiswa) continue;

      const formatif = Number(nilaiSiswa.nilai_formatif) || 0;
      const sumatif = Number(nilaiSiswa.nilai_sumatif) || 0;
      const proyek = Number(nilaiSiswa.nilai_proyek) || 0;
      const nilaiAkhir = Math.round((formatif + sumatif + proyek) / 3);
      const predikat = getPredikat(nilaiAkhir);

      const payload = {
        siswa_id: siswa.id,
        mapel_id: selectedMapel,
        kelas_id: selectedKelas,
        tp_id: selectedTp || null,
        semester: kelas?.semester || 1,
        tahun_pelajaran: kelas?.tahun_pelajaran || "2024/2025",
        nilai_formatif: nilaiSiswa.nilai_formatif ?? null,
        nilai_sumatif: nilaiSiswa.nilai_sumatif ?? null,
        nilai_proyek: nilaiSiswa.nilai_proyek ?? null,
        nilai_akhir: nilaiAkhir,
        predikat,
        catatan_formatif: nilaiSiswa.catatan_formatif || null,
      };

      // Upsert
      if ((nilaiSiswa as Nilai).id) {
        await supabase.from("nilai").update(payload).eq("id", (nilaiSiswa as Nilai).id);
      } else {
        await supabase.from("nilai").insert(payload);
      }
    }

    toast.success("Nilai berhasil disimpan");
    setSaving(false);
    fetchData();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Input Nilai</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>
            <select value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map((k) => <option key={k.id} value={k.id}>{k.jenjang} - {k.nama_rombel}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Mata Pelajaran</label>
            <select value={selectedMapel} onChange={(e) => setSelectedMapel(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Pilih Mapel --</option>
              {mapelList.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan Pembelajaran (opsional)</label>
            <select value={selectedTp} onChange={(e) => setSelectedTp(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Semua / Umum --</option>
              {tpList.map((tp) => <option key={tp.id} value={tp.id}>{tp.kode} - {tp.deskripsi.substring(0, 50)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Nilai Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : selectedKelas && selectedMapel && siswaList.length > 0 ? (
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
                  <th className="text-left px-3 py-3 font-medium text-gray-600">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {siswaList.map((siswa, idx) => {
                  const tpKey = selectedTp || "general";
                  const n = nilaiData[siswa.id]?.[tpKey] || {};
                  const formatif = Number(n.nilai_formatif) || 0;
                  const sumatif = Number(n.nilai_sumatif) || 0;
                  const proyek = Number(n.nilai_proyek) || 0;
                  const akhir = Math.round((formatif + sumatif + proyek) / 3);
                  const predikat = getPredikat(akhir);

                  return (
                    <tr key={siswa.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium whitespace-nowrap">{siswa.nama}</td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} max={100} value={n.nilai_formatif ?? ""} onChange={(e) => updateNilai(siswa.id, "nilai_formatif", e.target.value)} className="w-16 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} max={100} value={n.nilai_sumatif ?? ""} onChange={(e) => updateNilai(siswa.id, "nilai_sumatif", e.target.value)} className="w-16 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} max={100} value={n.nilai_proyek ?? ""} onChange={(e) => updateNilai(siswa.id, "nilai_proyek", e.target.value)} className="w-16 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500 outline-none" />
                      </td>
                      <td className="px-3 py-2 text-center font-bold">{akhir || "-"}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${predikat === "A" ? "bg-green-100 text-green-700" : predikat === "B" ? "bg-blue-100 text-blue-700" : predikat === "C" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                          {akhir ? predikat : "-"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={n.catatan_formatif || ""} onChange={(e) => updateCatatan(siswa.id, e.target.value)} placeholder="Catatan..." className="w-full min-w-[120px] px-2 py-1 border rounded focus:ring-2 focus:ring-primary-500 outline-none text-xs" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t bg-gray-50">
            <button onClick={saveAll} disabled={saving} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
              <Save size={16} /> {saving ? "Menyimpan..." : "Simpan Semua Nilai"}
            </button>
          </div>
        </div>
      ) : selectedKelas && selectedMapel ? (
        <div className="text-center py-12 text-gray-400">Tidak ada siswa di kelas ini</div>
      ) : (
        <div className="text-center py-12 text-gray-400">Pilih kelas dan mata pelajaran untuk input nilai</div>
      )}
    </div>
  );
}
