from typing import Dict, Any, List


class EvidenceAgent:
    """
    Agent 5: Builds a structured, human-readable evidence list from all signal sources.
    Each evidence item includes signal name, observed value, weight, and interpretation.
    """

    def build(
        self,
        record: Dict[str, Any],
        consumption_analysis: Dict[str, Any],
        peer_analysis: Dict[str, Any],
        fraud_result: Dict[str, Any],
        ml_result: Dict[str, Any],
        risk_breakdown: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        Returns a list of Evidence dicts.
        """
        evidence = []

        # 1. Isolation Forest Score
        if_score = ml_result.get("anomaly_score", 0.0)
        evidence.append({
            "signal": "Isolation Forest Anomaly Score",
            "value": f"{if_score:.3f} / 1.0",
            "weight": 0.30,
            "interpretation": (
                "High statistical anomaly detected by ML model."
                if if_score > 0.6
                else "Within normal statistical range." if if_score < 0.4
                else "Borderline anomaly — warrants attention."
            ),
        })

        # 2. Deviation from personal baseline
        dev_pct = consumption_analysis.get("deviation_from_baseline_pct", 0.0)
        baseline = consumption_analysis.get("baseline_usage", 0.0)
        # Metered units this period
        current = max(
            float(record.get("current_reading", 0)) - float(record.get("previous_reading", 0)),
            0.0,
        )
        evidence.append({
            "signal": "Deviation from Personal Baseline",
            "value": f"{dev_pct:+.1f}% (baseline: {baseline:.0f} units, current: {current:.0f} units)",
            "weight": 0.25,
            "interpretation": (
                f"Consumption is {abs(dev_pct):.1f}% {'below' if dev_pct < 0 else 'above'} personal baseline of {baseline:.0f} units. "
                + ("Significant downward deviation — possible meter interference." if dev_pct < -40
                   else "Significant upward deviation — possible unauthorized load." if dev_pct > 80
                   else "Moderate deviation." if abs(dev_pct) > 20
                   else "Within normal range.")
            ),
        })

        # 3. Peer group comparison
        peer_dev_pct = peer_analysis.get("deviation_from_peer_pct", 0.0)
        peer_avg = peer_analysis.get("peer_avg_usage", 0.0)
        peer_count = peer_analysis.get("peer_count", 0)
        evidence.append({
            "signal": "Peer Group Comparison",
            "value": f"{peer_dev_pct:+.1f}% vs peer avg ({peer_avg:.0f} units, n={peer_count})",
            "weight": 0.20,
            "interpretation": (
                f"Consumer uses {abs(peer_dev_pct):.1f}% {'less' if peer_dev_pct < 0 else 'more'} than peer group average. "
                + ("Unusually low — consistent with diversion or bypass." if peer_dev_pct < -50
                   else "Unusually high — may indicate unauthorized connections." if peer_dev_pct > 80
                   else "Within acceptable peer variance.")
            ),
        })

        # 4. Billing consistency
        billing_ratio = fraud_result.get("billing_consistency_ratio", 0.0)
        billed = float(record.get("billed_units", 0))
        previous = float(record.get("previous_reading", 0))
        metered = current - previous
        evidence.append({
            "signal": "Billing Consistency Check",
            "value": f"Billed: {billed:.0f} units, Metered: {metered:.0f} units ({billing_ratio*100:.1f}% discrepancy)",
            "weight": 0.15,
            "interpretation": (
                "Critical billing discrepancy — billed units do not match meter readings." if billing_ratio > 0.35
                else "Significant mismatch between billed and metered consumption." if billing_ratio > 0.20
                else "Minor discrepancy within acceptable tolerance." if billing_ratio > 0.05
                else "Billing is consistent with meter readings."
            ),
        })

        # 5. Rule-based flags
        flag_count = fraud_result.get("rule_flag_count", 0)
        flag_types = [f.get("flag_type", "") for f in fraud_result.get("anomaly_flags", [])]
        evidence.append({
            "signal": "Rule-Based Anomaly Flags",
            "value": f"{flag_count} flag(s): {', '.join(flag_types[:3]) if flag_types else 'None'}",
            "weight": 0.10,
            "interpretation": (
                f"{flag_count} suspicious indicator(s) detected by rule engine." if flag_count > 0
                else "No rule-based flags triggered."
            ),
        })

        # 6. Payment status
        payment_status = record.get("payment_status", "Unknown")
        evidence.append({
            "signal": "Payment History",
            "value": payment_status,
            "weight": 0.0,
            "interpretation": (
                "Defaulter — non-payment may be linked to intentional avoidance." if payment_status == "Defaulter"
                else "Partial payment — possible financial dispute or avoidance." if payment_status == "Partial"
                else "Unpaid this period." if payment_status == "Unpaid"
                else "Payment up to date."
            ),
        })

        return evidence
