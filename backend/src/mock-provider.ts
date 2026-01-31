import express from "express";
const app = express();

app.get("/employees", (req, res) => {
  res.json([
    {
      external_id: "E-2001",
      first_name: "Mock",
      last_name: "User",
      email: "mock@example.com",
      hourly_rate: 25.0,
      active: true,
    },
  ]);
});

app.get("/shifts", (req, res) => {
  res.json([
    {
      external_id: "S-8001",
      employee_external_id: "E-2001",
      start_at: "2026-01-29T09:00:00Z",
      end_at: "2026-01-29T17:00:00Z",
      break_minutes: "30",
    },
  ]);
});

app.listen(4001, () => console.log("Mock Provider API on 4001"));
