import { useEffect, useState } from "react";
import type { EmployeeSummary, Shift } from "../types";
import { api } from "../lib/api";
import { formatCurrency } from "../lib/utils";
import { format } from "date-fns";

interface Props {
  employee: EmployeeSummary | null;
  onClose: () => void;
}

export function EmployeeModal({ employee, onClose }: Props) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [totals, setTotals] = useState({ earnings: 0, hours: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setLoading(true);
      setShifts([]);
      setTotals({ earnings: 0, hours: 0 });

      api
        .getEmployeeShifts(employee.externalId, 7)
        .then((data) => {
          setShifts(data.shifts);
          setTotals({
            earnings: data.totals.totalEarningsCents,
            hours: data.totals.totalHours,
          });
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [employee]);

  if (!employee) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-sm text-gray-500">History (Last 7 Days)</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-white">
          <div className="bg-blue-50 p-4 rounded border border-blue-100 text-center">
            <div className="text-sm text-blue-600 font-medium">Total Pay</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(totals.earnings)}
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded border border-indigo-100 text-center">
            <div className="text-sm text-indigo-600 font-medium">
              Total Hours
            </div>
            <div className="text-2xl font-bold text-indigo-900">
              {totals.hours.toFixed(1)}h
            </div>
          </div>
        </div>

        {/* Shifts Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-10">Loading shifts...</div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No shifts found in this range.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-right">Hours</th>
                  <th className="px-4 py-2 text-right">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift.id} className="border-b">
                    <td className="px-4 py-3">
                      {format(new Date(shift.startAt), "EEE, MMM d")}
                    </td>
                    <td className="px-4 py-3">
                      {format(new Date(shift.startAt), "HH:mm")} -{" "}
                      {format(new Date(shift.endAt), "HH:mm")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(shift.workMinutes / 60).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(shift.earningsCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
