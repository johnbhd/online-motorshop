"use client";
import type { ChartConfiguration } from "chart.js";
import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
export default function ReportChart({
  config,
  label,
}: {
  config: ChartConfiguration;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const chart = new Chart(canvasRef.current, config);

    return () => chart.destroy();
  }, [config]);

  return (
    <div className="relative h-72 w-full">
      <canvas ref={canvasRef} aria-label={label} role="img" />
    </div>
  );
}
/*
        scales: { y: { ticks: { callback: (v) => `₱${Number(v) / 1000}k` } } },
*/

export function LineChart() {
  return null;
}

export function DoughnutChart() {
  return null;
}
