// Generator Deskripsi Raport Otomatis - Utility Functions
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Nilai, TujuanPembelajaran, PredikatLabel } from "@/lib/types";

// ========================================
// Helper: nilai 0-100 -> predikat huruf + label
// ========================================
export function nilaiToPredikat(nilai: number | null | undefined): { huruf: string; label: PredikatLabel | "-" } {
  if (nilai === null || nilai === undefined || isNaN(nilai)) return { huruf: "-", label: "-" };
  if (nilai >= 90) return { huruf: "A", label: "Sangat Baik" };
  if (nilai >= 80) return { huruf: "B", label: "Baik" };
  if (nilai >= 70) return { huruf: "C", label: "Cukup" };
  return { huruf: "D", label: "Kurang" };
}

interface GenerateParams {
  namaSiswa: string;
  namaMapel: string;
  nilaiAkhir: number;
  tpTertinggi: TujuanPembelajaran | null;
  tpTerendah: TujuanPembelajaran | null;
  catatanFormatif: string | null;
  dimensiProfil: string;
  pancaCinta: string;
  metode: "cp" | "tp" | "materi";
  cpDeskripsi?: string;
  materiDeskripsi?: string;
}

export function generateDeskripsi(params: GenerateParams): string {
  const {
    namaSiswa,
    namaMapel,
    nilaiAkhir,
    tpTertinggi,
    tpTerendah,
    dimensiProfil,
    pancaCinta,
    metode,
    cpDeskripsi,
    materiDeskripsi,
  } = params;

  const nama = `Ananda ${namaSiswa}`;

  if (nilaiAkhir >= 85) {
    return generateTinggi(nama, namaMapel, tpTertinggi, dimensiProfil, pancaCinta, metode, cpDeskripsi, materiDeskripsi);
  } else if (nilaiAkhir >= 70) {
    return generateSedang(nama, namaMapel, tpTertinggi, tpTerendah, dimensiProfil, pancaCinta, metode, cpDeskripsi, materiDeskripsi);
  } else {
    return generateRendah(nama, namaMapel, tpTerendah, dimensiProfil, pancaCinta, metode, cpDeskripsi, materiDeskripsi);
  }
}

function generateTinggi(
  nama: string, mapel: string, tpTertinggi: TujuanPembelajaran | null,
  dimensi: string, pancaCinta: string, metode: string,
  cpDeskripsi?: string, materiDeskripsi?: string
): string {
  const kompetensi = metode === "cp" && cpDeskripsi
    ? cpDeskripsi
    : metode === "materi" && materiDeskripsi
    ? materiDeskripsi
    : tpTertinggi?.deskripsi || `materi ${mapel}`;

  return `${nama} menunjukkan penguasaan yang sangat baik pada mata pelajaran ${mapel}. ${nama} mampu ${kompetensi.toLowerCase()} dengan percaya diri, aktif, dan bertanggung jawab. Capaian ini menunjukkan berkembangnya dimensi ${dimensi} serta penguatan nilai ${pancaCinta}. Pertahankan semangat belajar dan terus kembangkan potensi yang dimiliki.`;
}

function generateSedang(
  nama: string, mapel: string, tpTertinggi: TujuanPembelajaran | null,
  tpTerendah: TujuanPembelajaran | null, dimensi: string, pancaCinta: string,
  metode: string, cpDeskripsi?: string, materiDeskripsi?: string
): string {
  const capaianBaik = metode === "cp" && cpDeskripsi
    ? cpDeskripsi
    : tpTertinggi?.deskripsi || `sebagian besar materi ${mapel}`;

  const perluDitingkatkan = tpTerendah?.deskripsi || `beberapa aspek dalam ${mapel}`;

  return `${nama} menunjukkan capaian yang baik dalam mata pelajaran ${mapel}. ${nama} mampu ${capaianBaik.toLowerCase()}. Pada aspek ${perluDitingkatkan.toLowerCase()}, ${nama} masih perlu bimbingan dan latihan berkelanjutan agar lebih memahami materi tersebut. Sikap belajar ${nama} menunjukkan nilai ${pancaCinta} yang terus berkembang. Dengan latihan yang konsisten dan pendampingan, diharapkan dapat mencapai hasil yang lebih optimal.`;
}

