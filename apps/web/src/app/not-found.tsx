import React from "react";
import Link from "next/link";
import { Atom, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center mx-auto mb-4">
          <Atom className="w-6 h-6 animate-spin-slow" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#0F172A] mb-2 font-mono">404</h1>
        <h2 className="text-lg font-bold text-[#0F172A] mb-2">
          State Vector Not Found
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          The quantum laboratory module or path you requested does not exist in the current Hilbert space.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Laboratory Home</span>
        </Link>
      </div>
    </div>
  );
}
