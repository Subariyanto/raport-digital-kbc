"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CodeStore, fillTemplate, buildWhatsappLink, type ActivationCode, type CodePrefix, MASTER_CODE } from "@/lib/codes";
import { AdminGuard, AdminTabs } from "@/components/AdminShell";
import { Copy, MessageCircle, Trash2, Ban, RotateCcw, RefreshCw, Plus } from "lucide-react";

function CodesClient() {
  const [list, setList] = useState<ActivationCode[]>([]);
  const [tick, setTick] = useState(0);
  const [count, setCount] = useState(1);
  const [prefix, setPrefix] = useState<CodePrefix>("FULL");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "used" | "revoked">("all");

  useEffect(() => {
    setList(CodeStore.list());
  }, [tick]);

  const refresh = () => setTick((x) => x + 1);

  const handleGenerate = () => {
    const c = Math.max(1, Math.min(50, count));
    CodeStore.generate(prefix, c, note.trim() || undefined);
    toast.success(`${c} kode ${prefix} berhasil dibuat`);
    refresh();
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Kode disalin");
    } catch {
      toast.error("Gagal copy");
    }
  };

  const handleSendWA = (rec: ActivationCode) => {
    const p = CodeStore.getPurchase();
    const text = fillTemplate(p.sendTemplate, {
      KODE: rec.code,
      APP: p.appName,
      URL: p.appUrl,
      NIP: rec.usedByNip || "",
      NAMA: rec.usedByNama || "",
    });
    const link = buildWhatsappLink(p.waNumber, text);
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const handleRevoke = (rec: ActivationCode) => {
    CodeStore.revoke(rec.code);
    toast.success("Kode dicabut");
    refresh();
  };

  const handleUnrevoke = (rec: ActivationCode) => {
    CodeStore.unrevoke(rec.code);
    toast.success("Kode diaktifkan kembali");
    refresh();
  };

  const handleDelete = (rec: ActivationCode) => {
    if (!confirm(`Hapus kode ${rec.code}?`)) return;
    CodeStore.remove(rec.code);
    toast.success("Kode dihapus");
    refresh();
  };

  const filtered = filter === "all" ? list : list.filter((c) => c.status === filter);
  const stats = {
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
        Generate kode random TRIAL/FULL untuk dibagikan ke pengguna.<br/>
        Master code admin: <code className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">{MASTER_CODE}</code>
      </p>

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
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipe</label>
            <select
              value={prefix}
              onChange={(e) => setPrefix(e.target.value as CodePrefix)}
              className="px-3 py-2 border rounded text-sm"
            >
              <option value="FULL">FULL (lifetime)</option>
              <option value="TRIAL">TRIAL (5 hari)</option>
            </select>
          </div>
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
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Catatan (opsional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="cth: Pesanan bulan Juni"
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-primary hover:bg-primary-800 text-white rounded text-sm font-medium"
          >
            Generate
          </button>
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
              <th className="px-3 py-2.5">Tipe</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Pemakai</th>
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
                    className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                      c.prefix === "FULL"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {c.prefix}
                  </span>
                </td>
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
                  {c.usedByNama ? (
                    <>
                      <div>{c.usedByNama}</div>
                      {c.usedByNip && <div className="text-gray-400">{c.usedByNip}</div>}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-500">{c.note || "—"}</td>
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
                    onClick={() => handleSendWA(c)}
                    className="inline-flex items-center justify-center w-7 h-7 rounded bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    <MessageCircle size={13} />
                  </button>
                  {c.status === "active" && (
                    <button
                      title="Cabut"
                      onClick={() => handleRevoke(c)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded bg-rose-100 text-rose-700 hover:bg-rose-200"
                    >
                      <Ban size={13} />
                    </button>
                  )}
                  {c.status === "revoked" && (
                    <button
                      title="Aktifkan ulang"
                      onClick={() => handleUnrevoke(c)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}
                  <button
                    title="Hapus"
                    onClick={() => handleDelete(c)}
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
