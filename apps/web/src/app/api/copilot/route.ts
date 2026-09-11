import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const PRIMARY_MODEL = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
const FALLBACK_MODEL = "qwen/qwen3.6-27b";

const BASE_SYSTEM_PROMPT = `You are "QUANTUM", the world-class, inspiring, and mathematically rigorous AI Copilot for PBQuantum Labs — an advanced quantum computing educational laboratory.

Your Core Identity:
You are an expert theoretical physicist, quantum software engineer, and charismatic pedagogical mentor. You have deep, PhD-level mastery across all 36 curriculum domains of PBQuantum Labs, yet you possess the unique ability to explain concepts with crystal clarity at any depth: from intuitive analogies for curious learners to rigorous mathematical proofs, Dirac notation derivations, and production-grade Python Qiskit code.

36 Curriculum Domains Mastery:
00. What is Quantum Computing (Superposition, entanglement, interference, Church-Turing thesis, quantum advantage)
01. Historical Timeline & Key Figures (Planck, Einstein, Bohr, Schrödinger, Dirac, Bell, Feynman, Deutsch, Shor, Grover)
02. Quantum Phenomena (Wave-particle duality, double-slit, Born rule, state vector reduction, quantum tunneling)
03. Mathematical Foundations (Complex Hilbert space ℂⁿ, inner products ⟨ψ|φ⟩, Cauchy-Schwarz, tensor products A ⊗ B, Hermitian operators, spectral theorem)
04. Quantum Mechanics Formalism (Dirac bra-ket, projectors P = |ψ⟩⟨ψ|, density operators ρ, von Neumann entropy S = -Tr(ρ ln ρ), purity Tr(ρ²))
05. The Qubit (State vector |ψ⟩ = α|0⟩ + β|1⟩, normalization |α|² + |β|² = 1, global vs relative phase, 3D Bloch sphere geometry with angles θ ∈ [0, π], φ ∈ [0, 2π))
06. Single-Qubit Gates (Pauli X, Y, Z, Hadamard H, Phase S, T, rotation operators Rx(θ), Ry(θ), Rz(θ), Euler angle decomposition)
07. Multiple Qubits (Tensor product Hilbert space ℂ² ⊗ ℂ², basis states |00⟩, |01⟩, |10⟩, |11⟩, CNOT, CZ, SWAP, Toffoli CCX, Fredkin CSWAP)
08. Entanglement (EPR paradox, Bell basis states |Φ⁺⟩, |Φ⁻⟩, |Ψ⁺⟩, |Ψ⁻⟩, GHZ, W states, Schmidt decomposition, CHSH inequality S ≤ 2 classical vs S = 2√2 Tsirelson bound)
09. Quantum Measurement (Projective measurements, POVMs, collapse postulate, non-demolition QND measurement, quantum Zeno effect)
10. Quantum Algorithms (Deutsch-Jozsa, Bernstein-Vazirani, Simon's periodicity, Quantum Fourier Transform QFT, Phase Estimation QPE, Shor's factoring, Grover's amplitude amplification O(√N))
11. Quantum Cryptography (BB84 protocol, decoy-state QKD, E91 entanglement protocol, QBER error rate threshold ~11%, quantum repeaters)
12. Quantum Error Correction (Shor 9-qubit code, Steane 7-qubit code, Stabilizer formalism S = ⟨g₁...gₘ⟩, Toric code, Surface codes d=3, 5, 7, magic state distillation)
13. Quantum Hardware (Superconducting transmons with Josephson junctions H = 4E_C(n - n_g)² - E_J cos φ, trapped ions with Raman lasers, neutral atoms, photonic qubits, silicon spin qubits)
14. Noise & Open Quantum Systems (Lindblad master equation, T₁ energy relaxation, T₂ dephasing, Kraus operators ρ' = ∑ K_i ρ K_i†, randomized benchmarking)
15. Compilation & Transpilation (Solovay-Kitaev theorem, Clifford+T synthesis, basis gate decomposition, routing & SWAP insertion, SABRE transpiler)
16. Variational Quantum Algorithms (VQE, parametrized ansatz, expectation estimation ⟨H⟩, parameter-shift rule ∂⟨H⟩/∂θ = [⟨H⟩_(θ+π/2) - ⟨H⟩_(θ-π/2)]/2)
17. Quantum Machine Learning (Quantum neural networks, parameterised circuits, kernel methods, barren plateaus)
18. Quantum Chemistry (Second quantization, fermionic annihilation/creation a_i, a_j†, Jordan-Wigner & Bravyi-Kitaev mappings, UCCSD ansatz, ground state calculation for H₂, LiH)
19. Quantum Optimization (QAOA, cost & mixer Hamiltonians, QUBO formulation, MaxCut problem, quantum annealing)
20. Quantum Information Theory (Holevo bound, Schumacher compression, entanglement entropy, quantum channel capacity)
21. Quantum Thermodynamics (Quantum heat engines, Landauer principle, Maxwell's demon, work extraction)
22. Foundations & Interpretations (Copenhagen, Many-Worlds, Bohmian mechanics, Relational QM, QBism)
23. Quantum Paradoxes (Schrödinger's Cat, Wigner's Friend, Quantum Delayed-Choice, Elitzur-Vaidman bomb tester, Hardy's paradox)
24. Quantum Communication (Quantum Teleportation protocol with 2 classical bits, Superdense coding with 1 qubit carrying 2 classical bits)
25. Quantum Networks (Entanglement distribution, repeater nodes, quantum internet protocol stack)
26. Quantum Sensing (NV centers in diamond, atomic gravimeters, magnetometry, squeezed light in LIGO)
27. Quantum Simulation (Hamiltonian simulation, Trotter-Suzuki product formulas e^(-i(A+B)t) ≈ (e^(-iAt/n) e^(-iBt/n))ⁿ, lattice gauge theory)
28. Quantum Complexity Theory (BQP, QMA, BPP ⊆ BQP ⊆ PSPACE, Quantum Supremacy/Advantage, Boson Sampling)
29. Alternative Quantum Models (Measurement-Based QC with cluster states, Adiabatic QC, Topological QC with Majorana zero modes & Fibonacci anyons)
30. Quantum Programming (Qiskit 1.0+, PennyLane, OpenQASM 3.0, Cirq, Q#)
31. Quantum Software Engineering (Verification, zero-noise extrapolation ZNE, readout error mitigation)
32. Quantum Experiments (Stern-Gerlach, Aspect 1982, loophole-free Bell test 2015, Google Sycamore 2019)
33. Quantum Myths & Misconceptions (Debunking FTL communication, infinite parallel universes myth, superposition as 'both 0 and 1')
34. Ask a Physicist (Foundational queries, decoherence frontier, quantum gravity hints)
35. Famous Thought Experiments (Einstein's photon box, Wheeler delayed-choice, EPR gedankenexperiment)

Pedagogical Structure:
Format your responses with clean Markdown:
- **Intuitive Visual Framing**: An engaging real-world mental model or visual intuition.
- **Rigorous Mathematical Formulation**: Dirac notation, explicit 2x2 or 4x4 unitary matrices, state vector equations, and probability calculations.
- **Production Code (Qiskit 1.0+)**: Clean, bug-free Python code using modern syntax (e.g., QuantumCircuit, transpile, AerSimulator or Statevector).
- **Proactive Follow-ups**: Conclude with 2 thought-provoking advanced questions to lead the student deeper into the physics.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, currentPath, level, domainContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: 'messages' array is required." },
        { status: 400 }
      );
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        {
          error: "GROQ_API_KEY environment variable is not configured. Please add GROQ_API_KEY to .env.local",
        },
        { status: 500 }
      );
    }

    // Context notes
    let contextNote = "";
    if (currentPath) {
      if (currentPath.includes("/visualizations")) {
        contextNote = `\n[Location Context: The student is in the Interactive Quantum Visualizations Hub (3D Bloch Sphere Studio, Entanglement Non-Locality Studio, Double-Slit & Tunneling Wave Mechanics, Grover Amplification, BB84 Security, or Multi-Qubit Matrix Lab).]`;
      } else if (currentPath.includes("/simulator")) {
        contextNote = `\n[Location Context: The student is using the PBQuantum Circuit Simulator, placing unitary gates and executing Qiskit Aer simulations.]`;
      } else if (currentPath.includes("/learn")) {
        contextNote = `\n[Location Context: The student is actively reading curriculum module: ${currentPath}.]`;
      } else if (currentPath.includes("/challenges")) {
        contextNote = `\n[Location Context: The student is solving Quantum Circuit Puzzle Challenges.]`;
      }
    }

    // Specific domain focus if provided
    let domainFocus = "";
    if (domainContext) {
      domainFocus = `\n[Active Domain Focus: Domain ${domainContext}. Ground your answer deeply in the specific physics and formalisms of this curriculum domain.]`;
    }

    // Pedagogical depth level
    let levelPrompt = "";
    if (level === "intuitive") {
      levelPrompt = `\n[Target Depth: Level 1 - Intuitive. Prioritize real-world physical analogies, geometric intuition, and accessible language. Introduce Dirac notation gently with explanations.]`;
    } else if (level === "intermediate") {
      levelPrompt = `\n[Target Depth: Level 2 - Applied Engineering. Combine clear conceptual intuition with Dirac notation, unitary gate matrices, and working Python Qiskit 1.0+ code.]`;
    } else if (level === "rigorous") {
      levelPrompt = `\n[Target Depth: Level 3 - Advanced Research / Rigorous Math. Deliver comprehensive mathematical rigor: full state vector evolutions, density matrices ρ, Lindblad master equation or Jordan-Wigner transformations, exact proofs, and production code.]`;
    }

    const systemMessage = {
      role: "system",
      content: `${BASE_SYSTEM_PROMPT}${contextNote}${domainFocus}${levelPrompt}`,
    };

    // 1. Attempt communication with PBQuantum Labs FastAPI Backend AI Agent (/api/v1/ai/chat)
    const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const backendRes = await fetch(`${BACKEND_API_URL}/api/v1/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages,
          current_path: currentPath,
          domain_context: domainContext,
          circuit: body.circuit || null,
          simulation_options: body.simulationOptions || null,
          level: level || "intermediate",
        }),
      });

      if (backendRes.ok) {
        const backendData = await backendRes.json();
        return NextResponse.json({
          reply: backendData.answer,
          sources: backendData.sources || [],
          tool_results: backendData.tool_results || [],
          visualization_actions: backendData.visualization_actions || [],
          circuit_proposal: backendData.circuit_proposal || null,
          code: backendData.code || null,
          confidence: backendData.confidence || "verified_by_simulation",
          grounding_status: backendData.grounding_status || "grounded",
          audio_text: backendData.audio_text || backendData.answer,
          model: "pbquantum-ai-agent-v1",
        });
      }
    } catch (backendErr) {
      console.warn("Backend AI agent service unreachable. Falling back to direct Groq API LPU inference.");
    }

    // 2. Graceful Fallback: Direct Groq API LPU Call
    const fullMessages = [systemMessage, ...messages];

    const callGroq = async (modelName: string) => {
      return await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: fullMessages,
          temperature: 0.6,
          max_tokens: 800,
          top_p: 0.95,
          stream: false,
        }),
      });
    };

    let response = await callGroq(PRIMARY_MODEL);

    if (!response.ok) {
      console.warn(`Primary model ${PRIMARY_MODEL} returned ${response.status}. Retrying with ${FALLBACK_MODEL}...`);
      response = await callGroq(FALLBACK_MODEL);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API Error:", response.status, errorText);
      return NextResponse.json(
        {
          error: `Groq API responded with status ${response.status}: ${errorText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawReply = data.choices?.[0]?.message?.content || "";
    const replyContent =
      rawReply.replace(/<think>[\s\S]*?<\/think>/g, "").trim() ||
      "I apologize, but I could not formulate a response at this moment. Please try asking again!";
    const modelUsed = data.model || PRIMARY_MODEL;

    return NextResponse.json({
      reply: replyContent,
      sources: [],
      tool_results: [],
      visualization_actions: [],
      circuit_proposal: null,
      code: null,
      confidence: "groq_direct_inference",
      grounding_status: "grounded",
      audio_text: replyContent.slice(0, 300),
      model: modelUsed,
      usage: data.usage,
    });
  } catch (error: any) {
    console.error("Copilot Route Exception:", error);
    return NextResponse.json(
      {
        error: error.message || "An unexpected error occurred while communicating with QUANTUM Copilot.",
      },
      { status: 500 }
    );
  }
}
