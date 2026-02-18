"""
Lab recommendation engine: single service, no plugins.
Initialized at startup; injectable via app.state.lab_engine.
Reads only from lab_engine DB schema (NeonDB).
"""
import logging
from typing import Any

from app.services.lab_recommendation_engine.service import LabRecommendationService

logger = logging.getLogger(__name__)


class LabRecommendationEngine:
    """
    Native lab recommendation engine. Uses LabRecommendationService for all DB access.
    No plugin discovery; single service. Data populated by lab_engine pipeline (external).
    """

    def __init__(self, database_url: str):
        self._service = LabRecommendationService(database_url)
        logger.info("Lab recommendation engine initialized (native service, no plugins).")

    def is_available(self) -> bool:
        """True if engine can connect to lab_engine DB."""
        try:
            h = self._service.health()
            return h.get("status") == "healthy"
        except Exception:
            return False

    def health(self) -> dict[str, Any]:
        return self._service.health()

    def search_labs(
        self,
        test_name: str = "",
        standard: str = "",
        domain: str = "",
        state: str = "",
        city: str = "",
        limit: int = 50,
    ) -> tuple[list[dict], str | None]:
        return self._service.search_labs(
            test_name, standard, domain, state, city, limit
        )

    def recommend_labs(
        self,
        test_name: str = "",
        standard: str = "",
        domain: str = "",
        state: str = "",
        city: str = "",
        limit: int = 20,
    ) -> tuple[list[dict], str | None]:
        return self._service.recommend_labs(
            test_name, standard, domain, state, city, limit
        )

    def get_lab_details(self, lab_id: int) -> tuple[dict | None, str | None]:
        return self._service.get_lab_details(lab_id)

    def get_domains(self) -> tuple[list[dict], str | None]:
        return self._service.get_domains()

    def get_locations(self) -> tuple[dict[str, list[str]], str | None]:
        return self._service.get_locations()

    def search_labs_by_name(
        self, query: str = "", limit: int = 100
    ) -> tuple[list[dict], str | None]:
        return self._service.search_labs_by_name(query, limit)

    def get_statistics(self) -> tuple[dict[str, Any], str | None]:
        return self._service.get_statistics()

    def search_tests(self, q: str, limit: int = 20) -> tuple[list[dict], str | None]:
        return self._service.search_tests(q, limit)

    def search_standards(self, q: str, limit: int = 20) -> tuple[list[dict], str | None]:
        return self._service.search_standards(q, limit)
