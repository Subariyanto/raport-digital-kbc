"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Auth, type AppUser } from "@/lib/auth";
import { Tier } from "@/lib/tier";
import { AlertCircle, KeyRound, ShoppingCart } from "lucide-react";

export default function TrialBanner() {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    setUser(Auth.current());
    const onStorage = () => setUser(Auth.current());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!user) return null;
  if (user.tier === "admin" || user.tier === "full") return null;

  const status = Tier.status(user);

  if (status.expired) {
    return (
      <div className="mb-5 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 flex items-start gap-3">
        <AlertCircle className="text-rose-600 mt-0.5" size={20} />
        <div className="flex-1">
          <p className="font-bold text-rose-800">Trial Anda telah habis</p>
          <p className="text-sm text-rose-700 mt-0.5">
            Akun masuk mode <strong>read-only</strong>. Anda masih bisa melihat data lama, namun fitur Tambah / Ubah / Hapus / Cetak / Export dinonaktifkan. Aktivasi kode FULL untuk membuka kembali semua fitur.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/beli-lisensi"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium"
            >
              <ShoppingCart size={14} /> Beli Lisensi FULL
            </Link>
            <Link
              href="/beli-lisensi"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-gray-50 text-rose-700 border border-rose-300 text-sm font-medium"
            >
              <KeyRound size={14} /> Masukkan Kode FULL
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
      <AlertCircle className="text-amber-600 mt-0.5" size={20} />
      <div className="flex-1">
        <p className="font-bold text-amber-900">
          Mode Trial · sisa {status.daysLeft} hari
          {status.expiresAt && (
            <span className="ml-2 text-xs font-normal text-amber-700">
              (sampai {status.expiresAt.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })})
            </span>
          )}
        </p>
        <p className="text-sm text-amber-800 mt-0.5">
          Upgrade ke FULL untuk akses lifetime tanpa batas waktu.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/beli-lisensi"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium"
          >
            <ShoppingCart size={14} /> Upgrade ke FULL
          </Link>
          <Link
            href="/beli-lisensi"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-gray-50 text-amber-800 border border-amber-300 text-sm font-medium"
          >
            <KeyRound size={14} /> Masukkan Kode
          </Link>
        </div>
      </div>
    </div>
  );
}
