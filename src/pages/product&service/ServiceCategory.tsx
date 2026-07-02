import { useState } from "react";
import DataTable from "../../components/common/DataTable";
import ToggleSwitch from "../../components/common/ToggleSwitch";
import { useFormik } from "formik";
import Swal from "sweetalert2";

interface Services {
  id: number;
  name: string;
  status: "Active" | "Inactive";
}

const ServiceCategory = () => {
  const [services, setServices] = useState<Services[]>([
    { id: 1, name: "Haircut & Styling", status: "Active" },
    { id: 2, name: "Barber Services", status: "Inactive" },
    { id: 3, name: "Manicure & Pedicure", status: "Active" },
    { id: 4, name: "Massage Therapy", status: "Active" },
    { id: 5, name: "Yoga & Pilates Classes", status: "Inactive" },
    { id: 6, name: "Personal Training", status: "Active" },
    { id: 7, name: "Home Cleaning", status: "Active" },
    { id: 8, name: "Plumbing Services", status: "Inactive" },
    { id: 9, name: "Electrical Repairs", status: "Active" },
    { id: 10, name: "Gardening & Landscaping", status: "Active" },
    { id: 11, name: "Pet Grooming", status: "Inactive" },
    { id: 12, name: "Dog Walking", status: "Active" },
    { id: 13, name: "Car Washing & Detailing", status: "Active" },
    { id: 14, name: "Vehicle Repair", status: "Inactive" },
    { id: 15, name: "Photography", status: "Active" },
    { id: 16, name: "Videography", status: "Active" },
    { id: 17, name: "Event Planning", status: "Inactive" },
    { id: 18, name: "Catering Services", status: "Active" },
    { id: 19, name: "Wedding Planning", status: "Active" },
    { id: 20, name: "Travel & Tour Packages", status: "Inactive" },
    { id: 21, name: "Courier & Delivery", status: "Active" },
    { id: 22, name: "Laundry & Dry Cleaning", status: "Active" },
    { id: 23, name: "Car Rental Services", status: "Inactive" },
    { id: 24, name: "IT Support & Maintenance", status: "Active" },
    { id: 25, name: "Web Design & Development", status: "Active" },
    { id: 26, name: "Mobile App Development", status: "Inactive" },
    { id: 27, name: "Digital Marketing", status: "Active" },
    { id: 28, name: "SEO Optimization", status: "Active" },
    { id: 29, name: "Social Media Management", status: "Inactive" },
    { id: 30, name: "Graphic Design", status: "Active" },
    { id: 31, name: "Printing Services", status: "Active" },
    { id: 32, name: "Courier Services", status: "Inactive" },
    { id: 33, name: "Furniture Assembly", status: "Active" },
    { id: 34, name: "Interior Decoration", status: "Active" },
    { id: 35, name: "Painting Services", status: "Inactive" },
    { id: 36, name: "Carpentry Services", status: "Active" },
    { id: 37, name: "Appliance Repair", status: "Active" },
    { id: 38, name: "Home Security Installation", status: "Inactive" },
    { id: 39, name: "Tutoring & Coaching", status: "Active" },
    { id: 40, name: "Music Lessons", status: "Active" },
    { id: 41, name: "Dance Classes", status: "Inactive" },
    { id: 42, name: "Art & Craft Workshops", status: "Active" },
    { id: 43, name: "Language Classes", status: "Active" },
    { id: 44, name: "Driving Lessons", status: "Inactive" },
    { id: 45, name: "Photography Classes", status: "Active" },
    { id: 46, name: "Cooking Classes", status: "Active" },
    { id: 47, name: "Bakery Services", status: "Inactive" },
    { id: 48, name: "Café & Restaurant Services", status: "Active" },
    { id: 49, name: "Fitness Bootcamp", status: "Active" },
    { id: 50, name: "Personal Chef Services", status: "Inactive" },
    { id: 51, name: "Elderly Care", status: "Active" },
    { id: 52, name: "Child Care Services", status: "Active" },
    { id: 53, name: "Pet Sitting", status: "Inactive" },
    { id: 54, name: "Carpeting & Flooring", status: "Active" },
    { id: 55, name: "Home Painting", status: "Active" },
    { id: 56, name: "Roofing Services", status: "Inactive" },
    { id: 57, name: "Pool Maintenance", status: "Active" },
    { id: 58, name: "Land Surveying", status: "Active" },
    { id: 59, name: "Moving & Relocation", status: "Inactive" },
    { id: 60, name: "Drone Photography", status: "Active" },
  ]);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Services | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAdd = () => {
    setEditingService(null); // reset editing Service
    setModalOpen(true);
  };

  const handleEdit = (item: Services) => {
    setEditingService(item); // set Service to edit
    setModalOpen(true);
  };

  const handleDelete = (item: Services) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to delete "${item.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setServices(services.filter((c) => c.id !== item.id));
        Swal.fire("Deleted!", `"${item.name}" has been deleted.`, "success");
      }
    });
  };

  const handleToggleStatus = (id: number) => {
    setServices((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" }
          : c
      )
    );
  };

  // Formik setup outside JSX
  const formik = useFormik({
    initialValues: {
      name: editingService ? editingService.name : "",
      status: editingService ? editingService.status === "Active" : true,
    },
    enableReinitialize: true, // important to reset form values when editing
    onSubmit: (values) => {
      setIsLoading(true);
      if (editingService) {
        // Editing existing Service
        setServices(
          services.map((c) =>
            c.id === editingService.id
              ? {
                  ...c,
                  name: values.name,
                  status: values.status ? "Active" : "Inactive",
                }
              : c
          )
        );
        Swal.fire({
          icon: "success",
          title: "Service Updated",
          text: `"${values.name}" has been updated successfully!`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // Adding new Service
        const newService: Services = {
          id: services.length + 1,
          name: values.name,
          status: values.status ? "Active" : "Inactive",
        };
        setServices([newService, ...services]);
        Swal.fire({
          icon: "success",
          title: "Service Added",
          text: `"${values.name}" has been added successfully!`,
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <DataTable
        title="Service Category"
        data={services}
        columns={[
          { key: "name", label: "Service Name" },
          {
            key: "status",
            label: "Status",
            render: (item) => (
              <div className="flex items-center gap-3">
                {/* <ToggleSwitch
                  checked={item.status === "Active"}
                  onChange={() => handleToggleStatus(item.id)}
                /> */}
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
        addButtonLabel="Add Service Category"
      />

      {/* Tailwind Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0000007d] px-3">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-7">
              {editingService
                ? "Edit Service Category"
                : "Add Service Category"}
            </h2>
            <form
              onSubmit={formik.handleSubmit}
              className="flex flex-col gap-4"
            >
              <div className="mb-2">
                <label className="block mb-1 font-medium">Service Name</label>
                <input
                  type="text"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  placeholder="Enter service name"
                  className={` ${
                    formik.touched.name && formik.errors.name
                      ? "customInputError"
                      : "customInput"
                  } `}
                />
                {formik.touched.name && formik.errors.name ? (
                  <div className="text-red-500 text-sm mt-1 ms-2">
                    {formik.errors.name}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <label className="font-medium">Status</label>
                <ToggleSwitch
                  checked={formik.values.status}
                  onChange={(val) => formik.setFieldValue("status", val)}
                />
                <span>{formik.values.status ? "Active" : "Inactive"}</span>
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
                  {editingService ? "Update" : "Add"}
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

export default ServiceCategory;
