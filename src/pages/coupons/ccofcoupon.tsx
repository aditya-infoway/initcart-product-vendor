// src/pages/CouponForm.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import ToggleSwitch from "../../components/common/ToggleSwitch";

/* ---------- Types ---------- */
interface Coupon {
  id?: number;
  type: "Percentage Discount" | "Flat Discount" | "Buy X Get Y Free" | "Free Shipping";
  title: string;
  code: string;
  customerType: "All" | number;
  limitPerUser: number;
  maxCount?: number;
  discountPercent?: number;
  discountAmount?: number;
  buyQty?: number;
  getQty?: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startDate: string;
  expireDate: string;
  applyOn: "All Products" | "Category" | "Product";
  categoryId?: number;
  productId?: number;
  displayMessage?: string;
  showToCustomer: boolean;
  status: "Active" | "Inactive";
}

/* ---------- Mock selects ---------- */
const mockCategories = [
  { id: 1, name: "Electronics" },
  { id: 2, name: "Clothing" },
  { id: 3, name: "Home & Garden" },
];
const mockProducts = [
  { id: 101, name: "iPhone 15" },
  { id: 102, name: "T-Shirt" },
  { id: 103, name: "Coffee Maker" },
];
const mockUsers = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
  { id: 3, name: "Bob Johnson" },
];

/* ---------- Helper ---------- */
const generateCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

/* ---------- Validation schema (dynamic) ---------- */
const getValidationSchema = (type: Coupon["type"]) => {
  const base = {
    type: Yup.string().required("Required"),
    title: Yup.string().required("Required"),
    code: Yup.string().required("Required"),
    customerType: Yup.mixed().required("Required"),
    limitPerUser: Yup.number().min(1).required("Required"),
    startDate: Yup.date().required("Required"),
    expireDate: Yup.date()
      .required("Required")
      .min(Yup.ref("startDate"), "Must be after start date"),
    showToCustomer: Yup.boolean(),
    displayMessage: Yup.string().optional(),
  };

  switch (type) {
    case "Percentage Discount":
      return Yup.object({
        ...base,
        discountPercent: Yup.number()
          .min(0.1, ">0")
          .max(100, "≤100")
          .required("Required"),
        minOrderValue: Yup.number().min(0).required("Required"),
        maxDiscount: Yup.number().min(0).optional(),
        applyOn: Yup.string()
          .oneOf(["All Products", "Category", "Product"])
          .required(),
      });
    case "Flat Discount":
      return Yup.object({
        ...base,
        discountAmount: Yup.number().min(0.1).required("Required"),
        minOrderValue: Yup.number().min(0).required("Required"),
        maxDiscount: Yup.number().min(0).optional(),
        applyOn: Yup.string()
          .oneOf(["All Products", "Category", "Product"])
          .required(),
      });
    case "Buy X Get Y Free":
      return Yup.object({
        ...base,
        buyQty: Yup.number().min(1).required("Required"),
        getQty: Yup.number().min(1).required("Required"),
      });
    case "Free Shipping":
      return Yup.object(base);
    default:
      return Yup.object(base);
  }
};

