import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from "chart.js";
import axios from "axios";
import { toast } from "react-toastify";

// Register necessary chart elements with Chart.js
ChartJS.register(ArcElement, Title, Tooltip, Legend);

const DoughnutChart = ({ arr, val }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [responseData, setResponseData] = useState([]);
  const [arrdata, setArrdata] = useState([]);
  const [valdata, setValdata] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/analytic/getadminanalytics`
        );

        const data = response.data;
        console.log("API DATA:", data);

        const arrr = ["Admins", "Evaluators", "Users"];
        const vall = [
          data.totalAdmins || 0,
          data.totalEvaluators || 0,
          data.totalUsers || 0,
        ];

        setArrdata(arrr);
        setValdata(vall);
      } catch (error) {
        toast.error(error?.message);
      }
    };

    fetchData();
  }, []); // Run only once when component mounts

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains("dark"));
    };

    // Initial check on mount
    checkDarkMode();

    // Add event listener for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Doughnut chart data
  const data = {
    labels:
      arr.length <= 0 ? (arrdata.length <= 0 ? ["Loading..."] : arrdata) : arr, // Labels for the chart
    datasets: [
      {
        // here i take data from parent component (arr, val). but these data comes when parent component handleBoxClick() is called on click action. so initially until user click on any box i use useeffect to fetch user data and show it default data initially (arrdata, valdata)  the working of arr, val in parent component is same arrdata, valdata which is used in this component.

        data:
          val.length <= 0 ? (valdata.length <= 0 ? [5, 5, 5] : valdata) : val, // Values for the chart
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)", // Red
          "rgba(54, 162, 235, 0.6)", // Blue
          "rgba(255, 206, 86, 0.6)", // Yellow
          "rgba(75, 192, 192, 0.6)", // Green
          "rgba(153, 102, 255, 0.6)", // Purple
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
        hoverOffset: 20, // Border width for the segments
      },
    ],
  };

  // Doughnut chart options with dark mode
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: {
            size: 14,
          },
          color: isDarkMode ? "white" : "black",
        },
      },
      title: {
        display: true,
        text: "Category-Wise Distribution",
        font: {
          size: 18,
        },
        color: isDarkMode ? "white" : "black",
      },
      animation: {
        duration: 300, // Controls animation duration (in milliseconds)
        easing: "easeOutQuart", // Easing function for smooth transitions
      },
      hover: {
        mode: "nearest", // Interaction mode for hovering
        animationDuration: 300, // Duration of the hover animation
      },
    },
  };

  return <Doughnut data={data} options={options} />;
};

export default DoughnutChart;
