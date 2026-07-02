import React, { useState } from "react";
import type {
  FilterOption,
  FilterState,
} from "../../components/common/FilterOrder";
import DataTable from "../../components/common/DataTable";
import { useNavigate } from "react-router-dom";

const orderTypes: FilterOption[] = [
  { label: "In House Order", value: "inHouseOrder" },
  { label: "Vendor Order", value: "vendorOrder" },
  { label: "POS Order", value: "posorder" },
];

const stores: FilterOption[] = [
  { label: "All shop", value: "all" },
  { label: "Shop 1", value: "shop1" },
  { label: "Shop 2", value: "shop2" },
];

const customers: FilterOption[] = [
  { label: "All customer", value: "all" },
  { label: "John Doe", value: "john" },
  { label: "Jane Smith", value: "jane" },
];

interface RefundOrder {
  id: number;
  refundId: string;
  orderId: string;
  productInfo: string;
  customerInfo: string;
  totalAmount: string;
}
const ApprovedRefund = () => {
  const handleApply = (filters: FilterState) => {
    console.log("Applied Filters:", filters);
  };
  const navigate = useNavigate();

  const [orders, setOrders] = useState<RefundOrder[]>([
    {
      id: 1,
      refundId: "R-1001",
      orderId: "100199",
      productInfo: "Wireless Headphones (x1)",
      customerInfo: "MD Rakib Hasan | +12345656787",
      totalAmount: "$2,875.00",
    },
    {
      id: 2,
      refundId: "R-1002",
      orderId: "100198",
      productInfo: "Smart Watch (x2)",
      customerInfo: "Rakibul Hasan | +11234567890",
      totalAmount: "$2,944.00",
    },
    {
      id: 3,
      refundId: "R-1003",
      orderId: "100195",
      productInfo: "Bluetooth Speaker (x1)",
      customerInfo: "Robert Downey | +15551112222",
      totalAmount: "$223.00",
    },
  ]);

  const handleViewRefund = () => {
    navigate("#");
  };

  return (
    <>
      <DataTable
        title="Approved Refund Request"
        data={orders}
        columns={[
          { key: "refundId", label: "Refund Id" },
          { key: "orderId", label: "Order ID" },
          { key: "productInfo", label: "Product Info" },
          { key: "customerInfo", label: "Customer Info" },
          { key: "totalAmount", label: "Total Amount" },
        ]}
        onView={() => handleViewRefund()}
      />
    </>
  );
};

export default ApprovedRefund;
