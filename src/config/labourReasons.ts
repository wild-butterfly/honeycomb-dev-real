export type LabourReason = {
  id: number;
  name: string;
  paid: boolean;
};

export const labourReasons: LabourReason[] = [
  { id: 1, name: "Travel Time", paid: true },
  { id: 2, name: "Office Work", paid: true },
  { id: 3, name: "Prep Work", paid: true },
  { id: 4, name: "Supervision / Training", paid: true },
  { id: 5, name: "Quotes / Estimates", paid: true },
  { id: 6, name: "Unpaid Lunch", paid: false },
  { id: 7, name: "Annual Leave", paid: true },
  { id: 8, name: "Stat Holiday", paid: true },
  { id: 9, name: "Sick Leave", paid: true },
  { id: 10, name: "Paid breaks", paid: true },
  { id: 11, name: "Unpaid breaks", paid: false },
  { id: 12, name: "Other", paid: true },
];