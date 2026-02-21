"use client";

import { DetectionMode } from "@/lib/types";

interface ModeToggleProps {
  mode: DetectionMode;
  onChange: (mode: DetectionMode) => void;
}

const modes: { value: DetectionMode; label: string }[] = [
  { value: "helmet", label: "Helmet" },
  { value: "fatigue", label: "Fatigue" },
  { value: "combined", label: "Both" },
];

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg p-0.5">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
            mode === m.value ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
