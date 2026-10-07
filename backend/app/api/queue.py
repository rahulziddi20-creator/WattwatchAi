from fastapi import APIRouter, Query
from typing import Optional

from app.services.data_service import get_all_analyzed

router = APIRouter(prefix="/queue", tags=["queue"])


@router.get("")
def get_queue(
    min_risk: Optional[float] = Query(None, description="Minimum risk score filter"),
    area: Optional[str] = Query(None, description="Filter by area"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    connection_type: Optional[str] = Query(None, description="Filter by connection type"),
):
    """
    Return the investigation queue sorted by risk score descending.
    Includes only non-Low risk consumers by default, with optional filters.
    """
    analyzed = get_all_analyzed()

    items = []
    for cid, a in analyzed.items():
        # Default: include all non-monitoring
        if min_risk is None and a["risk_level"] == "Low" and a["investigation_status"] == "Monitoring":
            continue

        item = {
            "consumer_id": cid,
            "name": a["consumer"]["name"],
            "area": a["consumer"]["area"],
            "connection_type": a["consumer"]["connection_type"],
            "current_units": a["consumer"]["current_reading"],
            "baseline_units": a["baseline_usage"],
            "deviation_pct": a["deviation_from_baseline_pct"],
            "risk_score": a["risk_score"],
            "risk_level": a["risk_level"],
            "primary_anomaly": (
                a["anomaly_flags"][0]["flag_type"].replace("_", " ").title()
                if a["anomaly_flags"] else "None"
            ),
            "status": a["investigation_status"],
            "monthly_bill": a["consumer"]["monthly_bill"],
            "payment_status": a["consumer"]["payment_status"],
        }

        # Apply filters
        if min_risk is not None and item["risk_score"] < min_risk:
            continue
        if area and item["area"] != area:
            continue
        if risk_level and item["risk_level"].lower() != risk_level.lower():
            continue
        if connection_type and item["connection_type"] != connection_type:
            continue

        items.append(item)

    # Sort by risk score descending
    items.sort(key=lambda x: x["risk_score"], reverse=True)

    return {"success": True, "data": items, "error": None}
