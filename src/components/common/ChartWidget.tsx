import React, { useEffect, useRef, useState } from "react";
import ApexCharts, { type ApexOptions } from "apexcharts";

interface Props {
  className?: string;
  activeTab?: "transactions" | "products" | "orders";
}

const ChartWidget: React.FC<Props> = ({
  className = "",
  activeTab = "transactions",
}) => {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = new ApexCharts(chartRef.current, getChartOptions(activeTab));
    chart.render();

    return () => {
      chart.destroy();
    };
  }, [activeTab]);

  return (
    <div
      className={`bg-white dark:bg-gray-900 shadow-md rounded-2xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            {activeTab === "transactions"
              ? "Transactions Report"
              : activeTab === "products"
              ? "Product Report"
              : "Order Report"}
          </h3>
          <p className="text-sm text-gray-500">
            {activeTab === "transactions"
              ? "More than 1000 new records"
              : activeTab === "products"
              ? "Top selling products performance"
              : "Recent order statistics"}
          </p>
        </div>

        {/* Tabs */}
        {/* <div className="flex space-x-2">
          {["transactions", "products", "orders"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab === "transactions"
                ? "Transactions"
                : tab === "products"
                ? "Products"
                : "Orders"}
            </button>
          ))}
        </div> */}
      </div>

      {/* Chart */}
      <div ref={chartRef} className="h-[350px]" />
    </div>
  );
};

export default ChartWidget;

/* -----------------------------------------------------
   CHART CONFIGURATION
----------------------------------------------------- */
function getChartOptions(
  type: "transactions" | "products" | "orders"
): ApexOptions {
  const chartData = {
    transactions: [30, 40, 40, 90, 90, 70, 70],
    products: [80, 60, 70, 50, 90, 110, 95],
    orders: [25, 30, 45, 55, 65, 60, 80],
  };

  const categories = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const colors = {
    transactions: "#3B82F6", // blue
    products: "#10B981", // green
    orders: "#F59E0B", // yellow
  };

  return {
    series: [
      {
        name:
          type === "transactions"
            ? "Net Profit"
            : type === "products"
            ? "Product Sales"
            : "Order Volume",
        data: chartData[type],
      },
    ],
    chart: {
      type: "area",
      height: 350,
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 3,
      colors: [colors[type]],
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
        colorStops: [],
      },
      colors: [colors[type]],
    },
    xaxis: {
      categories,
      labels: {
        style: { colors: "#9CA3AF", fontSize: "12px" },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: "#9CA3AF", fontSize: "12px" } },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val) => `$${val}k`,
      },
    },
    colors: [colors[type]],
    markers: {
      size: 4,
      colors: [colors[type]],
      strokeWidth: 2,
      hover: { size: 6 },
    },
  };
}
