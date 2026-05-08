"use client";

import { useState } from "react";
import { submitJob, JobRequest } from "@/lib/api";

const IMAGE_MODELS = ["mlp", "cnn", "resnet18", "mobilenet", "efficientnet"];
const TEXT_MODELS = ["bert-tiny", "distilbert"];
const REGRESSION_MODELS = ["mlp-regressor"];

const IMAGE_DATASETS = ["cifar10", "mnist"];
const TEXT_DATASETS = ["sst2"];
const REGRESSION_DATASETS = ["custom_csv"];

interface Props {
  onJobSubmitted: (jobId: string) => void;
}

export default function JobForm({ onJobSubmitted }: Props) {
  const [model, setModel] = useState("cnn");
  const [dataset, setDataset] = useState("cifar10");
  const [epochs, setEpochs] = useState(5);
  const [learningRate, setLearningRate] = useState(0.001);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const modelType = IMAGE_MODELS.includes(model)
    ? "image"
    : TEXT_MODELS.includes(model)
    ? "text"
    : "regression";

  const availableDatasets =
    modelType === "image"
      ? IMAGE_DATASETS
      : modelType === "text"
      ? TEXT_DATASETS
      : REGRESSION_DATASETS;

  const handleModelChange = (m: string) => {
    setModel(m);
    const type = IMAGE_MODELS.includes(m)
      ? "image"
      : TEXT_MODELS.includes(m)
      ? "text"
      : "regression";
    setDataset(
      type === "image" ? "cifar10" : type === "text" ? "sst2" : "custom_csv"
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload: JobRequest = {
        model,
        dataset,
        epochs,
        learning_rate: learningRate,
      };
      const res = await submitJob(payload);
      onJobSubmitted(res.job_id);
    } catch (err) {
      setError("Failed to submit job. Is the API running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Submit Training Job</h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="text-sm text-gray-400 block mb-1">Model</label>
          <select
            value={model}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <optgroup label="Image Classification">
              {IMAGE_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </optgroup>
            <optgroup label="Text Classification">
              {TEXT_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </optgroup>
            <optgroup label="Regression">
              {REGRESSION_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </optgroup>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-1">Dataset</label>
          <select
            value={dataset}
            onChange={(e) => setDataset(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            {availableDatasets.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-1">
            Epochs — <span className="text-white">{epochs}</span>
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={epochs}
            onChange={(e) => setEpochs(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span><span>20</span>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-1">
            Learning Rate — <span className="text-white">{learningRate}</span>
          </label>
          <input
            type="range"
            min={0.0001}
            max={0.01}
            step={0.0001}
            value={learningRate}
            onChange={(e) => setLearningRate(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.0001</span><span>0.01</span>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
        >
          {loading ? "Submitting..." : "Submit Job"}
        </button>
      </form>
    </div>
  );
}
