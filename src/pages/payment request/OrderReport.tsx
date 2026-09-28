// pages/vendor/reports/OrderReport.tsx
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaSearch, FaFileDownload } from "react-icons/fa";
import axiosInstance from "../../utils/axiosInstance";

interface OrderReportRow {
  sr_no: number;
  order_id: number;
  order_number: string;
  order_time: string;
  order_status: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  customer_email: string;
  payment_mode: string;
  order_amount: number;
  platform_charge: number;
  received_amount: number;
  order_age_days: number;
}

interface Pagination {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

const todayStr = () => new Date().toISOString().split("T")[0];
const daysAgoStr = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const OrderReport = () => {
  const [rows, setRows] = useState<OrderReportRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(daysAgoStr(180));
  const [dateTo, setDateTo] = useState(todayStr());
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, page]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/vendor/order-report/", {
        params: { date_from: dateFrom, date_to: dateTo, search: search || undefined, page, page_size: 15 },
      });
      if (response.data.success) {
        setRows(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to load order report",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchReport();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleApplyFilters();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(amount || 0);

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  const statusStyle = (statusVal: string) => {
    switch (statusVal?.toLowerCase()) {
      case "delivered": return "text-green-700 bg-green-50";
      case "pending": return "text-yellow-700 bg-yellow-50";
      case "confirmed": return "text-blue-700 bg-blue-50";
      case "processing": return "text-purple-700 bg-purple-50";
      case "shipped": return "text-indigo-700 bg-indigo-50";
      case "cancelled": return "text-red-700 bg-red-50";
      case "refunded": return "text-orange-700 bg-orange-50";
      default: return "text-gray-700 bg-gray-50";
    }
  };

  const paymentModeStyle = (mode: string) =>
    mode === "razorpay" ? "text-blue-700 bg-blue-50" : "text-orange-700 bg-orange-50";

  const orderAgeStyle = (days: number) => {
    if (days >= 7) return "text-gray-700";
    if (days >= 3) return "text-orange-600 font-medium";
    return "text-green-600 font-medium";
  };

  const totals = rows.reduce(
    (acc, r) => ({
      order_amount: acc.order_amount + r.order_amount,
      platform_charge: acc.platform_charge + r.platform_charge,
      received_amount: acc.received_amount + r.received_amount,
    }),
    { order_amount: 0, platform_charge: 0, received_amount: 0 }
  );

  const handleExportCSV = () => {
    if (rows.length === 0) {
      Swal.fire({ icon: "warning", title: "No data to export" });
      return;
    }
    const headers = [
      "SR", "Order ID", "Order Time", "Order Status", "Customer Name", "Mobile",
      "City", "Email", "Payment Mode", "Order Amount", "Platform Charge",
      "Received Amount", "Order Age (Days)",
    ];
    const csvRows = rows.map((r) => [
      r.sr_no, r.order_number, formatDateTime(r.order_time), r.order_status,
      r.customer_name, r.customer_phone, r.customer_city || "", r.customer_email || "",
      r.payment_mode, r.order_amount, r.platform_charge, r.received_amount, r.order_age_days,
    ]);
    const csvContent = [headers, ...csvRows]
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `order_report_${dateFrom}_to_${dateTo}_page${page}.csv`;
    link.click();
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Order Report</h1>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <FaFileDownload /> Export CSV (current page)
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date" value={dateFrom} max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date" value={dateTo} min={dateFrom} max={todayStr()}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search by order ID, customer name, phone, email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleApplyFilters} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-gray-500 text-sm mb-1">Total Orders (All Pages)</p>
          <p className="text-2xl font-bold text-gray-800">{pagination?.count ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-gray-500 text-sm mb-1">Order Amount (This Page)</p>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(totals.order_amount)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-gray-500 text-sm mb-1">Platform Charge (This Page)</p>
          <p className="text-2xl font-bold text-red-600">-{formatCurrency(totals.platform_charge)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-gray-500 text-sm mb-1">Received Amount (This Page)</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.received_amount)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : rows.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders found for this date range.</p>
        ) : (
          <>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">SR</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Order ID</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Order Time</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Customer Name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Mobile</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">City</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Email</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Payment Mode</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Order Amount</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Platform Charge</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Received Amount</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Order Age</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rows.map((row) => (
                      <tr key={row.order_id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-gray-600">{row.sr_no}</td>
                        <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{row.order_number}</td>
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(row.order_time)}</td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusStyle(row.order_status)}`}>
                            {row.order_status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-800 whitespace-nowrap">{row.customer_name}</td>
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{row.customer_phone}</td>
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{row.customer_city || "-"}</td>
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{row.customer_email || "-"}</td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${paymentModeStyle(row.payment_mode)}`}>
                            {row.payment_mode === "razorpay" ? "Online" : "COD"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-900 font-medium whitespace-nowrap">{formatCurrency(row.order_amount)}</td>
                        <td className="px-3 py-3 text-red-600 whitespace-nowrap">-{formatCurrency(row.platform_charge)}</td>
                        <td className="px-3 py-3 text-green-700 font-medium whitespace-nowrap">{formatCurrency(row.received_amount)}</td>
                        <td className={`px-3 py-3 whitespace-nowrap ${orderAgeStyle(row.order_age_days)}`}>
                          {row.order_age_days === 0 ? "Today" : `${row.order_age_days} day${row.order_age_days > 1 ? "s" : ""}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={9} className="px-3 py-3 text-right text-gray-700">Page Total:</td>
                      <td className="px-3 py-3 text-gray-900 whitespace-nowrap">{formatCurrency(totals.order_amount)}</td>
                      <td className="px-3 py-3 text-red-600 whitespace-nowrap">-{formatCurrency(totals.platform_charge)}</td>
                      <td className="px-3 py-3 text-green-700 whitespace-nowrap">{formatCurrency(totals.received_amount)}</td>
                      <td className="px-3 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Pagination controls */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <p className="text-sm text-gray-500">
                  Showing page {pagination.current_page} of {pagination.total_pages} ({pagination.count} total orders)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.has_previous}
                    className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.has_next}
                    className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderReport;