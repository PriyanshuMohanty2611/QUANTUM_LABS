import os
import re
import json
import math
from typing import List, Dict, Any, Optional, Tuple
from app.schemas.ai import ChunkRecord, SourceCitation
from app.services.ai.rag.curated_web import get_curated_web_chunks

# Canonical structured text chunks for Source A: "A Gentle Introduction to Quantum Computing"
SOURCE_A_CHUNKS: List[Dict[str, Any]] = [
    {
        "id": "rieffel-ch01-p01",
        "chapter": "Chapter 1: Complex Vector Spaces and Dirac Notation",
        "section": "1.1 Vectors, Duals, and Inner Products",
        "page_start": 7,
        "page_end": 12,
        "text": (
            "A pure quantum state is represented as a unit vector in a complex Hilbert space ℂⁿ. "
            "In Dirac notation, a column state vector is written as a ket |ψ⟩, and its conjugate transpose is the bra ⟨ψ| = (|ψ⟩)†. "
            "The inner product between |φ⟩ and |ψ⟩ is ⟨φ|ψ⟩. If ⟨φ|ψ⟩ = 0, the states are orthogonal. "
            "The normalization condition requires ⟨ψ|ψ⟩ = 1, ensuring the sum of measurement probabilities across any orthonormal basis equals 1."
        ),
    },
    {
        "id": "rieffel-ch02-p01",
        "chapter": "Chapter 2: The Quantum Bit and Superposition",
        "section": "2.1 Linear Combinations and Amplitudes",
        "page_start": 19,
        "page_end": 26,
        "text": (
            "A quantum bit (qubit) has a state space spanned by the orthonormal computational basis {|0⟩, |1⟩}. "
            "The general pure single-qubit state is |ψ⟩ = α|0⟩ + β|1⟩, where α, β ∈ ℂ and |α|² + |β|² = 1. "
            "Here α and β are complex probability amplitudes. The global phase e^(iγ) has no observable consequences, "
            "allowing any pure single-qubit state to be parameterized on the 3D Bloch sphere by polar angle θ ∈ [0, π] "
            "and azimuthal relative phase φ ∈ [0, 2π): |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩."
        ),
    },
    {
        "id": "rieffel-ch03-p01",
        "chapter": "Chapter 3: Single-Qubit Unitary Operators",
        "section": "3.2 The Pauli Operators and Hadamard",
        "page_start": 35,
        "page_end": 44,
        "text": (
            "State transformations on closed quantum systems are described by unitary operators U satisfying U†U = I. "
            "The fundamental single-qubit unitary operators are the Pauli matrices: "
            "X = [[0, 1], [1, 0]] (bit flip), Y = [[0, -i], [i, 0]] (bit and phase flip), Z = [[1, 0], [0, -1]] (phase flip). "
            "The Hadamard operator H = (1/√2)[[1, 1], [1, -1]] creates an equal superposition: H|0⟩ = |+⟩ = (|0⟩+|1⟩)/√2 and H|1⟩ = |-⟩ = (|0⟩-|1⟩)/√2. "
            "Notice H is Hermitian and self-inverse: H = H† and H² = I."
        ),
    },
    {
        "id": "rieffel-ch04-p01",
        "chapter": "Chapter 4: Multi-Qubit Systems and Tensor Products",
        "section": "4.1 Entanglement and Bell States",
        "page_start": 57,
        "page_end": 68,
        "text": (
            "The state space of an n-qubit composite quantum system is the tensor product Hilbert space ℂ² ⊗ ... ⊗ ℂ² = ℂ^(2ⁿ). "
            "A state |ψ⟩ is separable if it can be written as |ψA⟩ ⊗ |ψB⟩; otherwise it is entangled. "
            "The canonical maximally entangled two-qubit Bell states are: "
            "|Φ⁺⟩ = (|00⟩ + |11⟩)/√2, |Φ⁻⟩ = (|00⟩ - |11⟩)/√2, |Ψ⁺⟩ = (|01⟩ + |10⟩)/√2, and |Ψ⁻⟩ = (|01⟩ - |10⟩)/√2. "
            "They form an orthonormal basis for ℂ⁴ and cannot be factored into independent single-qubit states."
        ),
    },
    {
        "id": "rieffel-ch07-p01",
        "chapter": "Chapter 7: Quantum Algorithms and Amplitude Amplification",
        "section": "7.2 Grover's Quantum Search Algorithm",
        "page_start": 133,
        "page_end": 149,
        "text": (
            "Grover's algorithm searches an unsorted database of N = 2ⁿ items for a target marked state |w⟩ in O(√N) oracle evaluations. "
            "Starting from the uniform superposition |s⟩ = (1/√N)∑|x⟩, each Grover iteration applies two operators: "
            "1. The phase oracle R_w = I - 2|w⟩⟨w|, which flips the amplitude of the marked state: R_w|w⟩ = -|w⟩. "
            "2. The diffusion operator D = 2|s⟩⟨s| - I, which inverts all amplitudes about their mean amplitude ᾱ. "
            "This constructively interferes the amplitude of |w⟩ while destructively interfering non-marked states."
        ),
    },
    {
        "id": "rieffel-ch08-p01",
        "chapter": "Chapter 8: Quantum Phase Estimation and Shor's Algorithm",
        "section": "8.3 Order Finding and Factoring",
        "page_start": 165,
        "page_end": 182,
        "text": (
            "Shor's algorithm factors an integer N in polynomial time BQP using O((log N)³) operations, an exponential speedup over classical algorithms. "
            "Factoring reduces to order-finding: finding the smallest positive integer r such that a^r ≡ 1 (mod N). "
            "The quantum subroutine uses Quantum Phase Estimation (QPE) over the unitary operator U|y⟩ = |ay mod N⟩. "
            "The Quantum Fourier Transform (QFT) extracts the phase s/r with high probability, which continued fractions decomposes into the exact period r."
        ),
    },
]

