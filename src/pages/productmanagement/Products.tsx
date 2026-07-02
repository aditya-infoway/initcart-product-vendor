import { useState, useEffect, useCallback } from "react";
import DataTable from "../../components/common/DataTable";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axiosInstance from "../../utils/axiosInstance";

//  API Response Types
interface VendorDetails {
  id: number;
  business_name: string;
  vendor_type: string;
  email: string;
  phone: string;
  owner_name: string;
}

interface BrandDetails {
  id: number;
  brand_name: string;
}

interface CategoryDetails {
  id: number;
  name: string;
  platform_charge: number;  // ✅ Platform charge add kiya
}

interface SubCategoryDetails {
  id: number;
  name: string;
}

interface SubSubCategoryDetails {
  id: number;
  name: string;
}

interface ProductStock {
  id: number;
  mrp: string;
  selling_price: string;
  production_cost: string;
  discount_type: string;
  discount_value: string;
  tax: string;
  stock_quantity: number;
  color: string | null;
  size: string | null;
  barcode: string | null;
  unit: string | null;
  weight: string | null;
  maximum_order_quantity: number;
  final_price: number;
  platform_charge_percent: number;  // ✅ Add kiya
  vendor_receivable: number; 
  variant_image: string | null;       // ✅ Add kiya
}

interface ProductGallery {
  id: number;
  image: string;
}

