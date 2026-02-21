"use client";

import { useState, useCallback, useRef } from "react";
import {
  DetectionMode,
  DetectionBox,
  ModelOption,
  MODEL_OPTIONS,
  AlertEvent,
  AnalysisStats,
  AnalyzeResponse,
  HelmetResult,
  FatigueResult,
  CombinedResult,
} from "@/lib/types";
import { useAudioAlert } from "./useAudioAlert";

export type OverallStatus =
  | "compliant"
  | "violation"
  | "warning"
  | "critical"
  | "analyzing"
  | "idle"
  | "no_person";

const INITIAL_STATS: AnalysisStats = {
  totalAnalyzed: 0,
  compliant: 0,
  violations: 0,
  fatigueAlerts: 0,
};

export function useAnalysis() {
  const [mode, setMode] = useState<DetectionMode>("helmet");
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODEL_OPTIONS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [stats, setStats] = useState<AnalysisStats>(INITIAL_STATS);
  const [overallStatus, setOverallStatus] = useState<OverallStatus>("idle");
  const [statusLabel, setStatusLabel] = useState("");
  const [latency, setLatency] = useState<number | null>(null);
  const [detectionBoxes, setDetectionBoxes] = useState<DetectionBox[]>([]);

  const processingRef = useRef(false);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const modelRef = useRef(selectedModel);
  modelRef.current = selectedModel;

  const { playBeep, setEnabled: setAudioEnabled } = useAudioAlert();

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      setAudioEnabled(!prev);
      return !prev;
    });
  }, [setAudioEnabled]);

  const addAlert = useCallback(
    (
      type: AlertEvent["type"],
      message: string,
      snapshot?: string,
      details?: string[],
      boxes?: DetectionBox[]
    ) => {
      const alert: AlertEvent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date(),
        type,
        message,
        mode: modeRef.current,
        snapshot,
        details,
        boxes,
      };
      setAlerts((prev) => [alert, ...prev].slice(0, 100));
    },
    []
  );

  const processHelmetResult = useCallback(
    (data: HelmetResult, frame: string) => {
      const a = data.frame_analysis;

      // Extract bounding boxes
      const boxes: DetectionBox[] = (a.persons || [])
        .filter((p) => p.bbox)
        .map((p) => ({
          id: p.id,
          bbox: p.bbox!,
          label: p.wearing_helmet ? "Helmet OK" : "NO HELMET",
          status: p.wearing_helmet ? ("safe" as const) : ("violation" as const),
        }));
      setDetectionBoxes(boxes);

      const details = (a.persons || []).map(
        (p) => `#${p.id}: ${p.description} (${Math.round(p.confidence * 100)}%)`
      );

      setStats((prev) => ({
        ...prev,
        totalAnalyzed: prev.totalAnalyzed + 1,
        compliant: prev.compliant + (a.overall_status === "COMPLIANT" ? 1 : 0),
        violations: prev.violations + (a.violations_count || 0),
      }));

      if (a.overall_status === "NO_PERSONS_DETECTED") {
        setOverallStatus("no_person");
        setStatusLabel("NO PERSONS DETECTED");
        setDetectionBoxes([]);
      } else if (a.overall_status === "VIOLATION_DETECTED") {
        setOverallStatus("violation");
        setStatusLabel(`${a.violations_count} VIOLATION${a.violations_count > 1 ? "S" : ""}`);
        addAlert("violation", a.alert_message || `${a.violations_count} worker(s) without helmet`, frame, details, boxes);
        playBeep("violation");
      } else {
        setOverallStatus("compliant");
        setStatusLabel(`${a.total_persons} COMPLIANT`);
        addAlert("compliant", `All ${a.total_persons} worker(s) wearing helmets`, undefined, details, boxes);
      }
    },
    [addAlert, playBeep]
  );

  const processFatigueResult = useCallback(
    (data: FatigueResult, frame: string) => {
      const a = data.frame_analysis;

      // Extract face bounding box
      const boxes: DetectionBox[] = [];
      if (a.face_detected && a.bbox) {
        const level = a.alert_level;
        boxes.push({
          id: 1,
          bbox: a.bbox,
          label: level === "CRITICAL" ? "DROWSY" : level === "WARNING" ? "FATIGUE" : "Alert",
          status: level === "CRITICAL" ? "critical" : level === "WARNING" ? "warning" : "safe",
        });
      }
      setDetectionBoxes(boxes);

      const details: string[] = [];
      if (a.face_detected) {
        const f = a.fatigue_assessment;
        details.push(`Eyes: ${f.eye_state}, Mouth: ${f.mouth_state}, Head: ${f.head_position}`);
        details.push(`Alertness: ${f.overall_alertness}, Score: ${f.fatigue_score}/100`);
        if (a.recommendation) details.push(a.recommendation);
      }

      setStats((prev) => ({
        ...prev,
        totalAnalyzed: prev.totalAnalyzed + 1,
        fatigueAlerts: prev.fatigueAlerts + (a.alert_level !== "NORMAL" ? 1 : 0),
        compliant: prev.compliant + (a.alert_level === "NORMAL" ? 1 : 0),
      }));

      if (!a.face_detected) {
        setOverallStatus("no_person");
        setStatusLabel("NO FACE DETECTED");
        setDetectionBoxes([]);
        addAlert("info", "No face detected in frame");
      } else if (a.alert_level === "CRITICAL") {
        setOverallStatus("critical");
        setStatusLabel(`CRITICAL — Score ${a.fatigue_assessment.fatigue_score}`);
        addAlert("critical", a.alert_message || "Critical fatigue detected!", frame, details, boxes);
        playBeep("violation");
      } else if (a.alert_level === "WARNING") {
        setOverallStatus("warning");
        setStatusLabel(`WARNING — Score ${a.fatigue_assessment.fatigue_score}`);
        addAlert("warning", a.alert_message || "Worker showing fatigue signs", frame, details, boxes);
        playBeep("warning");
      } else {
        setOverallStatus("compliant");
        setStatusLabel("ALERT & FOCUSED");
        addAlert("compliant", a.recommendation || "Worker appears alert", undefined, details, boxes);
      }
    },
    [addAlert, playBeep]
  );

  const processCombinedResult = useCallback(
    (data: CombinedResult, frame: string) => {
      const s = data.frame_analysis.summary;

      // Extract bounding boxes
      const boxes: DetectionBox[] = (data.frame_analysis.detections || [])
        .filter((d) => d.bbox)
        .map((d) => {
          const statusMap: Record<string, "safe" | "violation" | "warning" | "critical"> = {
            SAFE: "safe",
            HELMET_VIOLATION: "violation",
            FATIGUE_WARNING: "warning",
            MULTIPLE_VIOLATIONS: "critical",
          };
          return {
            id: d.id,
            bbox: d.bbox!,
            label: d.description || d.status,
            status: statusMap[d.status] || "safe",
          };
        });
      setDetectionBoxes(boxes);

      const details = (data.frame_analysis.detections || []).map(
        (d) => `#${d.id}: ${d.description} — ${d.status}`
      );

      setStats((prev) => ({
        ...prev,
        totalAnalyzed: prev.totalAnalyzed + 1,
        violations: prev.violations + (s.helmet_violations || 0),
        fatigueAlerts: prev.fatigueAlerts + (s.fatigue_warnings || 0),
        compliant: prev.compliant + (s.overall_status === "ALL_CLEAR" ? 1 : 0),
      }));

      if (data.frame_analysis.total_persons === 0) {
        setOverallStatus("no_person");
        setStatusLabel("NO PERSONS DETECTED");
        setDetectionBoxes([]);
      } else if (s.overall_status === "IMMEDIATE_ACTION") {
        setOverallStatus("critical");
        setStatusLabel("IMMEDIATE ACTION");
        addAlert("critical", `${s.helmet_violations} helmet, ${s.fatigue_warnings} fatigue`, frame, details, boxes);
        playBeep("violation");
      } else if (s.overall_status === "ATTENTION_NEEDED") {
        setOverallStatus("warning");
        const parts: string[] = [];
        if (s.helmet_violations > 0) parts.push(`${s.helmet_violations} helmet`);
        if (s.fatigue_warnings > 0) parts.push(`${s.fatigue_warnings} fatigue`);
        setStatusLabel(`ATTENTION — ${parts.join(", ")}`);
        addAlert("warning", `Attention: ${parts.join(", ")}`, frame, details, boxes);
        playBeep("warning");
      } else {
        setOverallStatus("compliant");
        setStatusLabel("ALL CLEAR");
        addAlert("compliant", `All ${data.frame_analysis.total_persons} worker(s) safe`, undefined, details, boxes);
      }
    },
    [addAlert, playBeep]
  );

  const handleFrameCapture = useCallback(
    async (frame: string) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setOverallStatus("analyzing");
      setStatusLabel("ANALYZING...");

      const currentMode = modeRef.current;
      const currentModel = modelRef.current;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

      try {
        const start = Date.now();
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frame,
            mode: currentMode,
            model: currentModel.id,
            provider: currentModel.provider,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const result: AnalyzeResponse = await res.json();
        setLatency(Date.now() - start);

        if (!result.success || !result.data) {
          setOverallStatus("idle");
          setStatusLabel("ANALYSIS ERROR");
          addAlert("error", result.error || "Analysis failed");
          return;
        }

        switch (currentMode) {
          case "helmet":
            processHelmetResult(result.data as HelmetResult, frame);
            break;
          case "fatigue":
            processFatigueResult(result.data as FatigueResult, frame);
            break;
          case "combined":
            processCombinedResult(result.data as CombinedResult, frame);
            break;
        }
      } catch (err: unknown) {
        clearTimeout(timeout);
        const isAbort = err instanceof DOMException && err.name === "AbortError";
        setOverallStatus("idle");
        setStatusLabel(isAbort ? "API TIMEOUT" : "CONNECTION ERROR");
        addAlert("error", isAbort ? "API timeout (>45s)" : "Network error");
      } finally {
        processingRef.current = false;
      }
    },
    [addAlert, processHelmetResult, processFatigueResult, processCombinedResult]
  );

  const toggleAnalysis = useCallback(() => {
    if (!isAnalyzing) {
      setStats(INITIAL_STATS);
      setAlerts([]);
      setDetectionBoxes([]);
      setOverallStatus("analyzing");
      setStatusLabel("STARTING...");
    } else {
      setOverallStatus("idle");
      setStatusLabel("");
      setLatency(null);
      setDetectionBoxes([]);
    }
    setIsAnalyzing((prev) => !prev);
  }, [isAnalyzing]);

  return {
    mode,
    selectedModel,
    isAnalyzing,
    soundEnabled,
    alerts,
    stats,
    overallStatus,
    statusLabel,
    latency,
    detectionBoxes,
    setMode,
    setSelectedModel,
    toggleSound,
    toggleAnalysis,
    handleFrameCapture,
  };
}
