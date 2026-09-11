"use client";

import React, { useState } from "react";
import { Grid, Layers, Sparkles, RefreshCw, ArrowRight } from "lucide-react";

export const MultiQubitMatrixLab: React.FC = () => {
  // 2-Qubit state vector amplitudes: c00, c01, c10, c11
  const [amplitudes, setAmplitudes] = useState<number[]>([1, 0, 0, 0]); // default |00>
  const [selectedGate, setSelectedGate] = useState<string>("cnot");

  // Basis names
  const basis = ["|00⟩", "|01⟩", "|10⟩", "|11⟩"];

  // Gate Matrices (4x4)
  const GATES: { [key: string]: { name: string; matrix: number[][]; desc: string } } = {
    cnot: {
      name: "CNOT (CX)",
      desc: "Flips Qubit 1 (target) if Qubit 0 (control) is |1⟩. Transforms |10⟩ ↔ |11⟩.",
      matrix: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 1],
        [0, 0, 1, 0],
      ],
    },
    swap: {
      name: "SWAP",
      desc: "Exchanges the states of Qubit 0 and Qubit 1. Transforms |01⟩ ↔ |10⟩.",
      matrix: [
        [1, 0, 0, 0],
        [0, 0, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 1],
      ],
    },
    cz: {
      name: "Controlled-Z (CZ)",
      desc: "Applies a π phase shift only to the |11⟩ component. Symmetric in control/target.",
      matrix: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, -1],
      ],
    },
    h_on_0: {
      name: "H ⊗ I (Hadamard on Q0)",
      desc: "Creates superposition on Qubit 0 while leaving Qubit 1 unaffected.",
      matrix: [
        [1 / Math.SQRT2, 0, 1 / Math.SQRT2, 0],
        [0, 1 / Math.SQRT2, 0, 1 / Math.SQRT2],
        [1 / Math.SQRT2, 0, -1 / Math.SQRT2, 0],
        [0, 1 / Math.SQRT2, 0, -1 / Math.SQRT2],
      ],
    },
  };

  const gateInfo = GATES[selectedGate];

  // Apply matrix multiplication to state vector
  const applyGate = (gateKey: string) => {
    setSelectedGate(gateKey);
    const M = GATES[gateKey].matrix;
    const nextAmps = [0, 0, 0, 0];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        nextAmps[r] += M[r][c] * amplitudes[c];
      }
    }
    // Clean tiny float rounding
    setAmplitudes(nextAmps.map((v) => (Math.abs(v) < 1e-9 ? 0 : v)));
  };

  const resetState = (initial: number[]) => {
    setAmplitudes(initial);
  };

  // Check separability: c00*c11 - c01*c10
  const det = amplitudes[0] * amplitudes[3] - amplitudes[1] * amplitudes[2];
  const isEntangled = Math.abs(det) > 0.05;

  return (
    <div className="flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <Grid className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-wide">
              Multi-Qubit State Space & 4×4 Matrix Lab
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Explore the 4-dimensional Hilbert space (ℂ⁴), 2-qubit unitary operators, and tensor products.
          </p>
        </div>

        {/* Entanglement Status Badge */}
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              isEntangled
                ? "bg-purple-950/80 border-purple-500 text-purple-300 shadow-lg shadow-purple-950"
                : "bg-slate-900 border-slate-700 text-slate-400"
            }`}
          >
            {isEntangled ? "✨ State is Entangled" : "Product (Separable) State"}
          </span>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* Left: State Vector & Probability Bars */}
        <div className="lg:col-span-6 p-6 flex flex-col justify-between bg-radial from-slate-900 via-slate-950 to-black space-y-6">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Current 2-Qubit State Vector |ψ⟩
            </span>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 font-mono text-sm text-slate-200">
              |ψ⟩ ={" "}
              {amplitudes
                .map((amp, i) => {
                  if (Math.abs(amp) < 1e-4) return null;
                  const sign = amp > 0 ? (i === 0 ? "" : "+ ") : "- ";
                  const val = Math.abs(amp);
                  const strVal = Math.abs(val - 1 / Math.SQRT2) < 0.01 ? "1/√2" : val.toFixed(3);
                  return `${sign}${strVal}${basis[i]}`;
                })
                .filter(Boolean)
                .join(" ") || "0"}
            </div>
          </div>

          {/* Basis Probability Bars */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Measurement Probabilities P(|ij⟩) = |c_ij|²
            </span>
            <div className="grid grid-cols-2 gap-3">
              {amplitudes.map((amp, i) => {
                const prob = Math.pow(amp, 2) * 100;
                return (
                  <div key={i} className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 font-mono">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-pink-400 font-bold">{basis[i]}</span>
                      <span className="text-slate-300">{prob.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pink-500 transition-all duration-300"
                        style={{ width: `${prob}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">amp: {amp.toFixed(3)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preset Shortcuts */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Input State Presets
            </span>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <button
                onClick={() => resetState([1, 0, 0, 0])}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                |00⟩
              </button>
              <button
                onClick={() => resetState([0, 0, 1, 0])}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                |10⟩
              </button>
              <button
                onClick={() => resetState([1 / 2, 1 / 2, 1 / 2, 1 / 2])}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                |++⟩
              </button>
              <button
                onClick={() => resetState([1 / Math.SQRT2, 0, 0, 1 / Math.SQRT2])}
                className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800/80 text-purple-300 border border-purple-700"
              >
                Bell |Φ⁺⟩
              </button>
            </div>
          </div>
        </div>

        {/* Right: 4x4 Unitary Matrix View & Gate Deck */}
        <div className="lg:col-span-6 bg-slate-900/70 border-t lg:border-t-0 lg:border-l border-slate-800 p-6 flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
              Apply 2-Qubit Gate (U |ψ⟩)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(GATES).map((key) => (
                <button
                  key={key}
                  onClick={() => applyGate(key)}
                  className={`p-3 rounded-xl border text-left font-mono transition flex flex-col ${
                    selectedGate === key
                      ? "bg-pink-950/60 border-pink-500 shadow-md shadow-pink-950 text-pink-200"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <span className="text-xs font-bold">{GATES[key].name}</span>
                  <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{GATES[key].desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4x4 Matrix Grid Display */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {gateInfo.name} Matrix (4×4)
              </span>
              <span className="text-[10px] font-mono text-slate-500">Unitary: U† U = I</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-center">
              <div className="grid grid-cols-4 gap-2 text-xs">
                {gateInfo.matrix.map((row, r) =>
                  row.map((val, c) => {
                    const str =
                      Math.abs(val - 1 / Math.SQRT2) < 0.01
                        ? "1/√2"
                        : Math.abs(val + 1 / Math.SQRT2) < 0.01
                        ? "-1/√2"
                        : val.toString();
                    const isActive = Math.abs(val) > 0;
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`py-2 rounded-lg border ${
                          isActive
                            ? "bg-pink-900/30 border-pink-700/50 text-pink-300 font-bold"
                            : "bg-slate-900/40 border-slate-800 text-slate-600"
                        }`}
                      >
                        {str}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Entanglement Creation:</strong> If you start from product state{" "}
            <code className="text-pink-300">|00⟩</code>, apply <code className="text-pink-300">H ⊗ I</code> to get{" "}
            <code className="text-pink-300">(|00⟩ + |10⟩)/√2</code>, then apply <code className="text-pink-300">CNOT</code>{" "}
            to create the entangled Bell state <code className="text-purple-300">(|00⟩ + |11⟩)/√2</code>!
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiQubitMatrixLab;
