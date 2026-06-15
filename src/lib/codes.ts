// Activation codes (TRIAL/FULL) - random codes stored in localStorage.
// Pattern adapted from e-RHK (js/lib/codes.js) and supervisi-pm-kbc.
"use client";

import { GithubSync } from "./github-sync";

const KEY_CODES = "rdmkbc_v1_codes";
const KEY_PURCHASE = "rdmkbc_v1_purchase";

export const MASTER_CODE = "POKJAWAS-JEMBER-RDM-KBC-2026";

export type CodePrefix = "TRIAL" | "FULL";
export type CodeStatus = "active" | "used" | "revoked";

export interface ActivationCode {
  code: string;          // e.g., FULL-A1B2-C3D4-E5F6
  prefix: CodePrefix;
  status: CodeStatus;
  createdAt: string;     // ISO
  usedAt?: string | null;
  usedByUserId?: string | null;
  usedByNama?: string | null;
  usedByNip?: string | null;
  note?: string | null;  // free text label
}

export interface PurchaseSettings {
  appName: string;
  appUrl: string;
  waNumber: string;        // e.g., 6281234567890
  hargaFull: string;       // e.g., "Rp 150.000"
  hargaTrial: string;      // e.g., "Gratis 5 hari"
  bankInfo: string;        // multiline text
  orderTemplate: string;   // pesan WA buat order
  sendTemplate: string;    // pesan WA buat distribusi kode (admin)
}

const DEFAULT_PURCHASE: PurchaseSettings = {
  appName: "Raport Digital Madrasah KBC",
  appUrl: "https://subariyanto.github.io/raport-digital-kbc/",
  waNumber: "6281234567890",
  hargaFull: "Rp 150.000 (lifetime)",
  hargaTrial: "Gratis trial 5 hari",
  bankInfo: "BSI 8379222500 a.n. Subariyanto",
  orderTemplate:
    "Halo, saya ingin pesan lisensi {APP}.\nNama: \nNIP: \nMadrasah: \n\nSilakan kirim kode aktivasi ke nomor ini, terima kasih 🙏",
  sendTemplate:
    "Halo {NAMA},\n\nBerikut kode aktivasi {APP}:\n\nKode: {KODE}\n\nLangkah:\n1. Buka {URL}\n2. Klik Daftar\n3. Isi NIP {NIP}, kode aktivasi, dan password\n\nTerima kasih 🙏",
};

function safeWindow(): Window | null {
  if (typeof window === "undefined") return null;
  return window;
}

function readCodes(): ActivationCode[] {
  const w = safeWindow();
  if (!w) return [];
  try {
    const raw = w.localStorage.getItem(KEY_CODES);
    return raw ? (JSON.parse(raw) as ActivationCode[]) : [];
  } catch {
    return [];
  }
}

function writeCodes(list: ActivationCode[]) {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.setItem(KEY_CODES, JSON.stringify(list));
  // Best-effort sync ke gh-pages (kalau PAT terpasang).
  // Async, tidak block UI; error di-log saja, local op tetap sukses.
  if (GithubSync.hasPAT()) {
    void GithubSync.pushIfConfigured(
      { codes: list, purchase: CodeStore.getPurchase() },
      "sync codes " + new Date().toISOString()
    ).then(res => {
      if (!res.synced && res.reason === "error") {
        console.warn("[CodeStore] sync codes failed:", res.error);
      }
    });
  }
}

function randomChunk(len: number): string {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omit ambiguous chars
  let out = "";
  const w = safeWindow();
  if (w) {
    const bytes = new Uint8Array(len);
    w.crypto.getRandomValues(bytes);
    for (let i = 0; i < len; i++) {
      out += alpha[bytes[i] % alpha.length];
    }
  } else {
    for (let i = 0; i < len; i++) {
      out += alpha[Math.floor(Math.random() * alpha.length)];
    }
  }
  return out;
}

function generateCode(prefix: CodePrefix): string {
  return `${prefix}-${randomChunk(4)}-${randomChunk(4)}-${randomChunk(4)}`;
}

export function parseCodePrefix(code: string): CodePrefix | null {
  const upper = (code || "").toUpperCase();
  if (upper.startsWith("FULL-")) return "FULL";
  if (upper.startsWith("TRIAL-")) return "TRIAL";
  return null;
}

