"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { DetectionBox, BBox } from "@/lib/types";

interface DetectionOverlayProps {
  boxes: DetectionBox[];
}

const statusColors: Record<string, { border: string; bg: string; text: string }> = {
  safe: { border: "#22c55e", bg: "rgba(34,197,94,0.12)", text: "#22c55e" },
  violation: { border: "#ef4444", bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
  warning: { border: "#eab308", bg: "rgba(234,179,8,0.12)", text: "#eab308" },
  critical: { border: "#f87171", bg: "rgba(248,113,113,0.18)", text: "#f87171" },
};

function bboxCenter(b: BBox): [number, number] {
  return [b.x + b.w / 2, b.y + b.h / 2];
}

function bboxDist(a: BBox, b: BBox): number {
  const [ax, ay] = bboxCenter(a);
  const [bx, by] = bboxCenter(b);
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

interface TrackedBox {
  trackId: number;
  bbox: BBox;
  targetBbox: BBox;
  vx: number;
  vy: number;
  vw: number;
  vh: number;
  id: number;
  label: string;
  status: "safe" | "violation" | "warning" | "critical";
  lastUpdate: number;
}

let nextTrackId = 1;

export default function DetectionOverlay({ boxes }: DetectionOverlayProps) {
  const trackedRef = useRef<TrackedBox[]>([]);
  const [renderBoxes, setRenderBoxes] = useState<TrackedBox[]>([]);
  const rafRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);

  useEffect(() => {
    const now = performance.now();
    const prev = trackedRef.current;

    if (boxes.length === 0) {
      trackedRef.current = [];
      setRenderBoxes([]);
      return;
    }

    const matched = new Set<number>();
    const result: TrackedBox[] = [];

    for (const box of boxes) {
      if (!box.bbox) continue;

      let bestIdx = -1;
      let bestDist = 30;

      for (let i = 0; i < prev.length; i++) {
        if (matched.has(i)) continue;
        const d = bboxDist(box.bbox, prev[i].targetBbox);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }

      if (bestIdx >= 0) {
        matched.add(bestIdx);
        const old = prev[bestIdx];
        const dt = (now - old.lastUpdate) / 1000;
        const safedt = dt > 0.1 ? dt : 1;

        const vx = (box.bbox.x - old.targetBbox.x) / safedt;
        const vy = (box.bbox.y - old.targetBbox.y) / safedt;
        const vw = (box.bbox.w - old.targetBbox.w) / safedt;
        const vh = (box.bbox.h - old.targetBbox.h) / safedt;

        result.push({
          trackId: old.trackId,
          bbox: { ...old.bbox },
          targetBbox: { ...box.bbox },
          vx, vy, vw, vh,
          id: box.id,
          label: box.label,
          status: box.status,
          lastUpdate: now,
        });
      } else {
        result.push({
          trackId: nextTrackId++,
          bbox: { ...box.bbox },
          targetBbox: { ...box.bbox },
          vx: 0, vy: 0, vw: 0, vh: 0,
          id: box.id,
          label: box.label,
          status: box.status,
          lastUpdate: now,
        });
      }
    }

    trackedRef.current = result;
    setRenderBoxes(result.map((b) => ({ ...b, bbox: { ...b.bbox } })));
  }, [boxes]);

  const animate = useCallback(() => {
    const now = performance.now();
    const dt = lastFrameTime.current ? (now - lastFrameTime.current) / 1000 : 0.016;
    lastFrameTime.current = now;

    const tracked = trackedRef.current;
    if (tracked.length === 0) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    let changed = false;
    for (const box of tracked) {
      const timeSinceUpdate = (now - box.lastUpdate) / 1000;

      const predictedX = box.targetBbox.x + box.vx * timeSinceUpdate;
      const predictedY = box.targetBbox.y + box.vy * timeSinceUpdate;
      const predictedW = box.targetBbox.w + box.vw * timeSinceUpdate;
      const predictedH = box.targetBbox.h + box.vh * timeSinceUpdate;

      const lerpSpeed = 8;
      const lerp = 1 - Math.exp(-lerpSpeed * dt);

      const newX = box.bbox.x + (predictedX - box.bbox.x) * lerp;
      const newY = box.bbox.y + (predictedY - box.bbox.y) * lerp;
      const newW = box.bbox.w + (predictedW - box.bbox.w) * lerp;
      const newH = box.bbox.h + (predictedH - box.bbox.h) * lerp;

      box.bbox.x = Math.max(0, Math.min(95, newX));
      box.bbox.y = Math.max(0, Math.min(95, newY));
      box.bbox.w = Math.max(2, Math.min(100 - box.bbox.x, newW));
      box.bbox.h = Math.max(2, Math.min(100 - box.bbox.y, newH));

      if (timeSinceUpdate > 2) {
        box.vx *= 0.95;
        box.vy *= 0.95;
        box.vw *= 0.95;
        box.vh *= 0.95;
      }

      changed = true;
    }

    if (changed) {
      setRenderBoxes(tracked.map((b) => ({ ...b, bbox: { ...b.bbox } })));
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  if (renderBoxes.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {renderBoxes.map((box) => {
        const c = statusColors[box.status] || statusColors.safe;
        return (
          <div
            key={box.trackId}
            className="absolute"
            style={{
              left: `${box.bbox.x}%`,
              top: `${box.bbox.y}%`,
              width: `${box.bbox.w}%`,
              height: `${box.bbox.h}%`,
              border: `2px solid ${c.border}`,
              backgroundColor: c.bg,
              borderRadius: "4px",
            }}
          >
            <div
              className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-bold rounded-sm whitespace-nowrap"
              style={{ backgroundColor: c.border, color: "#000" }}
            >
              #{box.id} {box.label}
            </div>

            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: c.border }} />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: c.border }} />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: c.border }} />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: c.border }} />
          </div>
        );
      })}
    </div>
  );
}
