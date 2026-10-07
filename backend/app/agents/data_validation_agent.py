from typing import Dict, Any, List, Tuple


REQUIRED_FIELDS = [
    "consumer_id", "name", "area", "connection_type",
    "sanctioned_load", "meter_number", "previous_reading",
    "current_reading", "billed_units", "monthly_bill",
    "payment_status", "historical_monthly_usage", "peer_group",
]

VALID_CONNECTION_TYPES = {"Residential", "Commercial", "Industrial"}
VALID_AREAS = {"Rajouri", "Udhampur", "Reasi", "Ramban", "Bhaderwah", "Doda", "Kishtwar", "Batote"}
VALID_PAYMENT_STATUSES = {"Paid", "Unpaid", "Partial", "Defaulter"}


class DataValidationAgent:
    """
    Agent 1: Validates consumer record completeness and integrity.
    Flags missing fields, invalid types, out-of-range values.
    """

    def validate(self, record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Returns (is_valid, list_of_issues).
        is_valid = False only if critical fields are missing.
        """
        issues = []

        # Check required fields
        for field in REQUIRED_FIELDS:
            if field not in record or record[field] is None:
                issues.append(f"Missing required field: {field}")

        if issues:
            return False, issues

        # Validate connection type
        if record["connection_type"] not in VALID_CONNECTION_TYPES:
            issues.append(f"Invalid connection_type: {record['connection_type']}")

        # Validate area
        if record["area"] not in VALID_AREAS:
            issues.append(f"Unrecognized area: {record['area']}")

        # Validate payment status
        if record["payment_status"] not in VALID_PAYMENT_STATUSES:
            issues.append(f"Invalid payment_status: {record['payment_status']}")

        # Validate numeric ranges
        if float(record["current_reading"]) < 0:
            issues.append("current_reading is negative")

        if float(record["previous_reading"]) < 0:
            issues.append("previous_reading is negative")

        if float(record["billed_units"]) < 0:
            issues.append("billed_units is negative")

        if float(record["sanctioned_load"]) <= 0:
            issues.append("sanctioned_load must be positive")

        # Validate historical data
        hist = record.get("historical_monthly_usage", [])
        if not isinstance(hist, list) or len(hist) < 6:
            issues.append(f"historical_monthly_usage should have at least 6 entries, got {len(hist)}")
        else:
            for v in hist:
                if float(v) < 0:
                    issues.append("historical_monthly_usage contains negative value")
                    break

        return len(issues) == 0, issues
