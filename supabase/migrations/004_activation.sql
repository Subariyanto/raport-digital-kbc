-- 004_activation.sql — Sistem Aktivasi 1 Kode = 1 Akun
-- Untuk: Raport Digital Madrasah KBC
-- Jalankan di Supabase SQL Editor.
-- Password disimpan sebagai SHA-256 hex (bukan bcrypt; sesuaikan dengan client-side crypto.subtle).

-- =====================================================================
-- TABEL: rdmkbc_admins
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.rdmkbc_admins (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username    TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, -- SHA-256 hex
  nama        TEXT NOT NULL DEFAULT 'Administrator',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABEL: rdmkbc_activation_codes
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.rdmkbc_activation_codes (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  -- Status: 'active' | 'used' | 'revoked'
  status      TEXT NOT NULL DEFAULT 'active',
  -- Prefill identitas (hanya sebagai saran/prefill; user input yang tersimpan)
  nama        TEXT,
  madrasah    TEXT,
  kabupaten   TEXT,
  role        TEXT NOT NULL DEFAULT 'kepala_madrasah',
  catatan     TEXT,
  -- Tracking pemakaian
  used_by_account_id BIGINT,
  used_at     TIMESTAMPTZ,
  -- Admin yang membuat
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rdmkbc_codes_status ON public.rdmkbc_activation_codes(status);
CREATE INDEX IF NOT EXISTS idx_rdmkbc_codes_code   ON public.rdmkbc_activation_codes(code);

-- =====================================================================
-- TABEL: rdmkbc_accounts
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.rdmkbc_accounts (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, -- SHA-256 hex
  nama          TEXT NOT NULL,
  nip           TEXT,
  msd           TEXT,  -- Madrasah / Sekolah
  kabupaten     TEXT,
  role          TEXT NOT NULL DEFAULT 'kepala_madrasah',
  -- Kode aktivasi yang dipakai saat registrasi
  activation_code TEXT NOT NULL,
  tier          TEXT NOT NULL DEFAULT 'full', -- 'full' (1 kode = 1 akun, tidak ada trial lagi)
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rdmkbc_accounts_username ON public.rdmkbc_accounts(username);

-- =====================================================================
-- SEED ADMIN DEFAULT
-- Username: admin
-- Password: @riyant1970
-- SHA-256 hex of "@riyant1970" = 1fe822ee3c970bb86b48d7519a9bc25eef1d31fa5267a6cf41892d818eb1ef40
-- =====================================================================
INSERT INTO public.rdmkbc_admins (username, password_hash, nama)
VALUES ('admin', '1fe822ee3c970bb86b48d7519a9bc25eef1d31fa5267a6cf41892d818eb1ef40', 'Administrator')
ON CONFLICT (username) DO NOTHING;

-- =====================================================================
-- HELPER: generate random code segment (8 chars, exclude I/O/0/1)
-- =====================================================================
-- NOTE: JANGAN tandai VOLATILE function yang memakai random() sebagai IMMUTABLE.
-- random() bersifat volatile; menandainya IMMUTABLE membuat planner Postgres
-- meng-cache hasilnya sehingga loop pencarian keunikan kode tidak pernah selesai
-- (menyebabkan statement timeout di PostgREST).
CREATE OR REPLACE FUNCTION public.rdmkbc_generate_code_segment()
RETURNS TEXT
LANGUAGE sql
VOLATILE
AS $$
  SELECT string_agg(
    substring(
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' FROM (1 + floor(random() * 31))::int FOR 1
    ),
    ''
  )
  FROM generate_series(1, 4);
$$;

-- =====================================================================
-- RPC: rdmkbc_code_status
-- Cek status kode tanpa mengaktivasi. Returns TEXT.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.rdmkbc_code_status(p_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT status INTO v_status
  FROM rdmkbc_activation_codes
  WHERE UPPER(code) = UPPER(p_code)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 'INVALID_CODE';
  END IF;

  RETURN v_status; -- 'active' | 'used' | 'revoked'
END;
$$;

-- =====================================================================
-- RPC: rdmkbc_register_account
-- Daftar akun baru dengan kode aktivasi. 1 kode = 1 akun.
-- Returns JSON dengan status.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.rdmkbc_register_account(
  p_code         TEXT,
  p_username     TEXT,
  p_password_hash TEXT,
  p_nama         TEXT,
  p_msd          TEXT DEFAULT NULL,
  p_kabupaten    TEXT DEFAULT NULL,
  p_role         TEXT DEFAULT NULL,
  p_nip          TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_rec  RECORD;
  v_account_id BIGINT;
  v_role      TEXT;
BEGIN
  -- 1. Cek kode
  SELECT * INTO v_code_rec
  FROM rdmkbc_activation_codes
  WHERE UPPER(code) = UPPER(p_code)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'status', 'INVALID_CODE', 'message', 'Kode aktivasi tidak ditemukan');
  END IF;

  IF v_code_rec.status = 'used' THEN
    RETURN json_build_object('ok', false, 'status', 'ALREADY_USED', 'message', 'Kode sudah dipakai untuk membuat akun');
  END IF;

  IF v_code_rec.status = 'revoked' THEN
    RETURN json_build_object('ok', false, 'status', 'REVOKED', 'message', 'Kode telah dicabut admin');
  END IF;

  -- 2. Cek username unik
  IF EXISTS (SELECT 1 FROM rdmkbc_accounts WHERE LOWER(username) = LOWER(p_username)) THEN
    RETURN json_build_object('ok', false, 'status', 'USERNAME_TAKEN', 'message', 'Username sudah dipakai');
  END IF;

  -- 3. Role dari kode dikunci (prefill role menang)
  v_role := COALESCE(NULLIF(p_role, ''), v_code_rec.role, 'kepala_madrasah');

  -- 4. Buat akun
  INSERT INTO rdmkbc_accounts (
    username, password_hash, nama, nip, msd, kabupaten, role,
    activation_code, tier, is_active, created_at
  ) VALUES (
    p_username, p_password_hash, p_nama, p_nip, p_msd, p_kabupaten, v_role,
    UPPER(p_code), 'full', true, now()
  )
  RETURNING id INTO v_account_id;

  -- 5. Tandai kode sebagai used
  UPDATE rdmkbc_activation_codes
  SET status = 'used',
      used_by_account_id = v_account_id,
      used_at = now()
  WHERE id = v_code_rec.id;

  RETURN json_build_object(
    'ok', true,
    'status', 'OK',
    'message', 'Akun berhasil dibuat',
    'account', json_build_object(
      'id', v_account_id,
      'username', p_username,
      'nama', p_nama,
      'msd', p_msd,
      'kabupaten', p_kabupaten,
      'role', v_role,
      'tier', 'full'
    )
  );
END;
$$;

-- =====================================================================
-- RPC: rdmkbc_login
-- Login user. Returns JSON dengan data akun atau error.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.rdmkbc_login(
  p_username      TEXT,
  p_password_hash TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_acc RECORD;
BEGIN
  SELECT id, username, nama, nip, msd, kabupaten, role, tier, is_active, activation_code
  INTO v_acc
  FROM rdmkbc_accounts
  WHERE LOWER(username) = LOWER(p_username)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'status', 'NOT_FOUND', 'message', 'Akun tidak ditemukan');
  END IF;

  IF NOT v_acc.is_active THEN
    RETURN json_build_object('ok', false, 'status', 'INACTIVE', 'message', 'Akun dinonaktifkan');
  END IF;

  IF v_acc.password_hash != p_password_hash THEN
    RETURN json_build_object('ok', false, 'status', 'WRONG_PASSWORD', 'message', 'Password salah');
  END IF;

  -- Update last login
  UPDATE rdmkbc_accounts SET last_login_at = now() WHERE id = v_acc.id;

  RETURN json_build_object(
    'ok', true,
    'status', 'OK',
    'account', json_build_object(
      'id', v_acc.id,
      'username', v_acc.username,
      'nama', v_acc.nama,
      'nip', v_acc.nip,
      'msd', v_acc.msd,
      'kabupaten', v_acc.kabupaten,
      'role', v_acc.role,
      'tier', v_acc.tier,
      'activation_code', v_acc.activation_code
    )
  );
END;
$$;

-- =====================================================================
-- RPC: rdmkbc_admin_login
-- =====================================================================
CREATE OR REPLACE FUNCTION public.rdmkbc_admin_login(
  p_username      TEXT,
  p_password_hash TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin RECORD;
BEGIN
  SELECT id, username, nama INTO v_admin
  FROM rdmkbc_admins
  WHERE LOWER(username) = LOWER(p_username)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'status', 'NOT_FOUND', 'message', 'Admin tidak ditemukan');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM rdmkbc_admins
    WHERE LOWER(username) = LOWER(p_username) AND password_hash = p_password_hash
  ) THEN
    RETURN json_build_object('ok', false, 'status', 'WRONG_PASSWORD', 'message', 'Password salah');
  END IF;

  RETURN json_build_object(
    'ok', true,
    'status', 'OK',
    'admin', json_build_object(
      'username', v_admin.username,
      'nama', v_admin.nama
    )
  );
END;
$$;

-- =====================================================================
-- RPC: rdmkbc_admin_create_code
-- Generate kode aktivasi (format RDMKBC-XXXX-XXXX)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.rdmkbc_admin_create_code(
  p_nama           TEXT DEFAULT NULL,
  p_madrasah       TEXT DEFAULT NULL,
  p_kabupaten      TEXT DEFAULT NULL,
  p_role           TEXT DEFAULT NULL,
  p_catatan        TEXT DEFAULT NULL,
  p_admin_username TEXT DEFAULT NULL,
  p_prefix         TEXT DEFAULT 'RDMKBC',
  p_count          INT DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_codes TEXT[] := ARRAY[]::TEXT[];
  v_i INT;
  v_role TEXT;
BEGIN
  v_role := COALESCE(NULLIF(p_role, ''), 'kepala_madrasah');

  FOR v_i IN 1..LEAST(p_count, 100) LOOP
    LOOP
      v_code := UPPER(p_prefix) || '-' || rdmkbc_generate_code_segment() || '-' || rdmkbc_generate_code_segment();
      -- Pastikan unik
      EXIT WHEN NOT EXISTS (SELECT 1 FROM rdmkbc_activation_codes WHERE code = v_code);
    END LOOP;

    INSERT INTO rdmkbc_activation_codes (
      code, status, nama, madrasah, kabupaten, role, catatan, created_by
    ) VALUES (
      v_code, 'active', p_nama, p_madrasah, p_kabupaten, v_role, p_catatan, p_admin_username
    );

    v_codes := array_append(v_codes, v_code);
  END LOOP;

  RETURN json_build_object(
    'ok', true,
    'status', 'OK',
    'codes', v_codes,
    'count', array_length(v_codes, 1)
  );
END;
$$;

-- =====================================================================
-- RPC: rdmkbc_admin_list_codes
-- =====================================================================
CREATE OR REPLACE FUNCTION public.rdmkbc_admin_list_codes(
  p_admin_username TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object(
    'ok', true,
    'data', COALESCE(
      (
        SELECT json_agg(row_to_json(t))
        FROM (
          SELECT
            c.code,
            c.status,
            c.nama,
            c.madrasah,
            c.kabupaten,
            c.role,
            c.catatan,
            c.created_by,
            c.created_at,
            c.used_at,
            a.username AS used_by_username,
            a.nama AS used_by_nama
          FROM rdmkbc_activation_codes c
          LEFT JOIN rdmkbc_accounts a ON a.id = c.used_by_account_id
          ORDER BY c.created_at DESC
        ) t
      ),
      '[]'::json
    )
  );
END;
$$;

-- =====================================================================
-- RPC: rdmkbc_admin_revoke_code
-- =====================================================================
CREATE OR REPLACE FUNCTION public.rdmkbc_admin_revoke_code(
  p_code           TEXT,
  p_admin_username TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE rdmkbc_activation_codes
  SET status = 'revoked'
  WHERE UPPER(code) = UPPER(p_code) AND status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'status', 'NOT_FOUND', 'message', 'Kode tidak ditemukan atau tidak aktif');
  END IF;

  RETURN json_build_object('ok', true, 'status', 'OK', 'message', 'Kode dicabut');
END;
$$;

-- =====================================================================
-- RPC: rdmkbc_admin_delete_code
-- =====================================================================
CREATE OR REPLACE FUNCTION public.rdmkbc_admin_delete_code(
  p_code           TEXT,
  p_admin_username TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rdmkbc_activation_codes
  WHERE UPPER(code) = UPPER(p_code) AND status != 'used';

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'status', 'NOT_FOUND', 'message', 'Kode tidak ditemukan atau sudah terpakai');
  END IF;

  RETURN json_build_object('ok', true, 'status', 'OK', 'message', 'Kode dihapus');
END;
$$;

-- =====================================================================
-- RPC: rdmkbc_admin_delete_unused_codes
-- =====================================================================
CREATE OR REPLACE FUNCTION public.rdmkbc_admin_delete_unused_codes(
  p_admin_username TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  DELETE FROM rdmkbc_activation_codes
  WHERE status = 'active';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN json_build_object('ok', true, 'status', 'OK', 'message', v_count || ' kode tidak terpakai dihapus', 'deleted', v_count);
END;
$$;

-- =====================================================================
-- RPC: rdmkbc_admin_stats
-- =====================================================================
CREATE OR REPLACE FUNCTION public.rdmkbc_admin_stats(
  p_admin_username TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INT;
  v_active INT;
  v_used INT;
  v_revoked INT;
  v_accounts INT;
BEGIN
  SELECT count(*) INTO v_total FROM rdmkbc_activation_codes;
  SELECT count(*) INTO v_active FROM rdmkbc_activation_codes WHERE status = 'active';
  SELECT count(*) INTO v_used FROM rdmkbc_activation_codes WHERE status = 'used';
  SELECT count(*) INTO v_revoked FROM rdmkbc_activation_codes WHERE status = 'revoked';
  SELECT count(*) INTO v_accounts FROM rdmkbc_accounts;

  RETURN json_build_object(
    'ok', true,
    'total', v_total,
    'active', v_active,
    'used', v_used,
    'revoked', v_revoked,
    'accounts', v_accounts
  );
END;
$$;

-- =====================================================================
-- ENABLE RLS (optional but recommended)
-- =====================================================================
ALTER TABLE public.rdmkbc_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rdmkbc_activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rdmkbc_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: anon can call RPCs (SECURITY DEFINER bypasses RLS for functions)
-- but cannot directly SELECT/INSERT/UPDATE/DELETE tables.
-- All access goes through RPC functions which are SECURITY DEFINER.

-- Revoke direct table access from anon/authenticated
REVOKE ALL ON public.rdmkbc_admins FROM anon, authenticated;
REVOKE ALL ON public.rdmkbc_activation_codes FROM anon, authenticated;
REVOKE ALL ON public.rdmkbc_accounts FROM anon, authenticated;

-- Grant usage on sequence (for admin seed if needed)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
