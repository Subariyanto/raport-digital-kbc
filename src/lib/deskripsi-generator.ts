// Generator Deskripsi Raport Otomatis - Utility Functions
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Nilai, TujuanPembelajaran } from "@/lib/types";

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

export function generateCatatanWaliKelas(params: {
  namaSiswa: string;
  rataRata: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
}): string {
  const { namaSiswa, rataRata, alpa } = params;
  const nama = `Ananda ${namaSiswa}`;

  let catatan = "";

  if (rataRata >= 85) {
    catatan = `${nama} menunjukkan perkembangan belajar yang sangat baik selama semester ini. Prestasi akademik yang diraih patut diapresiasi.`;
  } else if (rataRata >= 70) {
    catatan = `${nama} menunjukkan perkembangan belajar yang baik selama semester ini. Terus tingkatkan kedisiplinan, kemandirian, dan semangat belajar agar capaian pada semester berikutnya semakin optimal.`;
  } else {
    catatan = `${nama} perlu meningkatkan motivasi dan kedisiplinan belajar. Dengan pendampingan yang lebih intensif dari guru dan orang tua, diharapkan capaian belajar pada semester berikutnya dapat meningkat.`;
  }

  if (alpa > 3) {
    catatan += ` Perlu diperhatikan tingkat kehadiran yang masih perlu ditingkatkan.`;
  }

  return catatan;
}
