"use client";

import dynamic from "next/dynamic";
import { ComponentType } from "react";

// Wrapper to prevent SSR for pages that use localStorage/demoStore
export function noSSR<P extends object>(importFn: () => Promise<{ default: ComponentType<P> }>) {
  return dynamic(importFn, { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
      </div>
    ),
  });
}
