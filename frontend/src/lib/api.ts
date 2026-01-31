import axios from "axios";
import type { EmployeeSummary, Shift, SyncRun } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const client = axios.create({
  baseURL: API_URL,
});

export const api = {
  // Sync
  triggerSync: async () => {
    const { data } = await client.post<SyncRun>("/api/sync");
    return data;
  },

  getSyncRuns: async () => {
    const { data } = await client.get<SyncRun[]>("/api/sync-runs");
    return data;
  },

  // Employees
  getEmployees: async () => {
    const { data } = await client.get<EmployeeSummary[]>("/api/employees");
    console.log(data);

    return data;
  },

  // Shifts (by employee numeric id)
  getEmployeeShifts: async (externalId: string, days = 30) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const params = new URLSearchParams({
      from: start.toISOString(),
      to: end.toISOString(),
    });

    const { data } = await client.get(
      `/api/employees/${externalId}/shifts?${params.toString()}`,
    );
    console.log(data)
    return data;
  },
};
