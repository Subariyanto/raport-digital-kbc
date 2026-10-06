"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Auth } from "@/lib/auth";
import { hasConfig } from "@/lib/supabase/activation";

export default function LoginClient() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const serverConfigured = hasConfig();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Auth.ensureAdminSeeded();
      const user = await Auth.login(identifier, password);
      toast.success(`Selamat datang, ${user.nama}`);
      router.push("/dashboard");
    } catch (err) {
      toast.error((err as Error).message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">R</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Raport Digital</h1>
            <p className="text-sm text-gray-500 mt-1">Madrasah KBC</p>
          </div>

          {/* Server status indicator */}
          {serverConfigured ? (
            <div className="mb-4 text-xs text-center text-emerald-600 bg-emerald-50 border border-emerald-100 rounded py-1.5">
              ✓ Terhubung ke server (Supabase)
            </div>
          ) : (
            <div className="mb-4 text-xs text-center text-amber-600 bg-amber-50 border border-amber-100 rounded py-1.5">
              Mode demo (offline) — login lokal
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                Username / Email / NIP
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="Username atau email atau NIP"
              />
              <p className="text-xs text-gray-500 mt-1">
                Akun baru menggunakan username. Akun lama bisa pakai email/NIP.
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="Password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href="/register" className="text-primary-700 hover:underline font-medium">
              Daftar akun baru
            </Link>
            <Link href="/beli-lisensi" className="text-gray-500 hover:text-gray-800">
              Beli lisensi
            </Link>
          </div>

          <p className="text-center text-xs text-gray-600 mt-4 bg-gray-50 border border-gray-200 rounded p-2.5">
            Belum punya akun? Hubungi Admin:{" "}
            <a
              href="https://wa.me/6282330647698"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-700 hover:underline"
            >
              0823-3064-7698
            </a>
          </p>

          <p className="text-center text-xs text-gray-400 mt-6">
            Kurikulum Berbasis Cinta &bull; Kemenag 2026
          </p>
        </div>
      </div>
    </div>
  );
}
