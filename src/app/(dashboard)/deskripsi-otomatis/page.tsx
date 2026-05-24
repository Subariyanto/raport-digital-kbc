"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Kelas, MataPelajaran, Siswa, Nilai, TujuanPembelajaran, DeskripsiRapor } from "@/lib/types";
import { generateDeskripsi, hitungNilaiAkhir } from "@/lib/deskripsi-generator";
import toast from "react-hot-toast";
import { Wand2, Save, Lock, RotateCcw } from "lucide-react";

export default function DeskripsiOtomatisPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [nilaiMap, setNilaiMap] = useState<Record<string, Nilai[]>>({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tpMap, setTpMap] = useState<Record<string, TujuanPembelajaran[]>>({});
  const [deskripsiMap, setDeskripsiMap] = useState<Record<string, DeskripsiRapor>>({});
  const [dimensiList, setDimensiList] = useState<string[]>([]);
  const [pancaCintaList, setPancaCintaList] = useState<string[]>([]);

  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");
  const [metode, setMetode] = useState<"cp" | "tp" | "materi">("tp");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Local edits
  const [localDeskripsi, setLocalDeskripsi] = useState<Record<string, string>>({});

  const supabase = createClient();

  // Fetch kelas & mapel on mount
  useEffect(() => {
    const fetchInitial = async () => {
      const [kelasRes, mapelRes, dimensiRes, pancaRes] = await Promise.all([
        supabase.from("kelas").select("*").order("jenjang").order("tingkat"),
        supabase.from("mata_pelajaran").select("*").order("nama"),
        supabase.from("dimensi_profil_lulusan").select("nama"),
        supabase.from("topik_panca_cinta").select("nama"),
      ]);
      setKelasList(kelasRes.data || []);
      setMapelList(mapelRes.data || []);
      setDimensiList((dimensiRes.data || []).map((d: { nama: string }) => d.nama));
      setPancaCintaList((pancaRes.data || []).map((p: { nama: string }) => p.nama));
    };
    fetchInitial();
  }, [supabase]);

  // Fetch siswa + nilai when kelas & mapel selected
  const fetchSiswaData = useCallback(async () => {
    if (!selectedKelas || !selectedMapel) return;
    setLoading(true);

    // Fetch siswa in kelas
    const { data: siswaData } = await supabase
      .from("siswa")
      .select("*")
      .eq("kelas_id", selectedKelas)
      .eq("status", "aktif")
      .order("nama");
    setSiswaList(siswaData || []);

    // Fetch nilai for this kelas + mapel
    const { data: nilaiData } = await supabase
      .from("nilai")
      .select("*, tujuan_pembelajaran:tp_id(id, kode, deskripsi, urutan)")
      .eq("kelas_id", selectedKelas)
      .eq("mapel_id", selectedMapel);

    // Group nilai by siswa_id
    const grouped: Record<string, Nilai[]> = {};
    (nilaiData || []).forEach((n: Nilai) => {
      if (!grouped[n.siswa_id]) grouped[n.siswa_id] = [];
      grouped[n.siswa_id].push(n);
    });
    setNilaiMap(grouped);

    // Fetch TP for this mapel
    const { data: cpData } = await supabase
      .from("capaian_pembelajaran")
      .select("id, deskripsi")
      .eq("mapel_id", selectedMapel);

    if (cpData && cpData.length > 0) {
      const cpIds = cpData.map((cp: { id: string }) => cp.id);
      const { data: tpData } = await supabase
        .from("tujuan_pembelajaran")
        .select("*")
        .in("cp_id", cpIds)
        .order("urutan");

      const tpGrouped: Record<string, TujuanPembelajaran[]> = {};
      (tpData || []).forEach((tp: TujuanPembelajaran) => {
        if (!tpGrouped[tp.cp_id]) tpGrouped[tp.cp_id] = [];
        tpGrouped[tp.cp_id].push(tp);
      });
      setTpMap(tpGrouped);
    }

    // Fetch existing deskripsi
    const { data: deskData } = await supabase
      .from("deskripsi_rapor")
      .select("*")
      .eq("kelas_id", selectedKelas)
      .eq("mapel_id", selectedMapel);

    const deskMap: Record<string, DeskripsiRapor> = {};
    const localDesk: Record<string, string> = {};
    (deskData || []).forEach((d: DeskripsiRapor) => {
      deskMap[d.siswa_id] = d;
      localDesk[d.siswa_id] = d.deskripsi_text || "";
    });
    setDeskripsiMap(deskMap);
    setLocalDeskripsi(localDesk);

    setLoading(false);
  }, [selectedKelas, selectedMapel, supabase]);

  useEffect(() => { fetchSiswaData(); }, [fetchSiswaData]);

  // Generate deskripsi for one siswa
  const generateForSiswa = (siswa: Siswa) => {
    const nilaiSiswa = nilaiMap[siswa.id] || [];
    const nilaiAkhir = hitungNilaiAkhir(nilaiSiswa);

    // Find TP tertinggi & terendah
    let tpTertinggi: TujuanPembelajaran | null = null;
    let tpTerendah: TujuanPembelajaran | null = null;
    let maxNilai = -1;
    let minNilai = 101;

    nilaiSiswa.forEach((n) => {
      if (n.nilai_akhir !== null && n.tujuan_pembelajaran) {
        if (n.nilai_akhir > maxNilai) {
          maxNilai = n.nilai_akhir;
          tpTertinggi = n.tujuan_pembelajaran as TujuanPembelajaran;
        }
        if (n.nilai_akhir < minNilai) {
          minNilai = n.nilai_akhir;
          tpTerendah = n.tujuan_pembelajaran as TujuanPembelajaran;
        }
      }
    });

    const catatanFormatif = nilaiSiswa.find((n) => n.catatan_formatif)?.catatan_formatif || null;
    const mapel = mapelList.find((m) => m.id === selectedMapel);

    // Pick random dimensi & panca cinta for variety
    const dimensi = dimensiList[Math.floor(Math.random() * dimensiList.length)] || "Bernalar Kritis";
    const panca = pancaCintaList[Math.floor(Math.random() * pancaCintaList.length)] || "Cinta Ilmu";

    const deskripsi = generateDeskripsi({
      namaSiswa: siswa.nama,
      namaMapel: mapel?.nama || "mata pelajaran",
      nilaiAkhir,
      tpTertinggi,
      tpTerendah,
      catatanFormatif,
      dimensiProfil: dimensi,
      pancaCinta: panca,
      metode,
    });

    setLocalDeskripsi((prev) => ({ ...prev, [siswa.id]: deskripsi }));
  };

  // Generate all
  const generateAll = () => {
    setGenerating(true);
    siswaList.forEach((siswa) => {
      if (!deskripsiMap[siswa.id]?.is_locked) {
        generateForSiswa(siswa);
      }
    });
    setGenerating(false);
    toast.success("Deskripsi berhasil di-generate untuk semua siswa");
  };

  // Save deskripsi
  const saveDeskripsi = async (siswaId: string) => {
    const text = localDeskripsi[siswaId];
    if (!text) { toast.error("Deskripsi kosong"); return; }

    const existing = deskripsiMap[siswaId];
    const kelas = kelasList.find((k) => k.id === selectedKelas);

    if (existing) {
      const { error } = await supabase
        .from("deskripsi_rapor")
        .update({ deskripsi_text: text, metode, edited_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) toast.error("Gagal menyimpan");
      else toast.success("Deskripsi tersimpan");
    } else {
      const { error } = await supabase.from("deskripsi_rapor").insert({
        siswa_id: siswaId,
        mapel_id: selectedMapel,
        kelas_id: selectedKelas,
        semester: kelas?.semester || 1,
        tahun_pelajaran: kelas?.tahun_pelajaran || "2024/2025",
        metode,
        deskripsi_text: text,
        generated_at: new Date().toISOString(),
      });
      if (error) toast.error("Gagal menyimpan");
      else toast.success("Deskripsi tersimpan");
    }
    fetchSiswaData();
  };

  // Lock deskripsi
  const lockDeskripsi = async (siswaId: string) => {
    const existing = deskripsiMap[siswaId];
    if (!existing) { toast.error("Simpan deskripsi terlebih dahulu"); return; }
    const { error } = await supabase
      .from("deskripsi_rapor")
      .update({ is_locked: true })
      .eq("id", existing.id);
    if (error) toast.error("Gagal mengunci");
    else { toast.success("Deskripsi dikunci"); fetchSiswaData(); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Generator Deskripsi Raport Otomatis</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.jenjang} - {k.nama_rombel} (Fase {k.fase})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Mata Pelajaran</label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">-- Pilih Mapel --</option>
              {mapelList.map((m) => (
                <option key={m.id} value={m.id}>{m.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metode Deskripsi</label>
            <select
              value={metode}
              onChange={(e) => setMetode(e.target.value as "cp" | "tp" | "materi")}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="tp">Berdasarkan Tujuan Pembelajaran (TP)</option>
              <option value="cp">Berdasarkan Capaian Pembelajaran (CP)</option>
              <option value="materi">Berdasarkan Materi</option>
            </select>
          </div>
        </div>

        {selectedKelas && selectedMapel && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={generateAll}
              disabled={generating || siswaList.length === 0}
              className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Wand2 size={16} /> Generate Semua
            </button>
          </div>
        )}
      </div>

      {/* Student list with deskripsi */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat data siswa...</div>
      ) : selectedKelas && selectedMapel && siswaList.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Tidak ada siswa di kelas ini</div>
      ) : selectedKelas && selectedMapel ? (
        <div className="space-y-4">
          {siswaList.map((siswa) => {
            const nilaiSiswa = nilaiMap[siswa.id] || [];
            const nilaiAkhir = hitungNilaiAkhir(nilaiSiswa);
            const existing = deskripsiMap[siswa.id];
            const isLocked = existing?.is_locked || false;
            const deskText = localDeskripsi[siswa.id] || "";

            // Find TP tertinggi & terendah for display
            let tpTertinggiNama = "-";
            let tpTerendahNama = "-";
            let maxN = -1, minN = 101;
            nilaiSiswa.forEach((n) => {
              if (n.nilai_akhir !== null && n.tujuan_pembelajaran) {
                if (n.nilai_akhir > maxN) { maxN = n.nilai_akhir; tpTertinggiNama = (n.tujuan_pembelajaran as TujuanPembelajaran).kode; }
                if (n.nilai_akhir < minN) { minN = n.nilai_akhir; tpTerendahNama = (n.tujuan_pembelajaran as TujuanPembelajaran).kode; }
              }
            });

            return (
              <div key={siswa.id} className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{siswa.nama}</h3>
                    <p className="text-xs text-gray-500">NIS: {siswa.nis} | Nilai Akhir: <span className="font-bold">{nilaiAkhir}</span> | TP Tertinggi: {tpTertinggiNama} | TP Terendah: {tpTerendahNama}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLocked ? (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">🔒 Terkunci</span>
                    ) : (
                      <>
                        <button onClick={() => generateForSiswa(siswa)} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors" title="Generate">
                          <Wand2 size={12} /> Generate
                        </button>
                        <button onClick={() => saveDeskripsi(siswa.id)} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors" title="Simpan">
                          <Save size={12} /> Simpan
                        </button>
                        <button onClick={() => lockDeskripsi(siswa.id)} className="flex items-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors" title="Kunci">
                          <Lock size={12} /> Kunci
                        </button>
                        <button onClick={() => setLocalDeskripsi((prev) => ({ ...prev, [siswa.id]: "" }))} className="flex items-center gap-1 text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors" title="Reset">
                          <RotateCcw size={12} /> Reset
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <textarea
                  value={deskText}
                  onChange={(e) => setLocalDeskripsi((prev) => ({ ...prev, [siswa.id]: e.target.value }))}
                  disabled={isLocked}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed resize-y"
                  placeholder="Klik 'Generate' untuk membuat deskripsi otomatis, atau ketik manual..."
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">Pilih kelas dan mata pelajaran untuk memulai</div>
      )}
    </div>
  );
}
