from fastapi import APIRouter

from app.services.data_service import get_overview_stats, get_analytics_trends, get_area_stats

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
def overview():
    """Return platform-wide overview statistics."""
    stats = get_overview_stats()
    return {"success": True, "data": stats, "error": None}


@router.get("/trends")
def trends():
    """Return monthly anomaly trends."""
    data = get_analytics_trends()
    return {"success": True, "data": data, "error": None}


@router.get("/areas")
def areas():
    """Return per-area fraud concentration statistics."""
    data = get_area_stats()
    return {"success": True, "data": data, "error": None}
