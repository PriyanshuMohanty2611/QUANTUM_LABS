"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, ShieldCheck, ShieldAlert, Sparkles, RefreshCw, Eye, EyeOff } from "lucide-react";

interface QubitPacket {
  aliceBit: 0 | 1;
  aliceBasis: "+" | "×";
  eveIntercepted: boolean;
  eveBasis?: "+" | "×";
  bobBasis: "+" | "×";
  bobBit: 0 | 1;
  basisMatch: boolean;
  bitMatch: boolean;
}

export const BB84SecurityLab: React.FC = () => {
  const [eveEnabled, setEveEnabled] = useState<boolean>(false);
  const [roundCount, setRoundCount] = useState<number>(1);
  const [packets, setPackets] = useState<QubitPacket[]>([]);

  useEffect(() => {
    setPackets(generateRun(false));
  }, []);

  function generateRun(hasEve: boolean): QubitPacket[] {
    const list: QubitPacket[] = [];
    for (let i = 0; i < 10; i++) {
      const aliceBit: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
      const aliceBasis: "+" | "×" = Math.random() < 0.5 ? "+" : "×";
      const bobBasis: "+" | "×" = Math.random() < 0.5 ? "+" : "×";

      let bobBit: 0 | 1 = aliceBit;
      let eveBasis: "+" | "×" | undefined = undefined;

      if (hasEve) {
        eveBasis = Math.random() < 0.5 ? "+" : "×";
        // If Eve chose different basis than Alice, she collapses the qubit
        if (eveBasis !== aliceBasis) {
          // 50% chance of disturbing Alice's bit
          const eveBit: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
          // Bob now measures the disturbed state
          if (bobBasis === eveBasis) {
            bobBit = eveBit;
          } else {
            bobBit = Math.random() < 0.5 ? 0 : 1;
          }
        } else {
          // Eve matched Alice's basis, state preserved for now
          if (bobBasis !== aliceBasis) {
            bobBit = Math.random() < 0.5 ? 0 : 1;
          }
        }
      } else {
        // No Eve: if Bob's basis matches Alice, bit is 100% deterministic!
        if (bobBasis !== aliceBasis) {
          bobBit = Math.random() < 0.5 ? 0 : 1;
        }
      }

      const basisMatch = aliceBasis === bobBasis;
      const bitMatch = aliceBit === bobBit;

      list.push({
        aliceBit,
        aliceBasis,
        eveIntercepted: hasEve,
        eveBasis,
        bobBasis,
        bobBit,
        basisMatch,
        bitMatch,
      });
    }
    return list;
  }

  const runSimulation = (eve: boolean) => {
    setPackets(generateRun(eve));
    setRoundCount((r) => r + 1);
  };

  // Sifted bits (where bases matched)
  const sifted = packets.filter((p) => p.basisMatch);
  const errorCount = sifted.filter((p) => !p.bitMatch).length;
  const qber = sifted.length > 0 ? (errorCount / sifted.length) * 100 : 0;
  const isSecure = qber <= 11; // 11% is the theoretical security threshold for BB84

  return (
    <div className="flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <KeyRound className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-wide">
              Quantum Key Distribution (BB84 Protocol) Simulator
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Information-theoretic security guaranteed by the No-Cloning Theorem and measurement collapse.
          </p>
        </div>

        {/* Eavesdropping Toggle & Run Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const nextEve = !eveEnabled;
              setEveEnabled(nextEve);
              runSimulation(nextEve);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition border ${
              eveEnabled
                ? "bg-red-950/80 border-red-500 text-red-300 shadow-lg shadow-red-950"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {eveEnabled ? <Eye className="w-3.5 h-3.5 text-red-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Eve Interception: {eveEnabled ? "ACTIVE (Spying)" : "OFF"}</span>
          </button>

          <button
            onClick={() => runSimulation(eveEnabled)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate Photons</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="p-6 space-y-6">
        {/* Security Status Banner */}
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isSecure
              ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
              : "bg-red-950/40 border-red-500/50 text-red-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {isSecure ? (
              <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-7 h-7 text-red-400 shrink-0" />
            )}
            <div>
              <div className="text-sm font-bold">
                {isSecure
                  ? "✓ Quantum Channel Secure — Key Successfully Shared!"
                  : "⚠ Eavesdropper Detected! Quantum Bit Error Rate Exceeded Threshold"}
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                {isSecure
                  ? "No observer disturbed the photons in flight. The sifted key is safe for one-time pad encryption."
                  : "Measurement by Eve introduced irreversible state collapse, giving an error rate > 11%. Alice & Bob abort."}
              </p>
            </div>
          </div>

          <div className="bg-slate-950/80 px-4 py-2 rounded-lg border border-slate-800 font-mono text-xs text-right">
            <div className="text-slate-400">Error Rate (QBER):</div>
            <div className={`text-base font-bold ${isSecure ? "text-emerald-400" : "text-red-400"}`}>
              {qber.toFixed(1)}% {qber > 0 && `(${errorCount}/${sifted.length} mismatched)`}
            </div>
          </div>
        </div>

        {/* Transmission Table (10 Photons) */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Photon #</th>
                <th className="p-3 text-blue-400">Alice Bit</th>
                <th className="p-3 text-blue-400">Alice Basis</th>
                {eveEnabled && <th className="p-3 text-red-400">Eve Basis</th>}
                <th className="p-3 text-purple-400">Bob Basis</th>
                <th className="p-3 text-purple-400">Bob Measured</th>
                <th className="p-3">Basis Match?</th>
                <th className="p-3 text-emerald-400">Sifted Key Bit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {packets.map((pkt, idx) => (
                <tr
                  key={idx}
                  className={`transition hover:bg-slate-800/40 ${
                    pkt.basisMatch ? "bg-slate-900/40 font-semibold" : "opacity-60"
                  }`}
                >
                  <td className="p-3 text-slate-500 font-bold">#{idx + 1}</td>
                  <td className="p-3 text-blue-300">{pkt.aliceBit}</td>
                  <td className="p-3 text-blue-400">{pkt.aliceBasis}</td>
                  {eveEnabled && (
                    <td className="p-3 text-red-400 font-bold">
                      {pkt.eveBasis} {pkt.eveBasis !== pkt.aliceBasis ? "(disturbed)" : ""}
                    </td>
                  )}
                  <td className="p-3 text-purple-400">{pkt.bobBasis}</td>
                  <td className="p-3 text-purple-300">{pkt.bobBit}</td>
                  <td className="p-3">
                    {pkt.basisMatch ? (
                      <span className="text-emerald-400 font-bold">✓ Match ({pkt.aliceBasis})</span>
                    ) : (
                      <span className="text-slate-500">✗ Discard</span>
                    )}
                  </td>
                  <td className="p-3">
                    {pkt.basisMatch ? (
                      pkt.bitMatch ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold">
                          {pkt.aliceBit}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500/50 text-red-300 font-bold">
                          ERROR ({pkt.aliceBit} ≠ {pkt.bobBit})
                        </span>
                      )
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Final Shared Secret Key */}
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Extracted Shared Secret Key:</span>
            <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 font-bold tracking-widest text-sm">
              {sifted.map((s) => s.aliceBit).join("") || "No matching bases"}
            </span>
          </div>
          <div className="text-slate-400">
            Sifted Key Length: <strong className="text-white">{sifted.length} bits</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BB84SecurityLab;
