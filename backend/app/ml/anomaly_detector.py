import numpy as np
from typing import List, Dict, Any
from sklearn.ensemble import IsolationForest


class AnomalyDetector:
    """
    Isolation Forest-based anomaly detector for electricity consumption data.

    Features used:
        - current_reading: raw meter reading this period
        - deviation_from_mean: how far current is from personal 12-month mean
        - deviation_from_peer: how far current is from peer group mean
        - billing_consistency_ratio: |billed_units - (current - previous)| / max(billed, 1)
    """

    def __init__(self, contamination: float = 0.1, random_state: int = 42):
        self.contamination = contamination
        self.random_state = random_state
        self.model = IsolationForest(
            n_estimators=200,
            contamination=contamination,
            random_state=random_state,
        )
        self._fitted = False

    def _build_feature_matrix(self, records: List[Dict[str, Any]]) -> np.ndarray:
        rows = []
        for r in records:
            hist = r.get("historical_monthly_usage", [])
            hist_mean = float(np.mean(hist)) if hist else 0.0
            hist_std = float(np.std(hist)) if len(hist) > 1 else 1.0

            # Use metered units (period consumption), not cumulative reading
            metered_units = max(
                float(r.get("current_reading", 0)) - float(r.get("previous_reading", 0)),
                0.0,
            )
            billed = float(r.get("billed_units", 0))
            peer_avg = float(r.get("_peer_avg", hist_mean))

            dev_from_mean = (metered_units - hist_mean) / max(hist_std, 1.0)
            dev_from_peer = (metered_units - peer_avg) / max(peer_avg, 1.0) * 100.0

            billing_ratio = abs(billed - metered_units) / max(abs(billed), 1.0)
            billing_ratio = min(billing_ratio, 1.0)

            rows.append([
                metered_units,
                dev_from_mean,
                dev_from_peer,
                billing_ratio,
            ])
        return np.array(rows, dtype=float)

    def fit_predict(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Fit the model on all records and return anomaly results for each.
        Returns list of dicts with: anomaly_score (0-1), is_anomaly (bool), anomaly_type (str).
        """
        if not records:
            return []

        X = self._build_feature_matrix(records)
        self.model.fit(X)
        self._fitted = True

        # sklearn: -1 = anomaly, 1 = normal
        labels = self.model.predict(X)
        # decision_function: more negative = more anomalous
        raw_scores = self.model.decision_function(X)

        # Normalize raw_scores to 0-1 (1 = most anomalous)
        min_s, max_s = raw_scores.min(), raw_scores.max()
        range_s = max_s - min_s if max_s != min_s else 1.0
        normalized = 1.0 - (raw_scores - min_s) / range_s

        results = []
        for i, record in enumerate(records):
            is_anomaly = labels[i] == -1
            score = float(normalized[i])

            # Classify anomaly type from features
            anomaly_type = _classify_anomaly_type(record, X[i])

            results.append({
                "anomaly_score": round(score, 4),
                "is_anomaly": is_anomaly,
                "anomaly_type": anomaly_type,
            })

        return results


def _classify_anomaly_type(record: Dict[str, Any], features: np.ndarray) -> str:
    """Heuristic anomaly type classification based on dominant feature."""
    current, dev_mean, dev_peer, billing_ratio = features

    if billing_ratio > 0.3:
        return "Billing Inconsistency"
    elif dev_mean < -1.5:
        return "Sudden Consumption Drop"
    elif dev_mean > 2.0:
        return "Abnormal Consumption Spike"
    elif abs(dev_peer) > 50:
        return "Peer Group Deviation"
    elif billing_ratio > 0.15:
        return "Meter Reading Discrepancy"
    else:
        return "Statistical Anomaly"
