// Tier model: admin / full / trial. Pure helpers (no auth dependency).
"use client";

export type TierKind = "admin" | "full" | "trial";

export const TRIAL_DAYS = 5;
export const FULL_DAYS = 365; // 1 tahun

export function defaultTrialExpiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d.toISOString();
}

export function defaultFullExpiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + FULL_DAYS);
  return d.toISOString();
}

interface TierUserShape {
  tier: TierKind;
  trialExpiresAt?: string | null;
  fullExpiresAt?: string | null;
  role?: "admin" | "user";
}

export interface TrialStatus {
  active: boolean;
  expired: boolean;
  daysLeft: number;
  hoursLeft: number;
  expiresAt: Date | null;
}

function statusFromExpiry(expiry: string | null | undefined, defaultActive: boolean): TrialStatus {
  if (!expiry) {
    return { active: defaultActive, expired: false, daysLeft: 0, hoursLeft: 0, expiresAt: null };
  }
  const exp = new Date(expiry);
  const ms = exp.getTime() - Date.now();
  const expired = ms <= 0;
  const daysLeft = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor(ms / (1000 * 60 * 60)));
  return { active: !expired, expired, daysLeft, hoursLeft, expiresAt: exp };
}

export const Tier = {
  ensureAdminFullTier() {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("rdmkbc_v1_users");
      if (!raw) return;
      const list = JSON.parse(raw) as TierUserShape[];
      let changed = false;
      for (const u of list) {
        if (u.role === "admin" && u.tier !== "admin") {
          u.tier = "admin";
          changed = true;
        }
        // Pastikan akun admin tidak punya expiry (sepanjang masa)
        if (u.role === "admin" || u.tier === "admin") {
          if (u.trialExpiresAt) { u.trialExpiresAt = null; changed = true; }
          if (u.fullExpiresAt) { u.fullExpiresAt = null; changed = true; }
        }
      }
      if (changed) window.localStorage.setItem("rdmkbc_v1_users", JSON.stringify(list));
    } catch {
      // ignore
    }
  },

  // Status untuk user trial (atau default kalau bukan trial)
  status(user: TierUserShape | null): TrialStatus {
    if (!user) {
      return { active: false, expired: false, daysLeft: 0, hoursLeft: 0, expiresAt: null };
    }
    if (user.tier === "trial") {
      return statusFromExpiry(user.trialExpiresAt, true);
    }
    if (user.tier === "full") {
      return statusFromExpiry(user.fullExpiresAt, true);
    }
    // admin
    return { active: true, expired: false, daysLeft: 0, hoursLeft: 0, expiresAt: null };
  },

  // Status spesifik untuk kode FULL
  fullStatus(user: TierUserShape | null): TrialStatus {
    if (!user || user.tier !== "full") {
      return { active: false, expired: false, daysLeft: 0, hoursLeft: 0, expiresAt: null };
    }
    return statusFromExpiry(user.fullExpiresAt, true);
  },

  canUseFullFeatures(user: TierUserShape | null): boolean {
    if (!user) return false;
    if (user.tier === "admin") return true;
    if (user.tier === "full") return Tier.fullStatus(user).active;
    return Tier.status(user).active;
  },

  isLocked(user: TierUserShape | null): boolean {
    // Trial atau Full yang sudah expired = locked (read-only mode)
    if (!user) return false;
    if (user.tier === "admin") return false;
    if (user.tier === "full") return Tier.fullStatus(user).expired;
    return Tier.status(user).expired;
  },

  badgeHtml(user: TierUserShape | null): { label: string; className: string } {
    if (!user) return { label: "—", className: "bg-gray-100 text-gray-700" };
    if (user.tier === "admin") return { label: "ADMIN", className: "bg-red-100 text-red-700 border border-red-300" };
    if (user.tier === "full") {
      const f = Tier.fullStatus(user);
      if (!user.fullExpiresAt) {
        return { label: "FULL", className: "bg-emerald-100 text-emerald-700 border border-emerald-300" };
      }
      if (f.expired) {
        return { label: "FULL EXPIRED", className: "bg-rose-100 text-rose-700 border border-rose-300" };
      }
      return { label: `FULL · ${f.daysLeft}h`, className: "bg-emerald-100 text-emerald-700 border border-emerald-300" };
    }
    const s = Tier.status(user);
    if (s.expired) return { label: "TRIAL EXPIRED", className: "bg-rose-100 text-rose-700 border border-rose-300" };
    return { label: `TRIAL · ${s.daysLeft}h`, className: "bg-amber-100 text-amber-800 border border-amber-300" };
  },
};
