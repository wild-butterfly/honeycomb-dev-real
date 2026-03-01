export type Employee = {
  id: number;
  name: string;
};

export type Assignment = {
  id: number;
  employee_id: number;
  start: Date;
  end: Date;
  completed?: boolean;
};

export type JobStatus =
  | "draft"
  | "new"
  | "needs_quote"
  | "quote_preparing"
  | "quote_sent"
  | "quote_viewed"
  | "quote_accepted"
  | "quote_declined"
  | "scheduled"
  | "assigned"
  | "in_progress"
  | "on_site"
  | "working"
  | "waiting_parts"
  | "completed"
  | "ready_to_invoice"
  | "invoice_draft"
  | "invoice_sent"
  | "awaiting_payment"
  | "paid"
  | "partially_paid"
  | "overdue"
  // legacy values still seen in old records
  | "active"
  | "return"
  | "quote";

export type CalendarJob = {
  id: number;
  title: string;
  client: string;
  address: string;
  notes: string;

  status: JobStatus;
  color: string;

  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;

  assignments: Assignment[];
};

export type LabourEntry = {
  id: number;
  job_id: number;
  employee_id: number;
  hours: number;
  rate: number;        
  billable?: boolean;
};
