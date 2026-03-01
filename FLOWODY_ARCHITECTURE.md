# Flowody Job Lifecycle - Visual Architecture

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DASHBOARD (Frontend)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      7 Gauge Cards                               │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │   │
│  │  │   New   │  │ Quoting │  │Scheduled│  │In Prog..│  │Completed│ │   │
│  │  │    12   │  │    8    │  │   15    │  │   20    │  │   18   │ │   │
│  │  │  $5.2K  │  │  $12K   │  │  $22K   │  │  $45K   │  │  $38K  │ │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └────────┘ │   │
│  │                                                                  │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                      │   │
│  │  │   Invoicing (7)  │  │      Paid (4)    │                      │   │
│  │  │     $32K         │  │     $28K         │                      │   │
│  │  └──────────────────┘  └──────────────────┘                      │   │
│  │                                                                  │   │
│  │  [On Hover] →                                                   │   │
│  │    • Quote Sent: 5                                              │   │
│  │    • Quote Viewed: 2                                            │   │
│  │    • Quote Accepted: 1                                          │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  Time Period: [Today] [This Week] [This Month]                           │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
       ↓ (fetch gauge data)
       ↓
┌─────────────────────────────────────────────────────────────────────────┐
│         API LAYER (/api/gauges/phases)                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  GET /api/gauges/phases                                                 │
│  Response: [                                                             │
│    {                                                                     │
│      phase: "quoting",                                                  │
│      job_count: 8,                                                      │
│      total_value: 12000,                                                │
│      status_breakdown: [                                                │
│        { status: "quote_sent", count: 5 },                              │
│        { status: "quote_viewed", count: 2 },                            │
│        { status: "quote_accepted", count: 1 }                           │
│      ]                                                                  │
│    },                                                                   │
│    ...6 more phases                                                     │
│  ]                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              DATABASE (Backend)                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  jobs table                                                             │
│  ┌────┬──────────────┬───────┬──────────────────────────────────┐      │
│  │id  │ title        │phase  │ status                           │      │
│  ├────┼──────────────┼───────┼──────────────────────────────────┤      │
│  │ 1  │ Windows Job  │quoting│ quote_sent                       │      │
│  │ 2  │ Door Repair  │in_... │ in_progress                      │      │
│  │ 3  │ Paint House  │paid   │ paid                             │      │
│  └────┴──────────────┴───────┴──────────────────────────────────┘      │
│                           ↓ AGGREGATE                                   │
│  [Query: GROUP BY phase, COUNT(*), SUM(financials.revenue)]             │
│           ↓                                                             │
│  job_financials table                                                   │
│  ┌────┬────────┬──────────────┬─────────────────┬──────────┐           │
│  │id  │job_id  │labour_cost   │material_cost    │revenue   │           │
│  ├────┼────────┼──────────────┼─────────────────┼──────────┤           │
│  │ 1  │   1    │    250       │     400         │   1200   │           │
│  │ 2  │   2    │    800       │    1500         │   3500   │           │
│  │ 3  │   3    │    600       │     800         │   2200   │           │
│  └────┴────────┴──────────────┴─────────────────┴──────────┘           │
│           ↓ AUTO-CALCULATE (triggers)                                   │
│     total_cost = labour + material + other                              │
│     profit = revenue - total_cost                                       │
│     margin = (profit / revenue) * 100                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Job Lifecycle Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                    JOB LIFECYCLE STAGES                                 │
└────────────────────────────────────────────────────────────────────────┘

NEW PHASE
  ↓
  [DRAFT] → [NEW] → [NEEDS_QUOTE]
  ↓

QUOTING PHASE
  ↓
  [QUOTE_PREPARING] → [QUOTE_SENT] → [QUOTE_VIEWED] → +─────────────────+
                                                        │                 │
                                                    [QUOTE_ACCEPTED]    [QUOTE_DECLINED]
                                                        ↓                       ↓
                                                        ↓               (Back to NEW)
                                                        ↓

SCHEDULED PHASE
  ↓
  [SCHEDULED] ← [ASSIGNED]
  ↓

IN_PROGRESS PHASE
  ↓
  [IN_PROGRESS] → [ON_SITE] → [WORKING] ← [WAITING_PARTS]
  ↓

COMPLETED PHASE
  ↓
  [COMPLETED] → [READY_TO_INVOICE]
  ↓

INVOICING PHASE
  ↓
  [INVOICE_DRAFT] → [INVOICE_SENT] → [AWAITING_PAYMENT]
  ↓

PAID PHASE
  ↓
  [PAID] ← [PARTIALLY_PAID] ← [OVERDUE]
  ↓ (End)

Note: Phases auto-update when status changes
```

---

## Component Hierarchy

```
DashboardPage
├── DashboardNavbar
├── chartsSection
│   └── gaugeWrapperCard
│       ├── gaugeWrapperHeader
│       ├── AssigneeFilterBar
│       └── statusGaugeRow (old visualization)
│           └── (can replace with new gauges grid)
│
└── DashboardGauge (NEW) ×7
    ├── header
    ├── center (job count)
    ├── bottom (total value)
    └── breakdown (hover tooltip)

