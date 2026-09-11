"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A] mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          A runtime exception occurred in this view. You can reload the state or return to the laboratory home.
        </p>
        {error.message && (
          <div className="mb-6 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-red-600 text-left overflow-x-auto max-h-24">
            {error.message}
          </div>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm transition shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] font-medium text-sm transition"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
