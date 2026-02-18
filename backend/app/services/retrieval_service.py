"""
Retrieval service: vector similarity search with role filtering and threshold.
"""
import logging
from typing import List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.faq_model import FAQKnowledgeBase

logger = logging.getLogger(__name__)

# Top-K and threshold from config
TOP_K = getattr(settings, "RAG_TOP_K", 3)
SIMILARITY_THRESHOLD = getattr(settings, "RAG_SIMILARITY_THRESHOLD", 0.7)


def retrieve_sync(
    db: Session,
    query_embedding: List[float],
    user_role: Optional[str] = None,
    top_k: int = TOP_K,
    similarity_threshold: float = SIMILARITY_THRESHOLD,
) -> List[tuple[FAQKnowledgeBase, float]]:
    """
    Hybrid retrieval: vector similarity + optional role filter.
    Returns list of (FAQKnowledgeBase, similarity_score) ordered by score desc.
    Uses pgvector <=> operator (cosine distance); we convert to similarity.
    """
    if not query_embedding:
        return []
    try:
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
    except Exception:
        return []

    role_filter = ""
    params: dict = {
        "embedding": embedding_str,
        "top_k": top_k,
        "threshold": similarity_threshold,
    }
    if user_role and user_role.strip():
        role_filter = " AND (:role = ANY(role) OR role IS NULL OR array_length(role, 1) IS NULL)"
        params["role"] = user_role.strip()

    # pgvector: <=> is cosine distance. similarity = 1 - distance (higher = more similar)
    # Use CAST(:embedding AS vector) so SQLAlchemy treats only :embedding as a bind param (not :vector)
    sql = f"""
        SELECT id, question, answer, module, role,
               1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
        FROM faq_knowledge_base
        WHERE embedding IS NOT NULL
        {role_filter}
        ORDER BY embedding <=> CAST(:embedding AS vector)
        LIMIT :top_k
    """
    raw = db.execute(text(sql), params).fetchall()

    out: List[tuple[FAQKnowledgeBase, float]] = []
    for row in raw:
        sid, question, answer, module, role, sim = row
        if sim < similarity_threshold:
            logger.info("RAG retrieval: score below threshold score=%.4f threshold=%.4f", sim, similarity_threshold)
            continue
        faq = FAQKnowledgeBase(
            id=sid,
            question=question,
            answer=answer,
            module=module,
            role=role,
        )
        out.append((faq, sim))
    return out