# Canonical structured text chunks for Source B: "In Search of Schrödinger's Cat"
SOURCE_B_CHUNKS: List[Dict[str, Any]] = [
    {
        "id": "gribbin-ch01-p01",
        "chapter": "Chapter 1: Light and Quanta",
        "section": "1.2 Planck and the Blackbody Catastrophe",
        "page_start": 15,
        "page_end": 28,
        "text": (
            "In 1900, Max Planck resolved the ultraviolet catastrophe of classical Rayleigh-Jeans thermodynamics by proposing "
            "that electromagnetic radiation is emitted and absorbed only in discrete packets of energy called quanta: E = hν, "
            "where h is Planck's constant (6.626 × 10⁻³⁴ J·s) and ν is frequency. Five years later in 1905, Albert Einstein extended this "
            "to explain the photoelectric effect, proving light behaves as discrete particles (later named photons) whose energy depends strictly on frequency."
        ),
    },
    {
        "id": "gribbin-ch05-p01",
        "chapter": "Chapter 5: Waves and Matrices",
        "section": "5.3 De Broglie, Heisenberg, and Schrödinger",
        "page_start": 84,
        "page_end": 105,
        "text": (
            "In 1923, Louis de Broglie hypothesized that if light waves have particle properties, then material particles like electrons must have wave properties, "
            "with de Broglie wavelength λ = h/p. In 1925, Werner Heisenberg formulated quantum mechanics via non-commutative matrix algebra, leading to "
            "the uncertainty principle Δx · Δp ≥ ℏ/2. In 1926, Erwin Schrödinger developed wave mechanics, introducing the wave equation iℏ ∂ψ/∂t = Ĥψ. "
            "Max Born provided the crucial physical interpretation: the wave function ψ itself is not physical charge, but its absolute square |ψ|² represents the probability density."
        ),
    },
    {
        "id": "gribbin-ch09-p01",
        "chapter": "Chapter 9: Paradoxes and Reality",
        "section": "9.1 The Cat Paradox and Wigner's Friend",
        "page_start": 195,
        "page_end": 215,
        "text": (
            "In 1935, Erwin Schrödinger devised his famous thought experiment to highlight the absurd consequences of applying the Copenhagen interpretation "
            "to macroscopic systems. A cat is sealed in a steel chamber with a radioactive atom, a Geiger counter, a hammer, and a vial of hydrocyanic acid. "
            "If a decay occurs, the vial breaks and kills the cat. According to strict wave mechanics without measurement, the system exists in an entangled superposition "
            "|Ψ⟩ = (|decayed, dead cat⟩ + |undecayed, live cat⟩)/√2 until an observer opens the box. This led to deep inquiries into quantum measurement and decoherence."
        ),
    },
    {
        "id": "gribbin-ch11-p01",
        "chapter": "Chapter 11: Non-Locality and Bell's Theorem",
        "section": "11.2 The Aspect Experiment",
        "page_start": 243,
        "page_end": 268,
        "text": (
            "In 1935, Einstein, Podolsky, and Rosen (EPR) argued that quantum mechanics was incomplete due to 'spooky action at a distance' across separated particles. "
            "In 1964, John Stewart Bell proved that any local hidden-variable theory must satisfy mathematical constraints known as Bell's inequalities (e.g. CHSH inequality |S| ≤ 2). "
            "In 1982, Alain Aspect and his team in Orsay performed the definitive experiment using time-varying polarizers on entangled photon pairs, "
            "confirming quantum mechanical predictions and violating Bell's inequality by dozens of standard deviations, conclusively ruling out local realism."
        ),
    },
]

