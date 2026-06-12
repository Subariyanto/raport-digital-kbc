// Demo data store - uses localStorage for persistence without Supabase
import { Guru, Siswa, Kelas, MataPelajaran, CapaianPembelajaran, TujuanPembelajaran, Nilai, DeskripsiRapor, Presensi, Ekstrakurikuler, CatatanWaliKelas, Madrasah } from "./types";

const MADRASAH_ID = "11111111-1111-1111-1111-111111111111";

const defaultMadrasah: Madrasah = {
  id: MADRASAH_ID,
  nama: "MI Nurul Hikmah",
  nsm: "111234560001",
  npsn: "60712345",
  alamat: "Jl. Pendidikan No. 1",
  desa: "Sukamaju",
  kecamatan: "Ciamis",
  kabupaten: "Kabupaten Ciamis",
  provinsi: "Jawa Barat",
  kepala_madrasah: "H. Ahmad Fauzi, S.Pd.I",
  nip_kepala: "197501012005011001",
  logo_url: null,
  kop_url: null,
  tahun_pelajaran: "2024/2025",
  semester: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const defaultGuru: Guru[] = [
  { id: "g1", nama: "Ustadz Rahmat Hidayat, S.Pd.I", nip_nuptk: "198201012010011001", jabatan: "Wali Kelas IV", hp: "081234567001", email: "rahmat@mi.sch.id", user_id: null, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
  { id: "g2", nama: "Ustadzah Siti Aminah, S.Pd", nip_nuptk: "198505052012012001", jabatan: "Guru Matematika", hp: "081234567002", email: "aminah@mi.sch.id", user_id: null, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
  { id: "g3", nama: "Ustadz Budi Santoso, S.Ag", nip_nuptk: "197908082008011001", jabatan: "Guru Al-Quran Hadis", hp: "081234567003", email: "budi@mi.sch.id", user_id: null, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
  { id: "g4", nama: "Ustadzah Nur Halimah, S.Pd", nip_nuptk: "199001012015012001", jabatan: "Guru Bahasa Indonesia", hp: "081234567004", email: "halimah@mi.sch.id", user_id: null, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
  { id: "g5", nama: "Ustadz Dedi Kurniawan, S.Pd", nip_nuptk: "198712122014011001", jabatan: "Guru IPAS", hp: "081234567005", email: "dedi@mi.sch.id", user_id: null, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
];

const defaultKelas: Kelas[] = [
  { id: "k1", jenjang: "MI", tingkat: 4, nama_rombel: "IV-A", wali_kelas_id: "g1", fase: "B", tahun_pelajaran: "2024/2025", semester: 1, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
];

const defaultSiswa: Siswa[] = [
  { id: "s1", nis: "2401", nisn: "0081234001", nama: "Ahmad Zaki Mubarok", tempat_lahir: "Ciamis", tanggal_lahir: "2014-03-15", jenis_kelamin: "L", agama: "Islam", alamat: "Jl. Mawar No. 1", nama_ayah: "Hasan Mubarok", nama_ibu: "Siti Fatimah", nama_wali: null, hp_ortu: "081300000001", kelas_id: "k1", jenjang: "MI", fase: "B", status: "aktif", foto_url: null, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
  { id: "s2", nis: "2402", nisn: "0081234002", nama: "Aisyah Putri Ramadhani", tempat_lahir: "Ciamis", tanggal_lahir: "2014-05-20", jenis_kelamin: "P", agama: "Islam", alamat: "Jl. Melati No. 2", nama_ayah: "Umar Ramadhani", nama_ibu: "Khadijah", nama_wali: null, hp_ortu: "081300000002", kelas_id: "k1", jenjang: "MI", fase: "B", status: "aktif", foto_url: null, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
  { id: "s3", nis: "2403", nisn: "0081234003", nama: "Muhammad Rizki Pratama", tempat_lahir: "Banjar", tanggal_lahir: "2014-01-10", jenis_kelamin: "L", agama: "Islam", alamat: "Jl. Dahlia No. 3", nama_ayah: "Ali Pratama", nama_ibu: "Nur Aini", nama_wali: null, hp_ortu: "081300000003", kelas_id: "k1", jenjang: "MI", fase: "B", status: "aktif", foto_url: null, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
  { id: "s4", nis: "2404", nisn: "0081234004", nama: "Fatimah Azzahra", tempat_lahir: "Ciamis", tanggal_lahir: "2014-07-08", jenis_kelamin: "P", agama: "Islam", alamat: "Jl. Anggrek No. 4", nama_ayah: "Ibrahim", nama_ibu: "Maryam", nama_wali: null, hp_ortu: "081300000004", kelas_id: "k1", jenjang: "MI", fase: "B", status: "aktif", foto_url: null, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
  { id: "s5", nis: "2405", nisn: "0081234005", nama: "Umar Faruq Abdullah", tempat_lahir: "Tasikmalaya", tanggal_lahir: "2014-09-25", jenis_kelamin: "L", agama: "Islam", alamat: "Jl. Kenanga No. 5", nama_ayah: "Abdullah", nama_ibu: "Zainab", nama_wali: null, hp_ortu: "081300000005", kelas_id: "k1", jenjang: "MI", fase: "B", status: "aktif", foto_url: null, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
  { id: "s6", nis: "2406", nisn: "0081234006", nama: "Khadijah Nurul Aini", tempat_lahir: "Ciamis", tanggal_lahir: "2014-11-12", jenis_kelamin: "P", agama: "Islam", alamat: "Jl. Flamboyan No. 6", nama_ayah: "Ridwan", nama_ibu: "Halimah", nama_wali: null, hp_ortu: "081300000006", kelas_id: "k1", jenjang: "MI", fase: "B", status: "aktif", foto_url: null, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
  { id: "s7", nis: "2407", nisn: "0081234007", nama: "Bilal Hakim Ramadhan", tempat_lahir: "Banjar", tanggal_lahir: "2014-04-30", jenis_kelamin: "L", agama: "Islam", alamat: "Jl. Bougenville No. 7", nama_ayah: "Hakim", nama_ibu: "Aisyah", nama_wali: null, hp_ortu: "081300000007", kelas_id: "k1", jenjang: "MI", fase: "B", status: "aktif", foto_url: null, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
  { id: "s8", nis: "2408", nisn: "0081234008", nama: "Zahra Amelia Putri", tempat_lahir: "Ciamis", tanggal_lahir: "2014-06-18", jenis_kelamin: "P", agama: "Islam", alamat: "Jl. Cempaka No. 8", nama_ayah: "Yusuf", nama_ibu: "Aminah", nama_wali: null, hp_ortu: "081300000008", kelas_id: "k1", jenjang: "MI", fase: "B", status: "aktif", foto_url: null, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
  { id: "s9", nis: "2409", nisn: "0081234009", nama: "Hasan Abdillah", tempat_lahir: "Pangandaran", tanggal_lahir: "2014-02-22", jenis_kelamin: "L", agama: "Islam", alamat: "Jl. Teratai No. 9", nama_ayah: "Abdillah", nama_ibu: "Ruqayyah", nama_wali: null, hp_ortu: "081300000009", kelas_id: "k1", jenjang: "MI", fase: "B", status: "aktif", foto_url: null, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
  { id: "s10", nis: "2410", nisn: "0081234010", nama: "Maryam Salsabila", tempat_lahir: "Ciamis", tanggal_lahir: "2014-08-05", jenis_kelamin: "P", agama: "Islam", alamat: "Jl. Sakura No. 10", nama_ayah: "Salman", nama_ibu: "Safiyyah", nama_wali: null, hp_ortu: "081300000010", kelas_id: "k1", jenjang: "MI", fase: "B", status: "aktif", foto_url: null, madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
];

const defaultMapel: MataPelajaran[] = [
  { id: "m1", nama: "Matematika", kelompok: "Umum", jenjang: "MI", madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
  { id: "m2", nama: "Bahasa Indonesia", kelompok: "Umum", jenjang: "MI", madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
  { id: "m3", nama: "Al-Quran Hadis", kelompok: "Pendidikan Agama Islam", jenjang: "MI", madrasah_id: MADRASAH_ID, created_at: "", updated_at: "" },
];

const defaultCP: CapaianPembelajaran[] = [
  { id: "cp1", mapel_id: "m1", fase: "B", jenjang: "MI", deskripsi: "Peserta didik dapat menyelesaikan masalah yang berkaitan dengan operasi hitung bilangan cacah, pecahan sederhana, pengukuran, dan geometri dasar.", created_at: "", updated_at: "" },
  { id: "cp2", mapel_id: "m2", fase: "B", jenjang: "MI", deskripsi: "Peserta didik dapat memahami, mengolah, dan menyajikan informasi dari teks narasi, deskripsi, dan instruksi dalam bahasa Indonesia.", created_at: "", updated_at: "" },
  { id: "cp3", mapel_id: "m3", fase: "B", jenjang: "MI", deskripsi: "Peserta didik dapat membaca, menghafal, dan memahami kandungan ayat-ayat Al-Quran dan Hadis pilihan.", created_at: "", updated_at: "" },
];

const defaultTP: TujuanPembelajaran[] = [
  { id: "tp1", cp_id: "cp1", kode: "MTK.B.1", deskripsi: "Menyelesaikan operasi penjumlahan dan pengurangan bilangan cacah sampai 10.000", urutan: 1, created_at: "", updated_at: "" },
  { id: "tp2", cp_id: "cp1", kode: "MTK.B.2", deskripsi: "Menyelesaikan operasi perkalian dan pembagian bilangan cacah", urutan: 2, created_at: "", updated_at: "" },
  { id: "tp3", cp_id: "cp1", kode: "MTK.B.3", deskripsi: "Mengenal dan menentukan pecahan sederhana", urutan: 3, created_at: "", updated_at: "" },
  { id: "tp4", cp_id: "cp2", kode: "BI.B.1", deskripsi: "Membaca dan memahami isi teks narasi dengan lancar", urutan: 1, created_at: "", updated_at: "" },
  { id: "tp5", cp_id: "cp2", kode: "BI.B.2", deskripsi: "Menulis paragraf deskripsi dengan kalimat yang runtut dan padu", urutan: 2, created_at: "", updated_at: "" },
  { id: "tp6", cp_id: "cp3", kode: "QH.B.1", deskripsi: "Membaca surah-surah pendek dengan tajwid yang benar", urutan: 1, created_at: "", updated_at: "" },
  { id: "tp7", cp_id: "cp3", kode: "QH.B.2", deskripsi: "Menghafal surah Al-Fatihah sampai An-Nas dengan lancar", urutan: 2, created_at: "", updated_at: "" },
];

const defaultNilai: Nilai[] = [
  { id: "n1", siswa_id: "s1", mapel_id: "m1", kelas_id: "k1", tp_id: "tp1", semester: 1, tahun_pelajaran: "2024/2025", nilai_formatif: 90, nilai_sumatif: 88, nilai_proyek: 92, nilai_akhir: 90, predikat: "A", catatan_formatif: "Sangat aktif dalam diskusi", created_at: "", updated_at: "" },
  { id: "n2", siswa_id: "s1", mapel_id: "m1", kelas_id: "k1", tp_id: "tp2", semester: 1, tahun_pelajaran: "2024/2025", nilai_formatif: 85, nilai_sumatif: 88, nilai_proyek: 90, nilai_akhir: 88, predikat: "A", catatan_formatif: null, created_at: "", updated_at: "" },
  { id: "n3", siswa_id: "s2", mapel_id: "m1", kelas_id: "k1", tp_id: "tp1", semester: 1, tahun_pelajaran: "2024/2025", nilai_formatif: 78, nilai_sumatif: 75, nilai_proyek: 80, nilai_akhir: 78, predikat: "B", catatan_formatif: "Perlu lebih teliti", created_at: "", updated_at: "" },
  { id: "n4", siswa_id: "s2", mapel_id: "m1", kelas_id: "k1", tp_id: "tp2", semester: 1, tahun_pelajaran: "2024/2025", nilai_formatif: 80, nilai_sumatif: 82, nilai_proyek: 78, nilai_akhir: 80, predikat: "B", catatan_formatif: null, created_at: "", updated_at: "" },
  { id: "n5", siswa_id: "s3", mapel_id: "m1", kelas_id: "k1", tp_id: "tp1", semester: 1, tahun_pelajaran: "2024/2025", nilai_formatif: 65, nilai_sumatif: 60, nilai_proyek: 68, nilai_akhir: 64, predikat: "D", catatan_formatif: "Perlu pendampingan intensif", created_at: "", updated_at: "" },
  { id: "n6", siswa_id: "s3", mapel_id: "m1", kelas_id: "k1", tp_id: "tp2", semester: 1, tahun_pelajaran: "2024/2025", nilai_formatif: 60, nilai_sumatif: 65, nilai_proyek: 62, nilai_akhir: 62, predikat: "D", catatan_formatif: null, created_at: "", updated_at: "" },
  { id: "n7", siswa_id: "s4", mapel_id: "m1", kelas_id: "k1", tp_id: "tp1", semester: 1, tahun_pelajaran: "2024/2025", nilai_formatif: 92, nilai_sumatif: 90, nilai_proyek: 95, nilai_akhir: 92, predikat: "A", catatan_formatif: "Sangat teliti dan rajin", created_at: "", updated_at: "" },
  { id: "n8", siswa_id: "s5", mapel_id: "m1", kelas_id: "k1", tp_id: "tp1", semester: 1, tahun_pelajaran: "2024/2025", nilai_formatif: 75, nilai_sumatif: 78, nilai_proyek: 72, nilai_akhir: 75, predikat: "B", catatan_formatif: null, created_at: "", updated_at: "" },
  { id: "n9", siswa_id: "s6", mapel_id: "m1", kelas_id: "k1", tp_id: "tp1", semester: 1, tahun_pelajaran: "2024/2025", nilai_formatif: 85, nilai_sumatif: 88, nilai_proyek: 82, nilai_akhir: 85, predikat: "A", catatan_formatif: null, created_at: "", updated_at: "" },
  { id: "n10", siswa_id: "s7", mapel_id: "m1", kelas_id: "k1", tp_id: "tp1", semester: 1, tahun_pelajaran: "2024/2025", nilai_formatif: 70, nilai_sumatif: 72, nilai_proyek: 68, nilai_akhir: 70, predikat: "C", catatan_formatif: "Perlu latihan lebih", created_at: "", updated_at: "" },
  { id: "n11", siswa_id: "s8", mapel_id: "m1", kelas_id: "k1", tp_id: "tp1", semester: 1, tahun_pelajaran: "2024/2025", nilai_formatif: 88, nilai_sumatif: 85, nilai_proyek: 90, nilai_akhir: 88, predikat: "A", catatan_formatif: null, created_at: "", updated_at: "" },
  { id: "n12", siswa_id: "s9", mapel_id: "m1", kelas_id: "k1", tp_id: "tp1", semester: 1, tahun_pelajaran: "2024/2025", nilai_formatif: 76, nilai_sumatif: 74, nilai_proyek: 78, nilai_akhir: 76, predikat: "B", catatan_formatif: null, created_at: "", updated_at: "" },
  { id: "n13", siswa_id: "s10", mapel_id: "m1", kelas_id: "k1", tp_id: "tp1", semester: 1, tahun_pelajaran: "2024/2025", nilai_formatif: 90, nilai_sumatif: 92, nilai_proyek: 88, nilai_akhir: 90, predikat: "A", catatan_formatif: "Sangat baik", created_at: "", updated_at: "" },
];

function getStore<T>(key: string, defaults: T[]): T[] {
  if (typeof window === "undefined") return defaults;
  try {
    const stored = localStorage.getItem(`rdm_${key}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  localStorage.setItem(`rdm_${key}`, JSON.stringify(defaults));
  return defaults;
}

function setStore<T>(key: string, data: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`rdm_${key}`, JSON.stringify(data));
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

function setStoreObj<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`rdm_${key}`, JSON.stringify(data));
}

// Public API
export const demoStore = {
  getMadrasah: () => getStoreObj<Madrasah>("madrasah", defaultMadrasah),
  setMadrasah: (m: Madrasah) => setStoreObj("madrasah", m),

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
