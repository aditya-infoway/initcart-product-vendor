import { useState } from "react";
import DataTable from "../../components/common/DataTable";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FaEye } from "react-icons/fa";
import { motion } from "framer-motion";

interface Review {
  id: number;
  product: string;
  customer: string;
  rating: number;
  review: string;
  reply: string;
  date: string;
  status: "Active" | "Inactive";
}

const ProductReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 1,
      product: "Smartphone X",
      customer: "John Doe",
      rating: 4,
      review: "Great phone with excellent camera.",
      reply: "Thank you for your feedback!",
      date: "2025-09-15",
      status: "Active",
    },
    {
      id: 2,
      product: "Laptop Pro",
      customer: "Jane Smith",
      rating: 5,
      review: "Amazing performance and battery life.",
      reply: "",
      date: "2025-09-20",
      status: "Active",
    },
    {
      id: 3,
      product: "Wireless Earbuds",
      customer: "Bob Johnson",
      rating: 3,
      review: "Good sound but connectivity issues.",
      reply: "We're sorry to hear that. Please contact support.",
      date: "2025-10-01",
      status: "Inactive",
    },
  ]);

  const [filteredReviews, setFilteredReviews] = useState<Review[]>(reviews);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // Mock data for products and customers
  const products = [
    "Smartphone X",
    "Laptop Pro",
    "Wireless Earbuds",
    "Smart TV",
  ];
  const customers = ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown"];

  // Filter formik
  const filterFormik = useFormik({
    initialValues: {
      product: "",
      customer: "",
      status: "",
      fromDate: "",
      toDate: "",
    },
    validationSchema: Yup.object({
      //   fromDate: Yup.date().when("toDate", {
      //     is: (toDate) => !!toDate,
      //     then: Yup.date().max(Yup.ref("toDate"), "From date must be before to date"),
      //   }),
      toDate: Yup.date(),
    }),
    onSubmit: (values) => {
      let filtered = [...reviews];

      if (values.product) {
        filtered = filtered.filter((r) => r.product === values.product);
      }
      if (values.customer) {
        filtered = filtered.filter((r) => r.customer === values.customer);
      }
      if (values.status) {
        filtered = filtered.filter((r) => r.status === values.status);
      }
      if (values.fromDate) {
        filtered = filtered.filter((r) => r.date >= values.fromDate);
      }
      if (values.toDate) {
        filtered = filtered.filter((r) => r.date <= values.toDate);
      }

      setFilteredReviews(filtered);
    },
  });

  const handleResetFilter = () => {
    filterFormik.resetForm();
    setFilteredReviews(reviews);
  };

  const handleView = (item: Review) => {
    setSelectedReview(item);
    setModalOpen(true);
  };

  const handleToggleStatus = (id: number) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "Active" ? "Inactive" : "Active" }
          : r
      )
    );
    setFilteredReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "Active" ? "Inactive" : "Active" }
          : r
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Filter Reviews</h2>
        <form
          onSubmit={filterFormik.handleSubmit}
          className="flex flex-wrap gap-4"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 font-medium">Select Product</label>
            <select
              name="product"
              value={filterFormik.values.product}
              onChange={filterFormik.handleChange}
              className="customInput w-full"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 font-medium">Select Customer</label>
            <select
              name="customer"
              value={filterFormik.values.customer}
              onChange={filterFormik.handleChange}
              className="customInput w-full"
            >
              <option value="">All Customers</option>
              {customers.map((customer) => (
                <option key={customer} value={customer}>
                  {customer}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 font-medium">Status</label>
            <select
              name="status"
              value={filterFormik.values.status}
              onChange={filterFormik.handleChange}
              className="customInput w-full"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 font-medium">From Date</label>
            <input
              type="date"
              name="fromDate"
              value={filterFormik.values.fromDate}
              onChange={filterFormik.handleChange}
              className={`customInput w-full ${
                filterFormik.touched.fromDate && filterFormik.errors.fromDate
                  ? "customInputError"
                  : ""
              }`}
            />
            {filterFormik.touched.fromDate && filterFormik.errors.fromDate && (
              <div className="text-red-500 text-sm mt-1">
                {filterFormik.errors.fromDate}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 font-medium">To Date</label>
            <input
              type="date"
              name="toDate"
              disabled={!filterFormik.values.fromDate}
              min={filterFormik.values.fromDate}
              value={filterFormik.values.toDate}
              onChange={filterFormik.handleChange}
              className={`customInput w-full ${
                filterFormik.touched.toDate && filterFormik.errors.toDate
                  ? "customInputError"
                  : ""
              }`}
            />
            {filterFormik.touched.toDate && filterFormik.errors.toDate && (
              <div className="text-red-500 text-sm mt-1">
                {filterFormik.errors.toDate}
              </div>
            )}
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white cursor-pointer"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Data Table */}
      <DataTable
        title="Product Reviews"
        data={filteredReviews}
        columns={[
          {
            key: "actions",
            label: "Actions",
            render: (item) => (
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => handleView(item)}
                className="text-blue-600 hover:text-blue-800 transition-all cursor-pointer"
                title="View"
              >
                <FaEye size={26} />
              </motion.button>
            ),
          },
          { key: "id", label: "Review ID" },
          { key: "product", label: "Product" },
          { key: "customer", label: "Customer" },
          {
            key: "rating",
            label: "Rating",
            render: (item) => (
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, index) => (
                  <svg
                    key={index}
                    className={`w-5 h-5 ${
                      index < item.rating ? "text-yellow-400" : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.38 2.46a1 1 0 00-.364 1.118l1.286 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.46a1 1 0 00-1.175 0l-3.38 2.46c-.784.57-1.838-.197-1.54-1.118l1.286-3.97a1 1 0 00-.364-1.118l-3.38-2.46c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.97z" />
                  </svg>
                ))}
              </div>
            ),
          },
          { key: "review", label: "Review" },
          { key: "reply", label: "Reply" },
          { key: "date", label: "Date" },
          {
            key: "status",
            label: "Status",
            render: (item) => (
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-semibold ${
                    item.status === "Active" ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ),
          },
        ]}
        // onView={()=> handleView(item)}
      />

      {/* View Modal */}
      {modalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0000007d] px-3">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-4">Review Details</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block mb-1 font-medium">Review ID</label>
                <p>{selectedReview.id}</p>
              </div>
              <div>
                <label className="block mb-1 font-medium">Product</label>
                <p>{selectedReview.product}</p>
              </div>
              <div>
                <label className="block mb-1 font-medium">Customer</label>
                <p>{selectedReview.customer}</p>
              </div>
              <div>
                <label className="block mb-1 font-medium">Rating</label>
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <svg
                      key={index}
                      className={`w-5 h-5 ${
                        index < selectedReview.rating
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.38 2.46a1 1 0 00-.364 1.118l1.286 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.46a1 1 0 00-1.175 0l-3.38 2.46c-.784.57-1.838-.197-1.54-1.118l1.286-3.97a1 1 0 00-.364-1.118l-3.38-2.46c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.97z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Review</label>
                <p>{selectedReview.review}</p>
              </div>
              <div>
                <label className="block mb-1 font-medium">Reply</label>
                <p>{selectedReview.reply || "No reply yet"}</p>
              </div>
              <div>
                <label className="block mb-1 font-medium">Date</label>
                <p>{selectedReview.date}</p>
              </div>
              <div>
                <label className="block mb-1 font-medium">Status</label>
                <p
                  className={`${
                    selectedReview.status === "Active"
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {selectedReview.status}
                </p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-gray-500 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
