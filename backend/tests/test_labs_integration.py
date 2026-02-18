"""
Integration tests for lab recommendation engine and API.
When LAB_ENGINE_DATABASE_URL is not set, /api/v1/labs/* returns 503.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Test client; lab_engine may be None if LAB_ENGINE_DATABASE_URL not set."""
    return TestClient(app)


def test_labs_health_returns_503_or_401_when_engine_not_configured(client: TestClient):
    """Without LAB_ENGINE_DATABASE_URL, labs health returns 503; or 401 if auth required."""
    if getattr(app.state, "lab_engine", None) is not None:
        pytest.skip("LAB_ENGINE_DATABASE_URL is set; engine is available")
    r = client.get("/api/v1/labs/health")
    assert r.status_code in (401, 503)
    if r.status_code == 503:
        assert "detail" in r.json()


def test_labs_recommend_returns_503_or_401_when_engine_not_configured(client: TestClient):
    """POST /api/v1/labs/recommend returns 503 or 401 when engine not configured / unauthenticated."""
    if getattr(app.state, "lab_engine", None) is not None:
        pytest.skip("LAB_ENGINE_DATABASE_URL is set")
    r = client.post("/api/v1/labs/recommend", json={"test_name": "Voltage", "limit": 10})
    assert r.status_code in (401, 503)


def test_labs_search_returns_503_or_401_when_engine_not_configured(client: TestClient):
    """GET /api/v1/labs/search returns 503 or 401 when engine not configured / unauthenticated."""
    if getattr(app.state, "lab_engine", None) is not None:
        pytest.skip("LAB_ENGINE_DATABASE_URL is set")
    r = client.get("/api/v1/labs/search", params={"test_name": "test"})
    assert r.status_code in (401, 503)


def test_lab_recommendation_engine_import():
    """Native lab recommendation engine can be imported and instantiated with a URL."""
    from app.services.lab_recommendation_engine import LabRecommendationEngine
    # Instantiation with invalid URL still creates engine; health() would fail
    engine = LabRecommendationEngine("postgresql://localhost/nonexistent")
    assert hasattr(engine, "health")
    assert hasattr(engine, "recommend_labs")
    assert hasattr(engine, "search_labs")
