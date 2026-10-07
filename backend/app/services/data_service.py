import json
import os
import numpy as np
from typing import List, Dict, Any, Optional
from functools import lru_cache

from app.agents.data_validation_agent import DataValidationAgent
from app.agents.consumption_agent import ConsumptionAgent
from app.agents.fraud_detection_agent import FraudDetectionAgent
from app.agents.peer_comparison_agent import PeerComparisonAgent
from app.agents.evidence_agent import EvidenceAgent
from app.agents.recommendation_agent import RecommendationAgent
from app.ml.anomaly_detector import AnomalyDetector
from app.utils.scoring import calculate_risk_score

DATA_PATH = os.path.join(os.path.dirname(__file__), "../../data/consumers.json")

_validation_agent = DataValidationAgent()
_consumption_agent = ConsumptionAgent()
_fraud_agent = FraudDetectionAgent()
_peer_agent = PeerComparisonAgent()
_evidence_agent = EvidenceAgent()
_recommendation_agent = RecommendationAgent()
_detector = AnomalyDetector(contamination=0.10)

_raw_records: Optional[List[Dict[str, Any]]] = None
_analyzed_cache: Optional[Dict[str, Dict[str, Any]]] = None


def _load_raw() -> List[Dict[str, Any]]:
    global _raw_records
    if _raw_records is None:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            _raw_records = json.load(f)
    return _raw_records


def _compute_peer_averages(records: List[Dict[str, Any]]) -> None:
    """Pre-compute peer group metered-unit averages; attach as _peer_avg for ML feature building."""
    from collections import defaultdict
    groups: Dict[str, List[float]] = defaultdict(list)
    for r in records:
        key = f"{r['area']}:{r['connection_type']}"
        metered = max(float(r["current_reading"]) - float(r["previous_reading"]), 0.0)
        groups[key].append(metered)
    for r in records:
        key = f"{r['area']}:{r['connection_type']}"
        vals = groups[key]
        r["_peer_avg"] = float(np.mean(vals)) if vals else 0.0


