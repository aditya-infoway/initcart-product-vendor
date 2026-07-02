// import { useState } from "react";
// import DataTable from "../../components/common/DataTable";
// import ToggleSwitch from "../../components/common/ToggleSwitch";
// import { useFormik } from "formik";
// import Swal from "sweetalert2";
// import * as Yup from "yup";

// interface Coupon {
//   id: number;
//   type: "Discount" | "FreeDelivery";
//   title: string;
//   code: string;
//   customerType: "All" | number;
//   limitPerUser: number;
//   discountType: "Amount" | "Percentage";
//   discountAmount: number;
//   minimumPurchase: number;
//   startDate: string;
//   expireDate: string;
//   status: "Active" | "Inactive";
// }

// const Coupons = () => {
//   const [coupons, setCoupons] = useState<Coupon[]>([
//     {
//       id: 1,
//       type: "Discount",
//       title: "Summer Sale",
//       code: "SUMMER25",
//       customerType: "All",
//       limitPerUser: 1,
//       discountType: "Percentage",
//       discountAmount: 25,
//       minimumPurchase: 100,
//       startDate: "2025-06-01",
//       expireDate: "2025-08-31",
//       status: "Active",
//     },
//     {
//       id: 2,
//       type: "FreeDelivery",
//       title: "Free Shipping",
//       code: "FREESHIP",
//       customerType: "All",
//       limitPerUser: 2,
//       discountType: "Amount",
//       discountAmount: 0,
//       minimumPurchase: 50,
//       startDate: "2025-01-01",
//       expireDate: "2025-12-31",
//       status: "Active",
//     },
//   ]);

//   const [modalOpen, setModalOpen] = useState<boolean>(false);
//   const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);

//   // Mock user list for dropdown
//   const users = [
//     { id: 1, name: "John Doe" },
//     { id: 2, name: "Jane Smith" },
//     { id: 3, name: "Bob Johnson" },
//   ];

//   const generateCouponCode = () => {
//     const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//     let code = "";
//     for (let i = 0; i < 8; i++) {
//       code += characters.charAt(Math.floor(Math.random() * characters.length));
//     }
//     return code;
//   };

//   const handleAdd = () => {
//     setEditingCoupon(null);
//     setModalOpen(true);
//   };

//   const handleEdit = (item: Coupon) => {
//     setEditingCoupon(item);
//     setModalOpen(true);
//   };

//   const handleDelete = (item: Coupon) => {
//     Swal.fire({
//       title: "Are you sure?",
//       text: `Do you really want to delete "${item.title}"?`,
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#3085d6",
//       cancelButtonColor: "#d33",
//       confirmButtonText: "Yes, delete it!",
//       cancelButtonText: "Cancel",
//     }).then((result) => {
//       if (result.isConfirmed) {
//         setCoupons(coupons.filter((c) => c.id !== item.id));
//         Swal.fire("Deleted!", `"${item.title}" has been deleted.`, "success");
//       }
//     });
//   };

//   const handleToggleStatus = (id: number) => {
//     setCoupons((prev) =>
//       prev.map((c) =>
//         c.id === id
//           ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" }
//           : c
//       )
//     );
//   };

//   // Formik validation schema
//   const validationSchema = Yup.object({
//     type: Yup.string().required("Coupon type is required"),
//     title: Yup.string().required("Coupon title is required"),
//     code: Yup.string().required("Coupon code is required"),
//     customerType: Yup.mixed().required("Customer selection is required"),
//     limitPerUser: Yup.number()
//       .min(1, "Limit must be at least 1")
//       .required("Limit is required"),
//     discountType: Yup.string().required("Discount type is required"),
//     discountAmount: Yup.number()
//       .min(0, "Discount amount cannot be negative")
//       .required("Discount amount is required"),
//     minimumPurchase: Yup.number()
//       .min(0, "Minimum purchase cannot be negative")
//       .required("Minimum purchase is required"),
//     startDate: Yup.date().required("Start date is required"),
//     expireDate: Yup.date()
//       .required("Expire date is required")
//       .min(Yup.ref("startDate"), "Expire date must be after start date"),
//   });

