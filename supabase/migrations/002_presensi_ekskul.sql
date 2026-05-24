-- ============================================
-- Migration 002: Presensi & Ekstrakurikuler
-- ============================================

-- TABEL PRESENSI
CREATE TABLE IF NOT EXISTS presensi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  tahun_pelajaran TEXT NOT NULL,
  sakit INTEGER NOT NULL DEFAULT 0,
  izin INTEGER NOT NULL DEFAULT 0,
  alpa INTEGER NOT NULL DEFAULT 0,
  hadir INTEGER NOT NULL DEFAULT 0,
  madrasah_id UUID NOT NULL REFERENCES madrasah(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(siswa_id, kelas_id, semester, tahun_pelajaran)
);

-- TABEL EKSTRAKURIKULER
CREATE TABLE IF NOT EXISTS ekstrakurikuler (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  tahun_pelajaran TEXT NOT NULL,
  nama_kegiatan TEXT NOT NULL,
  predikat TEXT NOT NULL CHECK (predikat IN ('Sangat Baik', 'Baik', 'Cukup', 'Kurang')),
  keterangan TEXT,
  madrasah_id UUID NOT NULL REFERENCES madrasah(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABEL CATATAN WALI KELAS
CREATE TABLE IF NOT EXISTS catatan_wali_kelas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  tahun_pelajaran TEXT NOT NULL,
  catatan TEXT,
  is_generated BOOLEAN DEFAULT FALSE,
  madrasah_id UUID NOT NULL REFERENCES madrasah(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(siswa_id, kelas_id, semester, tahun_pelajaran)
);

-- Enable RLS
ALTER TABLE presensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE ekstrakurikuler ENABLE ROW LEVEL SECURITY;
ALTER TABLE catatan_wali_kelas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view own madrasah presensi" ON presensi
  FOR ALL USING (
    madrasah_id IN (SELECT madrasah_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users view own madrasah ekskul" ON ekstrakurikuler
  FOR ALL USING (
    madrasah_id IN (SELECT madrasah_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users view own madrasah catatan" ON catatan_wali_kelas
  FOR ALL USING (
    madrasah_id IN (SELECT madrasah_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_presensi_siswa ON presensi(siswa_id);
CREATE INDEX IF NOT EXISTS idx_presensi_kelas ON presensi(kelas_id);
CREATE INDEX IF NOT EXISTS idx_ekskul_siswa ON ekstrakurikuler(siswa_id);
CREATE INDEX IF NOT EXISTS idx_catatan_siswa ON catatan_wali_kelas(siswa_id);

-- Triggers
CREATE TRIGGER update_presensi_updated_at BEFORE UPDATE ON presensi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ekskul_updated_at BEFORE UPDATE ON ekstrakurikuler FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_catatan_updated_at BEFORE UPDATE ON catatan_wali_kelas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
