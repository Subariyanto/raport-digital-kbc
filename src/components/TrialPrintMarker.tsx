"use client";

import { useEffect } from "react";
import { Auth } from "@/lib/auth";

/**
 * TrialPrintMarker
 * Toggles body class `trial-print-mark` whenever the current user is in the
 * trial tier (active or expired) so global @media print rules can stamp a
 * watermark across any printed/exported document.
 */
export default function TrialPrintMarker() {
  useEffect(() => {
    const apply = () => {
      try {
        const user = Auth.current();
        const isTrial = !!(user && user.tier === "trial");
        document.body.classList.toggle("trial-print-mark", isTrial);
      } catch {
        document.body.classList.remove("trial-print-mark");
      }
    };
    apply();
    const onStorage = () => apply();
    const onBeforePrint = () => apply();
    window.addEventListener("storage", onStorage);
    window.addEventListener("beforeprint", onBeforePrint);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("beforeprint", onBeforePrint);
    };
  }, []);

  return null;
}
