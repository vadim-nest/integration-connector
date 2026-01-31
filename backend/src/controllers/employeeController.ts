import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";

function parseDateParam(v: any) {
  if (!v) return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function getEmployees(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // 1. Get all employees
    const employees = await prisma.employee.findMany({
      orderBy: { externalId: "asc" },
      // We select specific fields to ensure we don't leak internal DB IDs if not needed
      select: {
        id: true,
        externalId: true,
        firstName: true,
        lastName: true,
        email: true,
        hourlyRateCents: true,
        active: true,
      },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 3. Aggregate Earnings: Sum earnings where shift started >= 7 days ago
    // Grouped by employeeExternalId (since that is your FK)
    const earningsGrouped = await prisma.shift.groupBy({
      by: ["employeeExternalId"],
      where: {
        startAt: { gte: sevenDaysAgo },
      },
      _sum: {
        earningsCents: true,
      },
    });

    // 4. Aggregate Last Shift: Find max(endAt) for all time
    const lastShiftGrouped = await prisma.shift.groupBy({
      by: ["employeeExternalId"],
      _max: {
        endAt: true,
      },
    });

    // 5. Create Lookup Maps for O(1) access during mapping
    const earningsMap = new Map<string, number>();
    earningsGrouped.forEach((g) => {
      earningsMap.set(g.employeeExternalId, g._sum.earningsCents || 0);
    });

    const lastShiftMap = new Map<string, Date | null>();
    lastShiftGrouped.forEach((g) => {
      lastShiftMap.set(g.employeeExternalId, g._max.endAt);
    });

    // 6. Merge data
    const response = employees.map((emp) => ({
      ...emp,
      totalEarningsCentsLast7Days: earningsMap.get(emp.externalId) || 0,
      lastShiftEndAt: lastShiftMap.get(emp.externalId) || null,
    }));

    res.json(response);
  } catch (e) {
    next(e);
  }
}

export async function getEmployeeShifts(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const externalId = String(req.params.externalId || "").trim();
    if (!externalId) {
      return res.status(400).json({ error: "Invalid employee externalId" });
    }

    const from = parseDateParam(req.query.from);
    const to = parseDateParam(req.query.to);

    if ((req.query.from && !from) || (req.query.to && !to)) {
      return res.status(400).json({ error: "Invalid from/to date" });
    }
    if (from && to && to <= from) {
      return res.status(400).json({ error: "`to` must be after `from`" });
    }

    const employee = await prisma.employee.findUnique({
      where: { externalId },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const where: any = {
      employeeExternalId: employee.externalId,
    };

    if (from || to) {
      where.startAt = {};
      if (from) where.startAt.gte = from;
      if (to) where.startAt.lt = to;
    }

    const shifts = await prisma.shift.findMany({
      where,
      orderBy: { startAt: "desc" },
      select: {
        id: true,
        externalId: true,
        employeeExternalId: true,
        startAt: true,
        endAt: true,
        breakMinutes: true,
        workMinutes: true,
        earningsCents: true,
      },
    });

    const totalMinutes = shifts.reduce(
      (sum, s) => sum + (s.workMinutes || 0),
      0,
    );
    const totalEarningsCents = shifts.reduce(
      (sum, s) => sum + (s.earningsCents || 0),
      0,
    );

    res.json({
      employee,
      range: {
        from: from ? from.toISOString() : null,
        to: to ? to.toISOString() : null,
      },
      shifts,
      totals: {
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 100) / 100,
        totalEarningsCents,
      },
    });
  } catch (e) {
    next(e);
  }
}
