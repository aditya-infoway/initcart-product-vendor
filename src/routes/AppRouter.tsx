import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import ProductCategory from "../pages/product&service/ProductCategory";
import ServiceCategory from "../pages/product&service/ServiceCategory";
import ProductVendor from "../pages/vendor/ProductVendor";
import ServiceVendor from "../pages/vendor/ServiceVendor";
import SubCategory from "../pages/category setup/SubCategory";
import SubSubCategory from "../pages/category setup/SubSubCategory";
import All from "../pages/orders/All";
import PendingRefund from "../pages/refund request/PendingRefund";
import ApprovedRefund from "../pages/refund request/ApprovedRefund";
import RefundedRefund from "../pages/refund request/RefundedRefund";
import RejectedRefund from "../pages/refund request/RejectedRefund";
import Coupons from "../pages/coupons/Coupons";
import ProductReviews from "../pages/productmanagement/ProductReviews";
import Withdraws from "../pages/business/Withdraws";
import TransactionsReport from "../pages/report/TransactionsReport";
import ProductReport from "../pages/report/ProductReport";
import OrderReport from "../pages/report/OrderReport";
import Products from "../pages/productmanagement/Products";
import Profile from "../pages/profile/Profile";
import EditProduct from "../pages/productmanagement/EditProduct";
import CouponForm from "../pages/coupons/CouponForm";
import VendorCampaigns from "../pages/campaigns/vendorCampaigns";
import VendorCouponUsage from "../pages/coupons/CouponUsage";
import OrderDetailsPage from "../pages/orders/OrderDetails";
import AddProducts from "../pages/productmanagement/AddProduct2";



const AppRouter = () => {
  return (
    <BrowserRouter basename="/productvendor">
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>
      {/* Private Routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/productcategory" element={<ProductCategory />} />
        <Route path="/servicecategory" element={<ServiceCategory />} />
        <Route path="/productvendor" element={<ProductVendor />} />
        <Route path="/servicevendor" element={<ServiceVendor />} />
        <Route path="/subcategory" element={<SubCategory />} />
        <Route path="/subsubcategory" element={<SubSubCategory />} />
        <Route path="/allorders" element={<All />} />
        <Route path="/order/:orderId" element={<OrderDetailsPage />} /> 

        <Route path="/pendingrefund" element={<PendingRefund />} />
        <Route path="/approvedrefund" element={<ApprovedRefund />} />
        <Route path="/refundedrefund" element={<RefundedRefund />} />
        <Route path="/rejectedrefund" element={<RejectedRefund />} />

        <Route path="/transactionsreport" element={<TransactionsReport />} />
        <Route path="/productreport" element={<ProductReport />} />
        <Route path="/orderreport" element={<OrderReport />} />
        <Route path="/deals" element={<VendorCampaigns/>}/>

        <Route path="/productreviews" element={<ProductReviews />} />
        <Route path="/products" element={<Products />} />
        <Route path="/addproduct" element={<AddProducts />} />
        <Route path="/editproduct" element={<EditProduct />} />
        <Route path="/coupons/add" element={<CouponForm />} />
        <Route path="/coupons/edit/:id" element={<CouponForm />} />

        <Route path="/coupons" element={<Coupons />} />
        <Route path="/coupons/usage/:couponId"  element={<VendorCouponUsage />} />
        
        <Route path="/withdraws" element={<Withdraws />} />

        {/* Add more protected routes */}
      </Route>

      {/* <Route path="*" element={<NotFound />} /> <==== ADD LATER */}
    </Routes>
  </BrowserRouter>
);
};

export default AppRouter;
