"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Copy,
  Check,
  Cpu,
  Bot,
  User,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Maximize2,
  Minimize2,
  Atom,
  Binary,
  Layers,
  FlaskConical,
  ShieldAlert,
  Search,
  Volume2,
  VolumeX,
  Terminal,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  domain?: string;
  sources?: any[];
  tool_results?: any[];
  visualization_actions?: any[];
  circuit_proposal?: any;
  confidence?: string;
  grounding_status?: string;
  audio_text?: string;
}

interface QuantumCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOMAIN_CATEGORIES = [
  {
    category: "Foundations & Gates",
    domains: [
      { id: "00-what-is-quantum-computing", title: "00. What is Quantum Computing", tag: "Basics" },
      { id: "03-mathematical-foundations", title: "03. Mathematical Foundations", tag: "Hilbert" },
      { id: "04-quantum-mechanics-formalism", title: "04. Dirac Notation & Formalism", tag: "Dirac" },
      { id: "05-the-qubit", title: "05. The Qubit & Bloch Sphere", tag: "Geometry" },
      { id: "06-single-qubit-gates", title: "06. Single-Qubit Unitary Gates", tag: "Gates" },
      { id: "07-multiple-qubits", title: "07. Multi-Qubit Hilbert Space", tag: "Tensor" },
    ],
  },
  {
    category: "Entanglement & Algorithms",
    domains: [
      { id: "08-entanglement", title: "08. Entanglement & Bell States", tag: "CHSH" },
      { id: "09-quantum-measurement", title: "09. Projective Measurement & POVMs", tag: "Born" },
      { id: "10-quantum-algorithms", title: "10. Grover & Shor Algorithms", tag: "Speedup" },
      { id: "11-quantum-cryptography", title: "11. BB84 Quantum Key Distribution", tag: "Security" },
    ],
  },
  {
    category: "QEC, Hardware & Noise",
    domains: [
      { id: "12-quantum-error-correction", title: "12. Surface Codes & Stabilizers", tag: "Fault-Tolerant" },
      { id: "13-quantum-hardware", title: "13. Transmon & Trapped Ions", tag: "Hardware" },
      { id: "14-noise-and-errors", title: "14. Lindblad Master Equation & T1/T2", tag: "Open Systems" },
      { id: "15-compilation-transpilation", title: "15. Solovay-Kitaev & Transpilation", tag: "Compilation" },
    ],
  },
  {
    category: "Chemistry, VQE & Optimization",
    domains: [
      { id: "16-variational-quantum-algorithms", title: "16. VQE & Parameter-Shift Rule", tag: "Ansatz" },
      { id: "17-quantum-machine-learning", title: "17. QML & Quantum Neural Networks", tag: "Kernels" },
      { id: "18-quantum-chemistry", title: "18. Jordan-Wigner & Molecular H₂", tag: "Fermions" },
      { id: "19-quantum-optimization", title: "19. QAOA & QUBO Formulations", tag: "MaxCut" },
    ],
  },
  {
    category: "Advanced Frontiers & Paradoxes",
    domains: [
      { id: "24-quantum-communication", title: "24. Quantum Teleportation Protocol", tag: "Protocols" },
      { id: "27-quantum-simulation", title: "27. Trotter-Suzuki Product Formulas", tag: "Simulation" },
      { id: "28-quantum-complexity-theory", title: "28. BQP vs NP & Supremacy", tag: "Complexity" },
      { id: "29-alternative-quantum-computing-models", title: "29. Topological Anyons & MBQC", tag: "Majorana" },
      { id: "30-quantum-programming", title: "30. Qiskit 1.0 & PennyLane", tag: "Code" },
    ],
  },
];

