import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import { runSync } from "../services/syncService.js";

export async function postSync(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Get source from query: /api/sync?source=api
    const source =
      (req.query.source as string)?.toUpperCase() === "API" ? "API" : "FILE";

    const result = await runSync(source);
    res.status(200).json(result);
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
