import { useState, useEffect, useRef } from "react";
import { FaBars } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { toAbsoluteUrl } from "../../utils/reuseable";
import { useAuthStore } from "../../store/authStore";
import Sidebar from "./Sidebar";
import { MdDashboard } from "react-icons/md";

import { FaShoppingCart } from "react-icons/fa";
import { AiFillProduct } from "react-icons/ai";
import { BiSolidStar } from "react-icons/bi";
import { RiCoupon3Fill, RiFileList3Fill, RiBarChartBoxFill, RiShoppingBag3Fill } from "react-icons/ri";
import { HiReceiptRefund } from "react-icons/hi";
import { PiHandWithdrawFill } from "react-icons/pi";

interface SubSubMenu {
  name: string;
  to: string;
}

interface SubMenu {
  name: string;
  to?: string;
  submenu?: SubSubMenu[];
}

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  to?: string;
  submenu?: SubMenu[];
}

interface MenuCategory {
  category?: string;
  items: MenuItem[];
}

// Menu items remain the same as provided
export const menuItems: MenuCategory[] = [
  {
    category: "Main",
    items: [
      {
        title: "Dashboard",
        icon: <MdDashboard size={20} />,
        to: "/",
        submenu: [],
      },
    ],
  },
  {
    category: "Orders",

    items: [
      {
        title: "Orders",
        icon: <AiFillProduct size={20} />,
        to: "/allorders",
        submenu: [],
      },
      {
        title: "Refund Requests",
        icon: <HiReceiptRefund size={20} />,
        submenu: [
          { name: "Pending", to: "/pendingrefund" },
          { name: "Approved", to: "/approvedrefund" },
          { name: "Refunded", to: "/refundedrefund" },
          { name: "Rejected", to: "/rejectedrefund" },
        ],
      },
    ],
  },
  {
    category: "Product Management",
    items: [
      {
        title: "Products",
        icon: <AiFillProduct size={20} />,
        to: "/products",
        submenu: [],
      },

      {
        title: "Product Reviews",
        icon: <BiSolidStar size={20} />,
        to: "/productreviews",
        submenu: [],
      },
    ],
  },
  {
    category: "Promotion Management",
    items: [
      {
        title: "Coupons",
        icon: <RiCoupon3Fill size={20} />,
        to: "/coupons",
        submenu: [],
      },
    ],
  },
  {
    category: "Deals & Campaigns",
    items: [
      {
        title: "Deals & Campaigns",
        icon: <RiCoupon3Fill size={20} />,
        to: "/deals",
        submenu: [],
      },
    ],
  },
  {
    category: "Reports & analytics",
    items: [
      {
        title: "Transaction report",
        icon: <RiFileList3Fill size={20} />,
        to: "/transactionsreport",
        submenu: [],
      },
      {
        title: "Product report",
        icon: <RiBarChartBoxFill size={20} />,
        to: "/productreport",
        submenu: [],
      },
      {
        title: "Order Report",
        icon: <RiShoppingBag3Fill size={20} />,
        to: "/orderreport",
        submenu: [],
      },
    ],
  },
  {
    category: "BUSINESS SECTION",
    items: [
      {
        title: "Withdraws",
        icon: <PiHandWithdrawFill size={20} />,
        to: "/withdraws",
        submenu: [],
      },
    ],
  },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [isIconOnly, setIsIconOnly] = useState(false); // Toggle between full and icon-only sidebar
  const [isMobile, setIsMobile] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string>("Dashboard");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  // Detect screen size and set initial states
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile); // Open by default on desktop, closed on mobile
      setIsIconOnly(false); // Reset icon-only mode on resize
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close profile dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update active menu based on current route
  useEffect(() => {
    const path = location.pathname;
    for (const category of menuItems) {
      for (const item of category.items) {
        if (item.to && item.to === path) {
          setActiveMenu(item.title);
          return;
        }
        if (item.submenu && item.submenu.length > 0) {
          const matchedSub = item.submenu.find((s) => s.to === path);
          if (matchedSub) {
            setActiveMenu(matchedSub.name);
            return;
          }
        }
      }
    }
  }, [location.pathname]);

  const handleMenuClick = (title: string, path: string) => {
    setActiveMenu(title);
    navigate(path);
    if (isMobile) setSidebarOpen(false); // Close sidebar on mobile after click
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const toggleIconOnly = () => {
    setIsIconOnly((prev) => !prev);
  };

  return (
    <div className="flex flex-col lg:flex-row bg-gray-100 min-h-screen overflow-y-hidden">
      {/* Sidebar */}
      <Sidebar
        menuItems={menuItems}
        sidebarOpen={sidebarOpen}
        isIconOnly={isIconOnly}
        isMobile={isMobile}
        toggleSidebar={toggleSidebar}
        toggleIconOnly={toggleIconOnly}
        handleMenuClick={handleMenuClick}
        activeMenu={activeMenu}
      />

      <div
        className={`flex-1 flex flex-col min-h-screen overflow-y-hidden transition-all duration-300 
         ${isMobile && sidebarOpen ? "opacity-50" : ""}`}
      >
        {/* Header */}
        <div className="flex justify-between lg:justify-end items-center px-4 py-1 bg-white shadow">
          <button onClick={toggleSidebar} className="lg:hidden">
            <FaBars size={24} />
          </button>
          <div className="relative" ref={menuRef}>
            <div
              className="flex items-center gap-4 cursor-pointer"
              onClick={() => setOpen((prev) => !prev)}
            >
              <img
                src={toAbsoluteUrl("media/icons/profile.jpg")}
                height={40}
                width={40}
                alt="Profile"
                className="rounded-full hover:ring-gray-300 transition-all duration-200"
              />
            </div>
            {open && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                <button
                  onClick={() => {
                    navigate("/profile");
                    setOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition cursor-pointer"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={`p-4 flex-1 ${isIconOnly ? "lg:ms-20" : "lg:ms-64"}  `}>{children}</div>
      </div>
    </div>
  );
};

export default AppLayout;