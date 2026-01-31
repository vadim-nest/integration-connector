export interface EmployeeSummary {
  id: number;
  externalId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  hourlyRateCents: number;
  active: boolean;
  lastShiftEndAt: string | null;
  totalEarningsCentsLast7Days: number;
}

export interface Shift {
  id: number;
  externalId: string;
  startAt: string;
  endAt: string;
  breakMinutes: number;
  workMinutes: number;
  earningsCents: number;
}

export interface SyncRun {
  id: number;
  status: "IN_PROGRESS" | "SUCCESS" | "ERROR";
  source: "FILE" | "API";
  startedAt: string;
  finishedAt: string | null;
  recordsInserted: number;
  recordsUpdated: number;
  recordsErrored: number;
  errorLog?: any;
}
