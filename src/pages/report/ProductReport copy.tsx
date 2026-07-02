import { useState } from "react";
import DataTable from "../../components/common/DataTable";
import { FaBoxOpen } from "react-icons/fa";
import { MdCancel, MdPendingActions, MdCheckCircle } from "react-icons/md";
import { GiReceiveMoney } from "react-icons/gi";
import { RiCoupon2Line } from "react-icons/ri";
import { IoSearch } from "react-icons/io5";
import { FaFileExport } from "react-icons/fa";

const ProductReport = () => {
  const [activeTab, setActiveTab] = useState<"all" | "stock">("all");
  const [filter, setFilter] = useState("This Year");
  const [searchTerm, setSearchTerm] = useState("");

  const allProducts = [
    {
      id: 1,
      name: "iPhone 15",
      unitPrice: 79999,
      totalSoldAmount: 2399970,
      totalQuantity: 30,
      avgValue: 79999,
      currentStock: 12,
      avgRating: 4.7,
    },
    {
      id: 2,
      name: "Samsung Galaxy S24",
      unitPrice: 75999,
      totalSoldAmount: 2279970,
      totalQuantity: 30,
      avgValue: 75999,
      currentStock: 8,
      avgRating: 4.5,
    },
  ];

  const chartData = [
    { month: "Jan", sales: 0 },
    { month: "Feb", sales: 0 },
    { month: "Mar", sales: 0 },
    { month: "Apr", sales: 0 },
    { month: "May", sales: 0 },
    { month: "Jun", sales: 0 },
    { month: "Jul", sales: 0 },
    { month: "Aug", sales: 0 },
    { month: "Sep", sales: 0 },
    { month: "Oct", sales: 0 },
    { month: "Nov", sales: 0 },
    { month: "Dec", sales: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-5">
      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-5 py-2 font-semibold rounded-t-lg ${
            activeTab === "all"
              ? "bg-white text-blue-600 shadow-sm border border-b-0"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          All Products
        </button>
        <button
          onClick={() => setActiveTab("stock")}
          className={`px-5 py-2 font-semibold rounded-t-lg ${
            activeTab === "stock"
              ? "bg-white text-blue-600 shadow-sm border border-b-0"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          Products Stock
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex items-center gap-3">
        <label className="text-gray-700 font-semibold">Filter Data</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 bg-white"
        >
          <option>This Year</option>
          <option>This Month</option>
          <option>This Week</option>
          <option>Today</option>
          <option>Custom</option>
        </select>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          Filter
        </button>
      </div>

      {/* Stats + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center gap-5 mb-4">
              <div className="flex items-center gap-2">
                <FaBoxOpen className="text-blue-600 text-2xl" />
                <div>
                  <h3 className="text-xl font-bold">0</h3>
                  <p className="text-sm text-gray-500">Total Product</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-10">
                <div className="text-center">
                  <MdCancel className="text-red-500 text-2xl mx-auto" />
                  <p className="text-sm text-gray-500">Rejected</p>
                  <p className="text-red-600 font-semibold">0</p>
                </div>
                <div className="text-center">
                  <MdPendingActions className="text-yellow-500 text-2xl mx-auto" />
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-yellow-600 font-semibold">0</p>
                </div>
                <div className="text-center">
                  <MdCheckCircle className="text-green-500 text-2xl mx-auto" />
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-green-600 font-semibold">0</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GiReceiveMoney className="text-orange-500 text-3xl" />
              <div>
                <h3 className="text-xl font-bold">0</h3>
                <p className="text-sm text-gray-500">Total Product Sale</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RiCoupon2Line className="text-red-500 text-3xl" />
              <div>
                <h3 className="text-xl font-bold">$0.00</h3>
                <p className="text-sm text-gray-500">Total Discount Given</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4">Product Statistics</h3>
          <div className="h-64">
            {/* <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="month" stroke="#ccc" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer> */}
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg text-gray-700">
            Total Product <span className="text-gray-400 text-sm">(0)</span>
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
              <IoSearch className="text-gray-500 text-lg mr-2" />
              <input
                type="text"
                placeholder="Search Product Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none text-sm text-gray-700"
              />
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Search
            </button>
            <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <FaFileExport /> Export
            </button>
          </div>
        </div>

        <DataTable
          data={allProducts}
          columns={[
            { key: "id", label: "SL" },
            { key: "name", label: "Product Name" },
            { key: "unitPrice", label: "Product Unit Price" },
            { key: "totalSoldAmount", label: "Total Amount Sold" },
            { key: "totalQuantity", label: "Total Quantity Sold" },
            { key: "avgValue", label: "Average Product Value" },
            { key: "currentStock", label: "Current Stock Amount" },
            { key: "avgRating", label: "Average Ratings" },
          ]}
        />
      </div>
    </div>
  );
};

export default ProductReport;
