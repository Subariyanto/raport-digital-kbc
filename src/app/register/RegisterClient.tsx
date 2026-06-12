"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Auth } from "@/lib/auth";

export default function RegisterClient() {
  const [nama, setNama] = useState("");
  const [nip, setNip] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Password dan konfirmasi tidak sama");
      return;
    }
    setLoading(true);
    try {
      await Auth.ensureAdminSeeded();
      const user = await Auth.register({
        nama,
        nip: nip.trim(),
        email: email.trim(),
        password,
        activationCode: code.trim(),
      });
      const tierLabel = user.tier === "full" ? "FULL (lifetime)" : "TRIAL 5 hari";
      toast.success(`Pendaftaran sukses · Tier: ${tierLabel}`);
      router.push("/dashboard");
    } catch (err) {
      toast.error((err as Error).message || "Pendaftaran gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Daftar Akun</h1>
            <p className="text-sm text-gray-500 mt-1">
              Tanpa kode = TRIAL 5 hari · Punya kode FULL = aktif lifetime
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nama lengkap dengan gelar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIP / NIK</label>
              <input
                type="text"
                inputMode="numeric"
                value={nip}
                onChange={(e) => setNip(e.target.value.replace(/\D/g, ""))}
                maxLength={18}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="18 digit (opsional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (opsional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="kosongkan kalau pakai NIP"
              />
              <p className="text-xs text-gray-500 mt-1">
                Kalau dikosongkan & NIP diisi, sistem pakai <code>{`<NIP>@madrasah.local`}</code>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Min 6 karakter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konfirmasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ulangi password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode Aktivasi</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 font-mono tracking-wider"
                placeholder="FULL-XXXX-XXXX-XXXX (opsional)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Kosong = TRIAL 5 hari · Diisi = sesuai prefix kode (TRIAL/FULL)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Daftar Sekarang"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href="/login" className="text-primary-700 hover:underline">
              ← Sudah punya akun? Login
            </Link>
            <Link href="/beli-lisensi" className="text-gray-500 hover:text-gray-800">
              Beli lisensi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
