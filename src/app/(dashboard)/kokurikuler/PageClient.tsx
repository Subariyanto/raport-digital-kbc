"use client";

import { useState, useEffect, useCallback } from "react";
import { demoStore } from "@/lib/demo-store";
import { Kokurikuler } from "@/lib/types";
import { nilaiToPredikat, PRESET_KETERANGAN_KOKURIKULER } from "@/lib/deskripsi-generator";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

export default function KokurikulerPage() {
  const [list, setList] = useState<Kokurikuler[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Kokurikuler | null>(null);
  const [form, setForm] = useState({ nama_kegiatan: "", siswa_id: "", kelas_id: "", nilai: "" as string, keterangan: "" });

  const kelasList = demoStore.getKelas();
  const siswaList = demoStore.getSiswa();

  const fetch = useCallback(() => {
    setLoading(true);
    setList(demoStore.getKokurikuler());
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const parseNilai = (v: string): number | null => {
    const n = parseInt(v, 10);
    if (isNaN(n)) return null;
    return Math.max(0, Math.min(100, n));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_kegiatan.trim() || !form.siswa_id) { toast.error("Nama kegiatan dan siswa wajib diisi"); return; }
    const nilai = parseNilai(form.nilai);
    const predikat = nilaiToPredikat(nilai).label;
    const predikatVal = predikat === "-" ? null : predikat;

    const all = demoStore.getKokurikuler();
    if (editing) {
      const updated = all.map(k => k.id === editing.id ? { ...k, nama_kegiatan: form.nama_kegiatan, siswa_id: form.siswa_id, kelas_id: form.kelas_id, nilai, predikat: predikatVal, keterangan: form.keterangan || null } : k);
      demoStore.setKokurikuler(updated);
      toast.success("Kokurikuler berhasil diupdate");
    } else {
      all.push({
        nama_kegiatan: form.nama_kegiatan, siswa_id: form.siswa_id, kelas_id: form.kelas_id,
        nilai, predikat: predikatVal, keterangan: form.keterangan || null,
        id: demoStore.generateId(), semester: 1, tahun_pelajaran: "2024/2025",
        madrasah_id: "11111111-1111-1111-1111-111111111111",
        created_at: "", updated_at: "",
      } as Kokurikuler);
      demoStore.setKokurikuler(all);
      toast.success("Kokurikuler berhasil ditambahkan");
    }

    setShowForm(false);
    setEditing(null);
    setForm({ nama_kegiatan: "", siswa_id: "", kelas_id: "", nilai: "", keterangan: "" });
    fetch();
  };

  const handleEdit = (item: Kokurikuler) => {
    setEditing(item);
    setForm({
      nama_kegiatan: item.nama_kegiatan,
      siswa_id: item.siswa_id,
      kelas_id: item.kelas_id,
      nilai: item.nilai !== null && item.nilai !== undefined ? String(item.nilai) : "",
      keterangan: item.keterangan || "",
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    const all = demoStore.getKokurikuler().filter(k => k.id !== id);
    demoStore.setKokurikuler(all);
    toast.success("Data berhasil dihapus");
    fetch();
  };

  const getSiswaName = (id: string) => siswaList.find(s => s.id === id)?.nama || "-";

  const filtered = list.filter((k) =>
    k.nama_kegiatan.toLowerCase().includes(search.toLowerCase()) ||
    getSiswaName(k.siswa_id).toLowerCase().includes(search.toLowerCase())
  );

  const livePredikat = nilaiToPredikat(parseNilai(form.nilai));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kokurikuler</h1>
          <p className="text-sm text-gray-500">Projek Penguatan Profil Pelajar Pancasila Rahmatan lil Alamin (P5RA) & kegiatan kokurikuler lain.</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ nama_kegiatan: "", siswa_id: "", kelas_id: "", nilai: "", keterangan: "" }); }} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Tambah Kokurikuler
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Cari kegiatan atau siswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nama Kegiatan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Siswa</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Nilai</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Predikat</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Keterangan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada data kokurikuler</td></tr>
              ) : (
                filtered.map((k, idx) => {
                  const pred = nilaiToPredikat(k.nilai ?? null);
                  return (
                    <tr key={k.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{k.nama_kegiatan}</td>
                      <td className="px-4 py-3">{getSiswaName(k.siswa_id)}</td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">{k.nilai ?? "-"}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">{pred.label}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs">{(k.keterangan || "-").substring(0, 50)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(k)} className="text-blue-600 hover:text-blue-800"><Pencil size={16} /></button>
                          <button onClick={() => handleDelete(k.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editing ? "Edit Kokurikuler" : "Tambah Kokurikuler"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kegiatan *</label>
                  <input type="text" value={form.nama_kegiatan} onChange={(e) => setForm({ ...form, nama_kegiatan: e.target.value })} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Projek P5RA: Bhinneka Tunggal Ika, dll" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Siswa *</label>
                  <select value={form.siswa_id} onChange={(e) => setForm({ ...form, siswa_id: e.target.value })} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="">-- Pilih Siswa --</option>
                    {siswaList.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                  <select value={form.kelas_id} onChange={(e) => setForm({ ...form, kelas_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="">-- Pilih Kelas --</option>
                    {kelasList.map(kl => <option key={kl.id} value={kl.id}>{kl.nama_rombel}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nilai (0-100)</label>
                  <input type="number" min="0" max="100" value={form.nilai} onChange={(e) => setForm({ ...form, nilai: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="contoh: 85" />
                  <p className="text-xs text-gray-500 mt-1">
                    Predikat otomatis: <span className="font-semibold">{livePredikat.label}</span> ({livePredikat.huruf}) — A ≥ 90, B ≥ 80, C ≥ 70, D &lt; 70
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                  <select
                    value={PRESET_KETERANGAN_KOKURIKULER.includes(form.keterangan) ? form.keterangan : (form.keterangan ? "__custom__" : "")}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") return;
                      setForm({ ...form, keterangan: e.target.value });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none mb-2"
                  >
                    <option value="">-- Pilih preset / kosongkan untuk custom --</option>
                    {PRESET_KETERANGAN_KOKURIKULER.map(p => <option key={p} value={p}>{p}</option>)}
                    <option value="__custom__">[Custom — ketik manual di kotak bawah]</option>
                  </select>
                  <textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Tema/dimensi profil pelajar yang dikembangkan..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-800 text-white py-2 rounded-lg font-medium transition-colors">{editing ? "Update" : "Simpan"}</button>
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors">Batal</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
