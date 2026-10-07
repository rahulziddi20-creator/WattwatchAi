# WattWatch AI — System Architecture

## Overview

WattWatch AI is an agentic electricity fraud intelligence platform designed for use by electricity distribution companies. It combines unsupervised machine learning, statistical rule-based detection, and IBM Granite generative AI to identify suspicious consumption patterns, assign transparent fraud-risk scores, and present investigation evidence to human analysts.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  Overview │ Queue │ Consumer │ Analytics │ Areas │ AI Workspace │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / REST (proxied via Vite dev)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI / Python)                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Agent Pipeline                         │  │
│  │                                                           │  │
│  │  [1] Data Validation Agent                                │  │
│  │       └─ validates records, detects missing/invalid data  │  │
│  │                          │                                │  │
│  │  [2] Consumption Intelligence Agent                       │  │
│  │       └─ establishes 12-month baseline per consumer       │  │
│  │                          │                                │  │
│  │  [3] Fraud Detection Agent                                │  │
│  │       └─ Isolation Forest + 6 rule-based signal checks    │  │
│  │                          │                                │  │
│  │  [4] Peer Comparison Agent                                │  │
│  │       └─ compares vs area × connection_type peer group    │  │
│  │                          │                                │  │
│  │  [5] Evidence Agent                                       │  │
│  │       └─ builds structured fraud evidence object          │  │
│  │                          │                                │  │
│  │  [6] IBM Granite Investigation Agent                      │  │
│  │       └─ converts evidence → professional narrative       │  │
│  │                          │                                │  │
│  │  [7] Recommendation Agent                                 │  │
│  │       └─ emits action: Monitor / Inspect / Review / None  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ML Layer (scikit-learn / NumPy / Pandas)                │   │
│  │  • Isolation Forest (contamination = 0.10)               │   │
│  │  • Statistical baseline deviation                        │   │
│  │  • Peer group z-score comparison                         │   │
│  │  • Rule-based meter/billing consistency checks           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Data Layer                                              │   │
│  │  • consumers.json (253 synthetic records)                │   │
│  │  • In-memory Pandas DataFrame loaded at startup          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                           │
                    IBM watsonx.ai
              (Granite-13b-chat-v2 / ibm-granite)
```

---

## Component Breakdown

### Frontend

| Component | Purpose |
|-----------|---------|
| `Overview.jsx` | Executive KPIs, priority list, anomaly trend, area summary |
| `InvestigationQueue.jsx` | Filterable/sortable table of all flagged accounts |
| `ConsumerInvestigation.jsx` | Full per-consumer profile, ML evidence, Granite summary |
| `Analytics.jsx` | Platform-wide trend charts, risk distribution, area analysis |
| `AreaIntelligence.jsx` | Locality-wise anomaly clustering and area risk breakdown |
| `AIWorkspace.jsx` | Interactive investigator workspace — IBM Granite integration |
| `Compliance.jsx` | Model methodology, scoring formula, responsible AI statement |

### Backend API Routes

| Route | Description |
|-------|-------------|
| `GET /api/health` | System health check |
| `GET /api/dashboard` | Executive KPI summary |
| `GET /api/consumers` | All consumer records with computed risk scores |
| `GET /api/consumers/{id}` | Full detail for single consumer |
| `GET /api/queue` | Investigation queue with filters |
| `GET /api/investigations` | Active investigation list |
| `GET /api/analytics/overview` | Aggregated platform stats |
| `GET /api/analytics/trends` | 12-month anomaly trend data |
| `GET /api/areas` | Area-level aggregates |
| `POST /api/analyze/{id}` | Trigger fresh analysis for one consumer |
| `POST /api/investigation/explain` | Request IBM Granite narrative for evidence |

---

## Data Flow

```
consumers.json
     │
     ▼
DataService.load_data()        — loads DataFrame, runs full ML pipeline once at startup
     │
     ├── AnomalyDetector.fit_predict()       — Isolation Forest scores
     ├── ConsumptionAgent.analyze()          — baseline deviation per consumer
     ├── PeerComparisonAgent.compare()       — peer group deviation
     ├── FraudDetectionAgent.detect()        — rule flags + combined score
     └── EvidenceAgent.build()               — structured evidence object
              │
              ▼
        cached in memory (consumer_cache)
              │
    ┌─────────┴──────────┐
    │                    │
    ▼                    ▼
REST API endpoints   GraniteAgent.explain()
(instant response)   (on-demand, POST /api/investigation/explain)
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + Vite 5 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts 2 |
| Icons | Lucide React |
| HTTP client | Fetch API (native) |
| Backend framework | FastAPI 0.115 |
| Data processing | Pandas 2 + NumPy |
| Machine learning | scikit-learn (Isolation Forest) |
| Schema validation | Pydantic v2 |
| AI/LLM | IBM Granite via watsonx.ai Python SDK |
| Runtime | Python 3.11+ / Node 20+ |

---

## Security Considerations

- IBM API keys stored as backend environment variables only
- Frontend never receives or handles credentials
- `.env` excluded from version control via `.gitignore`
- CORS configured to allow only localhost origins in development
- All Granite calls proxied through the FastAPI backend

---

## Deployment Topology (Production)

```
                  ┌─────────────┐
                  │   CDN/Edge  │  ← Static frontend build
                  └──────┬──────┘
                         │
                  ┌──────▼──────┐
                  │  FastAPI    │  ← IBM Cloud Code Engine / Container
                  │  (uvicorn)  │
                  └──────┬──────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────▼─────┐  ┌─────▼──────┐  ┌──▼────────────┐
    │  Dataset  │  │  ML Models │  │  IBM watsonx  │
    │  (JSON/DB)│  │  (in-mem)  │  │  Granite API  │
    └───────────┘  └────────────┘  └───────────────┘
```
