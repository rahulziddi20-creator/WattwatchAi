from typing import Optional, List
from pydantic import BaseModel


class AnomalyFlag(BaseModel):
    flag_type: str
    description: str
    severity: str  # low | medium | high | critical


class Evidence(BaseModel):
    signal: str
    value: str
    weight: float
    interpretation: str


class ConsumerBase(BaseModel):
    consumer_id: str
    name: str
    area: str
    connection_type: str
    sanctioned_load: float
    meter_number: str
    previous_reading: float
    current_reading: float
    billed_units: float
    monthly_bill: float
    payment_status: str
    historical_monthly_usage: List[float]
    peer_group: str
    anomaly_flags: List[str]


class Consumer(ConsumerBase):
    pass


class RiskBreakdown(BaseModel):
    isolation_forest_score: float
    baseline_deviation_score: float
    peer_deviation_score: float
    billing_consistency_score: float
    rule_flag_score: float
    total_risk_score: float
    risk_level: str


class ConsumerAnalysis(BaseModel):
    consumer: Consumer
    risk_score: float
    risk_level: str
    risk_breakdown: RiskBreakdown
    anomaly_flags: List[AnomalyFlag]
    evidence: List[Evidence]
    baseline_usage: float
    peer_avg_usage: float
    deviation_from_baseline_pct: float
    deviation_from_peer_pct: float
    billing_consistency_ratio: float
    recommended_action: str
    ai_summary: Optional[str] = None
    investigation_status: str = "Open"


class OverviewStats(BaseModel):
    total_consumers: int
    anomalies_detected: int
    high_risk_count: int
    critical_count: int
    revenue_at_risk: float


class QueueItem(BaseModel):
    consumer_id: str
    name: str
    area: str
    connection_type: str
    current_units: float
    baseline_units: float
    deviation_pct: float
    risk_score: float
    risk_level: str
    primary_anomaly: str
    status: str
