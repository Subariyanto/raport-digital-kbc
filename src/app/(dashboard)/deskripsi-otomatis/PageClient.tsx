"use client";

import { useState, useEffect } from "react";
import { demoStore } from "@/lib/demo-store";
import {
  generateDeskripsi,
  generateDeskripsiKokurikuler,
  generateDeskripsiEkstrakurikuler,
} from "@/lib/deskripsi-generator";
import { Siswa, MataPelajaran, Kelas, DeskripsiRapor } from "@/lib/types";
import toast from "react-hot-toast";
import { Sparkles, Save, BookOpen, Trophy, Sparkle } from "lucide-react";

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
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");
  const [deskripsiMap, setDeskripsiMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setKelasList(demoStore.getKelas());
    setMapelList(demoStore.getMapel());
  }, []);

  // Load existing deskripsi setiap mode/kelas/mapel berubah
  useEffect(() => {
    if (!selectedKelas) {
      setSiswaList([]);
      setDeskripsiMap({});
      return;
    }
    const siswa = demoStore.getSiswa().filter((s) => s.kelas_id === selectedKelas);
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
          (d) => d.siswa_id === s.id && d.mapel_id === selectedMapel && d.kelas_id === selectedKelas
        );
        if (found) map[s.id] = found.deskripsi_text || "";
      });
    } else {
      const all = readAux(STORE_KEYS[mode]);
      siswa.forEach((s) => {
        const found = all.find((d) => d.siswa_id === s.id && d.kelas_id === selectedKelas);
        if (found) map[s.id] = found.deskripsi_text || "";
      });
    }
    setDeskripsiMap(map);
  }, [mode, selectedKelas, selectedMapel]);

  const handleGenerate = () => {
    if (!selectedKelas) {
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
          (n) => n.siswa_id === siswa.id && n.mapel_id === selectedMapel && n.kelas_id === selectedKelas
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
          .filter((k) => k.siswa_id === siswa.id && k.kelas_id === selectedKelas)
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
          .filter((k) => k.siswa_id === siswa.id && k.kelas_id === selectedKelas)
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

    if (mode === "mapel") {
      const allDesk = demoStore.getDeskripsi();
      const filtered = allDesk.filter(
        (d) => !(d.kelas_id === selectedKelas && d.mapel_id === selectedMapel)
      );
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
      })) as DeskripsiRapor[];
      demoStore.setDeskripsi([...filtered, ...newEntries]);
    } else {
      const key = STORE_KEYS[mode];
      const all = readAux(key);
      const filtered = all.filter((d) => d.kelas_id !== selectedKelas);
      const newEntries: DeskAux[] = Object.entries(deskripsiMap).map(
        ([siswaId, deskripsi]) => ({
          id: demoStore.generateId(),
          siswa_id: siswaId,
          kelas_id: selectedKelas,
          semester: 1,
          tahun_pelajaran: "2024/2025",
          deskripsi_text: deskripsi,
          created_at: "",
          updated_at: "",
        })
      );
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
            mode === "mapel" ? "sm:grid-cols-3" : "sm:grid-cols-2"
          } gap-4`}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_rombel}
                </option>
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
                !selectedKelas ||
                (mode === "mapel" && !selectedMapel)
              }
              className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Sparkles size={16} /> {generating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </div>

      {siswaList.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {mode === "mapel"
            ? "Pilih kelas dan mata pelajaran untuk generate deskripsi"
            : "Pilih kelas untuk generate deskripsi"}
        </div>
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
                  onChange={(e) =>
                    setDeskripsiMap((prev) => ({ ...prev, [siswa.id]: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  placeholder="Deskripsi akan muncul setelah generate..."
                />
              </div>
            ))}
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