//   const formik = useFormik({
//     initialValues: {
//       type: editingCoupon?.type || "Discount",
//       title: editingCoupon?.title || "",
//       code: editingCoupon?.code || "",
//       customerType: editingCoupon?.customerType || "All",
//       limitPerUser: editingCoupon?.limitPerUser || 1,
//       discountType: editingCoupon?.discountType || "Amount",
//       discountAmount: editingCoupon?.discountAmount || 0,
//       minimumPurchase: editingCoupon?.minimumPurchase || 0,
//       startDate: editingCoupon?.startDate || "",
//       expireDate: editingCoupon?.expireDate || "",
//       status: editingCoupon ? editingCoupon.status === "Active" : true,
//     },
//     enableReinitialize: true,
//     validationSchema,
//     onSubmit: (values) => {
//       setIsLoading(true);
//       const newCoupon: Coupon = {
//         id: editingCoupon ? editingCoupon.id : coupons.length + 1,
//         type: values.type as "Discount" | "FreeDelivery",
//         title: values.title,
//         code: values.code,
//         customerType: values.customerType,
//         limitPerUser: values.limitPerUser,
//         discountType: values.discountType as "Amount" | "Percentage",
//         discountAmount: values.discountAmount,
//         minimumPurchase: values.minimumPurchase,
//         startDate: values.startDate,
//         expireDate: values.expireDate,
//         status: values.status ? "Active" : "Inactive",
//       };

//       if (editingCoupon) {
//         setCoupons(
//           coupons.map((c) => (c.id === editingCoupon.id ? newCoupon : c))
//         );
//         Swal.fire({
//           icon: "success",
//           title: "Coupon Updated",
//           text: `"${values.title}" has been updated successfully!`,
//           timer: 2000,
//           showConfirmButton: false,
//         });
//       } else {
//         setCoupons([newCoupon, ...coupons]);
//         Swal.fire({
//           icon: "success",
//           title: "Coupon Added",
//           text: `"${values.title}" has been added successfully!`,
//           timer: 2000,
//           showConfirmButton: false,
//         });
//       }

//       setModalOpen(false);
//       formik.resetForm();
//       setIsLoading(false);
//     },
//   });

//   return (
//     <div className=" bg-gradient-to-b from-gray-50 to-gray-100">
//       <DataTable
//         title="Coupons"
//         data={coupons}
//         columns={[
//           {
//             key: "title",
//             label: "Coupon Title",

//             render: (item) => (
//               <div className="flex flex-col">
//                 <div className="text-[16px]">{item.title}</div>
//                 <div className="font-bold text-[16px]">Code : {item.code}</div>
//               </div>
//             ),
//           },
//           { key: "type", label: "Type" },
//           {
//             key: "customerType",
//             label: "Customer",
//             render: (item) =>
//               item.customerType === "All"
//                 ? "All Customers"
//                 : users.find((u) => u.id === item.customerType)?.name ||
//                   "Unknown",
//           },
//           { key: "discountType", label: "Discount Type" },
//           { key: "discountAmount", label: "Discount Amount" },
//           { key: "minimumPurchase", label: "Min. Purchase" },
//           { key: "startDate", label: "Start Date" },
//           { key: "expireDate", label: "Expire Date" },
//           {
//             key: "status",
//             label: "Status",
//             render: (item) => (
//               <div className="flex items-center gap-3">
//                 <span
//                   className={`text-sm font-semibold ${
//                     item.status === "Active" ? "text-green-700" : "text-red-700"
//                   }`}
//                 >
//                   {item.status}
//                 </span>
//               </div>
//             ),
//           },
//         ]}
//         onAdd={handleAdd}
//         onEdit={handleEdit}
//         onDelete={handleDelete}
//         addButtonLabel="Add Coupon"
//       />