const ADVANCED_PRESETS = [
  {
    title: "Derive Bell State |Φ⁺⟩ Violation",
    prompt:
      "Derive the CHSH Bell inequality test step-by-step for the Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2. Show why classical correlation is bounded by S ≤ 2, while quantum mechanics reaches the Tsirelson bound S = 2√2.",
    tag: "CHSH Proof",
  },
  {
    title: "VQE Hamiltonian for H₂ Molecule",
    prompt:
      "Explain how the molecular electronic Hamiltonian for H₂ is mapped onto qubits using the Jordan-Wigner transformation. Provide a minimal Python Qiskit 1.0 script using an Estimator primitive to find the ground state energy.",
    tag: "Chemistry",
  },
  {
    title: "Grover Inversion About the Mean",
    prompt:
      "Formulate Grover's diffusion operator 2|s⟩⟨s| - I algebraically. Prove why it inverts probability amplitudes about their mean ᾱ and yields an O(√N) quadratic search speedup.",
    tag: "Algorithms",
  },
  {
    title: "Surface Code Stabilizers (d=3)",
    prompt:
      "Explain the rotated surface code architecture for code distance d=3. Detail the vertex X-type and plaquette Z-type stabilizer syndrome measurements, and explain how minimum-weight perfect matching (MWPM) decodes errors.",
    tag: "Error Correction",
  },
  {
    title: "Lindblad Master Equation & T₁/T₂",
    prompt:
      "Formulate the Lindblad master equation for an open two-level quantum system. Explicitly write down the jump operators L₁ and L₂ for energy relaxation (T₁) and pure dephasing (T₂), and show how the density matrix elements decay.",
    tag: "Noise Physics",
  },
  {
    title: "Quantum Teleportation Circuit",
    prompt:
      "Provide complete working Python Qiskit 1.0 code for the 3-qubit Quantum Teleportation protocol. Explain the Bell-state measurement, classical feedforward corrections, and verify the final fidelity using Statevector.",
    tag: "Qiskit Code",
  },
];

