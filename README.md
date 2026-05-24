# Raport Digital Madrasah KBC

Aplikasi web raport digital untuk semua jenjang madrasah (RA, MI, MTs, MA, MAK) berbasis **Kurikulum Berbasis Cinta (KBC)**, sesuai Panduan Pembelajaran dan Asesmen Kemenag 2025.

## ✨ Fitur Utama (Fase 1)

- **Login Multi-Role** — Super Admin, Admin Madrasah, Kepala Madrasah, Wali Kelas, Guru Mapel, Orang Tua
- **Master Data** — Madrasah, Guru, Siswa, Kelas/Rombel, Mata Pelajaran
- **CP/TP/Materi** — Kelola Capaian Pembelajaran, Tujuan Pembelajaran per mapel per fase
- **Input Nilai** — Formatif, Sumatif, Proyek, dengan predikat otomatis
- **Generator Deskripsi Raport Otomatis** — Fitur utama! Generate deskripsi berdasarkan TP/CP/Materi
- **Multi-tenancy** — Setiap madrasah hanya melihat datanya sendiri (Row Level Security)

## 🛠 Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Form:** React Hook Form + Zod
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

## 🚀 Cara Menjalankan

### 1. Clone & Install

```bash
cd raport-digital-kbc
npm install
```

### 2. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Copy URL dan Anon Key dari Settings > API
3. Buat file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Jalankan Migration

Buka **SQL Editor** di Supabase Dashboard, lalu jalankan file-file berikut secara berurutan:

1. `supabase/migrations/001_schema.sql` — Buat semua tabel, RLS, dan trigger
2. `supabase/seed.sql` — Data dummy (1 madrasah, 5 guru, 10 siswa, 3 mapel, nilai)

### 4. Buat User Login

Di Supabase Dashboard > Authentication > Users, buat user baru:

- Email: `admin@mi-nurulhikmah.sch.id`
- Password: `password123`

Lalu di SQL Editor, insert ke tabel `users`:

```sql
INSERT INTO users (id, email, nama, role, madrasah_id)
VALUES (
  '<user-id-dari-auth>', -- copy dari Authentication > Users
  'admin@mi-nurulhikmah.sch.id',
  'Admin MI Nurul Hikmah',
  'admin_madrasah',
  '11111111-1111-1111-1111-111111111111'
);
```

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 📁 Struktur Folder

```
raport-digital-kbc/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Halaman dengan sidebar
│   │   │   ├── dashboard/        # Dashboard utama
│   │   │   ├── madrasah/         # Data madrasah
│   │   │   ├── guru/             # CRUD guru
│   │   │   ├── siswa/            # CRUD siswa
│   │   │   ├── kelas/            # CRUD kelas/rombel
│   │   │   ├── mata-pelajaran/   # CRUD mata pelajaran
│   │   │   ├── cp-tp/            # Kelola CP & TP
│   │   │   ├── input-nilai/      # Input nilai per siswa
│   │   │   ├── deskripsi-otomatis/ # Generator deskripsi raport
│   │   │   ├── cetak-raport/     # Cetak PDF (Fase 3)
│   │   │   └── layout.tsx        # Layout dengan sidebar
│   │   ├── login/                # Halaman login
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Redirect ke dashboard
│   ├── components/
│   │   └── Sidebar.tsx           # Sidebar navigasi responsif
│   ├── lib/
│   │   ├── supabase/             # Supabase client (browser + server + middleware)
│   │   ├── types.ts              # TypeScript interfaces
│   │   └── deskripsi-generator.ts # Logika generate deskripsi otomatis
│   └── middleware.ts             # Auth middleware
├── supabase/
│   ├── migrations/
│   │   └── 001_schema.sql        # Database schema + RLS
│   └── seed.sql                  # Data dummy
├── .env.local.example            # Template environment variables
├── tailwind.config.ts            # Konfigurasi warna hijau madrasah
└── package.json
```

## 🎨 Desain

- **Warna utama:** Hijau madrasah (#1B5E20) + putih
- **Responsive:** Mobile-first, sidebar hamburger di HP
- **Tabel:** Dengan pencarian dan filter
- **Notifikasi:** Toast sukses/gagal

## 📋 Roadmap

- [x] **Fase 1** — Foundation + Master Data + Generator Deskripsi Otomatis
- [ ] **Fase 2** — Presensi, Ekstrakurikuler, Catatan Wali Kelas Otomatis
- [ ] **Fase 3** — Cetak Raport PDF, Validasi (Guru → Wali Kelas → Kepsek → Kunci)
- [ ] **Fase 4** — Dashboard Grafik, Import/Export Excel, Dark Mode, Backup/Restore

## 📝 Catatan

- Generator deskripsi menggunakan template berbasis nilai (tinggi/sedang/rendah) dengan variabel TP, dimensi profil lulusan, dan Panca Cinta
- Deskripsi bisa diedit manual sebelum dikunci
- Setelah dikunci, hanya admin/kepala madrasah yang bisa membuka kembali