//       {modalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0000007d] px-3">
//           <div
//             className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 relative"
//             style={{ maxHeight: "80dvh", overflowY: "auto" }}
//           >
//             <h2 className="text-xl font-bold mb-7">
//               {editingCoupon ? "Edit Coupon" : "Add Coupon"}
//             </h2>
//             <form
//               onSubmit={formik.handleSubmit}
//               className="flex flex-col gap-4"
//             >
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">


//               <div className="mb-2">
//                 <label className="block mb-1 font-medium">Coupon Type</label>
//                 <select
//                   name="type"
//                   value={formik.values.type}
//                   onChange={formik.handleChange}
//                   className={`customInput ${
//                     formik.touched.type && formik.errors.type
//                       ? "customInputError"
//                       : ""
//                   }`}
//                 >
//                   <option value="Discount">Discount on Purchase</option>
//                   <option value="FreeDelivery">Free Delivery</option>
//                 </select>
//                 {formik.touched.type && formik.errors.type && (
//                   <div className="text-red-500 text-sm mt-1 ms-2">
//                     {formik.errors.type}
//                   </div>
//                 )}
//               </div>

//               <div className="mb-2">
//                 <label className="block mb-1 font-medium">Coupon Title</label>
//                 <input
//                   type="text"
//                   name="title"
//                   value={formik.values.title}
//                   onChange={formik.handleChange}
//                   placeholder="Enter coupon title"
//                   className={`customInput ${
//                     formik.touched.title && formik.errors.title
//                       ? "customInputError"
//                       : ""
//                   }`}
//                 />
//                 {formik.touched.title && formik.errors.title && (
//                   <div className="text-red-500 text-sm mt-1 ms-2">
//                     {formik.errors.title}
//                   </div>
//                 )}
//               </div>

//               <div className="mb-2">
//                 <div className="flex items-center justify-between">
//                   <label className="block mb-1 font-medium">Coupon Code</label>
//                   <button
//                     type="button"
//                     onClick={() =>
//                       formik.setFieldValue("code", generateCouponCode())
//                     }
//                     className="text-blue-600 text-sm hover:underline cursor-pointer"
//                   >
//                     Generate Code
//                   </button>
//                 </div>
//                 <input
//                   type="text"
//                   name="code"
//                   value={formik.values.code}
//                   onChange={formik.handleChange}
//                   placeholder="Enter coupon code"
//                   className={`customInput ${
//                     formik.touched.code && formik.errors.code
//                       ? "customInputError"
//                       : ""
//                   }`}
//                 />
//                 {formik.touched.code && formik.errors.code && (
//                   <div className="text-red-500 text-sm mt-1 ms-2">
//                     {formik.errors.code}
//                   </div>
//                 )}
//               </div>

//               <div className="mb-2">
//                 <label className="block mb-1 font-medium">Customer</label>
//                 <select
//                   name="customerType"
//                   value={formik.values.customerType}
//                   onChange={formik.handleChange}
//                   className={`customInput ${
//                     formik.touched.customerType && formik.errors.customerType
//                       ? "customInputError"
//                       : ""
//                   }`}
//                 >
//                   <option value="All">All Customers</option>
//                   {users.map((user) => (
//                     <option key={user.id} value={user.id}>
//                       {user.name}
//                     </option>
//                   ))}
//                 </select>
//                 {formik.touched.customerType && formik.errors.customerType && (
//                   <div className="text-red-500 text-sm mt-1 ms-2">
//                     {formik.errors.customerType}
//                   </div>
//                 )}
//               </div>

//               <div className="mb-2">
//                 <label className="block mb-1 font-medium">
//                   Limit for Same User
//                 </label>
//                 <input
//                   type="number"
//                   name="limitPerUser"
//                   value={formik.values.limitPerUser}
//                   onChange={formik.handleChange}
//                   placeholder="Enter limit"
//                   className={`customInput ${
//                     formik.touched.limitPerUser && formik.errors.limitPerUser
//                       ? "customInputError"
//                       : ""
//                   }`}
//                 />
//                 {formik.touched.limitPerUser && formik.errors.limitPerUser && (
//                   <div className="text-red-500 text-sm mt-1 ms-2">
//                     {formik.errors.limitPerUser}
//                   </div>
//                 )}
//               </div>

