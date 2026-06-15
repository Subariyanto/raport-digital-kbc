export type UserRole =
  | "super_admin"
  | "admin_madrasah"
  | "kepala_madrasah"
  | "wali_kelas"
  | "guru_mapel"
  | "orang_tua";

export interface Madrasah {
  id: string;
  nama: string;
  nsm: string | null;
  npsn: string | null;
  alamat: string | null;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  provinsi: string | null;
  kepala_madrasah: string | null;
  nip_kepala: string | null;
  logo_url: string | null;
  kop_url: string | null;
  tahun_pelajaran: string | null;
  semester: number | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  nama: string;
  role: UserRole;
  madrasah_id: string | null;
  phone: string | null;
  created_at: string;
}

export interface Siswa {
  id: string;
  nis: string;
  nisn: string | null;
  nama: string;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  jenis_kelamin: "L" | "P";
  agama: string | null;
  alamat: string | null;
  nama_ayah: string | null;
  nama_ibu: string | null;
  nama_wali: string | null;
  hp_ortu: string | null;
  kelas_id: string | null;
  jenjang: string | null;
  fase: string | null;
  status: "aktif" | "tidak_aktif" | "lulus" | "pindah";
  foto_url: string | null;
  madrasah_id: string;
  created_at: string;
  updated_at: string;
}

export interface Guru {
  id: string;
  nama: string;
  nip_nuptk: string | null;
  jabatan: string | null;
  hp: string | null;
  email: string | null;
  user_id: string | null;
  madrasah_id: string;
  created_at: string;
  updated_at: string;
}

export interface Kelas {
  id: string;
  jenjang: string;
  tingkat: number;
  nama_rombel: string;
  wali_kelas_id: string | null;
  fase: string | null;
  tahun_pelajaran: string;
  semester: number;
  madrasah_id: string;
  created_at: string;
  updated_at: string;
  // Joined
  wali_kelas?: Guru;
}

export interface MataPelajaran {
  id: string;
  nama: string;
  kelompok: string | null;
  jenjang: string | null;
  madrasah_id: string;
  created_at: string;
  updated_at: string;
}

export interface CapaianPembelajaran {
  id: string;
  mapel_id: string;
  fase: string;
  jenjang: string | null;
  deskripsi: string;
  created_at: string;
  updated_at: string;
  // Joined
  tujuan_pembelajaran?: TujuanPembelajaran[];
}

export interface TujuanPembelajaran {
  id: string;
  cp_id: string;
  kode: string;
  deskripsi: string;
  urutan: number;
  created_at: string;
  updated_at: string;
  // Joined
  materi?: Materi[];
}

export interface Materi {
  id: string;
  tp_id: string;
  deskripsi: string;
  created_at: string;
  updated_at: string;
}

export interface GuruMapel {
  id: string;
  guru_id: string;
  mapel_id: string;
  kelas_id: string;
  created_at: string;
}

export interface DimensiProfilLulusan {
  id: string;
  nama: string;
}

export interface TopikPancaCinta {
  id: string;
  nama: string;
}

export interface Nilai {
  id: string;
  siswa_id: string;
  mapel_id: string;
  kelas_id: string;
  tp_id: string | null;
  semester: number;
  tahun_pelajaran: string;
  nilai_formatif: number | null;
  nilai_sumatif: number | null;
  nilai_proyek: number | null;
  nilai_akhir: number | null;
  predikat: string | null;
  catatan_formatif: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  tujuan_pembelajaran?: TujuanPembelajaran;
}

export interface DeskripsiRapor {
  id: string;
  siswa_id: string;
  mapel_id: string;
  kelas_id: string;
  semester: number;
  tahun_pelajaran: string;
  metode: "cp" | "tp" | "materi";
  deskripsi_text: string | null;
  is_locked: boolean;
  generated_at: string | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Presensi {
  id: string;
  siswa_id: string;
  kelas_id: string;
  semester: number;
  tahun_pelajaran: string;
  sakit: number;
  izin: number;
  alpa: number;
  hadir: number;
  madrasah_id: string;
  created_at: string;
  updated_at: string;
}

export type PredikatLabel = "Sangat Baik" | "Baik" | "Cukup" | "Kurang";

export interface Kokurikuler {
  id: string;
  siswa_id: string;
  kelas_id: string;
  semester: number;
  tahun_pelajaran: string;
  nama_kegiatan: string;
  // 0-100; predikat dihitung otomatis dari nilai
  nilai: number | null;
  predikat: PredikatLabel | null;
  keterangan: string | null;
  madrasah_id: string;
  created_at: string;
  updated_at: string;
}

export interface Ekstrakurikuler {
  id: string;
  siswa_id: string;
  kelas_id: string;
  semester: number;
  tahun_pelajaran: string;
  nama_kegiatan: string;
  // 0-100; predikat dihitung otomatis dari nilai (legacy: predikat tetap disimpan untuk backward compat)
  nilai: number | null;
  predikat: PredikatLabel | null;
  keterangan: string | null;
  madrasah_id: string;
  created_at: string;
  updated_at: string;
}

export interface CatatanWaliKelas {
  id: string;
  siswa_id: string;
  kelas_id: string;
  semester: number;
  tahun_pelajaran: string;
  catatan: string | null;
  is_generated: boolean;
  madrasah_id: string;
  created_at: string;
  updated_at: string;
}
