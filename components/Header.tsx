"use client";

import Link from "next/link";

interface HeaderProps {
  isAnalyzing: boolean;
  latency: number | null;
  onFullscreen: () => void;
}

export default function Header({ isAnalyzing, latency, onFullscreen }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-gray-900/80 border-b border-gray-800 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
            AI
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">AI SAFETY MONITOR</h1>
            <p className="text-[10px] text-gray-400 -mt-0.5 tracking-widest uppercase">
              Real-time Detection System
            </p>
          </div>
        </div>

        {isAnalyzing && (
          <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-green-900/30 border border-green-800/50 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400">LIVE</span>
          </div>
        )}

        {latency !== null && (
          <span className="text-xs text-gray-500 ml-2">
            {latency}ms
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          Manage Faces
        </Link>
        <button
          onClick={onFullscreen}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title="Fullscreen"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <div className="text-right">
          <span className="text-sm font-semibold text-blue-400">HERACX.AI</span>
        </div>
      </div>
    </header>
  );
}
