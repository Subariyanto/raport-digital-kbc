"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      await Auth.ensureAdminSeeded();
      const u = Auth.current();
      router.replace(u ? "/dashboard" : "/login");
    })();
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Memuat...
    </div>
  );
}
