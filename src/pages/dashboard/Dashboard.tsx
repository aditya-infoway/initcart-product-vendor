import React from "react";
import { ProductStatistics } from "../../components/ProductStatistics";
import { TopProductList } from "../../components/TopProductList";
import BusinessAnalytics from "../../components/BusinessAnalytics";

const Dashboard = () => {
  return (
    <div>
      <div className="mb-5">
        <BusinessAnalytics />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 w-full mt-5">
        <div className="w-full flex">
          <ProductStatistics
            className="shadow-lg border border-gray-200 rounded-2xl w-full"
            chartColor="primary"
            chartHeight="100%"
          />
        </div>

        <div className="w-full">
          <TopProductList />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
