import { useState } from "react";
import DataTable from "../../components/common/DataTable";
import ToggleSwitch from "../../components/common/ToggleSwitch";
import { useFormik } from "formik";
import Swal from "sweetalert2";

interface Category {
  id: number;
  name: string;
  status: "Active" | "Inactive";
}

const ProductCategory = () => {
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: "Electronics", status: "Active" },
    { id: 2, name: "Clothing", status: "Inactive" },
    { id: 3, name: "Home Appliances", status: "Active" },
    { id: 4, name: "Beauty & Personal Care", status: "Active" },
    { id: 5, name: "Sports & Fitness", status: "Inactive" },
    { id: 6, name: "Books & Stationery", status: "Active" },
    { id: 7, name: "Toys & Games", status: "Active" },
    { id: 8, name: "Automotive Accessories", status: "Inactive" },
    { id: 9, name: "Jewelry & Watches", status: "Active" },
    { id: 10, name: "Furniture", status: "Active" },
    { id: 11, name: "Groceries", status: "Inactive" },
    { id: 12, name: "Footwear", status: "Active" },
    { id: 13, name: "Kitchen & Dining", status: "Active" },
    { id: 14, name: "Pet Supplies", status: "Inactive" },
    { id: 15, name: "Health & Wellness", status: "Active" },
    { id: 16, name: "Mobile Accessories", status: "Active" },
    { id: 17, name: "Cameras & Photography", status: "Inactive" },
    { id: 18, name: "Music Instruments", status: "Active" },
    { id: 19, name: "Garden & Outdoor", status: "Active" },
    { id: 20, name: "Office Supplies", status: "Inactive" },
    { id: 21, name: "Art & Craft", status: "Active" },
    { id: 22, name: "Baby Products", status: "Active" },
    { id: 23, name: "Gaming", status: "Inactive" },
    { id: 24, name: "Smart Home Devices", status: "Active" },
    { id: 25, name: "Travel Accessories", status: "Active" },
    { id: 26, name: "Hardware Tools", status: "Inactive" },
    { id: 27, name: "Cleaning Supplies", status: "Active" },
    { id: 28, name: "Bags & Luggage", status: "Active" },
    { id: 29, name: "Lighting & Decor", status: "Inactive" },
    { id: 30, name: "Food & Beverages", status: "Active" },
    { id: 31, name: "Computer Peripherals", status: "Active" },
    { id: 32, name: "Home Improvement", status: "Inactive" },
    { id: 33, name: "Party Supplies", status: "Active" },
    { id: 34, name: "Mobile Phones", status: "Active" },
    { id: 35, name: "Laptops & Tablets", status: "Inactive" },
    { id: 36, name: "Stationery Essentials", status: "Active" },
    { id: 37, name: "Women’s Fashion", status: "Active" },
    { id: 38, name: "Men’s Fashion", status: "Inactive" },
    { id: 39, name: "Ethnic Wear", status: "Active" },
    { id: 40, name: "Accessories & Belts", status: "Active" },
    { id: 41, name: "Perfumes & Fragrances", status: "Inactive" },
    { id: 42, name: "Personal Safety", status: "Active" },
    { id: 43, name: "Power Tools", status: "Active" },
    { id: 44, name: "Home Decor", status: "Inactive" },
    { id: 45, name: "Gift Items", status: "Active" },
    { id: 46, name: "Industrial Supplies", status: "Active" },
    { id: 47, name: "Medical Equipment", status: "Inactive" },
    { id: 48, name: "Beverages & Juices", status: "Active" },
    { id: 49, name: "Snacks & Dry Fruits", status: "Active" },
    { id: 50, name: "Organic Products", status: "Inactive" },
    { id: 51, name: "Seasonal Items", status: "Active" },
    { id: 52, name: "Car Care", status: "Active" },
    { id: 53, name: "Bike Accessories", status: "Inactive" },
    { id: 54, name: "Smart Wearables", status: "Active" },
    { id: 55, name: "Washing Machines", status: "Active" },
    { id: 56, name: "Refrigerators", status: "Inactive" },
    { id: 57, name: "Air Conditioners", status: "Active" },
    { id: 58, name: "Televisions", status: "Active" },
    { id: 59, name: "Printers & Scanners", status: "Inactive" },
    { id: 60, name: "Drone & Action Cameras", status: "Active" },
  ]);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAdd = () => {
    setEditingCategory(null); // reset editing Category
    setModalOpen(true);
  };

  const handleEdit = (item: Category) => {
    setEditingCategory(item); // set Category to edit
    setModalOpen(true);
  };

  const handleDelete = (item: Category) => {
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
        setCategories(categories.filter((c) => c.id !== item.id));
        Swal.fire("Deleted!", `"${item.name}" has been deleted.`, "success");
      }
    });
  };

  const handleToggleStatus = (id: number) => {
    setCategories((prev) =>
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
      name: editingCategory ? editingCategory.name : "",
      status: editingCategory ? editingCategory.status === "Active" : true,
    },
    enableReinitialize: true, // important to reset form values when editing
    onSubmit: (values) => {
      setIsLoading(true);
      if (editingCategory) {
        // Editing existing Product
        setCategories(
          categories.map((c) =>
            c.id === editingCategory.id
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
          title: "Product Updated",
          text: `"${values.name}" has been updated successfully!`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // Adding new Product
        const newProduct: Category = {
          id: categories.length + 1,
          name: values.name,
          status: values.status ? "Active" : "Inactive",
        };
        setCategories([newProduct, ...categories]);
        Swal.fire({
          icon: "success",
          title: "Category Added",
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
        title="Product Category"
        data={categories}
        columns={[
          { key: "name", label: "Product Name" },
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
        addButtonLabel="Add Product Category"
      />

      {/* Tailwind Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0000007d] px-3">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-7">
              {editingCategory
                ? "Edit Product Category"
                : "Add Product Category"}
            </h2>
            <form
              onSubmit={formik.handleSubmit}
              className="flex flex-col gap-4"
            >
              <div className="mb-2">
                <label className="block mb-1 font-medium">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  placeholder="Enter product name"
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
                  {editingCategory ? "Update" : "Add"}
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

export default ProductCategory;
