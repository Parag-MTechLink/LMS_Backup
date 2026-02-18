"""
FAQ loader: seed faq_knowledge_base from JSON, generate embeddings (question+answer).
Used at startup; avoids duplicate insertions and only backfills missing entries/embeddings.
"""
import json
import logging
import os
from typing import List

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.faq_model import FAQKnowledgeBase

logger = logging.getLogger(__name__)

TARGET_FAQ_COUNT = 500

FAQ_JSON_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "data",
    "faq_knowledge_base.json",
)


def ensure_pgvector_extension() -> None:
    """Enable pgvector extension. Call before creating tables that use vector type."""
    from sqlalchemy import text
    from app.core.database import engine
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()


def load_faq_json() -> List[dict]:
    """Load FAQ entries from JSON file."""
    if not os.path.isfile(FAQ_JSON_PATH):
        logger.warning("FAQ JSON not found at %s", FAQ_JSON_PATH)
        return []
    with open(FAQ_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, list) else []


def _text_for_embedding(entry: dict) -> str:
    """Combine question and answer for embedding (production-safe, no empty)."""
    q = (entry.get("question") or "").strip()
    a = (entry.get("answer") or "").strip()
    if not q and not a:
        return ""
    if not a:
        return q
    if not q:
        return a
    return f"{q}\n{a}"


async def _generate_embeddings_for_entries(
    entries: List[dict],
    embedding_service,
) -> List[List[float]]:
    """Generate embeddings for entries using question+answer combined. Returns list same length as entries."""
    texts = [_text_for_embedding(e) for e in entries]
    # Skip empty; we'll need to align by index
    non_empty_indices = [i for i, t in enumerate(texts) if t]
    if not non_empty_indices:
        return [None] * len(entries)
    to_embed = [texts[i] for i in non_empty_indices]
    vectors = await embedding_service.embed_batch(to_embed, use_cache=True)
    result = [None] * len(entries)
    for idx, vec in zip(non_empty_indices, vectors):
        result[idx] = vec
    return result


async def run_faq_startup() -> None:
    """
    Seed faq_knowledge_base up to TARGET_FAQ_COUNT entries from JSON.
    - If count >= TARGET_FAQ_COUNT, only backfill missing embeddings (if API key set).
    - If count < TARGET_FAQ_COUNT, insert missing entries (by question) then backfill embeddings.
    - Embeddings are generated from question+answer combined. Skip if OPENAI_API_KEY not set.
    - No duplicate rows: existing questions are never re-inserted.
    """
    db = SessionLocal()
    try:
        entries = load_faq_json()
        if not entries:
            logger.info("No FAQ seed entries in JSON; skipping.")
            return

        existing_questions = {
            row.question.strip()
            for row in db.query(FAQKnowledgeBase.question).all()
            if row.question
        }
        count = len(existing_questions)

        # Insert missing entries (no duplicate by question)
        to_insert = [
            e for e in entries
            if (e.get("question") or "").strip() and (e.get("question") or "").strip() not in existing_questions
        ]
        if to_insert:
            for e in to_insert:
                faq = FAQKnowledgeBase(
                    question=(e.get("question") or "").strip(),
                    answer=(e.get("answer") or "").strip(),
                    module=e.get("module"),
                    role=e.get("role"),
                    embedding=None,
                )
                db.add(faq)
            db.commit()
            logger.info("Inserted %d missing FAQ entries (total target %d).", len(to_insert), TARGET_FAQ_COUNT)

        # Backfill embeddings for rows that have none (new inserts + any legacy rows)
        rows_without_embedding = db.query(FAQKnowledgeBase).filter(
            FAQKnowledgeBase.embedding.is_(None)
        ).all()
        if not rows_without_embedding:
            logger.info("FAQ knowledge base: all entries have embeddings; no backfill needed.")
            return

        if not (settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip()):
            logger.warning(
                "OPENAI_API_KEY not set; %d FAQ row(s) have no embedding. Set key and restart to generate.",
                len(rows_without_embedding),
            )
            return

        from app.services.embedding_service import EmbeddingService
        embedding_service = EmbeddingService()
        # Build dict entries for embedding input (question+answer)
        backfill_entries = [
            {"question": r.question, "answer": r.answer or ""}
            for r in rows_without_embedding
        ]
        embeddings = await _generate_embeddings_for_entries(backfill_entries, embedding_service)
        updated = 0
        for faq_row, vec in zip(rows_without_embedding, embeddings):
            if vec is not None:
                faq_row.embedding = vec
                updated += 1
        if updated:
            db.commit()
            logger.info("Backfilled embeddings for %d FAQ entries.", updated)
    except Exception as e:
        logger.exception("FAQ startup error: %s", e)
        db.rollback()
    finally:
        db.close()
