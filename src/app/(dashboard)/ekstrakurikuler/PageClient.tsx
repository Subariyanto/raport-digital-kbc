"use client";

import { useState, useEffect, useCallback } from "react";
import { demoStore } from "@/lib/demo-store";
import { Ekstrakurikuler } from "@/lib/types";
import { nilaiToPredikat, PRESET_KETERANGAN_EKSTRAKURIKULER } from "@/lib/deskripsi-generator";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

export default function EkstrakurikulerPage() {
  const [ekskulList, setEkskulList] = useState<Ekstrakurikuler[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEkskul, setEditingEkskul] = useState<Ekstrakurikuler | null>(null);
  const [form, setForm] = useState({ nama_kegiatan: "", siswa_id: "", kelas_id: "", nilai: "" as string, keterangan: "" });

  const kelasList = demoStore.getKelas();
  const siswaList = demoStore.getSiswa();

  const fetchEkskul = useCallback(() => {
    setLoading(true);
    setEkskulList(demoStore.getEkskul());
    setLoading(false);
  }, []);

  useEffect(() => { fetchEkskul(); }, [fetchEkskul]);

  const parseNilai = (v: string): number | null => {
    const n = parseInt(v, 10);
    if (isNaN(n)) return null;
    return Math.max(0, Math.min(100, n));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_kegiatan.trim() || !form.siswa_id) { toast.error("Nama ekskul dan siswa wajib diisi"); return; }
    const nilai = parseNilai(form.nilai);
    const predikat = nilaiToPredikat(nilai).label;
    const predikatVal = predikat === "-" ? null : predikat;

    const list = demoStore.getEkskul();
    if (editingEkskul) {
      const updated = list.map(ek => ek.id === editingEkskul.id ? { ...ek, nama_kegiatan: form.nama_kegiatan, siswa_id: form.siswa_id, kelas_id: form.kelas_id, nilai, predikat: predikatVal, keterangan: form.keterangan || null } : ek);
      demoStore.setEkskul(updated);
      toast.success("Ekstrakurikuler berhasil diupdate");
    } else {
      list.push({
        nama_kegiatan: form.nama_kegiatan, siswa_id: form.siswa_id, kelas_id: form.kelas_id,
        nilai, predikat: predikatVal, keterangan: form.keterangan || null,
        id: demoStore.generateId(), semester: 1, tahun_pelajaran: "2024/2025",
        madrasah_id: "11111111-1111-1111-1111-111111111111",
        created_at: "", updated_at: "",
      } as Ekstrakurikuler);
      demoStore.setEkskul(list);
      toast.success("Ekstrakurikuler berhasil ditambahkan");
    }

    setShowForm(false);
    setEditingEkskul(null);
    setForm({ nama_kegiatan: "", siswa_id: "", kelas_id: "", nilai: "", keterangan: "" });
    fetchEkskul();
  };

  const handleEdit = (ekskul: Ekstrakurikuler) => {
    setEditingEkskul(ekskul);
    setForm({
      nama_kegiatan: ekskul.nama_kegiatan,
      siswa_id: ekskul.siswa_id,
      kelas_id: ekskul.kelas_id,
      nilai: ekskul.nilai !== null && ekskul.nilai !== undefined ? String(ekskul.nilai) : "",
      keterangan: ekskul.keterangan || "",
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    const list = demoStore.getEkskul().filter(ek => ek.id !== id);
    demoStore.setEkskul(list);
    toast.success("Data berhasil dihapus");
    fetchEkskul();
  };

  const getSiswaName = (id: string) => siswaList.find(s => s.id === id)?.nama || "-";

  const filtered = ekskulList.filter((ek) =>
    ek.nama_kegiatan.toLowerCase().includes(search.toLowerCase()) ||
    getSiswaName(ek.siswa_id).toLowerCase().includes(search.toLowerCase())
  );

  // Live predikat preview di form
  const livePredikat = nilaiToPredikat(parseNilai(form.nilai));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ekstrakurikuler</h1>
        <button onClick={() => { setShowForm(true); setEditingEkskul(null); setForm({ nama_kegiatan: "", siswa_id: "", kelas_id: "", nilai: "", keterangan: "" }); }} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Tambah Ekskul
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Cari ekskul atau siswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nama Ekskul</th>
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
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada data ekstrakurikuler</td></tr>
              ) : (
                filtered.map((ek, idx) => {
                  const pred = nilaiToPredikat(ek.nilai ?? null);
                  return (
                    <tr key={ek.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{ek.nama_kegiatan}</td>
                      <td className="px-4 py-3">{getSiswaName(ek.siswa_id)}</td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">{ek.nilai ?? "-"}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">{pred.label}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs">{(ek.keterangan || "-").substring(0, 50)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(ek)} className="text-blue-600 hover:text-blue-800"><Pencil size={16} /></button>
                          <button onClick={() => handleDelete(ek.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
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
              <h2 className="text-lg font-bold mb-4">{editingEkskul ? "Edit Ekskul" : "Tambah Ekskul"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ekstrakurikuler *</label>
                  <input type="text" value={form.nama_kegiatan} onChange={(e) => setForm({ ...form, nama_kegiatan: e.target.value })} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Pramuka, Tahfidz, dll" />
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
                    {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_rombel}</option>)}
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
                    value={PRESET_KETERANGAN_EKSTRAKURIKULER.includes(form.keterangan) ? form.keterangan : (form.keterangan ? "__custom__" : "")}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") return;
                      setForm({ ...form, keterangan: e.target.value });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none mb-2"
                  >
                    <option value="">-- Pilih preset / kosongkan untuk custom --</option>
                    {PRESET_KETERANGAN_EKSTRAKURIKULER.map(p => <option key={p} value={p}>{p}</option>)}
                    <option value="__custom__">[Custom — ketik manual di kotak bawah]</option>
                  </select>
                  <textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Keterangan kegiatan..." />
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
