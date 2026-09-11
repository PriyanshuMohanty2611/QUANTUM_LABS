from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from app.schemas.quantum import QuantumIR, SimulationOptions, SimulationResult, ComplexAmplitude

# 1. Query Routing Categories
QueryCategory = Literal[
    "conceptual",
    "intuitive",
    "mathematical",
    "code",
    "circuit",
    "simulation",
    "debugging",
    "history",
    "theory",
    "current_information",
    "visualization",
    "lesson",
    "challenge",
    "mixed"
]

# 2. RAG Chunk Record Schema (Section 10)
class ChunkRecord(BaseModel):
    chunk_id: str = Field(description="Unique deterministic chunk identifier")
    source_id: str = Field(description="Source identifier (e.g., 'gentle_intro_qc', 'schrodinger_cat', 'quantumlab_curriculum')")
    source_title: str = Field(description="Full title of the reference source")
    source_type: Literal["textbook", "quantumlab", "curated_web", "documentation"] = Field(description="Source classification")
    knowledge_domain: Literal["math_code", "theory_history", "curriculum", "api_docs"] = Field(description="Knowledge domain")
    authority: Literal["primary", "primary_for_history", "project_curated", "authoritative_docs"] = Field(description="Epistemic authority ranking")
    chapter: Optional[str] = Field(default=None, description="Chapter title or number")
    section: Optional[str] = Field(default=None, description="Section heading")
    page_start: Optional[int] = Field(default=None, description="Starting page in physical/canonical source")
    page_end: Optional[int] = Field(default=None, description="Ending page in source")
    url: Optional[str] = Field(default=None, description="Curated URL if applicable")
    retrieved_at: Optional[str] = Field(default=None, description="ISO timestamp for web sources")
    text: str = Field(description="The clean mathematical and conceptual text content of the chunk")

# 3. Source Citation
class SourceCitation(BaseModel):
    source_id: str
    source_title: str
    source_type: str
    chapter: Optional[str] = None
    section: Optional[str] = None
    page: Optional[str] = None
    url: Optional[str] = None
    retrieved_at: Optional[str] = None
    snippet: Optional[str] = None

# 4. Deterministic Quantum Engine Tool Results (Section 12 & 13)
class QuantumToolExecution(BaseModel):
    tool_name: Literal[
        "inspect_circuit",
        "validate_circuit",
        "run_simulation",
        "get_statevector",
        "get_probabilities",
        "get_measurement_counts",
        "get_bloch_vector",
        "generate_qiskit",
        "parse_qiskit",
        "debug_circuit"
    ]
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time_ms: Optional[float] = None

# 5. Visualization Actions (Section 20 & 21)
class VisualizationAction(BaseModel):
    type: Literal[
        "bloch_sphere",
        "statevector_view",
        "probability_chart",
        "measurement_histogram",
        "circuit_highlight",
        "matrix_view",
        "curriculum_lab"
    ]
    payload: Dict[str, Any] = Field(default_factory=dict, description="Deterministic payload for the frontend to render")

# 6. Structured Circuit Modification Intent (Section 19)
class CircuitOperationProposal(BaseModel):
    operation: Literal["add_gate", "remove_gate", "replace_gate", "clear_circuit"]
    gate: Optional[str] = None
    targets: Optional[List[int]] = None
    controls: Optional[List[int]] = None
    params: Optional[List[float]] = None
    moment: Optional[int] = None
    explanation: Optional[str] = None

# 7. AI Request Payload
class AIChatRequest(BaseModel):
    messages: List[Dict[str, str]] = Field(description="Conversation history with 'role' and 'content'")
    current_path: Optional[str] = Field(default=None, description="Current route or page location in QuantumLab")
    current_lesson_id: Optional[str] = Field(default=None, description="Active curriculum lesson ID")
    domain_context: Optional[str] = Field(default=None, description="Active 36-domain identifier")
    circuit: Optional[QuantumIR] = Field(default=None, description="Current circuit on the visual canvas")
    simulation_options: Optional[SimulationOptions] = Field(default=None, description="Options for on-demand simulation")
    level: Literal["intuitive", "intermediate", "rigorous"] = Field(default="intermediate", description="Pedagogical depth")

# 8. Structured AI Response Contract (Section 32)
class AIChatResponse(BaseModel):
    answer: str = Field(description="Pedagogically grounded explanation or derivation")
    sources: List[SourceCitation] = Field(default=[], description="Structured source citations")
    tool_results: List[QuantumToolExecution] = Field(default=[], description="Actual results from deterministic quantum engine tools")
    visualization_actions: List[VisualizationAction] = Field(default=[], description="Frontend visualization rendering instructions")
    circuit_proposal: Optional[CircuitOperationProposal] = Field(default=None, description="Proposed structured circuit edit")
    code: Optional[str] = Field(default=None, description="Executable verified Qiskit code if generated")
    confidence: Optional[str] = Field(default=None, description="Calibrated epistemic status (e.g., 'verified_by_simulation', 'high_textbook_agreement')")
    grounding_status: Literal["grounded", "partial", "insufficient"] = Field(default="grounded", description="Source grounding quality")
    requires_simulation: bool = Field(default=False, description="True if answer relies on quantum simulation")
    audio_text: Optional[str] = Field(default=None, description="Clean speech text for application-layer TTS")

# 9. Audio TTS Request & Response (Section 22)
class TTSRequest(BaseModel):
    text: str = Field(description="Text to synthesize")
    voice_speed: Optional[float] = Field(default=1.0)

class TTSResponse(BaseModel):
    provider: str = Field(description="TTS provider used (e.g., 'web_speech_api', 'local_tts')")
    speech_text: str = Field(description="Sanitized text ready for speech synthesis")
    phonetic_hints: Optional[Dict[str, str]] = Field(default={}, description="Quantum term pronunciations (e.g. '|ψ⟩' -> 'ket psi')")
