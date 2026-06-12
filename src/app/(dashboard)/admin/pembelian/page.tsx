"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CodeStore, type PurchaseSettings } from "@/lib/codes";
import { AdminGuard, AdminTabs } from "@/components/AdminShell";
import { Save, RotateCcw } from "lucide-react";

function PurchaseClient() {
  const [form, setForm] = useState<PurchaseSettings | null>(null);

  useEffect(() => {
    setForm(CodeStore.getPurchase());
  }, []);

  if (!form) return null;

  const update = (k: keyof PurchaseSettings, v: string) => setForm({ ...form, [k]: v });

  const handleSave = () => {
    CodeStore.savePurchase(form);
    toast.success("Pengaturan pembelian disimpan");
  };

  const handleReset = () => {
    if (!confirm("Reset semua pengaturan ke default?")) return;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CodeStore.KEY_PURCHASE);
    }
    setForm(CodeStore.getPurchase());
    toast.success("Pengaturan dikembalikan ke default");
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 outline-none";

  return (
    <div>
      <AdminTabs active="purchase" />
      <h1 className="text-xl font-bold text-gray-800 mb-1">Pengaturan Pembelian</h1>
      <p className="text-sm text-gray-600 mb-5">
        Konfigurasi info yang muncul di halaman <code>/beli-lisensi</code> dan template pesan WhatsApp.
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Aplikasi</label>
          <input value={form.appName} onChange={(e) => update("appName", e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Aplikasi</label>
          <input value={form.appUrl} onChange={(e) => update("appUrl", e.target.value)} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
            <input
              value={form.waNumber}
              onChange={(e) => update("waNumber", e.target.value.replace(/\D/g, ""))}
              placeholder="6281234567890"
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">Format internasional tanpa +</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Trial</label>
            <input value={form.hargaTrial} onChange={(e) => update("hargaTrial", e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Harga FULL (lifetime)</label>
          <input value={form.hargaFull} onChange={(e) => update("hargaFull", e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Info Pembayaran (Bank)</label>
          <textarea
            value={form.bankInfo}
            onChange={(e) => update("bankInfo", e.target.value)}
            rows={3}
            className={`${inputClass} font-mono text-xs`}
            placeholder={"BSI 123456789\na.n. Subariyanto\n..."}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Pesan Order (dipakai user)</label>
          <textarea
            value={form.orderTemplate}
            onChange={(e) => update("orderTemplate", e.target.value)}
            rows={5}
            className={`${inputClass} font-mono text-xs`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Placeholder yang didukung: <code>{"{APP}"}</code>, <code>{"{URL}"}</code>, <code>{"{NAMA}"}</code>, <code>{"{NIP}"}</code>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Distribusi Kode (dipakai admin)</label>
          <textarea
            value={form.sendTemplate}
            onChange={(e) => update("sendTemplate", e.target.value)}
            rows={6}
            className={`${inputClass} font-mono text-xs`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Placeholder: <code>{"{KODE}"}</code>, <code>{"{APP}"}</code>, <code>{"{URL}"}</code>, <code>{"{NAMA}"}</code>, <code>{"{NIP}"}</code>
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-4 py-2 rounded font-medium"
          >
            <Save size={16} /> Simpan
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded font-medium"
          >
            <RotateCcw size={16} /> Reset Default
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPurchasePage() {
  return (
    <AdminGuard>
      <PurchaseClient />
    </AdminGuard>
  );
}
