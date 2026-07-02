import { useState } from "react";
import DataTable from "../../components/common/DataTable";
import ToggleSwitch from "../../components/common/ToggleSwitch";
import { useFormik } from "formik";
import Swal from "sweetalert2";
import * as Yup from "yup";

interface Vendor {
  id: number;
  businessName: string;
  ownerName: string;
  businessType: "Manufacturer" | "Wholesaler" | "Retailer";
  businessCategory: "Fashion" | "Grocery" | "Electronic";
  gstNo: string;
  email: string;
  mobile: string;
  alternateNumber?: string;
  businessAddress: string;
  locationLink?: string;
  bankAccountHolderName: string;
  bankAccountNo: string;
  ifsc: string;
  bankName: string;
  upiId?: string;
  paymentSettlementPreference: "Weekly" | "Bi-Weekly" | "Monthly";
  status: "Active" | "Inactive";
}

const VendorSchema = Yup.object().shape({
  businessName: Yup.string().required("Business Name is required"),
  ownerName: Yup.string().required("Owner Name is required"),
  businessType: Yup.string().required("Business Type is required"),
  businessCategory: Yup.string().required("Business Category is required"),
  gstNo: Yup.string().required("GST No. is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  mobile: Yup.string().required("Mobile Number is required"),
  businessAddress: Yup.string().required("Business Address is required"),
  bankAccountHolderName: Yup.string().required("Account Holder Name is required"),
  bankAccountNo: Yup.string().required("Account Number is required"),
  ifsc: Yup.string().required("IFSC is required"),
  bankName: Yup.string().required("Bank Name is required"),
  paymentSettlementPreference: Yup.string().required("Payment Settlement Preference is required"),
});

const ProductVendor = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAdd = () => {
    setEditingVendor(null);
    setModalOpen(true);
  };

  const handleEdit = (item: Vendor) => {
    setEditingVendor(item);
    setModalOpen(true);
  };

  const handleDelete = (item: Vendor) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to delete "${item.businessName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setVendors(vendors.filter((v) => v.id !== item.id));
        Swal.fire(
          "Deleted!",
          `"${item.businessName}" has been deleted.`,
          "success"
        );
      }
    });
  };

  const handleToggleStatus = (id: number) => {
    setVendors((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, status: v.status === "Active" ? "Inactive" : "Active" }
          : v
      )
    );
  };

  const formik = useFormik({
    initialValues: {
      businessName: editingVendor ? editingVendor.businessName : "",
      ownerName: editingVendor ? editingVendor.ownerName : "",
      businessType: editingVendor ? editingVendor.businessType : "Manufacturer",
      businessCategory: editingVendor ? editingVendor.businessCategory : "Fashion",
      gstNo: editingVendor ? editingVendor.gstNo : "",
      email: editingVendor ? editingVendor.email : "",
      mobile: editingVendor ? editingVendor.mobile : "",
      alternateNumber: editingVendor ? editingVendor.alternateNumber || "" : "",
      businessAddress: editingVendor ? editingVendor.businessAddress : "",
      locationLink: editingVendor ? editingVendor.locationLink || "" : "",
      bankAccountHolderName: editingVendor ? editingVendor.bankAccountHolderName : "",
      bankAccountNo: editingVendor ? editingVendor.bankAccountNo : "",
      ifsc: editingVendor ? editingVendor.ifsc : "",
      bankName: editingVendor ? editingVendor.bankName : "",
      upiId: editingVendor ? editingVendor.upiId || "" : "",
      paymentSettlementPreference: editingVendor ? editingVendor.paymentSettlementPreference : "Weekly",
      businessRegistrationImage: null as File | null,
      gstCertificate: null as File | null,
      panCard: null as File | null,
      identityProof: null as File | null,
      cancelledCheque: null as File | null,
      logo: null as File | null,
      banner: null as File | null,
     status: editingVendor ? editingVendor.status : "Pending Verification",
    },
    enableReinitialize: true,
    validationSchema: VendorSchema,
    onSubmit: (values) => {
      setIsLoading(true);
      if (editingVendor) {
        setVendors(
          vendors.map((v) =>
            v.id === editingVendor.id
              ? {
                  ...v,
                  ...values,
                  status: values.status ? "Active" : "Inactive",
                }
              : v
          )
        );
        Swal.fire({
          icon: "success",
          title: "Vendor Updated",
          text: `"${values.businessName}" has been updated!`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        const newVendor: Vendor = {
          id: vendors.length + 1,
          ...values,
          status: values.status ? "Active" : "Inactive",
        };
        setVendors([newVendor, ...vendors]);
        Swal.fire({
          icon: "success",
          title: "Vendor Added",
          text: `"${values.businessName}" has been added!`,
          timer: 2000,
          showConfirmButton: false,
        });
      }
      setModalOpen(false);
      formik.resetForm();
      setIsLoading(false);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <DataTable
        title="Product Vendors"
        data={vendors}
        columns={[
          { key: "businessName", label: "Business Name" },
          { key: "ownerName", label: "Owner Name" },
          { key: "businessType", label: "Business Type" },
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
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel="Add Product Vendor"
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0000007d] px-3">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-6">
              {editingVendor ? "Edit Product Vendor" : "Add Product Vendor"}
            </h2>
            <form
              onSubmit={formik.handleSubmit}
              className="flex flex-col gap-4"
            >
              {/* BUSINESS DETAILS */}
              <h3 className="block mb-1 font-medium mt-2">
                Business Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Business Name"
                    name="businessName"
                    value={formik.values.businessName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.businessName && formik.errors.businessName
                        ? "customInputError"
                        : "customInput"
                    }`}
                    required
                  />
                  {formik.touched.businessName && formik.errors.businessName && (
                    <div className="text-red-500 text-sm">{formik.errors.businessName}</div>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Owner Name<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Owner Name"
                    name="ownerName"
                    value={formik.values.ownerName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.ownerName && formik.errors.ownerName
                        ? "customInputError"
                        : "customInput"
                    }`}
                    required
                  />
                  {formik.touched.ownerName && formik.errors.ownerName && (
                    <div className="text-red-500 text-sm">{formik.errors.ownerName}</div>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">
                    Business Type<span className="text-red-500">*</span>
                  </label>
                  <select
                    name="businessType"
                    value={formik.values.businessType}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.businessType && formik.errors.businessType
                        ? "customInputError"
                        : "customInput"
                    }`}
                  >
                    <option>Manufacturer</option>
                    <option>Wholesaler</option>
                    <option>Retailer</option>
                  </select>
                  {formik.touched.businessType && formik.errors.businessType && (
                    <div className="text-red-500 text-sm">{formik.errors.businessType}</div>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">
                    Business Category<span className="text-red-500">*</span>
                  </label>
                  <select
                    name="businessCategory"
                    value={formik.values.businessCategory}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.businessCategory && formik.errors.businessCategory
                        ? "customInputError"
                        : "customInput"
                    }`}
                  >
                    <option>Fashion</option>
                    <option>Grocery</option>
                    <option>Electronic</option>
                  </select>
                  {formik.touched.businessCategory && formik.errors.businessCategory && (
                    <div className="text-red-500 text-sm">{formik.errors.businessCategory}</div>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">GST No.<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="GST No."
                    name="gstNo"
                    value={formik.values.gstNo}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.gstNo && formik.errors.gstNo
                        ? "customInputError"
                        : "customInput"
                    }`}
                  />
                  {formik.touched.gstNo && formik.errors.gstNo && (
                    <div className="text-red-500 text-sm">{formik.errors.gstNo}</div>
                  )}
                </div>
              </div>

              {/* CONTACT INFO */}
              <h3 className="block mb-1 font-medium mt-4">Contact Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700">
                    Email (Login Email)<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Email"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.email && formik.errors.email
                        ? "customInputError"
                        : "customInput"
                    }`}
                    required
                  />
                  {formik.touched.email && formik.errors.email && (
                    <div className="text-red-500 text-sm">{formik.errors.email}</div>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">
                    Mobile Number<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Mobile Number"
                    name="mobile"
                    value={formik.values.mobile}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.mobile && formik.errors.mobile
                        ? "customInputError"
                        : "customInput"
                    }`}
                    required
                  />
                  {formik.touched.mobile && formik.errors.mobile && (
                    <div className="text-red-500 text-sm">{formik.errors.mobile}</div>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">
                    Alternate Number<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Alternate Number"
                    name="alternateNumber"
                    value={formik.values.alternateNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.alternateNumber && formik.errors.alternateNumber
                        ? "customInputError"
                        : "customInput"
                    }`}
                  />
                  {formik.touched.alternateNumber && formik.errors.alternateNumber && (
                    <div className="text-red-500 text-sm">{formik.errors.alternateNumber}</div>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">
                    Business Address<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Business Address"
                    name="businessAddress"
                    value={formik.values.businessAddress}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.businessAddress && formik.errors.businessAddress
                        ? "customInputError"
                        : "customInput"
                    }`}
                    required
                  />
                  {formik.touched.businessAddress && formik.errors.businessAddress && (
                    <div className="text-red-500 text-sm">{formik.errors.businessAddress}</div>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">
                    Business Location Link<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Business Location Link"
                    name="locationLink"
                    value={formik.values.locationLink}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.locationLink && formik.errors.locationLink
                        ? "customInputError"
                        : "customInput"
                    }`}
                  />
                  {formik.touched.locationLink && formik.errors.locationLink && (
                    <div className="text-red-500 text-sm">{formik.errors.locationLink}</div>
                  )}
                </div>
              </div>

              {/* BANK & PAYMENT DETAILS */}
              <h3 className="block mb-1 font-medium mt-4">
                Bank & Payment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700">
                    Account Holder Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Account Holder Name"
                    name="bankAccountHolderName"
                    value={formik.values.bankAccountHolderName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.bankAccountHolderName && formik.errors.bankAccountHolderName
                        ? "customInputError"
                        : "customInput"
                    }`}
                    required
                  />
                  {formik.touched.bankAccountHolderName && formik.errors.bankAccountHolderName && (
                    <div className="text-red-500 text-sm">{formik.errors.bankAccountHolderName}</div>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">
                    Account Number<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Account Number"
                    name="bankAccountNo"
                    value={formik.values.bankAccountNo}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.bankAccountNo && formik.errors.bankAccountNo
                        ? "customInputError"
                        : "customInput"
                    }`}
                    required
                  />
                  {formik.touched.bankAccountNo && formik.errors.bankAccountNo && (
                    <div className="text-red-500 text-sm">{formik.errors.bankAccountNo}</div>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">IFSC<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="IFSC"
                    name="ifsc"
                    value={formik.values.ifsc}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.ifsc && formik.errors.ifsc
                        ? "customInputError"
                        : "customInput"
                    }`}
                    required
                  />
                  {formik.touched.ifsc && formik.errors.ifsc && (
                    <div className="text-red-500 text-sm">{formik.errors.ifsc}</div>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">
                    Bank Name & Branch<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Bank Name & Branch"
                    name="bankName"
                    value={formik.values.bankName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.bankName && formik.errors.bankName
                        ? "customInputError"
                        : "customInput"
                    }`}
                    required
                  />
                  {formik.touched.bankName && formik.errors.bankName && (
                    <div className="text-red-500 text-sm">{formik.errors.bankName}</div>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">UPI ID<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="UPI ID"
                    name="upiId"
                    value={formik.values.upiId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.upiId && formik.errors.upiId
                        ? "customInputError"
                        : "customInput"
                    }`}
                  />
                  {formik.touched.upiId && formik.errors.upiId && (
                    <div className="text-red-500 text-sm">{formik.errors.upiId}</div>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">
                    Payment Settlement Preference<span className="text-red-500">*</span>
                  </label>
                  <select
                    name="paymentSettlementPreference"
                    value={formik.values.paymentSettlementPreference}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`border p-2 rounded-md ${
                      formik.touched.paymentSettlementPreference && formik.errors.paymentSettlementPreference
                        ? "customInputError"
                        : "customInput"
                    }`}
                  >
                    <option>Weekly</option>
                    <option>Bi-Weekly</option>
                    <option>Monthly</option>
                  </select>
                  {formik.touched.paymentSettlementPreference && formik.errors.paymentSettlementPreference && (
                    <div className="text-red-500 text-sm">{formik.errors.paymentSettlementPreference}</div>
                  )}
                </div>
              </div>

              {/* DOCUMENTS UPLOAD */}
              <h3 className="block mb-1 font-medium mt-4">
                Documents Upload
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700">
                    Business Registration Image<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="businessRegistrationImage"
                    onChange={(e) =>
                      formik.setFieldValue(
                        "businessRegistrationImage",
                        e.currentTarget.files?.[0] || null
                      )
                    }
                    className="border p-2 rounded-md customInput w-full"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">GST Certificate<span className="text-red-500">*</span></label>
                  <input
                    type="file"
                    name="gstCertificate"
                    onChange={(e) =>
                      formik.setFieldValue(
                        "gstCertificate",
                        e.currentTarget.files?.[0] || null
                      )
                    }
                    className="border p-2 rounded-md customInput w-full"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">PAN Card<span className="text-red-500">*</span></label>
                  <input
                    type="file"
                    name="panCard"
                    onChange={(e) =>
                      formik.setFieldValue(
                        "panCard",
                        e.currentTarget.files?.[0] || null
                      )
                    }
                    className="border p-2 rounded-md customInput w-full"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Identity Proof<span className="text-red-500">*</span></label>
                  <input
                    type="file"
                    name="identityProof"
                    onChange={(e) =>
                      formik.setFieldValue(
                        "identityProof",
                        e.currentTarget.files?.[0] || null
                      )
                    }
                    className="border p-2 rounded-md customInput w-full"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Cancelled Cheque<span className="text-red-500">*</span></label>
                  <input
                    type="file"
                    name="cancelledCheque"
                    onChange={(e) =>
                      formik.setFieldValue(
                        "cancelledCheque",
                        e.currentTarget.files?.[0] || null
                      )
                    }
                    className="border p-2 rounded-md customInput w-full"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Logo<span className="text-red-500">*</span></label>
                  <input
                    type="file"
                    name="logo"
                    onChange={(e) =>
                      formik.setFieldValue(
                        "logo",
                        e.currentTarget.files?.[0] || null
                      )
                    }
                    className="border p-2 rounded-md customInput w-full"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="font-semibold text-gray-700">Banner<span className="text-red-500">*</span></label>
                  <input
                    type="file"
                    name="banner"
                    onChange={(e) =>
                      formik.setFieldValue(
                        "banner",
                        e.currentTarget.files?.[0] || null
                      )
                    }
                    className="border p-2 rounded-md customInput w-full"
                  />
                </div>
              </div>

               {/* STATUS */}
              <div className="flex items-center gap-2 mt-2">
                <label className="font-semibold text-gray-700">Status<span className="text-red-500">*</span></label>
                <select
                  name="status"
                  value={formik.values.status}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`border p-2 rounded-md ${
                    formik.touched.status && formik.errors.status
                      ? "customInputError"
                      : "customInput"
                  }`}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Pending Verification</option>
                </select>
                {formik.touched.status && formik.errors.status && (
                  <div className="text-red-500 text-sm">{formik.errors.status}</div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white cursor-pointer"
                >
                  {editingVendor ? "Update" : "Add"}
                </button>
              </div>
            </form>
           <button
              disabled={isLoading}
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

export default ProductVendor;