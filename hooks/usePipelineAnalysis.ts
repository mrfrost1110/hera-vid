"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  AnalysisPipeline,
  DetectionMode,
  DetectionBox,
  ModelOption,
  YOLO_MODEL_OPTIONS,
  LLM_MODEL_OPTIONS,
  AlertEvent,
  AnalysisStats,
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

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/analyze";
const ALERT_THROTTLE_MS = 2000;

function defaultModelFor(pipeline: AnalysisPipeline): ModelOption {
  return pipeline === "yolov8" ? YOLO_MODEL_OPTIONS[0] : LLM_MODEL_OPTIONS[0];
}

export function usePipelineAnalysis(pipeline: AnalysisPipeline) {
  const [mode, setMode] = useState<DetectionMode>("helmet");
  const [selectedModel, setSelectedModel] = useState<ModelOption>(defaultModelFor(pipeline));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [stats, setStats] = useState<AnalysisStats>(INITIAL_STATS);
  const [overallStatus, setOverallStatus] = useState<OverallStatus>("idle");
  const [statusLabel, setStatusLabel] = useState("");
  const [latency, setLatency] = useState<number | null>(null);
  const [detectionBoxes, setDetectionBoxes] = useState<DetectionBox[]>([]);
  const [sceneSummary, setSceneSummary] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const pipelineRef = useRef(pipeline);
  pipelineRef.current = pipeline;
  const modelRef = useRef(selectedModel);
  modelRef.current = selectedModel;
  const isAnalyzingRef = useRef(false);
  const lastAlertTimeRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { playBeep, setEnabled: setAudioEnabled } = useAudioAlert();

  // Auto-switch default model when pipeline changes
  useEffect(() => {
    setSelectedModel(defaultModelFor(pipeline));
  }, [pipeline]);

  // Clear stale detection data when mode changes mid-analysis
  useEffect(() => {
    setDetectionBoxes([]);
    setSceneSummary("");
  }, [mode]);

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
      const now = Date.now();
      if (now - lastAlertTimeRef.current < ALERT_THROTTLE_MS) return;
      lastAlertTimeRef.current = now;

      const alert: AlertEvent = {
        id: `${now}-${Math.random().toString(36).slice(2, 6)}`,
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

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "error") {
          setDetectionBoxes([]);
          setSceneSummary("");
          addAlert("error", msg.message || "Analysis error");
          return;
        }

        if (msg.type === "detection") {
          const { boxes, stats: statsUpdate, latency_ms } = msg;

          setDetectionBoxes(boxes || []);
          setLatency(latency_ms);

          setSceneSummary(msg.sceneSummary || "");

          if (statsUpdate) {
            setStats((prev) => ({
              totalAnalyzed: prev.totalAnalyzed + (statsUpdate.totalAnalyzed || 0),
              compliant: prev.compliant + (statsUpdate.compliant || 0),
              violations: prev.violations + (statsUpdate.violations || 0),
              fatigueAlerts: prev.fatigueAlerts + (statsUpdate.fatigueAlerts || 0),
            }));

            const os = statsUpdate.overallStatus;
            if (os === "COMPLIANT" || os === "compliant") {
              setOverallStatus("compliant");
            } else if (os === "VIOLATION_DETECTED" || os === "violation") {
              setOverallStatus("violation");
            } else if (os === "warning") {
              setOverallStatus("warning");
            } else if (os === "critical") {
              setOverallStatus("critical");
            } else if (os === "NO_PERSONS_DETECTED" || os === "no_person") {
              setOverallStatus("no_person");
            }

            setStatusLabel(statsUpdate.statusLabel || "");

            if (os === "VIOLATION_DETECTED" || os === "violation") {
              addAlert("violation", statsUpdate.statusLabel || "Violation detected", undefined, undefined, boxes);
              playBeep("violation");
            } else if (os === "critical") {
              addAlert("critical", statsUpdate.statusLabel || "Critical alert", undefined, undefined, boxes);
              playBeep("violation");
            } else if (os === "warning") {
              addAlert("warning", statsUpdate.statusLabel || "Warning", undefined, undefined, boxes);
              playBeep("warning");
            } else if (os === "COMPLIANT" || os === "compliant") {
              addAlert("compliant", statsUpdate.statusLabel || "Compliant");
            }
          }
        }
      } catch {
        // Ignore parse errors
      }
    },
    [addAlert, playBeep]
  );

  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("[pipeline] WebSocket connected");
        setOverallStatus("analyzing");
        setStatusLabel("CONNECTED");

        // Send config with provider when using LLM pipeline
        if (pipelineRef.current === "llm") {
          ws.send(
            JSON.stringify({
              type: "config",
              provider: modelRef.current.provider,
            })
          );
        }
      };

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        console.log("[pipeline] WebSocket closed");
        wsRef.current = null;
        if (isAnalyzingRef.current) {
          reconnectTimerRef.current = setTimeout(connectWs, 1000);
        }
      };

      ws.onerror = () => {
        console.log("[pipeline] WebSocket error");
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      if (isAnalyzingRef.current) {
        reconnectTimerRef.current = setTimeout(connectWs, 2000);
      }
    }
  }, [handleMessage]);

  const disconnectWs = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const handleFrameCapture = useCallback(
    (frame: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      wsRef.current.send(
        JSON.stringify({
          type: "frame",
          data: frame,
          mode: modeRef.current,
          pipeline: pipelineRef.current,
          model: modelRef.current.id,
          provider: modelRef.current.provider,
        })
      );
    },
    []
  );

  const toggleAnalysis = useCallback(() => {
    if (!isAnalyzing) {
      setStats(INITIAL_STATS);
      setAlerts([]);
      setDetectionBoxes([]);
      setSceneSummary("");
      setOverallStatus("analyzing");
      setStatusLabel("CONNECTING...");
      setIsAnalyzing(true);
      isAnalyzingRef.current = true;
      connectWs();
    } else {
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
      disconnectWs();
      setOverallStatus("idle");
      setStatusLabel("");
      setLatency(null);
      setDetectionBoxes([]);
      setSceneSummary("");
    }
  }, [isAnalyzing, connectWs, disconnectWs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isAnalyzingRef.current = false;
      disconnectWs();
    };
  }, [disconnectWs]);

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
    sceneSummary,
    setMode,
    setSelectedModel,
    toggleSound,
    toggleAnalysis,
    handleFrameCapture,
  };
}
