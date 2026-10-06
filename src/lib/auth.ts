// Auth — server-first (Supabase RPC) with localStorage fallback.
// 1 kode aktivasi = 1 akun. Kode wajib untuk registrasi.
"use client";

import { CodeStore, parseCodePrefix, MASTER_CODE } from "./codes";
import { Tier, type TierKind, defaultTrialExpiresAt, defaultFullExpiresAt } from "./tier";
import * as SupabaseActivation from "./supabase/activation";

const KEY_USERS = "rdmkbc_v1_users";
const KEY_SESSION = "rdmkbc_v1_session";
const KEY_ADMIN_SESSION = "rdmkbc_v1_admin_session";
const KEY_ADMIN_USERNAME = "rdmkbc_v1_admin_username";

export type UserRole = "admin" | "user";

export interface AppUser {
  id: string;
  email: string;        // login id (for legacy accounts / fallback)
  username?: string | null; // login id (new server-based accounts)
  nip?: string | null;
  nama: string;
  passwordHash: string; // SHA-256 hex (kept for offline fallback only)
  role: UserRole;
  tier: TierKind;
  msd?: string | null;       // Madrasah / Sekolah
  kabupaten?: string | null;
  trialExpiresAt?: string | null;
  fullExpiresAt?: string | null;
  activatedWith?: string | null;
  kegiatanCount?: number;
  createdAt: string;
}

function safeWindow(): Window | null {
  if (typeof window === "undefined") return null;
  return window;
}

