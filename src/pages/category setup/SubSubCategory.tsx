import { useState } from "react";
import DataTable from "../../components/common/DataTable";
import ToggleSwitch from "../../components/common/ToggleSwitch";
import { useFormik } from "formik";
import Swal from "sweetalert2";
import Select from "react-select";
import * as Yup from "yup";

interface SubSubCategoryState {
  id: number;
  name: string;
  subCategory: string;
  status: "Active" | "Inactive";
}

const subCategoryOptions = [
  { value: "Mobile Phones", label: "Mobile Phones" },
  { value: "Laptops & Tablets", label: "Laptops & Tablets" },
  { value: "Mobile Accessories", label: "Mobile Accessories" },
  { value: "Cameras & Photography", label: "Cameras & Photography" },
  { value: "Smart Wearables", label: "Smart Wearables" },
  { value: "Televisions", label: "Televisions" },
  { value: "Washing Machines", label: "Washing Machines" },
  { value: "Refrigerators", label: "Refrigerators" },
  { value: "Printers & Scanners", label: "Printers & Scanners" },
  { value: "Drone & Action Cameras", label: "Drone & Action Cameras" },
  { value: "Men’s Fashion", label: "Men’s Fashion" },
  { value: "Women’s Fashion", label: "Women’s Fashion" },
  { value: "Ethnic Wear", label: "Ethnic Wear" },
  { value: "Footwear", label: "Footwear" },
  { value: "Accessories & Belts", label: "Accessories & Belts" },
  { value: "Jewelry & Watches", label: "Jewelry & Watches" },
  { value: "Furniture", label: "Furniture" },
  { value: "Home Decor", label: "Home Decor" },
  { value: "Lighting & Decor", label: "Lighting & Decor" },
  { value: "Kitchen & Dining", label: "Kitchen & Dining" },
  { value: "Home Improvement", label: "Home Improvement" },
  { value: "Cleaning Supplies", label: "Cleaning Supplies" },
  { value: "Health & Wellness", label: "Health & Wellness" },
  { value: "Beauty & Personal Care", label: "Beauty & Personal Care" },
  { value: "Perfumes & Fragrances", label: "Perfumes & Fragrances" },
  { value: "Personal Safety", label: "Personal Safety" },
  { value: "Medical Equipment", label: "Medical Equipment" },
  { value: "Sports & Fitness", label: "Sports & Fitness" },
  { value: "Outdoor & Garden", label: "Outdoor & Garden" },
  { value: "Power Tools", label: "Power Tools" },
  { value: "Bike Accessories", label: "Bike Accessories" },
  { value: "Car Care", label: "Car Care" },
  { value: "Books & Stationery", label: "Books & Stationery" },
  { value: "Stationery Essentials", label: "Stationery Essentials" },
  { value: "Art & Craft", label: "Art & Craft" },
  { value: "Office Supplies", label: "Office Supplies" },
  { value: "Food & Beverages", label: "Food & Beverages" },
  { value: "Beverages & Juices", label: "Beverages & Juices" },
  { value: "Snacks & Dry Fruits", label: "Snacks & Dry Fruits" },
  { value: "Organic Products", label: "Organic Products" },
  { value: "Groceries", label: "Groceries" },
  { value: "Automotive Accessories", label: "Automotive Accessories" },
  { value: "Hardware Tools", label: "Hardware Tools" },
  { value: "Industrial Supplies", label: "Industrial Supplies" },
  { value: "Gift Items", label: "Gift Items" },
  { value: "Party Supplies", label: "Party Supplies" },
  { value: "Seasonal Items", label: "Seasonal Items" },
  { value: "Travel Accessories", label: "Travel Accessories" },
  { value: "Baby Products", label: "Baby Products" },
  { value: "Smart Home Devices", label: "Smart Home Devices" },
];