def _run_pipeline(records: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Run the full 6-agent pipeline on all records. Returns dict keyed by consumer_id."""
    global _analyzed_cache
    if _analyzed_cache is not None:
        return _analyzed_cache

    _compute_peer_averages(records)

    # Run ML model on all records at once
    ml_results = _detector.fit_predict(records)

    analyzed: Dict[str, Dict[str, Any]] = {}

    for i, record in enumerate(records):
        cid = record["consumer_id"]
        ml_result = ml_results[i]

        # Agent 1: Validate
        is_valid, issues = _validation_agent.validate(record)

        # Agent 2: Consumption analysis
        consumption = _consumption_agent.analyze(record)

        # Agent 3: Fraud detection
        fraud = _fraud_agent.detect(record, consumption, ml_result)

        # Agent 4: Peer comparison
        peer = _peer_agent.compare(record, records)

        # Risk score
        risk_breakdown = calculate_risk_score(
            isolation_forest_raw=ml_result["anomaly_score"],
            deviation_from_baseline_pct=consumption["deviation_from_baseline_pct"],
            deviation_from_peer_pct=peer["deviation_from_peer_pct"],
            billing_consistency_ratio=fraud["billing_consistency_ratio"],
            rule_flag_count=fraud["rule_flag_count"],
        )

        # Agent 5: Evidence
        evidence = _evidence_agent.build(
            record=record,
            consumption_analysis=consumption,
            peer_analysis=peer,
            fraud_result=fraud,
            ml_result=ml_result,
            risk_breakdown=risk_breakdown,
        )

        # Agent 6: Recommendation
        recommendation = _recommendation_agent.recommend(
            risk_level=risk_breakdown["risk_level"],
            risk_score=risk_breakdown["total_risk_score"],
            anomaly_flags=fraud["anomaly_flags"],
            record=record,
        )

        analyzed[cid] = {
            "consumer": {k: v for k, v in record.items() if not k.startswith("_")},
            "risk_score": risk_breakdown["total_risk_score"],
            "risk_level": risk_breakdown["risk_level"],
            "risk_breakdown": risk_breakdown,
            "anomaly_flags": fraud["anomaly_flags"],
            "evidence": evidence,
            "baseline_usage": consumption["baseline_usage"],
            "peer_avg_usage": peer["peer_avg_usage"],
            "deviation_from_baseline_pct": consumption["deviation_from_baseline_pct"],
            "deviation_from_peer_pct": peer["deviation_from_peer_pct"],
            "billing_consistency_ratio": fraud["billing_consistency_ratio"],
            "recommended_action": recommendation,
            "investigation_status": _determine_status(record, risk_breakdown["risk_level"]),
            "ml_result": ml_result,
            "validation_issues": issues,
        }

    _analyzed_cache = analyzed
    return analyzed


def _determine_status(record: Dict[str, Any], risk_level: str) -> str:
    """Assign initial investigation status based on risk level."""
    if risk_level == "Critical":
        return "Open"
    elif risk_level == "High":
        return "Open"
    elif risk_level == "Medium":
        return "Open"
    return "Monitoring"


def get_all_analyzed() -> Dict[str, Dict[str, Any]]:
    records = _load_raw()
    return _run_pipeline(records)


def get_consumer_analysis(consumer_id: str) -> Optional[Dict[str, Any]]:
    analyzed = get_all_analyzed()
    return analyzed.get(consumer_id)


def get_overview_stats() -> Dict[str, Any]:
    analyzed = get_all_analyzed()
    total = len(analyzed)
    anomalies = sum(1 for a in analyzed.values() if a["risk_level"] != "Low")
    high_risk = sum(1 for a in analyzed.values() if a["risk_level"] == "High")
    critical = sum(1 for a in analyzed.values() if a["risk_level"] == "Critical")

    # Revenue at risk: sum of monthly_bill for High + Critical consumers
    revenue_at_risk = sum(
        float(a["consumer"].get("monthly_bill", 0))
        for a in analyzed.values()
        if a["risk_level"] in ("High", "Critical")
    )

    return {
        "total_consumers": total,
        "anomalies_detected": anomalies,
        "high_risk_count": high_risk,
        "critical_count": critical,
        "revenue_at_risk": round(revenue_at_risk, 2),
    }


def get_analytics_trends() -> Dict[str, Any]:
    """Aggregate monthly anomaly trends across all consumers."""
    analyzed = get_all_analyzed()
    records = _load_raw()

    # Months index 0..11
    monthly_anomaly_counts = [0] * 12
    monthly_total_counts = [0] * 12
    monthly_usage_sums = [0.0] * 12

    for record in records:
        hist = record.get("historical_monthly_usage", [])
        cid = record["consumer_id"]
        analysis = analyzed.get(cid, {})
        baseline = analysis.get("baseline_usage", 1.0)
        for idx, usage in enumerate(hist[:12]):
            monthly_total_counts[idx] += 1
            monthly_usage_sums[idx] += float(usage)
            if baseline > 0 and abs(float(usage) - baseline) / baseline > 0.4:
                monthly_anomaly_counts[idx] += 1

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    return {
        "months": months,
        "anomaly_counts": monthly_anomaly_counts,
        "total_counts": monthly_total_counts,
        "avg_usage": [
            round(monthly_usage_sums[i] / max(monthly_total_counts[i], 1), 2)
            for i in range(12)
        ],
    }


def get_area_stats() -> List[Dict[str, Any]]:
    analyzed = get_all_analyzed()
    from collections import defaultdict
    area_map = defaultdict(lambda: {"total": 0, "flagged": 0, "risk_sum": 0.0,
                                    "critical": 0, "high": 0, "medium": 0, "low": 0})
    for a in analyzed.values():
        area = a["consumer"]["area"]
        area_map[area]["total"] += 1
        area_map[area]["risk_sum"] += a["risk_score"]
        level = a["risk_level"].lower()
        area_map[area][level] += 1
        if a["risk_level"] != "Low":
            area_map[area]["flagged"] += 1

    result = []
    for area, stats in area_map.items():
        avg_risk = stats["risk_sum"] / max(stats["total"], 1)
        result.append({
            "area": area,
            "total_consumers": stats["total"],
            "flagged_count": stats["flagged"],
            "avg_risk_score": round(avg_risk, 2),
            "critical": stats["critical"],
            "high": stats["high"],
            "medium": stats["medium"],
            "low": stats["low"],
        })

    result.sort(key=lambda x: x["avg_risk_score"], reverse=True)
    return result
