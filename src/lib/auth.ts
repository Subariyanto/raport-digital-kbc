// Auth - localStorage-based, client-only. Modeled after e-RHK / supervisi-pm-kbc.
"use client";

import { CodeStore, parseCodePrefix, MASTER_CODE } from "./codes";
import { Tier, type TierKind, defaultTrialExpiresAt } from "./tier";

const KEY_USERS = "rdmkbc_v1_users";
const KEY_SESSION = "rdmkbc_v1_session";

export type UserRole = "admin" | "user";

export interface AppUser {
  id: string;
  email: string;       // login id (email or <nip>@madrasah.local)
  nip?: string | null; // NIP (18 digits) when applicable
  nama: string;
  passwordHash: string;
  role: UserRole;
  tier: TierKind;       // 'admin' | 'full' | 'trial'
  trialExpiresAt?: string | null; // ISO
  activatedWith?: string | null;  // kode yang dipakai
  kegiatanCount?: number;         // tracker counter kalau dipakai
  createdAt: string;
}

function safeWindow(): Window | null {
  if (typeof window === "undefined") return null;
  return window;
}

// Light SHA-256 for password (no security-critical use; localStorage anyway)
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

export const Auth = {
  KEY_USERS,
  KEY_SESSION,

  async ensureAdminSeeded() {
    const users = readUsers();
    if (users.find((u) => u.role === "admin")) {
      // make sure admin tier=admin
      let changed = false;
      for (const u of users) {
        if (u.role === "admin" && u.tier !== "admin") {
          u.tier = "admin";
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
      nip: null,
      nama: "Administrator",
      passwordHash: pwd,
      role: "admin",
      tier: "admin",
      createdAt: new Date().toISOString(),
    });
    writeUsers(users);
  },

  async login(emailOrNip: string, password: string): Promise<AppUser> {
    const id = (emailOrNip || "").trim().toLowerCase();
    if (!id || !password) throw new Error("Email/NIP dan password wajib diisi");
    const users = readUsers();
    const onlyDigits = id.replace(/\D/g, "");
    const user =
      users.find((u) => (u.email || "").toLowerCase() === id) ||
      (onlyDigits.length === 18 ? users.find((u) => (u.nip || "") === onlyDigits) : undefined);
    if (!user) throw new Error("Akun tidak ditemukan");
    const hash = await sha256Hex(password);
    if (hash !== user.passwordHash) throw new Error("Password salah");

    // expire trial check
    if (user.tier === "trial" && user.trialExpiresAt) {
      const exp = new Date(user.trialExpiresAt).getTime();
      if (Date.now() > exp) {
        // tetap login, tapi banner / guard akan menahan akses fitur
      }
    }

    const w = safeWindow();
    if (w) w.localStorage.setItem(KEY_SESSION, user.id);
    return user;
  },

  async register(opts: {
    nama: string;
    nip?: string;
    email?: string;
    password: string;
    activationCode?: string;
  }): Promise<AppUser> {
    const nama = (opts.nama || "").trim();
    const nip = (opts.nip || "").replace(/\D/g, "");
    const password = opts.password || "";
    const code = (opts.activationCode || "").trim().toUpperCase();
    if (!nama) throw new Error("Nama wajib diisi");
    if (password.length < 6) throw new Error("Password minimal 6 karakter");

    let email = (opts.email || "").trim().toLowerCase();
    if (!email && nip) email = `${nip}@madrasah.local`;
    if (!email) email = `user_${genId()}@madrasah.local`;

    const users = readUsers();
    if (users.find((u) => (u.email || "").toLowerCase() === email))
      throw new Error("Email sudah terdaftar");
    if (nip && users.find((u) => (u.nip || "") === nip))
      throw new Error("NIP sudah terdaftar");

    let tier: TierKind = "trial";
    let trialExpiresAt: string | null = defaultTrialExpiresAt();
    let activatedWith: string | null = null;

    if (code) {
      if (code === MASTER_CODE) {
        tier = "full";
        trialExpiresAt = null;
        activatedWith = "(master)";
      } else {
        const parsed = parseCodePrefix(code);
        const record = CodeStore.find(code);
        if (!record) throw new Error("Kode aktivasi tidak ditemukan / tidak valid");
        if (record.status === "revoked") throw new Error("Kode aktivasi telah dicabut");
        if (record.status === "used") throw new Error("Kode aktivasi sudah dipakai");
        // valid - mark used after we know register sukses
        if (parsed === "FULL") {
          tier = "full";
          trialExpiresAt = null;
        } else {
          tier = "trial";
          trialExpiresAt = defaultTrialExpiresAt();
        }
        activatedWith = code;
      }
    }

    const passwordHash = await sha256Hex(password);
    const newUser: AppUser = {
      id: genId(),
      email,
      nip: nip || null,
      nama,
      passwordHash,
      role: "user",
      tier,
      trialExpiresAt,
      activatedWith,
      kegiatanCount: 0,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeUsers(users);

    if (activatedWith && activatedWith !== "(master)") {
      CodeStore.markUsed(activatedWith, { userId: newUser.id, nama, nip: nip || null });
    }

    const w = safeWindow();
    if (w) w.localStorage.setItem(KEY_SESSION, newUser.id);
    return newUser;
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
    if (code) u.activatedWith = code;
    writeUsers(users);
  },

  downgradeUser(userId: string) {
    const users = readUsers();
    const u = users.find((x) => x.id === userId);
    if (!u) throw new Error("User tidak ditemukan");
    if (u.role === "admin") throw new Error("Admin tidak bisa di-downgrade");
    u.tier = "trial";
    u.trialExpiresAt = defaultTrialExpiresAt();
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

  // Apply a code to current user (e.g., from /beli-lisensi -> Aktivasi Kode FULL)
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
      // TRIAL code on existing user → reset trial expiry
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
