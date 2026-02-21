"use client";

import { AnalysisStats } from "@/lib/types";

interface StatsBarProps {
  stats: AnalysisStats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const items = [
    {
      label: "Frames Analyzed",
      value: stats.totalAnalyzed,
      color: "text-blue-400",
      bg: "bg-blue-900/30",
      border: "border-blue-800/50",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      label: "Compliant",
      value: stats.compliant,
      color: "text-green-400",
      bg: "bg-green-900/30",
      border: "border-green-800/50",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Violations",
      value: stats.violations,
      color: "text-red-400",
      bg: "bg-red-900/30",
      border: "border-red-800/50",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
    },
    {
      label: "Fatigue Alerts",
      value: stats.fatigueAlerts,
      color: "text-yellow-400",
      bg: "bg-yellow-900/30",
      border: "border-yellow-800/50",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl ${item.bg} border ${item.border}`}
        >
          <div className={item.color}>{item.icon}</div>
          <div>
            <div className={`text-xl font-bold tabular-nums ${item.color}`}>
              {item.value}
            </div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider">
              {item.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
