from typing import List, Dict, Any
from app.services.ai.providers.base import BaseLLMProvider

class MockProvider(BaseLLMProvider):
    """Deterministic mock provider for offline testing and continuous integration."""

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def model_name(self) -> str:
        return "quantumlab-mock-v1"

    def is_available(self) -> bool:
        return True

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.5,
        max_tokens: int = 2048,
    ) -> str:
        last_query = messages[-1]["content"].lower() if messages else ""

        if "superposition" in last_query:
            return (
                "Quantum superposition is the fundamental principle where a quantum state exists as a linear combination "
                "of basis states: |ψ⟩ = α|0⟩ + β|1⟩, satisfying the normalization condition |α|² + |β|² = 1. "
                "Measurement probabilistically projects the state onto either |0⟩ or |1⟩ according to the Born rule."
            )
        elif "bell state" in last_query or "entangle" in last_query:
            return (
                "A Bell state is a maximally entangled two-qubit state, such as |Φ⁺⟩ = (|00⟩ + |11⟩)/√2. "
                "Measuring one qubit instantaneously determines the measurement outcome of the other, violating the CHSH Bell inequality (S = 2√2 > 2)."
            )
        elif "hadamard" in last_query or "h|0>" in last_query:
            return (
                "Applying the Hadamard gate to ground state |0⟩ creates the equal superposition state |+⟩ = (|0⟩ + |1⟩)/√2. "
                "The probabilities for measuring 0 and 1 are both |1/√2|² = 0.5 (50%)."
            )

        return (
            "I have analyzed your query within PBQuantum Labs. "
            "Quantum information is processed through unitary operators acting on states in complex Hilbert spaces."
        )
