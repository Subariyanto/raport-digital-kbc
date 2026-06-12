"use client";

import { useState, useEffect, useCallback } from "react";
import { demoStore } from "@/lib/demo-store";
import { Siswa } from "@/lib/types";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

export default function SiswaPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [form, setForm] = useState({
    nis: "", nisn: "", nama: "", tempat_lahir: "", tanggal_lahir: "",
    jenis_kelamin: "L", agama: "Islam", alamat: "", nama_ayah: "",
    nama_ibu: "", nama_wali: "", hp_ortu: "", jenjang: "MI", fase: "B",
  });

  const fetchSiswa = useCallback(() => {
    setLoading(true);
    setSiswaList(demoStore.getSiswa());
    setLoading(false);
  }, []);

  useEffect(() => { fetchSiswa(); }, [fetchSiswa]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.nis.trim()) {
      toast.error("Nama dan NIS wajib diisi");
      return;
    }

    const list = demoStore.getSiswa();
    if (editingSiswa) {
      const updated = list.map(s => s.id === editingSiswa.id ? { ...s, ...form, jenis_kelamin: form.jenis_kelamin as "L" | "P" } : s);
      demoStore.setSiswa(updated as Siswa[]);
      toast.success("Siswa berhasil diupdate");
    } else {
      list.push({ ...form, id: demoStore.generateId(), kelas_id: null, status: "aktif" as const, foto_url: null, nama_wali: form.nama_wali || null, madrasah_id: "11111111-1111-1111-1111-111111111111", created_at: "", updated_at: "" } as Siswa);
      demoStore.setSiswa(list);
      toast.success("Siswa berhasil ditambahkan");
    }

    setShowForm(false);
    setEditingSiswa(null);
    setForm({ nis: "", nisn: "", nama: "", tempat_lahir: "", tanggal_lahir: "", jenis_kelamin: "L", agama: "Islam", alamat: "", nama_ayah: "", nama_ibu: "", nama_wali: "", hp_ortu: "", jenjang: "MI", fase: "B" });
    fetchSiswa();
  };

  const handleEdit = (siswa: Siswa) => {
    setEditingSiswa(siswa);
    setForm({
      nis: siswa.nis, nisn: siswa.nisn || "", nama: siswa.nama,
      tempat_lahir: siswa.tempat_lahir || "", tanggal_lahir: siswa.tanggal_lahir || "",
      jenis_kelamin: siswa.jenis_kelamin, agama: siswa.agama || "Islam",
      alamat: siswa.alamat || "", nama_ayah: siswa.nama_ayah || "",
      nama_ibu: siswa.nama_ibu || "", nama_wali: siswa.nama_wali || "",
      hp_ortu: siswa.hp_ortu || "", jenjang: siswa.jenjang || "MI", fase: siswa.fase || "B",
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Yakin ingin menghapus siswa ini?")) return;
    const list = demoStore.getSiswa().filter(s => s.id !== id);
    demoStore.setSiswa(list);
    toast.success("Siswa berhasil dihapus");
    fetchSiswa();
  };

  const filtered = siswaList.filter((s) =>
    s.nama.toLowerCase().includes(search.toLowerCase()) ||
    s.nis.toLowerCase().includes(search.toLowerCase()) ||
    (s.nisn || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Siswa</h1>
        <button
          onClick={() => { setShowForm(true); setEditingSiswa(null); setForm({ nis: "", nisn: "", nama: "", tempat_lahir: "", tanggal_lahir: "", jenis_kelamin: "L", agama: "Islam", alamat: "", nama_ayah: "", nama_ibu: "", nama_wali: "", hp_ortu: "", jenjang: "MI", fase: "B" }); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Tambah Siswa
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Cari nama, NIS, atau NISN..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">NIS</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">L/P</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Jenjang</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Fase</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada data siswa</td></tr>
              ) : (
                filtered.map((siswa, idx) => (
                  <tr key={siswa.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3">{siswa.nis}</td>
                    <td className="px-4 py-3 font-medium">{siswa.nama}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{siswa.jenis_kelamin}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{siswa.jenjang || "-"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{siswa.fase || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(siswa)} className="text-blue-600 hover:text-blue-800"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(siswa.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editingSiswa ? "Edit Siswa" : "Tambah Siswa"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIS *</label>
                    <input type="text" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
                    <input type="text" value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                  <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label>
                    <input type="text" value={form.tempat_lahir} onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                    <input type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                    <select value={form.jenis_kelamin} onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agama</label>
                    <input type="text" value={form.agama} onChange={(e) => setForm({ ...form, agama: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                  <textarea value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ayah</label>
                    <input type="text" value={form.nama_ayah} onChange={(e) => setForm({ ...form, nama_ayah: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ibu</label>
                    <input type="text" value={form.nama_ibu} onChange={(e) => setForm({ ...form, nama_ibu: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
                    <select value={form.fase} onChange={(e) => setForm({ ...form, fase: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value="Fondasi">Fondasi (RA)</option>
                      <option value="A">Fase A (MI 1-2)</option>
                      <option value="B">Fase B (MI 3-4)</option>
                      <option value="C">Fase C (MI 5-6)</option>
                      <option value="D">Fase D (MTs 7-9)</option>
                      <option value="E">Fase E (MA/MAK 10)</option>
                      <option value="F">Fase F (MA/MAK 11-12)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. HP Orang Tua</label>
                  <input type="text" value={form.hp_ortu} onChange={(e) => setForm({ ...form, hp_ortu: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-800 text-white py-2 rounded-lg font-medium transition-colors">{editingSiswa ? "Update" : "Simpan"}</button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingSiswa(null); }} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors">Batal</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
