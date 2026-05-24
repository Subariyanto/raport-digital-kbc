"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Kelas, Siswa, Ekstrakurikuler } from "@/lib/types";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function EkstrakurikulerPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [ekskulList, setEkskulList] = useState<Ekstrakurikuler[]>([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedSiswa, setSelectedSiswa] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEkskul, setEditingEkskul] = useState<Ekstrakurikuler | null>(null);
  const [form, setForm] = useState({ nama_kegiatan: "", predikat: "Baik", keterangan: "" });

  const supabase = createClient();

  useEffect(() => {
    const fetchKelas = async () => {
      const { data } = await supabase.from("kelas").select("*").order("jenjang").order("tingkat");
      setKelasList(data || []);
    };
    fetchKelas();
  }, [supabase]);

  useEffect(() => {
    if (!selectedKelas) { setSiswaList([]); return; }
    const fetchSiswa = async () => {
      const { data } = await supabase.from("siswa").select("*").eq("kelas_id", selectedKelas).eq("status", "aktif").order("nama");
      setSiswaList(data || []);
    };
    fetchSiswa();
  }, [selectedKelas, supabase]);

  const fetchEkskul = useCallback(async () => {
    if (!selectedKelas) return;
    setLoading(true);
    const kelas = kelasList.find((k) => k.id === selectedKelas);
    let query = supabase
      .from("ekstrakurikuler")
      .select("*")
      .eq("kelas_id", selectedKelas)
      .eq("semester", kelas?.semester || 1)
      .eq("tahun_pelajaran", kelas?.tahun_pelajaran || "2024/2025")
      .order("nama_kegiatan");

    if (selectedSiswa) {
      query = query.eq("siswa_id", selectedSiswa);
    }

    const { data, error } = await query;
    if (error) toast.error("Gagal memuat data ekstrakurikuler");
    else setEkskulList(data || []);
    setLoading(false);
  }, [selectedKelas, selectedSiswa, kelasList, supabase]);

  useEffect(() => { fetchEkskul(); }, [fetchEkskul]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_kegiatan.trim()) { toast.error("Nama kegiatan wajib diisi"); return; }
    if (!selectedSiswa) { toast.error("Pilih siswa terlebih dahulu"); return; }

    const kelas = kelasList.find((k) => k.id === selectedKelas);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from("users").select("madrasah_id").eq("id", user.id).single();

    if (editingEkskul) {
      const { error } = await supabase.from("ekstrakurikuler").update({
        nama_kegiatan: form.nama_kegiatan,
        predikat: form.predikat,
        keterangan: form.keterangan || null,
      }).eq("id", editingEkskul.id);
      if (error) toast.error("Gagal mengupdate");
      else toast.success("Ekstrakurikuler berhasil diupdate");
    } else {
      const { error } = await supabase.from("ekstrakurikuler").insert({
        siswa_id: selectedSiswa,
        kelas_id: selectedKelas,
        semester: kelas?.semester || 1,
        tahun_pelajaran: kelas?.tahun_pelajaran || "2024/2025",
        nama_kegiatan: form.nama_kegiatan,
        predikat: form.predikat,
        keterangan: form.keterangan || null,
        madrasah_id: userData?.madrasah_id,
      });
      if (error) toast.error("Gagal menambah ekstrakurikuler");
      else toast.success("Ekstrakurikuler berhasil ditambahkan");
    }

    setShowForm(false);
    setEditingEkskul(null);
    setForm({ nama_kegiatan: "", predikat: "Baik", keterangan: "" });
    fetchEkskul();
  };

  const handleEdit = (ekskul: Ekstrakurikuler) => {
    setEditingEkskul(ekskul);
    setForm({ nama_kegiatan: ekskul.nama_kegiatan, predikat: ekskul.predikat, keterangan: ekskul.keterangan || "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus?")) return;
    const { error } = await supabase.from("ekstrakurikuler").delete().eq("id", id);
    if (error) toast.error("Gagal menghapus");
    else { toast.success("Berhasil dihapus"); fetchEkskul(); }
  };

  const getSiswaName = (siswaId: string) => siswaList.find((s) => s.id === siswaId)?.nama || "-";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ekstrakurikuler</h1>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>
            <select value={selectedKelas} onChange={(e) => { setSelectedKelas(e.target.value); setSelectedSiswa(""); }} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map((k) => <option key={k.id} value={k.id}>{k.jenjang} - {k.nama_rombel}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Siswa (opsional)</label>
            <select value={selectedSiswa} onChange={(e) => setSelectedSiswa(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Semua Siswa --</option>
              {siswaList.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            {selectedKelas && selectedSiswa && (
              <button onClick={() => { setShowForm(true); setEditingEkskul(null); setForm({ nama_kegiatan: "", predikat: "Baik", keterangan: "" }); }} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Plus size={16} /> Tambah Ekskul
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : !selectedKelas ? (
        <div className="text-center py-12 text-gray-400">Pilih kelas untuk melihat data ekstrakurikuler</div>
      ) : ekskulList.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Belum ada data ekstrakurikuler. Pilih siswa lalu tambahkan kegiatan.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">No</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Siswa</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kegiatan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Predikat</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Keterangan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {ekskulList.map((ekskul, idx) => (
                  <tr key={ekskul.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{getSiswaName(ekskul.siswa_id)}</td>
                    <td className="px-4 py-3">{ekskul.nama_kegiatan}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        ekskul.predikat === "Sangat Baik" ? "bg-green-100 text-green-700" :
                        ekskul.predikat === "Baik" ? "bg-blue-100 text-blue-700" :
                        ekskul.predikat === "Cukup" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>{ekskul.predikat}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">{ekskul.keterangan || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(ekskul)} className="text-blue-600 hover:text-blue-800"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(ekskul.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editingEkskul ? "Edit Ekstrakurikuler" : "Tambah Ekstrakurikuler"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kegiatan *</label>
                  <input type="text" value={form.nama_kegiatan} onChange={(e) => setForm({ ...form, nama_kegiatan: e.target.value })} required placeholder="Contoh: Pramuka, Tahfidz, Futsal" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Predikat</label>
                  <select value={form.predikat} onChange={(e) => setForm({ ...form, predikat: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Cukup">Cukup</option>
                    <option value="Kurang">Kurang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                  <textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} rows={2} placeholder="Keterangan tambahan..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-800 text-white py-2 rounded-lg font-medium transition-colors">{editingEkskul ? "Update" : "Simpan"}</button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingEkskul(null); }} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors">Batal</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
