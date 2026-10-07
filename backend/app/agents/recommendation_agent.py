from typing import Dict, Any, List


ACTION_MAP = {
    "Critical": "Immediate Field Inspection — Priority P1. Dispatch technician within 24 hours to verify meter integrity and check for tampering or bypass.",
    "High": "Scheduled Field Inspection — Priority P2. Assign to investigation queue for site visit within 7 days. Review meter and connection.",
    "Medium": "Administrative Review — Priority P3. Cross-check billing records, contact consumer for explanation. Escalate if unresolved.",
    "Low": "Monitoring — No immediate action required. Continue automated monitoring for subsequent billing cycles.",
}


class RecommendationAgent:
    """
    Agent 6: Maps risk score and evidence to a recommended investigative action.
    """

    def recommend(
        self,
        risk_level: str,
        risk_score: float,
        anomaly_flags: List[Dict[str, Any]],
        record: Dict[str, Any],
    ) -> str:
        """
        Returns a recommended action string based on risk level and evidence.
        """
        base_action = ACTION_MAP.get(risk_level, ACTION_MAP["Low"])

        # Supplement with specific flag context
        flag_types = [f.get("flag_type", "") for f in anomaly_flags]
        additional_notes = []

        if "billing_mismatch" in flag_types:
            additional_notes.append("Request billing reconciliation from accounts department.")

        if "near_zero_consumption" in flag_types:
            additional_notes.append("Verify meter is functional and not bypassed.")

        if "sudden_consumption_drop" in flag_types:
            additional_notes.append("Compare current meter seal with installation records.")

        if "repeated_low_usage" in flag_types:
            additional_notes.append("Review 12-month billing history for systematic underreporting.")

        if record.get("payment_status") == "Defaulter":
            additional_notes.append("Coordinate with billing department regarding outstanding dues.")

        if additional_notes:
            return base_action + " Additional steps: " + " ".join(additional_notes)

        return base_action
