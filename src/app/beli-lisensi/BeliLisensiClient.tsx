"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { CheckCircle2, MessageCircle, KeyRound } from "lucide-react";
import { Auth } from "@/lib/auth";
import { CodeStore, fillTemplate, buildWhatsappLink, type PurchaseSettings } from "@/lib/codes";
import { GithubSync } from "@/lib/github-sync";

export default function BeliLisensiClient() {
  const [purchase, setPurchase] = useState<PurchaseSettings | null>(null);
  const [code, setCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [orderName, setOrderName] = useState("");
  const [orderNip, setOrderNip] = useState("");
  const [orderMad, setOrderMad] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Fetch remote codes & purchase settings dulu, baru read local
    void GithubSync.refreshFromPublic().finally(() => {
      setPurchase(CodeStore.getPurchase());
    });
  }, []);

  const handleOrder = () => {
    if (!purchase) return;
    const tpl = purchase.orderTemplate
      .replace(/\n/g, "%0A")
      .replace(/Nama: $/m, `Nama: ${orderName}`);
    let txt = purchase.orderTemplate;
    if (orderName || orderNip || orderMad) {
      txt = txt
        .replace(/Nama: ?$/m, `Nama: ${orderName}`)
        .replace(/NIP: ?$/m, `NIP: ${orderNip}`)
        .replace(/Madrasah: ?$/m, `Madrasah: ${orderMad}`);
    }
    const filled = fillTemplate(txt, {
      APP: purchase.appName,
      URL: purchase.appUrl,
      NAMA: orderName,
      NIP: orderNip,
    });
    void tpl;
    const link = buildWhatsappLink(purchase.waNumber, filled);
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setActivating(true);
    try {
      if (!Auth.current()) {
        toast.error("Login dulu untuk aktivasi kode");
        router.push("/login");
        return;
      }
      const u = Auth.applyCode(code);
      toast.success(`Aktivasi sukses · Tier sekarang: ${u.tier.toUpperCase()}`);
      setCode("");
      router.push("/dashboard");
    } catch (err) {
      toast.error((err as Error).message || "Aktivasi gagal");
    } finally {
      setActivating(false);
    }
  };

  if (!purchase) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{purchase.appName}</h1>
          <p className="text-sm text-gray-600 mt-1">Pilih lisensi yang sesuai untuk madrasah Anda</p>
        </header>

        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {/* Trial card */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-amber-200">
            <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">TRIAL</span>
            <h2 className="text-2xl font-bold mt-3">{purchase.hargaTrial}</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-amber-600 mt-0.5" /> Akses semua fitur</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-amber-600 mt-0.5" /> Berlaku 5 hari</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-amber-600 mt-0.5" /> Tanpa kartu kredit</li>
            </ul>
            <Link
              href="/register"
              className="mt-5 inline-block w-full text-center bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 rounded-lg"
            >
              Daftar Trial Sekarang
            </Link>
          </div>

          {/* Full card */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-emerald-300 relative">
            <span className="absolute -top-3 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">REKOMENDASI</span>
            <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded">FULL</span>
            <h2 className="text-2xl font-bold mt-3">{purchase.hargaFull}</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-600 mt-0.5" /> Semua fitur tanpa batas</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-600 mt-0.5" /> Aktif lifetime</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-600 mt-0.5" /> Update versi gratis</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-600 mt-0.5" /> Support via WhatsApp</li>
            </ul>

            <div className="mt-5 space-y-2">
              <input
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
                placeholder="Nama"
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <input
                value={orderNip}
                onChange={(e) => setOrderNip(e.target.value.replace(/\D/g, ""))}
                placeholder="NIP"
                maxLength={18}
                inputMode="numeric"
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <input
                value={orderMad}
                onChange={(e) => setOrderMad(e.target.value)}
                placeholder="Nama madrasah"
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>

            <button
              onClick={handleOrder}
              className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              Pesan via WhatsApp
            </button>

            <div className="mt-4 text-xs text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded border">
              <strong>Pembayaran:</strong>
              {"\n"}{purchase.bankInfo}
            </div>
          </div>
        </div>

        {/* Activation form */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-bold flex items-center gap-2"><KeyRound size={18} /> Sudah Punya Kode? Aktivasi di Sini</h3>
          <p className="text-sm text-gray-600 mt-1">
            Masukkan kode yang sudah dikirim admin untuk upgrade akun Anda menjadi FULL.
          </p>
          <form onSubmit={handleActivate} className="mt-3 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FULL-XXXX-XXXX-XXXX"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-mono tracking-wider focus:ring-2 focus:ring-primary-500 outline-none"
              required
            />
            <button
              type="submit"
              disabled={activating}
              className="bg-primary hover:bg-primary-800 text-white font-medium px-5 rounded-lg disabled:opacity-50"
            >
              {activating ? "Memproses..." : "Aktifkan"}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Belum punya akun? <Link href="/register" className="text-primary-700 underline">Daftar dulu</Link>, lalu kembali ke sini.
          </p>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <Link href="/login" className="hover:text-gray-800">← Kembali ke halaman login</Link>
        </div>
      </div>
    </div>
  );
}
