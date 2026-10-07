# WattWatch AI — API Documentation

**Base URL (development):** `http://localhost:8000`
**Base URL (production):** `https://<your-cloud-run-url>`

All endpoints return JSON. All list responses are paginated where noted.

---

## Health

### `GET /api/health`

Returns system status and dataset metadata.

**Response**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "total_consumers": 253,
  "model_status": "loaded",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## Dashboard

### `GET /api/dashboard`

Returns executive summary KPIs for the Overview page.

**Response**
```json
{
  "total_consumers": 253,
  "anomalies_detected": 52,
  "high_risk_count": 18,
  "critical_count": 9,
  "revenue_at_risk": 184500.0,
  "avg_risk_score": 24.3,
  "priority_list": [
    {
      "consumer_id": "RJ10541",
      "name": "Bharat Sharma",
      "area": "Vaishali Nagar",
      "risk_score": 100.0,
      "risk_level": "Critical",
      "primary_anomaly": "Billing inconsistency: metered 580 units but billed only 180 units"
    }
  ],
  "recent_alerts": [...],
  "monthly_trend": {
    "months": ["Aug", "Sep", ...],
    "counts": [3, 4, ...]
  },
  "risk_distribution": {
    "Low": 198, "Medium": 27, "High": 19, "Critical": 9
  }
}
```

---

## Consumers

### `GET /api/consumers`

Returns all consumer records with computed risk scores.

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `area` | string | Filter by area name |
| `risk_level` | string | Filter by risk level (`Low`, `Medium`, `High`, `Critical`) |
| `connection_type` | string | Filter by connection type |
| `limit` | int | Maximum records to return (default: 500) |
| `offset` | int | Pagination offset (default: 0) |

**Response**
```json
[
  {
    "consumer_id": "RJ10293",
    "name": "Kavya Nair",
    "area": "Malviya Nagar",
    "connection_type": "Domestic",
    "meter_number": "MTR-10293",
    "sanctioned_load": 5.0,
    "previous_reading": 8420,
    "current_reading": 8495,
    "metered_units": 75,
    "billed_units": 78,
    "monthly_bill": 624.0,
    "payment_status": "Paid",
    "risk_score": 81.2,
    "risk_level": "Critical",
    "is_anomaly": true,
    "baseline_mean": 382.0,
    "deviation_pct": -80.4,
    "peer_deviation_pct": -76.2,
    "primary_anomaly": "Sudden consumption drop: 75 units vs 382 unit baseline"
  }
]
```

---

### `GET /api/consumers/{consumer_id}`

Returns full investigation detail for a single consumer.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `consumer_id` | string | Consumer ID (e.g. `RJ10293`) |

**Response**
```json
{
  "consumer_id": "RJ10293",
  "name": "Kavya Nair",
  "area": "Malviya Nagar",
  "connection_type": "Domestic",
  "meter_number": "MTR-10293",
  "sanctioned_load": 5.0,
  "previous_reading": 8420,
  "current_reading": 8495,
  "metered_units": 75,
  "billed_units": 78,
  "monthly_bill": 624.0,
  "payment_status": "Paid",
  "risk_score": 81.2,
  "risk_level": "Critical",
  "is_anomaly": true,
  "baseline_mean": 382.0,
  "baseline_std": 28.4,
  "deviation_pct": -80.4,
  "peer_mean": 314.5,
  "peer_deviation_pct": -76.2,
  "billing_gap": 3,
  "fraud_signals": ["sudden_consumption_drop", "peer_outlier"],
  "signal_count": 2,
  "historical_monthly_usage": [395, 401, 378, 412, 366, 389, 402, 391, 408, 375, 383, 75],
  "peer_group": "Domestic_Malviya Nagar",
  "evidence": {
    "risk_score": 81.2,
    "risk_level": "Critical",
    "signals": ["sudden_consumption_drop", "peer_outlier"],
    "baseline_deviation": -80.4,
    "peer_deviation": -76.2,
    "billing_gap": 3,
    "current_units": 75,
    "baseline_mean": 382.0,
    "component_scores": {
      "isolation_forest": 78.5,
      "baseline_deviation": 80.4,
      "peer_deviation": 76.2,
      "billing_consistency": 3.0,
      "rule_flags": 60.0
    }
  },
  "investigation_summary": null,
  "recommendation": "Physical meter inspection recommended",
  "recommendation_code": "INSPECT"
}
```

