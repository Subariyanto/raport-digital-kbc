"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { CodeStore, fillTemplate, buildWhatsappLink, type ActivationCode } from "@/lib/codes";
import { AdminGuard, AdminTabs } from "@/components/AdminShell";
import { Copy, MessageCircle, Trash2, Ban, RefreshCw, Plus } from "lucide-react";
import {
  hasConfig,
  adminCreateCode,
  adminListCodes,
  adminRevokeCode,
  adminDeleteCode,
  adminDeleteAllCodes,
  adminStats,
  type CreateCodeParams,
} from "@/lib/supabase/activation";
import { Auth } from "@/lib/auth";

// Server-side code shape (from RPC)
interface ServerCode {
  code: string;
  status: string;
  nama?: string | null;
  madrasah?: string | null;
  kabupaten?: string | null;
  role?: string | null;
  catatan?: string | null;
  created_by?: string | null;
  created_at?: string;
  used_at?: string | null;
  used_by_username?: string | null;
  used_by_nama?: string | null;
}

interface ServerStats {
  total: number;
  active: number;
  used: number;
  revoked: number;
  accounts: number;
}

function CodesClient() {
  const [list, setList] = useState<ActivationCode[]>([]);
  const [serverList, setServerList] = useState<ServerCode[]>([]);
  const [serverStats, setServerStats] = useState<ServerStats | null>(null);
  const [tick, setTick] = useState(0);
  const [count, setCount] = useState(1);
  const [role, setRole] = useState("kepala_madrasah");
  const [nama, setNama] = useState("");
  const [madrasah, setMadrasah] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [catatan, setCatatan] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "used" | "revoked">("all");
  const [loading, setLoading] = useState(false);
  const [adminUser, setAdminUser] = useState<string | null>(null);

  const serverConfigured = hasConfig();

  const refresh = useCallback(() => setTick((x) => x + 1), []);

  useEffect(() => {
    // Get admin username from session (auto-fill dari login admin bila perlu)
    const sess = Auth.ensureAdminSession();
    if (sess) setAdminUser(sess.username);
  }, []);

  const loadServerData = useCallback(async () => {
    if (!serverConfigured || !adminUser) return;
    try {
      const [codesRes, statsRes] = await Promise.all([
        adminListCodes(adminUser),
        adminStats(adminUser),
      ]);

      if (typeof codesRes !== "string" && (codesRes as Record<string, unknown>).ok) {
        const data = (codesRes as Record<string, unknown>).data as ServerCode[];
        setServerList(Array.isArray(data) ? data : []);
      } else {
        setServerList([]);
      }

      if (typeof statsRes !== "string" && (statsRes as Record<string, unknown>).ok) {
        setServerStats(statsRes as unknown as ServerStats);
      }
    } catch (e) {
      console.error("[codes] Failed to load server data:", e);
    }
  }, [serverConfigured, adminUser]);

  useEffect(() => {
    if (serverConfigured) {
      void loadServerData();
    } else {
      setList(CodeStore.list());
    }
  }, [tick, serverConfigured, loadServerData]);

  const handleGenerate = async () => {
    const c = Math.max(1, Math.min(50, count));
    setLoading(true);
    try {
      if (serverConfigured && adminUser) {
        const params: CreateCodeParams = {
          nama: nama.trim() || null,
          madrasah: madrasah.trim() || null,
          kabupaten: kabupaten.trim() || null,
          role: role || null,
          catatan: catatan.trim() || null,
          adminUsername: adminUser,
          prefix: "RDMKBC",
          count: c,
        };
        const res = await adminCreateCode(params);
        if (typeof res !== "string") {
          const data = res as Record<string, unknown>;
          if (data.ok) {
            const codes = data.codes as string[];
            toast.success(`${codes.length} kode aktivasi berhasil dibuat di server`);
          } else {
            toast.error((data.message as string) || "Gagal membuat kode");
          }
        } else {
          toast.error(res);
        }
      } else {
        // Local fallback
        CodeStore.generate("FULL", c, catatan.trim() || undefined);
        toast.success(`${c} kode lokal berhasil dibuat`);
      }
      refresh();
    } catch (e) {
      toast.error((e as Error).message || "Gagal generate kode");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Kode disalin");
    } catch {
      toast.error("Gagal copy");
    }
  };

  const handleSendWA = (code: string, namaPemakai?: string, nipPemakai?: string) => {
    const p = CodeStore.getPurchase();
    const text = fillTemplate(p.sendTemplate, {
      KODE: code,
      APP: p.appName,
      URL: p.appUrl,
      NIP: nipPemakai || "",
      NAMA: namaPemakai || "",
    });
    const link = buildWhatsappLink(p.waNumber, text);
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const handleRevoke = async (code: string) => {
    setLoading(true);
    try {
      if (serverConfigured && adminUser) {
        const res = await adminRevokeCode(code, adminUser);
        if (typeof res !== "string") {
          const data = res as Record<string, unknown>;
          if (data.ok) toast.success("Kode dicabut di server");
          else toast.error((data.message as string) || "Gagal mencabut kode");
        } else {
          toast.error(res);
        }
      } else {
        CodeStore.revoke(code);
        toast.success("Kode dicabut (lokal)");
      }
      refresh();
    } catch (e) {
      toast.error((e as Error).message || "Gagal mencabut kode");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Hapus kode ${code}?`)) return;
    setLoading(true);
    try {
      if (serverConfigured && adminUser) {
        const res = await adminDeleteCode(code, adminUser);
        if (typeof res !== "string") {
          const data = res as Record<string, unknown>;
          if (data.ok) toast.success("Kode dihapus dari server");
          else toast.error((data.message as string) || "Gagal menghapus kode");
        } else {
          toast.error(res);
        }
      } else {
        CodeStore.remove(code);
        toast.success("Kode dihapus (lokal)");
      }
      refresh();
    } catch (e) {
      toast.error((e as Error).message || "Gagal menghapus kode");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Hapus SEMUA kode tidak terpakai (aktif)? Tindakan ini tidak bisa dibatalkan.")) return;
    setLoading(true);
    try {
      if (serverConfigured && adminUser) {
        const res = await adminDeleteAllCodes(adminUser);
        if (typeof res !== "string") {
          const data = res as Record<string, unknown>;
          if (data.ok) {
            const deleted = data.deleted as number;
            toast.success(`${deleted} kode tidak terpakai dihapus dari server`);
          } else {
            toast.error((data.message as string) || "Gagal menghapus");
          }
        } else {
          toast.error(res);
        }
      } else {
        const all = CodeStore.list().filter((c) => c.status === "active");
        all.forEach((c) => CodeStore.remove(c.code));
        toast.success(`${all.length} kode lokal dihapus`);
      }
      refresh();
    } catch (e) {
      toast.error((e as Error).message || "Gagal menghapus");
    } finally {
      setLoading(false);
    }
  };

  // Build display list from server or local
  const displayCodes: {
    code: string;
    status: string;
    prefix: string;
    nama?: string | null;
    madrasah?: string | null;
    kabupaten?: string | null;
    role?: string | null;
    catatan?: string | null;
    usedByNama?: string | null;
    usedByNip?: string | null;
    note?: string | null;
  }[] = serverConfigured
    ? serverList.map((c) => ({
        code: c.code,
        status: c.status,
        prefix: "RDMKBC",
        nama: c.nama,
        madrasah: c.madrasah,
        kabupaten: c.kabupaten,
        role: c.role,
        catatan: c.catatan,
        usedByNama: c.used_by_nama,
        usedByNip: null,
        note: c.catatan,
      }))
    : list.map((c) => ({
        code: c.code,
        status: c.status,
        prefix: c.prefix,
        nama: null,
        madrasah: null,
        kabupaten: null,
        role: null,
        catatan: null,
        usedByNama: c.usedByNama,
        usedByNip: c.usedByNip,
        note: c.note,
      }));

  const filtered =
    filter === "all"
      ? displayCodes
      : displayCodes.filter((c) => c.status === filter);

  const stats = serverConfigured && serverStats
    ? {
        total: serverStats.total,
        active: serverStats.active,
        used: serverStats.used,
        revoked: serverStats.revoked,
      }
    : {
        total: list.length,
        active: list.filter((c) => c.status === "active").length,
        used: list.filter((c) => c.status === "used").length,
        revoked: list.filter((c) => c.status === "revoked").length,
      };

  return (
    <div>
      <AdminTabs active="codes" />
      <h1 className="text-xl font-bold text-gray-800 mb-2">Kode Aktivasi</h1>
      <p className="text-sm text-gray-600 mb-4">
        Generate kode aktivasi (RDMKBC-XXXX-XXXX) untuk dibagikan ke pengguna.
        <br />
        Satu kode = satu akun. Kode hanya bisa dipakai 1x.
      </p>

      {/* Server sync status */}
      <div className={`mb-4 p-3 rounded-lg border text-sm ${
        serverConfigured
          ? "bg-emerald-50 border-emerald-100 text-emerald-700"
          : "bg-amber-50 border-amber-100 text-amber-700"
      }`}>
        {serverConfigured ? (
          <>
            ✓ <strong>Sinkronisasi Supabase AKTIF.</strong> Kode disimpan di server.
            {adminUser && <> Login admin: <strong>{adminUser}</strong></>}
          </>
        ) : (
          <>
            ⚠ <strong>Mode lokal (demo).</strong> Supabase belum dikonfigurasi.
            Kode hanya tersimpan di browser ini. Set .env.local untuk sinkronisasi server.
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 text-center">
          <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
          <p className="text-xs text-emerald-600">Aktif</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 text-center">
          <p className="text-2xl font-bold text-blue-700">{stats.used}</p>
          <p className="text-xs text-blue-600">Terpakai</p>
        </div>
        <div className="bg-rose-50 rounded-lg p-3 border border-rose-100 text-center">
          <p className="text-2xl font-bold text-rose-700">{stats.revoked}</p>
          <p className="text-xs text-rose-600">Dicabut</p>
        </div>
      </div>

      {/* Generator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Plus size={16} /> Generate Kode Baru
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nama Pemilik (opsional)</label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="cth: Ahmad Fauzi"
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Madrasah (opsional)</label>
            <input
              value={madrasah}
              onChange={(e) => setMadrasah(e.target.value)}
              placeholder="cth: MIN 1 Jember"
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Kabupaten (opsional)</label>
            <input
              value={kabupaten}
              onChange={(e) => setKabupaten(e.target.value)}
              placeholder="cth: Kabupaten Jember"
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="kepala_madrasah">Kepala Madrasah</option>
              <option value="pengawas">Pengawas</option>
              <option value="wali_kelas">Wali Kelas</option>
              <option value="guru_mapel">Guru Mapel</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Catatan (opsional)</label>
            <input
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="cth: Pesanan bulan Oktober"
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Jumlah</label>
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border rounded text-sm"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 bg-primary hover:bg-primary-800 text-white rounded text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Generate"}
          </button>
          {serverConfigured && (
            <button
              onClick={handleDeleteAll}
              disabled={loading}
              className="ml-auto px-3 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded text-xs font-medium"
            >
              Hapus Semua Tidak Terpakai
            </button>
          )}
        </div>
      </div>

      {/* Filter & List */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {(["all", "active", "used", "revoked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === f ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "Semua" : f === "active" ? "Aktif" : f === "used" ? "Terpakai" : "Dicabut"}
            </button>
          ))}
        </div>
        <button onClick={refresh} className="text-xs text-gray-600 inline-flex items-center gap-1 hover:text-gray-900">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs uppercase text-gray-500">
              <th className="px-3 py-2.5">Kode</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Pemilik/Pemakai</th>
              <th className="px-3 py-2.5">Role</th>
              <th className="px-3 py-2.5">Catatan</th>
              <th className="px-3 py-2.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.code} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2.5 font-mono text-xs">{c.code}</td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs ${
                      c.status === "active"
                        ? "bg-blue-100 text-blue-700"
                        : c.status === "used"
                        ? "bg-gray-200 text-gray-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-600">
                  {c.usedByNama || c.nama || "—"}
                  {c.madrasah && <div className="text-gray-400">{c.madrasah}</div>}
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-500">{c.role || "—"}</td>
                <td className="px-3 py-2.5 text-xs text-gray-500">{c.catatan || c.note || "—"}</td>
                <td className="px-3 py-2.5 text-right space-x-1">
                  <button
                    title="Copy"
                    onClick={() => handleCopy(c.code)}
                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    title="Kirim via WhatsApp"
                    onClick={() => handleSendWA(c.code, c.usedByNama || c.nama || "", c.usedByNip || "")}
                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    <MessageCircle size={13} />
                  </button>
                  {c.status === "active" && (
                    <button
                      title="Cabut"
                      onClick={() => handleRevoke(c.code)}
                      disabled={loading}
                      className="inline-flex items-center justify-center w-7 h-7 rounded bg-rose-100 text-rose-700 hover:bg-rose-200"
                    >
                      <Ban size={13} />
                    </button>
                  )}
                  <button
                    title="Hapus"
                    onClick={() => handleDelete(c.code)}
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
                <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                  Belum ada kode {filter !== "all" ? `(filter: ${filter})` : ""}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminCodesPage() {
  return (
    <AdminGuard>
      <CodesClient />
    </AdminGuard>
  );
}
