import os
import re
import httpx
from typing import List, Dict, Any, Optional
from app.services.ai.providers.base import BaseLLMProvider

class LocalLLMProvider(BaseLLMProvider):
    """Provider connecting to local/self-hosted fine-tuned model (e.g., vLLM, Ollama, Kaggle T4 tunnel)."""

    def __init__(self):
        self._api_url = os.getenv("LOCAL_LLM_URL", "http://localhost:11434/v1/chat/completions")
        self._model = os.getenv("LOCAL_LLM_MODEL", "quantumlab-instruct-t4")
        self._api_key = os.getenv("LOCAL_LLM_API_KEY", "local-token")

    @property
    def provider_name(self) -> str:
        return "local"

    @property
    def model_name(self) -> str:
        return self._model

    def is_available(self) -> bool:
        return bool(self._api_url and self._api_url.strip())

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.5,
        max_tokens: int = 2048,
    ) -> str:
        formatted_messages = [{"role": "system", "content": system_prompt}] + messages

        payload = {
            "model": self._model,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        headers = {
            "Content-Type": "application/json",
        }
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(self._api_url, json=payload, headers=headers)
                if resp.status_code != 200:
                    raise RuntimeError(f"Local LLM endpoint returned {resp.status_code}: {resp.text}")

                data = resp.json()
                raw_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                cleaned = re.sub(r"<think>[\s\S]*?</think>", "", raw_text).strip()
                return cleaned or "Local model returned empty completion."
        except Exception as e:
            raise RuntimeError(f"Failed to connect to local model at {self._api_url}: {str(e)}")
