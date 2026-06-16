"use client";

import { useState, useEffect, useMemo } from "react";
import { demoStore } from "@/lib/demo-store";
import {
  generateDeskripsi,
  generateDeskripsiKokurikuler,
  generateDeskripsiEkstrakurikuler,
} from "@/lib/deskripsi-generator";
import { Siswa, MataPelajaran, Kelas, DeskripsiRapor } from "@/lib/types";
import toast from "react-hot-toast";
import { Sparkles, Save, BookOpen, Trophy, Sparkle } from "lucide-react";

function toRoman(n: number): string {
  if (n === 12) return "XII";
  if (n === 11) return "XI";
  const map: [number, string][] = [
    [10, "X"], [9, "IX"], [8, "VIII"], [7, "VII"], [6, "VI"],
    [5, "V"], [4, "IV"], [3, "III"], [2, "II"], [1, "I"],
  ];
  for (const [v, s] of map) if (n === v) return s;
  return String(n);
}

type Mode = "mapel" | "kokurikuler" | "ekstrakurikuler";

const STORE_KEYS: Record<Mode, string> = {
  mapel: "deskripsi",
  kokurikuler: "deskripsi_kokurikuler",
  ekstrakurikuler: "deskripsi_ekstrakurikuler",
};

// Lightweight read/write untuk deskripsi kokurikuler & ekstrakurikuler
// (struktur: { siswa_id, kelas_id, semester, tahun_pelajaran, deskripsi_text })
type DeskAux = {
  id: string;
  siswa_id: string;
  kelas_id: string;
  semester: number;
  tahun_pelajaran: string;
  deskripsi_text: string | null;
  created_at: string;
  updated_at: string;
};

