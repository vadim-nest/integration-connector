import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import { differenceInMinutes } from "date-fns";

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
    const employees = await prisma.employee.findMany({
      orderBy: { externalId: "asc" },
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

    res.json(employees);
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
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid employee id" });
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
      where: { id },
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
      orderBy: { startAt: "asc" },
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

    // totals
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
        totalHours: Math.round((totalMinutes / 60) * 100) / 100, // 2dp
        totalEarningsCents,
      },
    });
  } catch (e) {
    next(e);
  }
}