function generateRendah(
  nama: string, mapel: string, tpTerendah: TujuanPembelajaran | null,
  dimensi: string, pancaCinta: string, metode: string,
  cpDeskripsi?: string, materiDeskripsi?: string
): string {
  const aspekPerlu = tpTerendah?.deskripsi || `materi ${mapel}`;

  return `${nama} mulai menunjukkan perkembangan dalam memahami mata pelajaran ${mapel}. ${nama} masih memerlukan bimbingan pada aspek ${aspekPerlu.toLowerCase()}. Guru dan orang tua diharapkan dapat memberikan pendampingan melalui latihan bertahap, penguatan motivasi, dan pembiasaan belajar yang menyenangkan. Dengan dukungan yang tepat, ${nama} diharapkan dapat mengembangkan dimensi ${dimensi} dan nilai ${pancaCinta} secara optimal.`;
}

export function hitungNilaiAkhir(nilaiList: Nilai[]): number {
  if (nilaiList.length === 0) return 0;
  const total = nilaiList.reduce((sum, n) => sum + (n.nilai_akhir || 0), 0);
  return Math.round(total / nilaiList.length);
}

export function getPredikat(nilai: number): string {
  if (nilai >= 90) return "A";
  if (nilai >= 80) return "B";
  if (nilai >= 70) return "C";
  if (nilai >= 60) return "D";
  return "E";
}

// ========================================
// Generator deskripsi Kokurikuler & Ekstrakurikuler
// ========================================
interface KegiatanItem {
  nama_kegiatan: string;
  nilai: number | null;
  keterangan?: string | null;
}

export function generateDeskripsiKokurikuler(params: {
  namaSiswa: string;
  kegiatan: KegiatanItem[];
}): string {
  const { namaSiswa, kegiatan } = params;
  const nama = `Ananda ${namaSiswa}`;
  if (!kegiatan || kegiatan.length === 0) {
    return `${nama} belum tercatat mengikuti kegiatan kokurikuler pada semester ini.`;
  }

  // Cari kegiatan dengan nilai tertinggi (kalau ada nilai)
  const withNilai = kegiatan.filter(k => k.nilai !== null && k.nilai !== undefined);
  const tertinggi = withNilai.length > 0
    ? withNilai.reduce((acc, cur) => (cur.nilai! > (acc.nilai ?? 0) ? cur : acc))
    : null;
  const rataRata = withNilai.length > 0
    ? Math.round(withNilai.reduce((s, k) => s + (k.nilai || 0), 0) / withNilai.length)
    : null;

  const daftar = kegiatan.map(k => k.nama_kegiatan).join(", ");
  const labelTertinggi = tertinggi ? nilaiToPredikat(tertinggi.nilai).label : null;

  if (rataRata !== null && rataRata >= 85) {
    return `${nama} menunjukkan partisipasi yang sangat aktif dan kreatif dalam kegiatan kokurikuler ${daftar}. Penampilan dan hasil karya pada kegiatan ${tertinggi?.nama_kegiatan} terbilang ${labelTertinggi?.toLowerCase()}, mencerminkan kemandirian, kerja sama, serta penerapan dimensi Profil Lulusan dan Nilai Cinta secara nyata. Pertahankan semangat berkarya.`;
  }
  if (rataRata !== null && rataRata >= 70) {
    return `${nama} terlibat dengan baik dalam kegiatan kokurikuler ${daftar}. Pada ${tertinggi?.nama_kegiatan}, ${nama} menunjukkan capaian yang ${labelTertinggi?.toLowerCase()}. Dorongan untuk lebih konsisten dan berani berinisiatif akan membantu pengembangan dimensi profil pelajar yang lebih utuh.`;
  }
  if (rataRata !== null) {
    return `${nama} mulai mengenal dan terlibat dalam kegiatan kokurikuler ${daftar}. Diperlukan pendampingan agar lebih percaya diri, aktif, dan mampu mengaitkan kegiatan dengan nilai-nilai Profil Lulusan dan Nilai Cinta.`;
  }
  // tanpa nilai
  return `${nama} mengikuti kegiatan kokurikuler ${daftar} sesuai jadwal madrasah. Partisipasi yang konsisten diharapkan dapat terus dipertahankan.`;
}