/* ---------- Main component ---------- */
const CouponForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const editingCoupon = location.state as Coupon | undefined; // passed from edit

  const isEdit = !!id && !!editingCoupon;

  const formik = useFormik({
    initialValues: {
      type: editingCoupon?.type ?? "Percentage Discount",
      title: editingCoupon?.title ?? "",
      code: editingCoupon?.code ?? "",
      customerType: editingCoupon?.customerType ?? "All",
      limitPerUser: editingCoupon?.limitPerUser ?? 1,
      maxCount: editingCoupon?.maxCount ?? undefined,
      discountPercent: editingCoupon?.discountPercent ?? undefined,
      discountAmount: editingCoupon?.discountAmount ?? undefined,
      buyQty: editingCoupon?.buyQty ?? undefined,
      getQty: editingCoupon?.getQty ?? undefined,
      minOrderValue: editingCoupon?.minOrderValue ?? undefined,
      maxDiscount: editingCoupon?.maxDiscount ?? undefined,
      startDate: editingCoupon?.startDate ?? "",
      expireDate: editingCoupon?.expireDate ?? "",
      applyOn: editingCoupon?.applyOn ?? "All Products",
      categoryId: editingCoupon?.categoryId ?? undefined,
      productId: editingCoupon?.productId ?? undefined,
      displayMessage: editingCoupon?.displayMessage ?? "",
      showToCustomer: editingCoupon?.showToCustomer ?? true,
      status: editingCoupon?.status === "Active" ,
    },
    enableReinitialize: true,
    validationSchema: () => getValidationSchema(formik.values.type as Coupon["type"]),
    onSubmit: (values) => {
      // In a real app you would POST/PUT to an API here.
      // For demo we just show a toast and go back.
      Swal.fire({
        icon: "success",
        title: isEdit ? "Updated!" : "Created!",
        text: `"${values.title}" ${isEdit ? "updated" : "added"} successfully.`,
        timer: 2000,
        showConfirmButton: false,
      }).then(() => navigate("/coupons"));
    },
  });

  /* Reset dependent fields when type changes */
  useEffect(() => {
    formik.setValues({
      ...formik.values,
      discountPercent: undefined,
      discountAmount: undefined,
      buyQty: undefined,
      getQty: undefined,
      minOrderValue: undefined,
      maxDiscount: undefined,
      applyOn: "All Products",
      categoryId: undefined,
      productId: undefined,
    });
  }, [formik.values.type]);

  /* ---------- Conditional field renderers ---------- */
  const renderDiscountFields = () => {
    const { type } = formik.values;
    if (type === "Percentage Discount") {
      return (
        <>
          <div className="mb-3">
            <label className="block mb-1 font-medium">Discount Percent</label>
            <input
              type="number"
              name="discountPercent"
              value={formik.values.discountPercent ?? ""}
              onChange={formik.handleChange}
              placeholder="15"
              className={`w-full rounded border px-3 py-2 ${formik.touched.discountPercent && formik.errors.discountPercent ? "border-red-500" : "border-gray-300"}`}
            />
            {formik.touched.discountPercent && formik.errors.discountPercent && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.discountPercent}</p>
            )}
          </div>

          <div className="mb-3">
            <label className="block mb-1 font-medium">Minimum Order Value</label>
            <input
              type="number"
              name="minOrderValue"
              value={formik.values.minOrderValue ?? ""}
              onChange={formik.handleChange}
              placeholder="100"
              className={`w-full rounded border px-3 py-2 ${formik.touched.minOrderValue && formik.errors.minOrderValue ? "border-red-500" : "border-gray-300"}`}
            />
            {formik.touched.minOrderValue && formik.errors.minOrderValue && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.minOrderValue}</p>
            )}
          </div>

          <div className="mb-3">
            <label className="block mb-1 font-medium">Maximum Discount (optional)</label>
            <input
              type="number"
              name="maxDiscount"
              value={formik.values.maxDiscount ?? ""}
              onChange={formik.handleChange}
              placeholder="50"
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </>
      );
    }

    if (type === "Flat Discount") {
      return (
        <>
          <div className="mb-3">
            <label className="block mb-1 font-medium">Discount Amount</label>
            <input
              type="number"
              name="discountAmount"
              value={formik.values.discountAmount ?? ""}
              onChange={formik.handleChange}
              placeholder="20"
              className={`w-full rounded border px-3 py-2 ${formik.touched.discountAmount && formik.errors.discountAmount ? "border-red-500" : "border-gray-300"}`}
            />
            {formik.touched.discountAmount && formik.errors.discountAmount && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.discountAmount}</p>
            )}
          </div>

          <div className="mb-3">
            <label className="block mb-1 font-medium">Minimum Order Value</label>
            <input
              type="number"
              name="minOrderValue"
              value={formik.values.minOrderValue ?? ""}
              onChange={formik.handleChange}
              placeholder="100"
              className={`w-full rounded border px-3 py-2 ${formik.touched.minOrderValue && formik.errors.minOrderValue ? "border-red-500" : "border-gray-300"}`}
            />
            {formik.touched.minOrderValue && formik.errors.minOrderValue && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.minOrderValue}</p>
            )}
          </div>

          <div className="mb-3">
            <label className="block mb-1 font-medium">Maximum Discount (optional)</label>
            <input
              type="number"
              name="maxDiscount"
              value={formik.values.maxDiscount ?? ""}
              onChange={formik.handleChange}
              placeholder="30"
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </>
      );
    }

    if (type === "Buy X Get Y Free") {
      return (
        <>
          <div className="mb-3">
            <label className="block mb-1 font-medium">Buy Qty</label>
            <input
              type="number"
              name="buyQty"
              value={formik.values.buyQty ?? ""}
              onChange={formik.handleChange}
              placeholder="2"
              className={`w-full rounded border px-3 py-2 ${formik.touched.buyQty && formik.errors.buyQty ? "border-red-500" : "border-gray-300"}`}
            />
            {formik.touched.buyQty && formik.errors.buyQty && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.buyQty}</p>
            )}
          </div>

          <div className="mb-3">
            <label className="block mb-1 font-medium">Get Free Qty</label>
            <input
              type="number"
              name="getQty"
              value={formik.values.getQty ?? ""}
              onChange={formik.handleChange}
              placeholder="1"
              className={`w-full rounded border px-3 py-2 ${formik.touched.getQty && formik.errors.getQty ? "border-red-500" : "border-gray-300"}`}
            />
            {formik.touched.getQty && formik.errors.getQty && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.getQty}</p>
            )}
          </div>
        </>
      );
    }

    return null; // Free Shipping
  };

  const renderApplyOn = () => {
    const { type, applyOn } = formik.values;
    if (!["Percentage Discount", "Flat Discount"].includes(type)) return null;

    return (
      <>
        <div className="mb-3">
          <label className="block mb-1 font-medium">Apply coupon on</label>
          <select
            name="applyOn"
            value={applyOn}
            onChange={formik.handleChange}
            className={`w-full rounded border px-3 py-2 ${formik.touched.applyOn && formik.errors.applyOn ? "border-red-500" : "border-gray-300"}`}
          >
            <option value="All Products">All Products</option>
            <option value="Category">Specific Category</option>
            <option value="Product">Specific Product</option>
          </select>
          {formik.touched.applyOn && formik.errors.applyOn && (
            <p className="text-red-500 text-xs mt-1">{formik.errors.applyOn}</p>
          )}
        </div>

        {applyOn === "Category" && (
          <div className="mb-3">
            <label className="block mb-1 font-medium">Select Category</label>
            <select
              name="categoryId"
              value={formik.values.categoryId ?? ""}
              onChange={formik.handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="">-- Choose --</option>
              {mockCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {applyOn === "Product" && (
          <div className="mb-3">
            <label className="block mb-1 font-medium">Select Product</label>
            <select
              name="productId"
              value={formik.values.productId ?? ""}
              onChange={formik.handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="">-- Choose --</option>
              {mockProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </>
    );
  };

  /* ---------- UI ---------- */
  return (
    <div className="">
      <div className=" mx-auto bg-white rounded-lg shadow-lg p-8 relative">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{isEdit ? "Edit Coupon" : "Add Coupon"}</h1>
          <button
            onClick={() => navigate("/coupons")}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            Back
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* ---------- Type ---------- */}
          <div>
            <label className="block mb-1 font-medium">Type</label>
            <select
              name="type"
              value={formik.values.type}
              onChange={formik.handleChange}
              className={`w-full rounded border px-3 py-2 ${formik.touched.type && formik.errors.type ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="Percentage Discount">Percentage Discount</option>
              <option value="Flat Discount">Flat Discount</option>
              <option value="Buy X Get Y Free">Buy X Get Y Free</option>
              <option value="Free Shipping">Free Shipping</option>
            </select>
            {formik.touched.type && formik.errors.type && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.type}</p>
            )}
          </div>

          {/* ---------- Title ---------- */}
          <div>
            <label className="block mb-1 font-medium">Coupon Title</label>
            <input
              type="text"
              name="title"
              value={formik.values.title}
              onChange={formik.handleChange}
              placeholder="Summer Sale"
              className={`w-full rounded border px-3 py-2 ${formik.touched.title && formik.errors.title ? "border-red-500" : "border-gray-300"}`}
            />
            {formik.touched.title && formik.errors.title && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.title}</p>
            )}
          </div>

          {/* ---------- Code + Generate ---------- */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-medium">Coupon Code</label>
              <button
                type="button"
                onClick={() => formik.setFieldValue("code", generateCode())}
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
              className={`w-full rounded border px-3 py-2 ${formik.touched.code && formik.errors.code ? "border-red-500" : "border-gray-300"}`}
            />
            {formik.touched.code && formik.errors.code && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.code}</p>
            )}
          </div>

          {/* ---------- Customer ---------- */}
          <div>
            <label className="block mb-1 font-medium">Customer</label>
            <select
              name="customerType"
              value={formik.values.customerType}
              onChange={formik.handleChange}
              className={`w-full rounded border px-3 py-2 ${formik.touched.customerType && formik.errors.customerType ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="All">All Customers</option>
              {mockUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            {formik.touched.customerType && formik.errors.customerType && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.customerType}</p>
            )}
          </div>

          {/* ---------- Limit Per Customer ---------- */}
          <div>
            <label className="block mb-1 font-medium">Usage Limit Per Customer</label>
            <input
              type="number"
              name="limitPerUser"
              value={formik.values.limitPerUser}
              onChange={formik.handleChange}
              placeholder="1"
              className={`w-full rounded border px-3 py-2 ${formik.touched.limitPerUser && formik.errors.limitPerUser ? "border-red-500" : "border-gray-300"}`}
            />
            {formik.touched.limitPerUser && formik.errors.limitPerUser && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.limitPerUser}</p>
            )}
          </div>

          {/* ---------- Max Count (global) ---------- */}
          <div>
            <label className="block mb-1 font-medium">Max Count of Coupon Usage (optional)</label>
            <input
              type="number"
              name="maxCount"
              value={formik.values.maxCount ?? ""}
              onChange={formik.handleChange}
              placeholder="Unlimited"
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>

          {/* ---------- Conditional Discount fields ---------- */}
          {renderDiscountFields()}

          {/* ---------- Apply On (only for discount types) ---------- */}
          {renderApplyOn()}

          {/* ---------- Dates ---------- */}
          <div>
            <label className="block mb-1 font-medium">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formik.values.startDate}
              onChange={formik.handleChange}
              className={`w-full rounded border px-3 py-2 ${formik.touched.startDate && formik.errors.startDate ? "border-red-500" : "border-gray-300"}`}
            />
            {formik.touched.startDate && formik.errors.startDate && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.startDate}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">End Date</label>
            <input
              type="date"
              name="expireDate"
              min={formik.values.startDate}
              value={formik.values.expireDate}
              onChange={formik.handleChange}
              className={`w-full rounded border px-3 py-2 ${formik.touched.expireDate && formik.errors.expireDate ? "border-red-500" : "border-gray-300"}`}
            />
            {formik.touched.expireDate && formik.errors.expireDate && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.expireDate}</p>
            )}
          </div>

          {/* ---------- Display Message ---------- */}
          <div>
            <label className="block mb-1 font-medium">Display Message (optional)</label>
            <input
              type="text"
              name="displayMessage"
              value={formik.values.displayMessage ?? ""}
              onChange={formik.handleChange}
              placeholder="Get 20% off!"
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>

          {/* ---------- Show to Customer ---------- */}
          <div>
            <label className="block mb-1 font-medium">Show coupon to customer</label>
            <select
              name="showToCustomer"
              value={formik.values.showToCustomer ? "Yes" : "No"}
              onChange={(e) => formik.setFieldValue("showToCustomer", e.target.value === "Yes")}
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* ---------- Status ---------- */}
          <div className="flex items-center gap-3">
            <label className="font-medium">Status</label>
            <ToggleSwitch
              checked={formik.values.status}
              onChange={(v) => formik.setFieldValue("status", v)}
            />
            <span>{formik.values.status ? "Active" : "Inactive"}</span>
          </div>

          {/* ---------- Submit / Cancel ---------- */}
          <div className="col-span-full flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => navigate("/coupons")}
              className="px-6 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              {isEdit ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CouponForm;