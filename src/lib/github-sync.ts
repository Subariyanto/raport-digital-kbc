// GithubSync - Sinkronisasi codes.json + purchase.json ke gh-pages via GitHub API.
// Pattern di-port dari e-RHK (js/lib/github_sync.js).
// Setup sekali (PAT), lalu setiap admin generate/revoke kode atau ubah pengaturan
// pembelian otomatis push ke gh-pages. Public users fetch dari raw.githubusercontent.com
// → kode + pengaturan valid di device manapun tanpa perlu localStorage sync.
"use client";

import type { ActivationCode, PurchaseSettings } from "./codes";

const REPO_OWNER = "Subariyanto";
const REPO_NAME = "raport-digital-kbc";
const REPO_BRANCH = "gh-pages";
const SYNC_FILE_PATH = "data/codes.json";
const PAT_KEY = "rdmkbc_v1_gh_pat";

export interface RemotePayload {
  codes: ActivationCode[];
  purchase?: PurchaseSettings;
  updatedAt?: string;
}

declare global {
  interface Window {
    RDMKBC_REMOTE_CODES?: ActivationCode[];
    RDMKBC_REMOTE_PURCHASE?: PurchaseSettings;
    RDMKBC_REMOTE_UPDATED_AT?: string | null;
  }
}

function w(): Window | null {
  if (typeof window === "undefined") return null;
  return window;
}

export const GithubSync = {
  REPO_OWNER, REPO_NAME, REPO_BRANCH, SYNC_FILE_PATH, PAT_KEY,

  getPAT(): string {
    const win = w();
    if (!win) return "";
    return (win.localStorage.getItem(PAT_KEY) || "").trim();
  },

  setPAT(pat: string) {
    const win = w();
    if (!win) return;
    win.localStorage.setItem(PAT_KEY, String(pat || "").trim());
  },

  clearPAT() {
    const win = w();
    if (!win) return;
    win.localStorage.removeItem(PAT_KEY);
  },

  hasPAT(): boolean {
    return !!GithubSync.getPAT();
  },

  rawUrl(): string {
    return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/${SYNC_FILE_PATH}?t=${Date.now()}`;
  },

  apiUrl(): string {
    return `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${SYNC_FILE_PATH}`;
  },

  async readPublic(): Promise<RemotePayload | null> {
    try {
      const r = await fetch(GithubSync.rawUrl(), { cache: "no-store" });
      if (!r.ok) return null;
      const data = (await r.json()) as RemotePayload;
      if (!data || !Array.isArray(data.codes)) return null;
      return data;
    } catch (e) {
      console.warn("[GithubSync] readPublic failed:", (e as Error).message);
      return null;
    }
  },

  async writeAuth(payload: RemotePayload, message?: string): Promise<unknown> {
    const pat = GithubSync.getPAT();
    if (!pat) throw new Error("GitHub PAT belum diset. Setup di Admin → Kode Aktivasi → Sinkronisasi.");

    const headers: Record<string, string> = {
      Authorization: "token " + pat,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    };

    // Get current SHA
    let sha: string | null = null;
    try {
      const r = await fetch(GithubSync.apiUrl() + "?ref=" + REPO_BRANCH, { headers });
      if (r.ok) {
        const j = await r.json();
        sha = j.sha || null;
      } else if (r.status === 404) {
        sha = null;
      } else if (r.status === 401) {
        throw new Error("PAT salah atau expired.");
      } else if (r.status === 403) {
        throw new Error('PAT tidak punya permission "Contents: write" di repo ini.');
      } else {
        throw new Error("GET " + r.status);
      }
    } catch (e) {
      throw e;
    }

    const body = {
      message: message || "sync codes.json " + new Date().toISOString(),
      content: btoa(unescape(encodeURIComponent(JSON.stringify({ ...payload, updatedAt: new Date().toISOString() }, null, 2)))),
      branch: REPO_BRANCH,
      ...(sha ? { sha } : {}),
    };

    const r = await fetch(GithubSync.apiUrl(), {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const txt = await r.text();
      if (r.status === 401) throw new Error("PAT salah atau expired.");
      if (r.status === 403) throw new Error('PAT tidak punya scope "Contents: write" di repo ini.');
      if (r.status === 409) throw new Error("Konflik: data di gh-pages diubah dari device lain. Refresh halaman lalu coba lagi.");
      throw new Error("PUT gagal: " + r.status + " " + txt);
    }
    return await r.json();
  },

  async testPAT(): Promise<{ ok: boolean; message: string }> {
    const pat = GithubSync.getPAT();
    if (!pat) return { ok: false, message: "PAT belum diset." };
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
        headers: { Authorization: "token " + pat, Accept: "application/vnd.github.v3+json" },
      });
      if (r.status === 401) return { ok: false, message: "PAT salah atau expired." };
      if (r.status === 404) return { ok: false, message: "Repo tidak ditemukan atau PAT tidak punya akses." };
      if (!r.ok) return { ok: false, message: "Status " + r.status };
      const j = await r.json();
      return { ok: true, message: "OK — repo: " + j.full_name + " (" + (j.private ? "private" : "public") + ")" };
    } catch (e) {
      return { ok: false, message: "Network error: " + (e as Error).message };
    }
  },

  async refreshFromPublic(): Promise<RemotePayload | null> {
    const data = await GithubSync.readPublic();
    const win = w();
    if (!win) return data;
    if (data && Array.isArray(data.codes)) {
      win.RDMKBC_REMOTE_CODES = data.codes;
      win.RDMKBC_REMOTE_PURCHASE = data.purchase;
      win.RDMKBC_REMOTE_UPDATED_AT = data.updatedAt || null;
      console.log("[GithubSync] loaded", data.codes.length, "remote codes" + (data.purchase ? " + purchase settings" : "") + " (updated:", data.updatedAt + ")");
    } else {
      win.RDMKBC_REMOTE_CODES = [];
    }
    return data;
  },

  async pushIfConfigured(payload: RemotePayload, message?: string): Promise<{ synced: boolean; reason?: string; error?: string }> {
    if (!GithubSync.hasPAT()) return { synced: false, reason: "no-pat" };
    try {
      await GithubSync.writeAuth(payload, message);
      const win = w();
      if (win) {
        win.RDMKBC_REMOTE_CODES = payload.codes.slice();
        win.RDMKBC_REMOTE_PURCHASE = payload.purchase;
        win.RDMKBC_REMOTE_UPDATED_AT = new Date().toISOString();
      }
      return { synced: true };
    } catch (e) {
      console.error("[GithubSync] push failed:", (e as Error).message);
      return { synced: false, reason: "error", error: (e as Error).message };
    }
  },
};
