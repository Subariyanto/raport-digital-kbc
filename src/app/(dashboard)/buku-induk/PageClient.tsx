"use client";

import { useState, useEffect, useCallback } from "react";
import { demoStore } from "@/lib/demo-store";
import toast from "react-hot-toast";
import { Search, Printer, User } from "lucide-react";

interface SiswaDetail {
  id: string;
  nis: string;
  nisn: string;
  nama: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  agama: string;
  alamat: string;
  foto_url?: string | null;
  // Ayah
  nama_ayah: string;
  ttl_ayah?: string;
  agama_ayah?: string;
  kewarganegaraan_ayah?: string;
  pendidikan_ayah?: string;
  pekerjaan_ayah?: string;
  alamat_ayah?: string;
  // Ibu
  nama_ibu: string;
  ttl_ibu?: string;
  agama_ibu?: string;
  kewarganegaraan_ibu?: string;
  pendidikan_ibu?: string;
  pekerjaan_ibu?: string;
  alamat_ibu?: string;
  // Wali
  nama_wali: string | null;
  ttl_wali?: string;
  agama_wali?: string;
  kewarganegaraan_wali?: string;
  pendidikan_wali?: string;
  pekerjaan_wali?: string;
  alamat_wali?: string;
  hubungan_wali?: string;
  hp_ortu: string;
  jenjang: string;
  fase: string;
  status: string;
  kelas_id: string | null;
}

const Row = ({ label, value }: { label: string; value: any }) => (
  <div className="flex">
    <span className="w-44 text-gray-500 shrink-0">{label}</span>
    <span className="font-medium">: {value || "-"}</span>
  </div>
);

