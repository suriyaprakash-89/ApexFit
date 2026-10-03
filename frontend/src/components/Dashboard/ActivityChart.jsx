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
import { BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
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

const compact = (v) => new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v);

/** True below Tailwind's `sm` breakpoint; drives a leaner chart on phones. */
const useIsMobile = () => {
  const query = "(max-width: 639px)";
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mobile;
};

/** Vertical fade from the line colour to transparent, sized to the plot area. */
const gradientFill = (rgb, top, bottom = 0) => (context) => {
  const { ctx, chartArea } = context.chart;
  if (!chartArea) return `rgba(${rgb}, ${top})`;
  const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  g.addColorStop(0, `rgba(${rgb}, ${top})`);
  g.addColorStop(1, `rgba(${rgb}, ${bottom})`);
  return g;
};

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
  const isMobile = useIsMobile();
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

  const textColor = isDark ? "#97a39b" : "#4a5750";
  const gridColor = isDark ? "rgba(151, 163, 155, 0.14)" : "rgba(74, 87, 80, 0.14)";
  // Brand volt for steps (darker on light backgrounds so the line keeps its contrast)
  const stepsRgb = isDark ? "180, 238, 52" : "79, 138, 11";
  const dense = period === "month";
  const fontSize = isMobile ? 10 : 12;

  const baseLine = {
    tension: 0.4,
    borderWidth: isMobile ? 2 : 2.5,
    pointRadius: 0,
    pointHoverRadius: 5,
    pointHoverBorderWidth: 2,
    pointHoverBorderColor: isDark ? "#0a0e0c" : "#ffffff",
    // Show markers only when there are few points; the month view stays clean
    ...(dense ? {} : { pointRadius: isMobile ? 2 : 3 }),
  };

  const data = {
    labels,
    datasets: [
      {
        ...baseLine,
        label: "Steps",
        data: stepsData,
        yAxisID: "y",
        borderColor: `rgb(${stepsRgb})`,
        pointBackgroundColor: `rgb(${stepsRgb})`,
        backgroundColor: gradientFill(stepsRgb, 0.3),
        fill: true,
      },
      {
        ...baseLine,
        label: "Active calories",
        data: caloriesData,
        yAxisID: "y1",
        borderColor: "rgb(249, 115, 22)",
        pointBackgroundColor: "rgb(249, 115, 22)",
        backgroundColor: gradientFill("249, 115, 22", 0.2),
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    layout: { padding: { top: 4, right: isMobile ? 0 : 4 } },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: { color: textColor, usePointStyle: true, pointStyle: "circle", boxWidth: 6, boxHeight: 6, padding: 14, font: { size: fontSize + 1 } },
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(18, 24, 22, 0.97)" : "rgba(255, 255, 255, 0.97)",
        titleColor: isDark ? "#f9fafb" : "#111827",
        bodyColor: isDark ? "#d1d5db" : "#374151",
        borderColor: isDark ? "rgba(75, 85, 99, 0.6)" : "rgba(229, 231, 235, 1)",
        borderWidth: 1,
        cornerRadius: 12,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        border: { display: false },
        ticks: {
          color: textColor,
          font: { size: fontSize },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: isMobile && dense ? 8 : undefined,
        },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        position: "left",
        border: { display: false },
        ticks: { color: textColor, font: { size: fontSize }, maxTicksLimit: 5, callback: (v) => compact(v) },
        grid: { color: gridColor },
        title: { display: !isMobile, text: "Steps", color: textColor },
      },
      y1: {
        beginAtZero: true,
        position: "right",
        border: { display: false },
        ticks: { color: textColor, font: { size: fontSize }, maxTicksLimit: 5, callback: (v) => compact(v) },
        grid: { drawOnChartArea: false },
        title: { display: !isMobile, text: "Calories", color: textColor },
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
                  ? "bg-white dark:bg-gray-600 text-foreground shadow-sm"
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

      <div className="relative flex-1 min-h-[240px] sm:min-h-[300px] -mx-1 sm:mx-0">
        {!chart.loading && !hasData ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 text-center sm:min-h-[300px]">
            <BarChart3 className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Nothing logged in this period</p>
            <p className="text-xs text-muted-foreground">Steps and active calories will chart here as you log them.</p>
          </div>
        ) : (
          <Line data={data} options={options} aria-label={`Steps and active calories, ${rangeLabel}`} role="img" />
        )}
        {chart.loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-card/70">
            <div className="skeleton w-24 h-3" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityChart;
