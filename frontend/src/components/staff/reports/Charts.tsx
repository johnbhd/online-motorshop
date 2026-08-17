"use client";
import { useEffect, useRef } from "react";
import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);
export function LineChart() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = new Chart(ref.current, {
      type: "line",
      data: {
        labels: [
          "Aug 1",
          "Aug 3",
          "Aug 6",
          "Aug 8",
          "Aug 11",
          "Aug 14",
          "Aug 16",
          "Aug 18",
          "Aug 20",
          "Aug 22",
          "Aug 24",
          "Aug 27",
          "Aug 30",
        ],
        datasets: [
          {
            label: "Sales",
            data: [
              10000, 19000, 13000, 27000, 11000, 17000, 25000, 20000, 37000,
              19000, 22000, 44000, 24000,
            ],
            borderColor: "#f97316",
            backgroundColor: "rgba(249,115,22,.12)",
            fill: true,
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: (v) => `₱${Number(v) / 1000}k` } } },
      },
    });
    return () => chart.destroy();
  }, []);
  return <canvas ref={ref} />;
}
export function DoughnutChart() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = new Chart(ref.current, {
      type: "doughnut",
      data: {
        labels: [
          "Completed",
          "Preparing",
          "Pending",
          "Confirmed",
          "Delivery",
          "Ready Pickup",
          "Cancelled",
        ],
        datasets: [
          {
            data: [45, 15, 12, 10, 8, 6, 4],
            backgroundColor: [
              "#16a34a",
              "#3b82f6",
              "#f97316",
              "#0B1930",
              "#8b5cf6",
              "#10b981",
              "#ef4444",
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
      },
    });
    return () => chart.destroy();
  }, []);
  return <canvas ref={ref} />;
}
