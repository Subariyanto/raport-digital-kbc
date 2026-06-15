"use client";

import Sidebar from "@/components/Sidebar";
import TrialBanner from "@/components/TrialBanner";
import TrialPrintMarker from "@/components/TrialPrintMarker";
import { AuthGuard } from "@/components/AuthGuard";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Toaster position="top-right" />
      <TrialPrintMarker />
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 lg:ml-0">
          <div className="p-4 lg:p-8 pt-16 lg:pt-8">
            <TrialBanner />
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
