"use client";

import { useState, useEffect } from "react";
import { demoStore } from "@/lib/demo-store";
import { Madrasah } from "@/lib/types";
import toast from "react-hot-toast";
import { Save, BookmarkPlus, Trash2 } from "lucide-react";

export default function MadrasahPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasSample, setHasSample] = useState(false);
  const [form, setForm] = useState({
    nama: "", nsm: "", npsn: "", alamat: "", desa: "", kecamatan: "",
    kabupaten: "", provinsi: "", kepala_madrasah: "", nip_kepala: "",
    tahun_pelajaran: "2024/2025", semester: 1,
  });

  const refreshHasSample = () => {
    setHasSample(!!demoStore.getMadrasahDefaultSample());
  };

  useEffect(() => {
    const m = demoStore.getMadrasah();
    setForm({
      nama: m.nama || "", nsm: m.nsm || "", npsn: m.npsn || "",
      alamat: m.alamat || "", desa: m.desa || "", kecamatan: m.kecamatan || "",
      kabupaten: m.kabupaten || "", provinsi: m.provinsi || "",
      kepala_madrasah: m.kepala_madrasah || "", nip_kepala: m.nip_kepala || "",
      tahun_pelajaran: m.tahun_pelajaran || "2024/2025", semester: m.semester || 1,
    });
    refreshHasSample();
    setLoading(false);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const m = demoStore.getMadrasah();
    demoStore.setMadrasah({ ...m, ...form, semester: Number(form.semester) } as Madrasah);
    toast.success("Data madrasah berhasil disimpan");
    setSaving(false);
  };

  const handleSetAsSample = () => {
    if (!form.nama.trim()) {
      toast.error("Isi minimal Nama Madrasah dulu sebelum dijadikan sampel default");
      return;
    }
    const ok = confirm(
      "Jadikan data madrasah saat ini sebagai SAMPEL DEFAULT?\n\n" +
      "Sampel default akan dipakai otomatis ketika data madrasah dikosongkan, " +
      "atau saat user lain login pertama kali tanpa data."
    );
    if (!ok) return;
    const m = demoStore.getMadrasah();
    const ok2 = demoStore.setMadrasahDefaultSample({ ...m, ...form, semester: Number(form.semester) } as Madrasah);
    if (ok2) {
      toast.success("Data ini disimpan sebagai sampel default");
      refreshHasSample();
    }
  };

  const handleClear = () => {
    const willRestoreSample = !!demoStore.getMadrasahDefaultSample();
    const msg = willRestoreSample
      ? "Kosongkan data madrasah?\n\nData akan dikembalikan ke SAMPEL DEFAULT yang sudah disimpan."
      : "Kosongkan SEMUA isian data madrasah?\n\nTidak ada sampel default tersimpan, jadi form akan benar-benar kosong.";
    const ok = confirm(msg);
    if (!ok) return;
    const restored = demoStore.resetMadrasah();
    if (!restored) return;
    setForm({
      nama: restored.nama || "", nsm: restored.nsm || "", npsn: restored.npsn || "",
      alamat: restored.alamat || "", desa: restored.desa || "", kecamatan: restored.kecamatan || "",
      kabupaten: restored.kabupaten || "", provinsi: restored.provinsi || "",
      kepala_madrasah: restored.kepala_madrasah || "", nip_kepala: restored.nip_kepala || "",
      tahun_pelajaran: restored.tahun_pelajaran || "2024/2025", semester: restored.semester || 1,
    });
    toast.success(willRestoreSample ? "Data dikembalikan ke sampel default" : "Data madrasah dikosongkan");
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Memuat...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Madrasah</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSetAsSample}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            title="Simpan data sekarang sebagai sampel default (dipakai saat data dikosongkan / user baru)"
          >
            <BookmarkPlus size={16} /> Jadikan Sampel Default
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            title="Kosongkan data madrasah (atau kembalikan ke sampel default kalau ada)"
          >
            <Trash2 size={16} /> Kosongkan Data
          </button>
        </div>
      </div>

      {hasSample && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-3 py-2 mb-4">
          ✓ Sampel default tersimpan. Saat data madrasah dikosongkan atau user baru login, form otomatis ter-isi dari sampel ini.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Madrasah</label>
              <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NSM</label>
              <input type="text" value={form.nsm} onChange={(e) => setForm({ ...form, nsm: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NPSN</label>
              <input type="text" value={form.npsn} onChange={(e) => setForm({ ...form, npsn: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <input type="text" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desa/Kelurahan</label>
              <input type="text" value={form.desa} onChange={(e) => setForm({ ...form, desa: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
              <input type="text" value={form.kecamatan} onChange={(e) => setForm({ ...form, kecamatan: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten/Kota</label>
              <input type="text" value={form.kabupaten} onChange={(e) => setForm({ ...form, kabupaten: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
              <input type="text" value={form.provinsi} onChange={(e) => setForm({ ...form, provinsi: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kepala Madrasah</label>
              <input type="text" value={form.kepala_madrasah} onChange={(e) => setForm({ ...form, kepala_madrasah: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIP Kepala Madrasah</label>
              <input type="text" value={form.nip_kepala} onChange={(e) => setForm({ ...form, nip_kepala: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
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
          <div className="pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
              <Save size={16} /> {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
