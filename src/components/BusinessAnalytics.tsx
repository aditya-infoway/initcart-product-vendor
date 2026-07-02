import { type FC, type JSX } from "react";
import { MdOutlinePendingActions, MdOutlineCancel, MdOutlineAttachMoney } from "react-icons/md";
import { FaBoxOpen, FaMoneyCheckAlt, FaCashRegister } from "react-icons/fa";
import {
  AiOutlineCheckCircle,
  AiOutlineSend,
  AiOutlineUser,
} from "react-icons/ai";
import { TbTruckDelivery } from "react-icons/tb";
import { GiReceiveMoney } from "react-icons/gi";
import { BsCurrencyExchange } from "react-icons/bs";
import { EarningCard } from "./EarningCard";

interface StatsItem {
  label: string;
  count: number;
  icon: JSX.Element;
  bgColor?: string;
  textColor?: string;
}

interface WalletItem {
  label: string;
  count: number | string;
  icon: JSX.Element;
  bgColor?: string;
}

const businessStats: StatsItem[] = [
  {
    label: "Total Orders",
    count: 195,
    icon: <MdOutlinePendingActions size={24} />,
    bgColor: "from-blue-500 to-indigo-500",
  },
  {
    label: "Total Products",
    count: 402,
    icon: <FaBoxOpen size={24} />,
    bgColor: "from-orange-400 to-amber-500",
  },
  {
    label: "Total Customers",
    count: 7,
    icon: <AiOutlineUser size={24} />,
    bgColor: "from-green-400 to-emerald-500",
  },
];

const vendorWallet: WalletItem[] = [
  {
    label: "Pending Withdraw",
    count: "500",
    icon: <MdOutlinePendingActions size={22} />,
    bgColor: "from-blue-400 to-indigo-500",
  },
  {
    label: "Total Commission Given",
    count: "6,401",
    icon: <BsCurrencyExchange size={22} />,
    bgColor: "from-purple-400 to-pink-500",
  },
  {
    label: "Already Withdrawn",
    count: "600",
    icon: <FaMoneyCheckAlt size={22} />,
    bgColor: "from-teal-400 to-cyan-500",
  },
  {
    label: "Total Delivery Charge Earned",
    count: "822",
    icon: <GiReceiveMoney size={22} />,
    bgColor: "from-amber-400 to-orange-500",
  },
  {
    label: "Total Tax Given",
    count: "2,534",
    icon: <MdOutlineAttachMoney size={22} />,
    bgColor: "from-red-400 to-rose-500",
  },
  {
    label: "Collected Cash",
    count: "25,756",
    icon: <FaCashRegister size={22} />,
    bgColor: "from-green-400 to-emerald-500",
  },
];

const orderStatus: StatsItem[] = [
  { label: "Pending", count: 58, icon: <MdOutlinePendingActions size={20} />, textColor: "text-blue-700" },
  { label: "Confirmed", count: 21, icon: <AiOutlineCheckCircle size={20} />, textColor: "text-green-600" },
  { label: "Packaging", count: 9, icon: <FaBoxOpen size={20} />, textColor: "text-yellow-600" },
  { label: "Out for delivery", count: 0, icon: <AiOutlineSend size={20} />, textColor: "text-purple-600" },
  { label: "Delivered", count: 81, icon: <TbTruckDelivery size={20} />, textColor: "text-green-700" },
  { label: "Canceled", count: 9, icon: <MdOutlineCancel size={20} />, textColor: "text-red-600" },
  { label: "Returned", count: 4, icon: <AiOutlineSend size={20} />, textColor: "text-pink-600" },
  { label: "Failed to delivery", count: 0, icon: <MdOutlineCancel size={20} />, textColor: "text-red-500" },
];

const BusinessAnalytics: FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <h2 className="flex items-center text-gray-900 font-semibold text-xl tracking-wide">
        <FaBoxOpen className="mr-2 text-indigo-600" /> Business Analytics
      </h2>

      {/* Business Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {businessStats.map((stat) => (
          <div
            key={stat.label}
            className="relative bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300 p-5 flex items-center justify-between"
          >
            <div>
              <p className="text-gray-500 font-medium">{stat.label}</p>
              <p className="text-gray-900 text-2xl font-extrabold mt-1">
                {stat.count}
              </p>
            </div>
            <div
              className={`p-3 rounded-xl bg-gradient-to-br ${stat.bgColor} text-white shadow-sm`}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Order Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Order Status Overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
          {orderStatus.map((status) => (
            <div
              key={status.label}
              className="group bg-gradient-to-br from-gray-50 to-white hover:from-indigo-50 hover:to-white shadow-sm hover:shadow-md transition-all duration-300 rounded-xl p-4 text-center"
            >
              <div className="flex justify-center mb-2">{status.icon}</div>
              <p className="text-gray-600 font-medium mb-1">{status.label}</p>
              <div
                className={`font-bold text-lg ${status.textColor} group-hover:scale-110 transform transition-transform duration-300`}
              >
                {status.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings Card */}
      <EarningCard
        className="w-full"
        onFilterChange={(value) => console.log("Filter changed to:", value)}
      />

      {/* Vendor Wallet Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Vendor Wallet Overview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
          {vendorWallet.map((wallet) => (
            <div
              key={wallet.label}
              className="relative bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300 p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-gray-500 font-medium">{wallet.label}</p>
                <p className="text-gray-900 text-xl font-extrabold mt-1">{wallet.count}</p>
              </div>
              <div
                className={`p-3 rounded-xl bg-gradient-to-br ${wallet.bgColor} text-white shadow-sm`}
              >
                {wallet.icon}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessAnalytics;
