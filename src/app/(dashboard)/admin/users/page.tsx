"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Auth, type AppUser } from "@/lib/auth";
import { Tier } from "@/lib/tier";
import { AdminGuard, AdminTabs } from "@/components/AdminShell";
import { ArrowUp, ArrowDown, Trash2, KeyRound, RefreshCw } from "lucide-react";

function UsersClient() {
  const [list, setList] = useState<AppUser[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setList(Auth.list());
  }, [tick]);

  const refresh = () => setTick((x) => x + 1);

  const handleUpgrade = (u: AppUser) => {
    Auth.upgradeUser(u.id, "(admin-action)");
    toast.success(`${u.nama} → FULL`);
    refresh();
  };

  const handleDowngrade = (u: AppUser) => {
    try {
      Auth.downgradeUser(u.id);
      toast.success(`${u.nama} → TRIAL 5 hari`);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = (u: AppUser) => {
    if (!confirm(`Hapus user ${u.nama}? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      Auth.deleteUser(u.id);
      toast.success("User dihapus");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleResetPassword = async (u: AppUser) => {
    const pwd = prompt(`Password baru untuk ${u.nama} (minimal 6 karakter):`, "password123");
    if (!pwd) return;
    try {
      await Auth.resetPassword(u.id, pwd);
      toast.success("Password berhasil direset");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <AdminTabs active="users" />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Kelola User · {list.length} akun</h1>
        <button onClick={refresh} className="text-sm text-gray-600 inline-flex items-center gap-1 hover:text-gray-900">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs uppercase text-gray-500">
              <th className="px-3 py-2.5">Nama</th>
              <th className="px-3 py-2.5">NIP</th>
              <th className="px-3 py-2.5">Email / ID</th>
              <th className="px-3 py-2.5">Tier</th>
              <th className="px-3 py-2.5">Trial Expires</th>
              <th className="px-3 py-2.5">Aktivasi</th>
              <th className="px-3 py-2.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => {
              const badge = Tier.badgeHtml(u);
              const status = Tier.status(u);
              return (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2.5 font-medium text-gray-800">{u.nama}</td>
                  <td className="px-3 py-2.5 text-gray-600">{u.nip || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600 text-xs">{u.email}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">
                    {u.tier === "trial" && u.trialExpiresAt
                      ? `${new Date(u.trialExpiresAt).toLocaleDateString("id-ID")} ${status.expired ? "(habis)" : `(${status.daysLeft}h)`}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">
                    {u.activatedWith || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right space-x-1">
                    {u.tier !== "full" && u.role !== "admin" && (
                      <button
                        title="Upgrade ke FULL"
                        onClick={() => handleUpgrade(u)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      >
                        <ArrowUp size={14} />
                      </button>
                    )}
                    {u.tier !== "trial" && u.role !== "admin" && (
                      <button
                        title="Downgrade ke TRIAL"
                        onClick={() => handleDowngrade(u)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded bg-amber-100 text-amber-700 hover:bg-amber-200"
                      >
                        <ArrowDown size={14} />
                      </button>
                    )}
                    <button
                      title="Reset Password"
                      onClick={() => handleResetPassword(u)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      <KeyRound size={14} />
                    </button>
                    {u.role !== "admin" && (
                      <button
                        title="Hapus"
                        onClick={() => handleDelete(u)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded bg-rose-100 text-rose-700 hover:bg-rose-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  Belum ada user terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <UsersClient />
    </AdminGuard>
  );
}
