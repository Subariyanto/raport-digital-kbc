"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ImportExportPage() {
  const [importing, setImporting] = useState(false);
  const supabase = createClient();

  // ============ EXPORT FUNCTIONS ============

  const exportSiswa = async () => {
    const { data, error } = await supabase.from("siswa").select("nis, nisn, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, alamat, nama_ayah, nama_ibu, nama_wali, hp_ortu, jenjang, fase, status").order("nama");
    if (error) { toast.error("Gagal export siswa"); return; }
    const ws = XLSX.utils.json_to_sheet(data || []);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Siswa");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "data-siswa.xlsx");
    toast.success("Export siswa berhasil");
  };

  const exportGuru = async () => {
    const { data, error } = await supabase.from("guru").select("nama, nip_nuptk, jabatan, hp, email").order("nama");
    if (error) { toast.error("Gagal export guru"); return; }
    const ws = XLSX.utils.json_to_sheet(data || []);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Guru");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "data-guru.xlsx");
    toast.success("Export guru berhasil");
  };

  const exportNilai = async () => {
    const { data, error } = await supabase
      .from("nilai")
      .select("siswa:siswa_id(nama, nis), mata_pelajaran:mapel_id(nama), tujuan_pembelajaran:tp_id(kode), nilai_formatif, nilai_sumatif, nilai_proyek, nilai_akhir, predikat, catatan_formatif, semester, tahun_pelajaran")
      .order("siswa_id");
    if (error) { toast.error("Gagal export nilai"); return; }

    const formatted = (data || []).map((n: Record<string, unknown>) => ({
      nama_siswa: (n.siswa as { nama: string })?.nama || "",
      nis: (n.siswa as { nis: string })?.nis || "",
      mata_pelajaran: (n.mata_pelajaran as { nama: string })?.nama || "",
      tp_kode: (n.tujuan_pembelajaran as { kode: string })?.kode || "",
      nilai_formatif: n.nilai_formatif,
      nilai_sumatif: n.nilai_sumatif,
      nilai_proyek: n.nilai_proyek,
      nilai_akhir: n.nilai_akhir,
      predikat: n.predikat,
      catatan_formatif: n.catatan_formatif,
      semester: n.semester,
      tahun_pelajaran: n.tahun_pelajaran,
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nilai");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "data-nilai.xlsx");
    toast.success("Export nilai berhasil");
  };

  const exportRekapRaport = async () => {
    const { data, error } = await supabase
      .from("deskripsi_rapor")
      .select("siswa:siswa_id(nama, nis), mata_pelajaran:mapel_id(nama), metode, deskripsi_text, is_locked, semester, tahun_pelajaran")
      .order("siswa_id");
    if (error) { toast.error("Gagal export rekap"); return; }

    const formatted = (data || []).map((d: Record<string, unknown>) => ({
      nama_siswa: (d.siswa as { nama: string })?.nama || "",
      nis: (d.siswa as { nis: string })?.nis || "",
      mata_pelajaran: (d.mata_pelajaran as { nama: string })?.nama || "",
      metode: d.metode,
      deskripsi: d.deskripsi_text,
      dikunci: d.is_locked ? "Ya" : "Tidak",
      semester: d.semester,
      tahun_pelajaran: d.tahun_pelajaran,
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Raport");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "rekap-raport.xlsx");
    toast.success("Export rekap raport berhasil");
  };

  // ============ IMPORT FUNCTIONS ============

  const handleImportSiswa = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("User tidak ditemukan"); return; }
      const { data: userData } = await supabase.from("users").select("madrasah_id").eq("id", user.id).single();

      let success = 0;
      let failed = 0;

      for (const row of rows) {
        const { error } = await supabase.from("siswa").insert({
          nis: row.nis || "",
          nisn: row.nisn || null,
          nama: row.nama || "",
          tempat_lahir: row.tempat_lahir || null,
          tanggal_lahir: row.tanggal_lahir || null,
          jenis_kelamin: row.jenis_kelamin || "L",
          agama: row.agama || "Islam",
          alamat: row.alamat || null,
          nama_ayah: row.nama_ayah || null,
          nama_ibu: row.nama_ibu || null,
          nama_wali: row.nama_wali || null,
          hp_ortu: row.hp_ortu || null,
          jenjang: row.jenjang || "MI",
          fase: row.fase || "B",
          status: "aktif",
          madrasah_id: userData?.madrasah_id,
        });
        if (error) failed++;
        else success++;
      }

      toast.success(`Import selesai: ${success} berhasil, ${failed} gagal`);
    } catch {
      toast.error("Gagal membaca file Excel");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleImportGuru = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("User tidak ditemukan"); return; }
      const { data: userData } = await supabase.from("users").select("madrasah_id").eq("id", user.id).single();

      let success = 0;
      let failed = 0;

      for (const row of rows) {
        const { error } = await supabase.from("guru").insert({
          nama: row.nama || "",
          nip_nuptk: row.nip_nuptk || null,
          jabatan: row.jabatan || null,
          hp: row.hp || null,
          email: row.email || null,
          madrasah_id: userData?.madrasah_id,
        });
        if (error) failed++;
        else success++;
      }

      toast.success(`Import selesai: ${success} berhasil, ${failed} gagal`);
    } catch {
      toast.error("Gagal membaca file Excel");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  // ============ DOWNLOAD TEMPLATE ============

  const downloadTemplate = (type: "siswa" | "guru") => {
    let headers: string[];
    if (type === "siswa") {
      headers = ["nis", "nisn", "nama", "tempat_lahir", "tanggal_lahir", "jenis_kelamin", "agama", "alamat", "nama_ayah", "nama_ibu", "nama_wali", "hp_ortu", "jenjang", "fase"];
    } else {
      headers = ["nama", "nip_nuptk", "jabatan", "hp", "email"];
    }

    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type === "siswa" ? "Siswa" : "Guru");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `template-${type}.xlsx`);
    toast.success(`Template ${type} berhasil diunduh`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Import & Export Data</h1>

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Download size={20} className="text-primary" /> Export Data ke Excel
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button onClick={exportSiswa} className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors border border-green-200">
            <FileSpreadsheet size={18} /> Export Siswa
          </button>
          <button onClick={exportGuru} className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors border border-blue-200">
            <FileSpreadsheet size={18} /> Export Guru
          </button>
          <button onClick={exportNilai} className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors border border-purple-200">
            <FileSpreadsheet size={18} /> Export Nilai
          </button>
          <button onClick={exportRekapRaport} className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors border border-orange-200">
            <FileSpreadsheet size={18} /> Export Rekap Raport
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload size={20} className="text-primary" /> Import Data dari Excel
        </h2>
        {importing && <p className="text-sm text-yellow-600 mb-3">⏳ Sedang mengimport data...</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Import Data Siswa</h3>
            <p className="text-xs text-gray-500 mb-3">Format: nis, nisn, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, alamat, nama_ayah, nama_ibu, nama_wali, hp_ortu, jenjang, fase</p>
            <label className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer w-fit">
              <Upload size={16} /> Pilih File
              <input type="file" accept=".xlsx,.xls" onChange={handleImportSiswa} className="hidden" />
            </label>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Import Data Guru</h3>
            <p className="text-xs text-gray-500 mb-3">Format: nama, nip_nuptk, jabatan, hp, email</p>
            <label className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer w-fit">
              <Upload size={16} /> Pilih File
              <input type="file" accept=".xlsx,.xls" onChange={handleImportGuru} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Template Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileSpreadsheet size={20} className="text-primary" /> Download Template Excel
        </h2>
        <p className="text-sm text-gray-500 mb-4">Download template kosong untuk memudahkan import data.</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => downloadTemplate("siswa")} className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border">
            <Download size={16} /> Template Siswa
          </button>
          <button onClick={() => downloadTemplate("guru")} className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border">
            <Download size={16} /> Template Guru
          </button>
        </div>
      </div>
    </div>
  );
}
