import numpy as np
from typing import Dict, Any, List


class PeerComparisonAgent:
    """
    Agent 4: Compares a consumer's usage against their peer group (same area + connection type).
    Produces peer deviation metrics.
    """

    def compare(
        self,
        record: Dict[str, Any],
        all_records: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Returns peer comparison analysis including peer average, deviation, and percentile rank.
        """
        peer_group = record.get("peer_group", "")
        area = record.get("area", "")
        connection_type = record.get("connection_type", "")
        # Use metered units (period consumption) for comparison, not cumulative reading
        current = max(
            float(record.get("current_reading", 0)) - float(record.get("previous_reading", 0)),
            0.0,
        )

        # Build peer group: same area + connection_type, excluding self
        peers = [
            r for r in all_records
            if r["consumer_id"] != record["consumer_id"]
            and r["area"] == area
            and r["connection_type"] == connection_type
        ]

        if not peers:
            # Fall back to same connection type only
            peers = [
                r for r in all_records
                if r["consumer_id"] != record["consumer_id"]
                and r["connection_type"] == connection_type
            ]

        if not peers:
            return {
                "peer_count": 0,
                "peer_avg_usage": current,
                "peer_std_usage": 0.0,
                "deviation_from_peer": 0.0,
                "deviation_from_peer_pct": 0.0,
                "peer_percentile": 50.0,
                "peer_group_label": peer_group,
            }

        # Peer metered units
        peer_currents = [
            max(float(r["current_reading"]) - float(r["previous_reading"]), 0.0)
            for r in peers
        ]
        peer_avg = float(np.mean(peer_currents))
        peer_std = float(np.std(peer_currents)) if len(peer_currents) > 1 else 1.0

        deviation = current - peer_avg
        deviation_pct = (deviation / max(peer_avg, 1.0)) * 100.0

        # Percentile rank within peer group (including self)
        all_in_group = peer_currents + [current]
        percentile = float(
            sum(1 for v in all_in_group if v <= current) / len(all_in_group) * 100.0
        )

        return {
            "peer_count": len(peers),
            "peer_avg_usage": round(peer_avg, 2),
            "peer_std_usage": round(peer_std, 2),
            "deviation_from_peer": round(deviation, 2),
            "deviation_from_peer_pct": round(deviation_pct, 2),
            "peer_percentile": round(percentile, 1),
            "peer_group_label": peer_group,
        }