export function generateDeskripsiEkstrakurikuler(params: {
  namaSiswa: string;
  kegiatan: KegiatanItem[];
}): string {
  const { namaSiswa, kegiatan } = params;
  const nama = `Ananda ${namaSiswa}`;
  if (!kegiatan || kegiatan.length === 0) {
    return `${nama} belum tercatat mengikuti kegiatan ekstrakurikuler pada semester ini.`;
  }

  const withNilai = kegiatan.filter(k => k.nilai !== null && k.nilai !== undefined);
  const tertinggi = withNilai.length > 0
    ? withNilai.reduce((acc, cur) => (cur.nilai! > (acc.nilai ?? 0) ? cur : acc))
    : null;
  const rataRata = withNilai.length > 0
    ? Math.round(withNilai.reduce((s, k) => s + (k.nilai || 0), 0) / withNilai.length)
    : null;

  const daftar = kegiatan.map(k => k.nama_kegiatan).join(", ");
  const labelTertinggi = tertinggi ? nilaiToPredikat(tertinggi.nilai).label : null;

  if (rataRata !== null && rataRata >= 85) {
    return `${nama} aktif mengikuti kegiatan ekstrakurikuler ${daftar} dengan capaian yang sangat baik. Pada ${tertinggi?.nama_kegiatan}, ${nama} menunjukkan keterampilan dan disiplin yang ${labelTertinggi?.toLowerCase()}. Bakat, minat, serta kemampuan kerja sama yang ditampilkan patut diapresiasi dan terus dikembangkan.`;
  }
  if (rataRata !== null && rataRata >= 70) {
    return `${nama} mengikuti kegiatan ekstrakurikuler ${daftar} dengan baik. Pada ${tertinggi?.nama_kegiatan}, capaian ${nama} tergolong ${labelTertinggi?.toLowerCase()}. Latihan dan kehadiran yang konsisten akan semakin mengasah keterampilan yang dimiliki.`;
  }
  if (rataRata !== null) {
    return `${nama} mulai mengikuti kegiatan ekstrakurikuler ${daftar}. Diperlukan motivasi dan pendampingan agar ${nama} lebih disiplin, aktif berlatih, dan mampu menampilkan keterampilan secara lebih optimal.`;
  }
  return `${nama} terdaftar pada kegiatan ekstrakurikuler ${daftar}. Diharapkan kehadiran dan partisipasi tetap dijaga.`;
}

export function generateCatatanWaliKelas(params: {
  namaSiswa: string;
  rataRata: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  rataKoko?: number | null;
  rataEkskul?: number | null;
  kegiatanKoko?: string[];
  kegiatanEkskul?: string[];
}): string {
  const { namaSiswa, rataRata, alpa, rataKoko, rataEkskul, kegiatanKoko, kegiatanEkskul } = params;
  const nama = `Ananda ${namaSiswa}`;

  // 1. Bagian akademik (intrakurikuler)
  let catatan = "";
  if (rataRata >= 85) {
    catatan = `${nama} menunjukkan perkembangan belajar yang sangat baik selama semester ini. Prestasi akademik yang diraih patut diapresiasi.`;
  } else if (rataRata >= 70) {
    catatan = `${nama} menunjukkan perkembangan belajar yang baik selama semester ini. Terus tingkatkan kedisiplinan, kemandirian, dan semangat belajar agar capaian pada semester berikutnya semakin optimal.`;
  } else {
    catatan = `${nama} perlu meningkatkan motivasi dan kedisiplinan belajar. Dengan pendampingan yang lebih intensif dari guru dan orang tua, diharapkan capaian belajar pada semester berikutnya dapat meningkat.`;
  }

  // 2. Bagian kokurikuler
  if (rataKoko !== null && rataKoko !== undefined && !isNaN(rataKoko) && rataKoko > 0) {
    const dafKoko = kegiatanKoko && kegiatanKoko.length > 0 ? ` (${kegiatanKoko.slice(0, 2).join(", ")})` : "";
    if (rataKoko >= 85) {
      catatan += ` Pada kegiatan kokurikuler${dafKoko}, ${nama} menunjukkan kreativitas, kolaborasi, dan tanggung jawab yang sangat baik.`;
    } else if (rataKoko >= 70) {
      catatan += ` Partisipasi pada kegiatan kokurikuler${dafKoko} berjalan baik dan dapat ditingkatkan dengan keterlibatan yang lebih aktif.`;
    } else {
      catatan += ` Keterlibatan pada kegiatan kokurikuler${dafKoko} masih perlu didorong agar lebih konsisten dan bersemangat.`;
    }
  }

  // 3. Bagian ekstrakurikuler
  if (rataEkskul !== null && rataEkskul !== undefined && !isNaN(rataEkskul) && rataEkskul > 0) {
    const dafEks = kegiatanEkskul && kegiatanEkskul.length > 0 ? ` (${kegiatanEkskul.slice(0, 2).join(", ")})` : "";
    if (rataEkskul >= 85) {
      catatan += ` Pada kegiatan ekstrakurikuler${dafEks}, bakat, minat, dan disiplin ${nama} berkembang dengan sangat baik.`;
    } else if (rataEkskul >= 70) {
      catatan += ` Pada kegiatan ekstrakurikuler${dafEks}, ${nama} menunjukkan minat yang baik dan diharapkan terus berlatih.`;
    } else {
      catatan += ` Pada kegiatan ekstrakurikuler${dafEks}, kehadiran dan latihan masih perlu ditingkatkan.`;
    }
  }

  // 4. Catatan kehadiran
  if (alpa > 3) {
    catatan += ` Perlu diperhatikan tingkat kehadiran yang masih perlu ditingkatkan.`;
  }

  return catatan;
}

