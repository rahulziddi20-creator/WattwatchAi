from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from app.services.data_service import get_all_analyzed, get_consumer_analysis

router = APIRouter(prefix="/consumers", tags=["consumers"])


@router.get("")
def list_consumers():
    """Return all consumers with their risk summary."""
    analyzed = get_all_analyzed()
    data = []
    for cid, a in analyzed.items():
        data.append({
            "consumer_id": cid,
            "name": a["consumer"]["name"],
            "area": a["consumer"]["area"],
            "connection_type": a["consumer"]["connection_type"],
            "meter_number": a["consumer"]["meter_number"],
            "current_reading": a["consumer"]["current_reading"],
            "billed_units": a["consumer"]["billed_units"],
            "monthly_bill": a["consumer"]["monthly_bill"],
            "payment_status": a["consumer"]["payment_status"],
            "risk_score": a["risk_score"],
            "risk_level": a["risk_level"],
            "investigation_status": a["investigation_status"],
            "primary_anomaly": (
                a["anomaly_flags"][0]["flag_type"] if a["anomaly_flags"] else "none"
            ),
        })
    return {"success": True, "data": data, "error": None}


@router.get("/{consumer_id}")
def get_consumer(consumer_id: str):
    """Return full analysis for a specific consumer."""
    analysis = get_consumer_analysis(consumer_id)
    if not analysis:
        raise HTTPException(status_code=404, detail=f"Consumer {consumer_id} not found")
    # Remove internal ML metadata
    safe = {k: v for k, v in analysis.items() if k not in ("ml_result", "validation_issues")}
    return {"success": True, "data": safe, "error": None}


@router.get("/{consumer_id}/analysis")
def get_consumer_analysis_endpoint(consumer_id: str):
    """Return the full analysis object for a consumer."""
    analysis = get_consumer_analysis(consumer_id)
    if not analysis:
        raise HTTPException(status_code=404, detail=f"Consumer {consumer_id} not found")
    safe = {k: v for k, v in analysis.items() if k not in ("ml_result", "validation_issues")}
    return {"success": True, "data": safe, "error": None}
