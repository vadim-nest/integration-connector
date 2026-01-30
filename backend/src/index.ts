import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Trigger Sync Run
app.post("/sync", async (req, res) => {
  const { source } = req.query;
  if (source !== "file") {
    return res.status(400).json({ error: 'Source "file" is required' });
  }

  try {
    // TODO: Implement syncService.runFileSync()
    res.json({ message: "Sync started", syncRunId: "temp-id" });
  } catch (error) {
    res.status(500).json({ error: "Sync failed" });
  }
});

// Fetch recent sync runs
app.get("/sync-runs", async (req, res) => {
  try {
    // TODO: prisma.syncRun.findMany()
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch runs" });
  }
});

// List employees with summary data
app.get("/employees", async (req, res) => {
  try {
    // TODO: Fetch employees + include lastShift and totalEarnings
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// Fetch shifts for specific employee with date range
app.get("/employees/:externalId/shifts", async (req, res) => {
  const { externalId } = req.params;
  const { from, to } = req.query;

  try {
    // TODO: Fetch shifts + calculate totals for range
    res.json({ shifts: [], totals: {} });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch shifts" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
