"use client";

import { useState } from "react";
import JobForm from "@/components/JobForm";
import JobList from "@/components/JobList";
import MetricsChart from "@/components/MetricsChart";

export default function Home() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleJobSubmitted = (jobId: string) => {
    setSelectedJobId(jobId);
    setRefreshTrigger((n) => n + 1);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
              N
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg leading-none">Neuronix Lab</h1>
              <p className="text-gray-500 text-xs mt-0.5">ML Training Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-gray-400 text-xs">All systems operational</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <JobForm onJobSubmitted={handleJobSubmitted} />
          </div>
          <div className="lg:col-span-2">
            <JobList
              selectedJobId={selectedJobId}
              onSelectJob={setSelectedJobId}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>

        <MetricsChart jobId={selectedJobId} />
      </div>
    </main>
  );
}
