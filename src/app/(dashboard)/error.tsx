"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // best-effort log; ditampilkan di console biar admin bisa cek
    // eslint-disable-next-line no-console
    console.error("[dashboard error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md border p-6 text-center">
        <div className="text-3xl mb-2">⚠️</div>
        <h1 className="text-lg font-bold text-gray-900 mb-1">
          Terjadi error pada halaman
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Aplikasi mengalami exception saat memuat halaman ini. Coba muat ulang.
        </p>
        {error?.message ? (
          <pre className="text-[11px] text-left bg-gray-50 border rounded p-2 mb-3 whitespace-pre-wrap break-words text-gray-700">
            {error.message}
          </pre>
        ) : null}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => reset()}
            className="bg-primary hover:bg-primary-800 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Coba lagi
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined") window.location.href = "/raport-digital-kbc/dashboard";
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium px-4 py-2 rounded-lg"
          >
            Ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