//               <div className="mb-2">
//                 <label className="block mb-1 font-medium">Discount Type</label>
//                 <select
//                   name="discountType"
//                   value={formik.values.discountType}
//                   onChange={formik.handleChange}
//                   className={`customInput ${
//                     formik.touched.discountType && formik.errors.discountType
//                       ? "customInputError"
//                       : ""
//                   }`}
//                 >
//                   <option value="Amount">Amount</option>
//                   <option value="Percentage">Percentage</option>
//                 </select>
//                 {formik.touched.discountType && formik.errors.discountType && (
//                   <div className="text-red-500 text-sm mt-1 ms-2">
//                     {formik.errors.discountType}
//                   </div>
//                 )}
//               </div>

//               <div className="mb-2">
//                 <label className="block mb-1 font-medium">
//                   Discount Amount
//                 </label>
//                 <input
//                   type="number"
//                   name="discountAmount"
//                   value={formik.values.discountAmount}
//                   onChange={formik.handleChange}
//                   placeholder="Enter discount amount"
//                   className={`customInput ${
//                     formik.touched.discountAmount &&
//                     formik.errors.discountAmount
//                       ? "customInputError"
//                       : ""
//                   }`}
//                 />
//                 {formik.touched.discountAmount &&
//                   formik.errors.discountAmount && (
//                     <div className="text-red-500 text-sm mt-1 ms-2">
//                       {formik.errors.discountAmount}
//                     </div>
//                   )}
//               </div>

//               <div className="mb-2">
//                 <label className="block mb-1 font-medium">
//                   Minimum Purchase
//                 </label>
//                 <input
//                   type="number"
//                   name="minimumPurchase"
//                   value={formik.values.minimumPurchase}
//                   onChange={formik.handleChange}
//                   placeholder="Enter minimum purchase"
//                   className={`customInput ${
//                     formik.touched.minimumPurchase &&
//                     formik.errors.minimumPurchase
//                       ? "customInputError"
//                       : ""
//                   }`}
//                 />
//                 {formik.touched.minimumPurchase &&
//                   formik.errors.minimumPurchase && (
//                     <div className="text-red-500 text-sm mt-1 ms-2">
//                       {formik.errors.minimumPurchase}
//                     </div>
//                   )}
//               </div>

//               <div className="mb-2">
//                 <label className="block mb-1 font-medium">Start Date</label>
//                 <input
//                   type="date"
//                   name="startDate"
//                   value={formik.values.startDate}
//                   onChange={formik.handleChange}
//                   className={`customInput ${
//                     formik.touched.startDate && formik.errors.startDate
//                       ? "customInputError"
//                       : ""
//                   }`}
//                 />
//                 {formik.touched.startDate && formik.errors.startDate && (
//                   <div className="text-red-500 text-sm mt-1 ms-2">
//                     {formik.errors.startDate}
//                   </div>
//                 )}
//               </div>

//               <div className="mb-2">
//                 <label className="block mb-1 font-medium">Expire Date</label>
//                 <input
//                   type="date"
//                   name="expireDate"
//                   disabled={!formik.values.startDate}
//                   min={formik.values.startDate}
//                   value={formik.values.expireDate}
//                   onChange={formik.handleChange}
//                   className={`customInput ${
//                     formik.touched.expireDate && formik.errors.expireDate
//                       ? "customInputError"
//                       : ""
//                   }`}
//                 />
//                 {formik.touched.expireDate && formik.errors.expireDate && (
//                   <div className="text-red-500 text-sm mt-1 ms-2">
//                     {formik.errors.expireDate}
//                   </div>
//                 )}
//               </div>

//               <div className="flex items-center gap-2">
//                 <label className="font-medium">Status</label>
//                 <ToggleSwitch
//                   checked={formik.values.status}
//                   onChange={(val) => formik.setFieldValue("status", val)}
//                 />
//                 <span>{formik.values.status ? "Active" : "Inactive"}</span>
//               </div>

