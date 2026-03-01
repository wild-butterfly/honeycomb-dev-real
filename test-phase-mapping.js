// Quick test to verify phase mapping
const testStatuses = ["invoicing", "invoice", "invoice_sent", "invoice_draft", "awaiting_payment", "quoting", "pricing"];

testStatuses.forEach(status => {
  // Simulating the mapping logic
  const s = status.toLowerCase().trim();
  
  // From normalizeJobStatus in JobLifecycle
  let jobStatus = null;
  if (s === "invoice" || s === "invoicing" || s === "invoiced") {
    jobStatus = "INVOICE_SENT";
  } else if (s === "invoice_draft") {
    jobStatus = "INVOICE_DRAFT";
  } else if (s === "invoice_sent") {
    jobStatus = "INVOICE_SENT";
  } else if (s === "awaiting_payment") {
    jobStatus = "AWAITING_PAYMENT";
  } else if (s === "pricing" || s === "quoting" || s === "quote") {
    jobStatus = "QUOTE_PREPARING";
  }
  
  // From getPhaseFromStatus
  let phase = null;
  if (jobStatus === "INVOICE_SENT" || jobStatus === "INVOICE_DRAFT" || jobStatus === "AWAITING_PAYMENT") {
    phase = "invoicing";
  } else if (jobStatus === "QUOTE_PREPARING") {
    phase = "quoting";
  }
  
  console.log(`"${status}" → ${jobStatus} → ${phase}`);
});
