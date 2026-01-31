import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import { runSync } from "../services/syncService.js";

export async function postSync(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await runSync();
    res.status(200).json({ id: result.id, errors: result.errors });
  } catch (e) {
    next(e);
  }
}

export async function getSyncRuns(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const runs = await prisma.syncRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    });
    res.json(runs);
  } catch (e) {
    next(e);
  }
}
