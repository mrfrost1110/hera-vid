"use client";

interface IntervalSliderProps {
  value: number;
  onChange: (ms: number) => void;
}

export default function IntervalSlider({ value, onChange }: IntervalSliderProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Int</span>
      <input
        type="range"
        min={1000}
        max={10000}
        step={500}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 accent-blue-500"
      />
      <span className="text-[11px] text-gray-400 font-mono w-8 tabular-nums">
        {(value / 1000).toFixed(1)}s
      </span>
    </div>
  );
}