---

## Investigation Queue

### `GET /api/queue`

Returns the investigation queue with optional filters.

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `risk_level` | string | Filter by risk level |
| `area` | string | Filter by area |
| `status` | string | Filter by status (`Open`, `In Review`, `Escalated`, `Monitoring`, `Closed`) |
| `sort_by` | string | Sort field: `risk_score`, `deviation_pct`, `consumer_id` |
| `order` | string | `asc` or `desc` (default: `desc`) |
| `limit` | int | Max records (default: 100) |

**Response**
```json
{
  "total": 52,
  "items": [
    {
      "consumer_id": "RJ10541",
      "name": "Bharat Sharma",
      "area": "Vaishali Nagar",
      "connection_type": "Commercial",
      "current_units": 180,
      "baseline_units": 520.0,
      "deviation_pct": -65.4,
      "risk_score": 100.0,
      "risk_level": "Critical",
      "primary_anomaly": "Billing inconsistency: metered 580 units but billed only 180",
      "status": "Open",
      "assigned_to": null
    }
  ]
}
```

---

## Analytics

### `GET /api/analytics/overview`

Returns aggregated analytics statistics.

**Response**
```json
{
  "total_consumers": 253,
  "anomalies_detected": 52,
  "high_risk_count": 18,
  "critical_count": 9,
  "revenue_at_risk": 184500.0,
  "avg_risk_score": 24.3,
  "detection_rate_pct": 20.6
}
```

---

### `GET /api/analytics/trends`

Returns 12-month anomaly trend data.

**Response**
```json
{
  "months": ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
  "anomaly_counts": [3, 4, 5, 4, 6, 7, 8, 7, 9, 8, 10, 10],
  "revenue_trend": [24600, 32800, 41000, 32800, 49200, 57400, 65600, 57400, 73800, 65600, 82000, 82000]
}
```

---

### `GET /api/areas`

Returns area-level fraud analysis.

**Response**
```json
[
  {
    "area": "Vaishali Nagar",
    "total": 28,
    "flagged_count": 8,
    "avg_risk_score": 48.6,
    "low": 20,
    "medium": 4,
    "high": 2,
    "critical": 2,
    "flagged_rate_pct": 28.6,
    "top_anomaly": "Billing mismatch"
  }
]
```

---

## Analysis

### `POST /api/analyze/{consumer_id}`

Triggers a fresh analysis pipeline run for a single consumer. Returns the updated consumer record with all evidence.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `consumer_id` | string | Consumer ID to analyze |

**Response:** Same as `GET /api/consumers/{consumer_id}`

---

## Investigation Explanation

### `POST /api/investigation/explain`

Sends structured fraud evidence to IBM Granite for a human-readable investigation narrative.

**Request Body**
```json
{
  "consumer_id": "RJ10293",
  "evidence": {
    "risk_score": 81.2,
    "risk_level": "Critical",
    "signals": ["sudden_consumption_drop", "peer_outlier"],
    "baseline_deviation": -80.4,
    "peer_deviation": -76.2,
    "billing_gap": 3,
    "current_units": 75,
    "baseline_mean": 382.0,
    "component_scores": { ... }
  },
  "question": "Why is this consumer flagged?"
}
```

**Response**
```json
{
  "consumer_id": "RJ10293",
  "explanation": "Consumer RJ10293 presents a suspicious anomaly requiring field verification...",
  "source": "granite",
  "model": "ibm/granite-13b-chat-v2",
  "generated_at": "2025-01-15T10:31:00Z"
}
```

**Notes**
- If `WATSONX_API_KEY` is not configured, `source` will be `"rule_based"` and a deterministic narrative is returned
- The `question` field is optional (defaults to a standard investigation prompt)
- Granite is instructed not to make definitive theft accusations

---

## Error Responses

All errors follow a consistent format:

```json
{
  "detail": "Consumer RJ99999 not found"
}
```

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Bad request (invalid parameters) |
| 404 | Consumer not found |
| 422 | Validation error (Pydantic) |
| 500 | Internal server error |
| 503 | IBM Granite service unavailable (falls back to rule-based) |
