"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getJob, JobDetail } from "@/lib/api";

interface Props {
  jobId: string | null;
}

interface ChartPoint {
  epoch: number;
  train_loss?: number;
  val_loss?: number;
  train_accuracy?: number;
  val_accuracy?: number;
  mae?: number;
  r2_score?: number;
  [key: string]: number | undefined;
}

function buildChartData(job: JobDetail): ChartPoint[] {
  const history = job.metric_history;
  const epochs = Math.max(
    ...Object.values(history).map((h) => h.length),
    0
  );
  return Array.from({ length: epochs }, (_, i) => {
    const point: ChartPoint = { epoch: i + 1 };
    for (const [key, values] of Object.entries(history)) {
      if (values[i] !== undefined) {
        (point as Record<string, number>)[key] = Number(values[i].value.toFixed(4));
      }
    }
    return point;
  });
}

export default function MetricsChart({ jobId }: Props) {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setChartData([]);
      return;
    }

    let active = true;

    const fetchData = async () => {
      try {
        const data = await getJob(jobId);
        if (!active) return;
        setJob(data);
        setChartData(buildChartData(data));
      } catch {
        // silently fail
      }
    };

    fetchData();
    const interval = setInterval(() => {
      if (job?.status !== "FINISHED") fetchData();
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [jobId]);

  if (!jobId) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 flex items-center justify-center h-64">
        <p className="text-gray-500 text-sm">Select a job to view metrics</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 flex items-center justify-center h-64">
        <p className="text-gray-500 text-sm">Loading metrics...</p>
      </div>
    );
  }

  const isRegression = "mae" in (job.metric_history || {});

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          {job.params?.model} — {job.params?.dataset}
        </h2>
        <div className="flex items-center gap-3">
          {job.status === "RUNNING" && (
            <span className="flex items-center gap-1.5 text-yellow-400 text-xs">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
              Live
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            job.status === "FINISHED"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : job.status === "RUNNING"
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
            {job.status}
          </span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 text-sm">Waiting for first epoch...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div>
            <p className="text-xs text-gray-400 mb-2">Loss</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="epoch" stroke="#6b7280" tick={{ fontSize: 11 }} label={{ value: "Epoch", position: "insideBottom", offset: -2, fill: "#6b7280", fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                {isRegression ? (
                  <Line type="monotone" dataKey="mae" stroke="#f59e0b" strokeWidth={2} dot={false} name="MAE" />
                ) : (
                  <>
                    <Line type="monotone" dataKey="train_loss" stroke="#3b82f6" strokeWidth={2} dot={false} name="Train Loss" />
                    <Line type="monotone" dataKey="val_loss" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Val Loss" />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {!isRegression && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Accuracy</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="epoch" stroke="#6b7280" tick={{ fontSize: 11 }} label={{ value: "Epoch", position: "insideBottom", offset: -2, fill: "#6b7280", fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }} formatter={(v) => typeof v === "number" ? `${(v * 100).toFixed(2)}%` : v} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line type="monotone" dataKey="train_accuracy" stroke="#10b981" strokeWidth={2} dot={false} name="Train Acc" />
                  <Line type="monotone" dataKey="val_accuracy" stroke="#f59e0b" strokeWidth={2} dot={false} name="Val Acc" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {isRegression && (
            <div>
              <p className="text-xs text-gray-400 mb-2">R² Score</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="epoch" stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} domain={[-1, 1]} />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line type="monotone" dataKey="r2_score" stroke="#10b981" strokeWidth={2} dot={false} name="R² Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(job.metrics).map(([key, value]) => (
          <div key={key} className="bg-gray-800 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">{key.replace("_", " ")}</p>
            <p className="text-white font-mono text-sm font-medium">
              {key.includes("accuracy") ? `${(value * 100).toFixed(2)}%` : value.toFixed(4)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
