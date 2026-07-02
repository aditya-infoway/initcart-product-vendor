import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import ToggleSwitch from "../../components/common/ToggleSwitch";
import MultiSelect from "../../components/common/Multiselect";
import axiosInstance from "../../utils/axiosInstance";

/* ---------- Types ---------- */
interface CouponFormData {
  coupon_type: "percentage" | "flat";
  title: string;
  code: string;
  limit_per_user: number;
  max_count?: number | null;
  discount_percent?: number | null;
  discount_amount?: number | null;
  min_order_value: number;
  max_discount?: number | null;
  start_date: string;
  expire_date: string;
  apply_on: "all_products" | "category" | "product";
  categories?: number[];
  subcategories?: number[];
  subsubcategories?: number[];
  products?: number[];
  display_message?: string;
  status: boolean;
}

interface CategoryType {
  id: number;
  name: string;
}

interface SubCategoryType {
  id: number;
  name: string;
}

interface SubSubCategoryType {
  id: number;
  name: string;
}

interface ProductType {
  id: number;
  product_name: string;
  sku: string;
  has_active_coupon?: boolean;
}


/* ---------- Validation schema ---------- */
const getValidationSchema = (
  couponType: "percentage" | "flat",
  products: ProductType[],
  editingProductIds: number[] = []
) => {
  const baseSchema = {
    coupon_type: Yup.string().required("Required"),
    title: Yup.string().required("Required"),
    code: Yup.string().required("Required"),
    limit_per_user: Yup.number().min(1).required("Required"),
    max_count: Yup.number().min(0).nullable(),
    min_order_value: Yup.number().min(0).required("Required"),
    start_date: Yup.date().required("Required"),
    expire_date: Yup.date()
      .required("Required")
      .min(Yup.ref("start_date"), "Must be after start date"),
    apply_on: Yup.string()
      .oneOf(["all_products", "category", "product"])
      .required("Required"),
    display_message: Yup.string().nullable(),
    status: Yup.boolean().required(),
  };

  const conditionalValidation = {
    categories: Yup.array().when("apply_on", {
      is: "category",
      then: (schema) =>
        schema
          .min(1, "Select at least one category")
          .test(
            "no-duplicate-category-coupon",
            "One or more categories already have an active coupon",
            function (value) {
              if (!value || !products) return true;
              return true; // 👈 frontend me optional, backend me strict
            }
          )
          .required("Required"),
      otherwise: (schema) => schema.notRequired(),
    }),

    subcategories: Yup.array().when("apply_on", {
      is: "category",
      then: (schema) => schema.notRequired(),
      otherwise: (schema) => schema.notRequired(),
    }),
    subsubcategories: Yup.array().when("apply_on", {
      is: "category",
      then: (schema) => schema.notRequired(),
      otherwise: (schema) => schema.notRequired(),
    }),
    products: Yup.array().when("apply_on", {
      is: "product",
      then: (schema) =>
        schema
          .min(1, "Select at least one product")
          .test(
            "no-duplicate-coupon",
            "One or more selected products already have an active coupon",
            function (value) {
              if (!value || !products) return true;

              const invalid = value.some((id) => {
                // 👇 Edit case: current coupon ke product allow
                if (editingProductIds.includes(id)) return false;

                const p = products.find((x) => x.id === id);
                return p?.has_active_coupon;
              });

              return !invalid;
            }
          )

          .required("Required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  };

  if (couponType === "percentage") {
    return Yup.object({
      ...baseSchema,
      ...conditionalValidation,
      discount_percent: Yup.number()
        .min(0.1, "Must be greater than 0")
        .max(100, "Cannot exceed 100")
        .required("Discount percentage is required"),
      discount_amount: Yup.number().nullable(),
      max_discount: Yup.number().min(0).nullable(),
    });
  } else {
    return Yup.object({
      ...baseSchema,
      ...conditionalValidation,
      discount_amount: Yup.number()
        .min(0.1, "Must be greater than 0")
        .required("Discount amount is required"),
      discount_percent: Yup.number().nullable(),
      max_discount: Yup.number().nullable(),
    });
  }
};

/* ---------- Main component ---------- */
const CouponForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const [editingCoupon, setEditingCoupon] = useState<any>(null);

  const isEdit = !!id && !!editingCoupon;
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategoryType[]>([]);
  const [subsubcategories, setSubsubcategories] = useState<SubSubCategoryType[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Format date for input field
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const parseMultipleSelections = (couponData: any) => {
    if (!couponData) return { categories: [], subcategories: [], subsubcategories: [], products: [] };

    console.log("🔍 Parsing coupon data for selections:", couponData);

    // Method 1: Check if categories is array of objects [{value, label}]
    let categories: number[] = [];
    if (couponData.categories && Array.isArray(couponData.categories)) {
      categories = couponData.categories.map((c: any) => {
        if (typeof c === 'object' && c !== null) {
          return c.value !== undefined ? c.value : c.id;
        }
        return c; // If it's already a number
      });
    }

    // Method 2: Check multiple_selections field
    if (categories.length === 0 &&
      couponData.multiple_selections &&
      couponData.multiple_selections.multiple_categories) {
      categories = couponData.multiple_selections.multiple_categories;
    }

    // Same for other fields
    let subcategories: number[] = [];
    if (couponData.subcategories && Array.isArray(couponData.subcategories)) {
      subcategories = couponData.subcategories.map((s: any) => {
        if (typeof s === 'object' && s !== null) {
          return s.value !== undefined ? s.value : s.id;
        }
        return s;
      });
    }

    let subsubcategories: number[] = [];
    if (couponData.subsubcategories && Array.isArray(couponData.subsubcategories)) {
      subsubcategories = couponData.subsubcategories.map((ss: any) => {
        if (typeof ss === 'object' && ss !== null) {
          return ss.value !== undefined ? ss.value : ss.id;
        }
        return ss;
      });
    }

    let products: number[] = [];
    if (couponData.products && Array.isArray(couponData.products)) {
      products = couponData.products.map((p: any) => {
        if (typeof p === 'object' && p !== null) {
          return p.value !== undefined ? p.value : p.id;
        }
        return p;
      });
    }

    return {
      categories,
      subcategories,
      subsubcategories,
      products
    };
  };
  const validateForm = (values: CouponFormData) => {
    try {
      getValidationSchema(
        values.coupon_type,
        products,
        isEdit ? parseMultipleSelections(editingCoupon).products : []
      ).validateSync(values, { abortEarly: false });

      return {};
    } catch (err: any) {
      const errors: Record<string, string> = {};
      if (err.inner) {
        err.inner.forEach((e: any) => {
          if (e.path) errors[e.path] = e.message;
        });
      }
      return errors;
    }
  };
  const formik = useFormik<CouponFormData>({
    enableReinitialize: true,

    initialValues: {
      coupon_type: editingCoupon?.coupon_type || "percentage",
      title: editingCoupon?.title || "",
      code: editingCoupon?.code || "",
      limit_per_user: editingCoupon?.limit_per_user || 1,
      max_count: editingCoupon?.max_count || null,
      discount_percent: editingCoupon?.discount_percent || null,
      discount_amount: editingCoupon?.discount_amount || null,
      min_order_value: editingCoupon?.min_order_value || 0,
      max_discount: editingCoupon?.max_discount || null,
      start_date: editingCoupon?.start_date ? formatDateForInput(editingCoupon.start_date) : "",
      expire_date: editingCoupon?.expire_date ? formatDateForInput(editingCoupon.expire_date) : "",
      apply_on: editingCoupon?.apply_on || "all_products",
      categories: parseMultipleSelections(editingCoupon).categories,
      subcategories: parseMultipleSelections(editingCoupon).subcategories,
      subsubcategories: parseMultipleSelections(editingCoupon).subsubcategories,
      products: parseMultipleSelections(editingCoupon).products,
      display_message: editingCoupon?.display_message || "",
      status: editingCoupon ? editingCoupon.status === "active" : true,

    },

    validate: validateForm,

    onSubmit: async (values) => {
      console.log("🔥 onSubmit CALLED", values);
      try {
        setLoading(true);

        console.log("🚀 Starting coupon submission...");
        console.log("Form values:", values);

        // Prepare data for API - SIMPLE AND CLEAN
        const formattedData: any = {
          coupon_type: values.coupon_type,
          title: values.title,
          code: values.code.toUpperCase(),
          limit_per_user: values.limit_per_user,
          min_order_value: values.min_order_value || 0,
          start_date: values.start_date ? `${values.start_date}T00:00:00Z` : null,
          expire_date: values.expire_date ? `${values.expire_date}T23:59:59Z` : null,
          apply_on: values.apply_on,
          status: values.status ? "active" : "inactive",
          display_message: values.display_message || null,
        };

        // Add optional fields
        if (values.max_count !== null && values.max_count !== undefined && values.max_count > 0) {
          formattedData.max_count = values.max_count;
        }

        if (values.max_discount !== null && values.max_discount !== undefined && values.max_discount > 0) {
          formattedData.max_discount = values.max_discount;
        }

        // Add discount fields based on type
        if (values.coupon_type === "percentage") {
          formattedData.discount_percent = values.discount_percent;
          formattedData.discount_amount = null;
        } else {
          formattedData.discount_amount = values.discount_amount;
          formattedData.discount_percent = null;
        }

        // Handle M2M fields
        if (values.apply_on === "category") {
          formattedData.categories = values.categories || [];
          formattedData.subcategories = values.subcategories || [];
          formattedData.subsubcategories = values.subsubcategories || [];
          formattedData.products = []; // Empty for category coupons
        }
        else if (values.apply_on === "product") {
          formattedData.products = values.products || [];
          formattedData.categories = [];
          formattedData.subcategories = [];
          formattedData.subsubcategories = [];
        }
        else {
          // For all_products, send empty arrays
          formattedData.categories = [];
          formattedData.subcategories = [];
          formattedData.subsubcategories = [];
          formattedData.products = [];
        }

        console.log("📦 Final API payload:", JSON.stringify(formattedData, null, 2));

        let response;
        const url = isEdit ? `vendor/coupons/${id}/` : "vendor/coupons/";
        const method = isEdit ? "PUT" : "POST";

        console.log(`Making ${method} request to: ${url}`);

        if (isEdit) {
          response = await axiosInstance.put(url, formattedData);
        } else {
          response = await axiosInstance.post(url, formattedData);
        }

        console.log("✅ API Response:", response.data);

        Swal.fire({
          icon: "success",
          title: isEdit ? "Updated!" : "Created!",
          text: `Coupon "${response.data.title}" ${isEdit ? "updated" : "created"} successfully.`,
          timer: 2000,
          showConfirmButton: false,
        }).then(() => navigate("/coupons"));
      } catch (error: any) {
        console.error("❌ Coupon save error:", error);

        let errorMessage = "Something went wrong!";
        let errorDetails = "";

        if (error.response?.data) {
          console.error("Error response data:", error.response.data);

          if (typeof error.response.data === 'object') {
            const errors: string[] = [];
            Object.entries(error.response.data).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                errors.push(`<strong>${key}:</strong> ${value.join(', ')}`);
              } else if (typeof value === 'string') {
                errors.push(`<strong>${key}:</strong> ${value}`);
              }
            });
            errorMessage = "Validation Error";
            errorDetails = errors.join('<br>');
          } else {
            errorMessage = error.response.data;
          }
        }

        Swal.fire({
          icon: "error",
          title: errorMessage,
          html: errorDetails ? `<div style="text-align: left;">${errorDetails}</div>` : errorMessage,
          confirmButtonText: "OK",
          width: 600
        });
      } finally {
        setLoading(false);
      }
    },
  });



  useEffect(() => {
    const fetchCoupon = async () => {
      if (!id) return;

      try {
        setLoadingData(true);
        const res = await axiosInstance.get(`vendor/coupons/${id}/`);
        setEditingCoupon(res.data);
      } catch (err) {
        console.error("Coupon fetch failed", err);
        Swal.fire("Error", "Coupon can't load ", "error");
        navigate("/coupons");
      } finally {
        setLoadingData(false);
      }
    };

    fetchCoupon();
  }, [id]);

  // Load vendor-specific data
  useEffect(() => {
    const loadVendorData = async () => {
      try {
        setLoadingData(true);
        console.log("📥 Loading vendor data...");

        try {
          const response = await axiosInstance.get("vendor/coupon-data/");

          if (response.data && response.data.success) {
            console.log(`✅ Data loaded successfully`);
            console.log(`Categories: ${response.data.categories?.length || 0}`);
            console.log(`Products: ${response.data.products?.length || 0}`);

            setCategories(response.data.categories || []);
            setSubcategories(response.data.subcategories || []);
            setSubsubcategories(response.data.subsubcategories || []);
            setProducts(response.data.products || []);
          }
        } catch (err: any) {
          console.warn(`Coupon data endpoint failed:`, err.message);
          // Continue with empty data
        }

      } catch (error: any) {
        console.error("Error loading vendor data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadVendorData();
  }, []);

  /* Generate coupon code */
  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "CPN";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    formik.setFieldValue("code", code.toUpperCase());
  };
  const isEditReady =
  !!editingCoupon &&
  (
    editingCoupon.apply_on !== "category" ||
    categories.length > 0
  ) &&
  (
    editingCoupon.apply_on !== "product" ||
    products.length > 0
  );

  useEffect(() => {
    if (!isEditReady) return;

    const parsed = parseMultipleSelections(editingCoupon);

    console.log("🧠 FINAL PREFILL", parsed);

    formik.setValues({
      coupon_type: editingCoupon.coupon_type,
      title: editingCoupon.title,
      code: editingCoupon.code,
      limit_per_user: editingCoupon.limit_per_user,
      max_count: editingCoupon.max_count,
      discount_percent: editingCoupon.discount_percent,
      discount_amount: editingCoupon.discount_amount,
      min_order_value: editingCoupon.min_order_value,
      max_discount: editingCoupon.max_discount,
      start_date: editingCoupon.start_date
        ? formatDateForInput(editingCoupon.start_date)
        : "",
      expire_date: editingCoupon.expire_date
        ? formatDateForInput(editingCoupon.expire_date)
        : "",
      apply_on: editingCoupon.apply_on,

      categories: parsed.categories,
      subcategories: parsed.subcategories,
      subsubcategories: parsed.subsubcategories,
      products: parsed.products,

      display_message: editingCoupon.display_message || "",
      status: editingCoupon.status === "active",
    });

  }, [isEditReady]);

useEffect(() => {
  if (isEdit) return; // EDIT MODE SAFE

  if (formik.values.apply_on === "all_products") {
    formik.setFieldValue("categories", []);
    formik.setFieldValue("subcategories", []);
    formik.setFieldValue("subsubcategories", []);
    formik.setFieldValue("products", []);
  }

  if (formik.values.apply_on === "category") {
    formik.setFieldValue("products", []);
  }

  if (formik.values.apply_on === "product") {
    formik.setFieldValue("categories", []);
    formik.setFieldValue("subcategories", []);
    formik.setFieldValue("subsubcategories", []);
  }
}, [formik.values.apply_on]);


  return (
    <div className="p-6">
      <div className="mx-auto bg-white rounded-lg shadow-lg p-8 relative">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{isEdit ? "Edit Coupon" : "Add Coupon"}</h1>
          <button
            type="button"
            onClick={() => navigate("/coupons")}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {loadingData ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading data...</p>
          </div>
        ) : (
          <form onSubmit={formik.handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Basic Fields */}
            <div>
              <label className="block mb-1 font-medium">Type *</label>
              <select
                name="coupon_type"
                value={formik.values.coupon_type}
                onChange={formik.handleChange}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value="percentage">Percentage Discount</option>
                <option value="flat">Flat Discount</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Coupon Title *</label>
              <input
                type="text"
                name="title"
                value={formik.values.title}
                onChange={formik.handleChange}
                placeholder="Summer Sale"
                className={`w-full rounded border px-3 py-2 ${formik.touched.title && formik.errors.title ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {formik.touched.title && formik.errors.title && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.title}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium">Coupon Code *</label>
                <button
                  type="button"
                  onClick={generateCode}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Generate Code
                </button>
              </div>
              <input
                type="text"
                name="code"
                value={formik.values.code}
                onChange={formik.handleChange}
                placeholder="SUMMER25"
                className={`w-full rounded border px-3 py-2 ${formik.touched.code && formik.errors.code ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {formik.touched.code && formik.errors.code && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.code}</p>
              )}
            </div>

            {/* Apply On */}
            <div>
              <label className="block mb-1 font-medium">Apply On *</label>
              <select
                name="apply_on"
                value={formik.values.apply_on}
                onChange={formik.handleChange}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value="all_products">All Products</option>
                <option value="category">Specific Category</option>
                <option value="product">Specific Product</option>
              </select>
            </div>

            {/* Discount Fields */}
            {formik.values.coupon_type === "percentage" ? (
              <>
                <div>
                  <label className="block mb-1 font-medium">Discount Percent (%) *</label>
                  <input
                    type="number"
                    name="discount_percent"
                    value={formik.values.discount_percent || ""}
                    onChange={formik.handleChange}
                    step="0.01"
                    min="0.01"
                    max="100"
                    className={`w-full rounded border px-3 py-2 ${formik.touched.discount_percent && formik.errors.discount_percent
                      ? "border-red-500"
                      : "border-gray-300"
                      }`}
                  />
                  {formik.touched.discount_percent && formik.errors.discount_percent && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.discount_percent}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 font-medium">Maximum Discount (₹) (optional)</label>
                  <input
                    type="number"
                    name="max_discount"
                    value={formik.values.max_discount || ""}
                    onChange={formik.handleChange}
                    step="0.01"
                    min="0"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    placeholder="No limit"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block mb-1 font-medium">Discount Amount (₹) *</label>
                <input
                  type="number"
                  name="discount_amount"
                  value={formik.values.discount_amount || ""}
                  onChange={formik.handleChange}
                  step="0.01"
                  min="0.01"
                  className={`w-full rounded border px-3 py-2 ${formik.touched.discount_amount && formik.errors.discount_amount
                    ? "border-red-500"
                    : "border-gray-300"
                    }`}
                />
                {formik.touched.discount_amount && formik.errors.discount_amount && (
                  <p className="text-red-500 text-xs mt-1">{formik.errors.discount_amount}</p>
                )}
              </div>
            )}

            {/* Category Selection */}
            {formik.values.apply_on === "category" && (
              <>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block mb-1 font-medium">
                    Select Categories (Multiple) *
                    {formik.touched.categories && formik.errors.categories && (
                      <span className="text-red-500 ml-2">({formik.errors.categories})</span>
                    )}
                  </label>
                  <MultiSelect
                    key={`categories-${formik.values.categories?.join(",")}`}
                    options={categories.map(cat => ({
                      value: cat.id,
                      label: cat.name
                    }))}
                    selectedValues={formik.values.categories || []}
                    onChange={(selected) => {
                      formik.setFieldValue('categories', selected);
                      formik.setFieldTouched('categories', true);
                    }}
                    placeholder="Select categories..."
                  />
                </div>

                {(formik.values.categories && formik.values.categories.length > 0) && (
                  <>
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block mb-1 font-medium">
                        Select Subcategories (Optional, Multiple)
                      </label>
                      <MultiSelect
                        key={`subcategories-${formik.values.categories?.join(",")}`}
                        options={subcategories.map(sub => ({
                          value: sub.id,
                          label: sub.name
                        }))}
                        selectedValues={formik.values.subcategories || []}
                        onChange={(selected) => {
                          formik.setFieldValue('subcategories', selected);
                        }}
                        placeholder="Select subcategories..."
                      />
                    </div>

                    {(formik.values.subcategories && formik.values.subcategories.length > 0) && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block mb-1 font-medium">
                          Select Sub-Subcategories (Optional, Multiple)
                        </label>
                        <MultiSelect
                          key={`subsubcategories-${formik.values.subsubcategories?.join(",")}`}
                          options={subsubcategories.map(ss => ({
                            value: ss.id,
                            label: ss.name
                          }))}
                          selectedValues={formik.values.subsubcategories || []}
                          onChange={(selected) => {
                            formik.setFieldValue('subsubcategories', selected);
                          }}
                          placeholder="Select sub-subcategories..."
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Product Selection */}
            {formik.values.apply_on === "product" && (
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block mb-1 font-medium">
                  Select Products (Multiple) *
                  {formik.touched.products && formik.errors.products && (
                    <span className="text-red-500 ml-2">({formik.errors.products})</span>
                  )}
                </label>
                <MultiSelect
                  key={`products-${formik.values.products?.join(",")}`}
                  options={products.map(prod => ({
                    value: prod.id,
                    label: prod.has_active_coupon
                      ? `${prod.product_name} (${prod.sku}) — Coupon Applied`
                      : `${prod.product_name} (${prod.sku})`,
                    disabled: prod.has_active_coupon && !formik.values.products?.includes(prod.id),
                  }))}

                  selectedValues={formik.values.products || []}
                  onChange={(selected) => {
                    formik.setFieldValue('products', selected);
                    formik.setFieldTouched('products', true);
                  }}
                  placeholder="Select products..."
                />
              </div>
            )}

            {/* Other Fields */}
            <div>
              <label className="block mb-1 font-medium">
                Min Order Value (₹) *
              </label>

              <input
                type="number"
                name="min_order_value"
                value={formik.values.min_order_value}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                min="0"
                step="0.01"
                placeholder="0"
                className={`w-full rounded border px-3 py-2 ${formik.touched.min_order_value && formik.errors.min_order_value
                  ? "border-red-500"
                  : "border-gray-300"
                  }`}
              />

              {formik.touched.min_order_value && formik.errors.min_order_value && (
                <p className="text-red-500 text-xs mt-1">
                  {formik.errors.min_order_value}
                </p>
              )}
            </div>


            <div>
              <label className="block mb-1 font-medium">Usage Limit Per Customer *</label>
              <input
                type="number"
                name="limit_per_user"
                value={formik.values.limit_per_user}
                onChange={formik.handleChange}
                min="1"
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Max Total Usage (optional)</label>
              <input
                type="number"
                name="max_count"
                value={formik.values.max_count || ""}
                onChange={formik.handleChange}
                min="0"
                placeholder="Unlimited"
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Start Date *</label>
              <input
                type="date"
                name="start_date"
                value={formik.values.start_date}
                onChange={formik.handleChange}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Expiry Date *</label>
              <input
                type="date"
                name="expire_date"
                value={formik.values.expire_date}
                onChange={formik.handleChange}
                min={formik.values.start_date}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Display Message */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block mb-1 font-medium">Display Message (optional)</label>
              <textarea
                name="display_message"
                value={formik.values.display_message || ""}
                onChange={formik.handleChange}
                rows={2}
                placeholder="Get amazing discount with this coupon!"
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <label className="font-medium">Status</label>
              <ToggleSwitch
                checked={formik.values.status}
                onChange={(v) => formik.setFieldValue("status", v)}
              />
              <span className={formik.values.status ? "text-green-700" : "text-red-700"}>
                {formik.values.status ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Submit Buttons */}
            <div className="col-span-full flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => navigate("/coupons")}
                className="px-6 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEdit ? "Updating..." : "Creating..."}
                  </span>
                ) : (
                  isEdit ? "Update" : "Create"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CouponForm;