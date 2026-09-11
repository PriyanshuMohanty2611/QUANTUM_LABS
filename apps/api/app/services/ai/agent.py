import time
import re
import json
from typing import Dict, List, Any, Optional
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    QuantumToolExecution,
    VisualizationAction,
    CircuitOperationProposal,
    SourceCitation,
)
from app.schemas.quantum import QuantumIR, SimulationOptions
from app.services.ai.providers.base import BaseLLMProvider
from app.services.ai.providers.factory import get_llm_provider
from app.services.ai.rag.knowledge_store import KnowledgeStore
from app.services.ai.tools.quantum_tools import QuantumToolBridge
from app.services.ai.router import QueryRouter

class QuantumLabAgent:
    """Production-ready, source-grounded QuantumLab AI Tutor and Copilot orchestrator.
    Combines:
    - Provider abstraction (Groq, Local, Mock)
    - Source-grounded RAG retrieval (Sources A, B, C, D)
    - Deterministic Qiskit Aer tool execution (no hallucinated calculations)
    - Structured visualization action emission
    - Misconception correction and adaptive pedagogy
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None, knowledge_store: Optional[KnowledgeStore] = None):
        self.provider = provider or get_llm_provider()
        self.knowledge_store = knowledge_store or KnowledgeStore()
        self.tools = QuantumToolBridge()

    async def answer_query(self, request: AIChatRequest) -> AIChatResponse:
        start_time = time.time()
        last_user_msg = request.messages[-1]["content"] if request.messages else ""

        # 1. Route query to category and determine tool needs
        has_circuit = bool(request.circuit and len(request.circuit.operations) > 0)
        route_plan = QueryRouter.route(last_user_msg, has_circuit=has_circuit)
        category = route_plan["category"]
        knowledge_domain = route_plan["knowledge_domain"]

        # 2. Retrieve source evidence
        retrieved_chunks = self.knowledge_store.search(
            query=last_user_msg,
            category=category,
            knowledge_domain=knowledge_domain,
            top_k=4,
        )
        citations = self.knowledge_store.format_citations(retrieved_chunks)

        # 3. Execute deterministic quantum tools if required
        tool_results: List[QuantumToolExecution] = []
        visualization_actions: List[VisualizationAction] = []
        generated_code: Optional[str] = None
        circuit_proposal: Optional[CircuitOperationProposal] = None

        if request.circuit:
            # Always validate structure first
            val_result = self.tools.validate_circuit(request.circuit)
            tool_results.append(val_result)

            # If simulation or probabilities are requested
            if route_plan["needs_simulation"] or category in ["simulation", "visualization"]:
                sim_opts = request.simulation_options or SimulationOptions(shots=1024, mode="both")
                sim_result = self.tools.run_simulation(request.circuit, sim_opts)
                tool_results.append(sim_result)

                if sim_result.success and sim_result.data:
                    # Emit visualization action
                    if route_plan["visualization_intent"] == "probability_chart" or category == "simulation":
                        visualization_actions.append(
                            VisualizationAction(
                                type="probability_chart",
                                payload={
                                    "probabilities": sim_result.data.get("probabilities", {}),
                                    "counts": sim_result.data.get("counts", {}),
                                    "shots": sim_result.data.get("shots", 1024),
                                }
                            )
                        )

            # If Bloch vector is requested
            if route_plan["visualization_intent"] == "bloch_sphere" or "bloch" in last_user_msg.lower():
                bv_result = self.tools.get_bloch_vector(request.circuit, qubit_index=0)
                tool_results.append(bv_result)
                if bv_result.success and bv_result.data:
                    visualization_actions.append(
                        VisualizationAction(
                            type="bloch_sphere",
                            payload=bv_result.data
                        )
                    )

            # If debugging is requested
            if category == "debugging":
                dbg_result = self.tools.debug_circuit(request.circuit)
                tool_results.append(dbg_result)

            # If circuit inspection is requested
            if category == "circuit":
                insp_result = self.tools.inspect_circuit(request.circuit)
                tool_results.append(insp_result)

            # If code generation is requested for the current circuit
            if category == "code":
                code_result = self.tools.generate_qiskit(request.circuit)
                tool_results.append(code_result)
                if code_result.success and code_result.data:
                    generated_code = code_result.data.get("code")

        # 4. Construct grounded system prompt
        system_prompt = self._build_system_prompt(
            request=request,
            category=category,
            retrieved_chunks=retrieved_chunks,
            tool_results=tool_results,
        )

        # 5. Generate LLM completion
        raw_answer = await self.provider.generate_response(
            messages=request.messages,
            system_prompt=system_prompt,
            temperature=0.3 if category in ["mathematical", "simulation", "debugging"] else 0.5,
        )

        # 6. Post-processing: extract code if present in answer
        if not generated_code and "```python" in raw_answer:
            code_match = re.search(r"```python\s*([\s\S]*?)```", raw_answer)
            if code_match:
                generated_code = code_match.group(1).strip()

        # 7. Epistemic confidence & grounding status
        grounding_status = "grounded" if citations or tool_results else "partial"
        confidence_label = "verified_by_simulation" if any(t.tool_name == "run_simulation" and t.success for t in tool_results) else "source_grounded"

        # 8. Clean audio text for TTS
        audio_text = self._prepare_audio_text(raw_answer)

        return AIChatResponse(
            answer=raw_answer,
            sources=citations,
            tool_results=tool_results,
            visualization_actions=visualization_actions,
            circuit_proposal=circuit_proposal,
            code=generated_code,
            confidence=confidence_label,
            grounding_status=grounding_status,
            requires_simulation=route_plan["needs_simulation"],
            audio_text=audio_text,
        )

    def _build_system_prompt(
        self,
        request: AIChatRequest,
        category: str,
        retrieved_chunks: List[Any],
        tool_results: List[QuantumToolExecution],
    ) -> str:
        level_instructions = {
            "intuitive": (
                "Pedagogical Depth: INTUITIVE.\n"
                "- Explain concepts using everyday visual physical analogies (e.g. spinning coins for superposition, polarized filters for measurement).\n"
                "- Introduce Dirac notation gently with plain-English meaning.\n"
                "- Avoid unnecessary jargon."
            ),
            "intermediate": (
                "Pedagogical Depth: INTERMEDIATE / APPLIED ENGINEERING.\n"
                "- Combine clear physical intuition with Dirac notation (|ψ⟩ = α|0⟩ + β|1⟩).\n"
                "- Reference unitary operations and state vector evolutions.\n"
                "- Provide modern Python Qiskit 1.0+ code."
            ),
            "rigorous": (
                "Pedagogical Depth: RIGOROUS MATHEMATICS.\n"
                "- Provide exact mathematical derivations with Dirac bra-ket notation and complex matrices.\n"
                "- Formulate operators, density matrices ρ, or Lindblad master equations.\n"
                "- Explicitly verify probability normalization (∑|α_i|² = 1) and inner products."
            ),
        }

        # Format retrieved evidence
        evidence_text = ""
        if retrieved_chunks:
            evidence_text = "VERIFIED CANONICAL EVIDENCE SOURCES:\n"
            for chunk, score in retrieved_chunks:
                evidence_text += (
                    f"--- Source: [{chunk.source_title}], {chunk.chapter} ({chunk.section}) ---\n"
                    f"{chunk.text}\n\n"
                )

        # Format verified tool calculation results
        tools_text = ""
        if tool_results:
            tools_text = "DETERMINISTIC QUANTUM ENGINE VERIFIED CALCULATIONS:\n"
            for t in tool_results:
                if t.success and t.data:
                    tools_text += f"[{t.tool_name}]: {json.dumps(t.data)}\n"
                elif not t.success:
                    tools_text += f"[{t.tool_name} FAILED]: {t.error}\n"

        prompt = f"""You are "QUANTUM", the source-grounded AI tutor and laboratory copilot for PBQuantum Labs.

