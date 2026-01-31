import { z } from "zod";

// --- Employee Schema ---
export const EmployeeCSVSchema = z.object({
  external_id: z.string().min(1, "External ID is required"),
  first_name: z.string().optional().default(""),
  last_name: z.string().optional().default(""),
  email: z
    .string()
    .email()
    .nullable()
    .or(z.literal(""))
    .transform((v) => v?.toLowerCase() || null),
  hourly_rate: z.coerce.number().transform((v) => Math.round(v * 100)),
  active: z.coerce.boolean(),
});

export type EmployeeCSVRow = z.infer<typeof EmployeeCSVSchema>;

// --- Shift Schema ---
export const ShiftCSVSchema = z
  .object({
    external_id: z.string().min(1, "External ID is required"),
    employee_external_id: z.string().min(1, "Employee ID is required"),
    start_at: z.string().datetime(),
    end_at: z.string().datetime(),
    break_minutes: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? 0 : val),
      z.coerce.number().int().nonnegative(),
    ),
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
