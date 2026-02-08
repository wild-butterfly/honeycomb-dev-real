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

export type JobStatus = "active" | "completed" | "return" | "quote";

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
