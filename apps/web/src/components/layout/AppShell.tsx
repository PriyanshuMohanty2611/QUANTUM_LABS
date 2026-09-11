"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Cpu,
  FlaskConical,
  Trophy,
  BarChart3,
  Settings,
  Sparkles,
  Menu,
  X,
  User,
  ChevronRight,
} from "lucide-react";

import { QuantumNeuralBackground } from "./QuantumNeuralBackground";
import { QuantumCopilotDrawer } from "@/components/copilot/QuantumCopilotDrawer";

interface AppShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: "Curriculum", href: "/learn", icon: BookOpen },
  { label: "Visualizations", href: "/visualizations", icon: Sparkles },
  { label: "Simulator", href: "/simulator", icon: Cpu },
  { label: "Playground", href: "/playground", icon: FlaskConical },
  { label: "Challenges", href: "/challenges", icon: Trophy },
  { label: "Progress", href: "/progress", icon: BarChart3 },
];

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const rawPathname = usePathname();
  const pathname = rawPathname || "";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Dynamic Scroll Progress Tracker
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      } else {
        setScrollProgress(0);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const pathSegments = pathname ? pathname.split("/").filter(Boolean) : [];

  return (
    <div className="min-h-screen flex flex-col antialiased bg-[#F8FAFC] text-[#0F172A] relative">
      {/* Quantum Rotating Neural Background */}
      <QuantumNeuralBackground />

      {/* Top Professional Navigation Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0] shadow-xs relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link
              href="/learn"
              className="flex items-center gap-2.5 group rounded-md focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
            >
              <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold font-mono shadow-xs">
                PB
              </div>
              <span className="text-base font-bold tracking-tight text-[#0F172A] group-hover:text-[#2563EB] transition">
                PBQuantum Labs
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none ${
                      isActive
                        ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-semibold"
                        : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#2563EB]" : "text-[#64748B]"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Settings Link */}
            <Link
              href="/settings"
              title="Settings & Info"
              className="p-1.5 rounded-md bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] border border-[#E2E8F0] transition hidden sm:flex focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
            >
              <Settings className="w-4 h-4 text-[#2563EB]" />
            </Link>

            {/* AI Copilot Interactive Button */}
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-[#1E40AF] text-xs font-mono font-semibold transition shadow-2xs group focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
              title="Open QUANTUM AI Copilot (Groq LPU)"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB] group-hover:rotate-12 transition-transform" />
              <span>AI Copilot</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            </button>

            {/* Auth Shell: [Log in] [Create account] */}
            <div className="flex items-center gap-2 border-l border-[#E2E8F0] pl-3">
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-xs font-semibold text-[#0F172A] border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] transition px-2.5 py-1.5 rounded-md focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
              >
                Log in
              </button>
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition px-3 py-1.5 rounded-md shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
              >
                Create account
              </button>
            </div>

            {/* Mobile Drawer Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-[#2563EB]" /> : <Menu className="w-5 h-5 text-[#2563EB]" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 py-3 space-y-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsCopilotOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <span>QUANTUM AI Copilot</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold ${
                    isActive ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]" : "text-[#475569] hover:bg-[#F1F5F9]"
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#2563EB]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Dynamic Glowing Blue Scroll Progress Line Dividing Navbar & Content */}
        <div
          className="absolute -bottom-[1px] left-0 h-[2.5px] bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#60A5FA] shadow-[0_0_10px_rgba(37,99,235,0.85)] transition-[width] duration-75 ease-out z-50 pointer-events-none"
          style={{ width: `${scrollProgress}%` }}
        />
      </header>

      {/* Breadcrumbs Navigation Bar */}
      {pathSegments.length > 0 && (
        <div className="bg-white border-b border-[#E2E8F0] py-1.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-[11px] font-mono text-[#64748B]">
            <Link href="/learn" className="hover:text-[#0F172A] transition font-medium">Curriculum</Link>
            {pathSegments.map((seg, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
                <span className={idx === pathSegments.length - 1 ? "text-[#0F172A] font-semibold capitalize" : "capitalize text-[#64748B]"}>
                  {seg}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative z-10">
        {children}
      </main>

      {/* Scientific Laboratory Footer */}
      <footer className="border-t border-[#E2E8F0] py-6 text-xs text-[#64748B] bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0F172A]">PBQuantum Labs</span>
            <span className="text-[#CBD5E1]">·</span>
            <span>Interactive Quantum Computing Laboratory</span>
          </div>

          <div className="flex items-center gap-4 text-[#64748B] font-mono text-[11px]">
            <span>Engine: <strong className="text-[#2563EB] font-semibold">Qiskit Aer 0.15+</strong></span>
            <span>Schema: <strong className="text-[#2563EB] font-semibold">Quantum IR v1</strong></span>
          </div>
        </div>
      </footer>

      {/* Student Account Portal Shell */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl text-[#0F172A]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A]">
                <User className="w-4 h-4 text-[#2563EB]" />
                <span>Student Account Portal</span>
              </div>
              <button onClick={() => setShowLoginModal(false)} className="text-[#64748B] hover:text-[#0F172A]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              Student accounts will enable saving custom quantum circuits, syncing learning progress, and unlocking advanced simulation presets.
            </p>

            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-xs text-[#1E40AF]">
              <strong className="block mb-1 text-[#0F172A] font-bold">Phase 2 Architecture Ready:</strong>
              Student profile system will support Argon2id password hashing, secure HTTP-only cookies, and role-based challenge tracking.
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-xs focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Copilot Quick-Access Button */}
      {!isCopilotOpen && (
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 group focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
          title="Open QUANTUM AI Copilot (Groq LPU)"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white group-hover:rotate-12 transition-transform" />
          </div>
          <span className="text-xs font-bold tracking-tight pr-1">Ask QUANTUM</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* QUANTUM AI Copilot Drawer */}
      <QuantumCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
};
