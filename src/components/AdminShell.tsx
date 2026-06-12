"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Auth, type AppUser } from "@/lib/auth";
import { Users as UsersIcon, KeyRound, ShoppingCart, ArrowLeft } from "lucide-react";

export function AdminGuard({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await Auth.ensureAdminSeeded();
      const u = Auth.current();
      setUser(u);
      setReady(true);
      if (!u) {
        router.push("/login");
      } else if (u.role !== "admin") {
        router.push("/dashboard");
      }
    })();
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">Akses ditolak — halaman ini khusus admin.</p>
        <Link href="/dashboard" className="text-primary-700 underline mt-2 inline-block">Kembali ke Dashboard</Link>
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminTabs({ active }: { active: "users" | "codes" | "purchase" }) {
  const tabs = [
    { id: "users", label: "Kelola User", href: "/admin/users", icon: <UsersIcon size={16} /> },
    { id: "codes", label: "Kode Aktivasi", href: "/admin/codes", icon: <KeyRound size={16} /> },
    { id: "purchase", label: "Pengaturan Pembelian", href: "/admin/pembelian", icon: <ShoppingCart size={16} /> },
  ] as const;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
      <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1 mr-2">
        <ArrowLeft size={14} /> Dashboard
      </Link>
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            active === t.id
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t.icon}
          {t.label}
        </Link>
      ))}
    </div>
  );
}
