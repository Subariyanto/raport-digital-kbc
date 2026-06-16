// Demo data store - uses localStorage for persistence without Supabase
import { Guru, Siswa, Kelas, MataPelajaran, CapaianPembelajaran, TujuanPembelajaran, Nilai, DeskripsiRapor, Presensi, Ekstrakurikuler, Kokurikuler, CatatanWaliKelas, Madrasah } from "./types";
import toast from "react-hot-toast";

// ============================================================
// Trial lock guard — blocks all write ops when trial expired
// ============================================================
function isTrialLocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem("rdmkbc_v1_users");
    const session = window.localStorage.getItem("rdmkbc_v1_session");
    if (!raw || !session) return false;
    const users = JSON.parse(raw);
    const me = users.find((u: any) => u.id === session);
    if (!me || me.role === "admin") return false;
    if (me.tier !== "trial" || !me.trialExpiresAt) return false;
    return new Date(me.trialExpiresAt).getTime() <= Date.now();
  } catch {
    return false;
  }
}

let _lastLockToast = 0;
function notifyLocked(): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - _lastLockToast < 1500) return; // throttle
  _lastLockToast = now;
  try {
    toast.error("Trial sudah habis. Aktivasi kode FULL untuk menyimpan / mengubah data.", {
      duration: 4000,
    });
  } catch {
    // toast might not be mounted yet — fall back to alert
    if (typeof window !== "undefined") {
      window.alert("Trial sudah habis. Aktivasi kode FULL untuk menyimpan / mengubah data.");
    }
  }
}

export function isTrialLockedExternal(): boolean {
  return isTrialLocked();
}
export function notifyTrialLocked(): void {
  notifyLocked();
}

const MADRASAH_ID = "11111111-1111-1111-1111-111111111111";

