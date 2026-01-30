import { prisma } from "../db/prisma";
import { parseCsv } from "./fileService";
import { EmployeeCSVSchema, ShiftCSVSchema } from "../domain/schemas";
import { differenceInMinutes, parseISO } from "date-fns";

interface SyncError {
  row: number;
  type: "Employee" | "Shift";
  error: string;
  data?: any;
}

export const runSync = async () => {
  const startedAt = new Date();
  const errors: SyncError[] = [];

  // 1. Create SyncRun Record
  const syncRun = await prisma.syncRun.create({
    data: {
      startedAt,
      status: "IN_PROGRESS",
      source: "FILE",
    },
  });

  let recordsInserted = 0;
  let recordsUpdated = 0; // Prisma upsert makes it hard to distinguish, we might just track "processed"

  try {
    // --- STEP A: SYNC EMPLOYEES ---
    // We parse all rows first. In a massive scale system, we would stream & batch.
    const employeeRows = await parseCsv<any>("./data/employees.csv");

    for (const [index, row] of employeeRows.entries()) {
      const result = EmployeeCSVSchema.safeParse(row);

      if (!result.success) {
        errors.push({
          row: index + 1, // CSVs are 1-indexed for humans
          type: "Employee",
          error: result.error.issues.map((i) => i.message).join(", "),
          data: row.external_id,
        });
        continue;
      }

      const data = result.data;

      // Idempotent Upsert
      await prisma.employee.upsert({
        where: { externalId: data.external_id },
        update: {
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          hourlyRateCents: data.hourly_rate,
          active: data.active,
        },
        create: {
          externalId: data.external_id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          hourlyRateCents: data.hourly_rate,
          active: data.active,
        },
      });
      recordsInserted++;
    }

    // --- STEP B: SYNC SHIFTS ---
    const shiftRows = await parseCsv<any>("./data/shifts.csv");

    // Optimization: Load valid employees into memory to avoid N+1 queries for rate lookups
    const employees = await prisma.employee.findMany();
    const employeeMap = new Map(employees.map((e) => [e.externalId, e]));

    for (const [index, row] of shiftRows.entries()) {
      const result = ShiftCSVSchema.safeParse(row);

      if (!result.success) {
        errors.push({
          row: index + 1,
          type: "Shift",
          error: result.error.issues.map((i) => i.message).join(", "),
          data: row.external_id,
        });
        continue;
      }

      const data = result.data;
      const employee = employeeMap.get(data.employee_external_id);

      // Business Rule: Shift must reference a known employee
      if (!employee) {
        errors.push({
          row: index + 1,
          type: "Shift",
          error: `Employee not found: ${data.employee_external_id}`,
          data: data.external_id,
        });
        continue;
      }

      // Calculations
      const start = parseISO(data.start_at);
      const end = parseISO(data.end_at);

      const durationMinutes = differenceInMinutes(end, start);
      const workMinutes = Math.max(0, durationMinutes - data.break_minutes);

      // Earnings Formula: (workMinutes * rate) / 60, rounded to integer
      const earningsCents = Math.round(
        (workMinutes * employee.hourlyRateCents) / 60,
      );

      await prisma.shift.upsert({
        where: { externalId: data.external_id },
        update: {
          employeeExternalId: data.employee_external_id,
          startAt: start,
          endAt: end,
          breakMinutes: data.break_minutes,
          workMinutes,
          earningsCents,
        },
        create: {
          externalId: data.external_id,
          employeeExternalId: data.employee_external_id,
          startAt: start,
          endAt: end,
          breakMinutes: data.break_minutes,
          workMinutes,
          earningsCents,
        },
      });
      recordsInserted++;
    }

    // --- STEP C: FINALIZE ---
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        recordsInserted, // Simplification: we're counting total upserts as inserted for now
        recordsErrored: errors.length,
        errorLog: errors, // Storing compact JSON
      },
    });

    return { success: true, id: syncRun.id, errors };
  } catch (err: any) {
    // Catastrophic failure (e.g., DB down)
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "ERROR",
        finishedAt: new Date(),
        errorLog: errors,
      },
    });
    throw err;
  }
};
