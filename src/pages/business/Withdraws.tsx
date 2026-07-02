import React, { useState } from "react";
import DataTable from "../../components/common/DataTable";
import Swal from "sweetalert2";
import { MdDelete, MdDownloadDone, MdDownloading } from "react-icons/md";
import { motion } from "framer-motion";
import { div } from "framer-motion/client";
import { FaWallet } from "react-icons/fa";

const Withdraws = () => {
 const [balanceData] = useState([
    {
      label: "Current Balance",
      amount: 15000.75,
      textColor: "text-blue-600",
      icon: <FaWallet size={30} className="text-orange-400" />,
      showButton: true,
    },
    {
      label: "Requested Balance",
      amount: 2300.5,
      textColor: "text-yellow-600",
      icon: <MdDownloading size={30} className="text-blue-400" />,
      showButton: false,
    },
    {
      label: "Withdrawn Balance",
      amount: 8200.25,
      textColor: "text-green-600",
      icon: <MdDownloadDone size={30} className="text-green-500" />,
      showButton: false,
    },
  ]);

  const [withdrawals, setWithdrawals] = useState([
    {
      id: 1,
      amount: 500.0,
      requestTime: "2025-10-01 14:30",
      status: "Pending",
    },
    {
      id: 2,
      amount: 1000.0,
      requestTime: "2025-10-02 09:15",
      status: "Approved",
    },
    {
      id: 3,
      amount: 750.25,
      requestTime: "2025-10-03 16:45",
      status: "Denied",
    },
    {
      id: 4,
      amount: 300.5,
      requestTime: "2025-10-04 11:20",
      status: "Pending",
    },
  ]);

  const [filteredWithdrawals, setFilteredWithdrawals] = useState(withdrawals);
  const [filterStatus, setFilterStatus] = useState("All");

  const handleFilter = (status: any) => {
    setFilterStatus(status);
    if (status === "All") {
      setFilteredWithdrawals(withdrawals);
    } else {
      setFilteredWithdrawals(withdrawals.filter((w) => w.status === status));
    }
  };

  const handleWithdraw = () => {
    Swal.fire({
      title: "Initiate Withdrawal",
      text: "Would you like to request a withdrawal?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, request it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire(
          "Requested!",
          "Your withdrawal request has been submitted.",
          "success"
        );
      }
    });
  };

  const handleRemove = (item: any) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to remove the withdrawal request for $${item.amount}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedWithdrawals = withdrawals.filter((w) => w.id !== item.id);
        setWithdrawals(updatedWithdrawals);
        setFilteredWithdrawals(
          filterStatus === "All"
            ? updatedWithdrawals
            : updatedWithdrawals.filter((w) => w.status === filterStatus)
        );
        Swal.fire(
          "Removed!",
          "The withdrawal request has been removed.",
          "success"
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      {/* Balance Section */}
      <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold cursor-pointer">Withdraw</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {balanceData.map((item) => (
          <div
            key={item.label}
            className="bg-white shadow-sm rounded-lg p-4 flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <div>
                <div className={`font-bold ${item.textColor}`}>
                  ${item.amount.toFixed(2)}
                </div>
                <p className="text-gray-500 text-sm">{item.label}</p>
              </div>
            </div>

            {item.showButton && (
              <button className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition">
                Withdraw
              </button>
            )}
          </div>
        ))}
      </div>
    </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Filter Withdrawal Requests</h2>
        <div className="flex flex-wrap gap-4">
          {["All", "Pending", "Approved", "Denied"].map((status) => (
            <button
              key={status}
              onClick={() => handleFilter(status)}
              className={`px-4 py-2 rounded-lg ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              } cursor-pointer hover:bg-blue-500 hover:text-white`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Withdrawals Table */}
      <DataTable
        title="Withdrawal Requests"
        data={filteredWithdrawals}
        columns={[
          {
            key: "amount",
            label: "Amount",
            render: (item) => `$${item.amount.toFixed(2)}`,
          },
          { key: "requestTime", label: "Request Time" },
          {
            key: "status",
            label: "Status",
            render: (item) => (
              <span
                className={`text-sm font-semibold ${
                  item.status === "Pending"
                    ? "text-yellow-600"
                    : item.status === "Approved"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {item.status}
              </span>
            ),
          },
          {
            key: "action",
            label: "Action",
            render: (item) =>
              item.status === "Pending" ? (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleRemove(item)}
                  className="text-red-600 hover:text-red-800 transition-all cursor-pointer"
                  title="Delete"
                >
                  <MdDelete size={26} />
                </motion.button>
              ) : (
                <div className="ms-2">-</div>
              ),
          },
        ]}
      />
    </div>
  );
};

export default Withdraws;