//               <div className="flex justify-end gap-2 mt-4 items-end">
//                 <button
//                   type="button"
//                   onClick={() => setModalOpen(false)}
//                   className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 cursor-pointer"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isLoading}
//                   className="px-4 py-2 rounded-lg bg-blue-600 text-white cursor-pointer disabled:bg-blue-400"
//                 >
//                   {editingCoupon ? "Update" : "Add"}
//                 </button>
//               </div>
//               </div>
//             </form>
//             <button
//               disabled={isLoading}
//               onClick={() => setModalOpen(false)}
//               className="absolute top-5 right-5 text-gray-500 hover:text-gray-600 text-2xl"
//             >
//               &times;
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Coupons;

// export default Coupons;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import DataTable from "../../components/common/DataTable";
import ToggleSwitch from "../../components/common/ToggleSwitch";
import axiosInstance from "../../utils/axiosInstance";

interface Coupon {
  id: number;
  title: string;
  code: string;
  coupon_type: "percentage" | "flat";
  vendor_name: string;
  limit_per_user: number;
  max_count: number | null;
  used_count: number;
  discount_percent: string | null;
  discount_amount: string | null;
  min_order_value: string;
  max_discount: string | null;
  start_date: string;
  expire_date: string;
  apply_on: "all_products" | "category" | "product";
  category_name: string | null;
  product_name: string | null;
  display_message: string | null;
  status: "active" | "inactive";
  is_valid: boolean;
  created_at: string;
}

// ✅ Product Interface for Modal
interface Product {
  id: number;
  product_name: string;
  sku: string;
  main_image: string | null;
  category_details: { name: string } | null;
  stocks: Array<{
    final_price: string;
    stock_quantity: number;
  }>;
}