export interface Product {
  id: number;
  vendor: number;
  vendor_details: VendorDetails;
  brand: number | null;
  brand_details: BrandDetails | null;
  product_name: string;
  sku: string;
  category: number | null;
  category_details: CategoryDetails | null;
  subcategory: number | null;
  subcategory_details: SubCategoryDetails | null;
  subsubcategory: number | null;
  subsubcategory_details: SubSubCategoryDetails | null;
  product_type: "simple" | "variant";
  keywords: string;
  short_description: string;
  full_description: string;
  product_video_url: string;
  main_image: string | null;
  thumbnail_image: string | null;
  product_condition: string;
  manufacturing_date: string | null;
  expiry_date: string | null;
  return_policy: string;
  estimated_delivery_time: string;
  free_shipping: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  gallery: ProductGallery[];
  stocks: ProductStock[];
}

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // ✅ Fetch Products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(" Fetching vendor products...");

      const response = await axiosInstance.get("vendor/products/");
      console.log("Vendor Products API Response:", response.data);

      if (response.data && Array.isArray(response.data)) {
        console.log(` Loaded ${response.data.length} products`);
        setProducts(response.data);
        setFilteredProducts(response.data);
      } else {
        console.error(" Invalid API response format:", response.data);
        setProducts([]);
        setFilteredProducts([]);
        setError("Invalid response format from server");
      }
    } catch (error: any) {
      console.error("❌ Error fetching products:", error);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);

      let errorMessage = "Failed to fetch products";

      if (error.response?.status === 401) {
        errorMessage = "Your session has expired. Please login again.";
        Swal.fire({
          title: "Session Expired",
          text: errorMessage,
          icon: "warning",
          confirmButtonText: "Login Now"
        }).then(() => {
          window.location.href = '/login';
        });
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to view products";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      setError(errorMessage);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calculate final selling price with tax
  const calculateFinalPrice = useCallback((basePrice: any, taxRate: any) => {
    try {
      const price = parseFloat(basePrice) || 0;
      const tax = parseFloat(taxRate) || 0;

      if (!price || price <= 0) return 0;
      const taxAmount = (price * tax) / 100;
      return parseFloat((price + taxAmount).toFixed(2));
    } catch (error) {
      return 0;
    }
  }, []);

  // ✅ Apply Status Filter Only - NO SEARCH
  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => product.status === statusFilter);
      setFilteredProducts(filtered);
    }
  }, [statusFilter, products]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdd = () => navigate("/addproduct");

  // Smart Edit with different messages for each status
  const handleEdit = (product: Product) => {
    if (product.status === "approved") {
      Swal.fire({
        title: "Edit Approved Product?",
        text: "This product is currently LIVE on the website. Editing will change its status to 'Pending' and require re-approval from admin. The product will be temporarily hidden until approved again.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, Edit Anyway",
        cancelButtonText: "Cancel"
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/editproduct", { state: product });
        }
      });
    } else if (product.status === "pending") {
      Swal.fire({
        title: "Edit Pending Product",
        text: "This product is currently under review. You can make changes, but it will need to be reviewed again by admin.",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Continue Editing",
        cancelButtonText: "Cancel"
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/editproduct", { state: product });
        }
      });
    } else if (product.status === "rejected") {
      Swal.fire({
        title: "Edit Rejected Product",
        text: "This product was rejected. You can fix the issues and resubmit for approval.",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Fix & Resubmit",
        cancelButtonText: "Cancel"
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/editproduct", { state: product });
        }
      });
    } else {
      navigate("/editproduct", { state: product });
    }
  };

  // Smart Delete with different messages
  const handleDelete = (product: Product) => {
    let title = "Delete Product?";
    let text = `Are you sure you want to delete "${product.product_name}"? This action cannot be undone.`;
    let icon: "warning" | "info" = "warning";

    if (product.status === "approved") {
      title = "Delete LIVE Product?";
      text = `This product is currently LIVE on the website. Deleting it will immediately remove it from the store. Are you sure you want to delete "${product.product_name}"?`;
      icon = "warning";
    } else if (product.status === "pending") {
      title = "Delete Pending Product?";
      text = `This product is under admin review. Deleting it will cancel the review process. Are you sure you want to delete "${product.product_name}"?`;
      icon = "info";
    } else if (product.status === "rejected") {
      title = "Delete Rejected Product?";
      text = `This product was rejected. You can also choose to edit and resubmit instead. Are you sure you want to delete "${product.product_name}"?`;
      icon = "info";
    }

    Swal.fire({
      title: title,
      text: text,
      icon: icon,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosInstance.delete(`vendor/products/${product.id}/`);
          setProducts(prev => prev.filter(p => p.id !== product.id));
          setFilteredProducts(prev => prev.filter(p => p.id !== product.id));

          Swal.fire(
            "Deleted!",
            `"${product.product_name}" has been deleted.`,
            "success"
          );
        } catch (error: any) {
          console.error("Delete error:", error);

          let errorMessage = "Failed to delete product";
          if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          }

          Swal.fire("Error", errorMessage, "error");
        }
      }
    });
  };

  const handleView = (product: Product) => {
    const stock = product.stocks && product.stocks.length > 0 ? product.stocks[0] : null;
    const finalSellingPrice = stock ? calculateFinalPrice(stock.selling_price, stock.tax) : 0;

    Swal.fire({
      title: `<strong>${product.product_name}</strong>`,
      html: `
        <div class="text-left text-sm space-y-3 max-h-[70vh] overflow-y-auto">
          <!-- Product Basic Info -->
          <div class="bg-green-50 p-3 rounded-lg">
            <h4 class="font-bold text-gray-800 mb-2">📋 Product Details</h4>
            <p><strong>SKU:</strong> ${product.sku}</p>
            <p><strong>Type:</strong> ${product.product_type}</p>
            <p><strong>Condition:</strong> ${product.product_condition || 'N/A'}</p>
            <p><strong>Brand:</strong> ${product.brand_details?.brand_name || "N/A"}</p>
            <p><strong>Category:</strong> ${product.category_details?.name || "N/A"}</p>
            <p><strong>Subcategory:</strong> ${product.subcategory_details?.name || "N/A"}</p>
          </div>

          <!-- Pricing & Stock -->
          <div class="bg-yellow-50 p-3 rounded-lg">
            <h4 class="font-bold text-gray-800 mb-2"> Pricing & Stock</h4>
            ${stock ? `
              <p><strong>MRP:</strong> <span class="font-bold">₹${stock.mrp}</span></p>
              <p><strong>Selling Price:</strong> <span class="font-bold text-green-600">₹${stock.selling_price}</span></p>
              <p><strong>Final Price (with ${stock.tax}% tax):</strong> <span class="font-bold text-green-600 text-lg">₹${finalSellingPrice}</span></p>
              <p><strong>Stock Quantity:</strong> <span class="font-bold">${stock.stock_quantity}</span></p>
              <p><strong>Tax:</strong> <span class="font-bold">${stock.tax}%</span></p>
            ` : '<p class="text-gray-500">No stock information available</p>'}
          </div>

          <!-- Descriptions -->
          <div class="bg-blue-50 p-3 rounded-lg">
            <h4 class="font-bold text-gray-800 mb-2">Description</h4>
            <p><strong>Short Description:</strong> ${product.short_description || "N/A"}</p>
          </div>

          <!-- Status -->
          <div class="bg-indigo-50 p-3 rounded-lg">
            <h4 class="font-bold text-gray-800 mb-2"> Status</h4>
            <p><strong>Current Status:</strong> 
              <span class="font-bold ${product.status === 'approved' ? 'text-green-600' :
          product.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
        }">
                ${product.status.toUpperCase()}
              </span>
            </p>
            <p><strong>Submitted:</strong> ${new Date(product.created_at).toLocaleString()}</p>
          </div>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Close",
      width: "600px",
      customClass: {
        popup: "text-sm",
        htmlContainer: "text-left"
      }
    });
  };

  // ✅ Table Columns with Final Price and Vendor Receivable
  const columns = [
    {
      key: "product_name",
      label: "Product",
      render: (product: Product) => (
        <div>
          <div className="font-semibold">{product.product_name}</div>
          <div className="text-sm text-gray-500">SKU: {product.sku}</div>
          {(() => {
            const stock = product.stocks && product.stocks.length > 0 ? product.stocks[0] : null;
            const variantImage = stock?.variant_image;

            const imageUrl = variantImage || product.main_image;

            if (!imageUrl) return null;

            const BASE_URL = "http://localhost:8000";

            const finalUrl = imageUrl.startsWith("http")
              ? imageUrl
              : `${BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;

            return (
              <div className="mt-1">
                <img
                  src={finalUrl}
                  alt={product.product_name}
                  className="h-10 w-10 object-cover rounded border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            );
          })()}
        </div>
      )
    },
    {
      key: "brand",
      label: "Brand",
      render: (product: Product) => (
        <span>{product.brand_details?.brand_name || "N/A"}</span>
      )
    },
    {
      key: "category",
      label: "Category",
      render: (product: Product) => (
        <div>
          <div>{product.category_details?.name || "N/A"}</div>
          {product.subcategory_details && (
            <div className="text-xs text-gray-500">{product.subcategory_details.name}</div>
          )}
        </div>
      )
    },
    {
      key: "pricing",
      label: "Pricing",
      render: (product: Product) => {
        const stock = product.stocks && product.stocks.length > 0 ? product.stocks[0] : null;

        return stock ? (
          <div className="text-sm">
            <div className="text-gray-500 line-through text-xs">MRP: ₹{stock.mrp}</div>
            <div className="text-green-600 font-semibold">SP: ₹{stock.selling_price}</div>
            <div className="text-green-800 font-bold">Final: ₹{stock.final_price}</div>
            <div className="text-xs text-gray-500">Tax: {stock.tax}%</div>
          </div>
        ) : "N/A";
      }
    },
    // ✅ NEW COLUMN: Vendor Receivable Price
    {
      key: "vendor_receivable",
      label: "You Receive",
      render: (product: Product) => {
        const stock = product.stocks && product.stocks.length > 0 ? product.stocks[0] : null;

        if (!stock) return "N/A";

        // Agar platform_charge_percent available hai to use karo
        if (stock.platform_charge_percent && stock.platform_charge_percent > 0) {
          return (
            <div className="text-sm">
              <div className="font-bold text-blue-700">₹{stock.vendor_receivable}</div>
              <div className="text-xs text-blue-500">After {stock.platform_charge_percent}% charge</div>
            </div>
          );
        } else {
          // Agar platform charge nahi hai to final price hi vendor receivable hai
          return (
            <div className="text-sm">
              <div className="font-bold text-green-700">₹{stock.final_price}</div>
              <div className="text-xs text-gray-500">No platform charge</div>
            </div>
          );
        }
      }
    },
    {
      key: "stock",
      label: "Stock",
      render: (product: Product) => {
        const stock = product.stocks && product.stocks.length > 0 ? product.stocks[0] : null;
        return stock ? (
          <div className={`font-semibold ${stock.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stock.stock_quantity} units
          </div>
        ) : "N/A";
      }
    },
    {
      key: "status",
      label: "Status",
      render: (product: Product) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${product.status === "approved"
              ? "bg-green-100 text-green-800"
              : product.status === "rejected"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
        >
          {product.status.toUpperCase()}
        </span>
      )
    },
    {
      key: "created_at",
      label: "Created",
      render: (product: Product) => new Date(product.created_at).toLocaleDateString()
    }
  ];

  // ✅ Refresh products
  const handleRefresh = () => {
    fetchProducts();
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 p-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading your products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 p-4 min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Products</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 p-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Products</h1>
          <p className="text-gray-600">
            Manage your products and submissions
          </p>
        </div>

        {/* Simple Status Filter Only - NO SEARCH */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-64 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Products ({products.length})</option>
                <option value="pending">Pending ({products.filter(p => p.status === 'pending').length})</option>
                <option value="approved">Approved ({products.filter(p => p.status === 'approved').length})</option>
                <option value="rejected">Rejected ({products.filter(p => p.status === 'rejected').length})</option>
              </select>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                Total: {products.length}
              </span>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                Pending: {products.filter(p => p.status === 'pending').length}
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                Approved: {products.filter(p => p.status === 'approved').length}
              </span>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                Rejected: {products.filter(p => p.status === 'rejected').length}
              </span>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">
              {products.length === 0
                ? "You haven't submitted any products yet"
                : `No ${statusFilter} products found`
              }
            </p>
            {products.length === 0 && (
              <button
                onClick={handleAdd}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Your First Product
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="mt-4 ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Refresh
            </button>
          </div>
        ) : (
          <DataTable
            title={`My Products (${filteredProducts.length} of ${products.length} total)`}
            data={filteredProducts}
            columns={columns}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            addButtonLabel="Add New Product"
            showActions={true}
            additionalButtons={
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
              >
                Refresh
              </button>
            }
          />
        )}
      </div>
    </div>
  );
};

export default Products;