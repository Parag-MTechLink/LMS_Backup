from sqlalchemy import Column, Integer, String
from app.core.database import Base


class TRF(Base):
    __tablename__ = "trfs"

    id = Column(Integer, primary_key=True, index=True)
    trfNumber = Column(String, index=True, nullable=True)

    projectId = Column(Integer, nullable=False)
    projectName = Column(String, nullable=False)
    status = Column(String, default="Pending QA")

    notes = Column(String, nullable=True)