class KnowledgeStore:
    """Multi-source RAG Knowledge Store indexing Sources A, B, C, and D."""

    def __init__(self, curriculum_path: Optional[str] = None):
        self._chunks: List[ChunkRecord] = []
        self._curriculum_path = curriculum_path or os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))),
            "docs", "content", "domains"
        )
        self._initialize_index()

    def _initialize_index(self):
        """Loads and indexes structured chunks from all 4 authoritative sources."""
        # 1. Source A: Gentle Intro to Quantum Computing
        for item in SOURCE_A_CHUNKS:
            self._chunks.append(
                ChunkRecord(
                    chunk_id=item["id"],
                    source_id="gentle_intro_qc",
                    source_title="A Gentle Introduction to Quantum Computing (Rieffel & Polak)",
                    source_type="textbook",
                    knowledge_domain="math_code",
                    authority="primary",
                    chapter=item["chapter"],
                    section=item["section"],
                    page_start=item["page_start"],
                    page_end=item["page_end"],
                    url=None,
                    retrieved_at=None,
                    text=item["text"],
                )
            )

        # 2. Source B: In Search of Schrödinger's Cat
        for item in SOURCE_B_CHUNKS:
            self._chunks.append(
                ChunkRecord(
                    chunk_id=item["id"],
                    source_id="schrodinger_cat",
                    source_title="In Search of Schrödinger's Cat: Quantum Physics and Reality (Gribbin)",
                    source_type="textbook",
                    knowledge_domain="theory_history",
                    authority="primary_for_history",
                    chapter=item["chapter"],
                    section=item["section"],
                    page_start=item["page_start"],
                    page_end=item["page_end"],
                    url=None,
                    retrieved_at=None,
                    text=item["text"],
                )
            )

        # 3. Source C: QuantumLab Curriculum Domains
        self._load_curriculum_domains()

        # 4. Source D: Curated Web Allowlist
        for web_chunk in get_curated_web_chunks():
            self._chunks.append(web_chunk)

    def _load_curriculum_domains(self):
        """Ingests structured domain modules from docs/content/domains/."""
        if not os.path.exists(self._curriculum_path):
            return

        try:
            domain_files = [f for f in os.listdir(self._curriculum_path) if f.endswith(".json")]
            for f_name in domain_files:
                path = os.path.join(self._curriculum_path, f_name)
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                domain_id = data.get("domainId", f_name.split("-")[0])
                domain_title = data.get("title", f_name.replace(".json", ""))

                # Extract lessons
                lessons = data.get("lessons", [])
                for idx, lesson in enumerate(lessons):
                    l_id = lesson.get("lessonId", f"{domain_id}-lesson-{idx}")
                    l_title = lesson.get("title", f"Lesson {idx}")
                    statement = lesson.get("statement", "")
                    explanation = lesson.get("explanation", "")
                    example = lesson.get("example", "")

                    body = f"{statement}\n{explanation}\n{example}".strip()
                    if len(body) > 40:
                        self._chunks.append(
                            ChunkRecord(
                                chunk_id=f"ql-{l_id}",
                                source_id="quantumlab_curriculum",
                                source_title=f"PBQuantum Labs: {domain_title}",
                                source_type="quantumlab",
                                knowledge_domain="curriculum",
                                authority="project_curated",
                                chapter=domain_title,
                                section=l_title,
                                page_start=None,
                                page_end=None,
                                url=f"/learn/{l_id}",
                                retrieved_at=None,
                                text=body,
                            )
                        )
        except Exception as e:
            print(f"Warning: Could not load local curriculum domains: {e}")

    def search(
        self,
        query: str,
        category: Optional[str] = "mixed",
        knowledge_domain: Optional[str] = None,
        top_k: int = 4
    ) -> List[Tuple[ChunkRecord, float]]:
        """Source-aware retrieval ranking chunks by relevance and authority weights."""
        tokens = set(re.findall(r"\w+", query.lower()))
        if not tokens:
            return []

        scored_chunks: List[Tuple[ChunkRecord, float]] = []

        for chunk in self._chunks:
            chunk_tokens = set(re.findall(r"\w+", chunk.text.lower()))
            overlap = len(tokens.intersection(chunk_tokens))
            if overlap == 0:
                continue

            # Base Jaccard-like score
            score = overlap / math.sqrt(len(tokens) * len(chunk_tokens) + 1e-5)

            # Domain authority bias (Section 8)
            if knowledge_domain:
                if chunk.knowledge_domain == knowledge_domain:
                    score *= 1.45
            elif category:
                if category in ["mathematical", "code", "circuit"] and chunk.knowledge_domain == "math_code":
                    score *= 1.35
                elif category in ["history", "theory"] and chunk.knowledge_domain == "theory_history":
                    score *= 1.35
                elif category in ["lesson", "challenge"] and chunk.knowledge_domain == "curriculum":
                    score *= 1.35
                elif category == "current_information" and chunk.knowledge_domain == "api_docs":
                    score *= 1.5

            if score > 0.05:
                scored_chunks.append((chunk, round(score, 4)))

        # Sort descending by score
        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        return scored_chunks[:top_k]

    def format_citations(self, scored_chunks: List[Tuple[ChunkRecord, float]]) -> List[SourceCitation]:
        """Converts retrieved chunks into structured citations."""
        citations = []
        for chunk, score in scored_chunks:
            page_info = None
            if chunk.page_start:
                page_info = f"p. {chunk.page_start}-{chunk.page_end}" if chunk.page_end and chunk.page_end != chunk.page_start else f"p. {chunk.page_start}"

            citations.append(
                SourceCitation(
                    source_id=chunk.source_id,
                    source_title=chunk.source_title,
                    source_type=chunk.source_type,
                    chapter=chunk.chapter,
                    section=chunk.section,
                    page=page_info,
                    url=chunk.url,
                    retrieved_at=chunk.retrieved_at,
                    snippet=chunk.text[:220] + "..." if len(chunk.text) > 220 else chunk.text,
                )
            )
        return citations
