"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MataPelajaran } from "@/lib/types";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

export default function MataPelajaranPage() {
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMapel, setEditingMapel] = useState<MataPelajaran | null>(null);
  const [form, setForm] = useState({ nama: "", kelompok: "", jenjang: "MI" });

  const supabase = createClient();

  const fetchMapel = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("mata_pelajaran").select("*").order("kelompok").order("nama");
    if (error) toast.error("Gagal memuat data mata pelajaran");
    else setMapelList(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchMapel(); }, [fetchMapel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) { toast.error("Nama mata pelajaran wajib diisi"); return; }

    if (editingMapel) {
      const { error } = await supabase.from("mata_pelajaran").update(form).eq("id", editingMapel.id);
      if (error) toast.error("Gagal mengupdate mata pelajaran");
      else toast.success("Mata pelajaran berhasil diupdate");
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userData } = await supabase.from("users").select("madrasah_id").eq("id", user.id).single();
      const { error } = await supabase.from("mata_pelajaran").insert({ ...form, madrasah_id: userData?.madrasah_id });
      if (error) toast.error("Gagal menambah mata pelajaran");
      else toast.success("Mata pelajaran berhasil ditambahkan");
    }

    setShowForm(false);
    setEditingMapel(null);
    setForm({ nama: "", kelompok: "", jenjang: "MI" });
    fetchMapel();
  };

  const handleEdit = (mapel: MataPelajaran) => {
    setEditingMapel(mapel);
    setForm({ nama: mapel.nama, kelompok: mapel.kelompok || "", jenjang: mapel.jenjang || "MI" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus mata pelajaran ini?")) return;
    const { error } = await supabase.from("mata_pelajaran").delete().eq("id", id);
    if (error) toast.error("Gagal menghapus mata pelajaran");
    else { toast.success("Mata pelajaran berhasil dihapus"); fetchMapel(); }
  };

  const filtered = mapelList.filter((m) =>
    m.nama.toLowerCase().includes(search.toLowerCase()) ||
    (m.kelompok || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mata Pelajaran</h1>
        <button onClick={() => { setShowForm(true); setEditingMapel(null); setForm({ nama: "", kelompok: "", jenjang: "MI" }); }} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Tambah Mapel
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Cari mata pelajaran..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Kelompok</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Jenjang</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Tidak ada data</td></tr>
              ) : (
                filtered.map((mapel, idx) => (
                  <tr key={mapel.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{mapel.nama}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{mapel.kelompok || "-"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{mapel.jenjang || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(mapel)} className="text-blue-600 hover:text-blue-800"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(mapel.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editingMapel ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Mata Pelajaran *</label>
                  <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelompok</label>
                  <select value={form.kelompok} onChange={(e) => setForm({ ...form, kelompok: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="">-- Pilih Kelompok --</option>
                    <option value="Pendidikan Agama Islam">Pendidikan Agama Islam</option>
                    <option value="Umum">Umum</option>
                    <option value="Muatan Lokal">Muatan Lokal</option>
                    <option value="Pilihan/Kejuruan">Pilihan/Kejuruan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenjang</label>
                  <select value={form.jenjang} onChange={(e) => setForm({ ...form, jenjang: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="RA">RA</option>
                    <option value="MI">MI</option>
                    <option value="MTs">MTs</option>
                    <option value="MA">MA</option>
                    <option value="MAK">MAK</option>
                    <option value="Semua">Semua Jenjang</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-800 text-white py-2 rounded-lg font-medium transition-colors">{editingMapel ? "Update" : "Simpan"}</button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingMapel(null); }} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors">Batal</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
