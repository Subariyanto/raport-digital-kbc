"use client";

import { useState, useEffect } from "react";
import { demoStore } from "@/lib/demo-store";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface ValidationItem {
  label: string;
  status: "ok" | "warning" | "error";
  message: string;
}

export default function ValidasiRaporPage() {
  const [items, setItems] = useState<ValidationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const results: ValidationItem[] = [];

    // Check madrasah
    const m = demoStore.getMadrasah();
    if (m.nama && m.kepala_madrasah) {
      results.push({ label: "Data Madrasah", status: "ok", message: "Data madrasah lengkap" });
    } else {
      results.push({ label: "Data Madrasah", status: "error", message: "Data madrasah belum lengkap" });
    }

    // Check guru
    const guru = demoStore.getGuru();
    if (guru.length > 0) {
      results.push({ label: "Data Guru", status: "ok", message: `${guru.length} guru terdaftar` });
    } else {
      results.push({ label: "Data Guru", status: "error", message: "Belum ada data guru" });
    }

    // Check siswa
    const siswa = demoStore.getSiswa();
    if (siswa.length > 0) {
      results.push({ label: "Data Siswa", status: "ok", message: `${siswa.length} siswa terdaftar` });
    } else {
      results.push({ label: "Data Siswa", status: "error", message: "Belum ada data siswa" });
    }

    // Check kelas
    const kelas = demoStore.getKelas();
    if (kelas.length > 0) {
      results.push({ label: "Data Kelas", status: "ok", message: `${kelas.length} kelas terdaftar` });
    } else {
      results.push({ label: "Data Kelas", status: "error", message: "Belum ada data kelas" });
    }

    // Check mapel
    const mapel = demoStore.getMapel();
    if (mapel.length > 0) {
      results.push({ label: "Mata Pelajaran", status: "ok", message: `${mapel.length} mapel terdaftar` });
    } else {
      results.push({ label: "Mata Pelajaran", status: "error", message: "Belum ada mata pelajaran" });
    }

    // Check CP/TP
    const cp = demoStore.getCP();
    const tp = demoStore.getTP();
    if (cp.length > 0 && tp.length > 0) {
      results.push({ label: "CP & TP", status: "ok", message: `${cp.length} CP, ${tp.length} TP` });
    } else {
      results.push({ label: "CP & TP", status: "warning", message: "CP/TP belum lengkap" });
    }

    // Check nilai
    const nilai = demoStore.getNilai();
    if (nilai.length > 0) {
      results.push({ label: "Nilai", status: "ok", message: `${nilai.length} entri nilai` });
    } else {
      results.push({ label: "Nilai", status: "warning", message: "Belum ada nilai yang diinput" });
    }

    // Check deskripsi
    const deskripsi = demoStore.getDeskripsi();
    if (deskripsi.length > 0) {
      results.push({ label: "Deskripsi Raport", status: "ok", message: `${deskripsi.length} deskripsi tersedia` });
    } else {
      results.push({ label: "Deskripsi Raport", status: "warning", message: "Belum ada deskripsi yang digenerate" });
    }

    // Check presensi
    const presensi = demoStore.getPresensi();
    if (presensi.length > 0) {
      results.push({ label: "Presensi", status: "ok", message: `${presensi.length} data presensi` });
    } else {
      results.push({ label: "Presensi", status: "warning", message: "Belum ada data presensi" });
    }

    // Check ekskul
    const ekskul = demoStore.getEkskul();
    if (ekskul.length > 0) {
      results.push({ label: "Ekstrakurikuler", status: "ok", message: `${ekskul.length} data ekskul` });
    } else {
      results.push({ label: "Ekstrakurikuler", status: "warning", message: "Belum ada data ekskul" });
    }

    setItems(results);
    setLoading(false);
  }, []);

  const okCount = items.filter(i => i.status === "ok").length;
  const warnCount = items.filter(i => i.status === "warning").length;
  const errCount = items.filter(i => i.status === "error").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Validasi Raport</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat...</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{okCount}</p>
              <p className="text-sm text-green-600">Lengkap</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-700">{warnCount}</p>
              <p className="text-sm text-yellow-600">Peringatan</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{errCount}</p>
              <p className="text-sm text-red-600">Belum Lengkap</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="divide-y">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-3">
                  {item.status === "ok" && <CheckCircle size={20} className="text-green-500 flex-shrink-0" />}
                  {item.status === "warning" && <AlertCircle size={20} className="text-yellow-500 flex-shrink-0" />}
                  {item.status === "error" && <XCircle size={20} className="text-red-500 flex-shrink-0" />}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
