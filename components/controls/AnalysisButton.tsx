"use client";

interface AnalysisButtonProps {
  isAnalyzing: boolean;
  onToggle: () => void;
}

export default function AnalysisButton({ isAnalyzing, onToggle }: AnalysisButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        isAnalyzing
          ? "bg-red-600 hover:bg-red-700 text-white"
          : "bg-green-600 hover:bg-green-700 text-white"
      }`}
    >
      {isAnalyzing ? (
        <>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Stop
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Start
        </>
      )}
    </button>
  );
}
