export type DetectionMode = "helmet" | "fatigue" | "combined";
export type VideoSource = "webcam" | "video";
export type Provider = "byteplus" | "openrouter";

export interface ModelOption {
  id: string;
  label: string;
  provider: Provider;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "qwen/qwen3.5-plus-02-15",
    label: "Qwen 3.5 Plus",
    provider: "openrouter",
  },
  {
    id: "google/gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro Preview",
    provider: "openrouter",
  },
  {
    id: "qwen/qwen3.5-397b-a17b",
    label: "Qwen 3.5 397B-A17B",
    provider: "openrouter",
  },
  {
    id: "moonshotai/kimi-k2.5",
    label: "MoonshotAI: Kimi K2.5",
    provider: "openrouter",
  },
  {
    id: "google/gemini-3-flash-preview",
    label: "Google: Gemini 3 Flash Preview",
    provider: "openrouter",
  },
  {
    id: "bytedance-seed/seed-1.6",
    label: "ByteDance Seed: Seed 1.6",
    provider: "openrouter",
  },
  { id: "seed-2-0-mini-260215", label: "Seed 2.0 Mini", provider: "byteplus" },
  { id: "seed-1-8-251228", label: "Seed 1.8", provider: "byteplus" },
];

// Bounding box as percentage of image (0-100)
export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Unified overlay box for rendering on video
export interface DetectionBox {
  id: number;
  bbox: BBox;
  label: string;
  status: "safe" | "violation" | "warning" | "critical";
}

export interface HelmetPerson {
  id: number;
  bbox?: BBox;
  wearing_helmet: boolean;
  confidence: number;
  description: string;
}

export interface HelmetResult {
  frame_analysis: {
    total_persons: number;
    persons: HelmetPerson[];
    violations_count: number;
    overall_status: "COMPLIANT" | "VIOLATION_DETECTED" | "NO_PERSONS_DETECTED";
    alert_message: string | null;
  };
}

export interface FatigueResult {
  frame_analysis: {
    face_detected: boolean;
    bbox?: BBox;
    fatigue_assessment: {
      eye_state: "open" | "partially_closed" | "closed";
      mouth_state: "closed" | "slightly_open" | "yawning";
      head_position: "upright" | "tilting" | "nodding";
      overall_alertness: "alert" | "mild_fatigue" | "drowsy" | "critical";
      fatigue_score: number;
      confidence: number;
    };
    alert_level: "NORMAL" | "WARNING" | "CRITICAL";
    alert_message: string | null;
    recommendation: string;
  };
}

export interface CombinedDetection {
  id: number;
  bbox?: BBox;
  helmet: { wearing: boolean; confidence: number };
  fatigue: {
    score: number;
    level: "alert" | "mild_fatigue" | "drowsy" | "critical";
    signs: string[];
  };
  status:
    | "SAFE"
    | "HELMET_VIOLATION"
    | "FATIGUE_WARNING"
    | "MULTIPLE_VIOLATIONS";
  description: string;
}

export interface CombinedResult {
  frame_analysis: {
    timestamp: string;
    total_persons: number;
    detections: CombinedDetection[];
    summary: {
      helmet_violations: number;
      fatigue_warnings: number;
      overall_status: "ALL_CLEAR" | "ATTENTION_NEEDED" | "IMMEDIATE_ACTION";
    };
  };
}

export interface AlertEvent {
  id: string;
  timestamp: Date;
  type: "compliant" | "violation" | "warning" | "critical" | "info" | "error";
  message: string;
  mode: DetectionMode;
  snapshot?: string;
  details?: string[];
  boxes?: DetectionBox[];
}

export interface AnalysisStats {
  totalAnalyzed: number;
  compliant: number;
  violations: number;
  fatigueAlerts: number;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: HelmetResult | FatigueResult | CombinedResult;
  latency_ms?: number;
  model?: string;
  error?: string;
}
