"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Auth, type AppUser } from "@/lib/auth";
import { Tier } from "@/lib/tier";
import { GithubSync } from "@/lib/github-sync";

interface AuthCtx {
  user: AppUser | null;
  refresh: () => void;
}

export function useDashboardAuth(): { user: AppUser | null; loading: boolean; refresh: () => void } {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Boot: fetch remote codes & purchase settings supaya cross-device sync jalan
      void GithubSync.refreshFromPublic();
      await Auth.ensureAdminSeeded();
      Tier.ensureAdminFullTier();
      const u = Auth.current();
      setUser(u);
      setLoading(false);
      if (!u) {
        router.replace("/login");
      }
    })();
  }, [tick, router]);

  return { user, loading, refresh: () => setTick((x) => x + 1) };
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useDashboardAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
}

export type { AuthCtx };
