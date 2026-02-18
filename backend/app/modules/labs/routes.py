"""
Lab recommendation API: search, recommend, domains, lab details.
Requires LAB_ENGINE_DATABASE_URL. Returns 503 when engine is not configured.
"""
import logging
from typing import Any

from fastapi import APIRouter, Request, HTTPException, status, Query

from app.modules.labs.schemas import RecommendRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/labs", tags=["Labs / Recommendations"])


def get_lab_engine(request: Request):
    """Dependency: lab engine from app.state. None if not configured."""
    return getattr(request.app.state, "lab_engine", None)


@router.get("/health")
def labs_health(request: Request) -> dict[str, Any]:
    """Health check for lab recommendation engine."""
    engine = get_lab_engine(request)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Lab recommendation engine is not configured. Set LAB_ENGINE_DATABASE_URL.",
        )
    return engine.health()


@router.post("/recommend")
def recommend(request: Request, body: RecommendRequest) -> dict[str, Any]:
    """Get ranked lab recommendations by test/standard/domain/state/city."""
    engine = get_lab_engine(request)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Lab recommendation engine is not configured. Set LAB_ENGINE_DATABASE_URL.",
        )
    results, err = engine.recommend_labs(
        test_name=body.test_name.strip(),
        standard=body.standard.strip(),
        domain=body.domain.strip(),
        state=body.state.strip(),
        city=body.city.strip(),
        limit=body.limit,
    )
    if err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)
    return {"count": len(results), "results": results}


@router.get("/search")
def search(
    request: Request,
    test_name: str = Query(""),
    standard: str = Query(""),
    domain: str = Query(""),
    state: str = Query(""),
    city: str = Query(""),
    limit: int = Query(50, ge=1, le=100),
) -> dict[str, Any]:
    """Search labs by test name, standard, domain, state, or city."""
    engine = get_lab_engine(request)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Lab recommendation engine is not configured.",
        )
    results, err = engine.search_labs(
        test_name=test_name.strip(),
        standard=standard.strip(),
        domain=domain.strip(),
        state=state.strip(),
        city=city.strip(),
        limit=limit,
    )
    if err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)
    return {"count": len(results), "results": results}


@router.get("/statistics")
def statistics(request: Request) -> dict[str, Any]:
    """Database statistics: counts, domain distribution, top labs."""
    engine = get_lab_engine(request)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Lab recommendation engine is not configured.",
        )
    data, err = engine.get_statistics()
    if err:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=err)
    return data


@router.get("/by-name")
def search_by_name(
    request: Request,
    q: str = Query(""),
    limit: int = Query(100, ge=1, le=500),
) -> dict[str, Any]:
    """Search labs by name. Empty q returns labs up to limit."""
    engine = get_lab_engine(request)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Lab recommendation engine is not configured.",
        )
    results, err = engine.search_labs_by_name(q.strip(), limit)
    if err:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=err)
    return {"count": len(results), "results": results}


@router.get("/locations")
def locations(request: Request) -> dict[str, Any]:
    """List state/city options for filters (state -> list of cities)."""
    engine = get_lab_engine(request)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Lab recommendation engine is not configured.",
        )
    locs, err = engine.get_locations()
    if err:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=err)
    return {"locations": locs}


@router.get("/domains")
def domains(request: Request) -> dict[str, Any]:
    """List all domains with capability counts."""
    engine = get_lab_engine(request)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Lab recommendation engine is not configured.",
        )
    domains_list, err = engine.get_domains()
    if err:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=err)
    return {"count": len(domains_list), "domains": domains_list}


@router.get("/tests/search")
def search_tests(
    request: Request,
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    """Search tests by name."""
    engine = get_lab_engine(request)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Lab recommendation engine is not configured.",
        )
    results, err = engine.search_tests(q.strip(), limit)
    if err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)
    return {"count": len(results), "results": results}


@router.get("/standards/search")
def search_standards(
    request: Request,
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    """Search standards by code."""
    engine = get_lab_engine(request)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Lab recommendation engine is not configured.",
        )
    results, err = engine.search_standards(q.strip(), limit)
    if err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)
    return {"count": len(results), "results": results}


@router.get("/{lab_id:int}")
def get_lab(request: Request, lab_id: int) -> dict[str, Any]:
    """Get lab details by ID."""
    engine = get_lab_engine(request)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Lab recommendation engine is not configured.",
        )
    data, err = engine.get_lab_details(lab_id)
    if err and data is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err or "Lab not found")
    if err:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=err)
    return data
