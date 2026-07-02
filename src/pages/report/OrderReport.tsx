import React, { useState } from "react";
import { useFormik } from "formik";
import Select from "react-select";
import DataTable from "../../components/common/DataTable";
import ChartWidget from "../../components/common/ChartWidget";
import { FaClipboardList, FaMoneyBillWave } from "react-icons/fa";
import { GiPayMoney, GiTakeMyMoney } from "react-icons/gi";
import PaymentStatistics from "../../components/common/PaymentStatistics";

interface Order {
  id: number;
  orderId: string;
  totalAmount: number;
  productDiscount: number;
  couponDiscount: number;
  referralDiscount: number;
  shippingCharge: number;
  vatTax: number;
  commission: number;
  deliverymanIncentive: number;
  status: "Canceled" | "Ongoing" | "Completed";
}

const OrderReport = () => {
  const [activeTab, setActiveTab] = useState<"All Orders" | "Order Summary">(
    "All Orders"
  );

  const [orders] = useState<Order[]>([
    {
      id: 1,
      orderId: "ORD1001",
      totalAmount: 250,
      productDiscount: 10,
      couponDiscount: 5,
      referralDiscount: 2,
      shippingCharge: 10,
      vatTax: 8,
      commission: 15,
      deliverymanIncentive: 5,
      status: "Completed",
    },
    {
      id: 2,
      orderId: "ORD1002",
      totalAmount: 180,
      productDiscount: 0,
      couponDiscount: 10,
      referralDiscount: 0,
      shippingCharge: 10,
      vatTax: 5,
      commission: 12,
      deliverymanIncentive: 4,
      status: "Ongoing",
    },
    {
      id: 3,
      orderId: "ORD1003",
      totalAmount: 300,
      productDiscount: 15,
      couponDiscount: 10,
      referralDiscount: 5,
      shippingCharge: 12,
      vatTax: 9,
      commission: 20,
      deliverymanIncentive: 6,
      status: "Canceled",
    },
  ]);

  const filterOptions = [
    { value: "This Year", label: "This Year" },
    { value: "This Month", label: "This Month" },
    { value: "This Week", label: "This Week" },
    { value: "Today", label: "Today" },
    { value: "Custom", label: "Custom" },
  ];

  const formik = useFormik({
    initialValues: { filter: "This Year", fromDate: "", toDate: "" },
    onSubmit: (values) => console.log("Filter values:", values),
  });

  // Summary calculations
  const totalOrders = orders.length;
  const canceledOrders = orders.filter((o) => o.status === "Canceled").length;
  const ongoingOrders = orders.filter((o) => o.status === "Ongoing").length;
  const completedOrders = orders.filter((o) => o.status === "Completed").length;

  const totalOrderAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const dueAmount = totalOrderAmount * 0.2; // Example: 20% due
  const settledAmount = totalOrderAmount - dueAmount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      {/* Tabs */}
      {/* <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "All Orders"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("All Orders")}
        >
          All Orders
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "Order Summary"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("Order Summary")}
        >
          Order Summary
        </button>
      </div> */}

      {/* All Orders */}
      {activeTab === "All Orders" && (
        <div>
          {/* Filter */}
          <form
            onSubmit={formik.handleSubmit}
            className="mb-6 flex flex-wrap gap-4 items-end"
          >
            {/* Filter Orders */}
            <div className="flex-1 min-w-[150px]">
              <label className="block mb-1 font-medium">Filter Orders</label>
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

          <div className="flex flex-col xl:flex-row gap-4 mb-5 items-stretch">
            {/* Left column */}
            <div className="w-full flex flex-col gap-4">
              <div className="bg-white p-4 rounded-lg shadow flex flex-col justify-between flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Total Orders</h3>
                    <p className="text-2xl font-bold">{totalOrders}</p>
                  </div>
                  <FaClipboardList className="text-blue-600 text-3xl" />
                </div>
                <div className="flex justify-evenly mt-4">
                  <div className="text-center">
                    <p className="text-red-500 font-bold text-lg">
                      {canceledOrders}
                    </p>
                    <p className="text-gray-500 text-sm font-semibold">
                      Canceled
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-yellow-500 font-bold text-lg">
                      {ongoingOrders}
                    </p>
                    <p className="text-gray-500 text-sm font-semibold">
                      Ongoing
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-green-500 font-bold text-lg">
                      {completedOrders}
                    </p>
                    <p className="text-gray-500 text-sm font-semibold">
                      Completed
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow flex flex-col justify-between flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Total Order Amount ($)
                    </h3>
                    <p className="text-2xl font-bold">
                      {totalOrderAmount.toLocaleString()}
                    </p>
                  </div>
                  <FaMoneyBillWave className="text-green-600 text-3xl" />
                </div>
                <div className="flex justify-evenly mt-4">
                  <div className="text-center">
                    <p className="text-red-500 font-bold text-lg">
                      ${dueAmount.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-sm font-semibold">Due</p>
                  </div>
                  <div className="text-center">
                    <p className="text-green-500 font-bold text-lg">
                      ${settledAmount.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-sm font-semibold">
                      Settled
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="w-full flex flex-col">
              <div className="bg-white p-4 rounded-lg shadow flex-1">
                <PaymentStatistics />
              </div>
            </div>
          </div>

          {/* Statistics */}

          {/* Chart */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <ChartWidget activeTab="orders" />
          </div>

          {/* Orders Table */}
          <DataTable
            title="Order Statistics"
            data={orders}
            columns={[
              { key: "orderId", label: "Order ID" },
              {
                key: "totalAmount",
                label: "Total Amount ($)",
                render: (item) => `$${item.totalAmount}`,
              },
              {
                key: "productDiscount",
                label: "Product Discount ($)",
                render: (item) => `$${item.productDiscount}`,
              },
              {
                key: "couponDiscount",
                label: "Coupon Discount ($)",
                render: (item) => `$${item.couponDiscount}`,
              },
              {
                key: "referralDiscount",
                label: "Referral Discount ($)",
                render: (item) => `$${item.referralDiscount}`,
              },
              {
                key: "shippingCharge",
                label: "Shipping Charge ($)",
                render: (item) => `$${item.shippingCharge}`,
              },
              {
                key: "vatTax",
                label: "VAT/TAX ($)",
                render: (item) => `$${item.vatTax}`,
              },
              {
                key: "commission",
                label: "Commission ($)",
                render: (item) => `$${item.commission}`,
              },
              {
                key: "deliverymanIncentive",
                label: "Deliveryman Incentive ($)",
                render: (item) => `$${item.deliverymanIncentive}`,
              },
              {
                key: "status",
                label: "Status",
                render: (item) => (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : item.status === "Ongoing"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.status}
                  </span>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* Order Summary */}
      {activeTab === "Order Summary" && (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          <p>Detailed Order Summary Coming Soon...</p>
        </div>
      )}
    </div>
  );
};

export default OrderReport;