const Coupons = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ NEW: Modal State
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [couponProducts, setCouponProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Load coupons
  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("vendor/coupons");
      console.log("Coupons data:", response.data);

      if (response.data && Array.isArray(response.data)) {
        setCoupons(response.data);
      } else {
        console.error("Unexpected response format:", response.data);
        setCoupons([]);
      }
    } catch (error) {
      console.error("Error loading coupons:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to load coupons. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleAdd = () => navigate("/coupons/add");

  // ✅ NEW: Handle View Products
  const handleViewProducts = async (coupon: Coupon) => {
    try {
      setLoadingProducts(true);
      setSelectedCoupon(coupon);

      const response = await axiosInstance.get(`vendor/coupons/${coupon.id}/products/`);

      if (response.data.success) {
        setCouponProducts(response.data.products);
        setShowProductsModal(true);
      } else {
        Swal.fire("Error", "Failed to load products for this coupon", "error");
      }
    } catch (error: any) {
      console.error("Error loading coupon products:", error);
      Swal.fire("Error", "Failed to load products", "error");
    } finally {
      setLoadingProducts(false);
    }
  };

  // ✅ NEW: Close Modal
  const handleCloseModal = () => {
    setShowProductsModal(false);
    setSelectedCoupon(null);
    setCouponProducts([]);
  };

  const handleEdit = (coupon: Coupon) => {
    navigate(`/coupons/edit/${coupon.id}/`, { state: coupon });
  };

  const handleDelete = async (coupon: Coupon) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete coupon "${coupon.title}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`vendor/coupons/${coupon.id}/`);
        setCoupons(coupons.filter(c => c.id !== coupon.id));
        Swal.fire("Deleted!", `Coupon "${coupon.title}" has been deleted.`, "success");
      } catch (error) {
        console.error("Delete error:", error);
        Swal.fire("Error!", "Failed to delete coupon. Please try again.", "error");
      }
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const newStatus = coupon.status === "active" ? "inactive" : "active";
      await axiosInstance.patch(`vendor/coupons/${coupon.id}/`, {
        status: newStatus
      });

      setCoupons(coupons.map(c =>
        c.id === coupon.id ? { ...c, status: newStatus } : c
      ));

      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: `Coupon ${newStatus === "active" ? "activated" : "deactivated"}`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Toggle status error:", error);
      Swal.fire("Error!", "Failed to update status.", "error");
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get discount display
  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.coupon_type === "percentage" && coupon.discount_percent) {
      return `${coupon.discount_percent}%`;
    } else if (coupon.coupon_type === "flat" && coupon.discount_amount) {
      return `₹${coupon.discount_amount}`;
    }
    return "N/A";
  };

  // Get apply on display
  const getApplyOnDisplay = (coupon: Coupon) => {
    switch (coupon.apply_on) {
      case "all_products":
        return "All Products";
      case "category":
        return coupon.category_name || "Selected Categories";
      case "product":
        return coupon.product_name || "Selected Products";
      default:
        return coupon.apply_on;
    }
  };

  // ✅ Calculate discount for a product
  const calculateDiscountForProduct = (product: Product, coupon: Coupon) => {
    if (!product.stocks || product.stocks.length === 0) return 0;

    const finalPrice = Number(product.stocks[0].final_price);

    if (coupon.coupon_type === "percentage" && coupon.discount_percent) {
      const percent = Number(coupon.discount_percent);
      let discount = (finalPrice * percent) / 100;

      if (coupon.max_discount) {
        const max = Number(coupon.max_discount);
        discount = Math.min(discount, max);
      }
      return discount;
    }

    if (coupon.coupon_type === "flat" && coupon.discount_amount) {
      return Math.min(Number(coupon.discount_amount), finalPrice);
    }

    return 0;
  };


  // ✅ Calculate discounted price
  const calculateDiscountedPrice = (product: Product, coupon: Coupon) => {
    if (!product.stocks || product.stocks.length === 0) return 0;

    const finalPrice = parseFloat(product.stocks[0].final_price);
    const discount = calculateDiscountForProduct(product, coupon);

    return finalPrice - discount;
  };

  // ✅ Columns with View Products button
  const columns = [
    {
      key: "title",
      label: "Coupon Title",
      render: (coupon: Coupon) => (
        <div>
          <div className="font-medium">{coupon.title}</div>
          <div className="text-xs text-blue-600 mt-1">{coupon.display_message}</div>
        </div>
      ),
    },
    {
      key: "code",
      label: "Coupon Code",
      render: (coupon: Coupon) => (
        <span className="font-mono bg-gray-100 px-2 py-1 rounded">{coupon.code}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (coupon: Coupon) => (
        <div>
          <span className="font-medium capitalize">{coupon.coupon_type}</span>
          <div className="text-sm text-green-700 font-semibold">
            {getDiscountDisplay(coupon)} OFF
          </div>
          {coupon.max_discount && coupon.coupon_type === "percentage" && (
            <div className="text-xs text-gray-600">
              Max: ₹{coupon.max_discount}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "limits",
      label: "Usage",
      render: (coupon: Coupon) => (
        <div>
          <div className="text-sm">
            Used: {coupon.used_count}{coupon.max_count ? `/${coupon.max_count}` : ""}
          </div>
          <div className="text-xs text-gray-600">
            Per user: {coupon.limit_per_user}
          </div>
          {coupon.max_count && (
            <div className="text-xs text-blue-600">
              {coupon.max_count - coupon.used_count} left
            </div>
          )}
        </div>
      ),
    },
    {
      key: "apply_on",
      label: "Applicable On",
      render: (coupon: Coupon) => (
        <div className="text-sm">
          <div className="font-medium">{getApplyOnDisplay(coupon)}</div>
        </div>
      ),
    },
    {
      key: "min_order",
      label: "Min Order",
      render: (coupon: Coupon) => (
        <div className="font-medium">
          ₹{coupon.min_order_value}
        </div>
      ),
    },
    {
      key: "validity",
      label: "Validity",
      render: (coupon: Coupon) => (
        <div>
          <div className="text-sm">{formatDate(coupon.start_date)}</div>
          <div className="text-xs text-gray-600">to</div>
          <div className={`text-sm ${new Date(coupon.expire_date) < new Date() ? 'text-red-600 font-semibold' : 'text-green-700'}`}>
            {formatDate(coupon.expire_date)}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (coupon: Coupon) => (
        <div className="flex items-center gap-2">
          <ToggleSwitch
            checked={coupon.status === "active"}
            onChange={() => handleToggleStatus(coupon)}
          />
          <div>
            <span className={`font-medium ${coupon.status === "active" ? "text-green-700" : "text-red-700"}`}>
              {coupon.status === "active" ? "active" : "Inactive"}
            </span>
            <div className={`text-xs font-medium ${coupon.is_valid ? 'text-green-600' : 'text-red-600'}`}>
              {coupon.is_valid ? "Valid Now" : "Not Valid"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Details",
      render: (coupon: Coupon) => (
        <div className="flex flex-wrap gap-2">
                    <button
            onClick={() => navigate(`/coupons/usage/${coupon.id}`)}
            className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
            title="View Usage Details"
          >
            View Usage
          </button>
          <button
            onClick={() => handleViewProducts(coupon)}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
            title="View Applicable Products"
          >
            View Products
          </button>
          
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen p-6">
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading coupons...</p>
        </div>
      ) : (
        <DataTable
          title="My Coupons"
          data={coupons}
          columns={columns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addButtonLabel="Add New Coupon"
        />
      )}

      {/* ✅ PRODUCTS MODAL - WITH BACKDROP BLUR EFFECT */}
      {showProductsModal && selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* ✅ BACKGROUND WITH BLUR EFFECT - Not dark, just blur */}
          <div
            className="fixed inset-0 bg-black/10 backdrop-blur-[2px] transition-all duration-300"
            onClick={handleCloseModal}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Coupon: {selectedCoupon.code}</h2>
                <p className="text-blue-100">{selectedCoupon.title}</p>
                <div className="flex gap-2 mt-1">
                  <span className="bg-blue-500 px-2 py-1 rounded text-xs">
                    {couponProducts.length} Products
                  </span>
                  <span className="bg-green-500 px-2 py-1 rounded text-xs">
                    {selectedCoupon.coupon_type === 'percentage' ? `${selectedCoupon.discount_percent}% OFF` : `₹${selectedCoupon.discount_amount} OFF`}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-white hover:text-gray-200 text-3xl transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {loadingProducts ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
              ) : couponProducts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📦</div>
                  <p className="text-gray-500">No products found for this coupon</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {couponProducts.map((product) => {
                    const originalPrice = product.stocks && product.stocks.length > 0
                      ? parseFloat(product.stocks[0].final_price)
                      : 0;
                    const discount = calculateDiscountForProduct(product, selectedCoupon);
                    const finalPrice = calculateDiscountedPrice(product, selectedCoupon);

                    return (
                      <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                        {/* Product Image & Name */}
                        <div className="flex items-start gap-3">
                          {product.main_image && (
                            <img
                              src={product.main_image}
                              alt={product.product_name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{product.product_name}</h3>
                            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                            {product.category_details && (
                              <p className="text-xs text-gray-500">{product.category_details.name}</p>
                            )}
                          </div>
                        </div>

                        {/* Pricing Info */}
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Original Price:</span>
                            <span className="font-semibold">₹{Number(originalPrice).toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-600">Discount:</span>
                            <span className="font-semibold text-green-600">
                              {selectedCoupon.coupon_type === 'percentage'
                                ? `${selectedCoupon.discount_percent}%`
                                : `₹${selectedCoupon.discount_amount}`
                              }
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-600">You Save:</span>
                            <span className="font-bold text-green-700">₹{Number(discount).toFixed(2)}
</span>
                          </div>

                          <div className="flex justify-between border-t pt-2">
                            <span className="font-semibold">Final Price:</span>
                            <span className="font-bold text-lg text-blue-700">₹{Number(finalPrice).toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Stock Info */}
                        {product.stocks && product.stocks.length > 0 && (
                          <div className="mt-2 text-right">
                            <span className={`text-sm px-2 py-1 rounded ${product.stocks[0].stock_quantity > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              Stock: {product.stocks[0].stock_quantity}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {couponProducts.length} products • Coupon: {selectedCoupon.code}
                </div>
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;