"use client";

import { AnalysisPipeline, ModelOption, YOLO_MODEL_OPTIONS, LLM_MODEL_OPTIONS } from "@/lib/types";

interface ModelSelectorProps {
  selected: ModelOption;
  onChange: (model: ModelOption) => void;
  pipeline: AnalysisPipeline;
}

const providerColor: Record<string, string> = {
  local: "bg-green-600",
  byteplus: "bg-cyan-600",
  openrouter: "bg-orange-600",
};

export default function ModelSelector({ selected, onChange, pipeline }: ModelSelectorProps) {
  const options = pipeline === "yolov8" ? YOLO_MODEL_OPTIONS : LLM_MODEL_OPTIONS;

  return (
    <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg p-0.5">
      {options.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
            selected.id === m.id
              ? `${providerColor[m.provider]} text-white`
              : "text-gray-400 hover:text-white"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