// ========================================
// Preset Nama Kegiatan kokurikuler (Projek Profil Lulusan / P5)
// Dipakai sebagai opsi dropdown di form input kokurikuler.
// ========================================
export const PRESET_NAMA_KEGIATAN_KOKURIKULER: string[] = [
  "Projek Profil Lulusan: Bhinneka Tunggal Ika",
  "Projek Profil Lulusan: Suara Demokrasi",
  "Projek Profil Lulusan: Gaya Hidup Berkelanjutan",
  "Projek Profil Lulusan: Kearifan Lokal",
  "Projek Profil Lulusan: Bangunlah Jiwa dan Raganya",
  "Projek Profil Lulusan: Berekayasa dan Berteknologi untuk NKRI",
  "Projek Profil Lulusan: Kewirausahaan",
  "Projek Profil Lulusan: Cinta Allah & Rasul",
  "Projek Profil Lulusan: Cinta Ilmu",
  "Projek Profil Lulusan: Cinta Sesama & Lingkungan",
  "Pesantren Ramadhan / Pondok Ramadhan",
  "Manasik Haji",
  "Bakti Sosial",
  "Studi Wisata / Karya Wisata",
  "Outbound / Outing Class",
  "Peringatan Hari Besar Islam (PHBI)",
  "Peringatan Hari Besar Nasional (PHBN)",
  "Class Meeting",
  "Pekan Kreativitas Siswa",
  "Lomba antar Kelas / Madrasah",
];

// ========================================
// Preset keterangan kokurikuler (Tema P5 / Profil Lulusan KBC)
// Dipakai sebagai opsi dropdown di form input kokurikuler.
// ========================================
export const PRESET_KETERANGAN_KOKURIKULER: string[] = [
  "Tema: Bhinneka Tunggal Ika - dimensi berkebinekaan global",
  "Tema: Suara Demokrasi - dimensi bernalar kritis",
  "Tema: Gaya Hidup Berkelanjutan - dimensi peduli lingkungan",
  "Tema: Kearifan Lokal - dimensi cinta tanah air",
  "Tema: Bangunlah Jiwa dan Raganya - dimensi mandiri & sehat",
  "Tema: Berekayasa dan Berteknologi untuk NKRI",
  "Tema: Kewirausahaan - dimensi kreatif & gotong royong",
  "Tema: Profil Pelajar Pancasila - berakhlak mulia & gotong royong",
  "Tema: Profil Lulusan KBC - cinta Allah, Rasul, ilmu, sesama, & lingkungan",
  "Penguatan karakter rahmatan lil alamin",
];

// ========================================
// Preset keterangan ekstrakurikuler (peran/prestasi/keterampilan)
// ========================================
export const PRESET_KETERANGAN_EKSTRAKURIKULER: string[] = [
  "Aktif sebagai anggota, kehadiran & disiplin baik",
  "Aktif sebagai anggota, perlu peningkatan keterampilan",
  "Berpartisipasi sebagai pengurus inti",
  "Mengikuti lomba tingkat madrasah",
  "Mengikuti lomba tingkat kecamatan/kabupaten",
  "Mengikuti lomba tingkat provinsi/nasional",
  "Meraih prestasi tingkat madrasah",
  "Meraih prestasi tingkat kabupaten/provinsi",
  "Pengembangan bakat & minat sesuai potensi",
  "Penguatan disiplin, kerja sama, & kepemimpinan",
];
