from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.data_service import get_consumer_analysis
from app.agents.granite_agent import GraniteAgent

router = APIRouter(prefix="/investigation", tags=["investigation"])

_granite = GraniteAgent()


class ExplainRequest(BaseModel):
    consumer_id: str


@router.post("/explain")
def explain(request: ExplainRequest):
    """
    Generate an AI investigation summary for the given consumer using IBM Granite.
    Falls back to rule-based summary if credentials are not configured.
    """
    analysis = get_consumer_analysis(request.consumer_id)
    if not analysis:
        raise HTTPException(status_code=404, detail=f"Consumer {request.consumer_id} not found")

    summary = _granite.generate_summary(
        record=analysis["consumer"],
        risk_score=analysis["risk_score"],
        risk_level=analysis["risk_level"],
        evidence=analysis["evidence"],
        recommended_action=analysis["recommended_action"],
    )

    return {
        "success": True,
        "data": {
            "consumer_id": request.consumer_id,
            "summary": summary,
            "risk_score": analysis["risk_score"],
            "risk_level": analysis["risk_level"],
        },
        "error": None,
    }
