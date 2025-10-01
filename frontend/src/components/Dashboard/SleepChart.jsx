// frontend/src/components/Dashboard/SleepChart.jsx
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
);

export const SleepChart = ({ sleepData, period = "week" }) => {
  // Process sleep data for chart
  const processedData = processSleepData(sleepData, period);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `Sleep Patterns - ${
          period.charAt(0).toUpperCase() + period.slice(1)
        }`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        title: {
          display: true,
          text: "Hours Slept",
        },
      },
      y1: {
        position: "right",
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: "Sleep Quality",
        },
      },
    },
  };

  const data = {
    labels: processedData.labels,
    datasets: [
      {
        label: "Hours Slept",
        data: processedData.hours,
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        yAxisID: "y",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Sleep Quality",
        data: processedData.quality,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        type: "bar",
        yAxisID: "y1",
      },
    ],
  };

  return <Line options={options} data={data} />;
};

// Helper function to process sleep data
const processSleepData = (sleepData, period) => {
  // Implementation to process sleep data based on selected period
  // This would group data by day/week/month and calculate averages
  return {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    hours: [7.5, 6.8, 8.2, 7.0, 6.5, 9.0, 8.5],
    quality: [4, 3, 5, 4, 3, 5, 4],
  };
};

export default SleepChart;
