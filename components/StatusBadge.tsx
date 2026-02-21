"use client";

type StatusType = "compliant" | "violation" | "warning" | "critical" | "analyzing" | "idle" | "no_person";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  large?: boolean;
}

const config: Record<StatusType, { bg: string; text: string; border: string; dot: string; defaultLabel: string }> = {
  compliant: {
    bg: "bg-green-900/40",
    text: "text-green-400",
    border: "border-green-700/60",
    dot: "bg-green-500",
    defaultLabel: "COMPLIANT",
  },
  violation: {
    bg: "bg-red-900/40",
    text: "text-red-400",
    border: "border-red-700/60",
    dot: "bg-red-500",
    defaultLabel: "VIOLATION DETECTED",
  },
  warning: {
    bg: "bg-yellow-900/40",
    text: "text-yellow-400",
    border: "border-yellow-700/60",
    dot: "bg-yellow-500",
    defaultLabel: "WARNING",
  },
  critical: {
    bg: "bg-red-900/60",
    text: "text-red-300",
    border: "border-red-600/80",
    dot: "bg-red-400",
    defaultLabel: "CRITICAL",
  },
  analyzing: {
    bg: "bg-blue-900/30",
    text: "text-blue-400",
    border: "border-blue-700/50",
    dot: "bg-blue-500",
    defaultLabel: "ANALYZING...",
  },
  idle: {
    bg: "bg-gray-800/50",
    text: "text-gray-400",
    border: "border-gray-700/50",
    dot: "bg-gray-500",
    defaultLabel: "STANDBY",
  },
  no_person: {
    bg: "bg-gray-800/50",
    text: "text-gray-400",
    border: "border-gray-700/50",
    dot: "bg-gray-500",
    defaultLabel: "NO PERSONS DETECTED",
  },
};

export default function StatusBadge({ status, label, large }: StatusBadgeProps) {
  const c = config[status];
  const isAlert = status === "violation" || status === "critical";

  return (
    <div
      className={`
        relative inline-flex items-center gap-2 px-4 py-2 rounded-xl border
        ${c.bg} ${c.text} ${c.border}
        ${large ? "text-base font-bold" : "text-sm font-semibold"}
        ${isAlert ? "alert-pulse " + status : ""}
      `}
    >
      <div className={`w-2.5 h-2.5 rounded-full ${c.dot} ${status === "analyzing" ? "animate-pulse" : ""}`} />
      {label || c.defaultLabel}
    </div>
  );
}
