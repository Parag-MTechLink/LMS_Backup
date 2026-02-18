"""
Embedding service: generate and cache embeddings via OpenAI.
"""
import hashlib
import logging
from typing import List, Optional

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

# In-memory cache for query embeddings (key: hash of text, value: list of floats)
_embedding_cache: dict[str, List[float]] = {}


class EmbeddingService:
    """Generate embeddings with optional caching."""

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

    def _cache_key(self, text: str) -> str:
        return hashlib.sha256(text.encode()).hexdigest()

    async def embed(self, text: str, use_cache: bool = True) -> List[float]:
        """Generate embedding for a single text. Cached by default."""
        if not text or not text.strip():
            raise ValueError("text must be non-empty")
        key = self._cache_key(text)
        if use_cache and key in _embedding_cache:
            return _embedding_cache[key]
        resp = await self.client.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=text.strip(),
        )
        vec = resp.data[0].embedding
        if use_cache:
            _embedding_cache[key] = vec
        return vec

    async def embed_batch(self, texts: List[str], use_cache: bool = True) -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        if not texts:
            return []
        uncached: List[tuple[int, str]] = []
        results: List[Optional[List[float]]] = [None] * len(texts)
        for i, t in enumerate(texts):
            if not t or not t.strip():
                continue
            key = self._cache_key(t)
            if use_cache and key in _embedding_cache:
                results[i] = _embedding_cache[key]
            else:
                uncached.append((i, t.strip()))
        if uncached:
            indices, to_embed = zip(*uncached) if uncached else ([], [])
            resp = await self.client.embeddings.create(
                model=settings.EMBEDDING_MODEL,
                input=list(to_embed),
            )
            for j, d in enumerate(resp.data):
                idx = indices[j]
                vec = d.embedding
                results[idx] = vec
                if use_cache and j < len(to_embed):
                    _embedding_cache[self._cache_key(to_embed[j])] = vec
        return [r for r in results if r is not None]
