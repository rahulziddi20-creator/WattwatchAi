# WattWatch AI — Model Methodology

## Overview

WattWatch AI uses an ensemble of three independent detection approaches to compute a fraud-risk score for each electricity consumer. No single method is used in isolation. All three contribute weighted components to a final 0–100 score.

---

## 1. Isolation Forest (Unsupervised ML)

**Weight in final score: 30%**

Isolation Forest is an unsupervised anomaly detection algorithm that works by randomly partitioning the feature space. Anomalous data points require fewer partitions to isolate — resulting in shorter path lengths and higher anomaly scores.

### Features Used

| Feature | Description |
|---------|-------------|
| `metered_units` | `current_reading − previous_reading` — actual consumption for the period |
| `deviation_from_mean` | Z-score deviation from the consumer's own 12-month average |
| `peer_deviation_pct` | Percentage deviation from the area × connection_type peer group mean |
| `billing_consistency` | Absolute mismatch between billed units and metered units (normalized) |

### Parameters

```python
IsolationForest(
    n_estimators=100,
    contamination=0.10,   # expect ~10% anomaly rate in the dataset
    random_state=42
)
```

### Output

- Anomaly score mapped to 0–100 (higher = more anomalous)
- Contributes 30% to the weighted composite score

---

## 2. Statistical Baseline Deviation

**Weight in final score: 25%**

For each consumer, a 12-month consumption baseline is established from their historical data:

```
baseline_mean  = mean(historical_monthly_usage)
baseline_std   = std(historical_monthly_usage)
deviation      = (current_metered - baseline_mean) / baseline_mean * 100
z_score        = (current_metered - baseline_mean) / baseline_std
```

Consumers with large downward deviations (>40% below baseline) and small standard deviation (stable historical usage) receive high baseline deviation scores.

Score formula:
```
baseline_score = min(abs(deviation_pct) / 100, 1.0) * 100
```

---

## 3. Peer Group Comparison

**Weight in final score: 20%**

Each consumer is compared against all other consumers in the same **area** and **connection_type** peer group:

```
peer_mean     = mean(peer_group.metered_units)
peer_std      = std(peer_group.metered_units)
peer_pct_dev  = (current_metered - peer_mean) / peer_mean * 100
peer_z_score  = (current_metered - peer_mean) / max(peer_std, 1)
```

Consumers whose consumption is significantly below the peer mean — especially when the peer group variance is low — receive elevated peer deviation scores.

---

## 4. Billing Consistency Check

**Weight in final score: 15%**

Checks whether the billed units match the meter reading difference:

```
metered_units = current_reading - previous_reading
billing_gap   = abs(billed_units - metered_units)
billing_score = min(billing_gap / 100, 1.0) * 100
```

A perfect match scores 0. A discrepancy of 100+ units scores 100 on this component.

---

## 5. Rule-Based Fraud Flags

**Weight in final score: 10%**

Six independent rule checks are evaluated per consumer:

| Signal | Trigger Condition |
|--------|------------------|
| `sudden_consumption_drop` | Current metered units < 30% of baseline mean |
| `near_zero_usage` | Metered units < 20 with sanctioned load > 1 kW |
| `billing_mismatch` | Billed units differ from metered units by > 50 units |
| `repeated_low_billing` | >4 months in history below 30 units |
| `consumption_spike` | Current > 200% of baseline mean AND > 500 units |
| `peer_outlier` | Peer group z-score below −2.0 |

Each triggered flag increments the rule flag score proportionally to the total number of checks.

---

## Composite Risk Score Formula

```
raw_score =  (IF_score          × 0.30)
           + (baseline_score    × 0.25)
           + (peer_score        × 0.20)
           + (billing_score     × 0.15)
           + (rule_flag_score   × 0.10)
```

### Severity Bonus

When multiple severe signals coincide, a severity bonus of up to +15 points is applied:

```python
# Each severe signal contributes to the bonus
severe_count = 0
if metered_units < 30% of baseline:   severe_count += 1
if billing_gap > 100 units:            severe_count += 1
if peer_z_score < -2.5:               severe_count += 1

severity_bonus = min(severe_count * 5, 15)
final_score = min(raw_score + severity_bonus, 100)
```

---

## Risk Level Thresholds

| Score Range | Risk Level | Recommended Action |
|-------------|-----------|-------------------|
| 0 – 29 | Low | Routine monitoring |
| 30 – 59 | Medium | Flag for next scheduled inspection |
| 60 – 79 | High | Remote verification or billing review |
| 80 – 100 | Critical | Physical meter inspection (priority) |

---

## IBM Granite Integration

IBM Granite (`ibm/granite-13b-chat-v2`) is used to generate human-readable investigation summaries from structured evidence objects. It is invoked only on demand via `POST /api/investigation/explain`.

### Prompt Engineering Strategy

The Granite prompt:
1. Receives the computed fraud evidence as structured context — never raw data
2. Is explicitly instructed to use cautious language and not make definitive conclusions
3. Targets a professional utility investigator audience

### Responsible AI Constraints

The Granite system prompt enforces:
- **No definitive accusations** — terms like "confirmed theft" or "confirmed fraud" are prohibited
- **Cautious wording** — output uses "suspicious anomaly", "requires verification", "inspection recommended"
- **Evidence grounding** — Granite summarizes only what the detection model found, not independent speculation
- **Human primacy** — the narrative always ends with a recommendation for human investigator review

### Fallback

If IBM Granite credentials are not configured or the API is unavailable, a structured rule-based fallback narrative is generated deterministically from the same evidence object.

---

## Model Limitations

1. **No labeled training data** — Isolation Forest is unsupervised. It has no historical confirmed fraud cases to learn from.
2. **Seasonal patterns** — High summer loads or winter spikes may increase false-positive rates.
3. **New consumers** — Accounts with fewer than 6 months of history have unreliable baselines.
4. **Peer group assumptions** — Assumes consumers in the same area and connection type have broadly similar profiles.
5. **Contamination parameter** — The 10% contamination assumption means ~25 consumers in the dataset will always be flagged by the IF model, regardless of actual fraud prevalence.
6. **Billing corrections** — Legitimate billing adjustments or meter replacements may appear as billing mismatches.
7. **All flags are probabilistic** — No flag represents confirmed theft. All require human investigation.
