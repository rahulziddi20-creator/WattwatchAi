from typing import Dict, Any


# Risk score weights — must sum to 1.0
WEIGHTS = {
    "isolation_forest": 0.30,
    "baseline_deviation": 0.25,
    "peer_deviation": 0.20,
    "billing_consistency": 0.15,
    "rule_flags": 0.10,
}

RISK_THRESHOLDS = {
    "low": (0, 30),
    "medium": (30, 60),
    "high": (60, 80),
    "critical": (80, 101),
}


def get_risk_level(score: float) -> str:
    """Map a 0-100 risk score to a label."""
    if score < 30:
        return "Low"
    elif score < 60:
        return "Medium"
    elif score < 80:
        return "High"
    else:
        return "Critical"


def normalize_deviation(deviation_pct: float, max_deviation: float = 100.0) -> float:
    """
    Normalize an absolute percentage deviation to 0-100 scale.
    max_deviation = 100 means a ±100% deviation scores 100 points.
    Values beyond max are clamped to 100.
    """
    clamped = min(abs(deviation_pct), max_deviation)
    return (clamped / max_deviation) * 100.0


def calculate_risk_score(
    isolation_forest_raw: float,         # 0-1, where 1 = most anomalous
    deviation_from_baseline_pct: float,  # percentage (can be negative = drop)
    deviation_from_peer_pct: float,      # percentage
    billing_consistency_ratio: float,    # 0-1, where 0 = perfect, 1 = worst
    rule_flag_count: int,                # number of rule-based flags triggered
    max_flags: int = 5,
) -> Dict[str, Any]:
    """
    Compute transparent weighted fraud risk score (0-100).

    Scoring logic:
      - Each component is normalized to 0-100.
      - Weighted sum produces the raw total.
      - A severity bonus of up to +15 points is added when multiple severe
        signals coincide (e.g. large consumption drop AND high IF score).
      - Final score is clamped to [0, 100].
    """
    # Component 1: Isolation Forest (0-100)
    if_score = isolation_forest_raw * 100.0

    # Component 2: Deviation from personal baseline (0-100)
    # Drop of 50% → 50 pts; drop of 80% → 80 pts; drop of 100%+ → 100 pts
    baseline_score = normalize_deviation(deviation_from_baseline_pct, max_deviation=100.0)

    # Component 3: Deviation from peer group average (0-100)
    peer_score = normalize_deviation(deviation_from_peer_pct, max_deviation=100.0)

    # Component 4: Billing consistency (0-100)
    billing_score = min(billing_consistency_ratio * 100.0, 100.0)

    # Component 5: Rule-based flags (0-100)
    flag_score = min((rule_flag_count / max(max_flags, 1)) * 100.0, 100.0)

    # Weighted base total
    base_total = (
        if_score * WEIGHTS["isolation_forest"]
        + baseline_score * WEIGHTS["baseline_deviation"]
        + peer_score * WEIGHTS["peer_deviation"]
        + billing_score * WEIGHTS["billing_consistency"]
        + flag_score * WEIGHTS["rule_flags"]
    )

    # Severity bonus: large multi-signal cases get pushed toward Critical
    # Triggered when IF score is high AND baseline drop is severe AND peer deviation is severe
    severity_bonus = 0.0
    if if_score >= 70 and baseline_score >= 70 and peer_score >= 60:
        # Both consumption drop and ML model agree — strong corroboration
        severity_bonus = min((if_score + baseline_score + peer_score) / 3 * 0.20, 15.0)
    elif billing_score >= 80 and if_score >= 80:
        # Critical billing mismatch confirmed by ML
        severity_bonus = min(billing_score * 0.15, 12.0)

    total = round(min(max(base_total + severity_bonus, 0.0), 100.0), 2)

    return {
        "isolation_forest_score": round(if_score, 2),
        "baseline_deviation_score": round(baseline_score, 2),
        "peer_deviation_score": round(peer_score, 2),
        "billing_consistency_score": round(billing_score, 2),
        "rule_flag_score": round(flag_score, 2),
        "total_risk_score": total,
        "risk_level": get_risk_level(total),
    }
