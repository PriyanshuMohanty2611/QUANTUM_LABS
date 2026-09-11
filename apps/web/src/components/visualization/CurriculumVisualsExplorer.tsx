"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  Search,
  ExternalLink,
  Globe,
  Waves,
  Cpu,
  Shield,
  Activity,
  GitBranch,
} from "lucide-react";

interface DomainInfo {
  id: number;
  slug: string;
  title: string;
  renderer: string;
  category: "Fundamentals" | "Hardware & Physics" | "Algorithms & Theory" | "Applications";
  formula: string;
  summary: string;
}

const DOMAINS: DomainInfo[] = [
  {
    id: 0,
    slug: "what-is-quantum-computing",
    title: "00: What is Quantum Computing?",
    renderer: "concept-map",
    category: "Fundamentals",
    formula: "f: {0,1}ⁿ → {0,1}ᵐ",
    summary: "Formal definition of computation, Turing machines, and the quantum transition.",
  },
  {
    id: 1,
    slug: "historical-timeline-and-key-figures",
    title: "01: Historical Timeline & Key Figures",
    renderer: "timeline",
    category: "Fundamentals",
    formula: "E = hν, λ = h/p",
    summary: "Planck, Einstein, Bohr, Feynman, Deutsch and the founding of quantum information.",
  },
  {
    id: 2,
    slug: "quantum-phenomena",
    title: "02: Quantum Phenomena",
    renderer: "wave-interference",
    category: "Fundamentals",
    formula: "|Ψ_total|² = |ψ₁ + ψ₂|²",
    summary: "Wave-particle duality, superposition, interference, and tunneling.",
  },
  {
    id: 3,
    slug: "mathematical-foundations",
    title: "03: Mathematical Foundations",
    renderer: "linear-algebra",
    category: "Fundamentals",
    formula: "⟨v|w⟩ = ∑ vᵢ* wᵢ, U† U = I",
    summary: "Hilbert spaces, inner products, eigenvalues, and unitary operators.",
  },
  {
    id: 4,
    slug: "quantum-mechanics-formalism",
    title: "04: Quantum Mechanics Formalism",
    renderer: "bloch-sphere",
    category: "Fundamentals",
    formula: "ρ = ∑ pᵢ |ψᵢ⟩⟨ψᵢ|, Tr(ρ) = 1",
    summary: "Postulates of quantum mechanics, density matrices, and pure vs mixed states.",
  },
  {
    id: 5,
    slug: "the-qubit",
    title: "05: The Qubit & Bloch Sphere",
    renderer: "bloch-sphere",
    category: "Fundamentals",
    formula: "|ψ⟩ = cos(θ/2)|0⟩ + e^{iφ}sin(θ/2)|1⟩",
    summary: "Two-level quantum systems, amplitudes, global vs relative phase, and spherical coordinates.",
  },
  {
    id: 6,
    slug: "single-qubit-gates",
    title: "06: Single-Qubit Gates",
    renderer: "bloch-sphere",
    category: "Fundamentals",
    formula: "X = [[0,1],[1,0]], H = [[1,1],[1,-1]]/√2",
    summary: "Pauli X, Y, Z, Hadamard, Phase S, T, and arbitrary rotations Rx, Ry, Rz.",
  },
  {
    id: 7,
    slug: "multiple-qubits",
    title: "07: Multiple Qubits & Tensor Products",
    renderer: "linear-algebra",
    category: "Fundamentals",
    formula: "|ψ⟩ = c₀₀|00⟩ + c₀₁|01⟩ + c₁₀|10⟩ + c₁₁|11⟩",
    summary: "4-dimensional state space, Kronecker tensor products, and CNOT operations.",
  },
  {
    id: 8,
    slug: "entanglement",
    title: "08: Quantum Entanglement & Bell States",
    renderer: "quantum-network",
    category: "Fundamentals",
    formula: "|Φ⁺⟩ = (|00⟩ + |11⟩)/√2, S ≤ 2√2",
    summary: "EPR pairs, Bell inequalities, CHSH violation, and quantum teleportation.",
  },
  {
    id: 9,
    slug: "quantum-measurement",
    title: "09: Quantum Measurement & Born Rule",
    renderer: "quantum-data-plot",
    category: "Fundamentals",
    formula: "P(m) = ⟨ψ|Mₘ† Mₘ|ψ⟩",
    summary: "Projective measurements, wave function collapse, and generalized POVMs.",
  },
  {
    id: 10,
    slug: "quantum-algorithms",
    title: "10: Quantum Algorithms (Grover & Shor)",
    renderer: "bloch-sphere",
    category: "Algorithms & Theory",
    formula: "U_s = 2|s⟩⟨s| - I, O(√N)",
    summary: "Deutsch-Jozsa, Grover's search, Quantum Fourier Transform, and Shor's factoring.",
  },
  {
    id: 11,
    slug: "quantum-cryptography",
    title: "11: Quantum Cryptography (BB84)",
    renderer: "concept-map",
    category: "Applications",
    formula: "QBER < 11% ⟹ Secure",
    summary: "BB84 protocol, quantum key distribution, and no-cloning security proofs.",
  },
  {
    id: 12,
    slug: "quantum-error-correction",
    title: "12: Quantum Error Correction",
    renderer: "concept-map",
    category: "Hardware & Physics",
    formula: "9-Qubit Shor Code, Surface Codes",
    summary: "Stabilizer codes, bit-flip/phase-flip recovery, and fault-tolerant thresholds.",
  },
  {
    id: 13,
    slug: "quantum-hardware",
    title: "13: Quantum Hardware Platforms",
    renderer: "energy-levels",
    category: "Hardware & Physics",
    formula: "Transmon Qubits, Trapped Ions, Photonic",
    summary: "Physical realizations: Josephson junctions, microwave pulses, and laser cooling.",
  },
  {
    id: 14,
    slug: "noise-and-errors",
    title: "14: Noise, Decoherence & Relaxation",
    renderer: "bloch-sphere",
    category: "Hardware & Physics",
    formula: "T₁, T₂*, T₂ = 2T₁ T_φ / (2T₁ + T_φ)",
    summary: "Thermal relaxation (T1), dephasing (T2), and master equations in Lindblad form.",
  },
  {
    id: 15,
    slug: "compilation-transpilation",
    title: "15: Compilation & Transpilation",
    renderer: "quantum-circuit",
    category: "Hardware & Physics",
    formula: "Basis Gate Decompositions (CX, Rz, SX)",
    summary: "Mapping abstract algorithms onto physical coupling topologies and routing SWAPs.",
  },
  {
    id: 16,
    slug: "variational-quantum-algorithms",
    title: "16: Variational Quantum Algorithms (VQE)",
    renderer: "quantum-data-plot",
    category: "Algorithms & Theory",
    formula: "⟨H⟩(θ) = ⟨0|U†(θ) H U(θ)|0⟩",
    summary: "Hybrid quantum-classical optimization, parameterized ansatzes, and QAOA.",
  },
  {
    id: 17,
    slug: "quantum-machine-learning",
    title: "17: Quantum Machine Learning (QML)",
    renderer: "linear-algebra",
    category: "Algorithms & Theory",
    formula: "Quantum Kernel K(x, x') = |⟨φ(x)|φ(x')⟩|²",
    summary: "Parameterized quantum circuits, quantum kernels, and barren plateaus.",
  },
  {
    id: 18,
    slug: "quantum-chemistry",
    title: "18: Quantum Chemistry & Molecular Simulation",
    renderer: "energy-levels",
    category: "Applications",
    formula: "H = ∑ h_pq a_p† a_q + ½ ∑ h_pqrs a_p† a_q† a_s a_r",
    summary: "Jordan-Wigner / Bravyi-Kitaev transformation, H₂ ground state energy.",
  },
  {
    id: 25,
    slug: "quantum-networks",
    title: "25: Quantum Networks & Repeaters",
    renderer: "quantum-network",
    category: "Applications",
    formula: "Entanglement Swapping & Purification",
    summary: "Quantum internet, entanglement swapping across repeaters, and distributed computing.",
  },
  {
    id: 35,
    slug: "famous-thought-experiments",
    title: "35: Famous Thought Experiments",
    renderer: "concept-map",
    category: "Fundamentals",
    formula: "Schrödinger's Cat, Wigner's Friend, EPR",
    summary: "Epistemological paradoxes, measurement problems, and interpretations of quantum mechanics.",
  },
];

export const CurriculumVisualsExplorer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Fundamentals", "Hardware & Physics", "Algorithms & Theory", "Applications"];

  const filtered = DOMAINS.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.formula.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search all 36 domains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-lg text-xs font-mono text-[#0F172A] placeholder:text-[#94A3B8] border border-[#CBD5E1] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === cat
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] hover:bg-white border border-[#E2E8F0]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Domain Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d) => (
          <div
            key={d.id}
            className="bg-white rounded-xl border border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-md transition-all p-5 flex flex-col justify-between group shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  {d.renderer}
                </span>
                <span className="text-[11px] text-[#64748B] font-medium">{d.category}</span>
              </div>

              <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                {d.title}
              </h3>
              <p className="text-xs text-[#475569] mt-1.5 line-clamp-2 leading-relaxed">{d.summary}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
              <span className="text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0] text-[11px] truncate max-w-[190px]">
                {d.formula}
              </span>
              <Link
                href="/learn"
                className="text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform"
              >
                <span>Study</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurriculumVisualsExplorer;
