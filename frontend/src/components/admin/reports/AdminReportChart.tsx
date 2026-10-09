"use client";

import { useEffect, useRef } from "react";
import Chart, { type ChartConfiguration } from "chart.js/auto";

export default function AdminReportChart({
  config,
  label,
}: {
  config: ChartConfiguration;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const chart = new Chart(canvasRef.current, config);
    return () => chart.destroy();
  }, [config]);

  return (
    <div className="relative h-72 w-full" role="img" aria-label={label}>
      <canvas ref={canvasRef} />
    </div>
  );
}
