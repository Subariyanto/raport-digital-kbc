"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Madrasah } from "@/lib/types";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

export default function MadrasahPage() {
  const [madrasah, setMadrasah] = useState<Madrasah | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama: "", nsm: "", npsn: "", alamat: "", desa: "", kecamatan: "",
    kabupaten: "", provinsi: "", kepala_madrasah: "", nip_kepala: "",
    tahun_pelajaran: "2024/2025", semester: 1,
  });

  const supabase = createClient();

  const fetchMadrasah = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from("users").select("madrasah_id").eq("id", user.id).single();
    if (userData?.madrasah_id) {
      const { data } = await supabase.from("madrasah").select("*").eq("id", userData.madrasah_id).single();
      if (data) {
        setMadrasah(data);
        setForm({
          nama: data.nama || "", nsm: data.nsm || "", npsn: data.npsn || "",
          alamat: data.alamat || "", desa: data.desa || "", kecamatan: data.kecamatan || "",
          kabupaten: data.kabupaten || "", provinsi: data.provinsi || "",
          kepala_madrasah: data.kepala_madrasah || "", nip_kepala: data.nip_kepala || "",
          tahun_pelajaran: data.tahun_pelajaran || "2024/2025", semester: data.semester || 1,
        });
      }
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchMadrasah(); }, [fetchMadrasah]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!madrasah) return;
    setSaving(true);
    const { error } = await supabase.from("madrasah").update({ ...form, semester: Number(form.semester) }).eq("id", madrasah.id);
    if (error) toast.error("Gagal menyimpan data madrasah");
    else toast.success("Data madrasah berhasil disimpan");
    setSaving(false);
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Memuat...</div>;
  if (!madrasah) return <div className="text-center py-12 text-gray-400">Data madrasah belum tersedia</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Data Madrasah</h1>
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
