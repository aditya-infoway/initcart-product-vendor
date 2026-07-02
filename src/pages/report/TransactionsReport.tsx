import React, { useState } from "react";
import { useFormik } from "formik";
import Select from "react-select";
import DataTable from "../../components/common/DataTable";
import ChartWidget from "../../components/common/ChartWidget";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaClipboardList,
  FaHourglassHalf,
  FaMoneyBillWave,
  FaTicketAlt,
  FaTimesCircle,
  FaTruck,
} from "react-icons/fa";
import PaymentStatistics from "../../components/common/PaymentStatistics";

interface Order {
  id: number;
  orderId: string;
  customerName: string;
  totalProductAmount: number;
  productDiscount: number;
  couponDiscount: number;
  referralDiscount: number;
  discountedAmount: number;
  vatTax: number;
  shippingCharge: number;
  orderAmount: number;
  status: "Canceled" | "Ongoing" | "Completed";
}

interface Expense {
  id: number;
  transactionId: string;
  transactionDate: string;
  orderId: string;
  expenseAmount: number;
  expenseType: string;
}

const OrderReport = () => {
  const [activeTab, setActiveTab] = useState<
    "Order Transactions" | "Expense Transactions"
  >("Order Transactions");

  // Dummy data
  const [orders] = useState<Order[]>([
    {
      id: 1,
      orderId: "ORD1001",
      customerName: "John Doe",
      totalProductAmount: 200,
      productDiscount: 10,
      couponDiscount: 5,
      referralDiscount: 2,
      discountedAmount: 183,
      vatTax: 8,
      shippingCharge: 10,
      orderAmount: 201,
      status: "Completed",
    },
    {
      id: 2,
      orderId: "ORD1002",
      customerName: "Jane Smith",
      totalProductAmount: 150,
      productDiscount: 0,
      couponDiscount: 10,
      referralDiscount: 0,
      discountedAmount: 140,
      vatTax: 5,
      shippingCharge: 10,
      orderAmount: 155,
      status: "Ongoing",
    },
  ]);

  const [expenses] = useState<Expense[]>([
    {
      id: 1,
      transactionId: "1380-Z94WY-1",
      transactionDate: "23 September 2025, 04:57:22 pm",
      orderId: "100167",
      expenseAmount: 10,
      expenseType: "Discount On Purchase",
    },
    {
      id: 2,
      transactionId: "1381-Z94WY-2",
      transactionDate: "24 September 2025, 01:12:10 pm",
      orderId: "100168",
      expenseAmount: 15,
      expenseType: "Coupon Discount",
    },
  ]);

  const orderFilterOptions = [
    { value: "All", label: "All" },
    { value: "Disburse", label: "Disburse" },
    { value: "Hold", label: "Hold" },
  ];

  const customerOptions = [
    { value: "All Customers", label: "All Customers" },
    { value: "John Doe", label: "John Doe" },
    { value: "Jane Smith", label: "Jane Smith" },
  ];

  const timeFilterOptions = [
    { value: "This Year", label: "This Year" },
    { value: "This Month", label: "This Month" },
    { value: "This Week", label: "This Week" },
    { value: "Today", label: "Today" },
    { value: "Custom", label: "Custom" },
  ];

  const orderFormik = useFormik({
    initialValues: {
      orderStatus: "All",
      customer: "All Customers",
      timeFilter: "This Year",
      fromDate: "",
      toDate: "",
    },
    onSubmit: (values) => console.log("Order Filter:", values),
  });

  const expenseFormik = useFormik({
    initialValues: { timeFilter: "This Year" },
    onSubmit: (values) => console.log("Expense Filter:", values),
  });

  // Order Summary
  const totalProducts = orders.length;
  const activeProducts = orders.filter((o) => o.status === "Completed").length;
  const inactiveProducts = orders.filter((o) => o.status === "Canceled").length;
  const pendingProducts = orders.filter((o) => o.status === "Ongoing").length;

  // Expense Summary
  const totalExpense = expenses.reduce((sum, e) => sum + e.expenseAmount, 0);
  const freeDelivery = 5; // Example dummy
  const couponDiscount = 15; // Example dummy

  return (
    <div className="bg-gray-50 p-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {["Order Transactions", "Expense Transactions"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab(tab as any)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Order Transactions */}
      {activeTab === "Order Transactions" && (
        <div>
          {/* Filter */}
          <form
            onSubmit={orderFormik.handleSubmit}
            className="mb-6 flex flex-wrap gap-4 items-end"
          >
            {/* Order Status */}
            <div className="flex-1 min-w-[150px]">
              <label className="block mb-1 font-medium">Order Status</label>
              <Select
                name="orderStatus"
                options={orderFilterOptions}
                value={orderFilterOptions.find(
                  (opt) => opt.value === orderFormik.values.orderStatus
                )}
                onChange={(option) =>
                  orderFormik.setFieldValue("orderStatus", option?.value)
                }
                placeholder="Select status..."
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

            {/* Customer */}
            <div className="flex-1 min-w-[150px]">
              <label className="block mb-1 font-medium">Customer</label>
              <Select
                name="customer"
                options={customerOptions}
                value={customerOptions.find(
                  (opt) => opt.value === orderFormik.values.customer
                )}
                onChange={(option) =>
                  orderFormik.setFieldValue("customer", option?.value)
                }
                placeholder="Select customer..."
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

            {/* Time Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="block mb-1 font-medium">Time Filter</label>
              <Select
                name="timeFilter"
                options={timeFilterOptions}
                value={timeFilterOptions.find(
                  (opt) => opt.value === orderFormik.values.timeFilter
                )}
                onChange={(option) =>
                  orderFormik.setFieldValue("timeFilter", option?.value)
                }
                placeholder="Select time filter..."
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

            {/* Conditionally show From and To Dates if Custom is selected */}
            {orderFormik.values.timeFilter === "Custom" && (
              <>
                {/* From Date */}
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-gray-600 text-sm font-medium mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    name="fromDate"
                    className="customInput cursor-pointer w-full border rounded "
                    value={orderFormik.values.fromDate}
                    onChange={(e) =>
                      orderFormik.setFieldValue("fromDate", e.target.value)
                    }
                  />
                </div>

                {/* To Date */}
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-gray-600 text-sm font-medium mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    name="toDate"
                    disabled={!orderFormik.values.fromDate}
                    className="customInput cursor-pointer w-full border rounde"
                    value={orderFormik.values.toDate}
                    onChange={(e) =>
                      orderFormik.setFieldValue("toDate", e.target.value)
                    }
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white"
            >
              Filter
            </button>
          </form>

          {/* Summary Cards */}
          {/* <div className="flex flex-col lg:flex-row gap-4 mb-5 w-full">
            {[
              {
                title: "Total Products",
                value: totalProducts,
                color: "blue",
              },
              {
                title: "Active Products",
                value: activeProducts,
                color: "green",
              },
              {
                title: "Inactive Products",
                value: inactiveProducts,
                color: "red",
              },
              {
                title: "Pending Products",
                value: pendingProducts,
                color: "yellow",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white p-4 rounded-lg shadow flex-1 min-w-[150px]"
              >
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className={`text-2xl font-bold text-${card.color}-600`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div> */}
          <div className="flex flex-col lg:flex-row gap-4 mb-5 w-full">
            {[
              {
                title: "Total Products",
                value: totalProducts,
                color: "blue",
                icon: <FaBoxOpen size={24} />,
              },
              {
                title: "Active Products",
                value: activeProducts,
                color: "green",
                icon: <FaCheckCircle size={24} />,
              },
              {
                title: "Inactive Products",
                value: inactiveProducts,
                color: "red",
                icon: <FaTimesCircle size={24} />,
              },
              {
                title: "Pending Products",
                value: pendingProducts,
                color: "yellow",
                icon: <FaHourglassHalf size={24} />,
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white p-4 rounded-lg shadow flex-1 min-w-[150px] flex items-center gap-4"
              >
                <div className="flex justify-between w-full">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold">{card.title}</h3>
                    <p className={`text-2xl font-bold text-${card.color}-600`}>
                      {card.value}
                    </p>
                  </div>

                  <div className={`text-${card.color}-600`}>{card.icon}</div>
                </div>
              </div>
            ))}
          </div>
          {/* <div className="flex">
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <ChartWidget activeTab="orders" />
            </div>
            <div className="">
              <PaymentStatistics />
            </div>
          </div> */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Chart */}
            <div className="bg-white p-4 rounded-lg shadow flex-1 lg:w-1/2">
              <ChartWidget activeTab="orders" />
            </div>

            {/* Payment Statistics */}
            <div className="bg-white p-4 rounded-lg shadow flex-1 lg:w-1/2 ">
              <PaymentStatistics />
            </div>
          </div>
          {/* Orders Table */}
          <DataTable
            title="Total Transactions"
            data={orders}
            columns={[
              { key: "orderId", label: "Order ID" },
              { key: "customerName", label: "Customer Name" },
              { key: "totalProductAmount", label: "Total Product Amount ($)" },
              { key: "productDiscount", label: "Product Discount ($)" },
              { key: "couponDiscount", label: "Coupon Discount ($)" },
              { key: "referralDiscount", label: "Referral Discount ($)" },
              { key: "discountedAmount", label: "Discounted Amount ($)" },
              { key: "vatTax", label: "VAT/TAX ($)" },
              { key: "shippingCharge", label: "Shipping Charge ($)" },
              { key: "orderAmount", label: "Order Amount ($)" },
            ]}
          />
        </div>
      )}

      {/* Expense Transactions */}
      {activeTab === "Expense Transactions" && (
        <div>
          {/* Filter */}
          <form
            onSubmit={expenseFormik.handleSubmit}
            className="mb-6 flex gap-4 items-end"
          >
            <div className="flex-1 min-w-[150px]">
              <label className="block mb-1 font-medium">Time Filter</label>
              <Select
                name="timeFilter"
                options={timeFilterOptions}
                value={timeFilterOptions.find(
                  (opt) => opt.value === expenseFormik.values.timeFilter
                )}
                onChange={(option) =>
                  expenseFormik.setFieldValue("timeFilter", option?.value || "")
                }
                placeholder="Select time filter..."
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
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white"
            >
              Filter
            </button>
          </form>

          {/* Summary Cards */}

          <div className="flex flex-wrap gap-4 mb-5">
            {[
              {
                title: "Total Expense",
                value: totalExpense,
                color: "blue",
                icon: <FaMoneyBillWave size={24} />,
              },
              {
                title: "Free Delivery",
                value: freeDelivery,
                color: "green",
                icon: <FaTruck size={24} />,
              },
              {
                title: "Coupon Discount",
                value: couponDiscount,
                color: "yellow",
                icon: <FaTicketAlt size={24} />,
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white p-4 rounded-lg shadow flex-1 min-w-[150px] flex items-center gap-4"
              >
                <div className="flex justify-between w-full">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold">{card.title}</h3>
                    <p className={`text-2xl font-bold text-${card.color}-600`}>
                      ${card.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`text-${card.color}-600`}>{card.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <ChartWidget activeTab="transactions" />
          </div>

          {/* Expenses Table */}
          <DataTable
            title="Expense Transactions"
            data={expenses}
            columns={[
              { key: "transactionId", label: "XID" },
              { key: "transactionDate", label: "Transaction Date" },
              { key: "orderId", label: "Order ID" },
              { key: "expenseAmount", label: "Expense Amount ($)" },
              { key: "expenseType", label: "Expense Type" },
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default OrderReport;