const defaultMadrasah: Madrasah = {
  id: MADRASAH_ID,
  nama: "",
  nsm: null,
  npsn: null,
  alamat: null,
  desa: null,
  kecamatan: null,
  kabupaten: null,
  provinsi: null,
  kepala_madrasah: null,
  nip_kepala: null,
  logo_url: null,
  kop_url: null,
  tahun_pelajaran: null,
  semester: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const defaultGuru: Guru[] = [];
const defaultKelas: Kelas[] = [];
const defaultSiswa: Siswa[] = [];
const defaultMapel: MataPelajaran[] = [];
const defaultCP: CapaianPembelajaran[] = [];
const defaultTP: TujuanPembelajaran[] = [];
const defaultNilai: Nilai[] = [];

// One-shot migration: hapus data sample lama (MI Nurul Hikmah dkk).
// User yang sudah pernah buka aplikasi sebelumnya punya data demo di localStorage.
// Kita bersihkan sekali, lalu user mulai dari kosong.
function migrateCleanupDemoData() {
  if (typeof window === "undefined") return;
  try {
    const KEY = "rdm_seed_version";
    const cur = window.localStorage.getItem(KEY);
    if (cur === "v2-empty") return;
    const sampleKeys = ["madrasah", "guru", "siswa", "kelas", "mapel", "cp", "tp", "nilai", "deskripsi", "presensi", "ekskul", "kokurikuler", "catatan"];
    // Cek apakah data demo sample (MI Nurul Hikmah) masih ada
    const m = window.localStorage.getItem("rdm_madrasah");
    const isDemoSeeded = m && (m.includes("Nurul Hikmah") || m.includes("11111111-1111-1111-1111-111111111111"));
    if (isDemoSeeded) {
      sampleKeys.forEach((k) => window.localStorage.removeItem(`rdm_${k}`));
    }
    window.localStorage.setItem(KEY, "v2-empty");
  } catch {
    // best-effort, abaikan error
  }
}
if (typeof window !== "undefined") {
  // jalankan sekali saat module dimuat
  migrateCleanupDemoData();
}

function getStore<T>(key: string, defaults: T[]): T[] {
  if (typeof window === "undefined") return defaults;
  try {
    const stored = localStorage.getItem(`rdm_${key}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  // Seed defaults — tetap dilakukan walau locked supaya read tidak gagal
  localStorage.setItem(`rdm_${key}`, JSON.stringify(defaults));
  return defaults;
}

function setStore<T>(key: string, data: T[]): boolean {
  if (typeof window === "undefined") return false;
  if (isTrialLocked()) { notifyLocked(); return false; }
  localStorage.setItem(`rdm_${key}`, JSON.stringify(data));
  return true;
}

function getStoreObj<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  try {
    const stored = localStorage.getItem(`rdm_${key}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  localStorage.setItem(`rdm_${key}`, JSON.stringify(defaultVal));
  return defaultVal;
}

function setStoreObj<T>(key: string, data: T): boolean {
  if (typeof window === "undefined") return false;
  if (isTrialLocked()) { notifyLocked(); return false; }
  localStorage.setItem(`rdm_${key}`, JSON.stringify(data));
  return true;
}

// Public API
export const demoStore = {
  getMadrasah: () => {
    // Cleanup migration: hapus key sampel default lama (eksperimen sebelumnya)
    if (typeof window !== "undefined") {
      try { window.localStorage.removeItem("rdm_madrasah_default"); } catch {}
    }
    return getStoreObj<Madrasah>("madrasah", defaultMadrasah);
  },
  setMadrasah: (m: Madrasah) => setStoreObj("madrasah", m),

  /**
   * Kosongkan data madrasah ke kondisi benar-benar kosong (defaultMadrasah).
   */
  resetMadrasah: (): Madrasah | null => {
    if (typeof window === "undefined") return null;
    if (isTrialLocked()) { notifyLocked(); return null; }
    const empty = { ...defaultMadrasah, updated_at: new Date().toISOString() };
    window.localStorage.setItem("rdm_madrasah", JSON.stringify(empty));
    return empty;
  },

  /**
   * Tanggal Cetak Raport (string ISO YYYY-MM-DD). Dipakai di halaman Cetak Raport
   * supaya TTD otomatis terisi tanggal yang di-set admin / wali kelas di Pengaturan.
   * Default: hari ini (kalau belum di-set).
   */
  getTanggalCetak: (): string => {
    if (typeof window === "undefined") return "";
    try {
      const v = window.localStorage.getItem("rdm_tanggal_cetak");
      if (v && typeof v === "string") return v;
    } catch {}
    return new Date().toISOString().slice(0, 10);
  },
  setTanggalCetak: (isoDate: string): boolean => {
    if (typeof window === "undefined") return false;
    if (isTrialLocked()) { notifyLocked(); return false; }
    if (!isoDate) {
      window.localStorage.removeItem("rdm_tanggal_cetak");
    } else {
      window.localStorage.setItem("rdm_tanggal_cetak", isoDate);
    }
    return true;
  },

  getGuru: () => getStore<Guru>("guru", defaultGuru),
  setGuru: (data: Guru[]) => setStore("guru", data),

  getSiswa: () => getStore<Siswa>("siswa", defaultSiswa),
  setSiswa: (data: Siswa[]) => setStore("siswa", data),

  getKelas: () => getStore<Kelas>("kelas", defaultKelas),
  setKelas: (data: Kelas[]) => setStore("kelas", data),

  getMapel: () => getStore<MataPelajaran>("mapel", defaultMapel),
  setMapel: (data: MataPelajaran[]) => setStore("mapel", data),

  getCP: () => getStore<CapaianPembelajaran>("cp", defaultCP),
  setCP: (data: CapaianPembelajaran[]) => setStore("cp", data),

  getTP: () => getStore<TujuanPembelajaran>("tp", defaultTP),
  setTP: (data: TujuanPembelajaran[]) => setStore("tp", data),

  getNilai: () => getStore<Nilai>("nilai", defaultNilai),
  setNilai: (data: Nilai[]) => setStore("nilai", data),

  getDeskripsi: () => getStore<DeskripsiRapor>("deskripsi", []),
  setDeskripsi: (data: DeskripsiRapor[] | any[]) => setStore("deskripsi", data),

  getPresensi: () => getStore<Presensi>("presensi", []),
  setPresensi: (data: Presensi[] | any[]) => setStore("presensi", data),

  getEkskul: () => getStore<Ekstrakurikuler>("ekskul", []),
  setEkskul: (data: Ekstrakurikuler[] | any[]) => setStore("ekskul", data),

  getKokurikuler: () => getStore<Kokurikuler>("kokurikuler", []),
  setKokurikuler: (data: Kokurikuler[] | any[]) => setStore("kokurikuler", data),

  getCatatan: () => getStore<CatatanWaliKelas>("catatan", []),
  setCatatan: (data: CatatanWaliKelas[] | any[]) => setStore("catatan", data),

  getDimensi: () => [
    "Beriman dan Bertakwa kepada Tuhan YME",
    "Berkebinekaan Global",
    "Bergotong Royong",
    "Mandiri",
    "Bernalar Kritis",
    "Kreatif",
  ],

  getPancaCinta: () => [
    "Cinta Allah dan Rasul",
    "Cinta Ilmu",
    "Cinta Lingkungan",
    "Cinta Diri dan Sesama",
    "Cinta Tanah Air",
  ],

  generateId: () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
};
