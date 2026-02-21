"use client";

import { DetectionMode, VideoSource, ModelOption } from "@/lib/types";
import SourceToggle from "./controls/SourceToggle";
import ModeToggle from "./controls/ModeToggle";
import ModelSelector from "./controls/ModelSelector";
import AnalysisButton from "./controls/AnalysisButton";
import IntervalSlider from "./controls/IntervalSlider";
import SoundToggle from "./controls/SoundToggle";

interface ControlPanelProps {
  source: VideoSource;
  mode: DetectionMode;
  selectedModel: ModelOption;
  isAnalyzing: boolean;
  interval: number;
  soundEnabled: boolean;
  onSourceChange: (source: VideoSource) => void;
  onModeChange: (mode: DetectionMode) => void;
  onModelChange: (model: ModelOption) => void;
  onToggleAnalysis: () => void;
  onIntervalChange: (ms: number) => void;
  onSoundToggle: () => void;
}

export default function ControlPanel({
  source,
  mode,
  selectedModel,
  isAnalyzing,
  interval,
  soundEnabled,
  onSourceChange,
  onModeChange,
  onModelChange,
  onToggleAnalysis,
  onIntervalChange,
  onSoundToggle,
}: ControlPanelProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 border-t border-gray-800 shrink-0">
      <SourceToggle source={source} onChange={onSourceChange} />
      <ModeToggle mode={mode} onChange={onModeChange} />
      <AnalysisButton isAnalyzing={isAnalyzing} onToggle={onToggleAnalysis} />

      <div className="w-px h-5 bg-gray-700 mx-1" />

      <ModelSelector selected={selectedModel} onChange={onModelChange} />

      <div className="ml-auto flex items-center gap-2">
        <IntervalSlider value={interval} onChange={onIntervalChange} />
        <SoundToggle enabled={soundEnabled} onToggle={onSoundToggle} />
      </div>
    </div>
  );
}
