"use client";

import { useState } from "react";
import {
  BookOpenCheck,
  Home,
  School,
  Users as UsersIcon,
  GraduationCap,
  BookOpen,
  Layers,
  Target,
  ClipboardList,
  PenTool,
  CalendarCheck,
  Trophy,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  Settings,
  KeyRound,
  ShoppingCart,
  RefreshCw,
} from "lucide-react";

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}

export default function PanduanClient() {
  const [active, setActive] = useState("intro");

  const sections: Section[] = [
    {
      id: "intro",
      icon: <Home size={16} />,
      title: "Pengantar",
      body: (
        <>
          <p className="mb-3">
            Aplikasi <strong>Raport Digital Madrasah KBC</strong> adalah aplikasi rapor digital berbasis web yang dirancang
            untuk madrasah (MI/MTs/MA) dengan kurikulum berbasis kompetensi (KBC) dan Profil Lulusan/Pancacinta.
          </p>
          <p className="mb-3">
            Aplikasi ini berjalan sepenuhnya di browser Anda. Semua data tersimpan secara lokal (localStorage) tanpa
            memerlukan server, koneksi internet hanya dibutuhkan saat pertama kali membuka aplikasi.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900">
            💡 <strong>Tips:</strong> Lakukan <em>Backup data</em> rutin via menu <strong>Import/Export</strong> agar data tetap aman.
          </div>
        </>
      ),
    },
    {
      id: "lisensi",
      icon: <KeyRound size={16} />,
      title: "Lisensi & Aktivasi",
      body: (
        <>
          <p className="mb-3">Aplikasi memiliki 3 tingkatan akses:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm mb-3">
            <li><strong>TRIAL</strong> — gratis 5 hari setelah daftar, semua fitur terbuka</li>
            <li><strong>FULL</strong> — lifetime, harus aktivasi dengan kode FULL dari admin</li>
            <li><strong>ADMIN</strong> — kelola user, kode aktivasi, dan pengaturan pembelian</li>
          </ul>
          <p className="mb-3 font-semibold">Cara aktivasi:</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>Daftar akun via halaman <code>/register</code></li>
            <li>Login → semua fitur terbuka selama 5 hari (trial)</li>
            <li>Setelah trial habis, fitur read-only (tidak bisa simpan/edit)</li>
            <li>Beli lisensi FULL → dapat kode aktivasi dari admin via WhatsApp</li>
            <li>Buka menu <strong>Beli Lisensi</strong> → masukkan kode → klik Aktifkan</li>
          </ol>
        </>
      ),
    },
    {
      id: "madrasah",
      icon: <School size={16} />,
      title: "Setup Awal: Data Madrasah",
      body: (
        <>
          <p className="mb-3 font-semibold">Langkah pertama setelah login:</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm mb-3">
            <li>Buka menu <strong>Data Madrasah</strong></li>
            <li>Isi: Nama Madrasah, NSM, NPSN, Alamat, Desa, Kecamatan, Kabupaten, Provinsi</li>
            <li>Isi: Nama Kepala Madrasah & NIP</li>
            <li>Upload logo/kop madrasah (opsional, untuk cetak raport)</li>
            <li>Tentukan Tahun Pelajaran dan Semester aktif</li>
            <li>Klik <strong>Simpan</strong></li>
          </ol>
          <p className="text-sm">Data ini akan muncul di header raport saat dicetak.</p>
        </>
      ),
    },
    {
      id: "guru",
      icon: <UsersIcon size={16} />,
      title: "Data Guru",
      body: (
        <>
          <p className="mb-3">Menu <strong>Data Guru</strong> untuk mendaftar guru/pendidik di madrasah.</p>
          <p className="mb-2 font-semibold">Isi per guru:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Nama lengkap (dengan gelar)</li>
            <li>NIP / NUPTK</li>
            <li>Jabatan (cth: Wali Kelas IV, Guru Matematika)</li>
            <li>HP & Email (opsional)</li>
          </ul>
          <p className="text-sm mt-3">
            Guru yang dijadikan <strong>Wali Kelas</strong> akan dipilih saat membuat data Kelas/Rombel.
          </p>
        </>
      ),
    },
    {
      id: "siswa",
      icon: <GraduationCap size={16} />,
      title: "Data Siswa & Buku Induk",
      body: (
        <>
          <p className="mb-3">Menu <strong>Data Siswa</strong> menggunakan format Buku Induk lengkap dengan 5 tab:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm mb-3">
            <li><strong>A. Identitas</strong> — NIS, NISN, nama, TTL, jenis kelamin, agama, alamat, foto</li>
            <li><strong>B. Ayah Kandung</strong> — nama, TTL, agama, kewarganegaraan, pendidikan, pekerjaan, alamat</li>
            <li><strong>C. Ibu Kandung</strong> — sama seperti ayah</li>
            <li><strong>D. Wali</strong> — opsional, kalau bukan ortu kandung</li>
            <li><strong>E. Akademik</strong> — kelas, status (aktif/lulus/keluar)</li>
          </ul>
          <p className="text-sm">
            Menu <strong>Buku Induk</strong> menampilkan ringkasan lengkap per siswa (semua sekaligus dengan section A-I termasuk
            kokurikuler, ekstrakurikuler, presensi) dan bisa langsung dicetak.
          </p>
        </>
      ),
    },
    {
      id: "kelas-mapel",
      icon: <Layers size={16} />,
      title: "Kelas & Mata Pelajaran",
      body: (
        <>
          <p className="mb-3"><strong>Kelas / Rombel:</strong></p>
          <ul className="list-disc pl-5 space-y-1 text-sm mb-3">
            <li>Pilih jenjang (MI/MTs/MA), tingkat, nama rombel (cth: IV-A)</li>
            <li>Tentukan wali kelas dari daftar Guru</li>
            <li>Set fase (A/B/C/D/E/F sesuai Kurikulum Merdeka)</li>
          </ul>
          <p className="mb-3"><strong>Mata Pelajaran:</strong></p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Tambah mapel sesuai kurikulum (Umum, Pendidikan Agama Islam, Bahasa Arab, dst.)</li>
            <li>Set kelompok mapel agar urutan di raport tertata</li>
          </ul>
        </>
      ),
    },
    {
      id: "cp-tp",
      icon: <Target size={16} />,
      title: "CP / TP / Materi",
      body: (
        <>
          <p className="mb-3">
            <strong>CP (Capaian Pembelajaran)</strong> dan <strong>TP (Tujuan Pembelajaran)</strong> adalah tulang punggung
            penilaian Kurikulum Merdeka.
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-sm mb-3">
            <li>Tambah CP per Mata Pelajaran dan per Fase</li>
            <li>Tambah TP turunan dari CP, dengan kode (cth: MTK.B.1) dan deskripsi</li>
            <li>TP inilah yang akan dinilai per siswa di menu Input Nilai</li>
          </ol>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">
            💡 Susun TP secara berurutan supaya raport tertata logis dari kompetensi dasar ke yang lebih kompleks.
          </div>
        </>
      ),
    },
    {
      id: "input-nilai",
      icon: <ClipboardList size={16} />,
      title: "Input Nilai",
      body: (
        <>
          <p className="mb-3">Menu <strong>Input Nilai</strong> untuk memasukkan nilai per TP per siswa.</p>
          <p className="mb-2 font-semibold">Cara input:</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm mb-3">
            <li>Pilih Kelas & Mata Pelajaran</li>
            <li>Sistem menampilkan tabel TP × Siswa</li>
            <li>Isi nilai Formatif, Sumatif, dan Proyek (skala 0-100)</li>
            <li>Sistem otomatis hitung Nilai Akhir + Predikat</li>
          </ol>
          <p className="mb-2 font-semibold">Skala Predikat:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>A</strong> ≥ 90 (Sangat Baik)</li>
            <li><strong>B</strong> ≥ 80 (Baik)</li>
            <li><strong>C</strong> ≥ 70 (Cukup)</li>
            <li><strong>D</strong> &lt; 70 (Perlu Bimbingan)</li>
          </ul>
        </>
      ),
    },
    {
      id: "deskripsi",
      icon: <PenTool size={16} />,
      title: "Deskripsi Otomatis",
      body: (
        <>
          <p className="mb-3">
            Menu <strong>Deskripsi Otomatis</strong> menghasilkan kalimat deskripsi rapor berdasarkan nilai TP siswa.
          </p>
          <p className="mb-2">Tab tersedia:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Mata Pelajaran</strong> — deskripsi naratif berdasarkan TP yang dikuasai/perlu bimbingan</li>
            <li><strong>Kokurikuler</strong> — deskripsi P5 / Profil Lulusan KBC</li>
            <li><strong>Ekstrakurikuler</strong> — deskripsi peran/prestasi</li>
          </ul>
          <p className="text-sm mt-3">User bisa edit hasil generator sebelum disimpan.</p>
        </>
      ),
    },
    {
      id: "presensi",
      icon: <CalendarCheck size={16} />,
      title: "Presensi",
      body: (
        <>
          <p className="mb-3">
            Menu <strong>Presensi</strong> untuk mencatat kehadiran siswa per semester.
          </p>
          <p className="mb-2">Isi per siswa:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Sakit (jumlah hari)</li>
            <li>Izin (jumlah hari)</li>
            <li>Tanpa keterangan / alpha (jumlah hari)</li>
          </ul>
          <p className="text-sm mt-3">Data ini akan tampil di rapor cetak Bagian E (Presensi).</p>
        </>
      ),
    },
    {
      id: "ekskul-koko",
      icon: <Trophy size={16} />,
      title: "Ekstrakurikuler & Kokurikuler",
      body: (
        <>
          <p className="mb-3"><strong>Ekstrakurikuler:</strong></p>
          <ul className="list-disc pl-5 space-y-1 text-sm mb-3">
            <li>Tambah kegiatan (Pramuka, PMR, Sepak Bola, dll.)</li>
            <li>Pilih siswa peserta + nilai 0-100 → predikat otomatis</li>
            <li>Keterangan via dropdown preset (10 peran/prestasi siap pakai) atau custom</li>
          </ul>
          <p className="mb-3"><strong>Kokurikuler (P5/Profil Lulusan KBC):</strong></p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Tambah kegiatan tema (cth: Aku Cinta Indonesia, Bhinneka Tunggal Ika)</li>
            <li>Input nilai 0-100 + keterangan dari 10 preset tema</li>
          </ul>
        </>
      ),
    },
    {
      id: "catatan",
      icon: <MessageSquare size={16} />,
      title: "Catatan Wali Kelas",
      body: (
        <>
          <p className="mb-3">
            Menu <strong>Catatan Wali Kelas</strong> untuk menulis catatan pribadi wali kelas per siswa.
          </p>
          <p className="mb-3 font-semibold">Fitur unggulan:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Tombol <strong>✨ Generate Otomatis Semua</strong> — generate catatan untuk semua siswa sekaligus</li>
            <li>Tombol <strong>✨ Generate</strong> per-siswa — kalau cuma mau update beberapa</li>
            <li>Catatan otomatis berisi 4 bagian: akademik, kokurikuler, ekstrakurikuler, kehadiran</li>
            <li>User tetap bisa edit manual sebelum disimpan</li>
          </ul>
        </>
      ),
    },
    {
      id: "validasi",
      icon: <ShieldCheck size={16} />,
      title: "Validasi Raport",
      body: (
        <>
          <p className="mb-3">
            Menu <strong>Validasi Raport</strong> untuk mengecek kelengkapan data sebelum cetak.
          </p>
          <p className="mb-2">Yang dicek:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Apakah semua siswa punya nilai untuk semua TP yang ada?</li>
            <li>Apakah ada nilai yang kosong/null?</li>
            <li>Apakah deskripsi sudah dibuat untuk semua siswa?</li>
            <li>Apakah presensi sudah lengkap?</li>
          </ul>
          <p className="text-sm mt-3">Lengkapi semua warning sebelum lanjut ke menu Cetak Raport.</p>
        </>
      ),
    },
    {
      id: "cetak",
      icon: <FileText size={16} />,
      title: "Cetak Raport",
      body: (
        <>
          <p className="mb-3">
            Menu <strong>Cetak Raport</strong> menghasilkan raport siap-print sesuai format Kurikulum Merdeka KBC.
          </p>
          <p className="mb-2 font-semibold">Format raport:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm mb-3">
            <li>Halaman identitas (data madrasah, siswa, wali kelas)</li>
            <li><strong>Bagian A:</strong> Mata Pelajaran (nilai akhir + predikat + deskripsi)</li>
            <li><strong>Bagian B:</strong> Projek Penguatan Profil Lulusan dan KBC (kokurikuler)</li>
            <li><strong>Bagian C:</strong> Ekstrakurikuler</li>
            <li><strong>Bagian D:</strong> Presensi</li>
            <li><strong>Bagian E:</strong> Catatan Wali Kelas</li>
          </ul>
          <p className="mb-3 font-semibold">Cara cetak:</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>Pilih siswa dari dropdown</li>
            <li>Klik tombol <strong>Cetak / Print</strong> (Ctrl+P)</li>
            <li>Pilih printer atau Save as PDF</li>
            <li>Format A4, margin 1cm</li>
          </ol>
        </>
      ),
    },
    {
      id: "import-export",
      icon: <FileSpreadsheet size={16} />,
      title: "Import / Export Data",
      body: (
        <>
          <p className="mb-3">
            Menu <strong>Import/Export</strong> untuk backup dan migrasi data.
          </p>
          <p className="mb-2 font-semibold">Export:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm mb-3">
            <li>Download semua data dalam format JSON (backup lengkap)</li>
            <li>Simpan file di tempat aman (Google Drive, dll.)</li>
          </ul>
          <p className="mb-2 font-semibold">Import:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Upload file JSON hasil export sebelumnya</li>
            <li>Sistem akan menggantikan data lokal saat ini</li>
          </ul>
          <div className="bg-rose-50 border border-rose-200 rounded p-3 text-sm text-rose-900 mt-3">
            ⚠️ <strong>Hati-hati:</strong> Import akan menimpa data yang ada. Selalu Export dulu sebelum Import.
          </div>
        </>
      ),
    },
    {
      id: "pengaturan",
      icon: <Settings size={16} />,
      title: "Pengaturan",
      body: (
        <>
          <p className="mb-3">
            Menu <strong>Pengaturan</strong> untuk konfigurasi profil & preferensi.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Ganti password akun</li>
            <li>Set tahun pelajaran & semester aktif</li>
            <li>Reset data ke default (hati-hati!)</li>
          </ul>
        </>
      ),
    },
    {
      id: "admin-users",
      icon: <UsersIcon size={16} />,
      title: "Admin: Kelola User",
      body: (
        <>
          <p className="mb-3 italic text-sm text-gray-600">Khusus role Admin.</p>
          <p className="mb-3">
            Tab <strong>Admin → Kelola User</strong> untuk melihat semua akun yang terdaftar.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Lihat status tier setiap user (TRIAL/FULL/ADMIN)</li>
            <li>Reset trial (kasih kesempatan trial baru)</li>
            <li>Upgrade manual ke FULL (tanpa kode)</li>
            <li>Hapus user</li>
          </ul>
        </>
      ),
    },
    {
      id: "admin-pembelian",
      icon: <ShoppingCart size={16} />,
      title: "Admin: Pengaturan Pembelian",
      body: (
        <>
          <p className="mb-3 italic text-sm text-gray-600">Khusus role Admin.</p>
          <p className="mb-3">
            Tab <strong>Admin → Pengaturan Pembelian</strong> untuk konfigurasi info yang muncul di halaman /beli-lisensi.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Nama Aplikasi & URL</li>
            <li>Nomor WhatsApp customer service</li>
            <li>Harga TRIAL & FULL</li>
            <li>Info Pembayaran (rekening bank)</li>
            <li>Template pesan order WhatsApp (placeholder: APP, URL, NAMA, NIP)</li>
            <li>Template distribusi kode (placeholder: KODE, APP, URL, NAMA, NIP)</li>
          </ul>
        </>
      ),
    },
    {
      id: "admin-sync",
      icon: <RefreshCw size={16} />,
      title: "Admin: Sinkronisasi",
      body: (
        <>
          <p className="mb-3 italic text-sm text-gray-600">Khusus role Admin.</p>
          <p className="mb-3">
            Tab <strong>Admin → Sinkronisasi</strong> untuk membuat kode aktivasi & pengaturan pembelian
            bisa diakses dari device manapun (cross-device sync via GitHub).
          </p>
          <p className="mb-2 font-semibold">Cara setup (sekali setup, lifetime):</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm mb-3">
            <li>Buka <code>github.com/settings/personal-access-tokens/new</code></li>
            <li>Token name: <code>RDMKBC Sync</code></li>
            <li>Repository access: Only select repositories → pilih repo aplikasi</li>
            <li>Permissions → Repository permissions → <strong>Contents: Read and write</strong></li>
            <li>Expiration: 1 tahun</li>
            <li>Generate token → copy → paste di tab Sinkronisasi → Simpan → Test → Push Sekarang</li>
          </ol>
          <p className="text-sm">
            Setelah setup, setiap kode yang di-generate atau pengaturan pembelian yang diubah otomatis push ke cloud (GitHub gh-pages).
            User di device manapun langsung lihat data terbaru.
          </p>
        </>
      ),
    },
    {
      id: "tips",
      icon: <Sparkles size={16} />,
      title: "Tips & Best Practice",
      body: (
        <>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Backup rutin:</strong> Export data minimal seminggu sekali, terutama menjelang akhir semester.</li>
            <li><strong>Setup awal terstruktur:</strong> Madrasah → Guru → Kelas → Mapel → CP/TP → Siswa → Nilai. Urut, jangan loncat.</li>
            <li><strong>Auto generate dulu, baru edit:</strong> Untuk deskripsi & catatan wali kelas, klik Generate dulu, baru poles manual. Hemat waktu.</li>
            <li><strong>Validasi sebelum cetak:</strong> Cek menu Validasi Raport untuk memastikan tidak ada data kosong.</li>
            <li><strong>Cetak ke PDF dulu:</strong> Sebelum print fisik, save as PDF untuk review hasil akhir.</li>
            <li><strong>Hati-hati Reset Data:</strong> Tombol reset di Pengaturan akan menghapus semua data. Selalu backup dulu.</li>
            <li><strong>Trial habis:</strong> Aplikasi masih bisa dibuka untuk lihat data lama (read-only). Aktivasi kode FULL untuk bisa edit lagi.</li>
          </ul>
        </>
      ),
    },
  ];

  const activeSection = sections.find((s) => s.id === active) ?? sections[0];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
        <BookOpenCheck size={24} className="text-primary-700" />
        Panduan Penggunaan Aplikasi
      </h1>
      <p className="text-sm text-gray-600 mb-5">
        Pelajari cara menggunakan setiap fitur aplikasi Raport Digital Madrasah KBC dari awal sampai cetak rapor.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        {/* Sidebar TOC */}
        <aside className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-2 mb-2">Daftar Isi</p>
          <ul className="space-y-0.5">
            {sections.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setActive(s.id)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded text-sm text-left transition-colors ${
                    active === s.id
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className={active === s.id ? "text-white" : "text-gray-500"}>{s.icon}</span>
                  <span className="truncate">{s.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Content */}
        <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            {activeSection.icon}
            {activeSection.title}
          </h2>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
            {activeSection.body}
          </div>
        </article>
      </div>

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-semibold mb-1">📞 Butuh bantuan lebih lanjut?</p>
        <p>
          Hubungi pengembang aplikasi via WhatsApp (lihat menu Beli Lisensi untuk no kontak) atau lewat group Pokjawas Kab. Jember.
        </p>
      </div>
    </div>
  );
}
