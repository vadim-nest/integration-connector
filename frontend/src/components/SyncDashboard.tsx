import { useState, useEffect } from "react";
import { api } from "../lib/api";
import type { SyncRun } from "../types";
import { formatDistanceToNow } from "date-fns";

export function SyncDashboard({
  onSyncComplete,
}: {
  onSyncComplete: () => void;
}) {
  const [lastRun, setLastRun] = useState<SyncRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRuns = async () => {
    try {
      const runs = await api.getSyncRuns();
      if (runs.length > 0) setLastRun(runs[0]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleSync = async (source: "file" | "api") => {
    setLoading(true);
    setError("");
    try {
      await api.triggerSync(source); // Passes 'file' or 'api'
      await fetchRuns();
      onSyncComplete();
    } catch (err) {
      setError(`Failed to trigger ${source} sync`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">System Status</h2>
          {lastRun ? (
            <div className="mt-2 text-sm text-gray-600">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  lastRun.status === "SUCCESS"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {lastRun.status}
              </span>
              <span className="ml-3">
                Last run:{" "}
                {formatDistanceToNow(new Date(lastRun.startedAt), {
                  addSuffix: true,
                })}
              </span>
              <div className="mt-1 text-xs text-gray-500">
                Source: <span className="font-bold">{lastRun.source}</span> |
                Processed: {lastRun.recordsInserted} inserted...
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">
              No sync history available.
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleSync("file")}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? "Syncing..." : "Sync from File"}
          </button>

          <button
            onClick={() => handleSync("api")}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? "Syncing..." : "Sync from API"}
          </button>
        </div>
      </div>
    </div>
  );
}
