"use client";

import { useState } from "react";
import { AlertEvent } from "@/lib/types";
import SnapshotModal from "./SnapshotModal";

interface AlertFeedProps {
  alerts: AlertEvent[];
}

const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  compliant: { icon: "\u2713", color: "text-green-400", bg: "bg-green-900/20" },
  violation: { icon: "!", color: "text-red-400", bg: "bg-red-900/20" },
  warning: { icon: "\u26A0", color: "text-yellow-400", bg: "bg-yellow-900/20" },
  critical: { icon: "\u2718", color: "text-red-300", bg: "bg-red-900/30" },
  info: { icon: "i", color: "text-blue-400", bg: "bg-blue-900/20" },
  error: { icon: "x", color: "text-gray-400", bg: "bg-gray-800/30" },
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AlertFeed({ alerts }: AlertFeedProps) {
  const [selectedAlert, setSelectedAlert] = useState<AlertEvent | null>(null);

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Alert Feed
          </h3>
          <span className="text-xs text-gray-500">{alerts.length} events</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
          {alerts.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              No alerts yet — start analysis to detect events
            </div>
          )}

          {alerts.map((alert) => {
            const cfg = typeConfig[alert.type] || typeConfig.info;
            const hasSnapshot = !!alert.snapshot;

            return (
              <div
                key={alert.id}
                className={`animate-fade-in flex gap-3 p-3 rounded-lg ${cfg.bg} border border-gray-800/50 ${
                  hasSnapshot ? "cursor-pointer hover:border-gray-600 transition-colors" : ""
                }`}
                onClick={hasSnapshot ? () => setSelectedAlert(alert) : undefined}
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${cfg.color} bg-gray-900/50`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-mono tabular-nums">
                      {formatTime(alert.timestamp)}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider ${cfg.color}`}>
                      {alert.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-0.5 truncate">
                    {alert.message}
                  </p>
                  {alert.details && alert.details.length > 0 && (
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {alert.details[0]}
                    </p>
                  )}
                </div>
                {alert.snapshot && (
                  <div className="relative flex-shrink-0">
                    <img
                      src={alert.snapshot}
                      alt="snapshot"
                      className="w-14 h-10 rounded object-cover border border-gray-700"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded opacity-0 hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedAlert && (
        <SnapshotModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </>
  );
}
