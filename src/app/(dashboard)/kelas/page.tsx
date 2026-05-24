"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Kelas, Guru } from "@/lib/types";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

export default function KelasPage() {
  const [kelasList, setKelasList] = useState<(Kelas & { guru?: Guru })[]>([]);
  const [guruList, setGuruList] = useState<Pick<Guru, "id" | "nama">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [form, setForm] = useState({
    jenjang: "MI", tingkat: 1, nama_rombel: "", wali_kelas_id: "",
    fase: "A", tahun_pelajaran: "2024/2025", semester: 1,
  });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [kelasRes, guruRes] = await Promise.all([
      supabase.from("kelas").select("*, guru:wali_kelas_id(id, nama)").order("jenjang").order("tingkat"),
      supabase.from("guru").select("id, nama").order("nama"),
    ]);
    if (kelasRes.error) toast.error("Gagal memuat data kelas");
    else setKelasList(kelasRes.data || []);
    setGuruList(guruRes.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_rombel.trim()) { toast.error("Nama rombel wajib diisi"); return; }

    const payload = {
      ...form,
      tingkat: Number(form.tingkat),
      semester: Number(form.semester),
      wali_kelas_id: form.wali_kelas_id || null,
    };

    if (editingKelas) {
      const { error } = await supabase.from("kelas").update(payload).eq("id", editingKelas.id);
      if (error) toast.error("Gagal mengupdate kelas");
      else toast.success("Kelas berhasil diupdate");
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userData } = await supabase.from("users").select("madrasah_id").eq("id", user.id).single();
      const { error } = await supabase.from("kelas").insert({ ...payload, madrasah_id: userData?.madrasah_id });
      if (error) toast.error("Gagal menambah kelas");
      else toast.success("Kelas berhasil ditambahkan");
    }

    setShowForm(false);
    setEditingKelas(null);
    setForm({ jenjang: "MI", tingkat: 1, nama_rombel: "", wali_kelas_id: "", fase: "A", tahun_pelajaran: "2024/2025", semester: 1 });
    fetchData();
  };

  const handleEdit = (kelas: Kelas) => {
    setEditingKelas(kelas);
    setForm({
      jenjang: kelas.jenjang, tingkat: kelas.tingkat, nama_rombel: kelas.nama_rombel,
      wali_kelas_id: kelas.wali_kelas_id || "", fase: kelas.fase || "A",
      tahun_pelajaran: kelas.tahun_pelajaran, semester: kelas.semester,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kelas ini?")) return;
    const { error } = await supabase.from("kelas").delete().eq("id", id);
    if (error) toast.error("Gagal menghapus kelas");
    else { toast.success("Kelas berhasil dihapus"); fetchData(); }
  };

  const filtered = kelasList.filter((k) =>
    k.nama_rombel.toLowerCase().includes(search.toLowerCase()) ||
    k.jenjang.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelas / Rombel</h1>
        <button onClick={() => { setShowForm(true); setEditingKelas(null); setForm({ jenjang: "MI", tingkat: 1, nama_rombel: "", wali_kelas_id: "", fase: "A", tahun_pelajaran: "2024/2025", semester: 1 }); }} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Tambah Kelas
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Cari rombel atau jenjang..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rombel</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Jenjang</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Tingkat</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Fase</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Wali Kelas</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada data kelas</td></tr>
              ) : (
                filtered.map((kelas, idx) => (
                  <tr key={kelas.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{kelas.nama_rombel}</td>
                    <td className="px-4 py-3">{kelas.jenjang}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{kelas.tingkat}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{kelas.fase || "-"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{(kelas as unknown as { guru?: { nama: string } }).guru?.nama || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(kelas)} className="text-blue-600 hover:text-blue-800"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(kelas.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editingKelas ? "Edit Kelas" : "Tambah Kelas"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenjang</label>
                    <select value={form.jenjang} onChange={(e) => setForm({ ...form, jenjang: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value="RA">RA</option>
                      <option value="MI">MI</option>
                      <option value="MTs">MTs</option>
                      <option value="MA">MA</option>
                      <option value="MAK">MAK</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat</label>
                    <input type="number" min={1} max={12} value={form.tingkat} onChange={(e) => setForm({ ...form, tingkat: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Rombel *</label>
                  <input type="text" value={form.nama_rombel} onChange={(e) => setForm({ ...form, nama_rombel: e.target.value })} required placeholder="Contoh: IV-A" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
                  <select value={form.fase} onChange={(e) => setForm({ ...form, fase: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="Fondasi">Fondasi (RA)</option>
                    <option value="A">Fase A</option>
                    <option value="B">Fase B</option>
                    <option value="C">Fase C</option>
                    <option value="D">Fase D</option>
                    <option value="E">Fase E</option>
                    <option value="F">Fase F</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wali Kelas</label>
                  <select value={form.wali_kelas_id} onChange={(e) => setForm({ ...form, wali_kelas_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="">-- Pilih Wali Kelas --</option>
                    {guruList.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Pelajaran</label>
                    <input type="text" value={form.tahun_pelajaran} onChange={(e) => setForm({ ...form, tahun_pelajaran: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                    <select value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value={1}>1 (Ganjil)</option>
                      <option value={2}>2 (Genap)</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-800 text-white py-2 rounded-lg font-medium transition-colors">{editingKelas ? "Update" : "Simpan"}</button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingKelas(null); }} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors">Batal</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
