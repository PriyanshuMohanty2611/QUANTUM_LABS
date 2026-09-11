import pytest
from app.schemas.quantum import QuantumIR, QuantumOperation, SimulationOptions
from app.schemas.ai import AIChatRequest, AIChatResponse, TTSRequest
from app.services.ai.tools.quantum_tools import QuantumToolBridge
from app.services.ai.router import QueryRouter
from app.services.ai.rag.knowledge_store import KnowledgeStore
from app.services.ai.providers.mock_provider import MockProvider
from app.services.ai.agent import QuantumLabAgent
from app.services.ai.tts import TTSService

@pytest.fixture
def tools():
    return QuantumToolBridge()

@pytest.fixture
def store():
    return KnowledgeStore()

@pytest.fixture
def agent(store):
    mock = MockProvider()
    return QuantumLabAgent(provider=mock, knowledge_store=store)

def test_tool_validate_circuit(tools):
    circuit = QuantumIR(
        numQubits=2,
        operations=[QuantumOperation(id="op-1", gate="h", targets=[0])]
    )
    result = tools.validate_circuit(circuit)
    assert result.success is True
    assert result.data["numQubits"] == 2
    assert result.data["operationCount"] == 1

def test_tool_run_simulation(tools):
    # Bell state circuit
    circuit = QuantumIR(
        numQubits=2,
        operations=[
            QuantumOperation(id="op-1", gate="h", targets=[0]),
            QuantumOperation(id="op-2", gate="cx", controls=[0], targets=[1]),
        ]
    )
    res = tools.run_simulation(circuit, SimulationOptions(shots=500, mode="both"))
    assert res.success is True
    probs = res.data["probabilities"]
    assert pytest.approx(probs["00"], abs=0.05) == 0.5
    assert pytest.approx(probs["11"], abs=0.05) == 0.5
    assert "01" not in probs or probs["01"] < 0.01

def test_tool_get_bloch_vector_ground_state(tools):
    # Ground state |0> -> (0, 0, 1)
    circuit = QuantumIR(numQubits=1, operations=[])
    res = tools.get_bloch_vector(circuit, qubit_index=0)
    assert res.success is True
    data = res.data
    assert pytest.approx(data["x"], abs=0.01) == 0.0
    assert pytest.approx(data["y"], abs=0.01) == 0.0
    assert pytest.approx(data["z"], abs=0.01) == 1.0
    assert pytest.approx(data["thetaDeg"], abs=0.1) == 0.0

def test_tool_get_bloch_vector_plus_state(tools):
    # Plus state H|0> = |+> -> (1, 0, 0)
    circuit = QuantumIR(
        numQubits=1,
        operations=[QuantumOperation(id="op-1", gate="h", targets=[0])]
    )
    res = tools.get_bloch_vector(circuit, qubit_index=0)
    assert res.success is True
    data = res.data
    assert pytest.approx(data["x"], abs=0.01) == 1.0
    assert pytest.approx(data["y"], abs=0.01) == 0.0
    assert pytest.approx(data["z"], abs=0.01) == 0.0
    assert pytest.approx(data["thetaDeg"], abs=0.1) == 90.0

def test_tool_debug_circuit_redundancy(tools):
    # Two consecutive Hadamards cancel out
    circuit = QuantumIR(
        numQubits=1,
        operations=[
            QuantumOperation(id="op-1", gate="h", targets=[0]),
            QuantumOperation(id="op-2", gate="h", targets=[0]),
        ]
    )
    res = tools.debug_circuit(circuit)
    assert res.success is True
    assert len(res.data["warnings"]) >= 1
    assert "cancel each other" in res.data["warnings"][0]

def test_tool_generate_qiskit(tools):
    circuit = QuantumIR(
        numQubits=2,
        numClbits=2,
        operations=[
            QuantumOperation(id="op-1", gate="h", targets=[0]),
            QuantumOperation(id="op-2", gate="cx", controls=[0], targets=[1]),
            QuantumOperation(id="op-3", gate="measure", targets=[0], clbits=[0]),
        ]
    )
    res = tools.generate_qiskit(circuit)
    assert res.success is True
    code = res.data["code"]
    assert "QuantumCircuit(2, 2)" in code
    assert "qc.h(0)" in code
    assert "qc.cx(0, 1)" in code
    assert "qc.measure(0, 0)" in code

def test_query_router_classification():
    r1 = QueryRouter.route("Explain quantum superposition using a simple analogy")
    assert r1["category"] in ["conceptual", "intuitive"]

    r2 = QueryRouter.route("Derive the state H|0> step by step")
    assert r2["category"] == "mathematical"
    assert r2["knowledge_domain"] == "math_code"

    r3 = QueryRouter.route("What were Schrödinger's thought experiments in 1935?")
    assert r3["category"] == "history"
    assert r3["knowledge_domain"] == "theory_history"

    r4 = QueryRouter.route("Show this state on the 3D Bloch sphere", has_circuit=True)
    assert r4["category"] == "visualization"
    assert r4["visualization_intent"] == "bloch_sphere"

def test_knowledge_store_multi_source_retrieval(store):
    # Math search prefers Source A
    math_results = store.search("Complex vector spaces inner products Dirac", category="mathematical")
    assert len(math_results) > 0
    top_chunk, score = math_results[0]
    assert top_chunk.source_id == "gentle_intro_qc"
    assert top_chunk.page_start is not None

    # History search prefers Source B
    history_results = store.search("Schrödinger cat radioactive atom box 1935", category="history")
    assert len(history_results) > 0
    top_hist, _ = history_results[0]
    assert top_hist.source_id == "schrodinger_cat"
    assert top_hist.page_start is not None

def test_tts_service_phonetics():
    service = TTSService()
    req = TTSRequest(text="State |ψ⟩ collapses to |0⟩ or |1⟩ upon measurement.")
    res = service.prepare_speech(req)
    assert "ket psi" in res.speech_text
    assert "ket zero" in res.speech_text
    assert "ket one" in res.speech_text

def test_agent_end_to_end_simulation(agent):
    import asyncio

    async def _run():
        circuit = QuantumIR(
            numQubits=1,
            operations=[QuantumOperation(id="op-1", gate="h", targets=[0])]
        )
        req = AIChatRequest(
            messages=[{"role": "user", "content": "What is the probability when I run this circuit?"}],
            circuit=circuit,
            level="intermediate"
        )
        res: AIChatResponse = await agent.answer_query(req)
        assert res.answer is not None
        assert len(res.tool_results) >= 2  # validate + simulation
        sim_tool = next(t for t in res.tool_results if t.tool_name == "run_simulation")
        assert sim_tool.success is True
        assert pytest.approx(sim_tool.data["probabilities"]["0"], abs=0.05) == 0.5
        assert len(res.sources) > 0

    asyncio.run(_run())
