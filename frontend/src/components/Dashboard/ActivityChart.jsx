// frontend/src/components/Dashboard/ActivityChart.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useActivityStore, getChartRange } from "../../store/activityStore";
import { useTheme } from "../../contexts/ThemeContext";
import { parseLocalDate } from "../../utils/date";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const PERIODS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const shiftAnchor = (anchor, period, direction) => {
  const d = new Date(anchor);
  if (period === "week") d.setDate(d.getDate() + 7 * direction);
  if (period === "month") d.setMonth(d.getMonth() + direction, 1);
  if (period === "year") d.setFullYear(d.getFullYear() + direction, 0, 1);
  return d;
};

/** Bucket rows into the chart's x-axis slots (day of week / day of month / month). */
const bucketize = (period, start, end, steps, activities) => {
  let size;
  let indexOf;
  let labels;
  if (period === "week") {
    size = 7;
    indexOf = (d) => d.getDay();
    labels = WEEKDAYS;
  } else if (period === "month") {
    size = end.getDate();
    indexOf = (d) => d.getDate() - 1;
    labels = Array.from({ length: size }, (_, i) => String(i + 1));
  } else {
    size = 12;
    indexOf = (d) => d.getMonth();
    labels = MONTHS;
  }

  const stepsData = Array(size).fill(0);
  const caloriesData = Array(size).fill(0);
  steps.forEach((row) => {
    const i = indexOf(parseLocalDate(row.date));
    if (i >= 0 && i < size) stepsData[i] += row.steps || 0;
  });
  activities.forEach((row) => {
    const i = indexOf(parseLocalDate(row.date));
    if (i >= 0 && i < size) caloriesData[i] += row.calories || 0;
  });
  return { labels, stepsData, caloriesData };
};

const ActivityChart = ({ defaultPeriod = "week" }) => {
  const { chart, fetchChartData } = useActivityStore();
  const { isDark } = useTheme();
  const [period, setPeriod] = useState(defaultPeriod);
  const [anchor, setAnchor] = useState(() => new Date());

  const { start, end } = getChartRange(period, anchor);
  const isCurrentRange = end >= new Date(new Date().setHours(0, 0, 0, 0));

  useEffect(() => {
    fetchChartData(period, anchor);
  }, [period, anchor, fetchChartData]);

  const { labels, stepsData, caloriesData } = useMemo(
    () => bucketize(period, start, end, chart.steps, chart.activities),
    // start/end derive from period + anchor
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, anchor, chart.steps, chart.activities]
  );

  const rangeLabel = (() => {
    if (period === "week") {
      const fmt = { month: "short", day: "numeric" };
      return `${start.toLocaleDateString(undefined, fmt)} – ${end.toLocaleDateString(undefined, fmt)}`;
    }
    if (period === "month") return start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    return String(start.getFullYear());
  })();

  const textColor = isDark ? "#d1d5db" : "#4b5563";
  const gridColor = isDark ? "rgba(75, 85, 99, 0.4)" : "rgba(229, 231, 235, 1)";

  const data = {
    labels,
    datasets: [
      {
        label: "Steps",
        data: stepsData,
        yAxisID: "y",
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.12)",
        fill: true,
        tension: 0.35,
        pointRadius: period === "month" ? 2 : 3,
      },
      {
        label: "Active calories",
        data: caloriesData,
        yAxisID: "y1",
        borderColor: "rgb(249, 115, 22)",
        backgroundColor: "rgba(249, 115, 22, 0.5)",
        tension: 0.35,
        pointRadius: period === "month" ? 2 : 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "bottom", labels: { color: textColor, usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: textColor, maxRotation: 0, autoSkip: true }, grid: { display: false } },
      y: {
        beginAtZero: true,
        position: "left",
        ticks: { color: textColor, callback: (v) => Number(v).toLocaleString() },
        grid: { color: gridColor },
        title: { display: true, text: "Steps", color: textColor },
      },
      y1: {
        beginAtZero: true,
        position: "right",
        ticks: { color: textColor, callback: (v) => Number(v).toLocaleString() },
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Calories", color: textColor },
      },
    },
  };

  const hasData = stepsData.some(Boolean) || caloriesData.some(Boolean);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="card-title">Activity overview</h2>
        <div
          role="tablist"
          aria-label="Chart period"
          className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-700"
        >
          {PERIODS.map((p) => (
            <button
              key={p.value}
              role="tab"
              aria-selected={period === p.value}
              onClick={() => {
                setPeriod(p.value);
                setAnchor(new Date());
              }}
              className={`px-3 min-h-[36px] rounded-lg text-sm font-medium transition-colors ${
                period === p.value
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setAnchor((a) => shiftAnchor(a, period, -1))}
          className="icon-btn"
          aria-label={`Previous ${period}`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300" aria-live="polite">
          {rangeLabel}
        </p>
        <button
          onClick={() => setAnchor((a) => shiftAnchor(a, period, 1))}
          disabled={isCurrentRange}
          className="icon-btn"
          aria-label={`Next ${period}`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="relative flex-1 min-h-[260px] sm:min-h-[300px]">
        <Line data={data} options={options} aria-label={`Steps and active calories, ${rangeLabel}`} role="img" />
        {chart.loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-800/60 rounded-xl">
            <div className="skeleton w-24 h-3" />
          </div>
        )}
        {!chart.loading && !hasData && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-muted pointer-events-none">
            No steps or workouts logged in this period.
          </p>
        )}
      </div>
    </div>
  );
};

export default ActivityChart;
