# WattWatch AI — Demo Script

## Overview

This script walks through a complete demonstration of WattWatch AI for a competition or client presentation. Estimated time: **10–15 minutes**.

---

## Prerequisites

Ensure both services are running:

```bash
# Terminal 1 — Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open `http://localhost:5173` in a browser (Chrome recommended, full-screen).

---

## Demo Flow

### Step 1 — Executive Overview (2 min)

**Open:** `http://localhost:5173/` (Overview page)

**Say:**
> "This is the WattWatch AI command center. At a glance, our distribution team can see the total monitored portfolio, the number of anomalies detected by the ML pipeline, and the estimated financial exposure — all updated on demand."

**Point to:**
- KPI cards: Total Consumers, Anomalies Detected, High + Critical, Revenue at Risk
- Investigation Priority List — show the top 3 flagged accounts (RJ10541, RJ10293 should be visible)
- Recent Alerts panel — show the alert timestamps and risk levels
- Anomaly Trend chart — 12-month rise in detections

**Action:** Click the refresh button on the page to show live data fetching.

---

### Step 2 — Investigation Queue (2 min)

**Open:** Click "Investigation Queue" in sidebar

**Say:**
> "The investigation queue lists every account the system has flagged, sorted by risk score. Investigators can filter by risk level to prioritize their workday."

**Action:**
1. Click the "Critical" tab filter — show only Critical accounts
2. Point to the risk score column — "100 CRITICAL" for RJ10541
3. Point to the Primary Anomaly column — billing mismatch description
4. Click "High" tab — show high-risk accounts

**Key point:** "Every row is a real anomaly with a specific reason — not just a generic flag."

---

### Step 3 — Consumer Investigation: RJ10293 (3 min)

**Open:** Click on consumer RJ10293 from the queue, or navigate to `/investigation/RJ10293`

**Say:**
> "Let's investigate consumer RJ10293. Historical usage: stable 350–410 units per month for a year. This month? 75 units. The system has flagged this as Critical."

**Point to:**
- `ScoreDisplay` component: "81 CRITICAL" with color coding
- Historical consumption chart — dramatic drop visible at the last bar
- Fraud signals panel: "sudden_consumption_drop", "peer_outlier" highlighted in red
- Baseline deviation: "−80.4% below 12-month average"
- Peer comparison: "−76.2% below similar consumers in same area"

**Say:**
> "This isn't guesswork — every component of the score is visible. Isolation Forest: 78. Baseline deviation: 80. The score is a weighted combination of five independent signals."

**Action:** Scroll down to the AI Investigation Summary section.

---

### Step 4 — IBM Granite Investigation Narrative (2 min)

**Open:** Still on RJ10293's profile — scroll to AI Summary section, or navigate to AI Workspace and select RJ10293

**Say:**
> "Now we invoke IBM Granite. The model receives only the computed fraud evidence — not raw data. It generates a professional investigation narrative."

**Action:** Click "Generate AI Summary" (or the relevant button)

**Wait for response, then point to:**
- The narrative uses cautious language: "suspicious anomaly", "requires verification"
- It references specific numbers from the evidence: the 75-unit reading, the 382-unit baseline
- It ends with a recommended action
- It does NOT say "this consumer is stealing electricity"

**Say:**
> "This is responsible AI. Granite is explicitly instructed never to accuse a consumer of theft. Every summary requires human investigator review before any action is taken."

---

### Step 5 — Consumer Investigation: RJ10541 (1.5 min)

**Open:** Navigate to `/investigation/RJ10541`

**Say:**
> "RJ10541 is a different type of anomaly — a billing inconsistency. The meter shows 580 units consumed. The bill shows only 180. That's a 400-unit discrepancy."

**Point to:**
- Risk score: 100 CRITICAL
- Billing gap figure
- Signals: "billing_mismatch" flag
- Recommended action: "Billing Review + Physical Inspection"

---

### Step 6 — Control Consumer: RJ10872 (30 sec)

**Open:** Navigate to `/investigation/RJ10872`

**Say:**
> "For contrast — RJ10872. Stable usage, minimal deviation, score of 3.8. Low risk. This is what a clean account looks like. The system doesn't flag what isn't suspicious."

---

### Step 7 — Analytics Page (1.5 min)

**Open:** Click "Analytics" (if it appears in the sidebar) or navigate directly

**Say:**
> "The analytics view gives management visibility into portfolio-wide trends."

**Point to:**
- Monthly Anomaly Trend chart — seasonal patterns
- Risk Level Distribution — pie/bar chart breakdown
- Area Risk Scores bar chart — which localities have the highest average risk
- Revenue at Risk trend

---

### Step 8 — Area Intelligence (1 min)

**Open:** Click "Area Intelligence" in sidebar

**Say:**
> "The area intelligence view clusters anomalies by locality. High-density fraud zones are immediately visible. Distribution companies can allocate field inspection teams to the highest-risk areas."

**Point to:**
- Area cards with Anomaly Cluster badges
- Area risk rate percentage
- Critical count per area

---

### Step 9 — AI Workspace (1 min)

**Open:** Click "AI Investigator" in sidebar

**Say:**
> "The AI workspace is where investigators can have a focused conversation with Granite about any flagged account. Suggested questions are pre-loaded based on the evidence."

**Action:** Select a consumer from the dropdown, click a suggested question

---

### Step 10 — Model & Compliance (30 sec)

**Open:** Click "Model & Compliance" in sidebar

**Say:**
> "Finally — transparency. Every detection method, every weight in the scoring formula, every model limitation is documented here. We built this for real utility operations, which means accountability matters."

**Point to:**
- Scoring methodology table (weights)
- Risk level thresholds
- Responsible AI statement (amber box)

---

## Key Talking Points

| Topic | Point |
|-------|-------|
| Why IBM Granite? | Structured evidence → professional narrative; accountable AI with guardrails |
| Why Isolation Forest? | No labeled fraud data available — unsupervised is the right choice |
| What makes this different? | Real anomaly detection with explainable scores, not a chatbot |
| Responsible AI | Granite never accuses — flags for human review only |
| Production readiness | Modular agent architecture, environment-based secrets, documented API |

---

## Special Demo Accounts

| Consumer ID | Name | Scenario | Risk Score |
|-------------|------|---------|------------|
| `RJ10293` | Kavya Nair | Sudden consumption drop (−80% below baseline) | ~81 Critical |
| `RJ10541` | Bharat Sharma | Billing mismatch: 580 metered, 180 billed | 100 Critical |
| `RJ10872` | Priya Patel | Normal consumer — low risk control case | ~4 Low |

---

## Troubleshooting

**Backend not responding:**
```bash
cd backend && uvicorn app.main:app --reload --port 8000
```

**Frontend not loading:**
```bash
cd frontend && npm run dev
```

**IBM Granite not responding:**
- Check `.env` for `WATSONX_API_KEY` and `WATSONX_PROJECT_ID`
- The system will fall back to rule-based narratives automatically

**Consumer not found:**
- Ensure `backend/data/consumers.json` exists (run `python data/generate_dataset.py` if missing)
