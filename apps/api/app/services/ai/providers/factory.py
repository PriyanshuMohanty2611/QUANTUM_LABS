import os
from typing import Optional
from app.services.ai.providers.base import BaseLLMProvider
from app.services.ai.providers.groq_provider import GroqProvider
from app.services.ai.providers.local_provider import LocalLLMProvider
from app.services.ai.providers.mock_provider import MockProvider

def get_llm_provider(preferred_provider: Optional[str] = None) -> BaseLLMProvider:
    """Factory creating the appropriate LLM provider based on environment configuration."""
    provider_type = (preferred_provider or os.getenv("AI_PROVIDER", "groq")).lower().strip()

    if provider_type == "groq":
        groq = GroqProvider()
        if groq.is_available():
            return groq
        # Fallback if key not set
        return MockProvider()

    elif provider_type in ["local", "vllm", "ollama", "kaggle"]:
        local = LocalLLMProvider()
        if local.is_available():
            return local
        return MockProvider()

    elif provider_type == "mock":
        return MockProvider()

    # Default fallback
    groq = GroqProvider()
    if groq.is_available():
        return groq
    return MockProvider()
