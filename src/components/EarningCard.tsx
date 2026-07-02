import { useEffect, useRef, useState, type FC } from "react";

type Props = {
  className: string;
  chartSize?: number;
  chartLine?: number;
  chartRotate?: number;
  onFilterChange?: (value: string) => void;
};

const EarningCard: FC<Props> = ({
  className,
  chartSize = 70,
  chartLine = 11,
  chartRotate = 145,
  onFilterChange,
}) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [filter, setFilter] = useState<string>("Overall");

  useEffect(() => {
    refreshChart();
  }, [filter]);

  const refreshChart = () => {
    if (!chartRef.current) return;
    setTimeout(() => {
      initChart(chartSize, chartLine, chartRotate);
    }, 10);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    onFilterChange?.(value);
  };

  return (
    <div className={`bg-white flex flex-col items-center gap-5 shadow-sm rounded-lg ${className}`}>
      <div className="flex justify-between items-start px-6 pt-5">
        {/* Left: Earnings Info */}
        <div className="flex flex-col">
          <div className="flex items-start">
            <span className="text-gray-500 text-base font-semibold leading-none mr-1 mt-1">
              ₹
            </span>
            <span className="text-4xl font-bold text-gray-900 mr-2 leading-tight">
              69,700
            </span>
          </div>
          <span className="text-gray-500 pt-1 font-semibold text-sm">
            Withdrawable balance
          </span>
        </div>
      </div>

      {/* Chart & Breakdown */}
      <div className="pb-5">
        <button className="px-7 py-3  rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">Withdraw</button>
      </div>
    </div>
  );
};

const initChart = function (
  chartSize: number = 70,
  chartLine: number = 11,
  chartRotate: number = 145
) {
  const el = document.getElementById("kt_card_widget_17_chart");
  if (!el) return;

  el.innerHTML = "";

  const options = {
    size: chartSize,
    lineWidth: chartLine,
    rotate: chartRotate,
  };
  const canvas = document.createElement("canvas");
  const span = document.createElement("span");
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.height = options.size;

  el.appendChild(span);
  el.appendChild(canvas);
  ctx?.translate(options.size / 2, options.size / 2);
  ctx?.rotate((-1 / 2 + options.rotate / 180) * Math.PI);

  const radius = (options.size - options.lineWidth) / 2;

  const drawCircle = (color: string, lineWidth: number, percent: number) => {
    percent = Math.min(Math.max(0, percent || 1), 1);
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2 * percent, false);
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  };

  drawCircle("#E4E6EF", options.lineWidth, 1);
};

export { EarningCard };
