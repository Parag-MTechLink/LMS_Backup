from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Sample(Base):
    __tablename__ = "samples"

    id = Column(Integer, primary_key=True, index=True)
    sampleNumber = Column(String, nullable=False)
    condition = Column(String, nullable=False)
    receivedDate = Column(String)
    storageLocation = Column(String)
    projectId = Column(Integer)
    projectName = Column(String)
    notes = Column(String)   # ✅ added
    quantity = Column(Integer, nullable=True)
    testDetails = Column(String, nullable=True)
