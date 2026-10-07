import numpy as np
from typing import Dict, Any, List


# Rule-based fraud detection thresholds
RULES = {
    "sudden_drop_threshold_pct": -50.0,       # >50% drop from baseline
    "sudden_spike_threshold_pct": 100.0,      # >100% spike from baseline
    "billing_mismatch_threshold": 0.20,       # >20% mismatch
    "zero_consumption_min_load": 1.0,         # kW: zero usage with >1kW sanctioned load
    "repeated_minimum_bills": 3,              # how many months near-zero to flag
    "peer_deviation_threshold_pct": 60.0,     # >60% below peer average
}


class FraudDetectionAgent:
    """
    Agent 3: Applies rule-based fraud detection and Isolation Forest results
    to produce anomaly flags and a preliminary risk assessment.
    """

    def detect(
        self,
        record: Dict[str, Any],
        consumption_analysis: Dict[str, Any],
        ml_result: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Returns: {
            anomaly_flags: List[dict],
            rule_flag_count: int,
            billing_consistency_ratio: float,
        }
        """
        flags = []
        current = float(record.get("current_reading", 0))
        previous = float(record.get("previous_reading", 0))
        billed = float(record.get("billed_units", 0))
        sanctioned = float(record.get("sanctioned_load", 0))
        hist = [float(v) for v in record.get("historical_monthly_usage", [])]
        dev_pct = consumption_analysis.get("deviation_from_baseline_pct", 0.0)

        # Metered units from readings
        metered_units = current - previous

        # Billing consistency
        billing_ratio = abs(billed - metered_units) / max(abs(billed), 1.0)
        billing_ratio = min(billing_ratio, 1.0)

        # Rule 1: Sudden consumption drop
        if dev_pct <= RULES["sudden_drop_threshold_pct"]:
            flags.append({
                "flag_type": "sudden_consumption_drop",
                "description": f"Consumption dropped {abs(dev_pct):.1f}% below personal baseline — possible meter tampering or bypass.",
                "severity": "high" if dev_pct > -75 else "critical",
            })

        # Rule 2: Sudden spike
        if dev_pct >= RULES["sudden_spike_threshold_pct"]:
            flags.append({
                "flag_type": "consumption_spike",
                "description": f"Consumption spiked {dev_pct:.1f}% above personal baseline.",
                "severity": "medium",
            })

        # Rule 3: Billing mismatch
        if billing_ratio > RULES["billing_mismatch_threshold"]:
            flags.append({
                "flag_type": "billing_mismatch",
                "description": f"Billed units ({billed}) differ from metered units ({metered_units:.0f}) by {billing_ratio*100:.1f}%.",
                "severity": "high" if billing_ratio > 0.4 else "medium",
            })

        # Rule 4: Zero or near-zero usage with load present
        if current < 10 and sanctioned >= RULES["zero_consumption_min_load"]:
            flags.append({
                "flag_type": "near_zero_consumption",
                "description": f"Near-zero current reading ({current} units) despite {sanctioned} kW sanctioned load.",
                "severity": "critical",
            })

        # Rule 5: Several months of suspiciously low usage in history
        if hist:
            hist_mean = float(np.mean(hist))
            low_months = sum(1 for v in hist if v < hist_mean * 0.3)
            if low_months >= RULES["repeated_minimum_bills"]:
                flags.append({
                    "flag_type": "repeated_low_usage",
                    "description": f"{low_months} months of unusually low usage detected in 12-month history.",
                    "severity": "medium",
                })

        # Rule 6: ML model flagged as anomaly with high score
        if ml_result.get("is_anomaly") and ml_result.get("anomaly_score", 0) > 0.7:
            flags.append({
                "flag_type": "ml_anomaly",
                "description": f"Isolation Forest anomaly score: {ml_result['anomaly_score']:.3f} — statistical outlier.",
                "severity": "high",
            })

        # Supplement with existing anomaly_flags from dataset
        existing_flags = record.get("anomaly_flags", [])
        for ef in existing_flags:
            if ef and not any(f["flag_type"] == ef for f in flags):
                flags.append({
                    "flag_type": ef,
                    "description": f"Pre-flagged indicator: {ef.replace('_', ' ').title()}",
                    "severity": "medium",
                })

        return {
            "anomaly_flags": flags,
            "rule_flag_count": len(flags),
            "billing_consistency_ratio": round(billing_ratio, 4),
        }
