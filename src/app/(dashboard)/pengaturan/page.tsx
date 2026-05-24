"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Database, Download, Upload, Shield } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function PengaturanPage() {
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const supabase = createClient();

  const backupAll = async () => {
    setBackingUp(true);
    try {
      const tables = ["madrasah", "guru", "siswa", "kelas", "mata_pelajaran", "capaian_pembelajaran", "tujuan_pembelajaran", "materi", "nilai", "deskripsi_rapor", "presensi", "ekstrakurikuler", "catatan_wali_kelas", "validasi_rapor"];

      const wb = XLSX.utils.book_new();

      for (const table of tables) {
        const { data } = await supabase.from(table).select("*");
        if (data && data.length > 0) {
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, ws, table.substring(0, 31)); // Excel max 31 chars
        }
      }

      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const date = new Date().toISOString().split("T")[0];
      saveAs(new Blob([buf], { type: "application/octet-stream" }), `backup-raport-${date}.xlsx`);
      toast.success("Backup berhasil diunduh");
    } catch {
      toast.error("Gagal membuat backup");
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("PERHATIAN: Restore akan menambahkan data dari file backup. Data yang sudah ada TIDAK akan dihapus. Lanjutkan?")) {
      e.target.value = "";
      return;
    }

    setRestoring(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);

      // Restore order matters due to foreign keys
      const restoreOrder = ["madrasah", "guru", "kelas", "siswa", "mata_pelajaran", "capaian_pembelajaran", "tujuan_pembelajaran", "materi", "nilai", "deskripsi_rapor", "presensi", "ekstrakurikuler", "catatan_wali_kelas", "validasi_rapor"];

      let totalRestored = 0;

      for (const table of restoreOrder) {
        const sheetName = wb.SheetNames.find((s) => s === table || s === table.substring(0, 31));
        if (!sheetName) continue;

        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws);

        if (rows.length > 0) {
          // Remove timestamps to let DB handle them
          const cleaned = (rows as Record<string, unknown>[]).map((row) => {
            const r = { ...row };
            delete r.created_at;
            delete r.updated_at;
            return r;
          });

          const { error } = await supabase.from(table).upsert(cleaned as Record<string, unknown>[], { onConflict: "id" });
          if (!error) totalRestored += cleaned.length;
        }
      }

      toast.success(`Restore selesai: ${totalRestored} record berhasil di-restore`);
    } catch {
      toast.error("Gagal membaca file backup");
    } finally {
      setRestoring(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pengaturan</h1>

      {/* Backup */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Database size={20} className="text-primary" /> Backup Data
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Download seluruh data aplikasi dalam format Excel. Backup mencakup semua tabel: madrasah, guru, siswa, kelas, mapel, CP/TP, nilai, deskripsi, presensi, ekstrakurikuler, catatan, dan validasi.
        </p>
        <button
          onClick={backupAll}
          disabled={backingUp}
          className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Download size={16} /> {backingUp ? "Membuat backup..." : "Download Backup"}
        </button>
      </div>

      {/* Restore */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Upload size={20} className="text-primary" /> Restore Data
        </h2>
        <p className="text-sm text-gray-500 mb-2">
          Upload file backup (.xlsx) untuk mengembalikan data. Data yang sudah ada akan di-update jika ID sama.
        </p>
        <p className="text-xs text-red-500 mb-4">
          ⚠️ Pastikan file yang diupload adalah file backup yang valid dari aplikasi ini.
        </p>
        {restoring && <p className="text-sm text-yellow-600 mb-3">⏳ Sedang merestore data...</p>}
        <label className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors cursor-pointer w-fit">
          <Upload size={16} /> {restoring ? "Merestore..." : "Upload File Backup"}
          <input type="file" accept=".xlsx,.xls" onChange={handleRestore} className="hidden" disabled={restoring} />
        </label>
      </div>

      {/* Info Keamanan */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Shield size={20} className="text-primary" /> Keamanan Data
        </h2>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Setiap madrasah hanya dapat melihat data madrasah sendiri (Row Level Security)</li>
          <li>• Guru hanya dapat melihat mapel dan kelas yang diajar</li>
          <li>• Wali kelas hanya dapat melihat kelasnya</li>
          <li>• Orang tua hanya dapat melihat raport anaknya</li>
          <li>• Admin dapat mengatur semua data madrasahnya</li>
          <li>• Super admin dapat melihat semua data</li>
          <li>• Raport yang sudah dikunci tidak dapat diedit kecuali dibuka oleh admin/kepala madrasah</li>
        </ul>
      </div>
    </div>
  );
}
