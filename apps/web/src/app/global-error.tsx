"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application runtime error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] text-[#0F172A] min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] mb-2">
            Application Error
          </h2>
          <p className="text-sm text-[#64748B] mb-6">
            An unexpected error occurred in PBQuantum Labs.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm transition shadow-xs cursor-pointer"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
