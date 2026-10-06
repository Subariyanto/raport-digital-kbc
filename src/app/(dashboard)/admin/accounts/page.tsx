"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { AdminGuard, AdminTabs } from "@/components/AdminShell";
import { RefreshCw, Trash2, Power, KeyRound } from "lucide-react";
import {
  hasConfig,
  adminListAccounts,
  adminSetAccountActive,
  adminDeleteAccount,
  adminResetAccountPassword,
} from "@/lib/supabase/activation";
import { Auth } from "@/lib/auth";

interface ServerAccount {
  id: number;
  username: string;
  nama: string;
  nip: string | null;
  msd: string | null;
  kabupaten: string | null;
  role: string;
  tier: string;
  is_active: boolean;
  activation_code: string;
  created_at: string;
  last_login_at: string | null;
}

function AccountsClient() {
  const [accounts, setAccounts] = useState<ServerAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const [adminUser, setAdminUser] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  // Reset password modal state
  const [resetTarget, setResetTarget] = useState<ServerAccount | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const serverConfigured = hasConfig();

  const refresh = useCallback(() => setTick((x) => x + 1), []);

  useEffect(() => {
    const sess = Auth.ensureAdminSession();
    if (sess) setAdminUser(sess.username);
  }, []);

  const loadAccounts = useCallback(async () => {
    if (!serverConfigured || !adminUser) return;
    try {
      const res = await adminListAccounts(adminUser);
      if (typeof res !== "string" && (res as Record<string, unknown>).ok) {
        const data = (res as Record<string, unknown>).data as ServerAccount[];
        setAccounts(Array.isArray(data) ? data : []);
      } else {
        setAccounts([]);
      }
    } catch (e) {
      console.error("[accounts] Failed to load:", e);
    }
  }, [serverConfigured, adminUser]);

  useEffect(() => {
    if (serverConfigured) {
      void loadAccounts();
    }
  }, [tick, serverConfigured, loadAccounts]);

  const handleToggleActive = async (acc: ServerAccount) => {
    setLoading(true);
    try {
      const res = await adminSetAccountActive(adminUser!, acc.id, !acc.is_active);
      if (typeof res !== "string") {
        const data = res as Record<string, unknown>;
        if (data.ok) {
          toast.success(data.message as string);
        } else {
          toast.error((data.message as string) || "Gagal mengubah status akun");
        }
      } else {
        toast.error(res);
      }
      refresh();
    } catch (e) {
      toast.error((e as Error).message || "Gagal mengubah status akun");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (acc: ServerAccount) => {
    if (!confirm(`Hapus akun "${acc.username}" (${acc.nama})?\n\nKode aktivasi tetap berstatus "used". Tindakan ini tidak bisa dibatalkan.`)) return;
    setLoading(true);
    try {
      const res = await adminDeleteAccount(adminUser!, acc.id);
      if (typeof res !== "string") {
        const data = res as Record<string, unknown>;
        if (data.ok) {
          toast.success("Akun dihapus");
        } else {
          toast.error((data.message as string) || "Gagal menghapus akun");
        }
      } else {
        toast.error(res);
      }
      refresh();
    } catch (e) {
      toast.error((e as Error).message || "Gagal menghapus akun");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword.trim()) return;
    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setLoading(true);
    try {
      // Hash password with SHA-256 (same as registration/login)
      const enc = new TextEncoder().encode(newPassword);
      const hashBuf = await crypto.subtle.digest("SHA-256", enc);
      const hashHex = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const res = await adminResetAccountPassword(adminUser!, resetTarget.id, hashHex);
      if (typeof res !== "string") {
        const data = res as Record<string, unknown>;
        if (data.ok) {
          toast.success("Password akun berhasil direset");
        } else {
          toast.error((data.message as string) || "Gagal reset password");
        }
      } else {
        toast.error(res);
      }
      setResetTarget(null);
      setNewPassword("");
      refresh();
    } catch (e) {
      toast.error((e as Error).message || "Gagal reset password");
    } finally {
      setLoading(false);
    }
  };

  // Filter
  const filtered = accounts.filter((a) => {
    if (statusFilter === "active" && !a.is_active) return false;
    if (statusFilter === "inactive" && a.is_active) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.username.toLowerCase().includes(q) ||
        a.nama.toLowerCase().includes(q) ||
        (a.msd || "").toLowerCase().includes(q) ||
        (a.kabupaten || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  function formatDate(iso: string | null): string {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  function roleLabel(role: string): string {
    const map: Record<string, string> = {
      kepala_madrasah: "Kepala Madrasah",
      pengawas: "Pengawas",
      wali_kelas: "Wali Kelas",
      guru_mapel: "Guru Mapel",
    };
    return map[role] || role;
  }

  // Stats
  const totalAccounts = accounts.length;
  const activeCount = accounts.filter((a) => a.is_active).length;
  const inactiveCount = totalAccounts - activeCount;

  return (
    <div>
      <AdminTabs active="accounts" />
      <h1 className="text-xl font-bold text-gray-800 mb-2">Akun Terdaftar</h1>
      <p className="text-sm text-gray-600 mb-4">
        Daftar akun yang dibuat melalui aktivasi kode. Kelola status aktif, reset password, atau hapus akun.
      </p>

      {/* Server sync status */}
      <div className={`mb-4 p-3 rounded-lg border text-sm ${
        serverConfigured
          ? "bg-emerald-50 border-emerald-100 text-emerald-700"
          : "bg-amber-50 border-amber-100 text-amber-700"
      }`}>
        {serverConfigured ? (
          <>
            ✓ <strong>Sinkronisasi Supabase AKTIF.</strong> Data akun diambil dari server.
            {adminUser && <> Login admin: <strong>{adminUser}</strong></>}
          </>
        ) : (
          <>
            ⚠ <strong>Mode lokal (demo).</strong> Supabase belum dikonfigurasi.
            Data akun tidak tersedia. Set <code>.env.local</code> untuk mengaktifkan sinkronisasi server.
          </>
        )}
      </div>

      {!serverConfigured ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500 text-sm">
            Tidak ada data akun tersedia dalam mode lokal.
            <br />
            Akun terdaftar hanya tersimpan di server Supabase.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
              <p className="text-2xl font-bold text-gray-800">{totalAccounts}</p>
              <p className="text-xs text-gray-500">Total Akun</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 text-center">
              <p className="text-2xl font-bold text-emerald-700">{activeCount}</p>
              <p className="text-xs text-emerald-600">Aktif</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-3 border border-rose-100 text-center">
              <p className="text-2xl font-bold text-rose-700">{inactiveCount}</p>
              <p className="text-xs text-rose-600">Nonaktif</p>
            </div>
          </div>

          {/* Filter & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex gap-1">
              {(["all", "active", "inactive"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    statusFilter === f ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f === "all" ? "Semua" : f === "active" ? "Aktif" : "Nonaktif"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, username, madrasah..."
                className="px-3 py-1.5 border rounded text-sm w-64"
              />
              <button
                onClick={refresh}
                className="text-xs text-gray-600 inline-flex items-center gap-1 hover:text-gray-900"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="px-3 py-2.5">Username</th>
                  <th className="px-3 py-2.5">Nama</th>
                  <th className="px-3 py-2.5">NIP</th>
                  <th className="px-3 py-2.5">Madrasah</th>
                  <th className="px-3 py-2.5">Kabupaten</th>
                  <th className="px-3 py-2.5">Role</th>
                  <th className="px-3 py-2.5">Kode</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Terdaftar</th>
                  <th className="px-3 py-2.5">Login Terakhir</th>
                  <th className="px-3 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-gray-800">{a.username}</td>
                    <td className="px-3 py-2.5 text-gray-700">{a.nama}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{a.nip || "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">{a.msd || "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">{a.kabupaten || "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{roleLabel(a.role)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{a.activation_code}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          a.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {a.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{formatDate(a.created_at)}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{formatDate(a.last_login_at)}</td>
                    <td className="px-3 py-2.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        title={a.is_active ? "Nonaktifkan" : "Aktifkan"}
                        onClick={() => handleToggleActive(a)}
                        disabled={loading}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded ${
                          a.is_active
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                      >
                        <Power size={13} />
                      </button>
                      <button
                        title="Reset Password"
                        onClick={() => {
                          setResetTarget(a);
                          setNewPassword("");
                        }}
                        disabled={loading}
                        className="inline-flex items-center justify-center w-7 h-7 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        <KeyRound size={13} />
                      </button>
                      <button
                        title="Hapus"
                        onClick={() => handleDelete(a)}
                        disabled={loading}
                        className="inline-flex items-center justify-center w-7 h-7 rounded bg-gray-100 text-gray-700 hover:bg-rose-100 hover:text-rose-700"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-gray-500">
                      {search.trim()
                        ? `Tidak ada akun yang cocok dengan "${search}".`
                        : "Belum ada akun terdaftar."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-5 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 mb-1">Reset Password</h3>
            <p className="text-sm text-gray-600 mb-3">
              Akun: <strong>{resetTarget.username}</strong> ({resetTarget.nama})
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password baru (min. 6 karakter)"
              className="w-full px-3 py-2 border rounded text-sm mb-3"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setResetTarget(null);
                  setNewPassword("");
                }}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={handleResetPassword}
                disabled={loading || !newPassword.trim()}
                className="px-3 py-1.5 bg-primary text-white rounded text-sm hover:bg-primary-800 disabled:opacity-50"
              >
                {loading ? "Memproses..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAccountsPage() {
  return (
    <AdminGuard>
      <AccountsClient />
    </AdminGuard>
  );
}
