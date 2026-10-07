import numpy as np
from typing import Dict, Any


class ConsumptionAgent:
    """
    Agent 2: Analyzes 12-month historical usage for a consumer.
    Establishes baseline, computes deviation, and detects trend patterns.
    """

    def analyze(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Returns consumption analysis dict including baseline, deviation, and trend.
        Uses metered units (current_reading - previous_reading) as the period consumption.
        """
        hist = [float(v) for v in record.get("historical_monthly_usage", [])]
        # Period consumption = meter difference, not the cumulative reading
        current = float(record.get("current_reading", 0)) - float(record.get("previous_reading", 0))
        current = max(current, 0.0)

        if not hist:
            return {
                "baseline_usage": current,
                "baseline_std": 0.0,
                "deviation_from_baseline": 0.0,
                "deviation_from_baseline_pct": 0.0,
                "trend": "unknown",
                "trend_slope": 0.0,
                "min_historical": current,
                "max_historical": current,
            }

        baseline = float(np.mean(hist))
        std = float(np.std(hist)) if len(hist) > 1 else 0.0
        deviation = current - baseline
        deviation_pct = (deviation / max(baseline, 1.0)) * 100.0

        # Trend: compare last 3 months to first 3 months
        trend = "stable"
        trend_slope = 0.0
        if len(hist) >= 6:
            early_avg = np.mean(hist[:3])
            recent_avg = np.mean(hist[-3:])
            trend_slope = float(recent_avg - early_avg)
            if trend_slope > early_avg * 0.1:
                trend = "increasing"
            elif trend_slope < -early_avg * 0.1:
                trend = "decreasing"

        return {
            "baseline_usage": round(baseline, 2),
            "baseline_std": round(std, 2),
            "deviation_from_baseline": round(deviation, 2),
            "deviation_from_baseline_pct": round(deviation_pct, 2),
            "trend": trend,
            "trend_slope": round(trend_slope, 2),
            "min_historical": round(float(np.min(hist)), 2),
            "max_historical": round(float(np.max(hist)), 2),
        }
