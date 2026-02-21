"use client";

import { ModelOption, MODEL_OPTIONS } from "@/lib/types";

interface ModelSelectorProps {
  selected: ModelOption;
  onChange: (model: ModelOption) => void;
}

const providerColor: Record<string, string> = {
  byteplus: "bg-cyan-600",
  openrouter: "bg-orange-600",
};

export default function ModelSelector({ selected, onChange }: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg p-0.5">
      {MODEL_OPTIONS.map((m) => (
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
