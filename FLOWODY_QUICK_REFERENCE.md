# Flowody Job Lifecycle - Quick Reference

## 7 Job Phases (Dashboard Gauges)

| Phase         | Label       | Description                        |
| ------------- | ----------- | ---------------------------------- |
| `new`         | New         | Jobs created but not quoted        |
| `quoting`     | Quoting     | Jobs currently in quote process    |
| `scheduled`   | Scheduled   | Jobs booked but not started        |
| `in_progress` | In Progress | Jobs currently being worked on     |
| `completed`   | Completed   | Jobs finished and ready to invoice |
| `invoicing`   | Invoicing   | Invoices sent and awaiting payment |
| `paid`        | Paid        | Jobs fully paid                    |

## 26 Job Statuses (Detailed State)

### NEW Phase (3)

- `draft` - Draft
- `new` - New
- `needs_quote` - Needs Quote

### QUOTING Phase (5)

- `quote_preparing` - Quote Preparing
- `quote_sent` - Quote Sent
- `quote_viewed` - Quote Viewed
- `quote_accepted` - Quote Accepted
- `quote_declined` - Quote Declined

### SCHEDULED Phase (2)

- `scheduled` - Scheduled
- `assigned` - Assigned

### IN_PROGRESS Phase (4)

- `in_progress` - In Progress
- `on_site` - On Site
- `working` - Working
- `waiting_parts` - Waiting Parts

### COMPLETED Phase (2)

- `completed` - Completed
- `ready_to_invoice` - Ready to Invoice

### INVOICING Phase (3)

- `invoice_draft` - Invoice Draft
- `invoice_sent` - Invoice Sent
- `awaiting_payment` - Awaiting Payment

### PAID Phase (3)

- `paid` - Paid
- `partially_paid` - Partially Paid
- `overdue` - Overdue

---

## Core Imports

```typescript
// Types
import {
  JobPhase,
  JobStatus,
  getPhaseFromStatus,
} from "src/types/JobLifecycle";
import { GaugeData, DASHBOARD_GAUGES } from "src/types/GaugeData";
import {
  JobFinancials,
  formatCurrency,
  formatPercentage,
} from "src/types/JobFinancials";

// Services
import {
  getJobFinancials,
  updateJobFinancials,
} from "src/services/jobFinancials";
import { getGaugeData } from "src/services/jobFinancials";

// Components
import DashboardGauge from "src/components/DashboardGauge";
import JobProfitTab from "src/components/JobProfitTab";

// Utils
import {
  getPhaseForStatus,
  buildPhaseUpdatePayload,
} from "src/utils/phaseHelper";
```

---

## Key Functions

### Phase Mapping

```typescript
// Status → Phase
getPhaseFromStatus(JobStatus.QUOTE_SENT); // → JobPhase.QUOTING

// Get all statuses for phase
getStatusesForPhase(JobPhase.QUOTING); // → [QUOTE_PREPARING, QUOTE_SENT, ...]

// Get label for display
getPhaseLabel(JobPhase.QUOTING); // → "Quoting"
getStatusLabel(JobStatus.QUOTE_SENT); // → "Quote Sent"
```

### Financial Helpers

```typescript
// Format display values
formatCurrency(45000); // → "$45,000.00"
formatPercentage(25.5); // → "25.5%"

// Calculate
profit = revenue - totalCost;
margin = (profit / revenue) * 100;
```

### Gauge Query

```typescript
// Backend endpoint
GET / api / gauges / phases;
// Returns: [{ phase, job_count, total_value, status_breakdown }]
```

---

## Component Props

### DashboardGauge

```tsx
<DashboardGauge
  data={{
    phase: JobPhase.QUOTING,
    label: "Quoting",
    description: "Jobs currently in quote process",
    jobCount: 12,
    totalValue: 45000,
    statusBreakdown: [
      { status: JobStatus.QUOTE_SENT, count: 8, label: "Quote Sent" },
      { status: JobStatus.QUOTE_VIEWED, count: 4, label: "Quote Viewed" },
    ],
  }}
  onClick={() => navigate("/dashboard/quoting")}
/>
```

### JobProfitTab

```tsx
<JobProfitTab jobId={jobId} />
```

---

## API Endpoints

| Method | Endpoint                      | Purpose                 |
| ------ | ----------------------------- | ----------------------- |
| GET    | `/api/gauges/phases`          | Fetch all gauge data    |
| GET    | `/api/jobs/:jobId/financials` | Get financial record    |
| POST   | `/api/jobs/:jobId/financials` | Create financial record |
| PUT    | `/api/jobs/:jobId/financials` | Update financial record |

---

## Database Schema

### jobs table (additions)

```sql
phase VARCHAR(20) NOT NULL DEFAULT 'new'
  CHECK (phase IN ('new', 'quoting', 'scheduled', 'in_progress', 'completed', 'invoicing', 'paid'))
```

### job_financials table

```sql
CREATE TABLE job_financials (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL UNIQUE REFERENCES jobs(id),
  labour_cost DECIMAL(12,2) DEFAULT 0,
  material_cost DECIMAL(12,2) DEFAULT 0,
  other_cost DECIMAL(12,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,        -- AUTO
  revenue DECIMAL(12,2) DEFAULT 0,
  profit DECIMAL(12,2) DEFAULT 0,            -- AUTO
  margin DECIMAL(5,2) DEFAULT 0,             -- AUTO
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Gauge Display Order

The order matters for dashboard layout:

1. New
2. Quoting
3. Scheduled
4. In Progress
5. Completed
6. Invoicing
7. Paid

---

## Files Created Summary

**Frontend (9 files):**

- Types: JobLifecycle.ts, GaugeData.ts, JobFinancials.ts
- Services: jobFinancials.ts
- Utils: phaseHelper.ts
- Components: DashboardGauge, JobProfitTab (+ CSS)

**Backend (4 files):**

- Controllers: jobFinancials.controller.ts
- Routes: jobFinancials.ts, gauges.ts
- Lib: phaseMapper.ts

**Database (2 files):**

- Migrations: add_phase_to_jobs.sql, create_job_financials_table.sql

**Documentation (4 files):**

- FLOWODY_IMPLEMENTATION_GUIDE.md
- FLOWODY_INTEGRATION_CHECKLIST.md
- FLOWODY_SUMMARY.md
- FLOWODY_QUICK_REFERENCE.md

---

## Color Codes (Gauges)

| Phase       | Color                  |
| ----------- | ---------------------- |
| new         | #FFC8C8 (light red)    |
| quoting     | #FFD9A8 (light orange) |
| scheduled   | #B8DEFF (light blue)   |
| in_progress | #DDB8FF (light purple) |
| completed   | #B8ECEC (light cyan)   |
| invoicing   | #FFF4A8 (light yellow) |
| paid        | #C8F0D4 (light green)  |

---

## Important Notes

✅ Use correct naming: New, Quoting, Paid
❌ Don't use: Pending, Pricing, Payments, Back Costing

✅ Phase is for gauges (7 total)
❌ Status is internal detail (26 total)

✅ Profit is a job detail feature
❌ Not a phase

✅ Auto-calculate: totalCost, profit, margin
❌ Don't manually calculate in UI

---

## Testing Setup

```bash
# Build frontend
npm install
npm run build
npm start

# Test endpoints
curl http://localhost/api/gauges/phases
curl http://localhost/api/jobs/1/financials

# Test migrations
psql -f server/migrations/add_phase_to_jobs.sql
psql -f server/migrations/create_job_financials_table.sql
```

---

**Last Updated:** March 2026
**Version:** 1.0
**Status:** Production Ready