export const CodeStore = {
  KEY_CODES,
  KEY_PURCHASE,

  list(): ActivationCode[] {
    return readCodes();
  },

  generate(prefix: CodePrefix, count = 1, note?: string): ActivationCode[] {
    const items: ActivationCode[] = [];
    const all = readCodes();
    const existing = new Set(all.map((c) => c.code));
    for (let i = 0; i < count; i++) {
      let code: string;
      do {
        code = generateCode(prefix);
      } while (existing.has(code));
      existing.add(code);
      const rec: ActivationCode = {
        code,
        prefix,
        status: "active",
        createdAt: new Date().toISOString(),
        note: note || null,
      };
      items.push(rec);
      all.push(rec);
    }
    writeCodes(all);
    return items;
  },

  find(code: string): ActivationCode | null {
    const upper = (code || "").trim().toUpperCase();
    if (!upper) return null;
    if (upper === MASTER_CODE) return null; // master handled separately
    // 1. Check localStorage first
    const local = readCodes().find((c) => c.code.toUpperCase() === upper);
    if (local) return local;
    // 2. Fallback to remote codes (di-cache di window saat boot)
    const w = safeWindow();
    if (w && Array.isArray(w.RDMKBC_REMOTE_CODES)) {
      const remote = w.RDMKBC_REMOTE_CODES.find((c) => c.code.toUpperCase() === upper);
      if (remote) return remote;
    }
    return null;
  },

  markUsed(code: string, by: { userId: string; nama: string; nip: string | null }) {
    const all = readCodes();
    const upper = code.toUpperCase();
    const idx = all.findIndex((c) => c.code.toUpperCase() === upper);
    if (idx >= 0) {
      all[idx].status = "used";
      all[idx].usedAt = new Date().toISOString();
      all[idx].usedByUserId = by.userId;
      all[idx].usedByNama = by.nama;
      all[idx].usedByNip = by.nip;
      writeCodes(all);
      return;
    }
    // Fallback: kode dari remote (device admin lain). Adopt ke local + mark used + push.
    const w = safeWindow();
    if (w && Array.isArray(w.RDMKBC_REMOTE_CODES)) {
      const remote = w.RDMKBC_REMOTE_CODES.find((c) => c.code.toUpperCase() === upper);
      if (remote) {
        const adopted: ActivationCode = {
          ...remote,
          status: "used",
          usedAt: new Date().toISOString(),
          usedByUserId: by.userId,
          usedByNama: by.nama,
          usedByNip: by.nip,
        };
        all.push(adopted);
        writeCodes(all);
      }
    }
  },

  revoke(code: string) {
    const all = readCodes();
    const upper = code.toUpperCase();
    const idx = all.findIndex((c) => c.code.toUpperCase() === upper);
    if (idx < 0) return;
    all[idx].status = "revoked";
    writeCodes(all);
  },

  unrevoke(code: string) {
    const all = readCodes();
    const upper = code.toUpperCase();
    const idx = all.findIndex((c) => c.code.toUpperCase() === upper);
    if (idx < 0) return;
    all[idx].status = "active";
    writeCodes(all);
  },

  remove(code: string) {
    const all = readCodes().filter((c) => c.code.toUpperCase() !== code.toUpperCase());
    writeCodes(all);
  },

  // Purchase settings
  getPurchase(): PurchaseSettings {
    const w = safeWindow();
    if (!w) return DEFAULT_PURCHASE;
    try {
      const raw = w.localStorage.getItem(KEY_PURCHASE);
      if (raw) {
        const obj = JSON.parse(raw);
        return { ...DEFAULT_PURCHASE, ...obj };
      }
      // Fallback ke remote (kalau ada)
      if (w.RDMKBC_REMOTE_PURCHASE) {
        return { ...DEFAULT_PURCHASE, ...w.RDMKBC_REMOTE_PURCHASE };
      }
      return DEFAULT_PURCHASE;
    } catch {
      return DEFAULT_PURCHASE;
    }
  },

  savePurchase(p: Partial<PurchaseSettings>) {
    const w = safeWindow();
    if (!w) return;
    const merged = { ...CodeStore.getPurchase(), ...p };
    w.localStorage.setItem(KEY_PURCHASE, JSON.stringify(merged));
    // Best-effort push ke gh-pages
    if (GithubSync.hasPAT()) {
      void GithubSync.pushIfConfigured(
        { codes: readCodes(), purchase: merged },
        "sync purchase " + new Date().toISOString()
      ).then(res => {
        if (!res.synced && res.reason === "error") {
          console.warn("[CodeStore] sync purchase failed:", res.error);
        }
      });
    }
  },
};

export function fillTemplate(
  template: string,
  vars: { KODE?: string; APP?: string; URL?: string; NIP?: string; NAMA?: string }
): string {
  return template
    .replace(/\{KODE\}/g, vars.KODE ?? "")
    .replace(/\{APP\}/g, vars.APP ?? "")
    .replace(/\{URL\}/g, vars.URL ?? "")
    .replace(/\{NIP\}/g, vars.NIP ?? "")
    .replace(/\{NAMA\}/g, vars.NAMA ?? "");
}

export function buildWhatsappLink(waNumber: string, text: string): string {
  const num = (waNumber || "").replace(/\D/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
