"use client";

import { useState, useEffect, useCallback } from "react";
import { demoStore } from "@/lib/demo-store";
import { CapaianPembelajaran, TujuanPembelajaran, MataPelajaran } from "@/lib/types";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

export default function CpTpPage() {
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [selectedMapel, setSelectedMapel] = useState("");
  const [selectedFase, setSelectedFase] = useState("B");
  const [cpList, setCpList] = useState<(CapaianPembelajaran & { tujuan_pembelajaran: TujuanPembelajaran[] })[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCp, setExpandedCp] = useState<string[]>([]);

  const [showCpForm, setShowCpForm] = useState(false);
  const [showTpForm, setShowTpForm] = useState(false);
  const [editingCp, setEditingCp] = useState<CapaianPembelajaran | null>(null);
  const [editingTp, setEditingTp] = useState<TujuanPembelajaran | null>(null);
  const [cpForm, setCpForm] = useState({ deskripsi: "" });
  const [tpForm, setTpForm] = useState({ kode: "", deskripsi: "", urutan: 1, cp_id: "" });

  useEffect(() => { setMapelList(demoStore.getMapel()); }, []);

  const fetchCpTp = useCallback(() => {
    if (!selectedMapel) return;
    setLoading(true);
    const allCp = demoStore.getCP().filter(cp => cp.mapel_id === selectedMapel && cp.fase === selectedFase);
    const allTp = demoStore.getTP();
    const result = allCp.map(cp => ({
      ...cp,
      tujuan_pembelajaran: allTp.filter(tp => tp.cp_id === cp.id).sort((a, b) => a.urutan - b.urutan),
    }));
    setCpList(result);
    setLoading(false);
  }, [selectedMapel, selectedFase]);

  useEffect(() => { fetchCpTp(); }, [fetchCpTp]);

  const toggleExpand = (cpId: string) => {
    setExpandedCp((prev) => prev.includes(cpId) ? prev.filter((id) => id !== cpId) : [...prev, cpId]);
  };

  const handleSaveCp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpForm.deskripsi.trim()) { toast.error("Deskripsi CP wajib diisi"); return; }

    const list = demoStore.getCP();
    if (editingCp) {
      const updated = list.map(cp => cp.id === editingCp.id ? { ...cp, deskripsi: cpForm.deskripsi } : cp);
      demoStore.setCP(updated);
      toast.success("CP berhasil diupdate");
    } else {
      list.push({ id: demoStore.generateId(), mapel_id: selectedMapel, fase: selectedFase, jenjang: null, deskripsi: cpForm.deskripsi, created_at: "", updated_at: "" });
      demoStore.setCP(list);
      toast.success("CP berhasil ditambahkan");
    }
    setShowCpForm(false);
    setEditingCp(null);
    setCpForm({ deskripsi: "" });
    fetchCpTp();
  };

  const handleDeleteCp = (id: string) => {
    if (!confirm("Hapus CP ini beserta semua TP-nya?")) return;
    demoStore.setCP(demoStore.getCP().filter(cp => cp.id !== id));
    demoStore.setTP(demoStore.getTP().filter(tp => tp.cp_id !== id));
    toast.success("CP berhasil dihapus");
    fetchCpTp();
  };

  const handleSaveTp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tpForm.kode.trim() || !tpForm.deskripsi.trim()) { toast.error("Kode dan deskripsi TP wajib diisi"); return; }

    const list = demoStore.getTP();
    if (editingTp) {
      const updated = list.map(tp => tp.id === editingTp.id ? { ...tp, kode: tpForm.kode, deskripsi: tpForm.deskripsi, urutan: tpForm.urutan } : tp);
      demoStore.setTP(updated);
      toast.success("TP berhasil diupdate");
    } else {
      list.push({ id: demoStore.generateId(), cp_id: tpForm.cp_id, kode: tpForm.kode, deskripsi: tpForm.deskripsi, urutan: tpForm.urutan, created_at: "", updated_at: "" });
      demoStore.setTP(list);
      toast.success("TP berhasil ditambahkan");
    }
    setShowTpForm(false);
    setEditingTp(null);
    setTpForm({ kode: "", deskripsi: "", urutan: 1, cp_id: "" });
    fetchCpTp();
  };

  const handleDeleteTp = (id: string) => {
    if (!confirm("Hapus TP ini?")) return;
    demoStore.setTP(demoStore.getTP().filter(tp => tp.id !== id));
    toast.success("TP berhasil dihapus");
    fetchCpTp();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Capaian Pembelajaran & Tujuan Pembelajaran</h1>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
            <select value={selectedMapel} onChange={(e) => setSelectedMapel(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Pilih Mapel --</option>
              {mapelList.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
            <select value={selectedFase} onChange={(e) => setSelectedFase(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="Fondasi">Fondasi (RA)</option>
              <option value="A">Fase A</option>
              <option value="B">Fase B</option>
              <option value="C">Fase C</option>
              <option value="D">Fase D</option>
              <option value="E">Fase E</option>
              <option value="F">Fase F</option>
            </select>
          </div>
          <div className="flex items-end">
            {selectedMapel && (
              <button onClick={() => { setShowCpForm(true); setEditingCp(null); setCpForm({ deskripsi: "" }); }} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Plus size={16} /> Tambah CP
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : !selectedMapel ? (
        <div className="text-center py-12 text-gray-400">Pilih mata pelajaran untuk melihat CP/TP</div>
      ) : cpList.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Belum ada Capaian Pembelajaran untuk mapel dan fase ini</div>
      ) : (
        <div className="space-y-3">
          {cpList.map((cp) => (
            <div key={cp.id} className="bg-white rounded-xl shadow-sm border">
              <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => toggleExpand(cp.id)}>
                <span className="mt-1 text-gray-400">
                  {expandedCp.includes(cp.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{cp.deskripsi}</p>
                  <p className="text-xs text-gray-500 mt-1">{cp.tujuan_pembelajaran?.length || 0} Tujuan Pembelajaran</p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setEditingCp(cp); setCpForm({ deskripsi: cp.deskripsi }); setShowCpForm(true); }} className="text-blue-600 hover:text-blue-800"><Pencil size={14} /></button>
                  <button onClick={() => handleDeleteCp(cp.id)} className="text-red-600 hover:text-red-800"><Trash2 size={14} /></button>
                </div>
              </div>

              {expandedCp.includes(cp.id) && (
                <div className="border-t px-4 pb-4">
                  <div className="mt-3 space-y-2">
                    {(cp.tujuan_pembelajaran || []).map((tp) => (
                      <div key={tp.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                        <span className="text-xs font-mono font-bold text-primary bg-primary-50 px-2 py-0.5 rounded">{tp.kode}</span>
                        <p className="flex-1 text-sm text-gray-700">{tp.deskripsi}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditingTp(tp); setTpForm({ kode: tp.kode, deskripsi: tp.deskripsi, urutan: tp.urutan, cp_id: tp.cp_id }); setShowTpForm(true); }} className="text-blue-600 hover:text-blue-800"><Pencil size={12} /></button>
                          <button onClick={() => handleDeleteTp(tp.id)} className="text-red-600 hover:text-red-800"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setTpForm({ kode: "", deskripsi: "", urutan: (cp.tujuan_pembelajaran?.length || 0) + 1, cp_id: cp.id }); setEditingTp(null); setShowTpForm(true); }} className="mt-3 flex items-center gap-1 text-xs text-primary hover:text-primary-800 font-medium">
                    <Plus size={12} /> Tambah TP
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCpForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editingCp ? "Edit CP" : "Tambah Capaian Pembelajaran"}</h2>
              <form onSubmit={handleSaveCp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Capaian Pembelajaran *</label>
                  <textarea value={cpForm.deskripsi} onChange={(e) => setCpForm({ deskripsi: e.target.value })} rows={4} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Tuliskan deskripsi CP..." />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-800 text-white py-2 rounded-lg font-medium transition-colors">{editingCp ? "Update" : "Simpan"}</button>
                  <button type="button" onClick={() => { setShowCpForm(false); setEditingCp(null); }} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors">Batal</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showTpForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editingTp ? "Edit TP" : "Tambah Tujuan Pembelajaran"}</h2>
              <form onSubmit={handleSaveTp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode TP *</label>
                    <input type="text" value={tpForm.kode} onChange={(e) => setTpForm({ ...tpForm, kode: e.target.value })} required placeholder="TP.1" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Urutan</label>
                    <input type="number" min={1} value={tpForm.urutan} onChange={(e) => setTpForm({ ...tpForm, urutan: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi TP *</label>
                  <textarea value={tpForm.deskripsi} onChange={(e) => setTpForm({ ...tpForm, deskripsi: e.target.value })} rows={3} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Tuliskan deskripsi TP..." />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-800 text-white py-2 rounded-lg font-medium transition-colors">{editingTp ? "Update" : "Simpan"}</button>
                  <button type="button" onClick={() => { setShowTpForm(false); setEditingTp(null); }} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors">Batal</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
