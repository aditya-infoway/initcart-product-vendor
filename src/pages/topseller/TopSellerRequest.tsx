import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import axiosInstance from "../../utils/axiosInstance"; // adjust path as per your project
import {
  FaHourglassHalf,
  FaTrophy,
  FaEyeSlash,
  FaTimesCircle,
  FaRocket,
  FaCheckCircle,
  FaChartLine,
  FaCloudUploadAlt,
  FaTrash,
  FaImage,
  FaExchangeAlt,
} from "react-icons/fa";

interface TopSellerRow {
  id: number;
  request_id: string;
  message: string;
  banner_url: string | null;
  banner_uploaded_by: "vendor" | "admin" | "";
  status: "pending" | "approved" | "rejected";
  is_active: boolean;
  admin_remarks: string | null;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

const MIN_W = 300;
const MIN_H = 150;
const MAX_MB = 3;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

// Server-side pagination bar (same look as the DataTable pagination)
interface ServerPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const ServerPagination = ({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: ServerPaginationProps) => {
  if (totalCount === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  const pages: (number | string)[] = [];
  const maxVisible = 3;
  const startPage = Math.max(1, page - 1);
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (startPage > 1) pages.push(1, "...");
  for (let i = startPage; i <= endPage; i++) pages.push(i);
  if (endPage < totalPages) pages.push("...", totalPages);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 py-4 border-t border-gray-100">
      <div className="flex items-center gap-5 text-sm text-gray-700">
        <div className="flex gap-2 items-center">
          <label htmlFor="ts-page-size" className="font-medium text-gray-600">Rows per page:</label>
          <select
            id="ts-page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
            className="border border-gray-300 rounded-lg px-2 py-1 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {[10, 25, 50].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-800">{from} - {to}</span> of {totalCount}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            page <= 1 ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Prev
        </button>

        {pages.map((p, i) =>
          typeof p === "number" ? (
            <button
              key={i}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                p === page ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={i} className="px-2 text-gray-500">{p}</span>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            page >= totalPages ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const TopSellerRequest = () => {
  const [requests, setRequests] = useState<TopSellerRow[]>([]);
  const [latest, setLatest] = useState<TopSellerRow | null>(null);
  const [canRequest, setCanRequest] = useState(false);
  const [storeApproved, setStoreApproved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // Revoke the old object URL whenever the preview changes or the page unmounts
  useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/vendor/top-seller/list/", {
        params: { page, page_size: pageSize },
      });
      if (res.data.success) {
        setRequests(res.data.data);
        setLatest(res.data.latest);
        setCanRequest(res.data.can_request);
        setStoreApproved(res.data.store_approved);
        setTotalCount(res.data.pagination.count);
        setTotalPages(res.data.pagination.total_pages);
      }
    } catch (error: any) {
      // The requested page no longer exists, so go back to the first page
      if (error.response?.status === 404 && page > 1) {
        setPage(1);
        return;
      }
      Swal.fire({ icon: "error", title: "Error", text: error.response?.data?.message || "Failed to load data" });
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      Swal.fire({ icon: "warning", title: "Invalid file", text: "Only JPG, PNG or WEBP images are allowed." });
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      Swal.fire({ icon: "warning", title: "File too large", text: `Banner must be smaller than ${MAX_MB} MB.` });
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.width < MIN_W || img.height < MIN_H) {
        URL.revokeObjectURL(url);
        Swal.fire({
          icon: "warning",
          title: "Image too small",
          text: `Minimum size is ${MIN_W} x ${MIN_H} px. Recommended: 600 x 300 px.`,
        });
        return;
      }
      setBannerFile(file);
      setBannerPreview(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      Swal.fire({ icon: "error", title: "Error", text: "Could not read this image file." });
    };
    img.src = url;
  };

  const clearBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!bannerFile) {
      Swal.fire({ icon: "warning", title: "Banner required", text: "Please upload a banner image for your store." });
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "Send Top Seller Request?",
      text: "Your store will be reviewed by our team. If approved, it will be featured on the homepage.",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      confirmButtonText: "Yes, Send Request",
    });
    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("message", message);
      formData.append("banner", bannerFile);

      const res = await axiosInstance.post("/vendor/top-seller/create/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        Swal.fire({ icon: "success", title: "Request Sent", text: `Request ID: ${res.data.data.request_id}` });
        setMessage("");
        clearBanner();
        // The newest request is always on page 1
        if (page !== 1) setPage(1);
        else fetchData();
      }
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Error", text: error.response?.data?.message || "Failed to send request" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusCard = () => {
    if (!latest) return null;

    if (latest.status === "pending") {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex gap-4 items-start">
          <div className="text-3xl text-amber-600">
            <FaHourglassHalf />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800">Request under review</h3>
            <p className="text-sm text-amber-700 mt-1">
              Your request <strong>{latest.request_id}</strong> was sent on {formatDate(latest.created_at)}.
              We'll notify you once the admin reviews it.
            </p>
          </div>
        </div>
      );
    }

    if (latest.status === "approved") {
      return latest.is_active ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex gap-4 items-start">
          <div className="text-3xl text-green-600">
            <FaTrophy />
          </div>
          <div>
            <h3 className="font-semibold text-green-800">You're a Top Seller - live on homepage!</h3>
            <p className="text-sm text-green-700 mt-1">
              Approved on {formatDate(latest.approved_at)}. Your store is currently featured in the Top Sellers slider.
            </p>
            {latest.admin_remarks && <p className="text-xs text-green-700 mt-2 italic">Admin note: {latest.admin_remarks}</p>}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 flex gap-4 items-start">
          <div className="text-3xl text-blue-600">
            <FaEyeSlash />
          </div>
          <div>
            <h3 className="font-semibold text-blue-800">Approved - currently hidden</h3>
            <p className="text-sm text-blue-700 mt-1">
              Your Top Seller request is approved, but the admin has temporarily hidden your store from the homepage slider.
            </p>
            {latest.admin_remarks && <p className="text-xs text-blue-700 mt-2 italic">Admin note: {latest.admin_remarks}</p>}
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex gap-4 items-start">
        <div className="text-3xl text-red-600">
          <FaTimesCircle />
        </div>
        <div>
          <h3 className="font-semibold text-red-800">Last request was rejected</h3>
          <p className="text-sm text-red-700 mt-1">
            Request <strong>{latest.request_id}</strong> was rejected on {formatDate(latest.rejected_at)}.
          </p>
          {latest.admin_remarks && <p className="text-sm text-red-700 mt-2 italic">Reason: {latest.admin_remarks}</p>}
          <p className="text-xs text-red-600 mt-2">You can improve your store and send a new request below.</p>
        </div>
      </div>
    );
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: "text-amber-700 bg-amber-50",
      approved: "text-green-700 bg-green-50",
      rejected: "text-red-700 bg-red-50",
    };
    return map[s] || "text-gray-700 bg-gray-100";
  };

  // Full-page spinner only on the very first load, so the form does not disappear when the page changes
  if (loading && !initialized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Top Seller Request</h1>
        <p className="text-sm text-gray-500 mt-1">Get your store featured on the homepage Top Sellers section.</p>
      </div>

      {renderStatusCard()}

      {!storeApproved && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
          Your store needs to be approved by the admin before you can request Top Seller status.
        </div>
      )}

      {canRequest && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Request Top Seller Badge</h2>
          <p className="text-sm text-gray-500 mb-4">Upload your store banner and tell us why your store deserves to be featured.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {[
              { icon: <FaRocket />, title: "More visibility", sub: "Featured on the homepage slider" },
              { icon: <FaCheckCircle />, title: "Verified badge", sub: "Build trust with customers" },
              { icon: <FaChartLine />, title: "More orders", sub: "Reach more shoppers" },
            ].map((item) => (
              <div key={item.title} className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <div className="text-xl text-blue-600">{item.icon}</div>
                <p className="font-semibold text-blue-800 text-sm mt-1">{item.title}</p>
                <p className="text-xs text-blue-600">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Banner upload */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <FaImage className="text-gray-400" />
              Store Banner <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              This banner is shown on the homepage slider card. Recommended size <strong>600 x 300 px (2:1)</strong>,
              JPG / PNG / WEBP, max {MAX_MB} MB. Keep important content in the center because the edges may be cropped.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            <div className="max-w-md">
              <div
                onClick={() => !bannerPreview && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                style={{ aspectRatio: "2 / 1" }}
                className={`relative w-full rounded-xl overflow-hidden border-2 border-dashed transition-colors
                  ${bannerPreview ? "border-transparent" : "cursor-pointer"}
                  ${dragOver ? "border-blue-500 bg-blue-50" : bannerPreview ? "" : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"}`}
              >
                {bannerPreview ? (
                  <>
                    <img src={bannerPreview} alt="Banner preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-3 py-1 text-xs rounded bg-white/90 text-gray-800 hover:bg-white font-medium flex items-center gap-1"
                      >
                        <FaExchangeAlt className="text-[10px]" />
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearBanner();
                        }}
                        className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 font-medium flex items-center gap-1"
                      >
                        <FaTrash className="text-[10px]" />
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 gap-1 px-4 text-center">
                    <FaCloudUploadAlt className="text-3xl text-blue-500" />
                    <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400">600 x 300 px recommended</p>
                  </div>
                )}
              </div>
              {bannerFile && (
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {bannerFile.name} ({(bannerFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
          </div>

          <label className="text-sm font-semibold text-gray-700 mb-1 block">Message (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="E.g. We have 4.8-star rating, fast delivery, and 500+ happy customers..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-400">{message.length}/1000</span>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting || !bannerFile}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? "Sending..." : "Send Request"}
            </button>
          </div>
        </div>
      )}

      {/* Request history */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Request History</h2>
        </div>
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">No requests yet.</div>
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-50 pointer-events-none" : ""}`}>
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["#", "Request ID", "Banner", "Requested On", "Message", "Status", "Admin Remarks"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {requests.map((r, index) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.request_id}</td>
                    <td className="px-4 py-3">
                      {r.banner_url ? (
                        <img
                          src={r.banner_url}
                          alt="Banner"
                          style={{ aspectRatio: "2 / 1" }}
                          className="w-24 rounded border border-gray-200 object-cover"
                        />
                      ) : (
                        <span className="text-gray-300 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={r.message}>{r.message || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 italic max-w-xs truncate" title={r.admin_remarks || ""}>
                      {r.admin_remarks || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ServerPagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
};

export default TopSellerRequest;