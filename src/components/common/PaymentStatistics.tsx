import React, { useEffect, useRef } from "react";
import ApexCharts, { type ApexOptions } from "apexcharts";

const PaymentStatistics: React.FC = () => {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const total = 33640.8 + 12880 + 5945.5 + 0;

    const options: ApexOptions = {
      chart: {
        type: "donut",
        height: 280,
        
      },
      series: [33640.8, 12880, 5945.5, 0],
      labels: [
        "Cash Payments",
        "Digital Payments",
        "Wallet",
        "Offline Payments ",
      ],
      colors: ["#1e3a8a", "#60a5fa", "#fbbf24", "#cbd5e1"],
      legend: {
        position: "bottom",
        fontSize: "14px",
        labels: { colors: "#6b7280" },
        markers: {
          size: 7, // correct property
          shape: "circle", // optional
        },
      },

      stroke: {
        width: 0,
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        y: {
          formatter: (val) => `$${val.toLocaleString()}`,
        },
      },
      // plotOptions: {
      //   pie: {
      //     donut: {
      //       size: "75%",
      //       labels: {
      //         show: true,
      //         name: {
      //           show: true,
      //           offsetY: 25,
      //           color: "#6b7280",
      //         },
      //         value: {
      //           show: true,
      //           fontSize: "22px",
      //           fontWeight: 700,
      //           formatter: () => `$${(total / 1000).toFixed(1)}K+`,
      //         },
      //         total: {
      //           show: true,
      //           label: "Completed Payments",
      //           color: "#6b7280",
      //           fontSize: "14px",
      //           fontWeight: 500,
      //         },
      //       },
      //     },
      //   },
      // },
      plotOptions: {
        pie: {
          donut: {
            size: "75%",
            labels: {
              show: true,
              name: {
                show: true,
                offsetY: -10, // move name up
                color: "#6b7280",
              },
              value: {
                show: true,
                fontSize: "22px",
                fontWeight: 700,
                offsetY: 10, // move value down
                formatter: () => `$${(total / 1000).toFixed(1)}K+`,
              },
              total: {
                show: true,
                label: "Completed Payments",
                color: "#6b7280",
                fontSize: "14px",
                fontWeight: 500, 
              },
            },
          },
        },
      },
    };

    const chart = new ApexCharts(chartRef.current, options);
    chart.render();

    return () => {
      chart.destroy();
    };
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-lg font-semibold mb-6">Payment Statistics</h2>
      <div ref={chartRef}></div>
    </div>
  );
};

export default PaymentStatistics;
