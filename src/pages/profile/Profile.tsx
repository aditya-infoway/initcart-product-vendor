import React, { useState, useEffect } from "react";
import { 
  FaUserTie, 
  FaEnvelope, 
  FaPhone, 
  FaStore, 
  FaMapMarkerAlt, 
  FaCity, 
  FaMapPin, 
  FaCreditCard,
  FaFileAlt,
  FaCalendarAlt,
  FaImage,
  FaBox,
  FaShoppingCart,
  FaRupeeSign,
  FaTag,
  FaIndustry,
  FaDownload
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-toastify";
import axios from "axios";

interface VendorProfile {
  id: number;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  vendor_type: string;
  vendor_subtype: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  upi_id: string;
  status: string;
  verification_label?: string;
  is_approved: boolean;
  licence_file?: string;
  gst_certificate?: string;
  store_logo?: string;
  id_proof?: string;
  created_at: string;
  updated_at: string;
  total_products?: number;
  total_orders?: number;
  total_revenue?: number;
  wallet_balance?: number;
  pending_balance?: number;
  store_logo_url?: string;
}

const Profile: React.FC = () => {
  const [vendorData, setVendorData] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const { access, logout } = useAuthStore();

  // API base URL
  const API_BASE_URL = "http://localhost:8000";

  // Fetch vendor profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        
        if (!access) {
          throw new Error("No authentication token found");
        }
        
        // Fetch vendor profile with all details
        const profileResponse = await axios.get(
          `${API_BASE_URL}/api/ecommerce/auth/me/`,
          {
            headers: {
              Authorization: `Bearer ${access}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Profile API Response:", profileResponse.data);

        let profileData;
        if (profileResponse.data.success && profileResponse.data.data) {
          // New structure with success flag and data object
          profileData = profileResponse.data.data;
        } else if (profileResponse.data.success) {
          // Structure with success flag but data directly
          profileData = profileResponse.data;
        } else {
          // Old structure without success flag
          profileData = profileResponse.data;
        }

        // Initialize with profile data
        const completeData = {
          ...profileData,
          total_products: 0,
          total_orders: 0,
          total_revenue: 0,
          wallet_balance: 0,
          pending_balance: 0,
        };

        console.log("Processed vendor data:", completeData);
        setVendorData(completeData);

        // Optional: Try to fetch wallet data
        try {
          const vendorId = profileData.id;
          // First try to get vendor's wallet through vendor-wallets endpoint
          const walletResponse = await axios.get(
            `${API_BASE_URL}/api/ecommerce/vendor-wallets/`,
            {
              headers: {
                Authorization: `Bearer ${access}`,
              },
            }
          );
          
          if (walletResponse.data && Array.isArray(walletResponse.data)) {
            // Find current vendor's wallet
            const vendorWallet = walletResponse.data.find(
              (wallet: any) => wallet.vendor === vendorId || wallet.vendor_email === profileData.email
            );
            
            if (vendorWallet) {
              setVendorData(prev => prev ? {
                ...prev,
                wallet_balance: vendorWallet.wallet_balance || 0,
                pending_balance: vendorWallet.pending_balance || 0,
              } : null);
            }
          }
        } catch (walletErr: any) {
          console.warn("Could not fetch wallet data:", walletErr);
          // Silent fail - wallet data is optional
        }

      } catch (err: any) {
        console.error("Profile fetch error details:", err.response?.data || err.message);
        const errorMessage = err.response?.data?.message || err.message || "An error occurred";
        setError(errorMessage);
        
        toast.error(errorMessage || "Failed to load profile", {
          position: "top-right",
        });
        
        // If unauthorized, redirect to login
        if (err.response?.status === 401 || 
            err.message?.includes("401") || 
            err.message?.includes("unauthorized") || 
            err.message?.includes("token")) {
          logout();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [access, logout, navigate]);

  // Get full URL for media files
  const getFullMediaUrl = (mediaPath: string | undefined) => {
    if (!mediaPath) return null;
    
    // If it's already a full URL, return as is
    if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
      return mediaPath;
    }
    
    // If it starts with /media/, add base URL
    if (mediaPath.startsWith('/media/')) {
      return `${API_BASE_URL}${mediaPath}`;
    }
    
    // If it's just a filename, assume it's in /media/
    if (!mediaPath.includes('/')) {
      return `${API_BASE_URL}/media/${mediaPath}`;
    }
    
    // Otherwise, add base URL
    return `${API_BASE_URL}${mediaPath.startsWith('/') ? '' : '/'}${mediaPath}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Get vendor status color
  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get verification status color
  const getVerificationColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': 
      case 'pending verification': 
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected': 
      case 'verification failed': 
        return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get verification display text
  const getVerificationDisplay = (status?: string) => {
    if (!status) return 'Not Set';
    
    switch (status.toLowerCase()) {
      case 'verified': return 'Verified';
      case 'pending': 
      case 'pending verification': 
        return 'Pending';
      case 'rejected': 
      case 'verification failed': 
        return 'Rejected';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Get vendor type display name
  const getVendorTypeDisplay = (type: string) => {
    if (!type) return 'Vendor';
    
    switch (type.toLowerCase()) {
      case 'product': return 'Product Vendor';
      case 'service': return 'Service Vendor';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Get vendor subtype display
  const getVendorSubtypeDisplay = (subtype?: string) => {
    if (!subtype) return 'N/A';
    
    switch (subtype.toLowerCase()) {
      case 'retailer': return 'Retailer';
      case 'wholesaler': return 'Wholesaler';
      default: return subtype.charAt(0).toUpperCase() + subtype.slice(1);
    }
  };

  // Get status display
  const getStatusDisplay = (status?: string) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get logo URL - check both store_logo and store_logo_url
  const getLogoUrl = () => {
    if (vendorData?.store_logo_url) {
      if (vendorData.store_logo_url.startsWith('http://') || vendorData.store_logo_url.startsWith('https://')) {
        return vendorData.store_logo_url;
      }
      return `${API_BASE_URL}${vendorData.store_logo_url}`;
    }
    return getFullMediaUrl(vendorData?.store_logo);
  };

  const logoUrl = getLogoUrl();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !vendorData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Unable to load profile</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-950 text-white rounded-md hover:bg-blue-700 transition"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="text-gray-500 text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No profile data found</h3>
          <p className="text-gray-600 mb-4">Please check your account details</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-50 to-white font-sans p-4">
      {/* Header */}
       <div className="w-full bg-gradient-to-r from-blue-950 to-blue-700 py-8 px-6 flex flex-col items-center text-white rounded-xl shadow-lg mb-8">
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full border-4 border-blue-200 shadow-lg overflow-hidden bg-white flex items-center justify-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={vendorData.business_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Image failed to load:", logoUrl);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <FaStore className="text-blue-600" size={48} />
            )}
          </div>
          {logoUrl && (
            <div className="absolute -bottom-2 -right-2 bg-blue-800 text-white p-2 rounded-full shadow-lg">
              <FaImage size={14} />
            </div>
          )}
        </div>
        <h2 className="text-3xl font-bold tracking-tight">{vendorData.business_name || 'Unnamed Business'}</h2>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vendorData.status)}`}>
            {getStatusDisplay(vendorData.status)}
          </span>
          {vendorData.verification_label && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVerificationColor(vendorData.verification_label)}`}>
              {getVerificationDisplay(vendorData.verification_label)}
            </span>
          )}
          <span className="text-blue-200 bg-blue-800 px-3 py-1 rounded-full text-sm">
            {getVendorTypeDisplay(vendorData.vendor_type)}
          </span>
        </div>
        <p className="text-sm text-blue-100 mt-4">
          <FaCalendarAlt className="inline mr-2" />
          Member since: {formatDate(vendorData.created_at)}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="max-w-5xl mx-auto -mt-8 px-4 grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Products Card */}
        <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
            <FaBox className="text-blue-600 text-xl" />
          </div>
          <p className="text-blue-600 font-semibold text-sm uppercase">Total Products</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{vendorData.total_products || 0}</p>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
            <FaShoppingCart className="text-green-600 text-xl" />
          </div>
          <p className="text-green-600 font-semibold text-sm uppercase">Total Orders</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{vendorData.total_orders || 0}</p>
        </div>

        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
            <FaRupeeSign className="text-purple-600 text-xl" />
          </div>
          <p className="text-purple-600 font-semibold text-sm uppercase">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">₹{vendorData.total_revenue || 0}</p>
        </div>

        {/* Wallet Balance */}
        <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
            <FaCreditCard className="text-yellow-600 text-xl" />
          </div>
          <p className="text-yellow-600 font-semibold text-sm uppercase">Wallet Balance</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">₹{vendorData.wallet_balance || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Pending: ₹{vendorData.pending_balance || 0}</p>
        </div>
      </div>

      {/* Profile Information */}
      <div className="max-w-5xl mx-auto">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
            <FaStore className="inline mr-2 text-blue-600" />
            Business Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vendor ID */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaStore className="text-blue-600" /> Vendor ID
              </label>
              <div className="w-full bg-blue-50 border border-blue-200 rounded-md p-3 text-gray-800 font-mono">
                V#{vendorData.id?.toString().padStart(5, '0') || '00000'}
              </div>
            </div>

            {/* Business Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaStore className="text-blue-600" /> Business Name
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800">
                {vendorData.business_name || "Not specified"}
              </div>
            </div>

            {/* Owner Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaUserTie className="text-blue-600" /> Owner Name
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800">
                {vendorData.owner_name || "Not specified"}
              </div>
            </div>

            {/* Vendor Type */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaIndustry className="text-blue-600" /> Vendor Type
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800">
                {getVendorTypeDisplay(vendorData.vendor_type)}
              </div>
            </div>

            {/* Vendor Subtype */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaTag className="text-blue-600" /> Business Type
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800">
                {getVendorSubtypeDisplay(vendorData.vendor_subtype)}
              </div>
            </div>

            {/* Approval Status */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaStore className="text-blue-600" /> Approval Status
              </label>
              <div className={`w-full border rounded-md p-3 font-medium ${vendorData.is_approved ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                {vendorData.is_approved ? '✓ Approved' : '⏳ Pending Approval'}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaEnvelope className="text-blue-600" /> Email
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800">
                {vendorData.email || "Not specified"}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaPhone className="text-blue-600" /> Phone
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800">
                {vendorData.phone || "Not specified"}
              </div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
            <FaMapMarkerAlt className="inline mr-2 text-blue-600" />
            Address Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Address */}
            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaMapMarkerAlt className="text-blue-600" /> Complete Address
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800">
                {vendorData.address || "Not specified"}
              </div>
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaCity className="text-blue-600" /> City
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800">
                {vendorData.city || "Not specified"}
              </div>
            </div>

            {/* State */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaMapMarkerAlt className="text-blue-600" /> State
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800">
                {vendorData.state || "Not specified"}
              </div>
            </div>

            {/* Pincode */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaMapPin className="text-blue-600" /> Pincode
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800">
                {vendorData.pincode || "Not specified"}
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
            <FaCreditCard className="inline mr-2 text-blue-600" />
            Bank Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaCreditCard className="text-blue-600" /> Bank Name
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800">
                {vendorData.bank_name || "Not specified"}
              </div>
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaCreditCard className="text-blue-600" /> Account Number
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800 font-mono">
                {vendorData.account_number ? `****${vendorData.account_number.slice(-4)}` : "Not specified"}
              </div>
            </div>

            {/* IFSC Code */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaCreditCard className="text-blue-600" /> IFSC Code
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800 font-mono">
                {vendorData.ifsc_code || "Not specified"}
              </div>
            </div>

            {/* UPI ID */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <FaCreditCard className="text-blue-600" /> UPI ID
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800">
                {vendorData.upi_id || "Not specified"}
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
            <FaFileAlt className="inline mr-2 text-blue-600" />
            Documents
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* License File */}
            <div className={`p-4 border rounded-lg ${vendorData.licence_file ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
              {vendorData.licence_file ? (
                <a 
                  href={getFullMediaUrl(vendorData.licence_file) || '#'}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-center group"
                >
                  <div className="text-blue-600 mb-2 group-hover:text-blue-700">
                    <FaFileAlt size={24} className="mx-auto" />
                  </div>
                  <p className="text-sm font-medium group-hover:text-blue-700">License File</p>
                  <p className="text-xs text-gray-500 mt-1 group-hover:text-blue-600">Click to download</p>
                  <FaDownload className="mx-auto mt-2 text-gray-400 group-hover:text-blue-500" />
                </a>
              ) : (
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <FaFileAlt size={24} className="mx-auto" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">License File</p>
                  <p className="text-xs text-gray-400 mt-1">Not uploaded</p>
                </div>
              )}
            </div>

            {/* GST Certificate */}
            <div className={`p-4 border rounded-lg ${vendorData.gst_certificate ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
              {vendorData.gst_certificate ? (
                <a 
                  href={getFullMediaUrl(vendorData.gst_certificate) || '#'}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-center group"
                >
                  <div className="text-blue-600 mb-2 group-hover:text-blue-700">
                    <FaFileAlt size={24} className="mx-auto" />
                  </div>
                  <p className="text-sm font-medium group-hover:text-blue-700">GST Certificate</p>
                  <p className="text-xs text-gray-500 mt-1 group-hover:text-blue-600">Click to download</p>
                  <FaDownload className="mx-auto mt-2 text-gray-400 group-hover:text-blue-500" />
                </a>
              ) : (
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <FaFileAlt size={24} className="mx-auto" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">GST Certificate</p>
                  <p className="text-xs text-gray-400 mt-1">Not uploaded</p>
                </div>
              )}
            </div>

            {/* ID Proof */}
            <div className={`p-4 border rounded-lg ${vendorData.id_proof ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
              {vendorData.id_proof ? (
                <a 
                  href={getFullMediaUrl(vendorData.id_proof) || '#'}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-center group"
                >
                  <div className="text-blue-600 mb-2 group-hover:text-blue-700">
                    <FaUserTie size={24} className="mx-auto" />
                  </div>
                  <p className="text-sm font-medium group-hover:text-blue-700">ID Proof</p>
                  <p className="text-xs text-gray-500 mt-1 group-hover:text-blue-600">Click to download</p>
                  <FaDownload className="mx-auto mt-2 text-gray-400 group-hover:text-blue-500" />
                </a>
              ) : (
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <FaUserTie size={24} className="mx-auto" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">ID Proof</p>
                  <p className="text-xs text-gray-400 mt-1">Not uploaded</p>
                </div>
              )}
            </div>

            {/* Store Logo Preview */}
            <div className={`p-4 border rounded-lg ${vendorData.store_logo || vendorData.store_logo_url ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
              {vendorData.store_logo || vendorData.store_logo_url ? (
                <a 
                  href={logoUrl || '#'}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-center group"
                >
                  <div className="text-blue-600 mb-2 group-hover:text-blue-700">
                    <FaImage size={24} className="mx-auto" />
                  </div>
                  <p className="text-sm font-medium group-hover:text-blue-700">Store Logo</p>
                  <p className="text-xs text-gray-500 mt-1 group-hover:text-blue-600">Click to view</p>
                </a>
              ) : (
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <FaImage size={24} className="mx-auto" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Store Logo</p>
                  <p className="text-xs text-gray-400 mt-1">Not uploaded</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
            <FaCalendarAlt className="inline mr-2 text-blue-600" />
            Account Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Created At */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Account Created</label>
              <div className="w-full bg-blue-50 border border-blue-200 rounded-md p-3 text-gray-800">
                {formatDate(vendorData.created_at)}
              </div>
            </div>

            {/* Last Updated */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Last Updated</label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800">
                {formatDate(vendorData.updated_at)}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-8 pt-6 border-t">
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition duration-200 shadow hover:shadow-lg"
            >
              Logout from Vendor Account
            </button>
            <p className="text-sm text-gray-500 mt-2">
              This will securely log you out from your vendor account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;