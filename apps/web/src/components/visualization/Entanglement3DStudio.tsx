"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Zap,
  Activity,
  GitMerge,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Radio,
  ArrowRight,
} from "lucide-react";

type EntangledStateKey = "phi_plus" | "phi_minus" | "psi_plus" | "psi_minus" | "ghz" | "separable";

interface StateDefinition {
  name: string;
  latex: string;
  description: string;
  qubits: number;
  amplitudes: { [basis: string]: number }; // basis -> real amplitude
  separable: boolean;
}

const STATES: Record<EntangledStateKey, StateDefinition> = {
  phi_plus: {
    name: "Bell |Φ⁺⟩",
    latex: "(|00⟩ + |11⟩) / √2",
    description: "Maximally entangled state. Perfect correlation: measuring 0 on Qubit A guarantees 0 on Qubit B.",
    qubits: 2,
    amplitudes: { "00": 1 / Math.SQRT2, "01": 0, "10": 0, "11": 1 / Math.SQRT2 },
    separable: false,
  },
  phi_minus: {
    name: "Bell |Φ⁻⟩",
    latex: "(|00⟩ - |11⟩) / √2",
    description: "Maximally entangled state with a relative π phase shift between |00⟩ and |11⟩.",
    qubits: 2,
    amplitudes: { "00": 1 / Math.SQRT2, "01": 0, "10": 0, "11": -1 / Math.SQRT2 },
    separable: false,
  },
  psi_plus: {
    name: "Bell |Ψ⁺⟩",
    latex: "(|01⟩ + |10⟩) / √2",
    description: "Maximally entangled state with anti-correlation: measuring 0 on A guarantees 1 on B.",
    qubits: 2,
    amplitudes: { "00": 0, "01": 1 / Math.SQRT2, "10": 1 / Math.SQRT2, "11": 0 },
    separable: false,
  },
  psi_minus: {
    name: "Bell |Ψ⁻⟩ (Singlet)",
    latex: "(|01⟩ - |10⟩) / √2",
    description: "Rotational invariant singlet state with anti-correlation in all measurement bases.",
    qubits: 2,
    amplitudes: { "00": 0, "01": 1 / Math.SQRT2, "10": -1 / Math.SQRT2, "11": 0 },
    separable: false,
  },
  ghz: {
    name: "GHZ (3-Qubit)",
    latex: "(|000⟩ + |111⟩) / √2",
    description: "Tripartite Greenberger–Horne–Zeilinger state with non-local correlations across three observers.",
    qubits: 3,
    amplitudes: { "000": 1 / Math.SQRT2, "111": 1 / Math.SQRT2 },
    separable: false,
  },
  separable: {
    name: "Separable |00⟩",
    latex: "|0⟩ ⊗ |0⟩",
    description: "Independent, unentangled product state. Measurement of Qubit A reveals nothing about Qubit B.",
    qubits: 2,
    amplitudes: { "00": 1, "01": 0, "10": 0, "11": 0 },
    separable: true,
  },
};

