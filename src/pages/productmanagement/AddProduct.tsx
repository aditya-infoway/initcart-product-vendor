import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import axiosInstance from '../../utils/axiosInstance';
import * as Yup from "yup";
import { IoMdAddCircle } from "react-icons/io";
import ToggleSwitch from "../../components/common/ToggleSwitch";
import { FaCloudUploadAlt } from "react-icons/fa";

// -------------------- TYPES --------------------
interface Stock {
  mrp: number;
  selling_price: number;
  production_cost: number;
  discount_type: string;
  discount_value: number;
  tax: number;
  stock_quantity: number;
  barcode: string;
  unit: string;
  weight: string;
  color: string;
  size: string;
  maximum_order_quantity: number;
  final_price: number; // ✅ FINAL PRICE ADDED
}

interface Category {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  name: string;
  category: number;
}

interface SubSubCategory {
  id: number;
  name: string;
  subcategory: number;
}

interface Brand {
  id: number;
  brand_name: string;
}

interface ProductForm {
  product_name: string;
  sku: string;
  category: string;
  subcategory: string;
  subsubcategory: string;
  brand: string;
  product_type: string;
  keywords: string;
  short_description: string;
  full_description: string;
  product_video_url: string;
  stocks: Stock[];  // ✅ stocks (not multiStock)
  main_image: File | null;
  gallery_images: File[];
  thumbnail_image: File | null;
  product_condition: string;
  manufacturing_date: string;
  expiry_date: string;
  return_policy: string;
  estimated_delivery_time: string;
  free_shipping: boolean;
}

interface AddProductProps {
  isEdit?: boolean;
  editData?: any; // Changed to any to accept product data from Products.tsx
  onSubmit?: (values: ProductForm) => void;
}

