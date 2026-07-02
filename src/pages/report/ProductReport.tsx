import React, { useState } from "react";
import { useFormik } from "formik";
import Select from "react-select";
import DataTable from "../../components/common/DataTable";
import { FaBoxOpen } from "react-icons/fa";
import { GiReceiveMoney } from "react-icons/gi";
import { RiCoupon2Line } from "react-icons/ri";
import ChartWidget from "../../components/common/ChartWidget";
// import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

// Register Chart.js components
// ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Product {
  id: number;
  name: string;
  unitPrice: number;
  totalAmountSold: number;
  totalQuantitySold: number;
  averageProductValue: number;
  currentStock: number;
  averageRating: number;
  status: "Active" | "Pending" | "Rejected";
  lastUpdatedStock: string;
}

const ProductReport = () => {
  const [activeTab, setActiveTab] = useState<"All Products" | "Products Stock">(
    "All Products"
  );
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Android Phone X",
      unitPrice: 599,
      totalAmountSold: 11980,
      totalQuantitySold: 20,
      averageProductValue: 599,
      currentStock: 50,
      averageRating: 4.5,
      status: "Active",
      lastUpdatedStock: "2025-10-01",
    },
    {
      id: 2,
      name: "iPhone 14",
      unitPrice: 999,
      totalAmountSold: 19980,
      totalQuantitySold: 20,
      averageProductValue: 999,
      currentStock: 30,
      averageRating: 4.8,
      status: "Pending",
      lastUpdatedStock: "2025-10-02",
    },
    {
      id: 3,
      name: "Gaming Laptop",
      unitPrice: 1499,
      totalAmountSold: 14990,
      totalQuantitySold: 10,
      averageProductValue: 1499,
      currentStock: 15,
      averageRating: 4.2,
      status: "Active",
      lastUpdatedStock: "2025-10-03",
    },
    {
      id: 4,
      name: "Wall Art",
      unitPrice: 49,
      totalAmountSold: 980,
      totalQuantitySold: 20,
      averageProductValue: 49,
      currentStock: 100,
      averageRating: 4.0,
      status: "Rejected",
      lastUpdatedStock: "2025-10-04",
    },
  ]);

  const filterOptions = [
    { value: "This Year", label: "This Year" },
    { value: "This Month", label: "This Month" },
    { value: "This Week", label: "This Week" },
    { value: "Today", label: "Today" },
    { value: "Custom", label: "Custom" },
  ];

  const categoryOptions = [
    { value: "All Categories", label: "All Categories" },
    { value: "Mobile Phones", label: "Mobile Phones" },
    { value: "Laptops & Tablets", label: "Laptops & Tablets" },
    { value: "Home Decor", label: "Home Decor" },
  ];

  const sortOptions = [
    { value: "Low to High", label: "Low to High" },
    { value: "High to Low", label: "High to Low" },
  ];

  const formik = useFormik({
    initialValues: {
      filter: "This Year",
      category: "All Categories",
      sort: "Low to High",
      fromDate: "",
      toDate: ""
    },
    onSubmit: (values) => {
      // Implement filtering logic here
      console.log("Filter values:", values);
    },
  });

  // Calculate statistics for All Products tab
  const totalProducts = products.length;
  const rejectedProducts = products.filter(
    (p) => p.status === "Rejected"
  ).length;
  const pendingProducts = products.filter((p) => p.status === "Pending").length;
  const activeProducts = products.filter((p) => p.status === "Active").length;
  const totalSales = products.reduce((sum, p) => sum + p.totalAmountSold, 0);
  const totalDiscount = totalSales * 0.1; // Example: 10% discount

  // Chart data for Product Statistics
  const chartData = {
    labels: products.map((p) => p.name),
    datasets: [
      {
        label: "Total Sales ($)",
        data: products.map((p) => p.totalAmountSold),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "All Products"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("All Products")}
        >
          All Products
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "Products Stock"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("Products Stock")}
        >
          Products Stock
        </button>
      </div>

      {activeTab === "All Products" && (
        <div>
          {/* Filters */}
          <form
            onSubmit={formik.handleSubmit}
            className="mb-6 flex flex-wrap gap-4 items-end"
          >
            {/* Filter Data */}
            <div className="flex-1 min-w-[150px]">
              <label className="block mb-1 font-medium">Filter Data</label>
              <Select
                name="filter"
                options={filterOptions}
                value={filterOptions.find(
                  (opt) => opt.value === formik.values.filter
                )}
                onChange={(option) =>
                  formik.setFieldValue("filter", option ? option.value : "")
                }
                placeholder="Select filter..."
                isSearchable
                className="text-sm"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "12px",
                    padding: "8.5px 15px",
                    backgroundColor: "#f5f7f9",
                    borderColor: "transparent",
                    boxShadow: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
                  }),
                }}
              />
            </div>

            {/* Conditionally show From Date & To Date if Custom */}
            {formik.values.filter === "Custom" && (
              <>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-gray-600 text-sm font-medium mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    name="fromDate"
                    className="customInput cursor-pointer w-full border rounded px-2 py-1"
                    value={formik.values.fromDate}
                    onChange={(e) =>
                      formik.setFieldValue("fromDate", e.target.value)
                    }
                  />
                </div>

                <div className="flex-1 min-w-[150px]">
                  <label className="block text-gray-600 text-sm font-medium mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    name="toDate"
                    className="customInput cursor-pointer w-full border rounded px-2 py-1"
                    value={formik.values.toDate}
                    onChange={(e) =>
                      formik.setFieldValue("toDate", e.target.value)
                    }
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white cursor-pointer"
            >
              Filter
            </button>
          </form>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow flex flex-col gap-5">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Total Products</h3>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                </div>
                <div>
                  <FaBoxOpen className="text-blue-600 text-4xl" />
                </div>
              </div>
              <div className="justify-evenly flex">
                <div className="text-center">
                  <div className="text-red-500 font-bold text-lg">
                    {rejectedProducts}
                  </div>
                  <div className="text-gray-500 text-sm font-semibold">
                    Rejected
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-blue-500 font-bold text-lg">
                    {rejectedProducts}
                  </div>
                  <div className="text-gray-500 text-sm font-semibold">
                    Pending
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-green-500 font-bold text-lg">
                    {rejectedProducts}
                  </div>
                  <div className="text-gray-500 text-sm font-semibold">
                    Active
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Total Product Sales</h3>
                <p className="text-2xl font-bold">
                  ${totalSales.toLocaleString()}
                </p>
              </div>
              <div>
                <GiReceiveMoney className="text-orange-500 text-3xl" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Total Discount Given</h3>
                <p className="text-2xl font-bold">
                  ${totalDiscount.toLocaleString()}
                </p>
              </div>
              <div>
                <RiCoupon2Line className="text-red-500 text-3xl" />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <ChartWidget activeTab="products" />
          </div>

          {/* Product Statistics Table */}
          <DataTable
            title="Product Statistics"
            data={products}
            columns={[
              { key: "name", label: "Product Name" },
              {
                key: "unitPrice",
                label: "Unit Price ($)",
                render: (item) => `$${item.unitPrice}`,
              },
              {
                key: "totalAmountSold",
                label: "Total Amount Sold ($)",
                render: (item) => `$${item.totalAmountSold}`,
              },
              { key: "totalQuantitySold", label: "Total Quantity Sold" },
              {
                key: "averageProductValue",
                label: "Average Product Value ($)",
                render: (item) => `$${item.averageProductValue}`,
              },
              { key: "currentStock", label: "Current Stock" },
              {
                key: "averageRating",
                label: "Average Rating",
                render: (item) => `${item.averageRating}/5`,
              },
            ]}
          />
        </div>
      )}

      {activeTab === "Products Stock" && (
        <div>
          {/* Filters */}
          <form
            onSubmit={formik.handleSubmit}
            className="mb-6 flex gap-4 items-end"
          >
            <div className="flex-1">
              <label className="block mb-1 font-medium">Category</label>
              <Select
                name="category"
                options={categoryOptions}
                value={categoryOptions.find(
                  (opt) => opt.value === formik.values.category
                )}
                onChange={(option) =>
                  formik.setFieldValue("category", option ? option.value : "")
                }
                placeholder="Select category..."
                isSearchable
                className="text-sm"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "12px",
                    padding: "2px",
                    backgroundColor: "#f5f7f9",
                    borderColor: "transparent",
                    boxShadow: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
                  }),
                }}
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-medium">Sort Stock</label>
              <Select
                name="sort"
                options={sortOptions}
                value={sortOptions.find(
                  (opt) => opt.value === formik.values.sort
                )}
                onChange={(option) =>
                  formik.setFieldValue("sort", option ? option.value : "")
                }
                placeholder="Select sort..."
                className="text-sm"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "12px",
                    padding: "2px",
                    backgroundColor: "#f5f7f9",
                    borderColor: "transparent",
                    boxShadow: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
                  }),
                }}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white cursor-pointer"
            >
              Filter
            </button>
          </form>

          {/* Stock Table */}
          <DataTable
            title="Product Stock"
            data={products}
            columns={[
              { key: "name", label: "Product Name" },
              { key: "lastUpdatedStock", label: "Last Updated Stock" },
              { key: "currentStock", label: "Current Stock" },
              {
                key: "status",
                label: "Status",
                render: (item) => (
                  <span
                    className={`text-sm font-semibold ${
                      item.currentStock > 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {item.currentStock > 0 ? "In-Stock" : "Out of Stock"}
                  </span>
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default ProductReport;
