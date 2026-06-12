"use client";

import dynamic from "next/dynamic";

const RegisterClient = dynamic(() => import("./RegisterClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
    </div>
  ),
});

export default function RegisterPage() {
  return <RegisterClient />;
}