// -------------------- COMPONENT --------------------
const AddProduct: React.FC<AddProductProps> = ({
  isEdit = false,
  editData,
  onSubmit,
}) => {
  // State for dynamic data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<SubSubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [productStatus, setProductStatus] = useState<string>("");

  // File name states
  const [mainName, setMainName] = useState<string>("");
  const [thumbnailName, setThumbnailName] = useState<string>("");
  const [additionalCount, setAdditionalCount] = useState<number>(0);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);

  // Generate SKU
  const generateSKU = () => {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PROD-${rand}`;
  };

  // Calculate final selling price with tax - NEW ADDED
  const calculateFinalSellingPrice = (basePrice: number, taxRate: number) => {
    if (!basePrice || basePrice <= 0) return 0;
    const taxAmount = (basePrice * taxRate) / 100;
    return parseFloat((basePrice + taxAmount).toFixed(2));
  };

  // Fetch functions
  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('public/categories/');
      setCategories(response.data);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubCategories = async (categoryId: string) => {
    if (!categoryId) {
      setSubCategories([]);
      setSubSubCategories([]);
      return;
    }
    try {
      const response = await axiosInstance.get(`public/subcategories/?category=${categoryId}`);
      setSubCategories(response.data);
      setSubSubCategories([]);
    } catch (error: any) {
      console.error("Error fetching subcategories:", error);
      setSubCategories([]);
    }
  };

  const fetchSubSubCategories = async (subCategoryId: string) => {
    if (!subCategoryId) {
      setSubSubCategories([]);
      return;
    }
    try {
      const response = await axiosInstance.get(`public/subsubcategories/?subcategory=${subCategoryId}`);
      setSubSubCategories(response.data);
    } catch (error: any) {
      console.error("Error fetching sub-subcategories:", error);
      setSubSubCategories([]);
    }
  };

  const fetchBrands = async () => {
    setBrandsLoading(true);
    try {
      console.log("Starting brands fetch...");
      const response = await axiosInstance.get('brands/');
      console.log("Brands fetch successful:", response.data);
      setBrands(response.data);
    } catch (error: any) {
      console.error("Brands fetch failed:", error);
    } finally {
      setBrandsLoading(false);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending Review" },
      approved: { color: "bg-green-100 text-green-800", text: "Approved & Live" },
      rejected: { color: "bg-red-100 text-red-800", text: "Rejected" },
      draft: { color: "bg-gray-100 text-gray-800", text: "Draft" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Handle tax change - NEW ADDED FUNCTION
  const handleTaxChange = (index: number, taxValue: number) => {
    const currentStocks = [...formik.values.stocks];
    const currentStock = currentStocks[index];
    
    // Update tax value
    currentStock.tax = taxValue;
    
    formik.setFieldValue("stocks", currentStocks);
  };

  // Handle basic selling price change - NEW ADDED FUNCTION
  const handleBasicSellingPriceChange = (index: number, basicSellingPrice: number) => {
    const currentStocks = [...formik.values.stocks];
    const currentStock = currentStocks[index];
    
    // Update basic selling price (tax excluded)
    currentStock.selling_price = basicSellingPrice;
    
    formik.setFieldValue("stocks", currentStocks);
  };

  // Format edit data for form - NEW ADDED FUNCTION
  const formatEditData = (productData: any) => {
    if (!productData) return null;

    console.log("📦 Formatting edit data:", productData);

    // Format stocks data
    const formattedStocks = productData.stocks && productData.stocks.length > 0 
      ? productData.stocks.map((stock: any) => ({
          mrp: parseFloat(stock.mrp) || 0,
          selling_price: parseFloat(stock.selling_price) || 0,
          production_cost: parseFloat(stock.production_cost) || 0,
          discount_type: stock.discount_type || "flat",
          discount_value: parseFloat(stock.discount_value) || 0,
          tax: parseFloat(stock.tax) || 0,
          stock_quantity: stock.stock_quantity || 0,
          barcode: stock.barcode || "",
          unit: stock.unit || "",
          weight: stock.weight || "",
          color: stock.color || "",
          size: stock.size || "",
          maximum_order_quantity: stock.maximum_order_quantity || 1,
          final_price: parseFloat(stock.final_price) || 0, // ✅ FINAL PRICE ADDED
        }))
      : [
          {
            mrp: 0,
            selling_price: 0,
            production_cost: 0,
            discount_type: "flat",
            discount_value: 0,
            tax: 0,
            stock_quantity: 0,
            barcode: "",
            unit: "",
            weight: "",
            color: "",
            size: "",
            maximum_order_quantity: 1,
            final_price: 0, // ✅ FINAL PRICE ADDED
          },
        ];

    return {
      product_name: productData.product_name || "",
      sku: productData.sku || generateSKU(),
      category: productData.category?.toString() || "",
      subcategory: productData.subcategory?.toString() || "",
      subsubcategory: productData.subsubcategory?.toString() || "",
      brand: productData.brand?.toString() || "",
      product_type: productData.product_type || "simple",
      keywords: productData.keywords || "",
      short_description: productData.short_description || "",
      full_description: productData.full_description || "",
      product_video_url: productData.product_video_url || "",
      stocks: formattedStocks,
      main_image: null,
      gallery_images: [],
      thumbnail_image: null,
      product_condition: productData.product_condition || "New",
      manufacturing_date: productData.manufacturing_date || "",
      expiry_date: productData.expiry_date || "",
      return_policy: productData.return_policy || "",
      estimated_delivery_time: productData.estimated_delivery_time || "",
      free_shipping: productData.free_shipping || false,
    };
  };

  // Formik configuration - DECLARE FIRST
  const formik = useFormik<ProductForm>({
    initialValues: {
      product_name: "",
      sku: generateSKU(),
      category: "",
      subcategory: "",
      subsubcategory: "",
      brand: "",
      product_type: "simple",
      keywords: "",
      short_description: "",
      full_description: "",
      product_video_url: "",
      stocks: [
        {
          mrp: 0,
          selling_price: 0,
          production_cost: 0,
          discount_type: "flat",
          discount_value: 0,
          tax: 0,
          stock_quantity: 0,
          barcode: "",
          unit: "",
          weight: "",
          color: "",
          size: "",
          maximum_order_quantity: 1,
          final_price: 0, // ✅ FINAL PRICE ADDED
        },
      ],
      main_image: null,
      gallery_images: [],
      thumbnail_image: null,
      product_condition: "New",
      manufacturing_date: "",
      expiry_date: "",
      return_policy: "",
      estimated_delivery_time: "",
      free_shipping: false,
    },

    validationSchema: Yup.object({
      product_name: Yup.string().required("Product Name is required"),
      category: Yup.string().required("Category is required"),
      sku: Yup.string().required("SKU is required"),
      product_type: Yup.string().required("Product Type is required"),
    }),
    onSubmit: async (values) => {
      console.log("🔄 === PRODUCT SUBMIT START ===");
      console.log("Form Values:", values);

      const token = localStorage.getItem("vendorAccessToken");
      console.log("Token exists:", !!token);
      setLoading(true);

      try {
        const formData = new FormData();

        // Append basic fields
        formData.append("product_name", values.product_name);
        formData.append("sku", values.sku);

        // ✅ FIXED: सिर्फ ID भेजें
        if (values.category) formData.append("category", values.category);
        if (values.subcategory) formData.append("subcategory", values.subcategory);
        if (values.subsubcategory) formData.append("subsubcategory", values.subsubcategory);
        if (values.brand) formData.append("brand", values.brand.toString());

        formData.append("product_type", values.product_type);
        formData.append("keywords", values.keywords);
        formData.append("short_description", values.short_description);
        formData.append("full_description", values.full_description);
        formData.append("product_video_url", values.product_video_url);
        formData.append("product_condition", values.product_condition);
        formData.append("manufacturing_date", values.manufacturing_date);
        formData.append("expiry_date", values.expiry_date);
        formData.append("return_policy", values.return_policy);
        formData.append("estimated_delivery_time", values.estimated_delivery_time);
        formData.append("free_shipping", values.free_shipping.toString());

        // ✅ For edit mode, automatically set status to pending
        if (isEdit) {
          formData.append("status", "pending");
          console.log("🔄 Edit mode: Setting status to 'pending' for re-approval");
        }

        // ✅ FIXED: Stocks को individual fields में भेजें (JSON नहीं)
        values.stocks.forEach((stock, index) => {
          formData.append(`stocks[${index}][mrp]`, stock.mrp.toString());
          formData.append(`stocks[${index}][selling_price]`, stock.selling_price.toString()); // Basic selling price (tax excluded)
          formData.append(`stocks[${index}][production_cost]`, stock.production_cost.toString());
          formData.append(`stocks[${index}][discount_type]`, stock.discount_type);
          formData.append(`stocks[${index}][discount_value]`, stock.discount_value.toString());
          formData.append(`stocks[${index}][tax]`, stock.tax.toString());
          formData.append(`stocks[${index}][stock_quantity]`, stock.stock_quantity.toString());
          formData.append(`stocks[${index}][barcode]`, stock.barcode);
          formData.append(`stocks[${index}][unit]`, stock.unit);
          formData.append(`stocks[${index}][weight]`, stock.weight);
          formData.append(`stocks[${index}][color]`, stock.color);
          formData.append(`stocks[${index}][size]`, stock.size);
          formData.append(`stocks[${index}][maximum_order_quantity]`, stock.maximum_order_quantity.toString());
          formData.append(`stocks[${index}][final_price]`, stock.final_price.toString()); // ✅ FINAL PRICE ADDED
        });

        // Images
        if (values.main_image) formData.append("main_image", values.main_image);
        if (values.thumbnail_image) formData.append("thumbnail_image", values.thumbnail_image);

        values.gallery_images.forEach((file) => {
          formData.append("gallery_images", file);
        });

        console.log("FormData contents:");
        console.log("Brand value:", values.brand, "Type:", typeof values.brand);

        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`  ${key}: File - ${value.name}`);
          } else {
            console.log(`  ${key}: ${value}`);
          }
        }

        // API URLs
        const url = isEdit && editData?.id
          ? `vendor/products/${editData.id}/`
          : "vendor/create/";

        console.log("API URL:", url);
        console.log("Method:", isEdit ? "PUT" : "POST");

        const response = await axiosInstance({
          method: isEdit ? 'PUT' : 'POST',
          url: url,
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log("✅ API Response:", response.data);

        // ✅ FIXED: BETTER SUCCESS MESSAGES
        if (isEdit) {
          alert(`🎉 Product Updated Successfully!\n\n"${response.data.product_name}" has been updated and sent for re-approval.\nStatus: Pending Review\n\nOur admin team will review the changes. The product will be temporarily hidden until approved again.`);
        } else {
          alert(`🎉 Product Submitted Successfully!\n\n"${response.data.product_name}" has been submitted for verification.\n\n📋 What happens next:\n• Our admin team will review your product\n• You'll be notified once it's approved\n• Approval usually takes 24-48 hours\n• Product will go live after approval\n\nThank you for your patience!`);
        }

        if (onSubmit) {
          onSubmit(values);
        }

        if (!isEdit) {
          formik.resetForm();
          setMainName("");
          setThumbnailName("");
          setAdditionalCount(0);
          setAdditionalPreviews([]);
        }

      } catch (error: any) {
        console.error("❌ SUBMIT ERROR:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);

        if (error.response?.status === 401) {
          alert("🔐 Authentication failed. Please login again.");
          window.location.href = '/login';
        } else if (error.response?.data) {
          let errorMessage = "Submission failed: ";

          if (typeof error.response.data === 'object') {
            Object.keys(error.response.data).forEach(key => {
              if (Array.isArray(error.response.data[key])) {
                errorMessage += `${key}: ${error.response.data[key].join(', ')} `;
              } else {
                errorMessage += `${key}: ${error.response.data[key]} `;
              }
            });
          } else {
            errorMessage += JSON.stringify(error.response.data);
          }

          alert(`❌ ${errorMessage}`);
        } else {
          alert("❌ Something went wrong! Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
  });

  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [brandsLoading, setBrandsLoading] = useState(false);

  // Additional Images के लिए utility functions
  const handleAdditionalImagesRemove = (index: number) => {
    const newFiles = formik.values.gallery_images.filter((_, i) => i !== index);
    formik.setFieldValue("gallery_images", newFiles);
    setAdditionalCount(newFiles.length);

    // Cleanup preview URL
    if (additionalPreviews[index]) {
      URL.revokeObjectURL(additionalPreviews[index]);
      const newPreviews = additionalPreviews.filter((_, i) => i !== index);
      setAdditionalPreviews(newPreviews);
    }
  };

  const validateImageFiles = (files: File[]): File[] => {
    return files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image`);
        return false;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 5MB`);
        return false;
      }

      return true;
    });
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Limit to 5 images
    if (files.length > 5) {
      alert("Maximum 5 additional images allowed");
      return;
    }

    // Check total images don't exceed 5
    const totalImages = formik.values.gallery_images.length + files.length;
    if (totalImages > 5) {
      alert(`You can only upload 5 images total. You already have ${formik.values.gallery_images.length} images selected.`);
      return;
    }

    // Validate files
    const validFiles = validateImageFiles(files);

    if (validFiles.length > 0) {
      // Combine existing and new files
      const allFiles = [...formik.values.gallery_images, ...validFiles];

      formik.setFieldValue("gallery_images", allFiles);
      setAdditionalCount(allFiles.length);

      // Create preview URLs
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setAdditionalPreviews(prev => [...prev, ...newPreviews]);

      // Reset file input
      e.target.value = '';
    }
  };

  // Additional images के लिए cleanup function
  useEffect(() => {
    return () => {
      additionalPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [additionalPreviews]);

  // Fetch categories and brands
  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  // Reset stocks when product type changes
  useEffect(() => {
    if (formik.values.product_type === "simple") {
      const simpleStock: Stock = {
        mrp: 0,
        selling_price: 0,
        production_cost: 0,
        discount_type: "flat",
        discount_value: 0,
        tax: 0,
        stock_quantity: 0,
        barcode: "",
        unit: "",
        weight: "",
        color: "",
        size: "",
        maximum_order_quantity: 1,
        final_price: 0, // ✅ FINAL PRICE ADDED
      };
      formik.setFieldValue("stocks", [simpleStock]);
    }
  }, [formik.values.product_type]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (formik.values.category) {
      fetchSubCategories(formik.values.category);
    } else {
      setSubCategories([]);
      setSubSubCategories([]);
    }
  }, [formik.values.category]);

  // Fetch sub-subcategories when subcategory changes
  useEffect(() => {
    if (formik.values.subcategory) {
      fetchSubSubCategories(formik.values.subcategory);
    } else {
      setSubSubCategories([]);
    }
  }, [formik.values.subcategory]);

  // Set file names and status when editing - ENHANCED FOR EXISTING DATA
  useEffect(() => {
    if (isEdit && editData) {
      console.log("🔄 Edit mode: Loading existing product data", editData);
      
      // Format and set the form data
      const formattedData = formatEditData(editData);
      if (formattedData) {
        formik.setValues(formattedData);
      }

      // Set file names and status
      if (editData.main_image) setMainName(editData.main_image.split("/").pop() ?? "");
      if (editData.thumbnail_image) setThumbnailName(editData.thumbnail_image.split("/").pop() ?? "");
      if (editData.gallery?.length) setAdditionalCount(editData.gallery.length);
      if (editData.status) setProductStatus(editData.status);

      // Fetch subcategories and sub-subcategories based on existing data
      if (editData.category) {
        fetchSubCategories(editData.category.toString());
      }
      if (editData.subcategory) {
        fetchSubSubCategories(editData.subcategory.toString());
      }
    }
  }, [isEdit, editData]);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      {/* Header with status badge */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isEdit ? "Edit Product" : "Add Product"}
          </h2>
          {isEdit && productStatus && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600">Current Status:</span>
              <StatusBadge status={productStatus} />
              <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                ⚠️ Editing will change status to Pending
              </span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-5">
        {/* ────────────────────── PRODUCT INFORMATION ────────────────────── */}
        <section>
          <h3 className="font-semibold text-lg text-gray-700 mb-3">
            Product Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Product Name */}
            <div>
              <label className="font-medium">Product Name *</label>
              <input
                type="text"
                {...formik.getFieldProps("product_name")}
                placeholder="Enter product name"
                className="customInput"
              />
              {formik.touched.product_name && formik.errors.product_name && (
                <div className="text-red-500 text-sm">{formik.errors.product_name}</div>
              )}
            </div>

            {/* SKU */}
            <div>
              <div className="flex justify-between items-center">
                <label className="font-medium">SKU *</label>
                {!isEdit && (
                  <button
                    type="button"
                    onClick={() => formik.setFieldValue("sku", generateSKU())}
                    className="text-blue-600 text-sm"
                  >
                    Generate
                  </button>
                )}
              </div>
              <input
                type="text"
                {...formik.getFieldProps("sku")}
                placeholder="Enter SKU"
                className="customInput"
                readOnly={isEdit}
              />
              {formik.touched.sku && formik.errors.sku && (
                <div className="text-red-500 text-sm">{formik.errors.sku}</div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="font-medium">Category *</label>
              <select
                {...formik.getFieldProps("category")}
                className="customInput"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {formik.touched.category && formik.errors.category && (
                <div className="text-red-500 text-sm">{formik.errors.category}</div>
              )}
            </div>

            {/* Subcategory */}
            <div>
              <label className="font-medium">Subcategory</label>
              <select
                {...formik.getFieldProps("subcategory")}
                className="customInput"
                disabled={!formik.values.category}
              >
                <option value="">Select Subcategory</option>
                {subCategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-Subcategory */}
            <div>
              <label className="font-medium">Sub-Subcategory</label>
              <select
                {...formik.getFieldProps("subsubcategory")}
                className="customInput"
                disabled={!formik.values.subcategory}
              >
                <option value="">Select Sub-Subcategory</option>
                {subSubCategories.map((subsub) => (
                  <option key={subsub.id} value={subsub.id}>
                    {subsub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="font-medium">Brand</label>
              <select
                {...formik.getFieldProps("brand")}
                className="customInput"
                disabled={brandsLoading}
              >
                <option value="">Select Brand</option>
                {brandsLoading ? (
                  <option value="" disabled>Loading brands...</option>
                ) : (
                  brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.brand_name}
                    </option>
                  ))
                )}
              </select>
              {brands.length === 0 && !brandsLoading && (
                <div className="text-red-500 text-sm mt-1">
                  No brands available
                </div>
              )}
            </div>

            {/* Product Type */}
            <div>
              <label className="font-medium">Product Type *</label>
              <select
                {...formik.getFieldProps("product_type")}
                className="customInput"
              >
                <option value="simple">Simple</option>
                <option value="variant">Variant</option>
              </select>
              {formik.touched.product_type && formik.errors.product_type && (
                <div className="text-red-500 text-sm">{formik.errors.product_type}</div>
              )}
            </div>

            {/* Keywords */}
            <div>
              <label className="font-medium">Keywords</label>
              <input
                type="text"
                {...formik.getFieldProps("keywords")}
                placeholder="Enter keywords (comma separated)"
                className="customInput"
              />
            </div>

            {/* Short Description */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label className="font-medium">Short Description</label>
              <textarea
                rows={3}
                {...formik.getFieldProps("short_description")}
                placeholder="Brief description of the product"
                className="customInput w-full"
              />
            </div>

            {/* Full Description */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label className="font-medium">Full Description</label>
              <textarea
                rows={5}
                {...formik.getFieldProps("full_description")}
                placeholder="Detailed description of the product"
                className="customInput w-full"
              />
            </div>

            {/* Video URL */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label className="font-medium">Product Video URL</label>
              <input
                type="url"
                {...formik.getFieldProps("product_video_url")}
                placeholder="https://www.youtube.com/watch?v=..."
                className="customInput"
              />
            </div>
          </div>
        </section>

        {/* ────────────────────── PRICING & STOCK ────────────────────── */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg text-gray-700">
              Pricing & Stock
            </h3>
          </div>

          {formik.values.stocks.map((stock, index) => {
            const finalSellingPrice = calculateFinalSellingPrice(stock.selling_price, stock.tax);
            
            return (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 border border-gray-200 p-4 rounded-lg bg-gray-50"
            >
              <div className="col-span-full flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-700">
                  Stock Option {index + 1}
                </h4>
                {formik.values.product_type === "variant" && index > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newStocks = formik.values.stocks.filter((_, i) => i !== index);
                      formik.setFieldValue("stocks", newStocks);
                    }}
                    className="text-red-600 text-sm hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Basic Pricing */}
              <div>
                <label className="font-medium">MRP *</label>
                <input
                  type="number"
                  step="0.01"
                  name={`stocks[${index}].mrp`}
                  value={stock.mrp}
                  onChange={formik.handleChange}
                  className="customInput"
                  min="0"
                />
              </div>

              {/* Basic Selling Price (Tax Excluded) - NEW ADDED */}
              <div>
                <label className="font-medium">Selling Price * (Tax Excluded)</label>
                <input
                  type="number"
                  step="0.01"
                  value={stock.selling_price}
                  onChange={(e) => handleBasicSellingPriceChange(index, parseFloat(e.target.value) || 0)}
                  className="customInput"
                  min="0"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Price before tax
                </div>
              </div>

              {/* Tax - MODIFIED */}
              <div>
                <label className="font-medium">Tax *</label>
                <select
                  value={stock.tax}
                  onChange={(e) => handleTaxChange(index, parseFloat(e.target.value) || 0)}
                  className="customInput"
                >
                  <option value="0">Tax Free (0%)</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST</option>
                  <option value="28">28% GST</option>
                </select>
                {stock.tax > 0 && stock.selling_price > 0 && (
                  <div className="text-xs text-blue-600 mt-1">
                    Tax Amount: ₹{(finalSellingPrice - stock.selling_price).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Final Selling Price (Tax Included) - NEW ADDED */}
              <div>
                <label className="font-medium">Final Price (Tax Included)</label>
                <input
                  type="number"
                  step="0.01"
                  value={finalSellingPrice}
                  readOnly
                  className="customInput bg-green-50 border-green-200 cursor-not-allowed"
                />
                <div className="text-xs text-green-600 font-semibold mt-1">
                  Customer Price: ₹{finalSellingPrice}
                </div>
              </div>

              <div>
                <label className="font-medium">Production Cost</label>
                <input
                  type="number"
                  step="0.01"
                  name={`stocks[${index}].production_cost`}
                  value={stock.production_cost}
                  onChange={formik.handleChange}
                  className="customInput"
                  min="0"
                />
              </div>

              {/* Discount */}
              <div>
                <label className="font-medium">Discount Type</label>
                <select
                  name={`stocks[${index}].discount_type`}
                  value={stock.discount_type}
                  onChange={formik.handleChange}
                  className="customInput"
                >
                  <option value="flat">Flat</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>

              <div>
                <label className="font-medium">Discount Value</label>
                <input
                  type="number"
                  step="0.01"
                  name={`stocks[${index}].discount_value`}
                  value={stock.discount_value}
                  onChange={formik.handleChange}
                  className="customInput"
                  min="0"
                />
              </div>

              {/* Final Price Database Field - HIDDEN BUT SUBMITTED */}
              <div className="hidden">
                <label className="font-medium">Final Price (DB)</label>
                <input
                  type="number"
                  step="0.01"
                  name={`stocks[${index}].final_price`}
                  value={finalSellingPrice}
                  onChange={formik.handleChange}
                  className="customInput"
                />
              </div>

              {/* Stock Details */}
              <div>
                <label className="font-medium">Stock Quantity *</label>
                <input
                  type="number"
                  name={`stocks[${index}].stock_quantity`}
                  value={stock.stock_quantity}
                  onChange={formik.handleChange}
                  className="customInput"
                  min="0"
                />
              </div>

              <div>
                <label className="font-medium">Barcode</label>
                <input
                  type="text"
                  name={`stocks[${index}].barcode`}
                  value={stock.barcode}
                  onChange={formik.handleChange}
                  placeholder="Enter barcode"
                  className="customInput"
                />
              </div>

              <div>
                <label className="font-medium">Unit</label>
                <input
                  type="text"
                  name={`stocks[${index}].unit`}
                  value={stock.unit}
                  onChange={formik.handleChange}
                  placeholder="e.g., pieces, kg, liters"
                  className="customInput"
                />
              </div>

              <div>
                <label className="font-medium">Weight</label>
                <input
                  type="text"
                  name={`stocks[${index}].weight`}
                  value={stock.weight}
                  onChange={formik.handleChange}
                  placeholder="e.g., 500g, 1kg"
                  className="customInput"
                />
              </div>

              {/* Variant Specific Fields */}
              {formik.values.product_type === "variant" && (
                <>
                  <div>
                    <label className="font-medium">Color</label>
                    <input
                      type="text"
                      name={`stocks[${index}].color`}
                      value={stock.color}
                      onChange={formik.handleChange}
                      placeholder="e.g., Red, Blue"
                      className="customInput"
                    />
                  </div>

                  <div>
                    <label className="font-medium">Size</label>
                    <input
                      type="text"
                      name={`stocks[${index}].size`}
                      value={stock.size}
                      onChange={formik.handleChange}
                      placeholder="e.g., S, M, L, XL"
                      className="customInput"
                    />
                  </div>

                  <div>
                    <label className="font-medium">Max Order Quantity</label>
                    <input
                      type="number"
                      name={`stocks[${index}].maximum_order_quantity`}
                      value={stock.maximum_order_quantity}
                      onChange={formik.handleChange}
                      className="customInput"
                      min="1"
                    />
                  </div>
                </>
              )}
            </div>
            );
          })}

          {/* Add another stock row (only for Variant) */}
          {formik.values.product_type === "variant" && (
            <div className="flex w-full justify-end">
              <button
                type="button"
                onClick={() =>
                  formik.setFieldValue("stocks", [
                    ...formik.values.stocks,
                    {
                      mrp: 0,
                      selling_price: 0,
                      production_cost: 0,
                      discount_type: "flat",
                      discount_value: 0,
                      tax: 0,
                      stock_quantity: 0,
                      barcode: "",
                      unit: "",
                      weight: "",
                      color: "",
                      size: "",
                      maximum_order_quantity: 1,
                      final_price: 0, // ✅ FINAL PRICE ADDED
                    },
                  ])
                }
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <IoMdAddCircle size={20} /> Add Stock Variant
              </button>
            </div>
          )}
        </section>

        {/* ────────────────────── PRODUCT IMAGES ────────────────────── */}
        <section>
          <h3 className="font-semibold text-lg text-gray-700 mb-3">
            Product Images & Media
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Image */}
            <div>
              <label className="font-medium mb-2 block">Main Image *</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition text-center min-h-[200px]">
                <FaCloudUploadAlt className="text-blue-500 text-3xl mb-3" />
                <span className="text-blue-600 font-medium text-sm mb-1">
                  {mainName || "Click to upload main image"}
                </span>
                <span className="text-gray-500 text-xs">
                  Recommended: 800x800px, JPG/PNG
                </span>

                {isEdit && editData?.main_image && !formik.values.main_image && (
                  <img
                    src={editData.main_image}
                    alt="Main preview"
                    className="mt-3 w-full h-32 object-cover rounded border"
                  />
                )}

                {formik.values.main_image && (
                  <img
                    src={URL.createObjectURL(formik.values.main_image)}
                    alt="Main preview"
                    className="mt-3 w-full h-32 object-cover rounded border"
                  />
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    formik.setFieldValue("main_image", file);
                    setMainName(file ? file.name : "");
                  }}
                  className="hidden"
                />
              </label>
              {formik.submitCount > 0 && !formik.values.main_image && !isEdit && (
                <div className="text-red-500 text-sm mt-1">Main image is required</div>
              )}
            </div>

            {/* Thumbnail Image */}
            <div>
              <label className="font-medium mb-2 block">Thumbnail Image</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-green-400 hover:bg-green-50 transition text-center min-h-[200px]">
                <FaCloudUploadAlt className="text-green-500 text-3xl mb-3" />
                <span className="text-green-600 font-medium text-sm mb-1">
                  {thumbnailName || "Click to upload thumbnail"}
                </span>
                <span className="text-gray-500 text-xs">
                  Recommended: 400x400px, JPG/PNG
                </span>

                {isEdit && editData?.thumbnail_image && !formik.values.thumbnail_image && (
                  <img
                    src={editData.thumbnail_image}
                    alt="Thumbnail preview"
                    className="mt-3 w-full h-32 object-cover rounded border"
                  />
                )}

                {formik.values.thumbnail_image && (
                  <img
                    src={URL.createObjectURL(formik.values.thumbnail_image)}
                    alt="Thumbnail preview"
                    className="mt-3 w-full h-32 object-cover rounded border"
                  />
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    formik.setFieldValue("thumbnail_image", file);
                    setThumbnailName(file ? file.name : "");
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Additional Images */}
            <div>
              <label className="font-medium mb-2 block">Additional Images</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition text-center min-h-[200px]">
                <FaCloudUploadAlt className="text-purple-500 text-3xl mb-3" />
                <span className="text-purple-600 font-medium text-sm mb-1">
                  {additionalCount > 0
                    ? `${additionalCount} file${additionalCount > 1 ? "s" : ""} selected`
                    : "Click to upload additional images"}
                </span>
                <span className="text-gray-500 text-xs">
                  Multiple images allowed (Max 5 images)
                </span>

                {isEdit && editData?.gallery?.length && formik.values.gallery_images.length === 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {editData.gallery.map((url: any, idx: number) => (
                      <div key={idx} className="relative">
                        <img
                          src={url.image}
                          alt={`Additional ${idx + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {formik.values.gallery_images.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {formik.values.gallery_images.map((file, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Additional ${idx + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdditionalImagesRemove(idx);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAdditionalImagesChange}
                  className="hidden"
                />
              </label>

              {additionalCount > 0 && (
                <div className="text-sm text-gray-600 mt-2">
                  {additionalCount} image{additionalCount > 1 ? 's' : ''} selected
                  {additionalCount >= 5 && (
                    <span className="text-red-500 ml-2">Maximum limit reached</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ────────────────────── ADDITIONAL INFORMATION ────────────────────── */}
        <section>
          <h3 className="font-semibold text-lg text-gray-700 mb-3">
            Additional Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Product Condition */}
            <div>
              <label className="font-medium">Product Condition</label>
              <select
                {...formik.getFieldProps("product_condition")}
                className="customInput"
              >
                <option value="New">New</option>
                <option value="Refurbished">Refurbished</option>
                <option value="Used">Used</option>
                <option value="Like New">Like New</option>
              </select>
            </div>

            {/* Manufacturing Date */}
            <div>
              <label className="font-medium">Manufacturing Date</label>
              <input
                type="date"
                {...formik.getFieldProps("manufacturing_date")}
                className="customInput"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="font-medium">Expiry Date</label>
              <input
                type="date"
                {...formik.getFieldProps("expiry_date")}
                className="customInput"
              />
            </div>

            {/* Return Policy */}
            <div>
              <label className="font-medium">Return Policy</label>
              <select
                {...formik.getFieldProps("return_policy")}
                className="customInput"
              >
                <option value="">Select Return Policy</option>
                <option value="7 Days Return">7 Days Return</option>
                <option value="15 Days Return">15 Days Return</option>
                <option value="30 Days Return">30 Days Return</option>
                <option value="No Return">No Return</option>
                <option value="Exchange Only">Exchange Only</option>
              </select>
            </div>

            {/* Estimated Delivery Time */}
            <div>
              <label className="font-medium">Estimated Delivery Time</label>
              <input
                type="text"
                {...formik.getFieldProps("estimated_delivery_time")}
                placeholder="e.g., 3-5 business days"
                className="customInput"
              />
            </div>

            {/* Free Shipping Toggle */}
            <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
              <ToggleSwitch
                checked={formik.values.free_shipping}
                onChange={(checked) => formik.setFieldValue("free_shipping", checked)}
              />
              <div>
                <label className="font-medium block">Free Shipping</label>
                <span className="text-gray-500 text-sm">
                  {formik.values.free_shipping ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ────────────────────── SUBMIT BUTTON ────────────────────── */}
        <section className="pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to cancel? All unsaved changes will be lost.")) {
                  window.history.back();
                }
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  // Save as draft functionality
                  const draftData = {
                    ...formik.values,
                    status: "draft",
                  };
                  console.log("Saving as draft:", draftData);
                  alert("Product saved as draft!");
                }}
                className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                Save as Draft
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isEdit ? "Updating..." : "Submitting..."}
                  </>
                ) : (
                  isEdit ? "Update Product" : "Submit for Verification"
                )}
              </button>
            </div>
          </div>

          {/* Verification Info Message */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-blue-800">Verification Process</h4>
                <p className="text-blue-700 text-sm mt-1">
                  {isEdit 
                    ? "After updating, your product will be reviewed again by our admin team. The product will be temporarily hidden until approved."
                    : "After submission, your product will be reviewed by our admin team. Once approved, it will be live on the website. This process usually takes 24-48 hours."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Form Status */}
          {formik.status && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${formik.status.type === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
              }`}>
              {formik.status.message}
            </div>
          )}
        </section>
      </form>
    </div>
  );
};

export default AddProduct;