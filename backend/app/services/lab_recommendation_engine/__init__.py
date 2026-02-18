"""
Native Lab Recommendation Engine.
Single service; no plugin discovery. Reads from lab_engine schema in NeonDB.
"""
from app.services.lab_recommendation_engine.engine import LabRecommendationEngine
from app.services.lab_recommendation_engine.service import LabRecommendationService

__all__ = ["LabRecommendationEngine", "LabRecommendationService"]
