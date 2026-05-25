import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ user, analytical, analyticEval, principalAnalytics }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const isEvaluator =
    user?.role === "evaluator" ||
    user?.role === "reviewer" ||
    user?.role === "qualitycheck" ||
    user?.role === "headevaluator";

  const isPrincipal = user?.role === "principal";

  const labels = isEvaluator
    ? ["Completed", "Not Started", "Pending"]
    : isPrincipal
    ? ["Rejected Booklets"]
    : ["Users", "Tasks", "Courses", "Subjects"];

  const dataValues = isEvaluator
    ? [
        analyticEval?.completedTasks || 0,
        analyticEval?.notStartedBooklets || 0,
        analyticEval?.pendingBooklets || 0,
      ]
    : isPrincipal
    ? [principalAnalytics?.rejectedBooklets || 0]
    : [
        analytical?.totalUsers || 0,
        analytical?.tasks || 0,
        analytical?.courses || 0,
        analytical?.subjects || 0,
      ];

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains("dark"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const data = {
    labels,
    datasets: [
      {
        label: "Total Count",
        data: dataValues,
        backgroundColor: "rgba(75,192,192,0.6)",
        borderColor: "rgba(75,192,192,1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: isDarkMode ? "white" : "black",
        },
      },
      title: {
        display: true,
        text: isEvaluator
          ? "Evaluation Progress"
          : isPrincipal
          ? "Rejected Booklets Overview"
          : "Overall Statistics",
        color: isDarkMode ? "white" : "black",
      },
    },
    scales: {
      x: {
        ticks: { color: isDarkMode ? "white" : "black" },
      },
      y: {
        beginAtZero: true,
        ticks: { color: isDarkMode ? "white" : "black" },
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default BarChart;
