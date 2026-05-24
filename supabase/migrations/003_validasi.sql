-- ============================================
-- Migration 003: Validasi Raport
-- ============================================

-- TABEL VALIDASI RAPORT
CREATE TABLE IF NOT EXISTS validasi_rapor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  tahun_pelajaran TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'diajukan', 'divalidasi', 'dikunci')),
  diajukan_oleh UUID REFERENCES users(id),
  diajukan_at TIMESTAMPTZ,
  divalidasi_oleh UUID REFERENCES users(id),
  divalidasi_at TIMESTAMPTZ,
  dikunci_oleh UUID REFERENCES users(id),
  dikunci_at TIMESTAMPTZ,
  catatan_validasi TEXT,
  madrasah_id UUID NOT NULL REFERENCES madrasah(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(siswa_id, kelas_id, semester, tahun_pelajaran)
);

-- Enable RLS
ALTER TABLE validasi_rapor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own madrasah validasi" ON validasi_rapor
  FOR ALL USING (
    madrasah_id IN (SELECT madrasah_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_validasi_kelas ON validasi_rapor(kelas_id);
CREATE INDEX IF NOT EXISTS idx_validasi_siswa ON validasi_rapor(siswa_id);
CREATE INDEX IF NOT EXISTS idx_validasi_status ON validasi_rapor(status);

-- Trigger
CREATE TRIGGER update_validasi_updated_at BEFORE UPDATE ON validasi_rapor FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
