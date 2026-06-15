"use client";

import { useState } from "react";
import { demoStore } from "@/lib/demo-store";
import { Auth } from "@/lib/auth";
import toast from "react-hot-toast";
import { Download, Trash2, RefreshCw } from "lucide-react";

export default function PengaturanPage() {
  const [resetting, setResetting] = useState(false);

  const handleBackup = () => {
    const cur = Auth.current();
    if (cur && cur.tier === "trial") {
      toast.error("Backup Data hanya tersedia untuk akun FULL. Cetak Preview (Ctrl+P) tetap bisa dengan watermark TRIAL.");
      return;
    }
    const data = {
      madrasah: demoStore.getMadrasah(),
      guru: demoStore.getGuru(),
      siswa: demoStore.getSiswa(),
      kelas: demoStore.getKelas(),
      mapel: demoStore.getMapel(),
      cp: demoStore.getCP(),
      tp: demoStore.getTP(),
      nilai: demoStore.getNilai(),
      deskripsi: demoStore.getDeskripsi(),
      presensi: demoStore.getPresensi(),
      ekskul: demoStore.getEkskul(),
      catatan: demoStore.getCatatan(),
      backupAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-raport-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup berhasil didownload!");
  };

  const handleReset = () => {
    if (!confirm("PERINGATAN: Semua data akan dihapus dan dikembalikan ke data awal. Lanjutkan?")) return;
    if (!confirm("Apakah Anda sudah backup data? Tindakan ini tidak bisa dibatalkan.")) return;

    setResetting(true);
    // Clear all localStorage keys
    const keys = ["rdm_madrasah", "rdm_guru", "rdm_siswa", "rdm_kelas", "rdm_mapel", "rdm_cp", "rdm_tp", "rdm_nilai", "rdm_deskripsi", "rdm_presensi", "rdm_ekskul", "rdm_catatan"];
    keys.forEach(key => localStorage.removeItem(key));
    toast.success("Data berhasil direset ke default");
    setResetting(false);
    // Reload to reinitialize
    window.location.reload();
  };

  const getStorageSize = () => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("rdm_")) {
        total += (localStorage.getItem(key) || "").length;
      }
    }
    return (total / 1024).toFixed(1);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pengaturan</h1>

      <div className="space-y-6">
        {/* Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-bold text-gray-900 mb-3">Informasi Aplikasi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Versi</span>
              <span className="font-medium">1.0.0 (Demo)</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Mode</span>
              <span className="font-medium text-green-600">Offline / LocalStorage</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Penyimpanan</span>
              <span className="font-medium">{getStorageSize()} KB</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Kurikulum</span>
              <span className="font-medium">KBC Kemenag 2025</span>
            </div>
          </div>
        </div>

        {/* Backup */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-bold text-gray-900 mb-3">Backup Data</h2>
          <p className="text-sm text-gray-600 mb-4">
            Download backup semua data dalam format JSON. Simpan file ini di tempat yang aman.
          </p>
          <button onClick={handleBackup} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Download size={16} /> Download Backup
          </button>
        </div>

        {/* Reset */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <h2 className="font-bold text-red-700 mb-3">Reset Data</h2>
          <p className="text-sm text-gray-600 mb-4">
            Menghapus semua data dan mengembalikan ke data contoh awal. Pastikan Anda sudah backup data sebelum melakukan reset.
          </p>
          <button onClick={handleReset} disabled={resetting} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            <RefreshCw size={16} /> {resetting ? "Mereset..." : "Reset ke Default"}
          </button>
        </div>
      </div>
    </div>
  );
}
