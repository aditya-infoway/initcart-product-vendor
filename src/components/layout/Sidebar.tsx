import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaChevronDown, FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface SidebarProps {
  menuItems: any[];
  sidebarOpen: boolean;
  isIconOnly: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  toggleIconOnly: () => void;
  handleMenuClick: (title: string, path: string) => void;
  activeMenu: string;
}

const Sidebar = ({
  menuItems,
  sidebarOpen,
  isIconOnly,
  isMobile,
  toggleSidebar,
  toggleIconOnly,
  handleMenuClick,
  activeMenu,
}: SidebarProps) => {
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  // ✅ Toggle logic — close other main menus when one opens
  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => {
      const depth = key.split("-").length; // Count parts (used to identify level)
      const newState = { ...prev };

      if (depth <= 3) {
        // 👉 Main menu level (category-item-index)
        const closedAll = Object.keys(prev).reduce((acc, k) => {
          // Close only other main-level menus
          if (k.split("-").length <= 3) acc[k] = false;
          return acc;
        }, {} as { [key: string]: boolean });

        return {
          ...prev,
          ...closedAll,
          [key]: !prev[key],
        };
      } else {
        // 👉 For submenus or deeper levels, toggle independently
        return {
          ...prev,
          [key]: !prev[key],
        };
      }
    });
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 bg-gradient-to-b from-indigo-900 via-blue-900 to-blue-950 shadow-xl border-r border-transparent text-white
          ${sidebarOpen ? (isIconOnly ? "w-20" : "w-64") : "w-0"} 
          flex flex-col
          ${isMobile ? "fixed" : "lg:fixed"} top-0 left-0 z-50
          h-screen overflow-hidden`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between py-4 border-b border-blue-800 ${
            isIconOnly ? "px-2 justify-center" : "px-4"
          }`}
        >
          {!isIconOnly && (
            <h1 className="font-bold tracking-wide text-white text-lg">
              Product Vendor
            </h1>
          )}
          <button
            onClick={isMobile ? toggleSidebar : toggleIconOnly}
            className="text-white hover:text-gray-200"
          >
            {sidebarOpen && !isIconOnly ? (
              <FaChevronLeft />
            ) : (
              <FaChevronRight />
            )}
          </button>
        </div>

        {/* Sidebar Menu */}
        <div className="flex-1 overflow-y-auto mt-3 px-2 space-y-6 pb-5 no-scrollbar">
          {menuItems.map((section: any, idx: number) => (
            <div key={idx}>
              {sidebarOpen && section.category && (
                <h2 className="text-xs font-semibold uppercase text-gray-400 px-3 mb-2">
                  {section.category}
                </h2>
              )}

              <div className="space-y-1">
                {section.items.map((item: any, itemIdx: number) => {
                  const itemKey = `${section.category || "root"}-${
                    item.title
                  }-${itemIdx}`;

                  return (
                    <div key={itemKey}>
                      <button
                        className={`flex cursor-pointer items-center ${
                          sidebarOpen ? "justify-between px-3" : "justify-center"
                        } w-full py-2 rounded-lg transition-all duration-200 ${
                          activeMenu === itemKey
                            ? "bg-blue-800 shadow-inner"
                            : "hover:bg-blue-900"
                        }`}
                        onClick={() => {
                          if (item.submenu.length > 0) toggleMenu(itemKey);
                          else handleMenuClick(itemKey, item.to || "/");
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span
                            className={`text-sm ${
                              sidebarOpen ? "block" : "hidden"
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>

                        {item.submenu.length > 0 && sidebarOpen && (
                          <FaChevronDown
                            className={`transition-transform duration-200 ${
                              openMenus[itemKey] ? "rotate-180" : ""
                            }`}
                            size={14}
                          />
                        )}
                      </button>

                      {/* Submenu */}
                      <AnimatePresence>
                        {openMenus[itemKey] && sidebarOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="pl-10 pr-2 flex flex-col space-y-1 mt-1"
                          >
                            {item.submenu.map((sub: any, i: number) => {
                              const subKey = `${itemKey}-${sub.name}-${i}`;

                              return (
                                <div key={subKey}>
                                  <button
                                    onClick={() => {
                                      if (sub.submenu?.length > 0)
                                        toggleMenu(subKey);
                                      else handleMenuClick(subKey, sub.to);
                                    }}
                                    className={`text-sm text-left rounded-lg py-1.5 px-2 flex justify-between items-center transition-all cursor-pointer duration-200 ${
                                      activeMenu === subKey
                                        ? "bg-blue-800 text-white"
                                        : "text-gray-300 hover:text-white hover:bg-blue-900"
                                    }`}
                                  >
                                    <span>{sub.name}</span>
                                    {sub.submenu?.length > 0 && (
                                      <FaChevronDown
                                        className={`transition-transform ms-3 duration-200 ${
                                          openMenus[subKey] ? "rotate-180" : ""
                                        }`}
                                        size={12}
                                      />
                                    )}
                                  </button>

                                  {/* Sub-submenu */}
                                  <AnimatePresence>
                                    {openMenus[subKey] &&
                                      sub.submenu?.length > 0 && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{
                                            height: "auto",
                                            opacity: 1,
                                          }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.25 }}
                                          className="pl-6 pr-2 flex flex-col space-y-1 mt-1"
                                        >
                                          {sub.submenu.map(
                                            (ss: any, j: number) => {
                                              const ssKey = `${subKey}-${ss.name}-${j}`;
                                              return (
                                                <button
                                                  key={ssKey}
                                                  onClick={() =>
                                                    handleMenuClick(
                                                      ssKey,
                                                      ss.to
                                                    )
                                                  }
                                                  className={`text-sm text-left rounded-lg py-1 px-2 transition-all duration-200 ${
                                                    activeMenu === ssKey
                                                      ? "bg-blue-800 text-white"
                                                      : "text-gray-400 hover:text-white hover:bg-blue-900"
                                                  }`}
                                                >
                                                  {ss.name}
                                                </button>
                                              );
                                            }
                                          )}
                                        </motion.div>
                                      )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;
