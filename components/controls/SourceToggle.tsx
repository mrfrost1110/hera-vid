"use client";

import { VideoSource } from "@/lib/types";

interface SourceToggleProps {
  source: VideoSource;
  onChange: (source: VideoSource) => void;
}

export default function SourceToggle({ source, onChange }: SourceToggleProps) {
  return (
    <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg p-0.5">
      <button
        onClick={() => onChange("webcam")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
          source === "webcam" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
        }`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Cam
      </button>
      <button
        onClick={() => onChange("video")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
          source === "video" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
        }`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
        File
      </button>
    </div>
  );
}
