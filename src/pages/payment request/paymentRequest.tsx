// pages/vendor/payments/PaymentRequest.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaArrowLeft } from "react-icons/fa";
import axiosInstance from "../../utils/axiosInstance";

interface EligibleOrder {
  order_id: number;
  order_number: string;
  created_at: string;
  billing_name: string;
  vendor_total: number;
  platform_charge: number;
  net_amount: number;
}

interface FormData {
  vendor_name: string;
  company_name: string;
  orders: EligibleOrder[];
  cod_platform_charge_pending: number;
  stats: {
    total_amount: number;
    pending_amount: number;
    received_amount: number;
  };
}

const todayStr = () => new Date().toISOString().split("T")[0];
const daysAgoStr = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const PaymentRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [dateFrom, setDateFrom] = useState(daysAgoStr(180));
  const [dateTo, setDateTo] = useState(todayStr());

  useEffect(() => {
    fetchFormData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  const fetchFormData = async () => {
    setLoading(true);
    try {
      console.log("Fetching with date_from:", dateFrom, "date_to:", dateTo);
      const response = await axiosInstance.get("/vendor/payment-request/form-data/", {
        params: { date_from: dateFrom, date_to: dateTo },
      });
     
      if (response.data.success) {
        setFormData(response.data.data);
        setSelectedOrderIds([]);
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to load payment request data",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder = (orderId: number) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleAll = () => {
    if (!formData) return;
    setSelectedOrderIds(
      selectedOrderIds.length === formData.orders.length
        ? []
        : formData.orders.map((o) => o.order_id)
    );
  };

  const selectedSummary = useMemo(() => {
    if (!formData) {
      return { totalOrderAmount: 0, onlinePlatformCharge: 0, codPlatformCharge: 0, releaseAmount: 0 };
    }
    const selected = formData.orders.filter((o) => selectedOrderIds.includes(o.order_id));
    const totalOrderAmount = selected.reduce((sum, o) => sum + o.vendor_total, 0);
    const onlinePlatformCharge = selected.reduce((sum, o) => sum + o.platform_charge, 0);
    const codPlatformCharge = formData.cod_platform_charge_pending;
    const releaseAmount = totalOrderAmount - onlinePlatformCharge - codPlatformCharge;
    return { totalOrderAmount, onlinePlatformCharge, codPlatformCharge, releaseAmount };
  }, [selectedOrderIds, formData]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });

  const handleSubmit = async () => {
    if (selectedOrderIds.length === 0) {
      Swal.fire({ icon: "warning", title: "No orders selected", text: "Please select at least one order." });
      return;
    }
    const confirm = await Swal.fire({
      icon: "question",
      title: "Send Payment Request?",
      text: `You are requesting ${formatCurrency(selectedSummary.releaseAmount)} for ${selectedOrderIds.length} order(s) between ${dateFrom} and ${dateTo}.`,
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      confirmButtonText: "Yes, Send Request",
    });
    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    try {
      const response = await axiosInstance.post("/vendor/payment-request/create/", {
        order_ids: selectedOrderIds,
        date_from: dateFrom,
        date_to: dateTo,
      });
      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Request Sent",
          text: `Payment Request ID: ${response.data.data.payment_request_id}`,
        });
        setSelectedOrderIds([]);
        fetchFormData();
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          error.response?.data?.errors?.non_field_errors?.[0] ||
          "Failed to send payment request",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!formData) return null;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        <FaArrowLeft className="mr-2" /> Back to Requests
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Payment Request</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-gray-500 text-sm mb-1">Total Eligible Amount (All-Time)</p>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(formData.stats.total_amount)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-gray-500 text-sm mb-1">Pending Amount</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(formData.stats.pending_amount)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-gray-500 text-sm mb-1">Received Amount</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(formData.stats.received_amount)}</p>
        </div>
      </div>

      {/* From / To */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Payment Request ID</label>
            <input
              disabled
              value="Auto-generated after submit"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">From (Vendor)</label>
            <input
              disabled
              value={formData.vendor_name}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-700 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">To</label>
            <input
              disabled
              value={formData.company_name}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-700 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Select Order Date Range</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={todayStr()}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Select Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Select Orders <span className="text-sm text-gray-400">(Online payment, delivered, in selected range)</span>
          </h2>
          {formData.orders.length > 0 && (
            <button onClick={toggleAll} className="text-sm text-blue-600 hover:underline">
              {selectedOrderIds.length === formData.orders.length ? "Unselect All" : "Select All"}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : formData.orders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No eligible orders in this date range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform Charge</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.orders.map((order) => (
                  <tr key={order.order_id} className={selectedOrderIds.includes(order.order_id) ? "bg-blue-50" : ""}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.order_id)}
                        onChange={() => toggleOrder(order.order_id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.order_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.billing_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{formatCurrency(order.vendor_total)}</td>
                    <td className="px-4 py-3 text-sm text-red-600">-{formatCurrency(order.platform_charge)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={4} className="px-4 py-3 text-right text-gray-700">Total (All Orders Above):</td>
                  <td className="px-4 py-3 text-gray-900">
                    {formatCurrency(formData.orders.reduce((s, o) => s + o.vendor_total, 0))}
                  </td>
                  <td className="px-4 py-3 text-red-600">
                    -{formatCurrency(formData.orders.reduce((s, o) => s + o.platform_charge, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}


      </div>

      {/* Amount Summary — raw total + deductions SEPARATE */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Amount Summary (Selected Orders)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Total Order Amount</label>
            <input
              disabled
              value={formatCurrency(selectedSummary.totalOrderAmount)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 font-bold text-lg"
            />
            <p className="text-[11px] text-gray-400 mt-1">Raw total without any deductions</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Platform Charge — Online Orders</label>
            <input
              disabled
              value={`- ${formatCurrency(selectedSummary.onlinePlatformCharge)}`}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg font-semibold"
            />
            <p className="text-[11px] text-gray-400 mt-1">Deducted from selected online orders</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Platform Charge — COD Orders</label>
            <input
              disabled
              value={`- ${formatCurrency(selectedSummary.codPlatformCharge)}`}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg font-semibold"
            />
            <p className="text-[11px] text-gray-400 mt-1">Recovered from COD orders in this date range</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-blue-600 mb-1">Release Payment Amount</label>
            <input
              disabled
              value={formatCurrency(selectedSummary.releaseAmount)}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-blue-50 text-blue-700 font-bold text-lg"
            />
            <p className="text-[11px] text-gray-400 mt-1">Total − Online Charge − COD Charge</p>
          </div>
        </div>
      </div>
              <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedOrderIds.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? "Sending Request..." : "Send Payment Request"}
          </button>
        </div>
    </div>
  );
};

export default PaymentRequest;