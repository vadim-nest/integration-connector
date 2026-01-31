import { useState, useEffect } from "react";
import { SyncDashboard } from "./components/SyncDashboard";
import { EmployeeTable } from "./components/EmployeeTable";
import { EmployeeModal } from "./components/EmployeeModal";
import { api } from "./lib/api";
import type { EmployeeSummary } from "./types";

function App() {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error("Failed to load employees", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Workforce Integration
          </h1>
          <p className="mt-1 text-gray-500">
            Sync status and employee earnings report
          </p>
        </header>

        {/* Dashboard Block */}
        <SyncDashboard onSyncComplete={loadData} />

        {/* Main Content */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Employee Directory
          </h2>
          <EmployeeTable
            employees={employees}
            loading={loading}
            onSelect={setSelectedEmployee}
          />
        </div>
      </div>

      {/* Details Modal */}
      {selectedEmployee && (
        <EmployeeModal
          key={selectedEmployee.externalId}
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}

export default App;
