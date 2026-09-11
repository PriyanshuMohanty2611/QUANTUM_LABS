"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const LoadingVisualizer = () => (
  <div className="flex items-center justify-center min-h-[460px] bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 font-mono text-xs">
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      <span>Loading Quantum Visualizer...</span>
    </div>
  </div>
);

const BlochSphere3DStudio = dynamic(
  () => import("@/components/visualization/BlochSphere3DStudio"),
  { ssr: false, loading: LoadingVisualizer }
);
const Entanglement3DStudio = dynamic(
  () => import("@/components/visualization/Entanglement3DStudio"),
  { ssr: false, loading: LoadingVisualizer }
);
const WaveMechanicsLab = dynamic(
  () => import("@/components/visualization/WaveMechanicsLab"),
  { ssr: false, loading: LoadingVisualizer }
);
const GroverAlgorithmLab = dynamic(
  () => import("@/components/visualization/GroverAlgorithmLab"),
  { ssr: false, loading: LoadingVisualizer }
);
const BB84SecurityLab = dynamic(
  () => import("@/components/visualization/BB84SecurityLab"),
  { ssr: false, loading: LoadingVisualizer }
);
const MultiQubitMatrixLab = dynamic(
  () => import("@/components/visualization/MultiQubitMatrixLab"),
  { ssr: false, loading: LoadingVisualizer }
);
const CurriculumVisualsExplorer = dynamic(
  () => import("@/components/visualization/CurriculumVisualsExplorer"),
  { ssr: false, loading: LoadingVisualizer }
);
import {
  Sparkles,
  Globe,
  GitMerge,
  Waves,
  Search,
  KeyRound,
  Grid,
  BookOpen,
  Atom,
} from "lucide-react";

type VisualizerTab =
  | "bloch"
  | "entanglement"
  | "waves"
  | "grover"
  | "bb84"
  | "multiqubit"
  | "curriculum";

export default function VisualizationsPage() {
  const [activeTab, setActiveTab] = useState<VisualizerTab>("bloch");

  const TABS = [
    {
      id: "bloch" as VisualizerTab,
      label: "3D Bloch Sphere",
      icon: Globe,
      badge: "Single-Qubit",
    },
    {
      id: "entanglement" as VisualizerTab,
      label: "Entanglement & Bell States",
      icon: GitMerge,
      badge: "Non-Locality",
    },
    {
      id: "waves" as VisualizerTab,
      label: "Superposition & Waves",
      icon: Waves,
      badge: "Wave Mechanics",
    },
    {
      id: "grover" as VisualizerTab,
      label: "Grover's Algorithm",
      icon: Search,
      badge: "Algorithms",
    },
    {
      id: "bb84" as VisualizerTab,
      label: "Quantum Key Distribution",
      icon: KeyRound,
      badge: "Security",
    },
    {
      id: "multiqubit" as VisualizerTab,
      label: "Multi-Qubit Matrices",
      icon: Grid,
      badge: "Linear Algebra",
    },
    {
      id: "curriculum" as VisualizerTab,
      label: "Curriculum Domains (00–35)",
      icon: BookOpen,
      badge: "All Domains",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Hero Section Header */}
      <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              <Atom className="w-5 h-5 animate-spin-slow" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              Interactive Quantum Visualization Hub
            </h1>
          </div>
          <p className="text-sm text-[#475569] mt-1.5 max-w-2xl leading-relaxed">
            Mathematically rigorous, interactive 3D physics laboratories grounded directly in the 36-domain
            quantum curriculum. Study state vectors, non-local entanglement, phase interference, algorithms, and cryptography.
          </p>
        </div>
      </div>

      {/* Master Navigation Tab Bar */}
      <div className="flex overflow-x-auto gap-1.5 p-1.5 bg-white rounded-xl border border-[#E2E8F0] shadow-xs no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#64748B]"}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  isActive ? "bg-blue-700 text-blue-100" : "bg-[#F1F5F9] text-[#64748B]"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Studio View */}
      <div>
        {activeTab === "bloch" && <BlochSphere3DStudio />}
        {activeTab === "entanglement" && <Entanglement3DStudio />}
        {activeTab === "waves" && <WaveMechanicsLab />}
        {activeTab === "grover" && <GroverAlgorithmLab />}
        {activeTab === "bb84" && <BB84SecurityLab />}
        {activeTab === "multiqubit" && <MultiQubitMatrixLab />}
        {activeTab === "curriculum" && <CurriculumVisualsExplorer />}
      </div>
    </div>
  );
}
