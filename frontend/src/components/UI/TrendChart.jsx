// frontend/src/components/UI/TrendChart.jsx
// One themed line chart for every trend in the app (weight, strength, ...).
// Handles loading / no-data states and reads its colours from the design tokens.
import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { LineChart as LineChartIcon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Skeleton } from "@/components/shadcn/skeleton";
import { formatDate } from "../../utils/date";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const cssColor = (name, alpha) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw ? `hsl(${raw}${alpha != null ? ` / ${alpha}` : ""})` : "#a3e635";
};

/**
 * points: [{ date: "YYYY-MM-DD", value: number }] oldest first.
 * unit is appended in tooltips; `reverse` flips the y axis semantics are NOT changed, only the colour of trend text.
 */
const TrendChart = ({ points, unit = "", label = "Value", loading = false, height = "h-56 sm:h-64", emptyText = "Not enough data yet" }) => {
  const { isDark } = useTheme();

  const data = useMemo(() => {
    const primary = cssColor("--primary");
    return {
      labels: points.map((p) => formatDate(p.date, { month: "short", day: "numeric" })),
      datasets: [
        {
          label,
          data: points.map((p) => p.value),
          borderColor: primary,
          backgroundColor: (ctx) => {
            const { chart } = ctx;
            if (!chart.chartArea) return "transparent";
            const g = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
            g.addColorStop(0, cssColor("--primary", 0.28));
            g.addColorStop(1, cssColor("--primary", 0));
            return g;
          },
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: points.length > 24 ? 0 : 3,
          pointHoverRadius: 6,
          pointBackgroundColor: primary,
          pointBorderColor: cssColor("--card"),
          pointBorderWidth: 2,
        },
      ],
    };
    // isDark re-reads the CSS variables after a theme switch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, label, isDark]);

  const options = useMemo(() => {
    const muted = cssColor("--muted-foreground");
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cssColor("--popover"),
          titleColor: cssColor("--foreground"),
          bodyColor: cssColor("--foreground"),
          borderColor: cssColor("--border"),
          borderWidth: 1,
          padding: 10,
          cornerRadius: 10,
          displayColors: false,
          callbacks: { label: (ctx) => `${ctx.parsed.y}${unit ? ` ${unit}` : ""}` },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: muted, maxTicksLimit: 6, maxRotation: 0 }, border: { display: false } },
        y: {
          grid: { color: cssColor("--border", 0.7) },
          ticks: { color: muted, maxTicksLimit: 5 },
          border: { display: false },
          grace: "10%",
        },
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, isDark]);

  if (loading) return <Skeleton className={`w-full ${height}`} />;

  if (points.length < 2) {
    return (
      <div className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center ${height}`}>
        <LineChartIcon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p className="px-4 text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${height}`} role="img" aria-label={`${label} trend, ${points.length} entries, latest ${points[points.length - 1].value} ${unit}`}>
      <Line data={data} options={options} />
    </div>
  );
};

export default TrendChart;
