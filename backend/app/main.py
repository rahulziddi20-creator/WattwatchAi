from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.api import consumers, analytics, investigation, queue
from app.services.data_service import (
    get_all_analyzed,
    get_consumer_analysis,
    get_overview_stats,
)

app = FastAPI(
    title="WattWatch AI API",
    description="Agentic Electricity Fraud Intelligence Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prefix all routers under /api
app.include_router(consumers.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(investigation.router, prefix="/api")
app.include_router(queue.router, prefix="/api")


# ---- Root / Health ----

@app.get("/")
def root():
    return {
        "success": True,
        "data": {"name": "WattWatch AI API", "version": "1.0.0", "status": "running"},
        "error": None,
    }


@app.get("/api/health")
@app.get("/health")
def health():
    return {"success": True, "data": {"status": "ok"}, "error": None}


# ---- Dashboard summary (overview + top queue) ----

@app.get("/api/dashboard")
def dashboard():
    """Single endpoint for the executive overview page."""
    stats = get_overview_stats()
    analyzed = get_all_analyzed()

    # Top 10 by risk score
    priority_list = sorted(
        [
            {
                "consumer_id": cid,
                "name": a["consumer"]["name"],
                "area": a["consumer"]["area"],
                "connection_type": a["consumer"]["connection_type"],
                "risk_score": a["risk_score"],
                "risk_level": a["risk_level"],
                "primary_anomaly": (
                    a["anomaly_flags"][0]["flag_type"].replace("_", " ").title()
                    if a["anomaly_flags"] else "None"
                ),
                "status": a["investigation_status"],
            }
            for cid, a in analyzed.items()
            if a["risk_level"] in ("High", "Critical")
        ],
        key=lambda x: x["risk_score"],
        reverse=True,
    )[:10]

    # Risk distribution counts
    risk_distribution = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for a in analyzed.values():
        risk_distribution[a["risk_level"]] = risk_distribution.get(a["risk_level"], 0) + 1

    return {
        "success": True,
        "data": {
            "stats": stats,
            "priority_list": priority_list,
            "risk_distribution": risk_distribution,
        },
        "error": None,
    }


# ---- Investigations (alias for queue) ----

@app.get("/api/investigations")
def investigations():
    """Return flagged investigation cases sorted by risk score."""
    analyzed = get_all_analyzed()
    items = []
    for cid, a in analyzed.items():
        if a["risk_level"] == "Low":
            continue
        items.append({
            "consumer_id": cid,
            "name": a["consumer"]["name"],
            "area": a["consumer"]["area"],
            "connection_type": a["consumer"]["connection_type"],
            "current_units": max(
                float(a["consumer"]["current_reading"]) - float(a["consumer"]["previous_reading"]),
                0.0,
            ),
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
            "signals": [
                {
                    "name": e["signal"],
                    "contribution": round(e["weight"] * a["risk_score"], 1),
                    "evidence": e["interpretation"],
                }
                for e in a["evidence"]
                if e.get("weight", 0) > 0
            ],
            "recommended_action": a["recommended_action"],
        })
    items.sort(key=lambda x: x["risk_score"], reverse=True)
    return {"success": True, "data": items, "error": None}


# ---- Re-analyze a specific consumer on demand ----

@app.post("/api/analyze/{consumer_id}")
def analyze_consumer(consumer_id: str):
    """
    Trigger fresh analysis for a specific consumer and return full result.
    (Uses cached pipeline result; cache invalidation can be added later.)
    """
    analysis = get_consumer_analysis(consumer_id)
    if not analysis:
        raise HTTPException(status_code=404, detail=f"Consumer {consumer_id} not found")

    safe = {k: v for k, v in analysis.items() if k not in ("ml_result", "validation_issues")}

    # Reshape signals in the expected format
    signals = [
        {
            "name": e["signal"],
            "contribution": round(e["weight"] * analysis["risk_score"], 1),
            "evidence": e["interpretation"],
        }
        for e in analysis.get("evidence", [])
        if e.get("weight", 0) > 0
    ]

    return {
        "success": True,
        "data": {
            **safe,
            "signals": signals,
        },
        "error": None,
    }
