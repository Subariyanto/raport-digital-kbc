"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Auth, type AppUser } from "@/lib/auth";
import { Tier, type TierKind } from "@/lib/tier";
import { AdminGuard, AdminTabs } from "@/components/AdminShell";
import { ArrowUp, ArrowDown, Trash2, KeyRound, RefreshCw, Pencil, Save, X } from "lucide-react";

function UsersClient() {
  const [list, setList] = useState<AppUser[]>([]);
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState<{ tier: TierKind; expires: string }>({ tier: "trial", expires: "" });

  useEffect(() => {
    setList(Auth.list());
  }, [tick]);

  const refresh = () => setTick((x) => x + 1);

  const handleUpgrade = (u: AppUser) => {
    Auth.upgradeUser(u.id, "(admin-action)");
    toast.success(`${u.nama} → FULL (1 tahun)`);
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

  const openEdit = (u: AppUser) => {
    if (u.role === "admin") {
      toast.error("Tier admin tidak bisa diubah (sepanjang masa)");
      return;
    }
    const expiry = u.tier === "full" ? u.fullExpiresAt : u.trialExpiresAt;
    setEditing(u);
    setForm({
      tier: u.tier === "admin" ? "full" : u.tier,
      expires: expiry ? new Date(expiry).toISOString().slice(0, 10) : "",
    });
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    try {
      const expiresIso = form.expires ? new Date(form.expires + "T23:59:59").toISOString() : null;
      Auth.updateTier(editing.id, {
        tier: form.tier,
        trialExpiresAt: form.tier === "trial" ? expiresIso : null,
        fullExpiresAt: form.tier === "full" ? expiresIso : null,
      });
      toast.success(`${editing.nama} → ${form.tier.toUpperCase()}`);
      setEditing(null);
      refresh();
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
              <th className="px-3 py-2.5">Expires</th>
              <th className="px-3 py-2.5">Aktivasi</th>
              <th className="px-3 py-2.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => {
              const badge = Tier.badgeHtml(u);
              const trialS = Tier.status(u);
              const fullS = Tier.fullStatus(u);
              const expiry = u.tier === "full" ? u.fullExpiresAt : u.tier === "trial" ? u.trialExpiresAt : null;
              const expiryStatus = u.tier === "full" ? fullS : trialS;
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
                    {u.role === "admin"
                      ? <span className="text-gray-400">sepanjang masa</span>
                      : expiry
                        ? `${new Date(expiry).toLocaleDateString("id-ID")} ${expiryStatus.expired ? "(habis)" : `(${expiryStatus.daysLeft}h)`}`
                        : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">
                    {u.activatedWith || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right space-x-1">
                    {u.role !== "admin" && (
                      <button
                        title="Edit Tier & Expiry"
                        onClick={() => openEdit(u)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {u.tier !== "full" && u.role !== "admin" && (
                      <button
                        title="Upgrade ke FULL (1 tahun)"
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
                      className="inline-flex items-center justify-center w-7 h-7 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
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

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="font-semibold text-gray-800">
                Edit Tier · <span className="text-gray-500 text-sm">{editing.nama}</span>
              </h3>
              <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-800">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tier</label>
                <select
                  value={form.tier}
                  onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as TierKind }))}
                  className="w-full px-3 py-2 border rounded text-sm"
                >
                  <option value="trial">TRIAL</option>
                  <option value="full">FULL</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Tanggal Expiry {form.tier === "full" ? "(default 1 tahun dari sekarang)" : "(default 5 hari dari sekarang)"}
                </label>
                <input
                  type="date"
                  value={form.expires}
                  onChange={(e) => setForm((f) => ({ ...f, expires: e.target.value }))}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kosongkan untuk pakai default.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + (form.tier === "full" ? 365 : 5));
                    setForm((f) => ({ ...f, expires: d.toISOString().slice(0, 10) }));
                  }}
                  className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Default {form.tier === "full" ? "+1 tahun" : "+5 hari"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 30);
                    setForm((f) => ({ ...f, expires: d.toISOString().slice(0, 10) }));
                  }}
                  className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  +30 hari
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 90);
                    setForm((f) => ({ ...f, expires: d.toISOString().slice(0, 10) }));
                  }}
                  className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  +90 hari
                </button>
              </div>
              <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded p-2">
                💡 Default kode FULL berlaku 1 tahun. Bapak bisa override per user dengan tanggal manual.
              </p>
            </div>
            <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm bg-primary hover:bg-primary-800 text-white rounded inline-flex items-center gap-1.5"
              >
                <Save size={14} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
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
