// pages/vendor/payments/PaymentRequestList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import DataTable from "../../components/common/DataTable";
import axiosInstance from "../../utils/axiosInstance";

interface OrderRow {
  order_id: number;
  order_number: string;
  created_at: string;
  billing_name: string;
  vendor_total: number;
  platform_charge: number;
  approval_status: "pending" | "approved" | "rejected" | "not_approved";
}

interface PaymentRequestRow {
  id: number;
  payment_request_id: string;
  date_from: string;
  date_to: string;
  total_order_amount: number;
  online_platform_charge: number;
  cod_platform_charge: number;
  total_platform_charge: number;
  release_payment_amount: number;
  approved_order_amount: number;
  approved_online_charge: number;
  approved_amount: number;
  status: "pending" | "approved" | "paid" | "rejected";
  admin_remarks: string | null;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
  orders_data?: OrderRow[];
  approved_order_ids?: number[];
}

const PaymentRequestList = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PaymentRequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderModalLoading, setOrderModalLoading] = useState(false);
  const [activeRequest, setActiveRequest] = useState<PaymentRequestRow | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/vendor/payment-request/list/");
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to fetch payment requests",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(amount || 0);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const statusStyle = (statusVal: string) => {
    switch (statusVal) {
      case "paid":
        return "text-blue-700 bg-blue-50";
      case "approved":
        return "text-blue-700 bg-blue-50";
      case "rejected":
        return "text-gray-700 bg-gray-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const orderStatusStyle = (statusVal: string) => {
    switch (statusVal) {
      case "approved":
        return "text-blue-700 bg-blue-50";
      case "rejected":
        return "text-gray-700 bg-gray-100";
      case "not_approved":
        return "text-gray-700 bg-gray-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const orderStatusLabel = (statusVal: string) => {
    switch (statusVal) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "not_approved":
        return "Not Approved";
      default:
        return "Pending";
    }
  };

  const handleView = (item: PaymentRequestRow) => {
    Swal.fire({
      title: `Payment Request`,
      width: 650,
      html: `
        <div style="width:100%; margin: 0 auto; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden;">
          <table style="width:100%; border-collapse: collapse; font-size: 14px; text-align: left;">
            <tbody>
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 12px 16px; font-weight: 600; color: #4b5563; width: 40%; background-color: #f9fafb; border-right: 1px solid #d1d5db;">Request ID</td>
                <td style="padding: 12px 16px; font-weight: 600; color: #1f2937;">${item.payment_request_id}</td>
              </tr>
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 12px 16px; font-weight: 600; color: #4b5563; background-color: #f9fafb; border-right: 1px solid #d1d5db;">Date Range</td>
                <td style="padding: 12px 16px; color: #1f2937;">${formatDate(item.date_from)} - ${formatDate(item.date_to)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 12px 16px; font-weight: 600; color: #4b5563; background-color: #f9fafb; border-right: 1px solid #d1d5db;">Order Amount</td>
                <td style="padding: 12px 16px; color: #1f2937;">${formatCurrency(item.total_order_amount)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 12px 16px; font-weight: 600; color: #4b5563; background-color: #f9fafb; border-right: 1px solid #d1d5db;">Online Platform Charge</td>
                <td style="padding: 12px 16px; color: #1f2937;">${formatCurrency(item.online_platform_charge)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 12px 16px; font-weight: 600; color: #4b5563; background-color: #f9fafb; border-right: 1px solid #d1d5db;">COD Platform Charge</td>
                <td style="padding: 12px 16px; color: #1f2937;">${formatCurrency(item.cod_platform_charge)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 12px 16px; font-weight: 600; color: #4b5563; background-color: #f9fafb; border-right: 1px solid #d1d5db;">Total Platform Charge</td>
                <td style="padding: 12px 16px; color: #1f2937;">${formatCurrency(item.total_platform_charge)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 12px 16px; font-weight: 600; color: #4b5563; background-color: #f9fafb; border-right: 1px solid #d1d5db;">Requested Release Amount</td>
                <td style="padding: 12px 16px; font-weight: 700; color: #2563eb;">${formatCurrency(item.release_payment_amount)}</td>
              </tr>
              ${item.status === "paid" || item.status === "approved" ? `
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 12px 16px; font-weight: 600; color: #4b5563; background-color: #f9fafb; border-right: 1px solid #d1d5db;">Approved Amount</td>
                <td style="padding: 12px 16px; font-weight: 600; color: #2563eb;">${formatCurrency(item.approved_amount)}</td>
              </tr>
              ` : ""}
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 12px 16px; font-weight: 600; color: #4b5563; background-color: #f9fafb; border-right: 1px solid #d1d5db;">Status</td>
                <td style="padding: 12px 16px;">
                  <span style="padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: capitalize; background: ${item.status === 'paid' || item.status === 'approved' ? '#dbeafe' : '#f3f4f6'}; color: ${item.status === 'paid' || item.status === 'approved' ? '#2563eb' : '#6b7280'};">
                    ${item.status}
                  </span>
                </td>
              </tr>
              ${item.admin_remarks ? `
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 12px 16px; font-weight: 600; color: #4b5563; background-color: #f9fafb; border-right: 1px solid #d1d5db;">Admin Remarks</td>
                <td style="padding: 12px 16px; color: #6b7280; font-style: italic;">${item.admin_remarks}</td>
              </tr>
              ` : ""}
              <tr>
                <td style="padding: 12px 16px; font-weight: 600; color: #4b5563; background-color: #f9fafb; border-right: 1px solid #d1d5db;">Requested On</td>
                <td style="padding: 12px 16px; color: #6b7280;">${formatDate(item.created_at)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Close",
      confirmButtonColor: "#2563eb",
    });
  };

  const handleViewOrderDetails = async (item: PaymentRequestRow) => {
    setOrderModalOpen(true);
    setOrderModalLoading(true);
    setActiveRequest(null);
    try {
      const response = await axiosInstance.get(`/vendor/payment-request/${item.id}/`);
      if (response.data.success) {
        setActiveRequest(response.data.data);
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to load order details",
      });
      setOrderModalOpen(false);
    } finally {
      setOrderModalLoading(false);
    }
  };

  const notApprovedCount = (req: PaymentRequestRow) =>
    req.orders_data?.filter((o) => o.approval_status === "not_approved" || o.approval_status === "rejected").length || 0;

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Payment Requests Register</h2>
          <button
            onClick={() => navigate("/paymentrequest")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            Add Request
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No payment requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Request ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Order Date Range</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Order Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Platform Charge</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Requested Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Approved / Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Requested On</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">{item.payment_request_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
                      {formatDate(item.date_from)} - {formatDate(item.date_to)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">{formatCurrency(item.total_order_amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">-{formatCurrency(item.total_platform_charge)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-700 border-r border-gray-200">{formatCurrency(item.release_payment_amount)}</td>
                    <td className="px-4 py-3 text-sm border-r border-gray-200">
                      {item.status === "approved" || item.status === "paid" ? (
                        <span className="font-semibold text-blue-700">{formatCurrency(item.approved_amount)}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusStyle(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-200">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(item)}
                          className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleViewOrderDetails(item)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium"
                        >
                          Order Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details modal */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0000007d] px-3">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 relative overflow-y-auto max-h-[90vh] border border-gray-200">
            <button
              onClick={() => setOrderModalOpen(false)}
              className="absolute top-5 right-5 text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>

            {orderModalLoading || !activeRequest ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-1 text-gray-800">{activeRequest.payment_request_id}</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Order Date Range: {formatDate(activeRequest.date_from)} - {formatDate(activeRequest.date_to)}
                  {" · "}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusStyle(activeRequest.status)}`}>
                    {activeRequest.status}
                  </span>
                </p>

                {/* Amount summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Order Amount</p>
                    <p className="font-bold text-gray-800">{formatCurrency(activeRequest.total_order_amount)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Online Platform Charge</p>
                    <p className="font-bold text-gray-700">-{formatCurrency(activeRequest.online_platform_charge)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">COD Platform Charge</p>
                    <p className="font-bold text-gray-700">-{formatCurrency(activeRequest.cod_platform_charge)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">Requested Amount</p>
                    <p className="font-bold text-blue-700">{formatCurrency(activeRequest.release_payment_amount)}</p>
                  </div>
                </div>

                {(activeRequest.status === "approved" || activeRequest.status === "paid") && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-sm text-blue-800">
                        <strong>Approved Amount:</strong> {formatCurrency(activeRequest.approved_amount)}
                      </span>
                      <span className="text-sm text-blue-700">
                        {(activeRequest.orders_data?.filter((o) => o.approval_status === "approved").length) || 0} of{" "}
                        {activeRequest.orders_data?.length || 0} orders approved
                      </span>
                    </div>
                    {activeRequest.admin_remarks && (
                      <p className="text-xs text-gray-600 mt-2 italic">Remarks: {activeRequest.admin_remarks}</p>
                    )}
                  </div>
                )}

                {activeRequest.status === "rejected" && activeRequest.admin_remarks && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 italic">Rejection reason: {activeRequest.admin_remarks}</p>
                  </div>
                )}

                {/* Order-level table */}
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Orders in this Request
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({activeRequest.orders_data?.length || 0} orders
                    {notApprovedCount(activeRequest) > 0 && `, ${notApprovedCount(activeRequest)} not approved`})
                  </span>
                </h3>

                <div className="border border-gray-300 rounded-lg overflow-hidden mb-2">
                  <div className="max-h-[320px] overflow-y-auto">
                    <table className="w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Order</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Customer</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Charge</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {activeRequest.orders_data?.map((order) => (
                          <tr key={order.order_id}>
                            <td className="px-3 py-2 font-medium text-gray-900 border-r border-gray-200">{order.order_number}</td>
                            <td className="px-3 py-2 text-gray-600 whitespace-nowrap border-r border-gray-200">{formatDate(order.created_at)}</td>
                            <td className="px-3 py-2 text-gray-600 border-r border-gray-200">{order.billing_name}</td>
                            <td className="px-3 py-2 text-gray-900 whitespace-nowrap border-r border-gray-200">{formatCurrency(order.vendor_total)}</td>
                            <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-r border-gray-200">-{formatCurrency(order.platform_charge)}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${orderStatusStyle(order.approval_status)}`}>
                                {orderStatusLabel(order.approval_status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {notApprovedCount(activeRequest) > 0 && (
                  <p className="text-xs text-gray-500 mb-4">
                    * "Not Approved" orders automatically become available again to include in your next payment request.
                  </p>
                )}

                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setOrderModalOpen(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentRequestList;