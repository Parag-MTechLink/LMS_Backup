"""
FAQ Knowledge Base model for Hybrid RAG.
Stored in PostgreSQL with pgvector for similarity search.
"""
import uuid
from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from pgvector.sqlalchemy import Vector

from app.core.database import Base


class FAQKnowledgeBase(Base):
    """
    FAQ entries with embeddings for role-filtered retrieval.
    """
    __tablename__ = "faq_knowledge_base"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    module = Column(Text, nullable=True)
    role = Column(ARRAY(Text), nullable=True)
    embedding = Column(Vector(1536), nullable=True)

    def __repr__(self):
        return f"<FAQKnowledgeBase(id={self.id}, question={self.question[:50]}...)>"