const SubSubCategory = () => {
 const [subSubCategories, setSubSubCategories] = useState<SubSubCategoryState[]>([
    { id: 1, subCategory: "Mobile Phones", name: "Android Phones", status: "Active" },
    { id: 2, subCategory: "Mobile Phones", name: "iPhones", status: "Inactive" },
    { id: 3, subCategory: "Laptops & Tablets", name: "Gaming Laptops", status: "Active" },
    { id: 4, subCategory: "Laptops & Tablets", name: "MacBooks", status: "Active" },
    { id: 5, subCategory: "Men’s Fashion", name: "Casual Shirts", status: "Active" },
    { id: 6, subCategory: "Men’s Fashion", name: "Formal Shirts", status: "Inactive" },
    { id: 7, subCategory: "Home Decor", name: "Wall Art", status: "Active" },
    { id: 8, subCategory: "Home Decor", name: "Clocks", status: "Inactive" },
    { id: 9, subCategory: "Beauty & Personal Care", name: "Makeup Kits", status: "Active" },
    { id: 10, subCategory: "Beauty & Personal Care", name: "Hair Care", status: "Active" },
  ]);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingSubSubCategory, setEditingSubSubCategory] =
    useState<SubSubCategoryState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAdd = () => {
    setEditingSubSubCategory(null); // reset editing Category
    setModalOpen(true);
  };

  const handleEdit = (item: SubSubCategoryState) => {
    setEditingSubSubCategory(item); // set Category to edit
    setModalOpen(true);
  };

  const handleDelete = (item: SubSubCategoryState) => {
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
        setSubSubCategories(subSubCategories.filter((c) => c.id !== item.id));
        Swal.fire("Deleted!", `"${item.name}" has been deleted.`, "success");
      }
    });
  };

  //   const handleToggleStatus = (id: number) => {
  //     setEditingSubCategory((prev) =>
  //       prev.map((c) =>
  //         c.id === id
  //           ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" }
  //           : c
  //       )
  //     );
  //   };

  // Formik setup outside JSX
  const formik = useFormik({
    initialValues: {
      subCategory: editingSubSubCategory ? editingSubSubCategory.subCategory : "",
      name: editingSubSubCategory ? editingSubSubCategory.name : "",
      status: editingSubSubCategory
        ? editingSubSubCategory.status === "Active"
        : true,
    },
    validationSchema: Yup.object({
      subCategory: Yup.string().required("Sub Category is required"),
      name: Yup.string().required("Name is required"),
    }),
    enableReinitialize: true, // important to reset form values when editing
    onSubmit: (values) => {
      setIsLoading(true);
      if (editingSubSubCategory) {
        // Editing existing Product
        setSubSubCategories(
          subSubCategories.map((c) =>
            c.id === editingSubSubCategory.id
              ? {
                  ...c,
                  subCategory: values.subCategory,
                  name: values.name,
                  status: values.status ? "Active" : "Inactive",
                }
              : c
          )
        );
        Swal.fire({
          icon: "success",
          title: "Sub Sub Category Updated",
          text: `"${values.name}" has been updated successfully!`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // Adding new Product
        const newProduct: SubSubCategoryState = {
          id: subSubCategories.length + 1,
          subCategory: values.subCategory,
          name: values.name,
          status: values.status ? "Active" : "Inactive",
        };
        setSubSubCategories([newProduct, ...subSubCategories]);
        Swal.fire({
          icon: "success",
          title: "Sub Sub Category Added",
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
        title="Sub Sub Category"
        data={subSubCategories}
        columns={[
          // { key: "name", label: "Category Name" },
          { key: "name", label: "Name" },
          { key: "subCategory", label: "Sub Category" },
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
        addButtonLabel="Add Sub Sub Category"
      />

      {/* Tailwind Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0000007d] px-3">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-7">
              {editingSubSubCategory ? "Edit Sub Category" : "Add Sub Category"}
            </h2>
            <form
              onSubmit={formik.handleSubmit}
              className="flex flex-col gap-4"
            >
              <div className="mb-2">
                <label className="block mb-1 font-medium">Sub Category</label>
                <Select
                  name="subCategory"
                  options={subCategoryOptions}
                  value={
                    formik.values.subCategory
                      ? subCategoryOptions.find(
                          (opt) => opt.value == formik.values.subCategory
                        )
                      : null
                  }
                  onChange={(option) =>
                    formik.setFieldValue("subCategory", option ? option.value : "")
                  }
                  placeholder="Select or search Sub Category..."
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
                {formik.touched.subCategory && formik.errors.subCategory ? (
                  <div className="text-red-500 text-sm mt-1 ms-2">
                    {formik.errors.subCategory}
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
                  {editingSubSubCategory ? "Update" : "Add"}
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

export default SubSubCategory;