JobPage
├── Tabs
│   ├── Overview tab
│   ├── Schedule tab
│   ├── Invoice tab
│   ├── Notes tab
│   ├── Files tab
│   └── Profit tab (NEW)
│       └── JobProfitTab
│           ├── revenue display
│           ├── costs breakdown
│           │   ├── labour
│           │   ├── material
│           │   └── other
│           ├── total cost (auto)
│           ├── profit (auto)
│           └── margin (auto)
```

---

## Data Flow Diagram

```
                    ┌──────────────────┐
                    │  User Action     │
                    │  (Update Status) │
                    └────────┬─────────┘
                             │
                             ↓
                    ┌──────────────────────────┐
                    │  DashboardPage / JobPage │
                    │  (React Component)       │
                    └────────┬─────────────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     │                       │                       │
     ↓                       ↓                       ↓
┌──────────────┐   ┌──────────────────┐   ┌────────────────────┐
│ apiPut       │   │ updateJobStatus  │   │ buildPhaseUpdatePay│
│ (/jobs/:id)  │   │ payload          │   │ load(newStatus)    │
└──────┬───────┘   └────────┬─────────┘   └──────┬─────────────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                            ↓
                 ┌──────────────────────────┐
                 │  Express API Layer       │
                 │  PUT /api/jobs/:id       │
                 └────────┬─────────────────┘
                          │
                          ↓
            ┌─────────────────────────────────┐
            │  jobs.controller.update()       │
            │  - Extract status & phase       │
            │  - Validate status enum        │
            │  - Log activity                │
            └────────┬──────────────────────┘
                     │
                     ↓
          ┌────────────────────────────────┐
          │  PostgreSQL                    │
          │  UPDATE jobs SET:              │
          │  - status = $1                 │
          │  - phase = $2 (derived)        │
          │  - updated_at = NOW()          │
          └────────┬───────────────────────┘
                   │
                   ↓
           ┌─────────────────────┐
           │  RLS Policies       │
           │  Check company_id   │
           │  Allow/Deny update  │
           └─────────────────────┘
                   │
                   ↓
          ┌────────────────────────────┐
          │  Response → Client         │
          │  { updated job record }    │
          └────────────────────────────┘
```

---

## Financial Calculation Flow

```
USER ENTERS:
  • Labour Cost
  • Material Cost
  • Other Cost
  • Revenue

         ↓
         ↓ (POST/PUT to /api/jobs/:jobId/financials)

DATABASE TRIGGER (on INSERT/UPDATE):

  1. total_cost = labour_cost + material_cost + other_cost

  2. profit = revenue - total_cost

  3. IF revenue > 0 THEN
       margin = (profit / revenue) * 100
     ELSE
       margin = 0
     END IF

         ↓
         ↓ (Stored in database)

FRONTEND DISPLAY (in Profit Tab):
  • Revenue: $5,000
  • Labour: $1,200
  • Materials: $800
  • Other: $150
  • ─────────────
  • Total Cost: $2,150
  • ─────────────
  • Profit: $2,850
  • Margin: 57.0%
```

---

## Gauge Data Aggregation

```
Database Query:
SELECT
  phase,
  COUNT(*) as job_count,
  SUM(revenue) as total_value
FROM jobs j
LEFT JOIN job_financials jf ON jf.job_id = j.id
GROUP BY phase
ORDER BY phase

Result Dataset:
┌──────────┬───────────┬──────────────┐
│ phase    │ job_count │ total_value  │
├──────────┼───────────┼──────────────┤
│ new      │     12    │     5200     │
│ quoting  │      8    │    12000     │
│scheduled │     15    │    22000     │
│in_progres│     20    │    45000     │
│completed │     18    │    38000     │
│invoicing │      7    │    32000     │
│ paid     │      4    │    28000     │
└──────────┴───────────┴──────────────┘

         ↓

JSON Response to Frontend:
[
  {
    phase: "new",
    job_count: 12,
    total_value: 5200,
    status_breakdown: [
      { status: "draft", count: 5 },
      { status: "new", count: 6 },
      { status: "needs_quote", count: 1 }
    ]
  },
  ... (6 more phases)
]

         ↓

Transformed to GaugeData[]:
[
  {
    phase: "new",
    label: "New",
    description: "Jobs created but not quoted",
    jobCount: 12,
    totalValue: 5200,
    statusBreakdown: [...]
  },
  ... (6 more)
]

         ↓

Rendered as 7 Gauge Cards
with hover tooltips
```

---

## File Organization

```
project/
├── src/
│   ├── types/
│   │   ├── JobLifecycle.ts        (391 lines)
│   │   ├── GaugeData.ts           (108 lines)
│   │   └── JobFinancials.ts       (60 lines)
│   ├── services/
│   │   └── jobFinancials.ts       (65 lines)
│   ├── utils/
│   │   └── phaseHelper.ts         (95 lines)
│   ├── components/
│   │   ├── DashboardGauge.tsx     (50 lines)
│   │   ├── DashboardGauge.module.css
│   │   ├── JobProfitTab.tsx       (180 lines)
│   │   └── JobProfitTab.module.css
│   └── pages/
│       └── DashboardPage.tsx      (import updates)
│
├── server/
│   └── src/
│       ├── controllers/
│       │   └── jobFinancials.controller.ts  (155 lines)
│       ├── lib/
│       │   └── phaseMapper.ts               (50 lines)
│       └── routes/
│           ├── jobFinancials.ts
│           └── gauges.ts
│
└── server/migrations/
    ├── add_phase_to_jobs.sql
    └── create_job_financials_table.sql
```

---

Generated: March 2026
Architecture: Flowody v1.0
