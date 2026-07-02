import { useLocation, useNavigate } from "react-router-dom";
import AddProducts from "./AddProduct2";
import type { Product } from "./Products";

const EditProduct = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const product = state as Product | undefined;

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">The product you're trying to edit doesn't exist or wasn't passed correctly.</p>
          <button 
            onClick={() => navigate("/products")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  // ✅ Log for debugging (optional)
  console.log("Editing product:", product.id, product.product_name);
  console.log("Platform charge from category:", product.category_details?.platform_charge);

  // ✅ Pass editData prop correctly to AddProducts component
  return <AddProducts isEdit={true} editData={product} />;
};

export default EditProduct;