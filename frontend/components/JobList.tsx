"use client";

import { useEffect, useState } from "react";
import { listJobs, Job } from "@/lib/api";

interface Props {
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  refreshTrigger: number;
}

const STATUS_COLORS: Record<string, string> = {
  RUNNING: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  FINISHED: "bg-green-500/20 text-green-400 border border-green-500/30",
  FAILED: "bg-red-500/20 text-red-400 border border-red-500/30",
};

function formatTime(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleTimeString();
}

function formatAccuracy(metrics: Record<string, number>): string {
  const acc = metrics["val_accuracy"] ?? metrics["train_accuracy"];
  if (acc == null) return "—";
  return `${(acc * 100).toFixed(1)}%`;
}

export default function JobList({ selectedJobId, onSelectJob, refreshTrigger }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const data = await listJobs();
      setJobs(data);
    } catch {
      // silently fail, will retry
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [refreshTrigger]);

  useEffect(() => {
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Training Jobs</h2>
        <span className="text-xs text-gray-500">{jobs.length} runs</span>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-gray-500 text-sm">No jobs yet. Submit one to get started.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {jobs.map((job) => (
            <div
              key={job.job_id}
              onClick={() => onSelectJob(job.job_id)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                selectedJobId === job.job_id
                  ? "bg-blue-600/20 border border-blue-500/40"
                  : "bg-gray-800 hover:bg-gray-750 border border-transparent"
              }`}
            >
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-white text-sm font-medium truncate">
                  {job.model} → {job.dataset}
                </span>
                <span className="text-gray-500 text-xs">
                  {formatTime(job.start_time)}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                <span className="text-gray-400 text-xs font-mono">
                  {formatAccuracy(job.metrics)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[job.status] ?? "bg-gray-700 text-gray-400"}`}>
                  {job.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
