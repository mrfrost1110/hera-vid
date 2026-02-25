"use client";

import { useState, useCallback } from "react";
import { VideoSource, AnalysisPipeline } from "@/lib/types";
import { usePipelineAnalysis } from "@/hooks/usePipelineAnalysis";
import Header from "./Header";
import VideoFeed from "./VideoFeed";
import AlertFeed from "./AlertFeed";
import ClassificationLog from "./ClassificationLog";
import StatsBar from "./StatsBar";
import ControlPanel from "./ControlPanel";

export default function Dashboard() {
  const [source, setSource] = useState<VideoSource>("webcam");
  const [pipeline, setPipeline] = useState<AnalysisPipeline>("yolov8");
  const [interval, setInterval] = useState(150);
  const [sidebarTab, setSidebarTab] = useState<"alerts" | "details">("alerts");

  const {
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
  } = usePipelineAnalysis(pipeline);

  const handlePipelineChange = useCallback(
    (newPipeline: AnalysisPipeline) => {
      if (isAnalyzing) {
        toggleAnalysis();
      }
      setPipeline(newPipeline);
      setInterval(newPipeline === "yolov8" ? 150 : 3000);
    },
    [isAnalyzing, toggleAnalysis]
  );

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <Header
        isAnalyzing={isAnalyzing}
        latency={latency}
        onFullscreen={handleFullscreen}
      />

      <div className="px-4 py-2 shrink-0">
        <StatsBar stats={stats} />
      </div>

      <div className="flex-1 flex gap-3 px-4 pb-2 min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0">
          <VideoFeed
            source={source}
            isAnalyzing={isAnalyzing}
            overallStatus={overallStatus}
            statusLabel={statusLabel}
            interval={interval}
            detectionBoxes={detectionBoxes}
            onFrameCapture={handleFrameCapture}
            realtimeMode={pipeline === "yolov8"}
          />
        </div>

        <div className="w-80 flex-shrink-0 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col">
          <div className="flex border-b border-gray-800 shrink-0">
            <button
              className={`flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                sidebarTab === "alerts"
                  ? "text-gray-200 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-400"
              }`}
              onClick={() => setSidebarTab("alerts")}
            >
              Alerts
            </button>
            <button
              className={`flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                sidebarTab === "details"
                  ? "text-gray-200 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-400"
              }`}
              onClick={() => setSidebarTab("details")}
            >
              Details
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {sidebarTab === "alerts" ? (
              <AlertFeed alerts={alerts} />
            ) : (
              <ClassificationLog boxes={detectionBoxes} sceneSummary={sceneSummary} />
            )}
          </div>
        </div>
      </div>

      <ControlPanel
        source={source}
        mode={mode}
        selectedModel={selectedModel}
        isAnalyzing={isAnalyzing}
        interval={interval}
        soundEnabled={soundEnabled}
        pipeline={pipeline}
        onSourceChange={setSource}
        onModeChange={setMode}
        onModelChange={setSelectedModel}
        onToggleAnalysis={toggleAnalysis}
        onIntervalChange={setInterval}
        onSoundToggle={toggleSound}
        onPipelineChange={handlePipelineChange}
      />
    </div>
  );
}
