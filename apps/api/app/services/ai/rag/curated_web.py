import hashlib
from typing import Dict, List, Optional, Any
from app.schemas.ai import ChunkRecord

# Curated Allowlist Registry of authoritative quantum documentation and standards
ALLOWLIST_DOMAINS = [
    "docs.quantum.ibm.com",
    "qiskit.org",
    "quantum-computing.ibm.com",
    "arxiv.org",
    "nist.gov",
]

CURATED_WEB_REGISTRY: List[Dict[str, Any]] = [
    {
        "url": "https://docs.quantum.ibm.com/api/qiskit/1.0",
        "title": "Qiskit 1.0 Migration & Architecture Guide",
        "domain": "docs.quantum.ibm.com",
        "retrieved_at": "2026-03-01T00:00:00Z",
        "authority": "authoritative_docs",
        "text": (
            "Qiskit 1.0 represents a major milestone focusing on high performance, stability, and unified execution. "
            "Key changes include: QuantumCircuit as the core IR container; removal of legacy execute() function in favor of "
            "V2 Primitives: StatevectorSampler and StatevectorEstimator for local ideal computation, and AerSimulator from qiskit_aer "
            "for noise and shot sampling. Transpilation is handled via qiskit.transpile(circuit, backend=...) with optimization levels 0-3."
        ),
    },
    {
        "url": "https://docs.quantum.ibm.com/guides/primitives",
        "title": "Qiskit V2 Primitives: Sampler and Estimator",
        "domain": "docs.quantum.ibm.com",
        "retrieved_at": "2026-03-01T00:00:00Z",
        "authority": "authoritative_docs",
        "text": (
            "Primitives define the core execution paradigm in modern quantum computing. "
            "Sampler calculates quasi-probability distributions and discrete bitstring measurement counts from quantum circuits with measurements. "
            "Estimator calculates expectation values ⟨ψ|H|ψ⟩ of observable Hermitian operators (such as Pauli sums) without requiring explicit statevector reconstruction, "
            "essential for Variational Quantum Eigensolvers (VQE) and QAOA."
        ),
    },
    {
        "url": "https://qiskit.github.io/qiskit-aer/",
        "title": "Qiskit Aer High-Performance Simulator Framework",
        "domain": "qiskit.org",
        "retrieved_at": "2026-03-01T00:00:00Z",
        "authority": "authoritative_docs",
        "text": (
            "Qiskit Aer provides realistic simulation of quantum circuits using C++ backends. "
            "Supported simulation methods include: 'statevector' for exact pure state propagation up to ~30 qubits, "
            "'density_matrix' for mixed states under Kraus noise channels, and 'matrix_product_state' (MPS) for tensor-network approximations of 100+ qubits. "
            "Simulation supports custom noise models including depolarizing errors, thermal relaxation (T1, T2), and readout confusion matrices."
        ),
    },
]

def get_curated_web_chunks() -> List[ChunkRecord]:
    """Extracts verified ChunkRecords from the curated web allowlist."""
    chunks = []
    for idx, entry in enumerate(CURATED_WEB_REGISTRY):
        content_hash = hashlib.sha256(entry["text"].encode("utf-8")).hexdigest()[:12]
        chunk = ChunkRecord(
            chunk_id=f"web-{content_hash}",
            source_id="curated_qiskit_docs",
            source_title=entry["title"],
            source_type="curated_web",
            knowledge_domain="api_docs",
            authority=entry["authority"],
            chapter=entry["domain"],
            section="Documentation",
            page_start=None,
            page_end=None,
            url=entry["url"],
            retrieved_at=entry["retrieved_at"],
            text=entry["text"],
        )
        chunks.append(chunk)
    return chunks
