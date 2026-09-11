"use client";

import React, { useState } from "react";
import { Search, Sparkles, ArrowRight, RotateCcw, CheckCircle2, TrendingUp } from "lucide-react";

export const GroverAlgorithmLab: React.FC = () => {
  const [targetIndex, setTargetIndex] = useState<number>(5); // default |101>
  const [currentStep, setCurrentStep] = useState<number>(0); // 0: Init, 1: Oracle, 2: Diffusion, 3: Next iteration

  const N = 8;
  const basisStates = ["000", "001", "010", "011", "100", "101", "110", "111"];

  // Calculate amplitudes dynamically based on step
  const calculateAmplitudes = (step: number, target: number): number[] => {
    // Initial equal superposition
    const s0 = 1 / Math.sqrt(N);
    let amps = new Array(N).fill(s0);

    if (step === 0) return amps;

    // Iteration 1
    // Step 1: Oracle flips target
    amps[target] = -amps[target];
    if (step === 1) return amps;

    // Step 2: Diffusion (inversion about average)
    const avg1 = amps.reduce((a, b) => a + b, 0) / N;
    amps = amps.map((a) => 2 * avg1 - a);
    if (step === 2) return amps;

    // Step 3 (Iter 2 Oracle)
    amps[target] = -amps[target];
    if (step === 3) return amps;

    // Step 4 (Iter 2 Diffusion)
    const avg2 = amps.reduce((a, b) => a + b, 0) / N;
    amps = amps.map((a) => 2 * avg2 - a);
    return amps;
  };

  const amplitudes = calculateAmplitudes(currentStep, targetIndex);
  const targetProb = Math.pow(amplitudes[targetIndex], 2) * 100;
  const meanAmplitude = amplitudes.reduce((a, b) => a + b, 0) / N;

  const nextStep = () => {
    setCurrentStep((s) => (s < 4 ? s + 1 : 0));
  };

  const reset = () => {
    setCurrentStep(0);
  };

  return (
    <div className="flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Search className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-wide">
              Grover's Algorithm & Amplitude Amplification
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quadratic search speedup from O(N) to O(√N) through constructive interference and inversion about the mean.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Step: </span>
            <span className="text-emerald-400 font-bold">
              {currentStep === 0 && "0. Equal Superposition"}
              {currentStep === 1 && "1. Oracle Phase Flip"}
              {currentStep === 2 && "2. Diffusion (Inversion about Mean)"}
              {currentStep === 3 && "3. 2nd Oracle Flip"}
              {currentStep === 4 && "4. 2nd Diffusion (Over-rotation)"}
            </span>
          </div>

          <button
            onClick={nextStep}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
          >
            <span>{currentStep === 4 ? "Restart" : "Next Step"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* Visual Bar Chart (N=8) */}
        <div className="lg:col-span-8 p-6 flex flex-col justify-between relative bg-radial from-slate-900 via-slate-950 to-black">
          {/* Target Item Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Target State |w⟩:</span>
              <div className="flex gap-1">
                {basisStates.map((st, i) => (
                  <button
                    key={st}
                    onClick={() => {
                      setTargetIndex(i);
                      setCurrentStep(0);
                    }}
                    className={`px-2 py-1 rounded text-xs font-mono font-bold transition ${
                      targetIndex === i
                        ? "bg-emerald-600 text-white shadow"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    |{st}⟩
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs font-mono text-emerald-400 font-bold">
              P(w = |{basisStates[targetIndex]}⟩): {targetProb.toFixed(1)}%
            </div>
          </div>

          {/* Dynamic Amplitude Chart */}
          <div className="my-8 relative h-64 flex items-end justify-around gap-2 px-4 border-b border-slate-700">
            {/* Dashed Mean Amplitude Line */}
            <div
              className="absolute left-4 right-4 border-t-2 border-dashed border-amber-400/70 z-10 transition-all duration-500"
              style={{
                bottom: `${(meanAmplitude + 0.4) * 160}px`,
              }}
            >
              <span className="absolute right-0 -top-5 text-[10px] font-mono text-amber-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-amber-500/30">
                Mean (ᾱ = {meanAmplitude.toFixed(3)})
              </span>
            </div>

            {/* Zero Line */}
            <div
              className="absolute left-4 right-4 border-t border-slate-600"
              style={{ bottom: "64px" }}
            />

            {/* Bars */}
            {amplitudes.map((amp, i) => {
              const isTarget = i === targetIndex;
              const heightPx = Math.abs(amp) * 180;
              const isNegative = amp < 0;

              return (
                <div key={i} className="flex-1 flex flex-col items-center relative group">
                  <div
                    className="w-full max-w-[40px] rounded-t-lg transition-all duration-500 flex items-center justify-center text-[10px] font-mono font-bold"
                    style={{
                      height: `${heightPx}px`,
                      marginBottom: isNegative ? `${64 - heightPx}px` : "64px",
                      backgroundColor: isTarget
                        ? isNegative
                          ? "#ef4444"
                          : "#10b981"
                        : isNegative
                        ? "#94a3b8"
                        : "#38bdf8",
                    }}
                  >
                    <span className="text-white drop-shadow">
                      {amp >= 0 ? `+${amp.toFixed(2)}` : amp.toFixed(2)}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-mono mt-2 font-bold ${
                      isTarget ? "text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    |{basisStates[i]}⟩
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Red = Negative Phase | Green = Amplified Target | Cyan = Non-Target States</span>
            <button
              onClick={reset}
              className="flex items-center gap-1 hover:text-slate-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Superposition</span>
            </button>
          </div>
        </div>

        {/* Right Side Algorithm Explanations */}
        <div className="lg:col-span-4 bg-slate-900/70 border-t lg:border-t-0 lg:border-l border-slate-800 p-5 space-y-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Algorithm Mechanism
          </span>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="text-emerald-400 font-bold font-mono">1. Oracle Reflection (Uw)</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Marks the search target by flipping its phase: <code className="text-emerald-300">|w⟩ → -|w⟩</code> while
                leaving all other $N-1$ states untouched.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="text-cyan-400 font-bold font-mono">2. Diffusion Operator (Us)</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Reflects all amplitudes around the average: <code className="text-cyan-300">α_i' = 2ᾱ - α_i</code>. Because
                the negative target is far below the mean, it gets mirrored far above the mean!
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="text-amber-400 font-bold font-mono">3. Optimal Iterations</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                For N=8, R ≈ (π/4)√8 ≈ 2 iterations. Running more iterations causes
                over-rotation and decreases probability!
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
            <span>Classical Search:</span>
            <span className="text-red-400 font-bold">O(N) queries</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
            <span>Grover Quantum:</span>
            <span className="text-emerald-400 font-bold">O(√N) queries 🚀</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroverAlgorithmLab;
