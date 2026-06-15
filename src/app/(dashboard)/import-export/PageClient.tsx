"use client";

import { useState } from "react";
import { demoStore } from "@/lib/demo-store";
import { Auth } from "@/lib/auth";
import toast from "react-hot-toast";
import { Download, Upload } from "lucide-react";

export default function ImportExportPage() {
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    const cur = Auth.current();
    if (cur && cur.tier === "trial") {
      toast.error("Export Data hanya tersedia untuk akun FULL. Cetak Preview (Ctrl+P) tetap bisa dengan watermark TRIAL.");
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
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raport-digital-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data berhasil diexport!");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.madrasah) demoStore.setMadrasah(data.madrasah);
        if (data.guru) demoStore.setGuru(data.guru);
        if (data.siswa) demoStore.setSiswa(data.siswa);
        if (data.kelas) demoStore.setKelas(data.kelas);
        if (data.mapel) demoStore.setMapel(data.mapel);
        if (data.cp) demoStore.setCP(data.cp);
        if (data.tp) demoStore.setTP(data.tp);
        if (data.nilai) demoStore.setNilai(data.nilai);
        if (data.deskripsi) demoStore.setDeskripsi(data.deskripsi);
        if (data.presensi) demoStore.setPresensi(data.presensi);
        if (data.ekskul) demoStore.setEkskul(data.ekskul);
        if (data.catatan) demoStore.setCatatan(data.catatan);
        toast.success("Data berhasil diimport!");
      } catch {
        toast.error("File tidak valid. Pastikan format JSON yang benar.");
      }
      setImporting(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Import / Export Data</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Download size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Export Data</h2>
              <p className="text-sm text-gray-500">Download semua data dalam format JSON</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Export akan mengunduh semua data termasuk: madrasah, guru, siswa, kelas, mata pelajaran, CP/TP, nilai, deskripsi, presensi, ekstrakurikuler, dan catatan wali kelas.
          </p>
          <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Download size={16} /> Export Semua Data
          </button>
        </div>

        {/* Import */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Import Data</h2>
              <p className="text-sm text-gray-500">Upload file JSON untuk restore data</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Import akan menimpa semua data yang ada dengan data dari file. Pastikan file yang diupload adalah hasil export dari aplikasi ini.
          </p>
          <label className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer inline-flex ${importing ? "opacity-50" : ""}`}>
            <Upload size={16} /> {importing ? "Mengimport..." : "Pilih File JSON"}
            <input type="file" accept=".json" onChange={handleImport} className="hidden" disabled={importing} />
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-800">
          <strong>Catatan:</strong> Data disimpan di browser (localStorage). Jika Anda menghapus data browser atau menggunakan browser berbeda, data akan hilang. Gunakan fitur Export untuk backup data secara berkala.
        </p>
      </div>
    </div>
  );
}