export default function BukuIndukPage() {
  const [siswaList, setSiswaList] = useState<SiswaDetail[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaDetail | null>(null);
  const [filterKelas, setFilterKelas] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    setSiswaList(demoStore.getSiswa() as any[]);
    setKelasList(demoStore.getKelas());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredSiswa = siswaList.filter(s => {
    const matchSearch = s.nama.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search) || (s.nisn || "").includes(search);
    const matchKelas = !filterKelas || s.kelas_id === filterKelas;
    return matchSearch && matchKelas;
  });

  const getKelasName = (kelasId: string | null) => {
    if (!kelasId) return "-";
    const kelas = kelasList.find(k => k.id === kelasId);
    return kelas ? kelas.nama_rombel : "-";
  };

  const handlePrint = () => {
    if (!selectedSiswa) return;
    window.print();
  };

  const handleUploadFoto = async (file: File) => {
    if (!selectedSiswa) return;
    if (file.size > 800 * 1024) {
      toast.error("Ukuran foto maksimal 800 KB. Kompres dulu lalu upload ulang.");
      return;
    }
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onerror = () => rej(r.error);
      r.onload = () => res(r.result as string);
      r.readAsDataURL(file);
    });
    const all = demoStore.getSiswa();
    const updated = all.map((s: any) => s.id === selectedSiswa.id ? { ...s, foto_url: dataUrl } : s);
    demoStore.setSiswa(updated as any);
    setSelectedSiswa({ ...selectedSiswa, foto_url: dataUrl });
    setSiswaList(updated as any);
    toast.success("Foto siswa disimpan");
  };

  const handleHapusFoto = () => {
    if (!selectedSiswa) return;
    if (!confirm("Hapus foto siswa ini?")) return;
    const all = demoStore.getSiswa();
    const updated = all.map((s: any) => s.id === selectedSiswa.id ? { ...s, foto_url: null } : s);
    demoStore.setSiswa(updated as any);
    setSelectedSiswa({ ...selectedSiswa, foto_url: null });
    setSiswaList(updated as any);
    toast.success("Foto siswa dihapus");
  };

  if (selectedSiswa) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button onClick={() => setSelectedSiswa(null)} className="text-green-700 hover:text-green-900 font-medium">
            ← Kembali ke Daftar
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800">
            <Printer size={16} />
            Cetak
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none raport-print-area">
          <div className="text-center mb-6 border-b pb-4">
            <h1 className="text-xl font-bold text-gray-800">BUKU INDUK SISWA</h1>
            <p className="text-sm text-gray-500">Format Standar NISN</p>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-24 h-32 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
              {selectedSiswa.foto_url ? (
                <img src={selectedSiswa.foto_url} alt={`Foto ${selectedSiswa.nama}`} className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800">{selectedSiswa.nama}</h2>
              <p className="text-sm text-gray-500">NIS: {selectedSiswa.nis} | NISN: {selectedSiswa.nisn || "-"}</p>
              <p className="text-sm text-gray-500">Kelas: {getKelasName(selectedSiswa.kelas_id)}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${selectedSiswa.status === "aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {selectedSiswa.status}
              </span>
              <div className="mt-2 flex flex-wrap gap-2 print:hidden">
                <label className="flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer">
                  {selectedSiswa.foto_url ? "Ganti Foto" : "Upload Foto"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadFoto(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                {selectedSiswa.foto_url && (
                  <button
                    type="button"
                    onClick={handleHapusFoto}
                    className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    Hapus Foto
                  </button>
                )}
                <span className="text-[10px] text-gray-400 self-center">Format JPG/PNG, maks 800 KB</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* A. Identitas Siswa */}
            <section>
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 border-b border-green-200 pb-1">A. Identitas Siswa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <Row label="Nama Lengkap" value={selectedSiswa.nama} />
                <Row label="NIS" value={selectedSiswa.nis} />
                <Row label="NISN" value={selectedSiswa.nisn} />
                <Row label="Tempat, Tgl Lahir" value={`${selectedSiswa.tempat_lahir || "-"}, ${selectedSiswa.tanggal_lahir || "-"}`} />
                <Row label="Jenis Kelamin" value={selectedSiswa.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} />
                <Row label="Agama" value={selectedSiswa.agama} />
                <Row label="No. HP Orang Tua" value={selectedSiswa.hp_ortu} />
                <div className="md:col-span-2"><Row label="Alamat Tempat Tinggal" value={selectedSiswa.alamat} /></div>
              </div>
            </section>

            {/* B. Ayah Kandung */}
            <section>
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 border-b border-green-200 pb-1">B. Ayah Kandung</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <Row label="Nama Ayah" value={selectedSiswa.nama_ayah} />
                <Row label="Tempat, Tgl Lahir" value={selectedSiswa.ttl_ayah} />
                <Row label="Agama" value={selectedSiswa.agama_ayah} />
                <Row label="Kewarganegaraan" value={selectedSiswa.kewarganegaraan_ayah} />
                <Row label="Pendidikan" value={selectedSiswa.pendidikan_ayah} />
                <Row label="Pekerjaan" value={selectedSiswa.pekerjaan_ayah} />
                <div className="md:col-span-2"><Row label="Alamat Rumah" value={selectedSiswa.alamat_ayah} /></div>
              </div>
            </section>

            {/* C. Ibu Kandung */}
            <section>
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 border-b border-green-200 pb-1">C. Ibu Kandung</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <Row label="Nama Ibu" value={selectedSiswa.nama_ibu} />
                <Row label="Tempat, Tgl Lahir" value={selectedSiswa.ttl_ibu} />
                <Row label="Agama" value={selectedSiswa.agama_ibu} />
                <Row label="Kewarganegaraan" value={selectedSiswa.kewarganegaraan_ibu} />
                <Row label="Pendidikan" value={selectedSiswa.pendidikan_ibu} />
                <Row label="Pekerjaan" value={selectedSiswa.pekerjaan_ibu} />
                <div className="md:col-span-2"><Row label="Alamat Rumah" value={selectedSiswa.alamat_ibu} /></div>
              </div>
            </section>

            {/* D. Wali (kalau ada) */}
            {(selectedSiswa.nama_wali || selectedSiswa.hubungan_wali) && (
              <section>
                <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 border-b border-green-200 pb-1">D. Wali</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <Row label="Nama Wali" value={selectedSiswa.nama_wali} />
                  <Row label="Hubungan dengan Siswa" value={selectedSiswa.hubungan_wali} />
                  <Row label="Tempat, Tgl Lahir" value={selectedSiswa.ttl_wali} />
                  <Row label="Agama" value={selectedSiswa.agama_wali} />
                  <Row label="Kewarganegaraan" value={selectedSiswa.kewarganegaraan_wali} />
                  <Row label="Pendidikan" value={selectedSiswa.pendidikan_wali} />
                  <Row label="Pekerjaan" value={selectedSiswa.pekerjaan_wali} />
                  <div className="md:col-span-2"><Row label="Alamat Rumah" value={selectedSiswa.alamat_wali} /></div>
                </div>
              </section>
            )}

            {/* E. Akademik */}
            <section>
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 border-b border-green-200 pb-1">E. Akademik</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <Row label="Jenjang" value={selectedSiswa.jenjang} />
                <Row label="Fase" value={selectedSiswa.fase} />
                <Row label="Kelas" value={getKelasName(selectedSiswa.kelas_id)} />
                <Row label="Status" value={selectedSiswa.status} />
              </div>
            </section>

            {/* F. Riwayat Nilai Akademik */}
            <section>
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 border-b border-green-200 pb-1">F. Riwayat Nilai Akademik (Intrakurikuler)</h3>
              {(() => {
                const nilaiSiswa = demoStore.getNilai().filter(n => n.siswa_id === selectedSiswa.id);
                const mapelList = demoStore.getMapel();
                const tpList = demoStore.getTP();
                if (nilaiSiswa.length === 0) return <p className="text-sm text-gray-400 italic">Belum ada data nilai</p>;
                return (
                  <table className="w-full text-sm border border-gray-200 rounded">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left border-b">Mata Pelajaran</th>
                        <th className="px-3 py-2 text-left border-b">TP</th>
                        <th className="px-3 py-2 text-center border-b">Nilai Akhir</th>
                        <th className="px-3 py-2 text-center border-b">Predikat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nilaiSiswa.map((n, i) => {
                        const mapel = mapelList.find(m => m.id === n.mapel_id);
                        const tp = tpList.find(t => t.id === n.tp_id);
                        return (
                          <tr key={i} className="border-b last:border-0">
                            <td className="px-3 py-2">{mapel?.nama || "-"}</td>
                            <td className="px-3 py-2">{tp?.kode || "-"}</td>
                            <td className="px-3 py-2 text-center font-medium">{n.nilai_akhir}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                n.predikat === "A" ? "bg-green-100 text-green-700" :
                                n.predikat === "B" ? "bg-blue-100 text-blue-700" :
                                n.predikat === "C" ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-700"
                              }`}>{n.predikat}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </section>

            {/* G. Riwayat Nilai Kokurikuler */}
            <section>
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 border-b border-green-200 pb-1">G. Riwayat Nilai Kokurikuler</h3>
              {(() => {
                const koko = demoStore.getKokurikuler().filter(k => k.siswa_id === selectedSiswa.id);
                if (koko.length === 0) return <p className="text-sm text-gray-400 italic">Belum ada data kokurikuler</p>;
                return (
                  <table className="w-full text-sm border border-gray-200 rounded">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left border-b">Kegiatan</th>
                        <th className="px-3 py-2 text-center border-b">Nilai</th>
                        <th className="px-3 py-2 text-center border-b">Predikat</th>
                        <th className="px-3 py-2 text-left border-b">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {koko.map((k: any, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-2">{k.nama_kegiatan}</td>
                          <td className="px-3 py-2 text-center font-medium">{k.nilai ?? "-"}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              k.predikat === "A" || k.predikat === "Sangat Baik" ? "bg-green-100 text-green-700" :
                              k.predikat === "B" || k.predikat === "Baik" ? "bg-blue-100 text-blue-700" :
                              k.predikat === "C" || k.predikat === "Cukup" ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>{k.predikat || "-"}</span>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600">{k.keterangan || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </section>

            {/* H. Riwayat Nilai Ekstrakurikuler */}
            <section>
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 border-b border-green-200 pb-1">H. Riwayat Nilai Ekstrakurikuler</h3>
              {(() => {
                const ekskul = demoStore.getEkskul().filter(e => e.siswa_id === selectedSiswa.id);
                if (ekskul.length === 0) return <p className="text-sm text-gray-400 italic">Belum ada data ekstrakurikuler</p>;
                return (
                  <table className="w-full text-sm border border-gray-200 rounded">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left border-b">Kegiatan</th>
                        <th className="px-3 py-2 text-center border-b">Nilai</th>
                        <th className="px-3 py-2 text-center border-b">Predikat</th>
                        <th className="px-3 py-2 text-left border-b">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ekskul.map((e: any, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-2">{e.nama_kegiatan}</td>
                          <td className="px-3 py-2 text-center font-medium">{e.nilai ?? "-"}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              e.predikat === "A" || e.predikat === "Sangat Baik" ? "bg-green-100 text-green-700" :
                              e.predikat === "B" || e.predikat === "Baik" ? "bg-blue-100 text-blue-700" :
                              e.predikat === "C" || e.predikat === "Cukup" ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>{e.predikat || "-"}</span>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600">{e.keterangan || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </section>

            {/* I. Presensi */}
            <section>
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 border-b border-green-200 pb-1">I. Presensi</h3>
              {(() => {
                const presensi = demoStore.getPresensi().filter(p => p.siswa_id === selectedSiswa.id);
                if (presensi.length === 0) return <p className="text-sm text-gray-400 italic">Belum ada data presensi</p>;
                const hadir = presensi.filter(p => p.status === "hadir").length;
                const sakit = presensi.filter(p => p.status === "sakit").length;
                const izin = presensi.filter(p => p.status === "izin").length;
                const alpa = presensi.filter(p => p.status === "alpa").length;
                return (
                  <div className="grid grid-cols-4 gap-3 text-sm text-center">
                    <div className="bg-green-50 rounded-lg p-3"><p className="text-lg font-bold text-green-700">{hadir}</p><p className="text-xs text-gray-500">Hadir</p></div>
                    <div className="bg-yellow-50 rounded-lg p-3"><p className="text-lg font-bold text-yellow-700">{sakit}</p><p className="text-xs text-gray-500">Sakit</p></div>
                    <div className="bg-blue-50 rounded-lg p-3"><p className="text-lg font-bold text-blue-700">{izin}</p><p className="text-xs text-gray-500">Izin</p></div>
                    <div className="bg-red-50 rounded-lg p-3"><p className="text-lg font-bold text-red-700">{alpa}</p><p className="text-xs text-gray-500">Alpa</p></div>
                  </div>
                );
              })()}
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Buku Induk Siswa</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, NIS, atau NISN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="">Semua Kelas</option>
          {kelasList.map(k => (
            <option key={k.id} value={k.id}>{k.nama_rombel}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-green-800">No</th>
              <th className="px-4 py-3 text-left font-medium text-green-800">NIS</th>
              <th className="px-4 py-3 text-left font-medium text-green-800">Nama</th>
              <th className="px-4 py-3 text-left font-medium text-green-800">L/P</th>
              <th className="px-4 py-3 text-left font-medium text-green-800">Kelas</th>
              <th className="px-4 py-3 text-left font-medium text-green-800">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>
            ) : filteredSiswa.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada data siswa</td></tr>
            ) : (
              filteredSiswa.map((s, i) => (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3">{s.nis}</td>
                  <td className="px-4 py-3 font-medium">{s.nama}</td>
                  <td className="px-4 py-3">{s.jenis_kelamin}</td>
                  <td className="px-4 py-3">{getKelasName(s.kelas_id)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedSiswa(s)}
                      className="text-green-700 hover:text-green-900 font-medium text-sm"
                    >
                      Lihat Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
