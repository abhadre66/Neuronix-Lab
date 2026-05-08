const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface JobRequest {
  model: string;
  dataset: string;
  epochs: number;
  learning_rate: number;
}

export interface Job {
  job_id: string;
  run_id: string;
  status: string;
  model: string | null;
  dataset: string | null;
  epochs: string | null;
  learning_rate: string | null;
  metrics: Record<string, number>;
  start_time: number | null;
  end_time: number | null;
}

export interface MetricPoint {
  step: number;
  value: number;
}

export interface JobDetail extends Job {
  params: Record<string, string>;
  metric_history: Record<string, MetricPoint[]>;
}

export async function submitJob(data: JobRequest): Promise<{ job_id: string; status: string }> {
  const res = await fetch(`${API_URL}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit job");
  return res.json();
}

export async function listJobs(): Promise<Job[]> {
  const res = await fetch(`${API_URL}/jobs`);
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export async function getJob(jobId: string): Promise<JobDetail> {
  const res = await fetch(`${API_URL}/jobs/${jobId}`);
  if (!res.ok) throw new Error("Job not found");
  return res.json();
}