export const Entanglement3DStudio: React.FC = () => {
  const [selectedState, setSelectedState] = useState<EntangledStateKey>("phi_plus");
  const [collapsedOutcome, setCollapsedOutcome] = useState<string | null>(null);
  const [isCollapsing, setIsCollapsing] = useState<boolean>(false);
  const [measurementHistory, setMeasurementHistory] = useState<string[]>([]);
  const [subTab, setSubTab] = useState<"simulator" | "bell_test" | "teleportation">("simulator");

  // Bell Test (CHSH) detector angles (in degrees)
  const [angleA1, setAngleA1] = useState<number>(0);
  const [angleA2, setAngleA2] = useState<number>(45);
  const [angleB1, setAngleB1] = useState<number>(22.5);
  const [angleB2, setAngleB2] = useState<number>(67.5);

  // Teleportation protocol step
  const [teleportStep, setTeleportStep] = useState<number>(1);

  const stateDef = STATES[selectedState];

  // Reset collapse when state changes
  const handleSelectState = (key: EntangledStateKey) => {
    setSelectedState(key);
    setCollapsedOutcome(null);
  };

  // Perform projective measurement on Qubit 0
  const triggerMeasurement = () => {
    if (isCollapsing) return;
    setIsCollapsing(true);

    setTimeout(() => {
      // Pick random outcome based on amplitudes squared
      const rand = Math.random();
      let cumProb = 0;
      let outcome = Object.keys(stateDef.amplitudes)[0];

      for (const [basis, amp] of Object.entries(stateDef.amplitudes)) {
        cumProb += amp * amp;
        if (rand <= cumProb) {
          outcome = basis;
          break;
        }
      }

      setCollapsedOutcome(outcome);
      setMeasurementHistory((prev) => [outcome, ...prev.slice(0, 7)]);
      setIsCollapsing(false);
    }, 700);
  };

  const resetState = () => {
    setCollapsedOutcome(null);
  };

  // Calculate CHSH S value: S = E(a1, b1) - E(a1, b2) + E(a2, b1) + E(a2, b2)
  // For singlet state |Ψ->: E(a, b) = -cos(2*(a - b))
  // For |Φ+>: E(a, b) = cos(2*(a - b))
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const calcCorr = (a: number, b: number) => Math.cos(2 * toRad(a - b));
  const E_a1_b1 = calcCorr(angleA1, angleB1);
  const E_a1_b2 = calcCorr(angleA1, angleB2);
  const E_a2_b1 = calcCorr(angleA2, angleB1);
  const E_a2_b2 = calcCorr(angleA2, angleB2);

  const chshS = Math.abs(E_a1_b1 - E_a1_b2 + E_a2_b1 + E_a2_b2);
  const isViolating = chshS > 2.0;

  return (
    <div className="flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Top Header */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <GitMerge className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-wide">
              Entanglement & Non-Locality 3D Studio
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Explore EPR pairs, instantaneous measurement collapse, Bell inequality (CHSH) test, and quantum teleportation.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setSubTab("simulator")}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              subTab === "simulator" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Correlation Collapse
          </button>
          <button
            onClick={() => setSubTab("bell_test")}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              subTab === "bell_test" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            CHSH Bell Test
          </button>
          <button
            onClick={() => setSubTab("teleportation")}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              subTab === "teleportation" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Quantum Teleportation
          </button>
        </div>
      </div>

      {/* VIEW 1: CORRELATION COLLAPSE SIMULATOR */}
      {subTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
          {/* Main Visual Stage (Multi-Tier 3D Platform representation) */}
          <div className="lg:col-span-8 p-6 flex flex-col justify-between relative bg-radial from-slate-900 via-slate-950 to-black overflow-hidden">
            {/* Background Grid Accent */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#6366f1 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />

            {/* Current State Formula & Description Badge */}
            <div className="flex justify-between items-start z-10">
              <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800">
                <div className="text-xs text-indigo-400 font-mono font-semibold">Selected State:</div>
                <div className="text-base font-bold text-white font-mono">{stateDef.latex}</div>
                <p className="text-xs text-slate-400 mt-1 max-w-md">{stateDef.description}</p>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Entanglement Status</span>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    stateDef.separable
                      ? "bg-slate-800 text-slate-400 border border-slate-700"
                      : "bg-indigo-950/80 text-indigo-300 border border-indigo-700/60"
                  }`}
                >
                  {stateDef.separable ? "Separable (Product)" : "Maximally Entangled"}
                </span>
              </div>
            </div>

            {/* Visual Multi-Tier Quantum Platforms (Inspired by Reference Images) */}
            <div className="my-8 flex items-center justify-center gap-6 sm:gap-12 relative z-10">
              {/* Qubit A (Alice's Platform) */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-32 sm:w-40 h-32 sm:h-40 rounded-2xl border-2 flex flex-col items-center justify-center p-4 transition-all duration-500 relative ${
                    collapsedOutcome
                      ? "bg-blue-950/60 border-blue-500 shadow-xl shadow-blue-950/50"
                      : isCollapsing
                      ? "bg-indigo-900/40 border-indigo-400 animate-pulse"
                      : "bg-slate-900/70 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  {/* Floating Particle Node */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-lg shadow-lg transition-transform duration-500 ${
                      collapsedOutcome
                        ? "bg-blue-500 text-white scale-110 shadow-blue-500/50"
                        : "bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white animate-bounce"
                    }`}
                  >
                    {collapsedOutcome ? `|${collapsedOutcome[0]}⟩` : "q₀"}
                  </div>
                  <span className="text-xs font-mono text-slate-300 font-semibold mt-3">Qubit 0 (Alice)</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {collapsedOutcome ? `Measured: |${collapsedOutcome[0]}⟩` : "Superposition"}
                  </span>
                </div>
              </div>

              {/* Quantum Correlation Channel (Glowing Connector Beam) */}
              <div className="flex-1 max-w-xs flex flex-col items-center justify-center relative">
                {/* Connecting Beam */}
                <div
                  className={`w-full h-1 rounded-full transition-all duration-500 ${
                    stateDef.separable
                      ? "bg-slate-800"
                      : collapsedOutcome
                      ? "bg-blue-500 shadow-md shadow-blue-500/60"
                      : isCollapsing
                      ? "bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 animate-pulse h-1.5"
                      : "bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600"
                  }`}
                />

                {/* Animated Particle or Pulse */}
                {!stateDef.separable && !collapsedOutcome && (
                  <div className="absolute w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/80 animate-ping" />
                )}

                <span className="text-[10px] font-mono text-slate-400 mt-2 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  {stateDef.separable ? "No Correlation" : "Non-Local Entanglement Link"}
                </span>
              </div>

              {/* Qubit B (Bob's Platform) */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-32 sm:w-40 h-32 sm:h-40 rounded-2xl border-2 flex flex-col items-center justify-center p-4 transition-all duration-500 relative ${
                    collapsedOutcome
                      ? "bg-purple-950/60 border-purple-500 shadow-xl shadow-purple-950/50"
                      : isCollapsing
                      ? "bg-indigo-900/40 border-indigo-400 animate-pulse"
                      : "bg-slate-900/70 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-lg shadow-lg transition-transform duration-500 ${
                      collapsedOutcome
                        ? "bg-purple-500 text-white scale-110 shadow-purple-500/50"
                        : "bg-gradient-to-tr from-purple-500 to-pink-500 text-white animate-bounce"
                    }`}
                  >
                    {collapsedOutcome ? `|${collapsedOutcome[1]}⟩` : "q₁"}
                  </div>
                  <span className="text-xs font-mono text-slate-300 font-semibold mt-3">Qubit 1 (Bob)</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {collapsedOutcome ? `Instant Collapse: |${collapsedOutcome[1]}⟩` : "Superposition"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 z-10 bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={triggerMeasurement}
                  disabled={isCollapsing}
                  className={`px-5 py-2 rounded-lg font-semibold text-xs font-mono flex items-center gap-2 shadow-lg transition ${
                    isCollapsing
                      ? "bg-indigo-800 text-indigo-300 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95"
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>{collapsedOutcome ? "Measure Again" : "Measure Qubit 0 (Alice)"}</span>
                </button>

                {collapsedOutcome && (
                  <button
                    onClick={resetState}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition flex items-center gap-1.5 border border-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Superposition</span>
                  </button>
                )}
              </div>

              {/* Measurement History */}
              {measurementHistory.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                  <span>Recent:</span>
                  {measurementHistory.map((item, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300 font-bold"
                    >
                      |{item}⟩
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side State Selector & Density Matrix Details */}
          <div className="lg:col-span-4 bg-slate-900/70 border-t lg:border-t-0 lg:border-l border-slate-800 p-5 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Choose Quantum State
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STATES) as EntangledStateKey[]).map((key) => {
                    const st = STATES[key];
                    const isSelected = selectedState === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleSelectState(key)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col ${
                          isSelected
                            ? "bg-indigo-900/40 border-indigo-500 shadow-md shadow-indigo-950"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
                        }`}
                      >
                        <span className={`text-xs font-bold font-mono ${isSelected ? "text-indigo-300" : "text-slate-200"}`}>
                          {st.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">{st.latex}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Basis Probability Bar Chart */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Measurement Probabilities (Born Rule)
                </span>
                <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {Object.entries(stateDef.amplitudes).map(([basis, amp]) => {
                    const prob = (amp * amp) * 100;
                    return (
                      <div key={basis} className="text-xs font-mono">
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span className="font-bold text-indigo-300">|{basis}⟩</span>
                          <span>{prob.toFixed(0)}% (amp: {amp.toFixed(3)})</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 transition-all duration-300"
                            style={{ width: `${prob}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Entanglement Entropy Info */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
                <div className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Von Neumann Entanglement Entropy</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  For a bipartite state |ψ_AB⟩, the entropy of subsystem A is{" "}
                  <code className="text-indigo-300">S(ρ_A) = -Tr(ρ_A log₂ ρ_A)</code>.
                </p>
                <div className="flex justify-between items-center text-xs font-mono pt-1 text-slate-300">
                  <span>Current S(ρ_A):</span>
                  <span className="font-bold text-indigo-400">{stateDef.separable ? "0.00 (Zero Entanglement)" : "1.00 (Maximal Entanglement)"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CHSH BELL INEQUALITY LAB */}
      {subTab === "bell_test" && (
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Clauser–Horne–Shimony–Holt (CHSH) Bell Inequality</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Local Hidden Variable theories demand that classical correlations satisfy |S| ≤ 2.
                Quantum mechanics allows correlations up to Tsirelson's bound: <strong>2√2 ≈ 2.828</strong>.
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-xl font-mono text-center border ${
                isViolating
                  ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-950"
                  : "bg-slate-900 border-slate-700 text-slate-300"
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Bell Parameter S</div>
              <div className="text-xl font-bold">{chshS.toFixed(3)}</div>
              <div className="text-[10px]">
                {isViolating ? "✓ Bell Inequality VIOLATED!" : "Classical Bound (S ≤ 2)"}
              </div>
            </div>
          </div>

          {/* Detector Angle Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Alice's Detector Angles */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-4">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block">
                Alice's Measurement Bases (Qubit 0)
              </span>
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Detector Angle a₁:</span>
                  <span className="text-blue-400 font-bold">{angleA1}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="2.5"
                  value={angleA1}
                  onChange={(e) => setAngleA1(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Detector Angle a₂:</span>
                  <span className="text-blue-400 font-bold">{angleA2}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="2.5"
                  value={angleA2}
                  onChange={(e) => setAngleA2(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Bob's Detector Angles */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-4">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider block">
                Bob's Measurement Bases (Qubit 1)
              </span>
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Detector Angle b₁:</span>
                  <span className="text-purple-400 font-bold">{angleB1}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="2.5"
                  value={angleB1}
                  onChange={(e) => setAngleB1(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Detector Angle b₂:</span>
                  <span className="text-purple-400 font-bold">{angleB2}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="2.5"
                  value={angleB2}
                  onChange={(e) => setAngleB2(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Preset Buttons for Optimal Violation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAngleA1(0);
                setAngleA2(45);
                setAngleB1(22.5);
                setAngleB2(67.5);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-semibold transition"
            >
              Set Optimal Angles (S = 2.828)
            </button>
            <button
              onClick={() => {
                setAngleA1(0);
                setAngleA2(90);
                setAngleB1(0);
                setAngleB2(90);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition"
            >
              Set Classical Angles (S = 2.000)
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: QUANTUM TELEPORTATION WALKTHROUGH */}
      {subTab === "teleportation" && (
        <div className="p-6 space-y-6">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-white">Quantum Teleportation Protocol</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Transmit an unknown state |ψ⟩ = α|0⟩ + β|1⟩ from Alice to Bob using 1 shared Bell pair and 2 classical bits.
            </p>
          </div>

          {/* Stepper Navigation */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { step: 1, title: "1. Entangled Pair", desc: "Alice & Bob share |Φ⁺⟩" },
              { step: 2, title: "2. Bell Measurement", desc: "Alice interacts |ψ⟩ & q_A" },
              { step: 3, title: "3. Classical Transmit", desc: "Alice sends 2 bits (b₁, b₂)" },
              { step: 4, title: "4. Bob's Reconstruction", desc: "Applies X^b2 · Z^b1" },
            ].map((st) => (
              <button
                key={st.step}
                onClick={() => setTeleportStep(st.step)}
                className={`p-3 rounded-xl border text-left transition ${
                  teleportStep === st.step
                    ? "bg-indigo-900/50 border-indigo-500 shadow-md shadow-indigo-950"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div className="text-xs font-bold text-white font-mono">{st.title}</div>
                <div className="text-[11px] text-slate-400 mt-1">{st.desc}</div>
              </button>
            ))}
          </div>

          {/* Step Detail Card */}
          <div className="p-5 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                Step {teleportStep} Explanation
              </span>
              <p className="text-sm text-slate-200 leading-relaxed">
                {teleportStep === 1 &&
                  "Alice and Bob establish an entangled EPR channel: |Φ⁺⟩ = (|00⟩ + |11⟩)/√2. Alice holds Qubit A, and Bob holds Qubit B across a distance."}
                {teleportStep === 2 &&
                  "Alice applies a CNOT gate between her unknown state |ψ⟩ and Qubit A, followed by a Hadamard gate. This entangles the unknown state with the pair."}
                {teleportStep === 3 &&
                  "Alice measures her two qubits in the computational basis, obtaining 2 classical bits: (00, 01, 10, or 11). She calls Bob over a conventional fiber or phone line."}
                {teleportStep === 4 &&
                  "Based on Alice's 2 bits, Bob applies: If 00 → Identity (I); If 01 → Pauli-X; If 10 → Pauli-Z; If 11 → Z·X. His qubit is now in the exact original state |ψ⟩!"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={teleportStep === 1}
                onClick={() => setTeleportStep((s) => Math.max(1, s - 1))}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-mono transition"
              >
                Previous Step
              </button>
              <button
                disabled={teleportStep === 4}
                onClick={() => setTeleportStep((s) => Math.min(4, s + 1))}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-xs font-mono font-semibold transition"
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Entanglement3DStudio;
