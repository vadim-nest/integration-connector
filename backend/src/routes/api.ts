import { Router } from "express";
import { postSync, getSyncRuns } from "../controllers/syncController.js";
import {
  getEmployees,
  getEmployeeShifts,
} from "../controllers/employeeController.js";

const router = Router();

router.post("/sync", postSync);
router.get("/sync-runs", getSyncRuns);

router.get("/employees", getEmployees);
router.get("/employees/:id/shifts", getEmployeeShifts);

export default router;
