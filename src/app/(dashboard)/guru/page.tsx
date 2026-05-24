"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Guru } from "@/lib/types";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

export default function GuruPage() {
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null);
  const [form, setForm] = useState({ nama: "", nip_nuptk: "", jabatan: "", hp: "", email: "" });

  const supabase = createClient();

  const fetchGuru = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("guru")
      .select("*")
      .order("nama");
    if (error) {
      toast.error("Gagal memuat data guru");
    } else {
      setGuruList(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchGuru();
  }, [fetchGuru]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) {
      toast.error("Nama guru wajib diisi");
      return;
    }

    if (editingGuru) {
      const { error } = await supabase
        .from("guru")
        .update(form)
        .eq("id", editingGuru.id);
      if (error) toast.error("Gagal mengupdate guru");
      else toast.success("Guru berhasil diupdate");
    } else {
      // Get user's madrasah_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userData } = await supabase
        .from("users")
        .select("madrasah_id")
        .eq("id", user.id)
        .single();

      const { error } = await supabase
        .from("guru")
        .insert({ ...form, madrasah_id: userData?.madrasah_id });
      if (error) toast.error("Gagal menambah guru");
      else toast.success("Guru berhasil ditambahkan");
    }

    setShowForm(false);
    setEditingGuru(null);
    setForm({ nama: "", nip_nuptk: "", jabatan: "", hp: "", email: "" });
    fetchGuru();
  };

  const handleEdit = (guru: Guru) => {
    setEditingGuru(guru);
    setForm({
      nama: guru.nama,
      nip_nuptk: guru.nip_nuptk || "",
      jabatan: guru.jabatan || "",
      hp: guru.hp || "",
      email: guru.email || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus guru ini?")) return;
    const { error } = await supabase.from("guru").delete().eq("id", id);
    if (error) toast.error("Gagal menghapus guru");
    else {
      toast.success("Guru berhasil dihapus");
      fetchGuru();
    }
  };

  const filtered = guruList.filter((g) =>
    g.nama.toLowerCase().includes(search.toLowerCase()) ||
    (g.nip_nuptk || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Guru</h1>
        <button
          onClick={() => { setShowForm(true); setEditingGuru(null); setForm({ nama: "", nip_nuptk: "", jabatan: "", hp: "", email: "" }); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Tambah Guru
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama atau NIP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">NIP/NUPTK</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Jabatan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">HP</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada data guru</td></tr>
              ) : (
                filtered.map((guru, idx) => (
                  <tr key={guru.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{guru.nama}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{guru.nip_nuptk || "-"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{guru.jabatan || "-"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{guru.hp || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(guru)} className="text-blue-600 hover:text-blue-800" title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(guru.id)} className="text-red-600 hover:text-red-800" title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editingGuru ? "Edit Guru" : "Tambah Guru"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                  <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIP / NUPTK</label>
                  <input type="text" value={form.nip_nuptk} onChange={(e) => setForm({ ...form, nip_nuptk: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                  <input type="text" value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. HP</label>
                  <input type="text" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-800 text-white py-2 rounded-lg font-medium transition-colors">
                    {editingGuru ? "Update" : "Simpan"}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingGuru(null); }} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors">
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
