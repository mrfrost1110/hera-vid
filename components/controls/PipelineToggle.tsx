"use client";

import { AnalysisPipeline } from "@/lib/types";

interface PipelineToggleProps {
  pipeline: AnalysisPipeline;
  onChange: (pipeline: AnalysisPipeline) => void;
}

export default function PipelineToggle({ pipeline, onChange }: PipelineToggleProps) {
  return (
    <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg p-0.5">
      <button
        onClick={() => onChange("yolov8")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
          pipeline === "yolov8" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"
        }`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        YOLOv8
      </button>
      <button
        onClick={() => onChange("llm")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
          pipeline === "llm" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
        }`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
        LLM
      </button>
    </div>
  );
}
