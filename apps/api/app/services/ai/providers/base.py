from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseLLMProvider(ABC):
    """Abstract interface for LLM providers (Groq, Local/vLLM, Future)."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider service."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Active model identifier."""
        pass

    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.5,
        max_tokens: int = 2048,
    ) -> str:
        """Generates a text completion given conversation history and system prompt."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if the provider credentials/endpoints are reachable."""
        pass
