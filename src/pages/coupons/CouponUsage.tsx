// src/pages/vendor/CouponUsage.tsx (Updated)
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { 
  FaArrowLeft, 
  FaShoppingCart, 
  FaUsers, 
  FaRupeeSign, 
  FaPercentage,
  FaBox,
  FaCalendarAlt,
  FaTag,
  FaUserCheck,
  FaCheckCircle,
  FaTimesCircle,
  FaShippingFast,
  FaReceipt
} from 'react-icons/fa';
import { FiPackage, FiShoppingBag, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { MdOutlineDiscount, MdAttachMoney } from 'react-icons/md';

interface VendorProduct {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CouponUsage {
  usage_id: number;
  user_email: string;
  order_id: number;
  order_number: string;
  order_date: string;
  discount_amount: number;
  vendor_discount_share: number;
  used_at: string;
  vendor_products: VendorProduct[];
  total_vendor_amount: number;
  payment_status: string;
  order_status: string;
}

interface CouponDetails {
  id: number;
  code: string;
  title: string;
  apply_on: string;
  coupon_type: string;
  discount_percent: number | null;
  discount_amount: number | null;
  min_order_value: number;
  max_count: number | null;
  used_count: number;
  remaining_uses: number | null;
  status: string;
  start_date: string;
  expire_date: string;
  is_valid: boolean;
}

interface Statistics {
  total_usage_count: number;
  total_discount_given: number;
  total_vendor_sales: number;
  average_discount_per_order: number;
  average_order_value: number;
}

const VendorCouponUsage = () => {
  const { couponId } = useParams<{ couponId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState<CouponDetails | null>(null);
  const [usages, setUsages] = useState<CouponUsage[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [error, setError] = useState('');
  const [productsCount, setProductsCount] = useState(0);
  
  const [activeTab, setActiveTab] = useState<'usage' | 'stats'>('usage');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    if (couponId) {
      loadCouponUsageData();
    }
  }, [couponId]);

  const loadCouponUsageData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axiosInstance.get(`vendor/coupons/${couponId}/usage-details/`);
      
      if (response.data.success) {
        setCoupon(response.data.coupon);
        setUsages(response.data.usage_data || []);
        setStatistics(response.data.statistics);
        setProductsCount(response.data.count.products || 0);
      } else {
        setError(response.data.error || 'Failed to load coupon usage data');
      }
    } catch (error: any) {
      console.error('Error loading coupon usage:', error);
      setError(error.response?.data?.error || 'Failed to load coupon usage data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getDiscountDisplay = () => {
    if (!coupon) return '';
    
    if (coupon.coupon_type === 'percentage' && coupon.discount_percent) {
      return `${coupon.discount_percent}% OFF`;
    } else if (coupon.coupon_type === 'flat' && coupon.discount_amount) {
      return `${formatCurrency(coupon.discount_amount)} OFF`;
    }
    return '';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      'completed': { color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
      'confirmed': { color: 'bg-blue-100 text-blue-800', icon: FaCheckCircle },
      'processing': { color: 'bg-yellow-100 text-yellow-800', icon: FaShippingFast },
      'shipped': { color: 'bg-purple-100 text-purple-800', icon: FaShippingFast },
      'delivered': { color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
      'pending': { color: 'bg-gray-100 text-gray-800', icon: FaTimesCircle },
      'cancelled': { color: 'bg-red-100 text-red-800', icon: FaTimesCircle },
      'failed': { color: 'bg-red-100 text-red-800', icon: FaTimesCircle }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: FaTimesCircle };
    const Icon = config.icon;
    
    return (
      <span className={`px-3 py-1 inline-flex items-center text-sm font-semibold rounded-full ${config.color}`}>
        <Icon className="mr-1" size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filterUsages = () => {
    const now = new Date();
    
    return usages.filter(usage => {
      const usageDate = new Date(usage.order_date);
      
      switch (dateFilter) {
        case 'today':
          return usageDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return usageDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return usageDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading coupon usage analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/coupons')}
            className="mb-6 flex items-center px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <FaArrowLeft className="mr-2" />
            Back to Coupons
          </button>
          
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaTimesCircle className="h-12 w-12 text-red-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-red-800">Error Loading Data</h3>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={loadCouponUsageData}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/coupons')}
            className="mb-6 flex items-center px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <FaArrowLeft className="mr-2" />
            Back to Coupons
          </button>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaBox className="h-12 w-12 text-yellow-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-yellow-800">Coupon Not Found</h3>
                <p className="text-yellow-700">The requested coupon could not be found.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsages = filterUsages();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <button
            onClick={() => navigate('/coupons')}
            className="self-start flex items-center px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <FaArrowLeft className="mr-2" />
            Back to Coupons
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Filter by date:</span>
            <div className="flex flex-wrap gap-2">
              {['all', 'today', 'week', 'month'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter as any)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    dateFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Coupon Header Card */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 rounded-2xl shadow-xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <FaTag className="text-2xl" />
                <h1 className="text-2xl md:text-3xl font-bold">{coupon.title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full font-mono font-bold">
                  {coupon.code}
                </span>
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  coupon.status === 'active' 
                    ? 'bg-green-500/20' 
                    : 'bg-red-500/20'
                }`}>
                  {coupon.status.toUpperCase()}
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                  Valid till: {new Date(coupon.expire_date).toLocaleDateString()}
                </span>
              </div>
              <div className="text-lg">
                <span className="font-bold">{getDiscountDisplay()}</span>
                <span className="mx-3">•</span>
                <span>Min. order: {formatCurrency(coupon.min_order_value)}</span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 min-w-[200px]">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">{coupon.used_count}</div>
                <div className="text-sm opacity-90">Total Uses</div>
                {coupon.max_count && (
                  <div className="mt-3 text-sm">
                    {coupon.remaining_uses} uses remaining
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Discount Given</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(statistics.total_discount_given)}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <MdOutlineDiscount className="text-2xl text-blue-800" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {statistics.total_usage_count > 0 ? (
                  <>Avg {formatCurrency(statistics.average_discount_per_order)} per order</>
                ) : (
                  'No discounts yet'
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Your Sales</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(statistics.total_vendor_sales)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <MdAttachMoney className="text-2xl text-blue-800" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {statistics.total_usage_count > 0 ? (
                  <>Avg {formatCurrency(statistics.average_order_value)} per order</>
                ) : (
                  'No sales yet'
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-5
                  
                  00">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {statistics.total_usage_count}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <FaShoppingCart className="text-2xl text-blue-800" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {filteredUsages.length} orders in current filter
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Applicable Products</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {productsCount}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <FiPackage className="text-2xl text-blue-800" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Products eligible for this coupon
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('usage')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'usage'
                    ? 'border-blue-500 text-blue-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaReceipt className="mr-2" />
                Usage History ({filteredUsages.length})
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'stats'
                    ? 'border-blue-800 text-blue-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiTrendingUp className="mr-2" />
                Analytics
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'usage' ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Coupon Usage History</h2>
              <p className="text-sm text-gray-600">
                Orders where customers used this coupon on your products
                {dateFilter !== 'all' && ` (Filtered: ${dateFilter})`}
              </p>
            </div>

            {filteredUsages.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 text-5xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {usages.length === 0 ? 'No Usage History' : 'No Orders in Selected Period'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {usages.length === 0 
                    ? 'This coupon hasn\'t been used by any customer yet.'
                    : 'Try changing the date filter to see more orders.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredUsages.map((usage) => (
                  <div key={usage.usage_id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <FaUserCheck className="text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">
                            {usage.user_email}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <FaCalendarAlt className="mr-2" />
                          <span>{formatDate(usage.order_date)}</span>
                          <span className="mx-2">•</span>
                          <span>Order #{usage.order_number}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(usage.payment_status)}
                          {getStatusBadge(usage.order_status)}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(usage.total_vendor_amount)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Your products total
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="font-semibold text-blue-600">
                            Discount: {formatCurrency(usage.vendor_discount_share)}
                          </span>
                          <span className="mx-2 text-gray-400">|</span>
                          <span className="text-gray-500">
                            Total discount: {formatCurrency(usage.discount_amount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Products purchased */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <FaBox className="mr-2" />
                        Your Products in this Order:
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {usage.vendor_products.map((product, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                    {product.product_name}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Qty: {product.quantity} × {formatCurrency(product.unit_price)}
                                  </p>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(product.total_price)}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                                <span className="text-gray-500">Product ID: {product.product_id}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {usage.vendor_products.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                              Total from your products
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(usage.total_vendor_amount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Performance Analytics</h2>
            
            {statistics && statistics.total_usage_count > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Discount Efficiency */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <h3 className="font-medium text-gray-900 mb-4">Discount Efficiency</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Discount vs Sales Ratio</span>
                    <span className="text-sm font-semibold">
                      {((statistics.total_discount_given / statistics.total_vendor_sales) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ 
                        width: `${Math.min(100, (statistics.total_discount_given / statistics.total_vendor_sales) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    For every ₹100 in sales, you gave ₹{(statistics.total_discount_given / statistics.total_vendor_sales * 100).toFixed(2)} in discounts
                  </p>
                </div>

                {/* Customer Insights */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <h3 className="font-medium text-gray-900 mb-4">Customer Insights</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Unique Customers</span>
                        <span className="font-semibold">
                          {new Set(usages.map(u => u.user_email)).size}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Repeat Rate</span>
                        <span className="font-semibold">
                          {((usages.length - new Set(usages.map(u => u.user_email)).size) / usages.length * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Order Frequency</span>
                        <span className="font-semibold">
                          {(usages.length / new Set(usages.map(u => u.user_email)).size).toFixed(1)} orders/customer
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 border border-gray-200 rounded-lg p-5">
                  <h3 className="font-medium text-gray-900 mb-4">Recent Activity</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {usages.slice(0, 5).map((usage) => (
                          <tr key={usage.usage_id}>
                            <td className="px-4 py-3 text-sm">{formatDate(usage.order_date)}</td>
                            <td className="px-4 py-3 text-sm">{usage.user_email}</td>
                            <td className="px-4 py-3 text-sm font-medium">{formatCurrency(usage.total_vendor_amount)}</td>
                            <td className="px-4 py-3 text-sm text-green-600">{formatCurrency(usage.vendor_discount_share)}</td>
                            <td className="px-4 py-3 text-sm">{getStatusBadge(usage.payment_status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-5xl mb-4">📈</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
                <p className="text-gray-600">
                  Analytics will appear after customers start using this coupon.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorCouponUsage;