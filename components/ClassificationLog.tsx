"use client";

import { DetectionBox, PPEItem } from "@/lib/types";

interface ClassificationLogProps {
  boxes: DetectionBox[];
  sceneSummary: string;
}

const ppeKeys = ["helmet", "vest", "gloves", "goggles", "safety_shoes"] as const;

function PPEDot({ item }: { item: PPEItem | undefined }) {
  if (!item) return <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />;
  if (item.present === true) return <span className="w-2.5 h-2.5 rounded-full bg-green-500" />;
  if (item.present === false) return <span className="w-2.5 h-2.5 rounded-full bg-red-500" />;
  return <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />;
}

function StatusBadge({ status }: { status: DetectionBox["status"] }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    safe: { bg: "bg-green-900/30", text: "text-green-400", label: "Safe" },
    violation: { bg: "bg-red-900/30", text: "text-red-400", label: "Violation" },
    warning: { bg: "bg-yellow-900/30", text: "text-yellow-400", label: "Warning" },
    critical: { bg: "bg-red-900/40", text: "text-red-300", label: "Critical" },
  };
  const c = cfg[status] || cfg.safe;
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function PersonCard({ box }: { box: DetectionBox }) {
  const cls = box.classification;

  return (
    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-200">Person #{box.id}</span>
        <StatusBadge status={box.status} />
      </div>

      {cls ? (
        <>
          {cls.activity && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Activity</span>
              <p className="text-xs text-gray-300">{cls.activity}</p>
            </div>
          )}

          {cls.ppe && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500">PPE</span>
              <div className="grid grid-cols-5 gap-1.5 mt-1">
                {ppeKeys.map((key) => {
                  const item = cls.ppe?.[key];
                  return (
                    <div key={key} className="flex flex-col items-center gap-0.5">
                      <PPEDot item={item} />
                      <span className="text-[9px] text-gray-500 leading-tight text-center">
                        {key.replace(/_/g, " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {cls.equipment && cls.equipment.length > 0 && cls.equipment[0] !== "none" && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Equipment</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {cls.equipment.map((item, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-gray-700/50 text-[10px] text-gray-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cls.clothing && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Clothing</span>
              <p className="text-xs text-gray-300">
                <span className={cls.clothing.compliant ? "text-green-400" : "text-red-400"}>
                  {cls.clothing.compliant ? "Compliant" : "Non-compliant"}
                </span>
                {cls.clothing.description && ` — ${cls.clothing.description}`}
              </p>
            </div>
          )}

          {cls.summary && (
            <p className="text-xs text-gray-400 italic border-t border-gray-700/50 pt-2">
              {cls.summary}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-gray-500">No classification data</p>
      )}
    </div>
  );
}

export default function ClassificationLog({ boxes, sceneSummary }: ClassificationLogProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {boxes.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            No detections — start analysis to see classification details
          </div>
        )}

        {boxes.map((box) => (
          <PersonCard key={box.id} box={box} />
        ))}
      </div>

      {sceneSummary && (
        <div className="px-3 py-2 border-t border-gray-800 bg-gray-900/50">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Scene Summary</span>
          <p className="text-xs text-gray-300 mt-0.5">{sceneSummary}</p>
        </div>
      )}
    </div>
  );
}
