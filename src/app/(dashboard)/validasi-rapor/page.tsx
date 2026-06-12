"use client";
import dynamic from "next/dynamic";

const PageClient = dynamic(() => import("./PageClient"), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
    </div>
  ),
});

export default function Page() {
  return <PageClient />;
}
