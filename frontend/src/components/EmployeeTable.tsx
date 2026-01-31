import type { EmployeeSummary } from "../types";
import { formatCurrency } from "../lib/utils";
import { format } from "date-fns";

interface Props {
  employees: EmployeeSummary[];
  onSelect: (emp: EmployeeSummary) => void;
  loading: boolean;
}

export function EmployeeTable({ employees, onSelect, loading }: Props) {
  if (loading)
    return <div className="text-center py-10">Loading workforce data...</div>;

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Shift
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              7-Day Earnings
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {employees.map((emp) => (
            <tr
              key={emp.id}
              onClick={() => onSelect(emp)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {emp.firstName} {emp.lastName}
                </div>
                <div className="text-xs text-gray-500">{emp.externalId}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {emp.email || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    emp.active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {emp.active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {emp.lastShiftEndAt
                  ? format(new Date(emp.lastShiftEndAt), "MMM d, HH:mm")
                  : "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                {formatCurrency(emp.totalEarningsCentsLast7Days)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
