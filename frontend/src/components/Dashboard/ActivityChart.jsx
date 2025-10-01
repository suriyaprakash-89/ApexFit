// frontend/src/components/Dashboard/ActivityChart.jsx
import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useActivityStore } from "../../store/activityStore";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ActivityChart = ({ defaultPeriod = "week" }) => {
  const { chartData, fetchChartData } = useActivityStore();
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetchChartData(selectedPeriod);
  }, [selectedPeriod, fetchChartData]);

  const periodData = chartData[selectedPeriod] || { steps: [], activities: [] };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    setIsDropdownOpen(false);
    setCurrentDate(new Date());
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);

    switch (selectedPeriod) {
      case "week":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
      case "year":
        newDate.setFullYear(
          newDate.getFullYear() + (direction === "next" ? 1 : -1)
        );
        break;
      default:
        break;
    }

    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    switch (selectedPeriod) {
      case "week":
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start from Sunday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        return `${startOfWeek.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${endOfWeek.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`;

      case "month":
        return currentDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

      case "year":
        return currentDate.getFullYear().toString();

      default:
        return "";
    }
  };

  // Generate labels for the chart
  const generateLabels = () => {
    switch (selectedPeriod) {
      case "week":
        return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      case "month":
        // Show weeks 1-4 for monthly view
        return ["Week 1", "Week 2", "Week 3", "Week 4"];

      case "year":
        return [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];

      default:
        return [];
    }
  };

  // Process data and fill missing days with 0
  const processChartData = () => {
    const { steps, activities } = periodData;

    switch (selectedPeriod) {
      case "week":
        // Always return 7 days (Sunday to Saturday)
        const weekData = {
          steps: Array(7).fill(0),
          calories: Array(7).fill(0),
        };

        // Get current week's Sunday date
        const today = new Date();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - today.getDay());

        // Fill in available data for the current week
        steps.forEach((step) => {
          const stepDate = new Date(step.date);
          const dayOfWeek = stepDate.getDay(); // 0 = Sunday, 6 = Saturday
          if (dayOfWeek >= 0 && dayOfWeek <= 6) {
            weekData.steps[dayOfWeek] = step.steps || 0;
          }
        });

        activities.forEach((activity) => {
          const activityDate = new Date(activity.date);
          const dayOfWeek = activityDate.getDay();
          if (dayOfWeek >= 0 && dayOfWeek <= 6) {
            weekData.calories[dayOfWeek] =
              (weekData.calories[dayOfWeek] || 0) + (activity.calories || 0);
          }
        });

        return weekData;

      case "month":
        // Group by week for monthly view (4 weeks)
        const monthlyData = {
          steps: Array(4).fill(0),
          calories: Array(4).fill(0),
        };

        steps.forEach((step) => {
          const stepDate = new Date(step.date);
          const weekOfMonth = Math.min(
            Math.floor((stepDate.getDate() - 1) / 7),
            3
          );
          monthlyData.steps[weekOfMonth] += step.steps || 0;
        });

        activities.forEach((activity) => {
          const activityDate = new Date(activity.date);
          const weekOfMonth = Math.min(
            Math.floor((activityDate.getDate() - 1) / 7),
            3
          );
          monthlyData.calories[weekOfMonth] += activity.calories || 0;
        });

        return monthlyData;

      case "year":
        // Group by month for yearly view (12 months)
        const yearlyData = {
          steps: Array(12).fill(0),
          calories: Array(12).fill(0),
        };

        steps.forEach((step) => {
          const stepDate = new Date(step.date);
          const month = stepDate.getMonth();
          yearlyData.steps[month] += step.steps || 0;
        });

        activities.forEach((activity) => {
          const activityDate = new Date(activity.date);
          const month = activityDate.getMonth();
          yearlyData.calories[month] += activity.calories || 0;
        });

        return yearlyData;

      default:
        return {
          steps: Array(7).fill(0),
          calories: Array(7).fill(0),
        };
    }
  };

  const labels = generateLabels();
  const chartDataValues = processChartData();

  const data = {
    labels,
    datasets: [
      {
        label: "Steps",
        data: chartDataValues.steps,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.4,
      },
      {
        label: "Calories",
        data: chartDataValues.calories,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.5)",
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString();
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value.toLocaleString();
          },
        },
      },
    },
  };

  return (
    <div className="h-full flex flex-col">
      {/* Custom Header with Dropdown and Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Activity Overview
          </h3>

          {/* Period Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <span className="capitalize">{selectedPeriod}</span>
              <Calendar className="w-4 h-4" />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10">
                {["week", "month", "year"].map((period) => (
                  <button
                    key={period}
                    onClick={() => handlePeriodChange(period)}
                    className={`w-full text-left px-3 py-2 text-sm capitalize hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedPeriod === period
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {getDateRangeText()}
          </span>
          <div className="flex space-x-1">
            <button
              onClick={() => navigateDate("prev")}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateDate("next")}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 min-h-[300px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default ActivityChart;
