"""
RAG service: orchestrate embedding -> retrieval -> LLM with caching.
Single pipeline for chatbot; no business logic in routes.
"""
import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import RAG_RESPONSE_CACHE_MAX
from app.services.embedding_service import EmbeddingService
from app.services.llm_service import LLMService
from app.services.retrieval_service import retrieve_sync

logger = logging.getLogger(__name__)

# Optional response cache: key = hash(message + user_role), value = reply
_response_cache: dict[str, str] = {}


def _chunks_to_context(chunks: List[tuple]) -> str:
    """Format retrieved (faq, score) pairs into context string. Max 3 chunks."""
    parts = []
    for faq, score in chunks[:3]:
        parts.append(f"Q: {faq.question}\nA: {faq.answer}")
        logger.info("RAG similarity score=%.4f for q=%s", score, (faq.question or "")[:60])
    return "\n\n".join(parts) if parts else ""


class RAGService:
    """Hybrid RAG pipeline: embed query -> retrieve -> strict LLM."""

    def __init__(
        self,
        embedding_service: Optional[EmbeddingService] = None,
        llm_service: Optional[LLMService] = None,
    ):
        self.embedding = embedding_service or EmbeddingService()
        self.llm = llm_service or LLMService()

    async def get_reply(
        self,
        db: Session,
        message: str,
        user_role: Optional[str] = None,
        use_answer_cache: bool = True,
    ) -> str:
        """
        Full pipeline: embed -> hybrid search (top_k, role filter, threshold) -> prompt -> LLM.
        Returns generated reply.
        """
        message = (message or "").strip()
        if not message:
            return "I do not have information on that. Please contact the administrator."

        cache_key = None
        if use_answer_cache and user_role is not None:
            import hashlib
            cache_key = hashlib.sha256(f"{message}|{user_role}".encode()).hexdigest()
            if cache_key in _response_cache:
                return _response_cache[cache_key]

        try:
            query_embedding = await self.embedding.embed(message, use_cache=True)
        except Exception as e:
            logger.exception("Embedding failed: %s", e)
            return "I do not have information on that. Please contact the administrator."

        chunks = retrieve_sync(
            db,
            query_embedding,
            user_role=user_role,
            top_k=settings.RAG_TOP_K,
            similarity_threshold=settings.RAG_SIMILARITY_THRESHOLD,
        )

        context = _chunks_to_context(chunks)
        if not context:
            return "I do not have information on that. Please contact the administrator."

        try:
            reply = await self.llm.complete(context=context, user_query=message)
        except Exception as e:
            logger.exception("LLM completion failed: %s", e)
            return "I do not have information on that. Please contact the administrator."

        if cache_key and len(_response_cache) < RAG_RESPONSE_CACHE_MAX:
            _response_cache[cache_key] = reply

        return reply
