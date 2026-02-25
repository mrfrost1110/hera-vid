"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { VideoSource, DetectionBox } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import DetectionOverlay from "./DetectionOverlay";

type OverallStatus = "compliant" | "violation" | "warning" | "critical" | "analyzing" | "idle" | "no_person";

interface VideoFeedProps {
  source: VideoSource;
  isAnalyzing: boolean;
  overallStatus: OverallStatus;
  statusLabel?: string;
  interval: number;
  detectionBoxes: DetectionBox[];
  onFrameCapture: (frame: string) => void;
  realtimeMode?: boolean;
}

export default function VideoFeed({
  source,
  isAnalyzing,
  overallStatus,
  statusLabel,
  interval,
  detectionBoxes,
  onFrameCapture,
  realtimeMode,
}: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [cameraError, setCameraError] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<string>("16/9");

  const onFrameCaptureRef = useRef(onFrameCapture);
  onFrameCaptureRef.current = onFrameCapture;

  const intervalRef = useRef(interval);
  intervalRef.current = interval;

  const startWebcam = useCallback(async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError("Camera access denied. Please allow camera access.");
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (source === "webcam") {
      setVideoSrc("");
      setAspectRatio("16/9");
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => stopWebcam();
  }, [source, startWebcam, stopWebcam]);

  const realtimeModeRef = useRef(realtimeMode);
  realtimeModeRef.current = realtimeMode;

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (video.paused || video.ended || video.readyState < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Preserve video aspect ratio — scale to fit within maxDim
    const maxDim = realtimeModeRef.current ? 640 : 640;
    const quality = realtimeModeRef.current ? 0.7 : 0.7;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const scale = Math.min(maxDim / vw, maxDim / vh);
    const w = Math.round(vw * scale);
    const h = Math.round(vh * scale);

    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    onFrameCaptureRef.current(dataUrl);
  }, []);

  useEffect(() => {
    if (!isAnalyzing) return;

    captureFrame();

    let timerId: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      timerId = setTimeout(() => {
        captureFrame();
        scheduleNext();
      }, intervalRef.current);
    };
    scheduleNext();

    return () => clearTimeout(timerId);
  }, [isAnalyzing, captureFrame]);

  const handleVideoMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w && h) {
      setAspectRatio(`${w}/${h}`);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setAspectRatio("16/9");
      stopWebcam();
    }
  };

  return (
    <div className="relative flex flex-col bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
      <div
        className="relative bg-black"
        style={{ aspectRatio, maxHeight: "75vh" }}
      >
        <video
          ref={videoRef}
          src={source === "video" && videoSrc ? videoSrc : undefined}
          className="w-full h-full object-contain"
          autoPlay
          loop
          muted
          playsInline
          onLoadedMetadata={handleVideoMetadata}
        />

        <canvas ref={canvasRef} className="hidden" />

        <DetectionOverlay boxes={detectionBoxes} />

        <div className="absolute top-3 left-3 z-10">
          <StatusBadge status={overallStatus} label={statusLabel} large />
        </div>

        {cameraError && source === "webcam" && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
            <div className="text-center px-6">
              <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-sm">{cameraError}</p>
              <button
                onClick={startWebcam}
                className="mt-3 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {source === "video" && !videoSrc && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
            <div className="text-center px-6">
              <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <p className="text-gray-400 text-sm mb-3">Load a demo video file</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Select Video
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2.5 px-4 py-2 bg-gray-900/90 rounded-lg border border-green-500/40 shadow-lg shadow-green-500/10 z-10">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-400 font-mono font-semibold tracking-wide">ANALYZING</span>
          </div>
        )}
      </div>

      {source === "video" && videoSrc && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50 border-t border-gray-800">
          <span className="text-xs text-gray-500">Video loaded</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Change file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
