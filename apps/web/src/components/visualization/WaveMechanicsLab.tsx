"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Waves,
  Sparkles,
  Sliders,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Info,
} from "lucide-react";

export const WaveMechanicsLab: React.FC = () => {
  const [labMode, setLabMode] = useState<"interference" | "tunneling">("interference");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Interference parameters
  const [phaseOffset, setPhaseOffset] = useState<number>(0); // 0 to 2*PI
  const [slitSeparation, setSlitSeparation] = useState<number>(40); // px
  const [wavelength, setWavelength] = useState<number>(30); // px

  // Tunneling parameters
  const [barrierHeight, setBarrierHeight] = useState<number>(65); // V0 (%)
  const [barrierWidth, setBarrierWidth] = useState<number>(40);  // L (px)
  const [particleEnergy, setParticleEnergy] = useState<number>(45); // E (%)

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef<number>(0);

  // Calculate tunneling transmission T
  // For E < V0: T ~ 16*(E/V0)*(1 - E/V0)*exp(-2*kappa*L)
  const isTunnelingRegime = particleEnergy < barrierHeight;
  let transmissionProb = 0;
  if (isTunnelingRegime) {
    const kappa = Math.sqrt((barrierHeight - particleEnergy) * 0.05);
    transmissionProb = Math.min(
      100,
      Math.max(0.1, 16 * (particleEnergy / barrierHeight) * (1 - particleEnergy / barrierHeight) * Math.exp(-2 * kappa * (barrierWidth * 0.08)) * 100)
    );
  } else {
    transmissionProb = 95 + Math.min(5, (particleEnergy - barrierHeight) * 0.2);
  }

  // Animation render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      if (isPlaying) {
        timeRef.current += 0.05;
      }
      const t = timeRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (labMode === "interference") {
        // --- RENDER DOUBLE-SLIT INTERFERENCE ---
        const centerY = h / 2;
        const slitX = 70;
        const slit1Y = centerY - slitSeparation / 2;
        const slit2Y = centerY + slitSeparation / 2;

        // Draw barrier wall with 2 slits
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(slitX - 4, 0, 8, slit1Y - 8);
        ctx.fillRect(slitX - 4, slit1Y + 8, 8, slit2Y - slit1Y - 16);
        ctx.fillRect(slitX - 4, slit2Y + 8, 8, h - slit2Y - 8);

        // Draw incident waves before slits
        ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
        ctx.lineWidth = 2;
        for (let x = 10; x < slitX; x += 14) {
          const wavePhase = (x / wavelength) * 2 * Math.PI - t * 2;
          ctx.beginPath();
          ctx.arc(x, centerY, Math.sin(wavePhase) * 15 + 20, -Math.PI / 2, Math.PI / 2);
          ctx.stroke();
        }

        // Draw 2D wavefield interference after slits
        const step = 6;
        for (let x = slitX + 8; x < w - 120; x += step) {
          for (let y = 10; y < h - 10; y += step) {
            const r1 = Math.hypot(x - slitX, y - slit1Y);
            const r2 = Math.hypot(x - slitX, y - slit2Y);

            const psi1 = Math.cos((r1 / wavelength) * 2 * Math.PI - t * 2);
            const psi2 = Math.cos((r2 / wavelength) * 2 * Math.PI - t * 2 + phaseOffset);

            const psiTotal = psi1 + psi2;
            const prob = (psiTotal * psiTotal) / 4; // 0 to 1

            if (prob > 0.08) {
              ctx.fillStyle = `rgba(56, 189, 248, ${prob * 0.45})`;
              ctx.fillRect(x, y, step, step);
            }
          }
        }

        // Draw Detection Screen on the right (w - 90)
        const screenX = w - 90;
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(screenX, 10, 75, h - 20);
        ctx.strokeStyle = "#334155";
        ctx.strokeRect(screenX, 10, 75, h - 20);

        // Draw Intensity Profile Curve
        ctx.beginPath();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5;

        for (let y = 15; y < h - 15; y += 2) {
          const r1 = Math.hypot(screenX - slitX, y - slit1Y);
          const r2 = Math.hypot(screenX - slitX, y - slit2Y);
          const deltaR = r2 - r1;
          const phaseDiff = ((deltaR / wavelength) * 2 * Math.PI) + phaseOffset;
          const intensity = Math.pow(Math.cos(phaseDiff / 2), 2); // 0 to 1

          const plotX = screenX + 10 + intensity * 55;
          if (y === 15) ctx.moveTo(plotX, y);
          else ctx.lineTo(plotX, y);
        }
        ctx.stroke();

        // Screen Label
        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px monospace";
        ctx.fillText("Probability |Ψ|²", screenX + 5, h - 15);
      } else {
        // --- RENDER QUANTUM TUNNELING ---
        const centerY = h / 2 + 30;
        const barrierX = w / 2 - barrierWidth / 2;
        const bHeightPx = (barrierHeight / 100) * 160;
        const energyY = centerY - (particleEnergy / 100) * 160;

        // 1. Draw potential barrier V(x)
        ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
        ctx.fillRect(barrierX, centerY - bHeightPx, barrierWidth, bHeightPx);
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.strokeRect(barrierX, centerY - bHeightPx, barrierWidth, bHeightPx);

        // Barrier Label
        ctx.fillStyle = "#ef4444";
        ctx.font = "11px monospace";
        ctx.fillText(`Barrier V₀ (${barrierHeight} eV)`, barrierX - 25, centerY - bHeightPx - 8);

        // 2. Draw Energy Level E dashed line
        ctx.strokeStyle = "#38bdf8";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(30, energyY);
        ctx.lineTo(w - 30, energyY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#38bdf8";
        ctx.fillText(`Particle Energy E (${particleEnergy} eV)`, 35, energyY - 6);

        // 3. Draw Wavefunction Ψ(x)
        ctx.beginPath();
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 3;

        for (let x = 30; x < w - 30; x += 2) {
          let y = centerY;
          const k1 = 0.08;

          if (x < barrierX) {
            // Region I: Incident + Reflected wave
            const inc = Math.sin(k1 * x - t * 3);
            const ref = (1 - transmissionProb / 100) * Math.sin(-k1 * x - t * 3);
            y = centerY - (inc + ref) * 35;
          } else if (x <= barrierX + barrierWidth) {
            // Region II: Inside barrier (exponential decay if E < V0)
            const decay = Math.exp(-0.06 * (x - barrierX));
            y = centerY - decay * Math.sin(k1 * barrierX - t * 3) * 35;
          } else {
            // Region III: Transmitted wave (attenuated amplitude)
            const transAmp = Math.sqrt(transmissionProb / 100);
            const trans = transAmp * Math.sin(k1 * (x - barrierWidth) - t * 3);
            y = centerY - trans * 35;
          }

          if (x === 30) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Baseline ground
        ctx.strokeStyle = "#334155";
        ctx.beginPath();
        ctx.moveTo(30, centerY);
        ctx.lineTo(w - 30, centerY);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [labMode, isPlaying, phaseOffset, slitSeparation, wavelength, barrierHeight, barrierWidth, particleEnergy, transmissionProb]);

  return (
    <div className="flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Top Header */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Waves className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-wide">
              Quantum Superposition & Wave Mechanics Lab
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time wave packet interference, constructive/destructive phase tuning, and evanescent quantum tunneling.
          </p>
        </div>

        <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setLabMode("interference")}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              labMode === "interference" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Double-Slit Interference
          </button>
          <button
            onClick={() => setLabMode("tunneling")}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              labMode === "tunneling" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Quantum Tunneling
          </button>
        </div>
      </div>

      {/* Main Canvas + Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
        {/* Canvas Area */}
        <div className="lg:col-span-8 p-4 flex flex-col justify-between relative bg-radial from-slate-900 via-slate-950 to-black">
          <canvas
            ref={canvasRef}
            width={640}
            height={420}
            className="w-full h-full rounded-xl border border-slate-800/80 shadow-inner"
          />

          {/* Canvas Floating Play/Pause Controls */}
          <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 backdrop-blur-md">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition flex items-center gap-1.5"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? "Pause Wave" : "Resume"}</span>
            </button>
          </div>
        </div>

        {/* Right Side Control Sliders */}
        <div className="lg:col-span-4 bg-slate-900/70 border-t lg:border-t-0 lg:border-l border-slate-800 p-5 space-y-5">
          {labMode === "interference" ? (
            <>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Interference Parameters
                </span>

                {/* Phase Offset Slider */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                      <span>Relative Phase (Δφ):</span>
                      <span className="text-cyan-400 font-bold">{((phaseOffset * 180) / Math.PI).toFixed(0)}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={2 * Math.PI}
                      step="0.05"
                      value={phaseOffset}
                      onChange={(e) => setPhaseOffset(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>0° (Constructive)</span>
                      <span>180° (Destructive)</span>
                      <span>360°</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                      <span>Slit Separation (d):</span>
                      <span className="text-slate-200 font-bold">{slitSeparation} px</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="70"
                      step="2"
                      value={slitSeparation}
                      onChange={(e) => setSlitSeparation(parseInt(e.target.value))}
                      className="w-full accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                      <span>Wavelength (λ):</span>
                      <span className="text-slate-200 font-bold">{wavelength} px</span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="50"
                      step="2"
                      value={wavelength}
                      onChange={(e) => setWavelength(parseInt(e.target.value))}
                      className="w-full accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Mathematical Explanation Card */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Born Rule & Superposition</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Unlike classical particles whose probabilities add directly, quantum amplitudes add before squaring:
                </p>
                <div className="bg-slate-900 p-2 rounded border border-slate-800 font-mono text-[11px] text-cyan-300">
                  |Ψ_total|² = |ψ₁ + ψ₂|² = |ψ₁|² + |ψ₂|² + 2|ψ₁||ψ₂|cos(Δφ)
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Tunneling Barrier Controls
                </span>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                      <span>Particle Incident Energy (E):</span>
                      <span className="text-cyan-400 font-bold">{particleEnergy} eV</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="90"
                      step="1"
                      value={particleEnergy}
                      onChange={(e) => setParticleEnergy(parseInt(e.target.value))}
                      className="w-full accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                      <span>Barrier Height (V₀):</span>
                      <span className="text-red-400 font-bold">{barrierHeight} eV</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="90"
                      step="1"
                      value={barrierHeight}
                      onChange={(e) => setBarrierHeight(parseInt(e.target.value))}
                      className="w-full accent-red-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                      <span>Barrier Thickness (L):</span>
                      <span className="text-slate-200 font-bold">{barrierWidth} nm</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="80"
                      step="5"
                      value={barrierWidth}
                      onChange={(e) => setBarrierWidth(parseInt(e.target.value))}
                      className="w-full accent-slate-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Tunneling Transmission Gauge */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transmission Prob (T):</span>
                  <span className="text-emerald-400 font-bold">{transmissionProb.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 transition-all duration-300" style={{ width: `${transmissionProb}%` }} />
                  <div className="bg-red-500 transition-all duration-300" style={{ width: `${100 - transmissionProb}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>T: {transmissionProb.toFixed(1)}%</span>
                  <span>R (Reflected): {(100 - transmissionProb).toFixed(1)}%</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                Classically, when E &lt; V₀, transmission is 0%. In quantum mechanics, the wavefunction decays
                exponentially inside the barrier (exp(-κx)), allowing a finite non-zero probability of tunneling through!
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaveMechanicsLab;
