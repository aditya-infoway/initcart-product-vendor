import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import axiosInstance from '../../utils/axiosInstance';
import * as Yup from "yup";
import { IoMdAddCircle, IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { FiHome, FiDollarSign, FiImage, FiInfo } from "react-icons/fi";
import ToggleSwitch from "../../components/common/ToggleSwitch";
import { FaCloudUploadAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

// -------------------- IMAGE RULES (validation + auto resize) --------------------
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_ORIGINAL_SIZE_MB = 10; // original file size limit (before resize)
const MIN_IMAGE_DIMENSION = 300; // minimum width / height in px
const MAX_GALLERY_IMAGES = 5;

// Every uploaded image is converted to a perfect square so that it fits
// the product cards on the website without looking small / big / stretched.
const IMAGE_SIZES = {
  main: 800,
  thumbnail: 500,
  gallery: 800,
  variant: 800,
};

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${file.name}: file is not a valid image or is corrupted`));
    };
    img.src = url;
  });

/**
 * Validates the image and resizes it to a square canvas (size x size).
 * - Whole product is kept visible (no cropping) and centered on a white background.
 * - Output is always a JPG (small file size, white background for transparent PNGs).
 */
const processProductImage = async (file: File, size: number): Promise<File> => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`${file.name}: only JPG, PNG or WEBP images are allowed`);
  }
  if (file.size > MAX_ORIGINAL_SIZE_MB * 1024 * 1024) {
    throw new Error(`${file.name}: file is too large (max ${MAX_ORIGINAL_SIZE_MB}MB)`);
  }

  const img = await loadImage(file);
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  if (Math.min(w, h) < MIN_IMAGE_DIMENSION) {
    throw new Error(
      `${file.name}: image is too small (${w}x${h}). Minimum ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION}px required`
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing is not supported in this browser");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const scale = Math.min(size / w, size / h);
  const dw = Math.round(w * scale);
  const dh = Math.round(h * scale);
  ctx.drawImage(img, Math.round((size - dw) / 2), Math.round((size - dh) / 2), dw, dh);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error(`${file.name}: could not process image`))),
      "image/jpeg",
      0.9
    );
  });

  const baseName = file.name.replace(/\.[^/.]+$/, "") || "image";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
};

const showImageError = (messages: string | string[]) => {
  const text = Array.isArray(messages) ? messages.join("\n") : messages;
  Swal.fire({
    title: "⚠️ Image not accepted",
    text,
    icon: "warning",
    confirmButtonColor: "#3085d6",
  });
};

// Safe preview for a File (creates & revokes the object URL properly)
const FilePreview: React.FC<{ file: File; alt: string; className?: string }> = ({ file, alt, className }) => {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url ? <img src={url} alt={alt} className={className} /> : null;
};

// -------------------- TYPES --------------------
interface Stock {
  mrp: number;
  selling_price: number;
  tax: number;
  stock_quantity: number;
  barcode: string;
  unit: string;
  weight: string;
  color: string;
  size: string;
  maximum_order_quantity: number;
  final_price: number;
  variant_image: File | null;
  variant_image_url?: string;
}

interface Category {
  id: number;
  name: string;
  platform_charge: number;
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

interface DescriptionFeature {
  id: number;
  value: string;
}

interface Specification {
  id: number;
  title: string;
  value: string;
}

interface Warranty {
  available: boolean;
  period: string;
  type: string;
  description: string;
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
  description_features: DescriptionFeature[];
  product_video_url: string;
  stocks: Stock[];
  main_image: File | null;
  gallery_images: File[];
  thumbnail_image: File | null;
  product_condition: string;
  manufacturing_date: string;
  expiry_date: string;
  return_policy: string;
  estimated_delivery_time: string;
  free_shipping: boolean;
  specifications: Specification[];
  warranty: Warranty;
}

interface AddProductProps {
  isEdit?: boolean;
  editData?: any;
  onSubmit?: (values: ProductForm) => void;
}

// -------------------- COMPONENT --------------------
const AddProducts: React.FC<AddProductProps> = ({
  isEdit = false,
  editData,
  onSubmit,
}) => {
  const navigate = useNavigate();
  // State for dynamic data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<SubSubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [productStatus, setProductStatus] = useState<string>("");
  const [brandsLoading, setBrandsLoading] = useState(false);

  // Image processing state
  const [imageProcessing, setImageProcessing] = useState(false);

  // File name states
  const [mainName, setMainName] = useState<string>("");
  const [thumbnailName, setThumbnailName] = useState<string>("");
  const [additionalCount, setAdditionalCount] = useState<number>(0);

  // Collapsible sections
  const [showDescriptionSection, setShowDescriptionSection] = useState<boolean>(false);
  const [showSpecificationSection, setShowSpecificationSection] = useState<boolean>(false);
  const [showWarrantySection, setShowWarrantySection] = useState<boolean>(false);

  // Active section
  const [activeSection, setActiveSection] = useState<string>("product");

  // Platform charge
  const [selectedCategoryPlatformCharge, setSelectedCategoryPlatformCharge] = useState<number>(0);

  // Generate SKU
  const generateSKU = () => {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PROD-${rand}`;
  };

  // Calculate final selling price with tax
  const calculateFinalSellingPrice = (basePrice: number, taxRate: number) => {
    if (!basePrice || basePrice <= 0) return 0;
    const taxAmount = (basePrice * taxRate) / 100;
    return parseFloat((basePrice + taxAmount).toFixed(2));
  };

  // Calculate vendor receivable from final price
  const calculateVendorReceivable = (finalPrice: number, platformCharge: number) => {
    if (!finalPrice || finalPrice <= 0 || !platformCharge || platformCharge <= 0) {
      return finalPrice;
    }
    const deduction = (finalPrice * platformCharge) / 100;
    return parseFloat((finalPrice - deduction).toFixed(2));
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
      const response = await axiosInstance.get('brands/');
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

  // Handle tax change
  const handleTaxChange = (index: number, taxValue: number) => {
    const currentStocks = [...formik.values.stocks];
    const currentStock = currentStocks[index];
    currentStock.tax = taxValue;
    formik.setFieldValue("stocks", currentStocks);
  };

  // Handle basic selling price change
  const handleBasicSellingPriceChange = (index: number, basicSellingPrice: number) => {
    const currentStocks = [...formik.values.stocks];
    const currentStock = currentStocks[index];
    currentStock.selling_price = basicSellingPrice;
    formik.setFieldValue("stocks", currentStocks);
  };

  // Handle variant image change (validate + auto resize)
  const handleVariantImageChange = async (index: number, file: File | null) => {
    if (!file) {
      const updatedStocks = [...formik.values.stocks];
      updatedStocks[index] = { ...updatedStocks[index], variant_image: null };
      formik.setFieldValue("stocks", updatedStocks);
      return;
    }

    setImageProcessing(true);
    try {
      const processed = await processProductImage(file, IMAGE_SIZES.variant);
      const updatedStocks = [...formik.values.stocks];
      updatedStocks[index] = { ...updatedStocks[index], variant_image: processed };
      formik.setFieldValue("stocks", updatedStocks);
    } catch (err: any) {
      showImageError(err?.message || "Could not process image");
    } finally {
      setImageProcessing(false);
    }
  };

  // Handle main / thumbnail image change (validate + auto resize)
  const handleSingleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "main_image" | "thumbnail_image",
    size: number,
    setName: (name: string) => void
  ) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    setImageProcessing(true);
    try {
      const processed = await processProductImage(file, size);
      formik.setFieldValue(field, processed);
      setName(processed.name);
    } catch (err: any) {
      showImageError(err?.message || "Could not process image");
    } finally {
      setImageProcessing(false);
    }
  };

  // Update description feature
  const updateDescriptionFeature = (id: number, newValue: string) => {
    const updatedFeatures = formik.values.description_features.map(feature => {
      if (feature.id === id) {
        return { ...feature, value: newValue };
      }
      return feature;
    });
    formik.setFieldValue("description_features", updatedFeatures);
  };

  // Format edit data for form
  const formatEditData = (productData: any) => {
    if (!productData) return null;

    // Format stocks data
    const formattedStocks = productData.stocks && productData.stocks.length > 0
      ? productData.stocks.map((stock: any) => ({
        mrp: parseFloat(stock.mrp) || 0,
        selling_price: parseFloat(stock.selling_price) || 0,
        tax: parseFloat(stock.tax) || 0,
        stock_quantity: stock.stock_quantity || 0,
        barcode: stock.barcode || "",
        unit: stock.unit || "",
        weight: stock.weight || "",
        color: stock.color || "",
        size: stock.size || "",
        maximum_order_quantity: stock.maximum_order_quantity || 1,
        final_price: parseFloat(stock.final_price) || 0,
        variant_image: null,
        variant_image_url: stock.variant_image || "",
      }))
      : [
        {
          mrp: 0,
          selling_price: 0,
          tax: 0,
          stock_quantity: 0,
          barcode: "",
          unit: "",
          weight: "",
          color: "",
          size: "",
          maximum_order_quantity: 1,
          final_price: 0,
          variant_image: null,
          variant_image_url: "",
        },
      ];

    // Format description features if exists
    const formattedDescriptionFeatures = productData.description_features?.map((feature: any, index: number) => ({
      id: index + 1,
      value: feature.value || ""
    })) || [
        { id: 1, value: "" },
        { id: 2, value: "" },
        { id: 3, value: "" },
        { id: 4, value: "" },
        { id: 5, value: "" },
        { id: 6, value: "" }
      ];

    // Format specifications if exists (fixed 6)
    const formattedSpecifications = productData.specifications?.map((spec: any, index: number) => ({
      id: index + 1,
      title: spec.title || "",
      value: spec.value || ""
    })) || [
        { id: 1, title: "", value: "" },
        { id: 2, title: "", value: "" },
        { id: 3, title: "", value: "" },
        { id: 4, title: "", value: "" },
        { id: 5, title: "", value: "" },
        { id: 6, title: "", value: "" }
      ];

    // Format warranty data
    const formattedWarranty = productData.warranty || {
      available: false,
      period: "",
      type: "Manufacturer Warranty",
      description: ""
    };

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
      description_features: formattedDescriptionFeatures,
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
      specifications: formattedSpecifications,
      warranty: formattedWarranty,
    };
  };

  // Formik configuration
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
      description_features: [
        { id: 1, value: "" },
        { id: 2, value: "" },
        { id: 3, value: "" },
        { id: 4, value: "" },
        { id: 5, value: "" },
        { id: 6, value: "" }
      ],
      product_video_url: "",
      stocks: [
        {
          mrp: 0,
          selling_price: 0,
          tax: 0,
          stock_quantity: 0,
          barcode: "",
          unit: "",
          weight: "",
          color: "",
          size: "",
          maximum_order_quantity: 1,
          final_price: 0,
          variant_image: null,
          variant_image_url: "",
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
      specifications: [],
      warranty: {
        available: false,
        period: "",
        type: "Manufacturer Warranty",
        description: "",
      },
    },

    validationSchema: Yup.object({
      product_name: Yup.string().required("Product Name is required"),
      category: Yup.string().required("Category is required"),
      sku: Yup.string().required("SKU is required"),
      product_type: Yup.string().required("Product Type is required"),
    }),

    onSubmit: async (values) => {
      setLoading(true);

      try {
        const formData = new FormData();

        // Append basic fields
        formData.append("product_name", values.product_name);
        formData.append("sku", values.sku);

        if (values.category) formData.append("category", values.category);
        if (values.subcategory) formData.append("subcategory", values.subcategory);
        if (values.subsubcategory) formData.append("subsubcategory", values.subsubcategory);
        if (values.brand) formData.append("brand", values.brand.toString());

        formData.append("product_type", values.product_type);
        formData.append("keywords", values.keywords);
        formData.append("short_description", values.short_description);

        // Append description features as JSON
        const validDescriptionFeatures = values.description_features.filter(feature =>
          feature.value.trim() !== ""
        );
        if (validDescriptionFeatures.length > 0) {
          formData.append("description_features", JSON.stringify(validDescriptionFeatures));
        }

        // Append specifications as JSON
        const validSpecifications = values.specifications.filter(spec =>
          spec.title.trim() !== "" && spec.value.trim() !== ""
        );
        if (validSpecifications.length > 0) {
          formData.append("specifications", JSON.stringify(validSpecifications));
        }

        // Append warranty as JSON
        formData.append("warranty", JSON.stringify(values.warranty));

        formData.append("product_video_url", values.product_video_url);
        formData.append("product_condition", values.product_condition);
        formData.append("manufacturing_date", values.manufacturing_date);
        formData.append("expiry_date", values.expiry_date);
        formData.append("return_policy", values.return_policy);
        formData.append("estimated_delivery_time", values.estimated_delivery_time);
        formData.append("free_shipping", values.free_shipping.toString());

        if (isEdit) {
          formData.append("status", "pending");
        }

        // Stocks fields
        values.stocks.forEach((stock, index) => {
          formData.append(`stocks[${index}][mrp]`, stock.mrp.toString());
          formData.append(`stocks[${index}][selling_price]`, stock.selling_price.toString());
          formData.append(`stocks[${index}][tax]`, stock.tax.toString());
          formData.append(`stocks[${index}][stock_quantity]`, stock.stock_quantity.toString());
          formData.append(`stocks[${index}][barcode]`, stock.barcode);
          formData.append(`stocks[${index}][unit]`, stock.unit);
          formData.append(`stocks[${index}][weight]`, stock.weight);
          formData.append(`stocks[${index}][color]`, stock.color);
          formData.append(`stocks[${index}][size]`, stock.size);
          formData.append(`stocks[${index}][maximum_order_quantity]`, stock.maximum_order_quantity.toString());
          formData.append(`stocks[${index}][final_price]`, stock.final_price.toString());

          // Append variant image if exists
          if (stock.variant_image) {
            formData.append(`variant_images[${index}]`, stock.variant_image);
          }

          // For edit mode, send variant_image_url if no new image
          if (isEdit && !stock.variant_image && stock.variant_image_url) {
            formData.append(`stocks[${index}][variant_image_url]`, stock.variant_image_url);
          }
        });

        // Images - FOR VARIANT PRODUCTS, MAIN IMAGE IS NOT REQUIRED
        if (values.main_image) {
          formData.append("main_image", values.main_image);
        }

        if (values.thumbnail_image) formData.append("thumbnail_image", values.thumbnail_image);

        values.gallery_images.forEach((file) => {
          formData.append("gallery_images", file);
        });

        // API URLs
        const url = isEdit && editData?.id
          ? `vendor/products/${editData.id}/`
          : "vendor/create/";

        const response = await axiosInstance({
          method: isEdit ? 'PUT' : 'POST',
          url: url,
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (isEdit) {
          await Swal.fire({
            title: "🎉 Product Updated!",
            html: `
          <div class="text-left">
            <p class="text-lg font-semibold text-green-600 mb-2">"${response.data.product_name}"</p>
            <p class="mb-3">has been updated and sent for re-approval.</p>
            <div class="bg-yellow-50 p-3 rounded-lg mb-2">
              <p class="font-medium text-yellow-800">Status: Pending Review</p>
            </div>
            <p class="text-sm text-gray-600">Our admin team will review the changes. The product will be temporarily hidden until approved again.</p>
          </div>
        `,
            icon: "success",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "OK",
            timer: 5000,
            timerProgressBar: true,
          });
        } else {
          await Swal.fire({
            title: "🎉 Product Submitted!",
            html: `
          <div class="text-left">
            <p class="text-lg font-semibold text-green-600 mb-2">"${response.data.product_name}"</p>
            <p class="mb-3">has been submitted for verification.</p>
            <div class="bg-blue-50 p-3 rounded-lg mb-2">
              <p class="font-medium text-blue-800">📋 What happens next:</p>
              <ul class="list-disc pl-4 mt-2 text-sm text-blue-700">
                <li>Our admin team will review your product</li>
                <li>You'll be notified once it's approved</li>
                <li>Approval usually takes 24-48 hours</li>
                <li>Product will go live after approval</li>
              </ul>
            </div>
            <p class="text-sm text-gray-600">Thank you for your patience!</p>
          </div>
        `,
            icon: "success",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "OK",
            timer: 6000,
            timerProgressBar: true,
          });
        }

        if (onSubmit) {
          onSubmit(values);
        }

        if (!isEdit) {
          formik.resetForm();
          setMainName("");
          setThumbnailName("");
          setAdditionalCount(0);
          setShowDescriptionSection(false);
          setShowSpecificationSection(false);
          setShowWarrantySection(false);
        }

        navigate("/products");

      } catch (error: any) {
        console.error("❌ SUBMIT ERROR:", error);

        if (error.response?.status === 401) {
          Swal.fire({
            title: "🔐 Session Expired",
            text: "Please login again to continue.",
            icon: "warning",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "Login Now"
          }).then(() => {
            window.location.href = '/login';
          });
        } else if (error.response?.data) {
          let errorMessage = "";
          const errorResponse = error.response.data;

          if (typeof errorResponse === 'object') {
            Object.keys(errorResponse).forEach(key => {
              if (Array.isArray(errorResponse[key])) {
                errorMessage += `${key}: ${errorResponse[key].join(', ')}\n`;
              } else {
                errorMessage += `${key}: ${errorResponse[key]}\n`;
              }
            });
          } else {
            errorMessage = JSON.stringify(errorResponse);
          }

          Swal.fire({
            title: "❌ Submission Failed",
            text: errorMessage,
            icon: "error",
            confirmButtonColor: "#d33",
            confirmButtonText: "Try Again"
          });
        } else {
          Swal.fire({
            title: "❌ Something Went Wrong",
            text: "Please try again later.",
            icon: "error",
            confirmButtonColor: "#d33",
            confirmButtonText: "OK"
          });
        }
      } finally {
        setLoading(false);
      }
    },
  });

  const validateForm = async () => {
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors).join('\n');
      Swal.fire({
        title: "⚠️ Validation Error",
        text: errorMessages,
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return false;
    }
    return true;
  };

  // Additional (gallery) images utility functions
  const handleAdditionalImagesRemove = (index: number) => {
    const newFiles = formik.values.gallery_images.filter((_, i) => i !== index);
    formik.setFieldValue("gallery_images", newFiles);
    setAdditionalCount(newFiles.length);
  };

  const handleAdditionalImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const existing = formik.values.gallery_images.length;
    if (existing + files.length > MAX_GALLERY_IMAGES) {
      showImageError(
        `You can upload maximum ${MAX_GALLERY_IMAGES} additional images. You already have ${existing} selected.`
      );
      return;
    }

    setImageProcessing(true);
    try {
      const results = await Promise.allSettled(
        files.map((f) => processProductImage(f, IMAGE_SIZES.gallery))
      );

      const okFiles: File[] = [];
      const errors: string[] = [];
      results.forEach((r, i) => {
        if (r.status === "fulfilled") okFiles.push(r.value);
        else errors.push(r.reason?.message || `${files[i].name}: could not be processed`);
      });

      if (okFiles.length > 0) {
        const allFiles = [...formik.values.gallery_images, ...okFiles];
        formik.setFieldValue("gallery_images", allFiles);
        setAdditionalCount(allFiles.length);
      }
      if (errors.length > 0) showImageError(errors);
    } finally {
      setImageProcessing(false);
    }
  };

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
        tax: 0,
        stock_quantity: 0,
        barcode: "",
        unit: "",
        weight: "",
        color: "",
        size: "",
        maximum_order_quantity: 1,
        final_price: 0,
        variant_image: null,
        variant_image_url: "",
      };
      formik.setFieldValue("stocks", [simpleStock]);
    }
  }, [formik.values.product_type]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (formik.values.category) {
      fetchSubCategories(formik.values.category);

      const selectedCat = categories.find(c => c.id.toString() === formik.values.category);
      if (selectedCat) {
        setSelectedCategoryPlatformCharge(selectedCat.platform_charge || 0);
      }
    } else {
      setSubCategories([]);
      setSubSubCategories([]);
      setSelectedCategoryPlatformCharge(0);
    }
  }, [formik.values.category, categories]);

  // Fetch sub-subcategories when subcategory changes
  useEffect(() => {
    if (formik.values.subcategory) {
      fetchSubSubCategories(formik.values.subcategory);
    } else {
      setSubSubCategories([]);
    }
  }, [formik.values.subcategory]);

  // Set file names and status when editing
  useEffect(() => {
    if (isEdit && editData) {
      const formattedData = formatEditData(editData);
      if (formattedData) {
        formik.setValues(formattedData);
      }

      if (editData.main_image) setMainName(editData.main_image.split("/").pop() ?? "");
      if (editData.thumbnail_image) setThumbnailName(editData.thumbnail_image.split("/").pop() ?? "");
      if (editData.gallery?.length) setAdditionalCount(editData.gallery.length);
      if (editData.status) setProductStatus(editData.status);

      if (editData.category) {
        fetchSubCategories(editData.category.toString());

        const selectedCat = categories.find(c => c.id.toString() === editData.category.toString());
        if (selectedCat) {
          setSelectedCategoryPlatformCharge(selectedCat.platform_charge || 0);
        }
      }
      if (editData.subcategory) {
        fetchSubSubCategories(editData.subcategory.toString());
      }
    }
  }, [isEdit, editData, categories]);

  // Render error helper
  const renderError = (field: keyof ProductForm) =>
    formik.touched[field] && formik.errors[field] ? (
      <div className="text-red-500 text-sm mt-1">{formik.errors[field] as string}</div>
    ) : null;

  // Sections array for tabs
  const sections = [
    { id: "product", label: "Product Info", icon: <FiHome /> },
    { id: "pricing", label: "Pricing & Stock", icon: <FiDollarSign /> },
    { id: "images", label: "Product Images", icon: <FiImage /> },
    { id: "additional", label: "Additional Info", icon: <FiInfo /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-gray-600">Create and manage your products</p>
          {isEdit && productStatus && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600">Current Status:</span>
              <StatusBadge status={productStatus} />
              <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                Editing will change status to Pending
              </span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-2">
          {sections.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeSection === tab.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-8">
          {/* 1. Product Information Section */}
          {(activeSection === "product" || activeSection === "all") && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                Product Information
              </h2>

              <div className="space-y-6">
                {/* Product Name, SKU, Category in one row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      {...formik.getFieldProps("product_name")}
                      placeholder="Enter product name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {renderError("product_name")}
                  </div>

                  {/* SKU */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        SKU *
                      </label>
                      {!isEdit && (
                        <button
                          type="button"
                          onClick={() => formik.setFieldValue("sku", generateSKU())}
                          className="text-blue-600 text-sm hover:text-blue-800"
                        >
                          Generate
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      {...formik.getFieldProps("sku")}
                      placeholder="Enter SKU"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly={isEdit}
                    />
                    {renderError("sku")}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      {...formik.getFieldProps("category")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {renderError("category")}
                  </div>
                </div>

                {/* Subcategory, Sub-Subcategory, Brand in one row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Subcategory */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategory
                    </label>
                    <select
                      {...formik.getFieldProps("subcategory")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sub-Subcategory
                    </label>
                    <select
                      {...formik.getFieldProps("subsubcategory")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <select
                      {...formik.getFieldProps("brand")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                </div>

                {/* Product Type and Keywords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Type *
                    </label>
                    <select
                      {...formik.getFieldProps("product_type")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="simple">Simple</option>
                      <option value="variant">Variant</option>
                    </select>
                    {renderError("product_type")}
                  </div>

                  {/* Keywords */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keywords
                    </label>
                    <input
                      type="text"
                      {...formik.getFieldProps("keywords")}
                      placeholder="Enter keywords (comma separated)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Description Section Button (Collapsible) */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowDescriptionSection(!showDescriptionSection)}
                    className="flex items-center justify-between w-full p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition mb-4"
                  >
                    <span className="font-bold text-gray-900">Add Product Description</span>
                    {showDescriptionSection ? (
                      <IoIosArrowUp className="text-gray-500" />
                    ) : (
                      <IoIosArrowDown className="text-gray-500" />
                    )}
                  </button>

                  {showDescriptionSection && (
                    <div className="mt-4 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                      {/* Short Description */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Short Description
                        </label>
                        <textarea
                          rows={3}
                          {...formik.getFieldProps("short_description")}
                          placeholder="Enter short description"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <h2 className="font-medium text-gray-800 mb-4">Key Features</h2>

                      <div className="space-y-4">
                        {formik.values.description_features.map((feature, index) => (
                          <div key={feature.id} className="flex gap-4 items-center">
                            <span className="font-medium text-gray-700 min-w-[100px]">
                              Feature {index + 1}:
                            </span>
                            <input
                              type="text"
                              value={feature.value}
                              onChange={(e) => updateDescriptionFeature(feature.id, e.target.value)}
                              placeholder={`Enter product feature ${index + 1}`}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Video URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Video URL
                  </label>
                  <input
                    type="url"
                    {...formik.getFieldProps("product_video_url")}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Pricing & Stock Section */}
          {(activeSection === "pricing" || activeSection === "all") && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                Pricing & Stock
              </h2>

              {/* Platform Charge Info Banner */}
              {selectedCategoryPlatformCharge > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800">Platform Charge: {selectedCategoryPlatformCharge}%</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        This amount will be deducted from your final price (including tax).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {formik.values.stocks.map((stock, index) => {
                  const finalSellingPrice = calculateFinalSellingPrice(stock.selling_price, stock.tax);

                  const vendorReceivable = calculateVendorReceivable(finalSellingPrice, selectedCategoryPlatformCharge);
                  const platformDeduction = finalSellingPrice - vendorReceivable;

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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          MRP *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name={`stocks[${index}].mrp`}
                          value={stock.mrp}
                          onChange={formik.handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>

                      {/* Basic Selling Price (Tax Excluded) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Selling Price * (Tax Excluded)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={stock.selling_price}
                          onChange={(e) => handleBasicSellingPriceChange(index, parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Price before tax
                        </div>
                      </div>

                      {/* Tax */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tax *
                        </label>
                        <select
                          value={stock.tax}
                          onChange={(e) => handleTaxChange(index, parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                      {/* Final Selling Price (Tax Included) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Final Price (Tax Included)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={finalSellingPrice}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-green-50 border-green-200 cursor-not-allowed"
                        />
                        <div className="text-xs text-green-600 font-semibold mt-1">
                          Customer Price: ₹{finalSellingPrice}
                        </div>
                      </div>

                      {/* Vendor Receivable Info */}
                      {selectedCategoryPlatformCharge > 0 && (
                        <div className="col-span-full mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <span className="text-sm text-gray-600">Final Price (with tax):</span>
                              <span className="ml-2 font-semibold">₹{finalSellingPrice.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Platform Charge({selectedCategoryPlatformCharge}%):</span>
                              <span className="ml-2 font-semibold text-blue-600">-₹{platformDeduction.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">You Receive:</span>
                              <span className="ml-2 font-bold text-blue-600">₹{vendorReceivable.toFixed(2)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            *Platform charge applied on final price (including tax). This is your earnings after platform fees.
                          </p>
                        </div>
                      )}

                      {/* Stock Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stock Quantity *
                        </label>
                        <input
                          type="number"
                          name={`stocks[${index}].stock_quantity`}
                          value={stock.stock_quantity}
                          onChange={formik.handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>

                      {/* Barcode */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Barcode
                        </label>
                        <input
                          type="text"
                          name={`stocks[${index}].barcode`}
                          value={stock.barcode}
                          onChange={formik.handleChange}
                          placeholder="Enter barcode"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Unit */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit
                        </label>
                        <input
                          type="text"
                          name={`stocks[${index}].unit`}
                          value={stock.unit}
                          onChange={formik.handleChange}
                          placeholder="e.g., pieces, kg, liters"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Weight */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weight
                        </label>
                        <input
                          type="text"
                          name={`stocks[${index}].weight`}
                          value={stock.weight}
                          onChange={formik.handleChange}
                          placeholder="e.g., 500g, 1kg"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Max Order Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Order Quantity *
                        </label>
                        <input
                          type="number"
                          name={`stocks[${index}].maximum_order_quantity`}
                          value={stock.maximum_order_quantity}
                          onChange={formik.handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Maximum quantity customer can order
                        </div>
                      </div>

                      {/* Variant Specific Fields */}
                      {formik.values.product_type === "variant" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Color
                            </label>
                            <input
                              type="text"
                              name={`stocks[${index}].color`}
                              value={stock.color}
                              onChange={formik.handleChange}
                              placeholder="e.g., Red, Blue"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Size
                            </label>
                            <input
                              type="text"
                              name={`stocks[${index}].size`}
                              value={stock.size}
                              onChange={formik.handleChange}
                              placeholder="e.g., S, M, L, XL"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          {/* Variant Image Upload Section */}
                          <div className="col-span-full mt-4 pt-4 border-t">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Variant Specific Image (Optional)
                              <span className="text-xs text-gray-500 ml-2">
                                Upload image specific to this variant (e.g., Red T-shirt)
                              </span>
                            </label>

                            <div className="flex items-center gap-4">
                              <label className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-lg p-4 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors text-center min-h-[120px] min-w-[120px]">
                                <FaCloudUploadAlt className="text-purple-500 text-2xl mb-2" />
                                <span className="text-purple-600 font-medium text-xs mb-1">
                                  {stock.variant_image ? stock.variant_image.name :
                                    stock.variant_image_url ? "Image uploaded" :
                                      "Click to upload"}
                                </span>

                                {/* Show existing image in edit mode */}
                                {isEdit && stock.variant_image_url && !stock.variant_image && (
                                  <img
                                    src={stock.variant_image_url}
                                    alt={`Variant ${index + 1}`}
                                    className="mt-2 w-20 h-20 object-contain bg-white rounded border"
                                  />
                                )}

                                {/* Show new uploaded (resized) image preview */}
                                {stock.variant_image && (
                                  <FilePreview
                                    file={stock.variant_image}
                                    alt={`Variant ${index + 1} preview`}
                                    className="mt-2 w-20 h-20 object-contain bg-white rounded border"
                                  />
                                )}

                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    e.target.value = "";
                                    if (file) handleVariantImageChange(index, file);
                                  }}
                                  className="hidden"
                                />
                              </label>

                              <div className="text-sm text-gray-600">
                                <p className="font-medium">Variant Image</p>
                                <p className="text-xs mt-1">
                                  Auto-resized to {IMAGE_SIZES.variant}x{IMAGE_SIZES.variant}px. JPG / PNG / WEBP, min {MIN_IMAGE_DIMENSION}x{MIN_IMAGE_DIMENSION}px.
                                </p>
                                {stock.variant_image && (
                                  <button
                                    type="button"
                                    onClick={() => handleVariantImageChange(index, null)}
                                    className="mt-2 text-red-600 text-xs hover:text-red-800"
                                  >
                                    Remove Image
                                  </button>
                                )}
                              </div>
                            </div>
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

                            tax: 0,
                            stock_quantity: 0,
                            barcode: "",
                            unit: "",
                            weight: "",
                            color: "",
                            size: "",
                            maximum_order_quantity: 1,
                            final_price: 0,
                            variant_image: null,
                            variant_image_url: "",
                          },
                        ])
                      }
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      <IoMdAddCircle size={20} /> Add Stock Variant
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Product Images Section */}
          {(activeSection === "images" || activeSection === "all") && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6 border-b pb-2">
                <h2 className="text-2xl font-bold text-gray-800">
                  Product Images & Media
                </h2>
                {imageProcessing && (
                  <span className="flex items-center gap-2 text-sm text-blue-600">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Optimizing image...
                  </span>
                )}
              </div>

              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                All images are automatically resized to a perfect square so they fit the product cards on the website.
                Allowed: JPG, PNG, WEBP (max {MAX_ORIGINAL_SIZE_MB}MB, min {MIN_IMAGE_DIMENSION}x{MIN_IMAGE_DIMENSION}px). Your full product stays visible, nothing is cropped.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Image - HIDE FOR VARIANT PRODUCTS */}
                {formik.values.product_type !== "variant" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Main Image *
                    </label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors text-center min-h-[200px]">
                      <FaCloudUploadAlt className="text-blue-500 text-3xl mb-3" />
                      <span className="text-blue-600 font-medium text-sm mb-1">
                        {mainName || "Click to upload main image"}
                      </span>
                      <span className="text-gray-500 text-xs">
                        Auto-resized to {IMAGE_SIZES.main}x{IMAGE_SIZES.main}px
                      </span>

                      {isEdit && editData?.main_image && !formik.values.main_image && (
                        <img
                          src={editData.main_image}
                          alt="Main preview"
                          className="mt-3 w-full h-32 object-contain bg-white rounded border"
                        />
                      )}

                      {formik.values.main_image && (
                        <FilePreview
                          file={formik.values.main_image}
                          alt="Main preview"
                          className="mt-3 w-full h-32 object-contain bg-white rounded border"
                        />
                      )}

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleSingleImageChange(e, "main_image", IMAGE_SIZES.main, setMainName)}
                        className="hidden"
                      />
                    </label>
                    {formik.submitCount > 0 && !formik.values.main_image && !isEdit && formik.values.product_type !== "variant" && (
                      <div className="text-red-500 text-sm mt-1">Main image is required</div>
                    )}
                  </div>
                )}

                {/* If variant product, show a message instead of main image input */}
                {formik.values.product_type === "variant" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center justify-center text-center min-h-[200px]">
                    <div>
                      <FiInfo className="text-blue-500 text-3xl mx-auto mb-2" />
                      <p className="text-blue-700 font-medium">Main Image Not Required</p>
                      <p className="text-blue-600 text-sm mt-1">
                        For variant products, main images are taken from variant images.
                      </p>
                    </div>
                  </div>
                )}

                {/* Thumbnail Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail Image
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-green-300 rounded-lg p-6 cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors text-center min-h-[200px]">
                    <FaCloudUploadAlt className="text-green-500 text-3xl mb-3" />
                    <span className="text-green-600 font-medium text-sm mb-1">
                      {thumbnailName || "Click to upload thumbnail"}
                    </span>
                    <span className="text-gray-500 text-xs">
                      Auto-resized to {IMAGE_SIZES.thumbnail}x{IMAGE_SIZES.thumbnail}px
                    </span>

                    {isEdit && editData?.thumbnail_image && !formik.values.thumbnail_image && (
                      <img
                        src={editData.thumbnail_image}
                        alt="Thumbnail preview"
                        className="mt-3 w-full h-32 object-contain bg-white rounded border"
                      />
                    )}

                    {formik.values.thumbnail_image && (
                      <FilePreview
                        file={formik.values.thumbnail_image}
                        alt="Thumbnail preview"
                        className="mt-3 w-full h-32 object-contain bg-white rounded border"
                      />
                    )}

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleSingleImageChange(e, "thumbnail_image", IMAGE_SIZES.thumbnail, setThumbnailName)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Additional Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Images
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-lg p-6 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors text-center min-h-[200px]">
                    <FaCloudUploadAlt className="text-purple-500 text-3xl mb-3" />
                    <span className="text-purple-600 font-medium text-sm mb-1">
                      {additionalCount > 0
                        ? `${additionalCount} file${additionalCount > 1 ? "s" : ""} selected`
                        : "Click to upload additional images"}
                    </span>
                    <span className="text-gray-500 text-xs">
                      Multiple images allowed (Max {MAX_GALLERY_IMAGES} images)
                    </span>

                    {isEdit && editData?.gallery?.length && formik.values.gallery_images.length === 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {editData.gallery.map((url: any, idx: number) => (
                          <div key={idx} className="relative">
                            <img
                              src={url.image}
                              alt={`Additional ${idx + 1}`}
                              className="w-16 h-16 object-contain bg-white rounded border"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {formik.values.gallery_images.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {formik.values.gallery_images.map((file, idx) => (
                          <div key={`${file.name}-${file.lastModified}-${idx}`} className="relative">
                            <FilePreview
                              file={file}
                              alt={`Additional ${idx + 1}`}
                              className="w-16 h-16 object-contain bg-white rounded border"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
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
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleAdditionalImagesChange}
                      className="hidden"
                    />
                  </label>

                  {additionalCount > 0 && (
                    <div className="text-sm text-gray-600 mt-2">
                      {additionalCount} image{additionalCount > 1 ? 's' : ''} selected
                      {additionalCount >= MAX_GALLERY_IMAGES && (
                        <span className="text-red-500 ml-2">Maximum limit reached</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. Additional Information Section */}
          {(activeSection === "additional" || activeSection === "all") && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                Additional Information
              </h2>

              <div className="space-y-8">
                {/* Product Condition, Dates, etc */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Product Condition */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Condition
                    </label>
                    <select
                      {...formik.getFieldProps("product_condition")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="New">New</option>
                      <option value="Refurbished">Refurbished</option>
                      <option value="Used">Used</option>
                      <option value="Like New">Like New</option>
                    </select>
                  </div>

                  {/* Manufacturing Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturing Date
                    </label>
                    <input
                      type="date"
                      {...formik.getFieldProps("manufacturing_date")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      {...formik.getFieldProps("expiry_date")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Return Policy */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Return Policy
                    </label>
                    <select
                      {...formik.getFieldProps("return_policy")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Delivery Time
                    </label>
                    <input
                      type="text"
                      {...formik.getFieldProps("estimated_delivery_time")}
                      placeholder="e.g., 3-5 business days"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Free Shipping Toggle */}
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <ToggleSwitch
                      checked={formik.values.free_shipping}
                      onChange={(checked) => formik.setFieldValue("free_shipping", checked)}
                    />
                    <div>
                      <label className="font-medium block text-gray-700">Free Shipping</label>
                      <span className="text-gray-500 text-sm">
                        {formik.values.free_shipping ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Warranty Section */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowWarrantySection(!showWarrantySection)}
                    className="flex items-center justify-between w-full p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition mb-3"
                  >
                    <span className="font-bold text-gray-900">Add Warranty Information</span>
                    {showWarrantySection ? (
                      <IoIosArrowUp className="text-gray-500" />
                    ) : (
                      <IoIosArrowDown className="text-gray-500" />
                    )}
                  </button>

                  {showWarrantySection && (
                    <div className="mt-2 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <ToggleSwitch
                          checked={formik.values.warranty.available}
                          onChange={(checked) => formik.setFieldValue("warranty.available", checked)}
                        />
                        <span className="font-medium text-gray-700">
                          {formik.values.warranty.available ? "Warranty Available" : "No Warranty"}
                        </span>
                      </div>

                      {formik.values.warranty.available && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Warranty Type */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Warranty Type
                            </label>
                            <select
                              value={formik.values.warranty.type}
                              onChange={(e) => formik.setFieldValue("warranty.type", e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="Manufacturer Warranty">Manufacturer Warranty</option>
                              <option value="Seller Warranty">Seller Warranty</option>
                              <option value="Extended Warranty">Extended Warranty</option>
                              <option value="International Warranty">International Warranty</option>
                            </select>
                          </div>

                          {/* Warranty Period */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Warranty Period
                            </label>
                            <select
                              value={formik.values.warranty.period}
                              onChange={(e) => formik.setFieldValue("warranty.period", e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select Period</option>
                              <option value="3 Months">3 Months</option>
                              <option value="6 Months">6 Months</option>
                              <option value="1 Year">1 Year</option>
                              <option value="2 Years">2 Years</option>
                              <option value="3 Years">3 Years</option>
                              <option value="5 Years">5 Years</option>
                              <option value="Lifetime">Lifetime</option>
                            </select>
                          </div>

                          {/* Warranty Description */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Warranty Description
                            </label>
                            <textarea
                              rows={2}
                              value={formik.values.warranty.description}
                              onChange={(e) => formik.setFieldValue("warranty.description", e.target.value)}
                              placeholder="Describe what the warranty covers (e.g., parts, labor, etc.)"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Specification Section */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowSpecificationSection(!showSpecificationSection)}
                    className="flex items-center justify-between w-full p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition mb-3"
                  >
                    <span className="font-bold text-gray-900">Add Product Specifications</span>
                    {showSpecificationSection ? (
                      <IoIosArrowUp className="text-gray-500" />
                    ) : (
                      <IoIosArrowDown className="text-gray-500" />
                    )}
                  </button>

                  {showSpecificationSection && (
                    <div className="mt-2 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                      <h4 className="font-semibold text-gray-800 mb-6">Product Specifications</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Side - 6 Title Boxes */}
                        <div>
                          <label className="font-medium block mb-3 text-gray-700">Specification Titles</label>
                          <div className="space-y-4">
                            {[1, 2, 3, 4, 5, 6].map((index) => (
                              <div key={`spec-title-${index}`}>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                  Title {index}
                                </label>
                                <input
                                  type="text"
                                  value={formik.values.specifications[index - 1]?.title || ""}
                                  onChange={(e) => {
                                    const updatedSpecs = [...formik.values.specifications];
                                    if (!updatedSpecs[index - 1]) {
                                      updatedSpecs[index - 1] = { id: index, title: "", value: "" };
                                    }
                                    updatedSpecs[index - 1].title = e.target.value;
                                    formik.setFieldValue("specifications", updatedSpecs);
                                  }}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder={`Enter specification ${index}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right Side - 6 Value Boxes */}
                        <div>
                          <label className="font-medium block mb-3 text-gray-700">Specification Values</label>
                          <div className="space-y-4">
                            {[1, 2, 3, 4, 5, 6].map((index) => (
                              <div key={`spec-value-${index}`}>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                  Value {index}
                                </label>
                                <input
                                  type="text"
                                  value={formik.values.specifications[index - 1]?.value || ""}
                                  onChange={(e) => {
                                    const updatedSpecs = [...formik.values.specifications];
                                    if (!updatedSpecs[index - 1]) {
                                      updatedSpecs[index - 1] = { id: index, title: "", value: "" };
                                    }
                                    updatedSpecs[index - 1].value = e.target.value;
                                    formik.setFieldValue("specifications", updatedSpecs);
                                  }}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder={`Enter value ${index}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center bg-white rounded-xl shadow-lg p-6">
            <div className="space-x-3">
              {activeSection !== "product" && (
                <button
                  type="button"
                  onClick={() => {
                    const sectionsOrder = ["product", "pricing", "images", "additional"];
                    const currentIndex = sectionsOrder.indexOf(activeSection);
                    if (currentIndex > 0) {
                      setActiveSection(sectionsOrder[currentIndex - 1]);
                    }
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="space-x-3">
              {activeSection !== "additional" ? (
                <button
                  type="button"
                  onClick={() => {
                    const sectionsOrder = ["product", "pricing", "images", "additional"];
                    const currentIndex = sectionsOrder.indexOf(activeSection);
                    if (currentIndex < sectionsOrder.length - 1) {
                      setActiveSection(sectionsOrder[currentIndex + 1]);
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveSection("product")}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    View All Sections
                  </button>
                  <button
                    type="submit"
                    disabled={loading || imageProcessing}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {isEdit ? "Updating..." : "Submitting..."}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {isEdit ? "Update Product" : "Submit for Verification"}
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Verification Info Message */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
        </form>
      </div>
    </div>
  );
};

export default AddProducts;