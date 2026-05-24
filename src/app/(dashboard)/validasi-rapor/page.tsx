"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Kelas, Siswa } from "@/lib/types";
import toast from "react-hot-toast";
import { CheckCircle, Clock, Lock, Send } from "lucide-react";

interface ValidasiRapor {
  id: string;
  siswa_id: string;
  kelas_id: string;
  semester: number;
  tahun_pelajaran: string;
  status: "draft" | "diajukan" | "divalidasi" | "dikunci";
  diajukan_at: string | null;
  divalidasi_at: string | null;
  dikunci_at: string | null;
  catatan_validasi: string | null;
}

export default function ValidasiRaportPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [validasiMap, setValidasiMap] = useState<Record<string, ValidasiRapor>>({});
  const [selectedKelas, setSelectedKelas] = useState("");
  const [loading, setLoading] = useState(false);

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

    const [siswaRes, validasiRes] = await Promise.all([
      supabase.from("siswa").select("*").eq("kelas_id", selectedKelas).eq("status", "aktif").order("nama"),
      supabase.from("validasi_rapor").select("*").eq("kelas_id", selectedKelas)
        .eq("semester", kelas?.semester || 1).eq("tahun_pelajaran", kelas?.tahun_pelajaran || "2024/2025"),
    ]);

    setSiswaList(siswaRes.data || []);

    const vMap: Record<string, ValidasiRapor> = {};
    (validasiRes.data || []).forEach((v: ValidasiRapor) => {
      vMap[v.siswa_id] = v;
    });
    setValidasiMap(vMap);
    setLoading(false);
  }, [selectedKelas, kelasList, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (siswaId: string, newStatus: string) => {
    const kelas = kelasList.find((k) => k.id === selectedKelas);
    const existing = validasiMap[siswaId];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from("users").select("madrasah_id").eq("id", user.id).single();

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { status: newStatus };

    if (newStatus === "diajukan") { updates.diajukan_oleh = user.id; updates.diajukan_at = now; }
    if (newStatus === "divalidasi") { updates.divalidasi_oleh = user.id; updates.divalidasi_at = now; }
    if (newStatus === "dikunci") { updates.dikunci_oleh = user.id; updates.dikunci_at = now; }

    if (existing) {
      const { error } = await supabase.from("validasi_rapor").update(updates).eq("id", existing.id);
      if (error) toast.error("Gagal mengupdate status");
      else toast.success(`Status diubah ke: ${newStatus}`);
    } else {
      const { error } = await supabase.from("validasi_rapor").insert({
        siswa_id: siswaId,
        kelas_id: selectedKelas,
        semester: kelas?.semester || 1,
        tahun_pelajaran: kelas?.tahun_pelajaran || "2024/2025",
        madrasah_id: userData?.madrasah_id,
        ...updates,
      });
      if (error) toast.error("Gagal membuat validasi");
      else toast.success(`Status diubah ke: ${newStatus}`);
    }
    fetchData();
  };

  const ajukanSemua = async () => {
    for (const siswa of siswaList) {
      const v = validasiMap[siswa.id];
      if (!v || v.status === "draft") {
        await updateStatus(siswa.id, "diajukan");
      }
    }
  };

  const validasiSemua = async () => {
    for (const siswa of siswaList) {
      const v = validasiMap[siswa.id];
      if (v && v.status === "diajukan") {
        await updateStatus(siswa.id, "divalidasi");
      }
    }
  };

  const kunciSemua = async () => {
    for (const siswa of siswaList) {
      const v = validasiMap[siswa.id];
      if (v && v.status === "divalidasi") {
        await updateStatus(siswa.id, "dikunci");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Draft</span>;
      case "diajukan": return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Diajukan</span>;
      case "divalidasi": return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Divalidasi</span>;
      case "dikunci": return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">🔒 Dikunci</span>;
      default: return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Draft</span>;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Validasi Raport</h1>

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
            <div className="flex flex-wrap gap-2">
              <button onClick={ajukanSemua} className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors">
                <Send size={14} /> Ajukan Semua
              </button>
              <button onClick={validasiSemua} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors">
                <CheckCircle size={14} /> Validasi Semua
              </button>
              <button onClick={kunciSemua} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors">
                <Lock size={14} /> Kunci Semua
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Alur Validasi:</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="bg-gray-100 px-2 py-1 rounded">Draft</span>
          <span>→</span>
          <span className="bg-yellow-100 px-2 py-1 rounded">Diajukan (Wali Kelas)</span>
          <span>→</span>
          <span className="bg-blue-100 px-2 py-1 rounded">Divalidasi (Kepala Madrasah)</span>
          <span>→</span>
          <span className="bg-green-100 px-2 py-1 rounded">🔒 Dikunci</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : !selectedKelas ? (
        <div className="text-center py-12 text-gray-400">Pilih kelas untuk melihat status validasi raport</div>
      ) : siswaList.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Tidak ada siswa di kelas ini</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">No</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nama Siswa</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {siswaList.map((siswa, idx) => {
                  const v = validasiMap[siswa.id];
                  const status = v?.status || "draft";

                  return (
                    <tr key={siswa.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{siswa.nama}</td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(status)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {status === "draft" && (
                            <button onClick={() => updateStatus(siswa.id, "diajukan")} className="text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100 px-2 py-1 rounded transition-colors">
                              <Send size={12} className="inline mr-1" />Ajukan
                            </button>
                          )}
                          {status === "diajukan" && (
                            <button onClick={() => updateStatus(siswa.id, "divalidasi")} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                              <CheckCircle size={12} className="inline mr-1" />Validasi
                            </button>
                          )}
                          {status === "divalidasi" && (
                            <button onClick={() => updateStatus(siswa.id, "dikunci")} className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded transition-colors">
                              <Lock size={12} className="inline mr-1" />Kunci
                            </button>
                          )}
                          {status === "dikunci" && (
                            <button onClick={() => updateStatus(siswa.id, "draft")} className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded transition-colors">
                              <Clock size={12} className="inline mr-1" />Buka Kunci
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
