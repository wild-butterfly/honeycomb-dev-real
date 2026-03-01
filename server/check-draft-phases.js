const { Pool } = require('pg');

// Complete status → phase mapping (based on normalizeJobStatus in JobLifecycle.ts)
function mapStatus ToPhase(status) {
  const s = String(status || "").trim().toLowerCase();
  
  // PENDING
  if (["draft", "new", "start", "pending", "needs_quote", "needs quote"].includes(s)) return "PENDING";
  
  // QUOTING
  if (["pricing", "quoting", "quote", "estimate", "quote_preparing", "quote preparing", "quote_sent", "quote sent", "quotesent", "quote_viewed", "quote viewed", "quote_accepted", "quote accepted", "quoteaccepted", "quote_declined", "quote declined"].includes(s)) return "QUOTING";
  
  // SCHEDULED
  if (["scheduled", "scheduling", "schedule", "assigned"].includes(s)) return "SCHEDULED";
  
  // IN_PROGRESS
  if (["in_progress", "in progress", "inprogress", "active", "on_site", "on site", "working", "waiting_parts", "waiting parts"].includes(s)) return "IN_PROGRESS";
  
  // COMPLETED
  if (["completed", "complete", "back_costing", "back costing", "need to return", "ready_to_invoice", "ready to invoice"].includes(s)) return "COMPLETED";
  
  // INVOICING
  if (["invoice", "invoicing", "invoiced", "invoice_draft", "invoice draft", "invoice_sent", "invoice sent", "awaiting_payment", "awaiting payment"].includes(s)) return "INVOICING";
  
  // PAID
  if (["paid", "payment", "partially_paid", "partially paid", "overdue"].includes(s)) return "PAID";
  
  return "UNKNOWN";
}

async function checkStatus Mapping() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'honeycomb'
  });

  try {
    console.log('Complete Status → Phase Mapping:\n');
    
    const result = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM jobs
      GROUP BY status
      ORDER BY count DESC
    `);
    
    const phaseBreakdown = {};
    
    result.rows.forEach(r => {
      const status = r.status;
      const phase = mapStatusToPhase(status);
      
      if (!phaseBreakdown[phase]) phaseBreakdown[phase] = [];
      phaseBreakdown[phase].push({ status, count: r.count });
      
      console.log(`"${status.padEnd(20)}" (${r.count}) → ${phase}`);
    });
    
    console.log('\n\n📊 Summary by Phase:');
    Object.entries(phaseBreakdown).forEach(([phase, statuses]) => {
      const total = statuses.reduce((sum, s) => sum + s.count, 0);
      console.log(`  ${phase.padEnd(15)}: ${total} jobs (${statuses.map(s => s.status).join(", ")})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkStatusMapping();
