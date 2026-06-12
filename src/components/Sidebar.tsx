"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  School,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  ClipboardList,
  PenTool,
  LogOut,
  Menu,
  X,
  Layers,
  Target,
  CalendarCheck,
  Trophy,
  MessageSquare,
  ShieldCheck,
  FileSpreadsheet,
  Settings,
  KeyRound,
  ShoppingCart,
  ShieldAlert,
} from "lucide-react";
import { Auth, type AppUser } from "@/lib/auth";
import { Tier } from "@/lib/tier";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const baseMenu: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
  { label: "Data Madrasah", href: "/madrasah", icon: <School size={20} /> },
  { label: "Data Guru", href: "/guru", icon: <Users size={20} /> },
  { label: "Data Siswa", href: "/siswa", icon: <GraduationCap size={20} /> },
  { label: "Buku Induk", href: "/buku-induk", icon: <BookOpen size={20} /> },
  { label: "Kelas / Rombel", href: "/kelas", icon: <Layers size={20} /> },
  { label: "Mata Pelajaran", href: "/mata-pelajaran", icon: <BookOpen size={20} /> },
  { label: "CP / TP / Materi", href: "/cp-tp", icon: <Target size={20} /> },
  { label: "Input Nilai", href: "/input-nilai", icon: <ClipboardList size={20} /> },
  { label: "Deskripsi Otomatis", href: "/deskripsi-otomatis", icon: <PenTool size={20} /> },
  { label: "Presensi", href: "/presensi", icon: <CalendarCheck size={20} /> },
  { label: "Ekstrakurikuler", href: "/ekstrakurikuler", icon: <Trophy size={20} /> },
  { label: "Catatan Wali Kelas", href: "/catatan-wali-kelas", icon: <MessageSquare size={20} /> },
  { label: "Validasi Raport", href: "/validasi-rapor", icon: <ShieldCheck size={20} /> },
  { label: "Cetak Raport", href: "/cetak-raport", icon: <FileText size={20} /> },
  { label: "Import/Export", href: "/import-export", icon: <FileSpreadsheet size={20} /> },
  { label: "Pengaturan", href: "/pengaturan", icon: <Settings size={20} /> },
];

const adminMenu: MenuItem[] = [
  { label: "Kelola User", href: "/admin/users", icon: <ShieldAlert size={18} />, adminOnly: true },
  { label: "Kode Aktivasi", href: "/admin/codes", icon: <KeyRound size={18} />, adminOnly: true },
  { label: "Pengaturan Pembelian", href: "/admin/pembelian", icon: <ShoppingCart size={18} />, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    (async () => {
      await Auth.ensureAdminSeeded();
      Tier.ensureAdminFullTier();
      setUser(Auth.current());
    })();
  }, [pathname]);

  const handleLogout = () => {
    Auth.logout();
    router.push("/login");
  };

  const badge = user ? Tier.badgeHtml(user) : null;

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-primary text-white p-2 rounded-lg shadow-lg"
        aria-label="Buka menu"
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-primary-900 text-white z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-primary-800">
            <div>
              <h1 className="text-lg font-bold leading-tight">Raport Digital</h1>
              <p className="text-xs text-primary-200">Madrasah KBC</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-white"
              aria-label="Tutup menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* User card */}
          {user && (
            <div className="px-4 py-3 border-b border-primary-800 bg-primary-800/40">
              <p className="text-sm font-medium truncate">{user.nama}</p>
              <p className="text-xs text-primary-200 truncate">{user.email}</p>
              {badge && (
                <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded ${badge.className}`}>
                  {badge.label}
                </span>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {baseMenu.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                        ${isActive
                          ? "bg-white/20 text-white font-medium"
                          : "text-primary-100 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  </li>
                );
              })}

              {user?.role === "admin" && (
                <>
                  <li className="pt-3 mt-3 border-t border-primary-800/60">
                    <p className="px-3 text-[10px] uppercase tracking-wider text-primary-300 font-semibold">Admin</p>
                  </li>
                  {adminMenu.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                            ${isActive
                              ? "bg-white/20 text-white font-medium"
                              : "text-primary-100 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </>
              )}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-primary-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-primary-100 hover:bg-white/10 hover:text-white w-full transition-colors"
            >
              <LogOut size={20} />
              Keluar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
