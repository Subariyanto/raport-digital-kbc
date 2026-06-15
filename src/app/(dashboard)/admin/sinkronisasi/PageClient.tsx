"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AdminGuard, AdminTabs } from "@/components/AdminShell";
import { GithubSync } from "@/lib/github-sync";
import { CodeStore } from "@/lib/codes";
import { RefreshCw, Save, Trash2, Send, ExternalLink, CheckCircle2, XCircle } from "lucide-react";

function SyncClient() {
  const [pat, setPat] = useState("");
  const [hasPat, setHasPat] = useState(false);
  const [testing, setTesting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [remoteInfo, setRemoteInfo] = useState<{ count: number; updatedAt: string | null } | null>(null);

  useEffect(() => {
    const cur = GithubSync.getPAT();
    setHasPat(!!cur);
    if (cur) setPat(cur.replace(/.(?=.{4})/g, "*"));
    void loadRemoteInfo();
  }, []);

  const loadRemoteInfo = async () => {
    setRefreshing(true);
    const data = await GithubSync.refreshFromPublic();
    if (data) {
      setRemoteInfo({ count: data.codes.length, updatedAt: data.updatedAt || null });
    } else {
      setRemoteInfo({ count: 0, updatedAt: null });
    }
    setRefreshing(false);
  };

  const handleSavePAT = () => {
    const trimmed = pat.trim();
    if (!trimmed || trimmed.includes("*")) {
      toast.error("Masukkan PAT yang valid (bukan placeholder asterisk)");
      return;
    }
    GithubSync.setPAT(trimmed);
    setHasPat(true);
    setPat(trimmed.replace(/.(?=.{4})/g, "*"));
    toast.success("PAT tersimpan");
    setTestResult(null);
  };

  const handleClearPAT = () => {
    if (!confirm("Hapus PAT? Setelah ini, sync ke GitHub akan berhenti sampai di-set ulang.")) return;
    GithubSync.clearPAT();
    setHasPat(false);
    setPat("");
    setTestResult(null);
    toast.success("PAT dihapus");
  };

  const handleTest = async () => {
    setTesting(true);
    const r = await GithubSync.testPAT();
    setTestResult(r);
    setTesting(false);
  };

  const handlePushNow = async () => {
    if (!hasPat) {
      toast.error("Set PAT dulu sebelum push manual");
      return;
    }
    setPushing(true);
    const localCodes = CodeStore.list();
    const purchase = CodeStore.getPurchase();
    const res = await GithubSync.pushIfConfigured(
      { codes: localCodes, purchase },
      "manual push " + new Date().toISOString()
    );
    setPushing(false);
    if (res.synced) {
      toast.success(`Push sukses · ${localCodes.length} kode + pengaturan pembelian`);
      void loadRemoteInfo();
    } else {
      toast.error("Push gagal: " + (res.error || res.reason));
    }
  };

  return (
    <div>
      <AdminTabs active="sync" />
      <h1 className="text-xl font-bold text-gray-800 mb-1">Sinkronisasi Cross-Device</h1>
      <p className="text-sm text-gray-600 mb-5">
        Setup ini sekali untuk membuat kode aktivasi & pengaturan pembelian bisa diakses dari device manapun.
        Tanpa sync, kode yang Bapak generate hanya tersimpan di browser ini saja.
      </p>

      {/* Status card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 max-w-2xl">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <RefreshCw size={16} /> Status Sinkronisasi
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-500">PAT</p>
            <p className="font-medium">{hasPat ? <span className="text-green-700">✅ Terpasang</span> : <span className="text-amber-700">⚠️ Belum diset</span>}</p>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-500">Kode di Cloud</p>
            <p className="font-medium">
              {remoteInfo === null ? "..." : `${remoteInfo.count} kode`}
            </p>
            {remoteInfo?.updatedAt && (
              <p className="text-xs text-gray-500 mt-0.5">
                Update: {new Date(remoteInfo.updatedAt).toLocaleString("id-ID")}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={loadRemoteInfo}
          disabled={refreshing}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Refresh info cloud
        </button>
      </div>

      {/* Setup PAT */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 max-w-2xl">
        <h2 className="font-semibold text-gray-800 mb-3">1. Setup GitHub Personal Access Token (PAT)</h2>
        <ol className="text-sm text-gray-700 space-y-2 mb-4 list-decimal pl-5">
          <li>
            Buka{" "}
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-700 underline inline-flex items-center gap-1"
            >
              github.com/settings/personal-access-tokens/new <ExternalLink size={12} />
            </a>
          </li>
          <li>
            Token name: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">RDMKBC Sync</code>
          </li>
          <li>Repository access: <strong>Only select repositories</strong> → pilih <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Subariyanto/raport-digital-kbc</code></li>
          <li>
            Permissions → Repository permissions:
            <ul className="list-disc pl-5 mt-1">
              <li><strong>Contents: Read and write</strong> (wajib)</li>
            </ul>
          </li>
          <li>Expiration: 1 tahun (biar nggak ribet expire)</li>
          <li>Klik <strong>Generate token</strong>, copy token (mulai dengan <code>github_pat_...</code>)</li>
          <li>Paste di kotak bawah, klik Simpan</li>
        </ol>

        <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Personal Access Token</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            placeholder="github_pat_..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <button
            onClick={handleSavePAT}
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium"
          >
            <Save size={14} /> Simpan
          </button>
          {hasPat && (
            <button
              onClick={handleClearPAT}
              className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded text-sm"
              title="Hapus PAT"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          PAT disimpan di localStorage browser ini saja (key <code>rdmkbc_v1_gh_pat</code>), tidak di-deploy ke GitHub.
        </p>
      </div>

      {/* Test & Push */}
      {hasPat && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 max-w-2xl">
          <h2 className="font-semibold text-gray-800 mb-3">2. Test & Push Manual</h2>

          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={handleTest}
              disabled={testing}
              className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
            >
              <CheckCircle2 size={14} /> {testing ? "Testing..." : "Test PAT"}
            </button>
            <button
              onClick={handlePushNow}
              disabled={pushing}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
            >
              <Send size={14} /> {pushing ? "Pushing..." : "Push Sekarang"}
            </button>
          </div>

          {testResult && (
            <div className={`text-sm rounded p-3 ${testResult.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-rose-50 border border-rose-200 text-rose-800"}`}>
              {testResult.ok ? <CheckCircle2 size={14} className="inline mr-1" /> : <XCircle size={14} className="inline mr-1" />}
              {testResult.message}
            </div>
          )}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-2xl text-sm text-amber-900">
        <p className="font-semibold mb-1">💡 Bagaimana cara kerjanya?</p>
        <ul className="list-disc pl-5 space-y-1 text-amber-800">
          <li>Setiap kali admin <strong>generate / revoke</strong> kode atau <strong>edit pengaturan pembelian</strong>, app otomatis push ke <code>data/codes.json</code> di branch <code>gh-pages</code>.</li>
          <li>Saat user buka /beli-lisensi atau /login dari device manapun, app otomatis fetch file tersebut dari raw GitHub (publik, tanpa auth).</li>
          <li>Lookup kode prioritas: <strong>localStorage → remote (cloud) → MASTER_CODE</strong>. Kode yang Bapak generate akan ketemu di device user.</li>
          <li>Kalau push gagal (network down, PAT expire), operasi lokal tetap sukses. Sync akan dicoba lagi pada save berikutnya.</li>
        </ul>
      </div>
    </div>
  );
}

export default function AdminSinkronisasiClient() {
  return (
    <AdminGuard>
      <SyncClient />
    </AdminGuard>
  );
}