export const QuantumCopilotDrawer: React.FC<QuantumCopilotDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content:
        "Greetings! I am **QUANTUM**, your advanced AI research companion powered by **Groq LPU** inference.\n\nI possess deep, curriculum-grounded mastery across all **36 domains of PBQuantum Labs**, from elementary Bloch sphere rotations to **VQE molecular simulations, Lindblad master equations, surface code stabilizer decoders, and production Qiskit 1.0 code**.\n\nSelect a domain or pick an advanced research prompt below to begin!",
      timestamp: "Just now",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [level, setLevel] = useState<"intuitive" | "intermediate" | "rigorous">("intermediate");
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [isWidescreen, setIsWidescreen] = useState<boolean>(false);
  const [showDomainSelector, setShowDomainSelector] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [appliedProposalIds, setAppliedProposalIds] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleSpeak = (text: string, msgId: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (playingAudioId === msgId) {
      window.speechSynthesis.cancel();
      setPlayingAudioId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean out markdown code blocks and symbols for clean spoken audio
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "Code block omitted.")
      .replace(/[*#_`]/g, "")
      .replace(/\|0\>/g, "ket zero")
      .replace(/\|1\>/g, "ket one")
      .replace(/\|\+>/g, "ket plus")
      .replace(/\|\->/g, "ket minus")
      .replace(/\|\w+\>/g, "quantum state");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.onend = () => setPlayingAudioId(null);
    utterance.onerror = () => setPlayingAudioId(null);
    setPlayingAudioId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleApplyProposal = (proposal: any, msgId: string) => {
    // Notify circuit canvas via custom DOM event
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("quantum-circuit-apply-proposal", { detail: proposal })
      );
    }
    setAppliedProposalIds((prev) => ({ ...prev, [msgId]: true }));
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: "msg-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      domain: selectedDomain || undefined,
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputValue("");
    setIsLoading(true);

    try {
      const apiMessages = newHistory
        .filter((m) => m.id !== "welcome-msg")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          currentPath: pathname,
          level: level,
          domainContext: selectedDomain || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Copilot service responded with status ${res.status}`);
      }

      const data = await res.json();
      const assistantReply: Message = {
        id: "bot-" + Date.now(),
        role: "assistant",
        content: data.reply || "No reply generated. Please try again!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: data.sources || [],
        tool_results: data.tool_results || [],
        visualization_actions: data.visualization_actions || [],
        circuit_proposal: data.circuit_proposal || null,
        confidence: data.confidence,
        grounding_status: data.grounding_status || "grounded",
        audio_text: data.audio_text || data.reply,
      };

      setMessages((prev) => [...prev, assistantReply]);
    } catch (err: any) {
      console.error("Copilot request error:", err);
      const errorMessage: Message = {
        id: "err-" + Date.now(),
        role: "assistant",
        content:
          "⚠️ **Inference Exception**: Unable to communicate with the Groq service at this moment. Please verify your network connection and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-msg",
        role: "assistant",
        content:
          "Chat history cleared. What advanced quantum computation or physical derivation shall we explore next?",
        timestamp: "Just now",
      },
    ]);
  };

  // Helper to format assistant messages with rich code block rendering
  const renderMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-3 leading-relaxed text-sm">
        {parts.map((part, idx) => {
          if (part.startsWith("```") && part.endsWith("```")) {
            const lines = part.slice(3, -3).trim().split("\n");
            const lang = lines[0]?.trim() || "python";
            const code = lines.slice(1).join("\n") || lines[0];
            const blockId = `${msgId}-code-${idx}`;

            return (
              <div
                key={idx}
                className="my-3 rounded-lg overflow-hidden border border-[#1E293B] bg-[#0B1120] text-[#F8FAFC] shadow-sm font-mono text-xs"
              >
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#1E293B] border-b border-[#334155] text-[11px] text-[#94A3B8]">
                  <span className="uppercase font-semibold tracking-wider text-[#38BDF8]">
                    {lang}
                  </span>
                  <button
                    onClick={() => handleCopy(code, blockId)}
                    className="flex items-center gap-1.5 hover:text-white transition px-2 py-0.5 rounded bg-white/10"
                    title="Copy code"
                  >
                    {copiedId === blockId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 overflow-x-auto text-[11.5px] leading-relaxed selection:bg-blue-600">
                  <code>{code}</code>
                </pre>
              </div>
            );
          }

          // Format standard paragraphs and markdown
          const paragraphs = part.split("\n\n");
          return paragraphs.map((para, pIdx) => {
            if (!para.trim()) return null;

            if (para.startsWith("### ")) {
              return (
                <h4
                  key={`${idx}-${pIdx}`}
                  className="font-bold text-[#0F172A] text-sm mt-3 mb-1 border-b border-[#E2E8F0] pb-1 flex items-center gap-1.5"
                >
                  <Atom className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>{para.replace("### ", "")}</span>
                </h4>
              );
            }
            if (para.startsWith("## ")) {
              return (
                <h3
                  key={`${idx}-${pIdx}`}
                  className="font-bold text-[#0F172A] text-base mt-4 mb-1 text-[#1E40AF]"
                >
                  {para.replace("## ", "")}
                </h3>
              );
            }

            if (para.includes("\n- ") || para.startsWith("- ")) {
              const bullets = para.split("\n- ").map((b) => b.replace(/^- /, ""));
              return (
                <ul key={`${idx}-${pIdx}`} className="list-disc list-inside space-y-1.5 my-2 pl-1">
                  {bullets.map((b, bIdx) => (
                    <li key={bIdx} className="text-[#334155]">
                      <span dangerouslySetInnerHTML={{ __html: formatInline(b) }} />
                    </li>
                  ))}
                </ul>
              );
            }

            return (
              <p key={`${idx}-${pIdx}`} className="text-[#334155]">
                <span dangerouslySetInnerHTML={{ __html: formatInline(para) }} />
              </p>
            );
          });
        })}
      </div>
    );
  };

  const formatInline = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong class='text-[#0F172A] font-semibold'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /`([^`]+)`/g,
        "<code class='px-1.5 py-0.5 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] font-mono text-xs font-semibold'>$1</code>"
      );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/35 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Drawer Container (adaptive width: default max-w-xl, widescreen max-w-4xl) */}
      <aside
        className={`relative w-full ${
          isWidescreen ? "max-w-4xl" : "max-w-xl"
        } bg-white h-full shadow-2xl flex flex-col border-l border-[#E2E8F0] z-50 transition-all duration-300 animate-in slide-in-from-right`}
      >
        {/* Top Header */}
        <div className="p-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-[#0F172A] tracking-tight">
                  QUANTUM AI Copilot
                </h2>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Groq LPU
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                  36 Domains
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Advanced Theoretical & Applied Quantum Physics Copilot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Widescreen Toggle */}
            <button
              onClick={() => setIsWidescreen(!isWidescreen)}
              title={isWidescreen ? "Normal view" : "Widescreen derivation view"}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition hidden sm:flex"
            >
              {isWidescreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Clear History */}
            <button
              onClick={clearChat}
              title="Clear chat history"
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              title="Close Copilot"
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pedagogical Depth & Domain Quick-Bar */}
        <div className="px-3.5 py-2 bg-white border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Depth Mode Selector */}
          <div className="flex items-center gap-1 bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0]">
            <button
              onClick={() => setLevel("intuitive")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                level === "intuitive"
                  ? "bg-white text-[#2563EB] shadow-xs font-semibold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              🌱 Intuitive
            </button>
            <button
              onClick={() => setLevel("intermediate")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                level === "intermediate"
                  ? "bg-white text-[#2563EB] shadow-xs font-semibold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              ⚡ Engineering
            </button>
            <button
              onClick={() => setLevel("rigorous")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                level === "rigorous"
                  ? "bg-white text-[#2563EB] shadow-xs font-semibold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              🔬 Rigorous Math
            </button>
          </div>

          {/* Domain Focus Filter Button */}
          <button
            onClick={() => setShowDomainSelector(!showDomainSelector)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
              selectedDomain
                ? "bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB] font-semibold"
                : "bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {selectedDomain ? selectedDomain.split("-").slice(1).join(" ") : "Curriculum Domains"}
            </span>
          </button>
        </div>

        {/* Expandable Domain Selector Tray */}
        {showDomainSelector && (
          <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] max-h-56 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="font-semibold text-[#0F172A]">Target Specific Curriculum Domain:</span>
              {selectedDomain && (
                <button
                  onClick={() => setSelectedDomain("")}
                  className="text-[10px] text-red-600 hover:underline"
                >
                  Clear Domain Focus
                </button>
              )}
            </div>
            {DOMAIN_CATEGORIES.map((cat, cIdx) => (
              <div key={cIdx} className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-mono text-[#94A3B8]">
                  {cat.category}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {cat.domains.map((dom) => (
                    <button
                      key={dom.id}
                      onClick={() => {
                        setSelectedDomain(dom.id);
                        setShowDomainSelector(false);
                      }}
                      className={`px-2 py-1 rounded text-left text-xs transition truncate border ${
                        selectedDomain === dom.id
                          ? "bg-[#2563EB] text-white border-[#1D4ED8]"
                          : "bg-white hover:bg-[#EFF6FF] text-[#334155] border-[#E2E8F0]"
                      }`}
                    >
                      {dom.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]/50">
          {messages.map((msg) => {
            const isBot = msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isBot ? "items-start" : "items-start justify-end"}`}
              >
                {isBot && (
                  <div className="w-7 h-7 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-xl p-3.5 shadow-xs ${
                    isBot
                      ? "bg-white border border-[#E2E8F0] text-[#0F172A]"
                      : "bg-[#2563EB] text-white"
                  }`}
                >
                  {isBot ? (
                    <div className="space-y-3">
                      {renderMessageContent(msg.content, msg.id)}

                      {/* Deterministic Tool Execution Badges */}
                      {msg.tool_results && msg.tool_results.length > 0 && (
                        <div className="pt-2 border-t border-[#F1F5F9] space-y-1.5">
                          <div className="text-[10px] font-mono text-[#64748B] flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span className="font-semibold uppercase tracking-wider">Deterministic Quantum Tools Executed</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.tool_results.map((tool: any, tIdx: number) => (
                              <div
                                key={tIdx}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-mono text-[#334155]"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span className="font-semibold">{tool.tool_name}</span>
                                {tool.execution_time_ms && (
                                  <span className="text-[#94A3B8]">({tool.execution_time_ms.toFixed(1)}ms)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Circuit Operation Proposal Card */}
                      {msg.circuit_proposal && (
                        <div className="my-2 p-2.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534]">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold flex items-center gap-1">
                              <Atom className="w-3.5 h-3.5 text-emerald-600" />
                              Proposed Circuit Modification
                            </span>
                            <button
                              onClick={() => handleApplyProposal(msg.circuit_proposal, msg.id)}
                              disabled={appliedProposalIds[msg.id]}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                                appliedProposalIds[msg.id]
                                  ? "bg-emerald-200 text-emerald-800 cursor-default"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                              }`}
                            >
                              {appliedProposalIds[msg.id] ? "Applied ✓" : "Apply to Canvas"}
                            </button>
                          </div>
                          <div className="font-mono text-[11px] text-[#15803D]">
                            Operation: <strong className="uppercase">{msg.circuit_proposal.operation}</strong>
                            {msg.circuit_proposal.gate && ` [Gate: ${msg.circuit_proposal.gate.toUpperCase()}]`}
                            {msg.circuit_proposal.targets && ` [Target Qubits: ${msg.circuit_proposal.targets.join(", ")}]`}
                          </div>
                          {msg.circuit_proposal.explanation && (
                            <p className="mt-1 text-[11px] text-[#166534]">{msg.circuit_proposal.explanation}</p>
                          )}
                        </div>
                      )}

                      {/* Source Grounding Citations */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-2 border-t border-[#F1F5F9] space-y-1">
                          <div className="text-[10px] font-mono text-[#64748B] flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-[#2563EB]" />
                            <span className="font-semibold uppercase tracking-wider">Grounding References</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((src: any, sIdx: number) => (
                              <div
                                key={sIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[10.5px] text-[#1D4ED8] font-medium"
                              >
                                <span>{src.source_title}</span>
                                {src.chapter && <span className="text-[#60A5FA]">({src.chapter})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {msg.domain && (
                        <div className="text-[10px] text-blue-200 uppercase font-mono mb-1">
                          Domain: {msg.domain}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  )}

                  {/* Message Footer with Audio Player & Timestamp */}
                  <div className="mt-2 pt-1.5 border-t border-black/5 flex items-center justify-between text-[10.5px]">
                    <div className="flex items-center gap-2">
                      {isBot && (
                        <button
                          onClick={() => toggleSpeak(msg.audio_text || msg.content, msg.id)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
                            playingAudioId === msg.id
                              ? "bg-blue-100 text-blue-700 font-semibold"
                              : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                          }`}
                          title="Listen with Text-to-Speech"
                        >
                          {playingAudioId === msg.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-[#64748B]" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                      )}
                      {isBot && msg.grounding_status && (
                        <span className="text-[10px] text-emerald-600 font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Grounded</span>
                        </span>
                      )}
                    </div>
                    <span className={`font-mono ${isBot ? "text-[#94A3B8]" : "text-blue-100"}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>

                {!isBot && (
                  <div className="w-7 h-7 rounded-md bg-[#0F172A] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Thinking Animation */}
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-xs text-xs text-[#64748B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping" />
                <span>QUANTUM is calculating quantum state derivation on Groq LPU...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Advanced Research Action Presets Bar */}
        {messages.length <= 2 && (
          <div className="px-3.5 py-2.5 bg-white border-t border-[#E2E8F0]">
            <div className="text-[11px] font-mono text-[#64748B] mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Binary className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Advanced Research & Derivation Prompts:</span>
              </span>
              <span className="text-[10px] text-[#2563EB] font-semibold">1-Click Launch</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ADVANCED_PRESETS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="p-2 rounded-lg bg-[#F8FAFC] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] border border-[#E2E8F0] text-left transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition">
                      {item.title}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-[#E2E8F0] text-[#475569]">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">
                    {item.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-[#E2E8F0]">
          <div className="relative flex items-end gap-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#BFDBFE] transition">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask QUANTUM to derive Bell states, explain VQE, generate Qiskit circuits, or formulate QEC stabilizers..."
              rows={2}
              className="w-full bg-transparent text-sm text-[#0F172A] placeholder-[#94A3B8] resize-none focus:outline-none leading-relaxed"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className={`p-2 rounded-lg transition shrink-0 ${
                inputValue.trim() && !isLoading
                  ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-xs"
                  : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-[#94A3B8] font-mono">
            <span>Press Enter to send · Shift+Enter for new line</span>
            <span className="text-[#2563EB] font-semibold">Groq LPU · 36 Domains Grounded</span>
          </div>
        </div>
      </aside>
    </div>
  );
};
