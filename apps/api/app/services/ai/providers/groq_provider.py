import os
import re
import httpx
from typing import List, Dict, Any, Optional
from app.services.ai.providers.base import BaseLLMProvider

class GroqProvider(BaseLLMProvider):
    """Production provider calling Groq ultra-fast LPU inference endpoint."""

    def __init__(self):
        self._api_key = os.getenv("GROQ_API_KEY", "")
        self._primary_model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
        self._fallback_model = "qwen/qwen3.6-27b"
        self._api_url = "https://api.groq.com/openai/v1/chat/completions"

    @property
    def provider_name(self) -> str:
        return "groq"

    @property
    def model_name(self) -> str:
        return self._primary_model

    def is_available(self) -> bool:
        return bool(self._api_key and self._api_key.strip())

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.5,
        max_tokens: int = 2048,
    ) -> str:
        if not self.is_available():
            raise RuntimeError("GroqProvider error: GROQ_API_KEY environment variable is not configured.")

        formatted_messages = [{"role": "system", "content": system_prompt}] + messages

        payload = {
            "model": self._primary_model,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": 0.95,
        }

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.post(self._api_url, json=payload, headers=headers)

            # Retry with fallback model if primary hits 404/rate limit
            if resp.status_code != 200 and self._fallback_model:
                payload["model"] = self._fallback_model
                resp = await client.post(self._api_url, json=payload, headers=headers)

            if resp.status_code != 200:
                raise RuntimeError(f"Groq API error {resp.status_code}: {resp.text}")

            data = resp.json()
            raw_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

            # Strip internal reasoning tags if emitted
            cleaned = re.sub(r"<think>[\s\S]*?</think>", "", raw_text).strip()
            return cleaned or "I was unable to formulate a response. Please rephrase your query."