// SHA-256 hex (uses Web Crypto API)
async function sha256Hex(text: string): Promise<string> {
  const w = safeWindow();
  if (!w) return "";
  const enc = new TextEncoder().encode(text);
  const hash = await w.crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readUsers(): AppUser[] {
  const w = safeWindow();
  if (!w) return [];
  try {
    const raw = w.localStorage.getItem(KEY_USERS);
    return raw ? (JSON.parse(raw) as AppUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(list: AppUser[]) {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.setItem(KEY_USERS, JSON.stringify(list));
}

function genId(): string {
  return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

const ADMIN_DEFAULT_EMAIL = "admin@local";
const ADMIN_DEFAULT_PASS = "@riyant1970";
const ADMIN_DEFAULT_USERNAME = "admin";

export const Auth = {
  KEY_USERS,
  KEY_SESSION,

  /** Seed admin into localStorage (for offline fallback / demo mode). */
  async ensureAdminSeeded() {
    const users = readUsers();
    if (users.find((u) => u.role === "admin")) {
      let changed = false;
      const OLD_PASS_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";
      const newHash = await sha256Hex(ADMIN_DEFAULT_PASS);
      for (const u of users) {
        if (u.role === "admin" && u.tier !== "admin") {
          u.tier = "admin";
          changed = true;
        }
        if (u.role === "admin" && u.passwordHash === OLD_PASS_HASH) {
          u.passwordHash = newHash;
          changed = true;
        }
      }
      if (changed) writeUsers(users);
      return;
    }
    const pwd = await sha256Hex(ADMIN_DEFAULT_PASS);
    users.push({
      id: genId(),
      email: ADMIN_DEFAULT_EMAIL,
      username: ADMIN_DEFAULT_USERNAME,
      nip: null,
      nama: "Administrator",
      passwordHash: pwd,
      role: "admin",
      tier: "admin",
      createdAt: new Date().toISOString(),
    });
    writeUsers(users);
  },

  /** Login via Supabase server (RPC rdmkbc_login). */
  async loginViaServer(username: string, password: string): Promise<AppUser> {
    const passwordHash = await sha256Hex(password);
    const result = await SupabaseActivation.accountLogin({ username, passwordHash });

    if (typeof result === "string") {
      throw new Error(result);
    }
    const data = result as Record<string, unknown>;
    if (!data.ok) {
      throw new Error((data.message as string) || "Login gagal");
    }
    const acc = data.account as Record<string, unknown>;
    // Cache to localStorage for offline fallback
    const user: AppUser = {
      id: `srv_${acc.id}`,
      email: acc.username as string, // keep email field for backward compat
      username: acc.username as string,
      nip: (acc.nip as string) || null,
      nama: acc.nama as string,
      passwordHash, // keep hash for offline fallback
      role: "user",
      tier: (acc.tier as TierKind) || "full",
      msd: (acc.msd as string) || null,
      kabupaten: (acc.kabupaten as string) || null,
      activatedWith: (acc.activation_code as string) || null,
      kegiatanCount: 0,
      createdAt: new Date().toISOString(),
    };
    // Merge into localStorage cache
    const users = readUsers();
    const existingIdx = users.findIndex(
      (u) => (u.username && u.username === user.username) || u.email === user.email
    );
    if (existingIdx >= 0) {
      users[existingIdx] = { ...users[existingIdx], ...user };
    } else {
      users.push(user);
    }
    writeUsers(users);

    const w = safeWindow();
    if (w) w.localStorage.setItem(KEY_SESSION, user.id);
    return user;
  },

  /** Register via Supabase server (RPC rdmkbc_register_account). */
  async registerViaServer(opts: {
    code: string;
    username: string;
    password: string;
    nama: string;
    nip?: string;
    msd?: string;
    kabupaten?: string;
    role?: string;
  }): Promise<AppUser> {
    const passwordHash = await sha256Hex(opts.password);
    const result = await SupabaseActivation.accountRegister({
      code: opts.code.trim().toUpperCase(),
      username: opts.username.trim().toLowerCase(),
      passwordHash,
      nama: opts.nama.trim(),
      msd: opts.msd || null,
      kabupaten: opts.kabupaten || null,
      role: opts.role || null,
      nip: opts.nip || null,
    });

    if (typeof result === "string") {
      if (result === "OK") {
        // Should not happen (OK comes in JSON), but handle it
      } else {
        throw new Error(result);
      }
    }
    const data = result as Record<string, unknown>;
    if (!data.ok) {
      const status = data.status as string;
      const msg = data.message as string;
      if (status === "INVALID_CODE") throw new Error("Kode aktivasi tidak ditemukan di server");
      if (status === "ALREADY_USED") throw new Error("Kode sudah dipakai untuk membuat akun. Satu kode hanya untuk satu akun.");
      if (status === "USERNAME_TAKEN") throw new Error("Username sudah dipakai. Pilih username lain.");
      if (status === "REVOKED") throw new Error("Kode aktivasi telah dicabut oleh Admin.");
      throw new Error(msg || "Pendaftaran gagal");
    }

    const acc = data.account as Record<string, unknown>;
    const user: AppUser = {
      id: `srv_${acc.id}`,
      email: acc.username as string,
      username: acc.username as string,
      nip: opts.nip || null,
      nama: acc.nama as string,
      passwordHash,
      role: "user",
      tier: (acc.tier as TierKind) || "full",
      msd: (acc.msd as string) || opts.msd || null,
      kabupaten: (acc.kabupaten as string) || opts.kabupaten || null,
      activatedWith: opts.code.trim().toUpperCase(),
      kegiatanCount: 0,
      createdAt: new Date().toISOString(),
    };

    // Cache to localStorage
    const users = readUsers();
    users.push(user);
    writeUsers(users);

    const w = safeWindow();
    if (w) w.localStorage.setItem(KEY_SESSION, user.id);
    return user;
  },

  /**
   * Register — WAJIB kode aktivasi.
   * Jika Supabase configured → register via server.
   * Fallback localStorage jika tidak configured (demo mode).
   */
  async register(opts: {
    nama: string;
    nip?: string;
    email?: string;
    username?: string;
    password: string;
    activationCode?: string;
    msd?: string;
    kabupaten?: string;
    role?: string;
  }): Promise<AppUser> {
    const nama = (opts.nama || "").trim();
    const password = opts.password || "";
    const code = (opts.activationCode || "").trim().toUpperCase();
    const username = (opts.username || "").trim().toLowerCase();
    const nip = (opts.nip || "").replace(/\D/g, "");

    if (!nama) throw new Error("Nama wajib diisi");
    if (!password || password.length < 6) throw new Error("Password minimal 6 karakter");
    if (!code) throw new Error("Kode aktivasi WAJIB untuk membuat akun. Hubungi Admin untuk mendapatkan kode.");
    if (!username || username.length < 4) throw new Error("Username wajib diisi (minimal 4 karakter)");

    // --- SERVER PATH ---
    if (SupabaseActivation.hasConfig()) {
      return Auth.registerViaServer({
        code,
        username,
        password,
        nama,
        nip: nip || undefined,
        msd: opts.msd,
        kabupaten: opts.kabupaten,
        role: opts.role,
      });
    }

    // --- LOCAL FALLBACK (demo mode) ---
    let email = (opts.email || "").trim().toLowerCase();
    if (!email) email = username || `${genId()}@madrasah.local`;

    const users = readUsers();
    if (users.find((u) => (u.username || "").toLowerCase() === username))
      throw new Error("Username sudah terdaftar");
    if (users.find((u) => (u.email || "").toLowerCase() === email))
      throw new Error("Email sudah terdaftar");
    if (nip && users.find((u) => (u.nip || "") === nip))
      throw new Error("NIP sudah terdaftar");

    let tier: TierKind = "full";
    let activatedWith: string | null = code;

    if (code === MASTER_CODE) {
      tier = "full";
      activatedWith = "(master)";
    } else {
      // In local fallback, accept any code format
      const parsed = parseCodePrefix(code);
      if (parsed === "TRIAL") {
        tier = "trial";
      } else {
        tier = "full";
      }
    }

    const passwordHash = await sha256Hex(password);
    const newUser: AppUser = {
      id: genId(),
      email,
      username,
      nip: nip || null,
      nama,
      passwordHash,
      role: "user",
      tier,
      msd: opts.msd || null,
      kabupaten: opts.kabupaten || null,
      trialExpiresAt: tier === "trial" ? defaultTrialExpiresAt() : null,
      fullExpiresAt: tier === "full" ? defaultFullExpiresAt() : null,
      activatedWith,
      kegiatanCount: 0,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeUsers(users);

    const w = safeWindow();
    if (w) w.localStorage.setItem(KEY_SESSION, newUser.id);
    return newUser;
  },

  /**
   * Login — coba server dulu (kalau configured), fallback lokal.
   * Accept username OR email/NIP for backward compat.
   */
  async login(identifier: string, password: string): Promise<AppUser> {
    const id = (identifier || "").trim();
    if (!id || !password) throw new Error("Username/Email/NIP dan password wajib diisi");

    // Try server first (by username)
    if (SupabaseActivation.hasConfig()) {
      try {
        return await Auth.loginViaServer(id.toLowerCase(), password);
      } catch (err) {
        const msg = (err as Error).message;
        // If server says NOT_FOUND or WRONG_PASSWORD, don't fallback — show error.
        // Only fallback if server is unreachable.
        if (msg.includes("Gagal terhubung") || msg.includes("belum dikonfigurasi")) {
          // fall through to local
        } else {
          throw err;
        }
      }
    }

    // --- LOCAL FALLBACK ---
    const idLower = id.toLowerCase();
    const users = readUsers();
    const onlyDigits = id.replace(/\D/g, "");
    const user =
      users.find((u) => (u.username || "").toLowerCase() === idLower) ||
      users.find((u) => (u.email || "").toLowerCase() === idLower) ||
      (onlyDigits.length === 18 ? users.find((u) => (u.nip || "") === onlyDigits) : undefined);
    if (!user) throw new Error("Akun tidak ditemukan");
    const hash = await sha256Hex(password);
    if (hash !== user.passwordHash) throw new Error("Password salah");

    const w = safeWindow();
    if (w) w.localStorage.setItem(KEY_SESSION, user.id);
    return user;
  },

  current(): AppUser | null {
    const w = safeWindow();
    if (!w) return null;
    const id = w.localStorage.getItem(KEY_SESSION);
    if (!id) return null;
    return readUsers().find((u) => u.id === id) || null;
  },

  isAdmin(): boolean {
    return Auth.current()?.role === "admin";
  },

  logout() {
    const w = safeWindow();
    if (!w) return;
    w.localStorage.removeItem(KEY_SESSION);
  },

  list(): AppUser[] {
    return readUsers();
  },

  upgradeUser(userId: string, code?: string) {
    const users = readUsers();
    const u = users.find((x) => x.id === userId);
    if (!u) throw new Error("User tidak ditemukan");
    u.tier = "full";
    u.trialExpiresAt = null;
    u.fullExpiresAt = defaultFullExpiresAt();
    if (code) u.activatedWith = code;
    writeUsers(users);
  },

  updateTier(userId: string, opts: { tier: TierKind; trialExpiresAt?: string | null; fullExpiresAt?: string | null }) {
    const users = readUsers();
    const u = users.find((x) => x.id === userId);
    if (!u) throw new Error("User tidak ditemukan");
    if (u.role === "admin") throw new Error("Tier admin tidak bisa diubah");
    u.tier = opts.tier;
    if (opts.tier === "trial") {
      u.trialExpiresAt = opts.trialExpiresAt || defaultTrialExpiresAt();
      u.fullExpiresAt = null;
    } else if (opts.tier === "full") {
      u.trialExpiresAt = null;
      u.fullExpiresAt = opts.fullExpiresAt || defaultFullExpiresAt();
    } else {
      u.trialExpiresAt = null;
      u.fullExpiresAt = null;
    }
    writeUsers(users);
  },

  downgradeUser(userId: string) {
    const users = readUsers();
    const u = users.find((x) => x.id === userId);
    if (!u) throw new Error("User tidak ditemukan");
    if (u.role === "admin") throw new Error("Admin tidak bisa di-downgrade");
    u.tier = "trial";
    u.trialExpiresAt = defaultTrialExpiresAt();
    u.fullExpiresAt = null;
    writeUsers(users);
  },

  deleteUser(userId: string) {
    let users = readUsers();
    const u = users.find((x) => x.id === userId);
    if (!u) return;
    if (u.role === "admin") throw new Error("Admin tidak bisa dihapus");
    users = users.filter((x) => x.id !== userId);
    writeUsers(users);
  },

  async resetPassword(userId: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) throw new Error("Password minimal 6 karakter");
    const users = readUsers();
    const u = users.find((x) => x.id === userId);
    if (!u) throw new Error("User tidak ditemukan");
    u.passwordHash = await sha256Hex(newPassword);
    writeUsers(users);
  },

  applyCode(code: string): AppUser {
    const trimmed = (code || "").trim().toUpperCase();
    if (!trimmed) throw new Error("Kode wajib diisi");
    const me = Auth.current();
    if (!me) throw new Error("Login dulu untuk mengaktifkan kode");

    if (trimmed === MASTER_CODE) {
      Auth.upgradeUser(me.id, "(master)");
      return Auth.current()!;
    }
    const parsed = parseCodePrefix(trimmed);
    const record = CodeStore.find(trimmed);
    if (!record) throw new Error("Kode tidak ditemukan");
    if (record.status === "revoked") throw new Error("Kode dicabut");
    if (record.status === "used") throw new Error("Kode sudah dipakai");
    if (parsed === "FULL") {
      Auth.upgradeUser(me.id, trimmed);
    } else {
      const users = readUsers();
      const u = users.find((x) => x.id === me.id);
      if (u) {
        u.tier = "trial";
        u.trialExpiresAt = defaultTrialExpiresAt();
        u.activatedWith = trimmed;
        writeUsers(users);
      }
    }
    CodeStore.markUsed(trimmed, { userId: me.id, nama: me.nama, nip: me.nip || null });
    return Auth.current()!;
  },

  // --- ADMIN SESSION (for admin codes page) ---
  getAdminSession(): { username: string } | null {
    const w = safeWindow();
    if (!w) return null;
    const loggedIn = w.localStorage.getItem(KEY_ADMIN_SESSION) === "true";
    const username = w.localStorage.getItem(KEY_ADMIN_USERNAME);
    if (!loggedIn || !username) return null;
    return { username };
  },

  setAdminSession(username: string) {
    const w = safeWindow();
    if (!w) return;
    w.localStorage.setItem(KEY_ADMIN_SESSION, "true");
    w.localStorage.setItem(KEY_ADMIN_USERNAME, username);
  },

  clearAdminSession() {
    const w = safeWindow();
    if (!w) return;
    w.localStorage.removeItem(KEY_ADMIN_SESSION);
    w.localStorage.removeItem(KEY_ADMIN_USERNAME);
  },
};

// Convenience hook
import { useEffect, useState } from "react";
export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      await Auth.ensureAdminSeeded();
      Tier.ensureAdminFullTier();
      setUser(Auth.current());
      setLoading(false);
    })();
  }, []);
  return { user, loading, setUser };
}
