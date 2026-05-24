-- ============================================
-- Raport Digital Madrasah KBC
-- Database Schema Migration
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABEL MADRASAH
-- ============================================
CREATE TABLE IF NOT EXISTS madrasah (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  nsm TEXT,
  npsn TEXT,
  alamat TEXT,
  desa TEXT,
  kecamatan TEXT,
  kabupaten TEXT,
  provinsi TEXT,
  kepala_madrasah TEXT,
  nip_kepala TEXT,
  logo_url TEXT,
  kop_url TEXT,
  tahun_pelajaran TEXT DEFAULT '2024/2025',
  semester INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TABEL USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nama TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin_madrasah', 'kepala_madrasah', 'wali_kelas', 'guru_mapel', 'orang_tua')),
  madrasah_id UUID REFERENCES madrasah(id) ON DELETE SET NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABEL GURU
-- ============================================
CREATE TABLE IF NOT EXISTS guru (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  nip_nuptk TEXT,
  jabatan TEXT,
  hp TEXT,
  email TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  madrasah_id UUID NOT NULL REFERENCES madrasah(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABEL KELAS
-- ============================================
CREATE TABLE IF NOT EXISTS kelas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jenjang TEXT NOT NULL,
  tingkat INTEGER NOT NULL,
  nama_rombel TEXT NOT NULL,
  wali_kelas_id UUID REFERENCES guru(id) ON DELETE SET NULL,
  fase TEXT,
  tahun_pelajaran TEXT NOT NULL DEFAULT '2024/2025',
  semester INTEGER NOT NULL DEFAULT 1,
  madrasah_id UUID NOT NULL REFERENCES madrasah(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TABEL SISWA
-- ============================================
CREATE TABLE IF NOT EXISTS siswa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nis TEXT NOT NULL,
  nisn TEXT,
  nama TEXT NOT NULL,
  tempat_lahir TEXT,
  tanggal_lahir DATE,
  jenis_kelamin TEXT NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
  agama TEXT,
  alamat TEXT,
  nama_ayah TEXT,
  nama_ibu TEXT,
  nama_wali TEXT,
  hp_ortu TEXT,
  kelas_id UUID REFERENCES kelas(id) ON DELETE SET NULL,
  jenjang TEXT,
  fase TEXT,
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'tidak_aktif', 'lulus', 'pindah')),
  foto_url TEXT,
  madrasah_id UUID NOT NULL REFERENCES madrasah(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. TABEL MATA PELAJARAN
-- ============================================
CREATE TABLE IF NOT EXISTS mata_pelajaran (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  kelompok TEXT,
  jenjang TEXT,
  madrasah_id UUID NOT NULL REFERENCES madrasah(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. TABEL GURU MAPEL (junction)
-- ============================================
CREATE TABLE IF NOT EXISTS guru_mapel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guru_id UUID NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
  mapel_id UUID NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guru_id, mapel_id, kelas_id)
);

-- ============================================
-- 8. TABEL CAPAIAN PEMBELAJARAN
-- ============================================
CREATE TABLE IF NOT EXISTS capaian_pembelajaran (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mapel_id UUID NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
  fase TEXT NOT NULL,
  jenjang TEXT,
  deskripsi TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. TABEL TUJUAN PEMBELAJARAN
-- ============================================
CREATE TABLE IF NOT EXISTS tujuan_pembelajaran (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cp_id UUID NOT NULL REFERENCES capaian_pembelajaran(id) ON DELETE CASCADE,
  kode TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. TABEL MATERI
-- ============================================
CREATE TABLE IF NOT EXISTS materi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tp_id UUID NOT NULL REFERENCES tujuan_pembelajaran(id) ON DELETE CASCADE,
  deskripsi TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. TABEL DIMENSI PROFIL LULUSAN (8 dimensi)
-- ============================================
CREATE TABLE IF NOT EXISTS dimensi_profil_lulusan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL UNIQUE
);

INSERT INTO dimensi_profil_lulusan (nama) VALUES
  ('Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia'),
  ('Berkebinekaan Global'),
  ('Bergotong Royong'),
  ('Mandiri'),
  ('Bernalar Kritis'),
  ('Kreatif'),
  ('Berjiwa Wirausaha'),
  ('Berkepribadian Luhur')
ON CONFLICT (nama) DO NOTHING;

-- ============================================
-- 12. TABEL TOPIK PANCA CINTA (5 topik)
-- ============================================
CREATE TABLE IF NOT EXISTS topik_panca_cinta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL UNIQUE
);

INSERT INTO topik_panca_cinta (nama) VALUES
  ('Cinta Allah dan Rasul'),
  ('Cinta Orang Tua dan Guru'),
  ('Cinta Sesama'),
  ('Cinta Ilmu'),
  ('Cinta Lingkungan')
ON CONFLICT (nama) DO NOTHING;

-- ============================================
-- 13. TABEL NILAI
-- ============================================
CREATE TABLE IF NOT EXISTS nilai (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
  mapel_id UUID NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  tp_id UUID REFERENCES tujuan_pembelajaran(id) ON DELETE SET NULL,
  semester INTEGER NOT NULL,
  tahun_pelajaran TEXT NOT NULL,
  nilai_formatif NUMERIC(5,2),
  nilai_sumatif NUMERIC(5,2),
  nilai_proyek NUMERIC(5,2),
  nilai_akhir NUMERIC(5,2),
  predikat TEXT,
  catatan_formatif TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14. TABEL DESKRIPSI RAPOR
-- ============================================
CREATE TABLE IF NOT EXISTS deskripsi_rapor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
  mapel_id UUID NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  tahun_pelajaran TEXT NOT NULL,
  metode TEXT NOT NULL CHECK (metode IN ('cp', 'tp', 'materi')),
  deskripsi_text TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(siswa_id, mapel_id, kelas_id, semester, tahun_pelajaran)
);

-- ============================================
-- 15. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE madrasah ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE mata_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE guru_mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE capaian_pembelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE tujuan_pembelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE materi ENABLE ROW LEVEL SECURITY;
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE deskripsi_rapor ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see data from their own madrasah
-- Super admin can see all

CREATE POLICY "Users view own madrasah" ON madrasah
  FOR ALL USING (
    id IN (SELECT madrasah_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users view own madrasah users" ON users
  FOR ALL USING (
    madrasah_id IN (SELECT madrasah_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    OR id = auth.uid()
  );

CREATE POLICY "Users view own madrasah guru" ON guru
  FOR ALL USING (
    madrasah_id IN (SELECT madrasah_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users view own madrasah kelas" ON kelas
  FOR ALL USING (
    madrasah_id IN (SELECT madrasah_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users view own madrasah siswa" ON siswa
  FOR ALL USING (
    madrasah_id IN (SELECT madrasah_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users view own madrasah mapel" ON mata_pelajaran
  FOR ALL USING (
    madrasah_id IN (SELECT madrasah_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users view own madrasah guru_mapel" ON guru_mapel
  FOR ALL USING (
    kelas_id IN (SELECT id FROM kelas WHERE madrasah_id IN (SELECT madrasah_id FROM users WHERE id = auth.uid()))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users view own madrasah cp" ON capaian_pembelajaran
  FOR ALL USING (
    mapel_id IN (SELECT id FROM mata_pelajaran WHERE madrasah_id IN (SELECT madrasah_id FROM users WHERE id = auth.uid()))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users view own madrasah tp" ON tujuan_pembelajaran
  FOR ALL USING (
    cp_id IN (SELECT id FROM capaian_pembelajaran WHERE mapel_id IN (SELECT id FROM mata_pelajaran WHERE madrasah_id IN (SELECT madrasah_id FROM users WHERE id = auth.uid())))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users view own madrasah materi" ON materi
  FOR ALL USING (
    tp_id IN (SELECT id FROM tujuan_pembelajaran WHERE cp_id IN (SELECT id FROM capaian_pembelajaran WHERE mapel_id IN (SELECT id FROM mata_pelajaran WHERE madrasah_id IN (SELECT madrasah_id FROM users WHERE id = auth.uid()))))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users view own madrasah nilai" ON nilai
  FOR ALL USING (
    kelas_id IN (SELECT id FROM kelas WHERE madrasah_id IN (SELECT madrasah_id FROM users WHERE id = auth.uid()))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users view own madrasah deskripsi" ON deskripsi_rapor
  FOR ALL USING (
    kelas_id IN (SELECT id FROM kelas WHERE madrasah_id IN (SELECT madrasah_id FROM users WHERE id = auth.uid()))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================
-- 16. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_madrasah ON users(madrasah_id);
CREATE INDEX IF NOT EXISTS idx_guru_madrasah ON guru(madrasah_id);
CREATE INDEX IF NOT EXISTS idx_kelas_madrasah ON kelas(madrasah_id);
CREATE INDEX IF NOT EXISTS idx_siswa_madrasah ON siswa(madrasah_id);
CREATE INDEX IF NOT EXISTS idx_siswa_kelas ON siswa(kelas_id);
CREATE INDEX IF NOT EXISTS idx_mapel_madrasah ON mata_pelajaran(madrasah_id);
CREATE INDEX IF NOT EXISTS idx_nilai_siswa ON nilai(siswa_id);
CREATE INDEX IF NOT EXISTS idx_nilai_mapel ON nilai(mapel_id);
CREATE INDEX IF NOT EXISTS idx_nilai_kelas ON nilai(kelas_id);
CREATE INDEX IF NOT EXISTS idx_deskripsi_siswa ON deskripsi_rapor(siswa_id);
CREATE INDEX IF NOT EXISTS idx_deskripsi_mapel ON deskripsi_rapor(mapel_id);

-- ============================================
-- 17. UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_madrasah_updated_at BEFORE UPDATE ON madrasah FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guru_updated_at BEFORE UPDATE ON guru FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kelas_updated_at BEFORE UPDATE ON kelas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_siswa_updated_at BEFORE UPDATE ON siswa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mapel_updated_at BEFORE UPDATE ON mata_pelajaran FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cp_updated_at BEFORE UPDATE ON capaian_pembelajaran FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tp_updated_at BEFORE UPDATE ON tujuan_pembelajaran FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materi_updated_at BEFORE UPDATE ON materi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nilai_updated_at BEFORE UPDATE ON nilai FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deskripsi_updated_at BEFORE UPDATE ON deskripsi_rapor FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
