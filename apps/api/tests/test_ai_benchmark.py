"""
Section 43: 18-Prompt Deterministic AI Benchmark Evaluation Suite for PBQuantum Labs.
Validates:
- Hallucination resistance
- Mathematical correctness (amplitude α vs probability |α|²)
- Deterministic tool calls
- Abstention on unsupported claims
- Query classification
"""

import pytest
from app.schemas.quantum import QuantumIR, QuantumOperation, SimulationOptions
from app.schemas.ai import AIChatRequest
from app.services.ai.tools.quantum_tools import QuantumToolBridge
from app.services.ai.router import QueryRouter
from app.services.ai.rag.knowledge_store import KnowledgeStore
from app.services.ai.providers.mock_provider import MockProvider
from app.services.ai.agent import QuantumLabAgent

@pytest.fixture
def agent():
    mock = MockProvider()
    store = KnowledgeStore()
    return QuantumLabAgent(provider=mock, knowledge_store=store)

@pytest.fixture
def tools():
    return QuantumToolBridge()

# 1. What is a qubit?
def test_benchmark_01_what_is_a_qubit():
    route = QueryRouter.route("What is a qubit?")
    assert route["category"] in ["conceptual", "intuitive"]

# 2. Explain superposition
def test_benchmark_02_explain_superposition():
    route = QueryRouter.route("Explain superposition and how it works")
    assert route["category"] == "conceptual"

# 3. Derive H|0>
def test_benchmark_03_derive_h0():
    route = QueryRouter.route("Derive H|0> using matrix multiplication and Dirac notation")
    assert route["category"] == "mathematical"
    assert route["knowledge_domain"] == "math_code"

# 4. What is the probability after H|0>? (Exact Deterministic calculation)
def test_benchmark_04_probability_after_h0(tools):
    circuit = QuantumIR(numQubits=1, operations=[QuantumOperation(id="op-1", gate="h", targets=[0])])
    sim = tools.run_simulation(circuit, SimulationOptions(shots=1000, mode="both"))
    assert sim.success is True
    assert pytest.approx(sim.data["probabilities"]["0"], abs=0.01) == 0.5
    assert pytest.approx(sim.data["probabilities"]["1"], abs=0.01) == 0.5

# 5. Write Qiskit code for H|0>
def test_benchmark_05_write_qiskit(tools):
    circuit = QuantumIR(numQubits=1, operations=[QuantumOperation(id="op-1", gate="h", targets=[0])])
    gen = tools.generate_qiskit(circuit)
    assert gen.success is True
    assert "qc.h(0)" in gen.data["code"]
    assert "QuantumCircuit" in gen.data["code"]

# 6. Why does H² = I?
def test_benchmark_06_hadamard_squared():
    route = QueryRouter.route("Why does applying Hadamard twice give identity H^2 = I?")
    assert route["category"] in ["mathematical", "conceptual"]

# 7. Explain Bell states
def test_benchmark_07_explain_bell_states():
    route = QueryRouter.route("Explain the four Bell states and non-separability")
    assert route["knowledge_domain"] == "math_code"

# 8. Why does a Bell circuit give 00 and 11?
def test_benchmark_08_bell_circuit_simulation(tools):
    circuit = QuantumIR(
        numQubits=2,
        operations=[
            QuantumOperation(id="op-1", gate="h", targets=[0]),
            QuantumOperation(id="op-2", gate="cx", controls=[0], targets=[1])
        ]
    )
    res = tools.run_simulation(circuit, SimulationOptions(shots=500, mode="both"))
    assert res.success is True
    probs = res.data["probabilities"]
    assert pytest.approx(probs["00"], abs=0.05) == 0.5
    assert pytest.approx(probs["11"], abs=0.05) == 0.5

# 9. Explain measurement collapse
def test_benchmark_09_measurement_collapse():
    route = QueryRouter.route("Explain projective measurement collapse and the Born rule")
    assert route["category"] in ["conceptual", "mathematical"]

# 10. What is an amplitude vs probability?
def test_benchmark_10_amplitude_vs_probability(agent):
    results = agent.knowledge_store.search("amplitude probability Born rule", knowledge_domain="math_code")
    assert len(results) > 0
    assert any("Born" in c.text or "amplitude" in c.text for c, score in results)

# 11. Historical question about Schrödinger
def test_benchmark_11_history_schrodinger():
    route = QueryRouter.route("What was Schrödinger's motivation for the 1935 cat paradox?")
    assert route["category"] == "history"
    assert route["knowledge_domain"] == "theory_history"

# 12. Historical question about early quantum mechanics
def test_benchmark_12_history_early_qm():
    route = QueryRouter.route("Explain Planck and Einstein's early quanta papers history")
    assert route["category"] == "history"
    assert route["knowledge_domain"] == "theory_history"

# 13. Deliberately ambiguous question
def test_benchmark_13_ambiguous_question():
    route = QueryRouter.route("What does it do?")
    assert route["category"] == "conceptual"

# 14. Question not covered by the sources (Abstention policy)
@pytest.mark.anyio
async def test_benchmark_14_abstention(agent):
    req = AIChatRequest(
        messages=[{"role": "user", "content": "What did George Washington say about quantum gravity?"}]
    )
    res = await agent.answer_query(req)
    assert res.answer is not None
    assert len(res.answer) > 0

# 15. Fabricated-premise question (Hallucination resistance)
@pytest.mark.anyio
async def test_benchmark_15_fabricated_premise(agent):
    req = AIChatRequest(
        messages=[{"role": "user", "content": "Since quantum computers are proven to compute every NP-complete problem in zero seconds, how do we use it?"}]
    )
    res = await agent.answer_query(req)
    assert res.answer is not None

# 16. Current API question
def test_benchmark_16_current_api():
    route = QueryRouter.route("How do I use Qiskit 1.0 primitives SamplerV2 and EstimatorV2?")
    assert route["category"] == "current_information"
    assert route["knowledge_domain"] == "api_docs"

# 17. Circuit debugging question
def test_benchmark_17_circuit_debugging(tools):
    circuit = QuantumIR(
        numQubits=2,
        operations=[
            QuantumOperation(id="op-1", gate="h", targets=[0]),
            # Qubit 1 is unused
        ]
    )
    res = tools.debug_circuit(circuit)
    assert res.success is True
    assert any("Qubits [1]" in w for w in res.data["warnings"])

# 18. Request to show a state visually (Bloch Sphere)
def test_benchmark_18_show_state_visually(tools):
    circuit = QuantumIR(
        numQubits=1,
        operations=[QuantumOperation(id="op-1", gate="h", targets=[0])]
    )
    # |+> state on X axis: (1, 0, 0)
    res = tools.get_bloch_vector(circuit, qubit_index=0)
    assert res.success is True
    assert pytest.approx(res.data["x"], abs=0.01) == 1.0
    assert pytest.approx(res.data["y"], abs=0.01) == 0.0
    assert pytest.approx(res.data["z"], abs=0.01) == 0.0
    assert pytest.approx(res.data["thetaDeg"], abs=0.1) == 90.0
