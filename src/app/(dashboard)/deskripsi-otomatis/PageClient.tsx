"use client";

import { useState, useEffect } from "react";
import { demoStore } from "@/lib/demo-store";
import { generateDeskripsi } from "@/lib/deskripsi-generator";
import { Siswa, MataPelajaran, Kelas, TujuanPembelajaran } from "@/lib/types";
import toast from "react-hot-toast";
import { Sparkles, Save } from "lucide-react";

export default function DeskripsiOtomatisPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");
  const [deskripsiMap, setDeskripsiMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setKelasList(demoStore.getKelas());
    setMapelList(demoStore.getMapel());
  }, []);

  useEffect(() => {
    if (!selectedKelas) { setSiswaList([]); return; }
    const siswa = demoStore.getSiswa().filter(s => s.kelas_id === selectedKelas);
    setSiswaList(siswa);

    // Load existing deskripsi
    const allDesk = demoStore.getDeskripsi();
    const map: Record<string, string> = {};
    siswa.forEach(s => {
      const existing = allDesk.find(d => d.siswa_id === s.id && d.mapel_id === selectedMapel && d.kelas_id === selectedKelas);
      if (existing) map[s.id] = existing.deskripsi_text || "";
    });
    setDeskripsiMap(map);
  }, [selectedKelas, selectedMapel]);

  const handleGenerate = () => {
    if (!selectedKelas || !selectedMapel) {
      toast.error("Pilih kelas dan mata pelajaran terlebih dahulu");
      return;
    }
    setGenerating(true);

    const allNilai = demoStore.getNilai();
    const allTp = demoStore.getTP();
    const allCp = demoStore.getCP();
    const mapel = mapelList.find(m => m.id === selectedMapel);
    const cpIds = allCp.filter(cp => cp.mapel_id === selectedMapel).map(cp => cp.id);
    const tps = allTp.filter(tp => cpIds.includes(tp.cp_id));

    const newMap: Record<string, string> = {};
    siswaList.forEach(siswa => {
      const nilaiSiswa = allNilai.filter(n => n.siswa_id === siswa.id && n.mapel_id === selectedMapel && n.kelas_id === selectedKelas);
      const nilaiAkhir = nilaiSiswa.length > 0 ? Math.round(nilaiSiswa.reduce((sum, n) => sum + (n.nilai_akhir || 0), 0) / nilaiSiswa.length) : 0;

      // Find TP tertinggi & terendah
      let tpTertinggi: typeof tps[0] | null = null;
      let tpTerendah: typeof tps[0] | null = null;
      let maxN = -1, minN = 101;
      nilaiSiswa.forEach(n => {
        if (n.nilai_akhir !== null && n.tp_id) {
          const tp = tps.find(t => t.id === n.tp_id);
          if (tp && n.nilai_akhir > maxN) { maxN = n.nilai_akhir; tpTertinggi = tp; }
          if (tp && n.nilai_akhir < minN) { minN = n.nilai_akhir; tpTerendah = tp; }
        }
      });

      const dimensi = demoStore.getDimensi();
      const panca = demoStore.getPancaCinta();

      const desc = generateDeskripsi({
        namaSiswa: siswa.nama,
        namaMapel: mapel?.nama || "",
        nilaiAkhir,
        tpTertinggi,
        tpTerendah,
        catatanFormatif: nilaiSiswa.find(n => n.catatan_formatif)?.catatan_formatif || null,
        dimensiProfil: dimensi[Math.floor(Math.random() * dimensi.length)],
        pancaCinta: panca[Math.floor(Math.random() * panca.length)],
        metode: "tp",
      });
      newMap[siswa.id] = desc;
    });

    setDeskripsiMap(newMap);
    setGenerating(false);
    toast.success("Deskripsi berhasil digenerate!");
  };

  const handleSave = () => {
    setLoading(true);
    const allDesk = demoStore.getDeskripsi();
    // Remove existing for this kelas+mapel
    const filtered = allDesk.filter(d => !(d.kelas_id === selectedKelas && d.mapel_id === selectedMapel));
    // Add new
    const newEntries = Object.entries(deskripsiMap).map(([siswaId, deskripsi]) => ({
      id: demoStore.generateId(),
      siswa_id: siswaId,
      mapel_id: selectedMapel,
      kelas_id: selectedKelas,
      semester: 1,
      tahun_pelajaran: "2024/2025",
      metode: "tp" as const,
      deskripsi_text: deskripsi,
      is_locked: false,
      generated_at: new Date().toISOString(),
      edited_at: null,
      created_at: "",
      updated_at: "",
    }));
    demoStore.setDeskripsi([...filtered, ...newEntries]);
    toast.success("Deskripsi berhasil disimpan");
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Deskripsi Raport Otomatis</h1>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
            <select value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_rombel}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
            <select value={selectedMapel} onChange={(e) => setSelectedMapel(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Pilih Mapel --</option>
              {mapelList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={handleGenerate} disabled={generating || !selectedKelas || !selectedMapel} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              <Sparkles size={16} /> {generating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </div>

      {siswaList.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Pilih kelas dan mata pelajaran untuk generate deskripsi</div>
      ) : (
        <>
          <div className="space-y-3">
            {siswaList.map((siswa, idx) => (
              <div key={siswa.id} className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-gray-500">{idx + 1}.</span>
                  <span className="font-medium text-gray-900">{siswa.nama}</span>
                </div>
                <textarea
                  value={deskripsiMap[siswa.id] || ""}
                  onChange={(e) => setDeskripsiMap(prev => ({ ...prev, [siswa.id]: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  placeholder="Deskripsi akan muncul setelah generate..."
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
              <Save size={16} /> {loading ? "Menyimpan..." : "Simpan Deskripsi"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
