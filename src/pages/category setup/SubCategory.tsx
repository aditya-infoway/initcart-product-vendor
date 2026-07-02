import { useState } from "react";
import DataTable from "../../components/common/DataTable";
import ToggleSwitch from "../../components/common/ToggleSwitch";
import { useFormik } from "formik";
import Swal from "sweetalert2";
import Select from "react-select";
import * as Yup from "yup";

interface SubCategoryState {
  id: number;
  category: string;
  name: string;
  status: "Active" | "Inactive";
}

const categoryOptions = [
  { value: "Electronics", label: "Electronics" },
  { value: "Fashion", label: "Fashion" },
  { value: "Home & Living", label: "Home & Living" },
  { value: "Health & Personal Care", label: "Health & Personal Care" },
  { value: "Sports & Outdoors", label: "Sports & Outdoors" },
  { value: "Books & Stationery", label: "Books & Stationery" },
  { value: "Food & Beverages", label: "Food & Beverages" },
  { value: "Automotive", label: "Automotive" },
  { value: "Miscellaneous", label: "Miscellaneous" },
];

const SubCategory = () => {
  const [subCategories, setSubCategories] = useState<SubCategoryState[]>([
    { id: 1, name: "Mobile Phones", category: "Electronics", status: "Active" },
    {
      id: 2,
      name: "Laptops & Tablets",
      category: "Electronics",
      status: "Inactive",
    },
    {
      id: 3,
      name: "Mobile Accessories",
      category: "Electronics",
      status: "Active",
    },
    {
      id: 4,
      name: "Cameras & Photography",
      category: "Electronics",
      status: "Inactive",
    },
    {
      id: 5,
      name: "Smart Wearables",
      category: "Electronics",
      status: "Active",
    },
    { id: 6, name: "Televisions", category: "Electronics", status: "Active" },
    {
      id: 7,
      name: "Washing Machines",
      category: "Electronics",
      status: "Active",
    },
    {
      id: 8,
      name: "Refrigerators",
      category: "Electronics",
      status: "Inactive",
    },
    {
      id: 9,
      name: "Printers & Scanners",
      category: "Electronics",
      status: "Inactive",
    },
    {
      id: 10,
      name: "Drone & Action Cameras",
      category: "Electronics",
      status: "Active",
    },

    { id: 11, name: "Men’s Fashion", category: "Fashion", status: "Inactive" },
    { id: 12, name: "Women’s Fashion", category: "Fashion", status: "Active" },
    { id: 13, name: "Ethnic Wear", category: "Fashion", status: "Active" },
    { id: 14, name: "Footwear", category: "Fashion", status: "Active" },
    {
      id: 15,
      name: "Accessories & Belts",
      category: "Fashion",
      status: "Active",
    },
    {
      id: 16,
      name: "Jewelry & Watches",
      category: "Fashion",
      status: "Active",
    },

    { id: 17, name: "Furniture", category: "Home & Living", status: "Active" },
    {
      id: 18,
      name: "Home Decor",
      category: "Home & Living",
      status: "Inactive",
    },
    {
      id: 19,
      name: "Lighting & Decor",
      category: "Home & Living",
      status: "Inactive",
    },
    {
      id: 20,
      name: "Kitchen & Dining",
      category: "Home & Living",
      status: "Active",
    },
    {
      id: 21,
      name: "Home Improvement",
      category: "Home & Living",
      status: "Inactive",
    },
    {
      id: 22,
      name: "Cleaning Supplies",
      category: "Home & Living",
      status: "Active",
    },

    {
      id: 23,
      name: "Health & Wellness",
      category: "Health & Personal Care",
      status: "Active",
    },
    {
      id: 24,
      name: "Beauty & Personal Care",
      category: "Health & Personal Care",
      status: "Active",
    },
    {
      id: 25,
      name: "Perfumes & Fragrances",
      category: "Health & Personal Care",
      status: "Inactive",
    },
    {
      id: 26,
      name: "Personal Safety",
      category: "Health & Personal Care",
      status: "Active",
    },
    {
      id: 27,
      name: "Medical Equipment",
      category: "Health & Personal Care",
      status: "Inactive",
    },

    {
      id: 28,
      name: "Sports & Fitness",
      category: "Sports & Outdoors",
      status: "Inactive",
    },
    {
      id: 29,
      name: "Outdoor & Garden",
      category: "Sports & Outdoors",
      status: "Active",
    },
    {
      id: 30,
      name: "Power Tools",
      category: "Sports & Outdoors",
      status: "Active",
    },
    {
      id: 31,
      name: "Bike Accessories",
      category: "Sports & Outdoors",
      status: "Inactive",
    },
    {
      id: 32,
      name: "Car Care",
      category: "Sports & Outdoors",
      status: "Active",
    },

    {
      id: 33,
      name: "Books & Stationery",
      category: "Books & Stationery",
      status: "Active",
    },
    {
      id: 34,
      name: "Stationery Essentials",
      category: "Books & Stationery",
      status: "Active",
    },
    {
      id: 35,
      name: "Art & Craft",
      category: "Books & Stationery",
      status: "Active",
    },
    {
      id: 36,
      name: "Office Supplies",
      category: "Books & Stationery",
      status: "Inactive",
    },

    {
      id: 37,
      name: "Food & Beverages",
      category: "Food & Beverages",
      status: "Active",
    },
    {
      id: 38,
      name: "Beverages & Juices",
      category: "Food & Beverages",
      status: "Active",
    },
    {
      id: 39,
      name: "Snacks & Dry Fruits",
      category: "Food & Beverages",
      status: "Active",
    },
    {
      id: 40,
      name: "Organic Products",
      category: "Food & Beverages",
      status: "Inactive",
    },
    {
      id: 41,
      name: "Groceries",
      category: "Food & Beverages",
      status: "Inactive",
    },

    {
      id: 42,
      name: "Automotive Accessories",
      category: "Automotive",
      status: "Inactive",
    },
    {
      id: 43,
      name: "Hardware Tools",
      category: "Automotive",
      status: "Inactive",
    },
    {
      id: 44,
      name: "Industrial Supplies",
      category: "Automotive",
      status: "Active",
    },

    { id: 45, name: "Gift Items", category: "Miscellaneous", status: "Active" },
    {
      id: 46,
      name: "Party Supplies",
      category: "Miscellaneous",
      status: "Active",
    },
    {
      id: 47,
      name: "Seasonal Items",
      category: "Miscellaneous",
      status: "Active",
    },
    {
      id: 48,
      name: "Travel Accessories",
      category: "Miscellaneous",
      status: "Active",
    },
    {
      id: 49,
      name: "Baby Products",
      category: "Miscellaneous",
      status: "Active",
    },
    {
      id: 50,
      name: "Smart Home Devices",
      category: "Miscellaneous",
      status: "Active",
    },
  ]);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingSubCategory, setEditingSubCategory] =
    useState<SubCategoryState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAdd = () => {
    setEditingSubCategory(null); // reset editing Category
    setModalOpen(true);
  };

  const handleEdit = (item: SubCategoryState) => {
    setEditingSubCategory(item); // set Category to edit
    setModalOpen(true);
  };

  const handleDelete = (item: SubCategoryState) => {
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
        setSubCategories(subCategories.filter((c) => c.id !== item.id));
        Swal.fire("Deleted!", `"${item.name}" has been deleted.`, "success");
      }
    });
  };

  // Formik setup outside JSX
  const formik = useFormik({
    initialValues: {
      category: editingSubCategory ? editingSubCategory.category : "",
      name: editingSubCategory ? editingSubCategory.name : "",
      status: editingSubCategory
        ? editingSubCategory.status === "Active"
        : true,
    },
    validationSchema: Yup.object({
      category: Yup.string().required("Category is required"),
      name: Yup.string().required("Name is required"),
    }),
    enableReinitialize: true, // important to reset form values when editing
    onSubmit: (values) => {
      setIsLoading(true);
      if (editingSubCategory) {
        // Editing existing Product
        setSubCategories(
          subCategories.map((c) =>
            c.id === editingSubCategory.id
              ? {
                  ...c,
                  category: values.category,
                  name: values.name,
                  status: values.status ? "Active" : "Inactive",
                }
              : c
          )
        );
        Swal.fire({
          icon: "success",
          title: "Sub Category Updated",
          text: `"${values.name}" has been updated successfully!`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // Adding new Product
        const newProduct: SubCategoryState = {
          id: subCategories.length + 1,
          category: values.category,
          name: values.name,
          status: values.status ? "Active" : "Inactive",
        };
        setSubCategories([newProduct, ...subCategories]);
        Swal.fire({
          icon: "success",
          title: "Sub Category Added",
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
        title="Sub Category"
        data={subCategories}
        columns={[
          { key: "name", label: "Name" },
          { key: "category", label: "Category" },
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
        addButtonLabel="Add Sub Category"
      />

      {/* Tailwind Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0000007d] px-3">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-7">
              {editingSubCategory ? "Edit Sub Category" : "Add Sub Category"}
            </h2>
            <form
              onSubmit={formik.handleSubmit}
              className="flex flex-col gap-4"
            >
              <div className="mb-2">
                <label className="block mb-1 font-medium">Category</label>
                <Select
                  name="category"
                  options={categoryOptions}
                  value={
                    formik.values.category
                      ? categoryOptions.find(
                          (opt) => opt.value == formik.values.category
                        )
                      : null
                  }
                  onChange={(option) =>
                    formik.setFieldValue("category", option ? option.value : "")
                  }
                  placeholder="Select or search category..."
                  isSearchable
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: "12px",
                      padding: "2px",
                      backgroundColor: "#f5f7f9",
                      borderColor: "transparent",
                      boxShadow: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
                    }),
                  }}
                />
                {formik.touched.category && formik.errors.category ? (
                  <div className="text-red-500 text-sm mt-1 ms-2">
                    {formik.errors.category}
                  </div>
                ) : null}
              </div>

              <div className="mb-2">
                <label className="block mb-1 font-medium">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  placeholder="Enter Name"
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
                  {editingSubCategory ? "Update" : "Add"}
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

export default SubCategory;
