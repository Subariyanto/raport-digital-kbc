// src/lib/supabase/activation.ts
// Wrapper for Supabase RPC calls — uses fetch only (no supabase-js dependency).
// Pattern adapted from pkg-app-spa-rev/supabase_sync.js.

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return { url, anonKey };
}

export function hasConfig(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return !!(
    url &&
    anonKey &&
    url !== "https://placeholder.supabase.co" &&
    anonKey !== "placeholder-key"
  );
}

function rpcUrl(fn: string): string {
  const { url } = getSupabaseConfig();
  return url.replace(/\/$/, "") + "/rest/v1/rpc/" + fn;
}

function rpcHeaders(): Record<string, string> {
  const { anonKey } = getSupabaseConfig();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };
}

/**
 * Call a Supabase RPC function. Returns string (for text responses like
 * 'OK','INVALID_CODE') or parsed JSON object.
 */
export async function callRpc(
  fn: string,
  params?: Record<string, unknown>
): Promise<string | Record<string, unknown>> {
  if (!hasConfig()) {
    return { ok: false, message: "Supabase belum dikonfigurasi" };
  }
  try {
    const body = params ? JSON.stringify(params) : "{}";
    const r = await fetch(rpcUrl(fn), {
      method: "POST",
      headers: rpcHeaders(),
      body,
    });
    const ct = r.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const data = await r.json();
      return data as Record<string, unknown>;
    } else {
      const text = await r.text();
      return text;
    }
  } catch (e) {
    console.error("[activation] RPC error:", fn, e);
    return { ok: false, message: "Gagal terhubung ke server. Periksa koneksi internet." };
  }
}

// --- TYPES ---

export interface RegisterParams {
  code: string;
  username: string;
  passwordHash: string;
  nama: string;
  msd?: string | null;
  kabupaten?: string | null;
  role?: string | null;
  nip?: string | null;
}

export interface LoginParams {
  username: string;
  passwordHash: string;
}

export interface CreateCodeParams {
  nama?: string | null;
  madrasah?: string | null;
  kabupaten?: string | null;
  role?: string | null;
  catatan?: string | null;
  adminUsername: string;
  prefix?: string;
  count?: number;
}

// --- USER-FACING RPC ---

export async function accountRegister(params: RegisterParams) {
  return callRpc("rdmkbc_register_account", {
    p_code: params.code,
    p_username: params.username,
    p_password_hash: params.passwordHash,
    p_nama: params.nama,
    p_msd: params.msd || null,
    p_kabupaten: params.kabupaten || null,
    p_role: params.role || null,
    p_nip: params.nip || null,
  });
}

export async function accountLogin(params: LoginParams) {
  return callRpc("rdmkbc_login", {
    p_username: params.username,
    p_password_hash: params.passwordHash,
  });
}

export async function codeStatus(code: string) {
  return callRpc("rdmkbc_code_status", {
    p_code: code,
  });
}

// --- ADMIN RPC ---

export async function adminLogin(username: string, passwordHash: string) {
  return callRpc("rdmkbc_admin_login", {
    p_username: username,
    p_password_hash: passwordHash,
  });
}

export async function adminCreateCode(params: CreateCodeParams) {
  return callRpc("rdmkbc_admin_create_code", {
    p_nama: params.nama || null,
    p_madrasah: params.madrasah || null,
    p_kabupaten: params.kabupaten || null,
    p_role: params.role || null,
    p_catatan: params.catatan || null,
    p_admin_username: params.adminUsername,
    p_prefix: params.prefix || "RDMKBC",
    p_count: params.count || 1,
  });
}

export async function adminListCodes(adminUsername: string) {
  return callRpc("rdmkbc_admin_list_codes", {
    p_admin_username: adminUsername,
  });
}

export async function adminRevokeCode(code: string, adminUsername: string) {
  return callRpc("rdmkbc_admin_revoke_code", {
    p_code: code,
    p_admin_username: adminUsername,
  });
}

export async function adminDeleteCode(code: string, adminUsername: string) {
  return callRpc("rdmkbc_admin_delete_code", {
    p_code: code,
    p_admin_username: adminUsername,
  });
}

export async function adminDeleteAllCodes(adminUsername: string) {
  return callRpc("rdmkbc_admin_delete_unused_codes", {
    p_admin_username: adminUsername,
  });
}

export async function adminStats(adminUsername: string) {
  return callRpc("rdmkbc_admin_stats", {
    p_admin_username: adminUsername,
  });
}

// --- ADMIN: ACCOUNT MANAGEMENT ---

export async function adminListAccounts(adminUsername: string) {
  return callRpc("rdmkbc_admin_list_accounts", {
    p_admin_username: adminUsername,
  });
}

export async function adminSetAccountActive(
  adminUsername: string,
  accountId: number,
  isActive: boolean
) {
  return callRpc("rdmkbc_admin_set_account_active", {
    p_admin_username: adminUsername,
    p_account_id: accountId,
    p_is_active: isActive,
  });
}

export async function adminDeleteAccount(
  adminUsername: string,
  accountId: number
) {
  return callRpc("rdmkbc_admin_delete_account", {
    p_admin_username: adminUsername,
    p_account_id: accountId,
  });
}

export async function adminResetAccountPassword(
  adminUsername: string,
  accountId: number,
  newPasswordHash: string
) {
  return callRpc("rdmkbc_admin_reset_account_password", {
    p_admin_username: adminUsername,
    p_account_id: accountId,
    p_new_password_hash: newPasswordHash,
  });
}