function readAux(key: string): DeskAux[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`rdm_${key}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAux(key: string, data: DeskAux[]) {
  if (typeof window === "undefined") return;
  // Trial lock: block writes saat trial expired
  try {
    const usersRaw = localStorage.getItem("rdmkbc_v1_users");
    const session = localStorage.getItem("rdmkbc_v1_session");
    if (usersRaw && session) {
      const users = JSON.parse(usersRaw);
      const me = users.find((u: any) => u.id === session);
      if (
        me &&
        me.role !== "admin" &&
        me.tier === "trial" &&
        me.trialExpiresAt &&
        new Date(me.trialExpiresAt).getTime() <= Date.now()
      ) {
        toast.error("Trial sudah habis. Aktivasi kode FULL untuk menyimpan deskripsi.");
        return;
      }
    }
  } catch {}
  localStorage.setItem(`rdm_${key}`, JSON.stringify(data));
}

export default function DeskripsiOtomatisPage() {
  const [mode, setMode] = useState<Mode>("mapel");
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedTingkat, setSelectedTingkat] = useState<string>("");
  const [selectedRombel, setSelectedRombel] = useState<string>("");
  const [selectedMapel, setSelectedMapel] = useState("");
  const [deskripsiMap, setDeskripsiMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setKelasList(demoStore.getKelas());
    setMapelList(demoStore.getMapel());
  }, []);

  const tingkatOptions = useMemo(() => {
    const set = new Set<number>();
    kelasList.forEach(k => {
      if (typeof k.tingkat === "number" && k.tingkat > 0) set.add(k.tingkat);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [kelasList]);

  const rombelOptions = useMemo(() => {
    if (!selectedTingkat) return [] as Kelas[];
    const t = Number(selectedTingkat);
    const seen = new Set<string>();
    const list: Kelas[] = [];
    kelasList
      .filter(k => k.tingkat === t)
      .sort((a, b) => (a.nama_rombel || "").localeCompare(b.nama_rombel || ""))
      .forEach(k => {
        const key = (k.nama_rombel || "").trim().toLowerCase();
        if (!key) return;
        if (seen.has(key)) return;
        seen.add(key);
        list.push(k);
      });
    return list;
  }, [kelasList, selectedTingkat]);

  // Reset rombel kalau tingkat berubah
  useEffect(() => { setSelectedRombel(""); }, [selectedTingkat]);

  // Load existing deskripsi setiap mode/tingkat/rombel/mapel berubah
  useEffect(() => {
    if (!selectedTingkat) {
      setSiswaList([]);
      setDeskripsiMap({});
      return;
    }
    const allSiswa = demoStore.getSiswa();
    const t = Number(selectedTingkat);
    const kelasIdsAtTingkat = new Set(
      kelasList.filter(k => k.tingkat === t).map(k => k.id)
    );
    let siswa: Siswa[];
    if (selectedRombel) {
      const targetKelas = kelasList.find(k => k.id === selectedRombel);
      const targetRombelKey = (targetKelas?.nama_rombel || "").trim().toLowerCase();
      const sameRombelIds = new Set(
        kelasList
          .filter(k => k.tingkat === t && (k.nama_rombel || "").trim().toLowerCase() === targetRombelKey)
          .map(k => k.id)
      );
      siswa = allSiswa.filter(s => s.kelas_id && sameRombelIds.has(s.kelas_id));
    } else {
      siswa = allSiswa.filter(s => s.kelas_id && kelasIdsAtTingkat.has(s.kelas_id));
    }
    siswa = siswa.slice().sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
    setSiswaList(siswa);

    const map: Record<string, string> = {};
    if (mode === "mapel") {
      if (!selectedMapel) {
        setDeskripsiMap({});
        return;
      }
      const all = demoStore.getDeskripsi();
      siswa.forEach((s) => {
        const found = all.find(
          (d) => d.siswa_id === s.id && d.mapel_id === selectedMapel
        );
        if (found) map[s.id] = found.deskripsi_text || "";
      });
    } else {
      const all = readAux(STORE_KEYS[mode]);
      siswa.forEach((s) => {
        const found = all.find((d) => d.siswa_id === s.id);
        if (found) map[s.id] = found.deskripsi_text || "";
      });
    }
    setDeskripsiMap(map);
  }, [mode, selectedTingkat, selectedRombel, selectedMapel, kelasList]);

  const handleGenerate = () => {
    if (!selectedTingkat) {
      toast.error("Pilih kelas terlebih dahulu");
      return;
    }
    if (mode === "mapel" && !selectedMapel) {
      toast.error("Pilih mata pelajaran terlebih dahulu");
      return;
    }
    setGenerating(true);

    const newMap: Record<string, string> = {};

    if (mode === "mapel") {
      const allNilai = demoStore.getNilai();
      const allTp = demoStore.getTP();
      const allCp = demoStore.getCP();
      const mapel = mapelList.find((m) => m.id === selectedMapel);
      const cpIds = allCp.filter((cp) => cp.mapel_id === selectedMapel).map((cp) => cp.id);
      const tps = allTp.filter((tp) => cpIds.includes(tp.cp_id));

      siswaList.forEach((siswa) => {
        const nilaiSiswa = allNilai.filter(
          (n) => n.siswa_id === siswa.id && n.mapel_id === selectedMapel
        );
        const nilaiAkhir =
          nilaiSiswa.length > 0
            ? Math.round(
                nilaiSiswa.reduce((sum, n) => sum + (n.nilai_akhir || 0), 0) / nilaiSiswa.length
              )
            : 0;

        let tpTertinggi: typeof tps[0] | null = null;
        let tpTerendah: typeof tps[0] | null = null;
        let maxN = -1,
          minN = 101;
        nilaiSiswa.forEach((n) => {
          if (n.nilai_akhir !== null && n.tp_id) {
            const tp = tps.find((t) => t.id === n.tp_id);
            if (tp && n.nilai_akhir > maxN) {
              maxN = n.nilai_akhir;
              tpTertinggi = tp;
            }
            if (tp && n.nilai_akhir < minN) {
              minN = n.nilai_akhir;
              tpTerendah = tp;
            }
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
          catatanFormatif:
            nilaiSiswa.find((n) => n.catatan_formatif)?.catatan_formatif || null,
          dimensiProfil: dimensi[Math.floor(Math.random() * dimensi.length)],
          pancaCinta: panca[Math.floor(Math.random() * panca.length)],
          metode: "tp",
        });
        newMap[siswa.id] = desc;
      });
    } else if (mode === "kokurikuler") {
      const allKoko = demoStore.getKokurikuler();
      siswaList.forEach((siswa) => {
        const kegiatan = allKoko
          .filter((k) => k.siswa_id === siswa.id)
          .map((k) => ({
            nama_kegiatan: k.nama_kegiatan,
            nilai: k.nilai,
            keterangan: k.keterangan,
          }));
        newMap[siswa.id] = generateDeskripsiKokurikuler({
          namaSiswa: siswa.nama,
          kegiatan,
        });
      });
    } else if (mode === "ekstrakurikuler") {
      const allEks = demoStore.getEkskul();
      siswaList.forEach((siswa) => {
        const kegiatan = allEks
          .filter((k) => k.siswa_id === siswa.id)
          .map((k) => ({
            nama_kegiatan: k.nama_kegiatan,
            nilai: (k as any).nilai ?? null,
            keterangan: k.keterangan,
          }));
        newMap[siswa.id] = generateDeskripsiEkstrakurikuler({
          namaSiswa: siswa.nama,
          kegiatan,
        });
      });
    }

    setDeskripsiMap(newMap);
    setGenerating(false);
    toast.success("Deskripsi berhasil digenerate!");
  };

  const handleSave = () => {
    setLoading(true);
    const targetSiswaIds = new Set(siswaList.map(s => s.id));

    if (mode === "mapel") {
      const allDesk = demoStore.getDeskripsi();
      // Hanya hapus deskripsi mapel ini untuk siswa yang sedang ditampilkan
      const filtered = allDesk.filter(
        (d) => !(d.mapel_id === selectedMapel && targetSiswaIds.has(d.siswa_id))
      );
      const newEntries = siswaList.map((s) => ({
        id: demoStore.generateId(),
        siswa_id: s.id,
        mapel_id: selectedMapel,
        kelas_id: s.kelas_id || "",
        semester: 1,
        tahun_pelajaran: "2024/2025",
        metode: "tp" as const,
        deskripsi_text: deskripsiMap[s.id] || "",
        is_locked: false,
        generated_at: new Date().toISOString(),
        edited_at: null,
        created_at: "",
        updated_at: "",
      })) as DeskripsiRapor[];
      demoStore.setDeskripsi([...filtered, ...newEntries]);
    } else {
      const key = STORE_KEYS[mode];
      const all = readAux(key);
      const filtered = all.filter((d) => !targetSiswaIds.has(d.siswa_id));
      const newEntries: DeskAux[] = siswaList.map((s) => ({
        id: demoStore.generateId(),
        siswa_id: s.id,
        kelas_id: s.kelas_id || "",
        semester: 1,
        tahun_pelajaran: "2024/2025",
        deskripsi_text: deskripsiMap[s.id] || "",
        created_at: "",
        updated_at: "",
      }));
      writeAux(key, [...filtered, ...newEntries]);
    }

    toast.success("Deskripsi berhasil disimpan");
    setLoading(false);
  };

  const tabs: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: "mapel", label: "Mata Pelajaran", icon: <BookOpen size={16} /> },
    { id: "kokurikuler", label: "Kokurikuler", icon: <Sparkle size={16} /> },
    { id: "ekstrakurikuler", label: "Ekstrakurikuler", icon: <Trophy size={16} /> },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Deskripsi Raport Otomatis</h1>
      <p className="text-sm text-gray-500 mb-4">
        Generate deskripsi naratif untuk mata pelajaran, kokurikuler (P5RA), dan ekstrakurikuler.
      </p>

      {/* Tab switcher */}
      <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setMode(t.id);
              setSelectedMapel("");
              setDeskripsiMap({});
            }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              mode === t.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div
          className={`grid grid-cols-1 ${
            mode === "mapel" ? "sm:grid-cols-4" : "sm:grid-cols-3"
          } gap-4`}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
            <select
              value={selectedTingkat}
              onChange={(e) => setSelectedTingkat(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">-- Pilih Kelas --</option>
              {tingkatOptions.map((t) => (
                <option key={t} value={t}>Kelas {toRoman(t)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rombel</label>
            <select
              value={selectedRombel}
              onChange={(e) => setSelectedRombel(e.target.value)}
              disabled={!selectedTingkat}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">-- Semua Rombel --</option>
              {rombelOptions.map((k) => (
                <option key={k.id} value={k.id}>{k.nama_rombel || "-"}</option>
              ))}
            </select>
          </div>
          {mode === "mapel" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
              <select
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">-- Pilih Mapel --</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              onClick={handleGenerate}
              disabled={
                generating ||
                !selectedTingkat ||
                (mode === "mapel" && !selectedMapel)
              }
              className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Sparkles size={16} /> {generating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </div>

      {!selectedTingkat ? (
        <div className="text-center py-12 text-gray-400">
          Pilih Kelas untuk menampilkan daftar siswa
        </div>
      ) : siswaList.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {selectedRombel ? "Tidak ada siswa di rombel ini" : "Tidak ada siswa di kelas ini"}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {siswaList.map((siswa, idx) => {
              const kelas = kelasList.find(k => k.id === siswa.kelas_id);
              return (
                <div key={siswa.id} className="bg-white rounded-xl shadow-sm border p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-gray-500">{idx + 1}.</span>
                    <span className="font-medium text-gray-900">{siswa.nama}</span>
                    <span className="text-xs text-gray-500">({kelas?.nama_rombel || "-"})</span>
                  </div>
                  <textarea
                    value={deskripsiMap[siswa.id] || ""}
                    onChange={(e) =>
                      setDeskripsiMap((prev) => ({ ...prev, [siswa.id]: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    placeholder="Deskripsi akan muncul setelah generate..."
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Save size={16} /> {loading ? "Menyimpan..." : "Simpan Deskripsi"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
