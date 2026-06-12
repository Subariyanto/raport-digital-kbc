// Tier model: admin / full / trial. Pure helpers (no auth dependency).
"use client";

export type TierKind = "admin" | "full" | "trial";

export const TRIAL_DAYS = 5;

export function defaultTrialExpiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d.toISOString();
}

interface TierUserShape {
  tier: TierKind;
  trialExpiresAt?: string | null;
  role?: "admin" | "user";
}

export interface TrialStatus {
  active: boolean;
  expired: boolean;
  daysLeft: number;
  hoursLeft: number;
  expiresAt: Date | null;
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
      }
      if (changed) window.localStorage.setItem("rdmkbc_v1_users", JSON.stringify(list));
    } catch {
      // ignore
    }
  },

  status(user: TierUserShape | null): TrialStatus {
    if (!user || user.tier !== "trial" || !user.trialExpiresAt) {
      return { active: user?.tier !== "trial", expired: false, daysLeft: 0, hoursLeft: 0, expiresAt: null };
    }
    const exp = new Date(user.trialExpiresAt);
    const ms = exp.getTime() - Date.now();
    const expired = ms <= 0;
    const daysLeft = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
    const hoursLeft = Math.max(0, Math.floor(ms / (1000 * 60 * 60)));
    return { active: !expired, expired, daysLeft, hoursLeft, expiresAt: exp };
  },

  canUseFullFeatures(user: TierUserShape | null): boolean {
    if (!user) return false;
    if (user.tier === "admin" || user.tier === "full") return true;
    return Tier.status(user).active;
  },

  badgeHtml(user: TierUserShape | null): { label: string; className: string } {
    if (!user) return { label: "—", className: "bg-gray-100 text-gray-700" };
    if (user.tier === "admin") return { label: "ADMIN", className: "bg-red-100 text-red-700 border border-red-300" };
    if (user.tier === "full") return { label: "FULL", className: "bg-emerald-100 text-emerald-700 border border-emerald-300" };
    const s = Tier.status(user);
    if (s.expired) return { label: "TRIAL EXPIRED", className: "bg-rose-100 text-rose-700 border border-rose-300" };
    return { label: `TRIAL · ${s.daysLeft}h`, className: "bg-amber-100 text-amber-800 border border-amber-300" };
  },
};
