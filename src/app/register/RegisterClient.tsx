"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Auth } from "@/lib/auth";
import { codeStatus, hasConfig } from "@/lib/supabase/activation";

type CodeCheckState = "idle" | "checking" | "valid" | "used" | "revoked" | "invalid" | "error";

export default function RegisterClient() {
  const [nama, setNama] = useState("");
  const [nip, setNip] = useState("");
  const [username, setUsername] = useState("");
  const [madrasah, setMadrasah] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [codeCheck, setCodeCheck] = useState<CodeCheckState>("idle");
  const [codeMessage, setCodeMessage] = useState("");
  const [roleFromCode, setRoleFromCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const RDMKBC_CODE_RE = /^RDMKBC-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

  const checkCode = async () => {
    const c = code.trim().toUpperCase();
    if (!c) {
      setCodeCheck("idle");
      setCodeMessage("");
      return;
    }
    if (!RDMKBC_CODE_RE.test(c)) {
      setCodeCheck("invalid");
      setCodeMessage("Format kode belum benar (RDMKBC-XXXX-XXXX)");
      return;
    }
    if (!hasConfig()) {
      setCodeCheck("idle");
      setCodeMessage("Server belum dikonfigurasi — kode akan dicek saat daftar.");
      return;
    }
    setCodeCheck("checking");
    setCodeMessage("Memeriksa kode aktivasi...");
    try {
      const res = await codeStatus(c);
      if (typeof res === "string") {
        if (res === "active") {
          setCodeCheck("valid");
          setCodeMessage("✓ Kode valid dan siap dipakai");
        } else if (res === "used") {
          setCodeCheck("used");
          setCodeMessage("Kode sudah dipakai untuk membuat akun");
        } else if (res === "revoked") {
          setCodeCheck("revoked");
          setCodeMessage("Kode telah dicabut Admin");
        } else if (res === "INVALID_CODE") {
          setCodeCheck("invalid");
          setCodeMessage("Kode tidak ditemukan di server");
        } else {
          setCodeCheck("error");
          setCodeMessage(res || "Status kode tidak dikenal");
        }
      } else {
        const data = res as Record<string, unknown>;
        if (data.ok) {
          setCodeCheck("valid");
          setCodeMessage("✓ Kode valid dan siap dipakai");
          if (data.role) setRoleFromCode(data.role as string);
          const d = data as Record<string, unknown>;
          if (d.madrasah && !madrasah.trim()) setMadrasah(d.madrasah as string);
          if (d.kabupaten && !kabupaten.trim()) setKabupaten(d.kabupaten as string);
        } else {
          const status = (data.status as string) || "UNKNOWN";
          if (status === "ALREADY_USED" || status === "used") {
            setCodeCheck("used");
            setCodeMessage((data.message as string) || "Kode sudah dipakai");
          } else if (status === "REVOKED" || status === "revoked") {
            setCodeCheck("revoked");
            setCodeMessage("Kode telah dicabut Admin");
          } else {
            setCodeCheck("invalid");
            setCodeMessage((data.message as string) || "Kode tidak ditemukan");
          }
        }
      }
    } catch {
      setCodeCheck("error");
      setCodeMessage("Gagal memeriksa kode. Periksa koneksi.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Kode aktivasi WAJIB diisi. Hubungi Admin untuk mendapatkan kode.");
      return;
    }
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
        username: username.trim(),
        password,
        msd: madrasah.trim(),
        kabupaten: kabupaten.trim(),
        role: roleFromCode || undefined,
        activationCode: code.trim(),
      });
      toast.success(`Akun berhasil dibuat. Selamat datang, ${user.nama}!`);
      router.push("/dashboard");
    } catch (err) {
      toast.error((err as Error).message || "Pendaftaran gagal");
    } finally {
      setLoading(false);
    }
  };

  const codeIndicatorClass = {
    idle: "text-gray-500",
    checking: "text-blue-600",
    valid: "text-emerald-600",
    used: "text-rose-600",
    revoked: "text-rose-600",
    invalid: "text-rose-600",
    error: "text-amber-600",
  }[codeCheck];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Daftar Akun</h1>
            <p className="text-sm text-gray-500 mt-1">
              Satu kode aktivasi untuk satu akun · Wajib kode dari Admin
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode Aktivasi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onBlur={checkCode}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 font-mono tracking-wider"
                placeholder="RDMKBC-XXXX-XXXX"
              />
              {codeMessage && (
                <p className={`text-xs mt-1 ${codeIndicatorClass}`}>{codeMessage}</p>
              )}
            </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                required
                minLength={4}
                autoComplete="username"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Untuk login (min 4 karakter)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Madrasah <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={madrasah}
                onChange={(e) => setMadrasah(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="cth: MIN 1 Jember"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kabupaten/Kota <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={kabupaten}
                onChange={(e) => setKabupaten(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="cth: Kabupaten Jember"
              />
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

            <button
              type="submit"
              disabled={loading || codeCheck === "checking"}
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

          <p className="text-center text-xs text-gray-600 mt-4 bg-gray-50 border border-gray-200 rounded p-2.5">
            Belum punya kode aktivasi? Hubungi Admin:{" "}
            <a
              href="https://wa.me/6282330647698"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-700 hover:underline"
            >
              0823-3064-7698
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