ABSOLUTE GROUNDING & ACCURACY RULES:
1. Ground your answer in the canonical sources provided below.
2. NEVER guess or fabricate quantum simulation results, statevectors, probabilities, or circuit depth. Use the verified calculations provided below.
3. If tool calculation data is provided, cite and explain those EXACT numerical results. Never claim you ran a simulation unless tool data is present.
4. Correct common misconceptions scientifically and politely:
   - Clarify that superposition is NOT 'both 0 and 1 at the same time', but a linear combination of basis states with complex amplitudes.
   - Clarify that amplitudes α can be negative or complex, while measurement probabilities |α|² are non-negative real numbers.
   - Clarify that entanglement does NOT enable faster-than-light communication (No-Communication Theorem).
5. If the required information is absent from both evidence and tool data, state clearly: "I don't have verified canonical data to answer that with certainty."

{level_instructions.get(request.level, level_instructions["intermediate"])}

{evidence_text}
{tools_text}
Answer the student's question clearly, encouragingly, and rigorously."""
        return prompt

    def _prepare_audio_text(self, text: str) -> str:
        """Strips markdown code blocks, LaTeX delimiters, and formatting for smooth TTS playback."""
        clean = re.sub(r"```[\s\S]*?```", " [Code snippet shown on screen] ", text)
        clean = re.sub(r"\|0⟩", "ket zero", clean)
        clean = re.sub(r"\|1⟩", "ket one", clean)
        clean = re.sub(r"\|ψ⟩", "ket psi", clean)
        clean = re.sub(r"\|Φ⁺⟩", "Phi plus Bell state", clean)
        clean = re.sub(r"\|Ψ⁺⟩", "Psi plus Bell state", clean)
        clean = re.sub(r"[#*`_]", "", clean)
        clean = re.sub(r"\s+", " ", clean).strip()
        return clean[:400]
