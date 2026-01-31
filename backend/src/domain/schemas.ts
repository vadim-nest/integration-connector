import { z } from "zod";

// --- Employee Schema ---
export const EmployeeCSVSchema = z.object({
  external_id: z.string().min(1, "External ID is required"),
  first_name: z.string().optional().default(""),
  last_name: z.string().optional().default(""),
  email: z
    .string()
    .optional()
    .transform((raw) => {
      const v = (raw ?? "").trim();
      if (!v) return null;
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (!ok) throw new Error("Invalid email format");
      return v.toLowerCase();
    }),
  hourly_rate: z.string().transform((val) => {
    const floatVal = parseFloat(val);
    if (isNaN(floatVal) || floatVal < 0) {
      throw new Error("Invalid hourly rate");
    }
    // Convert GBP (12.50) to Pence (1250)
    // Use Math.round to avoid floating point errors (12.50 * 100 = 1250.000001)
    return Math.round(floatVal * 100);
  }),
  active: z.string().transform((val) => val.toLowerCase() === "true"),
});

export type EmployeeCSVRow = z.infer<typeof EmployeeCSVSchema>;

// --- Shift Schema ---
export const ShiftCSVSchema = z
  .object({
    external_id: z.string().min(1, "External ID is required"),
    employee_external_id: z.string().min(1, "Employee ID is required"),
    start_at: z.string().datetime({ message: "Invalid ISO start date" }),
    end_at: z.string().datetime({ message: "Invalid ISO end date" }),
    break_minutes: z
      .string()
      .optional()
      .transform((val) => {
        // Empty string or undefined treated as 0
        if (!val || val.trim() === "") return 0;
        const num = parseInt(val, 10);
        return isNaN(num) ? 0 : num;
      }),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_at).getTime();
      const end = new Date(data.end_at).getTime();
      return end > start;
    },
    {
      message: "End time must be after start time",
      path: ["end_at"], // Associate error with end_at field
    },
  );

export type ShiftCSVRow = z.infer<typeof ShiftCSVSchema>;
