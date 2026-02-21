"use client";

import { useState, useCallback } from "react";
import { VideoSource } from "@/lib/types";
import { useAnalysis } from "@/hooks/useAnalysis";
import Header from "./Header";
import VideoFeed from "./VideoFeed";
import AlertFeed from "./AlertFeed";
import StatsBar from "./StatsBar";
import ControlPanel from "./ControlPanel";

export default function Dashboard() {
  const [source, setSource] = useState<VideoSource>("webcam");
  const [interval, setInterval] = useState(3000);

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
    setMode,
    setSelectedModel,
    toggleSound,
    toggleAnalysis,
    handleFrameCapture,
  } = useAnalysis();

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
          />
        </div>

        <div className="w-80 flex-shrink-0 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <AlertFeed alerts={alerts} />
        </div>
      </div>

      <ControlPanel
        source={source}
        mode={mode}
        selectedModel={selectedModel}
        isAnalyzing={isAnalyzing}
        interval={interval}
        soundEnabled={soundEnabled}
        onSourceChange={setSource}
        onModeChange={setMode}
        onModelChange={setSelectedModel}
        onToggleAnalysis={toggleAnalysis}
        onIntervalChange={setInterval}
        onSoundToggle={toggleSound}
      />
    </div>
  );
}
