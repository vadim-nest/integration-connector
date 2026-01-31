import { prisma } from "../db/prisma.js";
import axios from "axios";
import { parseCsv } from "./fileService.js";
import { EmployeeCSVSchema, ShiftCSVSchema } from "../domain/schemas.js";
import { differenceInMinutes, parseISO } from "date-fns";
import type { Employee } from "@prisma/client";

interface SyncError {
  row: number;
  type: "Employee" | "Shift";
  error: string;
  data?: any;
}

export const runSync = async (source: "FILE" | "API" = "FILE") => {
  const startedAt = new Date();
  const errors: SyncError[] = [];

  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "http://mock-provider:4001"
      : "http://localhost:4001";

  // 1) Create SyncRun record
  const syncRun = await prisma.syncRun.create({
    data: { startedAt, status: "IN_PROGRESS", source },
  });

  let recordsInserted = 0;

  try {
    let employeeRows: any[] = [];
    let shiftRows: any[] = [];

    if (source === "FILE") {
      employeeRows = await parseCsv("./data/employees.csv");
      shiftRows = await parseCsv("./data/shifts.csv");
    } else {
      const empRes = await axios.get(`${baseUrl}/employees`);
      const shiftRes = await axios.get(`${baseUrl}/shifts`);
      employeeRows = empRes.data;
      shiftRows = shiftRes.data;
    }

    console.log(
      "shiftRows length:",
      Array.isArray(shiftRows) ? shiftRows.length : typeof shiftRows,
    );
    console.log(
      "shiftRows first:",
      Array.isArray(shiftRows) ? shiftRows[0] : null,
    );

    // --- STEP A: SYNC EMPLOYEES ---
    for (const [index, row] of employeeRows.entries()) {
      const result = EmployeeCSVSchema.safeParse(row);

      if (!result.success) {
        errors.push({
          row: index + 1,
          type: "Employee",
          error: result.error.issues.map((i) => i.message).join(", "),
          data: row.external_id,
        });
        continue;
      }

      const data = result.data;

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

    const employees = await prisma.employee.findMany();
    const employeeMap = new Map<string, Employee>(
      employees.map((e) => [e.externalId, e]),
    );

    // --- STEP B: SYNC SHIFTS ---
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

      if (!employee) {
        errors.push({
          row: index + 1,
          type: "Shift",
          error: `Employee not found: ${data.employee_external_id}`,
          data: data.external_id,
        });
        continue;
      }

      const start = parseISO(data.start_at);
      const end = parseISO(data.end_at);

      const durationMinutes = differenceInMinutes(end, start);
      const workMinutes = Math.max(0, durationMinutes - data.break_minutes);

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
        recordsInserted,
        recordsErrored: errors.length,
        errorLog: errors as any,
      },
    });

    return { success: true, id: syncRun.id, errors };
  } catch (err: any) {
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "ERROR",
        finishedAt: new Date(),
        errorLog: errors as any,
      },
    });
    throw err;
  }
};
