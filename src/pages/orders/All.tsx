// pages/vendor/orders/All.tsx

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import DataTable from "../../components/common/DataTable";
import { FaEye, FaFileInvoice, FaEnvelope, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";

interface Order {
  id: number;
  order_number: string;
  created_at: string;
  billing_name: string;
  billing_phone: string;
  store?: string;
  totalAmount?: string;
  payment_status: string;
  order_status: string;
  vendor_items_count: number;
  vendor_total: number;
  vendor_item_status: string;
}

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  packaging: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
  returned: number;
  failed_to_deliver: number;
}

const All = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    packaging: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
    failed_to_deliver: 0
  });

  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchOrderStats();
    fetchOrders();
  }, [activeFilter, pagination.page, searchTerm]);

  const fetchOrderStats = async () => {
    try {
      const response = await axiosInstance.get('/vendor/orders/stats/');

      console.log("📊 Stats Response:", response.data); // Debug

      if (response.data.success) {
        setOrderStats(response.data.data);

        // Debug: Print what we received
        console.log("📊 Stats received:", response.data.data);
      }
    } catch (error) {
      console.error("Error fetching order stats:", error);
    }
  };
  // pages/vendor/orders/All.tsx - fetchOrders function में सुधार

// fetchOrders function mein mapping sahi karein
const fetchOrders = async () => {
  setLoading(true);
  try {
    let statusParam = activeFilter === "all" ? "all" : activeFilter.toLowerCase();
    
    // ✅ Map frontend status names to backend status names
    const statusMapping: Record<string, string> = {
      "packaging": "processing",
      "out for delivery": "shipped",
      "out_for_delivery": "shipped",
      "returned": "refunded",
      "failed to deliver": "failed"
    };
    
    if (statusParam in statusMapping) {
      statusParam = statusMapping[statusParam];
    }
    
    const params: any = {
      status: statusParam,
      page: pagination.page,
      page_size: pagination.page_size
    };
    
    if (searchTerm) {
      params.search = searchTerm;
    }
    
    console.log("Fetching orders with params:", params);
    
    const response = await axiosInstance.get('/vendor/orders/', { params });
    
    if (response.data.success) {
      console.log("Orders received:", response.data.data.orders);
      setOrders(response.data.data.orders);
      setPagination(response.data.data.pagination);
    }
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.message || 'Failed to fetch orders'
    });
  } finally {
    setLoading(false);
  }
};

  const handleView = (order: Order) => {
    navigate(`/order/${order.id}`);
  };

  const handleDownloadInvoice = async (order: Order) => {
    try {
      const response = await axiosInstance.get(`/vendor/orders/${order.id}/invoice/`);

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: `Invoice for order #${order.order_number} downloaded successfully.`,
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error: any) {
      console.error("Error downloading invoice:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to download invoice'
      });
    }
  };

  const handleEmail = async (order: Order) => {
    try {
      const response = await axiosInstance.post(`/vendor/orders/${order.id}/send-email/`);

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Email Sent",
          text: `Invoice email sent to customer successfully.`,
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error: any) {
      console.error("Error sending email:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to send email'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "text-green-700 bg-green-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "confirmed":
        return "text-blue-700 bg-blue-50";
      case "processing":
      case "packaging":
        return "text-purple-700 bg-purple-50";
      case "shipped":
      case "out for delivery":
        return "text-indigo-700 bg-indigo-50";
      case "cancelled":
        return "text-red-700 bg-red-50";
      case "refunded":
      case "returned":
        return "text-orange-700 bg-orange-50";
      case "failed to deliver":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

// Status filter mapping update karein
const handleFilterChange = (filter: string) => {
  setActiveFilter(filter);
  setPagination({ ...pagination, page: 1 });
};

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Orders {orderStats.total}</h1>
      </div>

      {/* Current Order Summary Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Current Order Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="flex flex-col items-center p-3 bg-white border rounded-lg">
            <span className="text-gray-500 text-sm mb-1">Pending</span>
            <span className="text-2xl font-bold text-gray-800">{orderStats.pending}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white border rounded-lg">
            <span className="text-gray-500 text-sm mb-1">Confirmed</span>
            <span className="text-2xl font-bold text-gray-800">{orderStats.confirmed}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white border rounded-lg">
            <span className="text-gray-500 text-sm mb-1">Packaging</span>
            <span className="text-2xl font-bold text-gray-800">{orderStats.packaging}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white border rounded-lg">
            <span className="text-gray-500 text-sm mb-1">Out for Delivery</span>
            <span className="text-2xl font-bold text-gray-800">{orderStats.out_for_delivery}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white border rounded-lg">
            <span className="text-gray-500 text-sm mb-1">Delivered</span>
            <span className="text-2xl font-bold text-gray-800">{orderStats.delivered}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white border rounded-lg">
            <span className="text-gray-500 text-sm mb-1">Cancelled</span>
            <span className="text-2xl font-bold text-gray-800">{orderStats.cancelled}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white border rounded-lg">
            <span className="text-gray-500 text-sm mb-1">Returned</span>
            <span className="text-2xl font-bold text-gray-800">{orderStats.returned}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white border rounded-lg">
            <span className="text-gray-500 text-sm mb-1">Failed to Deliver</span>
            <span className="text-2xl font-bold text-gray-800">{orderStats.failed_to_deliver}</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-200 my-6"></div>

      {/* Order List Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-lg font-semibold text-gray-700">Order list {orderStats.total}</h2>

          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => handleFilterChange("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            All Orders ({orderStats.total})
          </button>
          <button
            onClick={() => handleFilterChange("pending")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === "pending"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Pending ({orderStats.pending})
          </button>
          <button
            onClick={() => handleFilterChange("confirmed")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === "confirmed"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Confirmed ({orderStats.confirmed})
          </button>
          <button
            onClick={() => handleFilterChange("packaging")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === "packaging"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Packaging ({orderStats.packaging})
          </button>
          <button
            onClick={() => handleFilterChange("out for delivery")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === "out for delivery"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Out for Delivery ({orderStats.out_for_delivery})
          </button>
          <button
            onClick={() => handleFilterChange("delivered")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === "delivered"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Delivered ({orderStats.delivered})
          </button>
          <button
            onClick={() => handleFilterChange("cancelled")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === "cancelled"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Cancelled ({orderStats.cancelled})
          </button>
          <button
            onClick={() => handleFilterChange("returned")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === "returned"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Returned ({orderStats.returned})
          </button>
          <button
            onClick={() => handleFilterChange("failed to deliver")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === "failed to deliver"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Failed to Deliver ({orderStats.failed_to_deliver})
          </button>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <DataTable
              title=""
              data={orders}
              columns={[
                {
                  key: "order_number",
                  label: "Order Id",
                  render: (item: Order) => (
                    <span className="font-medium text-gray-900">{item.order_number}</span>
                  )
                },
                {
                  key: "created_at",
                  label: "Order Date",
                  render: (item: Order) => formatDate(item.created_at)
                },
                {
                  key: "billing_name",
                  label: "Customer info",
                  render: (item: Order) => (
                    <div>
                      <div className="font-medium text-gray-900">{item.billing_name}</div>
                      <div className="text-sm text-gray-500">{item.billing_phone}</div>
                    </div>
                  )
                },
                {
                  key: "store",
                  label: "Store",
                  render: (item: Order) => {
                    if (item.store) {
                      return <span className="text-gray-700">{item.store}</span>;
                    }
                    return <span className="text-gray-500">My Store</span>;
                  }
                },
                {
                  key: "vendor_total",
                  label: "Total Amount",
                  render: (item: Order) => {
                    return (
                      <div className="flex flex-col">
                        <span className="text-gray-800 font-semibold">
                          {formatCurrency(item.vendor_total)}
                        </span>
                        <span className="text-sm">
                          <span
                            className={`font-medium ${item.payment_status?.toLowerCase() === "completed" ||
                                item.payment_status?.toLowerCase() === "paid"
                                ? "text-green-700"
                                : "text-red-700"
                              }`}
                          >
                            {item.payment_status || "Pending"}
                          </span>
                        </span>
                      </div>
                    );
                  },
                },
                {
                  key: "vendor_item_status",
                  label: "Order Status",
                  render: (item: Order) => (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.vendor_item_status)}`}>
                      {item.vendor_item_status || "Pending"}
                    </span>
                  ),
                },
                {
                  key: "action",
                  label: "Action",
                  render: (item: Order) => (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Order"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleDownloadInvoice(item)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Download Invoice"
                      >
                        <FaFileInvoice />
                      </button>
                      <button
                        onClick={() => handleEmail(item)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                        title="Send Email"
                      >
                        <FaEnvelope />
                      </button>
                    </div>
                  ),
                },
              ]}
            />

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.total_pages}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default All;