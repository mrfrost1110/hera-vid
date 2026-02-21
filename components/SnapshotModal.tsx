"use client";

import { AlertEvent } from "@/lib/types";

interface SnapshotModalProps {
  alert: AlertEvent;
  onClose: () => void;
}

const typeLabel: Record<string, { color: string; label: string }> = {
  compliant: { color: "text-green-400", label: "COMPLIANT" },
  violation: { color: "text-red-400", label: "VIOLATION" },
  warning: { color: "text-yellow-400", label: "WARNING" },
  critical: { color: "text-red-300", label: "CRITICAL" },
  info: { color: "text-blue-400", label: "INFO" },
  error: { color: "text-gray-400", label: "ERROR" },
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function SnapshotModal({ alert, onClose }: SnapshotModalProps) {
  const t = typeLabel[alert.type] || typeLabel.info;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full mx-4 bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold uppercase ${t.color}`}>{t.label}</span>
            <span className="text-xs text-gray-500 font-mono">{formatTime(alert.timestamp)}</span>
            <span className="text-[10px] text-gray-600 uppercase tracking-wider">{alert.mode} mode</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {alert.snapshot && (
          <div className="relative bg-black">
            <img
              src={alert.snapshot}
              alt="Detection snapshot"
              className="w-full object-contain max-h-[60vh]"
            />
            {alert.boxes && alert.boxes.length > 0 && (
              <div className="absolute inset-0">
                {alert.boxes.map((box) => {
                  const borderColor =
                    box.status === "violation" || box.status === "critical"
                      ? "#ef4444"
                      : box.status === "warning"
                        ? "#eab308"
                        : "#22c55e";
                  return (
                    <div
                      key={box.id}
                      className="absolute"
                      style={{
                        left: `${box.bbox.x}%`,
                        top: `${box.bbox.y}%`,
                        width: `${box.bbox.w}%`,
                        height: `${box.bbox.h}%`,
                        border: `2px solid ${borderColor}`,
                        borderRadius: "4px",
                      }}
                    >
                      <div
                        className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-bold rounded-sm whitespace-nowrap"
                        style={{ backgroundColor: borderColor, color: "#000" }}
                      >
                        #{box.id} {box.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-4 space-y-2">
          <p className="text-sm text-gray-200">{alert.message}</p>

          {alert.details && alert.details.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-gray-800">
              {alert.details.map((detail, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <span className="text-gray-600 mt-0.5">-</span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
