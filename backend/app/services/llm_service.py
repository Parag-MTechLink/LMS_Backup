"""
LLM service: strict context-only completion via OpenAI.
"""
import logging
from typing import Optional

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an assistant for the Lab Management System.
Answer ONLY from the provided context.
If the answer is not in context, respond:
'I do not have information on that. Please contact the administrator.'"""


class LLMService:
    """Generate replies using context-only prompt."""

    def __init__(self, api_key: Optional[str] = None):
        self._client: Optional[AsyncOpenAI] = None
        self._api_key = (api_key or settings.OPENAI_API_KEY or "").strip()

    @property
    def client(self) -> AsyncOpenAI:
        if self._client is None:
            if not self._api_key:
                raise ValueError("OPENAI_API_KEY is not set")
            self._client = AsyncOpenAI(api_key=self._api_key)
        return self._client

    async def complete(
        self,
        context: str,
        user_query: str,
        system_prompt: Optional[str] = None,
    ) -> str:
        """
        Single completion: system + context + user query.
        Returns the assistant reply text.
        """
        system = system_prompt or SYSTEM_PROMPT
        context_block = f"Context:\n{context}\n\nUser Query:\n{user_query}"
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": context_block},
        ]
        resp = await self.client.chat.completions.create(
            model=settings.CHAT_MODEL,
            messages=messages,
            temperature=0,
            max_tokens=500,
        )
        return (resp.choices[0].message.content or "").strip()
