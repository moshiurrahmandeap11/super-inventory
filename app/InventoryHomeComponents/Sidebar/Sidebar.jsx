"use client";
import axiosInstance, {
  baseImageURL,
} from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Sidebar = ({ isOpen, selectedItem, onItemSelect }) => {
  const router = useRouter();
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [user, setUser] = useState(null);
  const [version, setVersion] = useState(null);

  useEffect(() => {
    const tryFetchingVersion = async () => {
      try {
        const res = await axiosInstance.get("/version");

        if (res.data.success) {
          setVersion(res.data.version);
        }
      } catch (error) {
        console.error("Version fetch failed", error);
      }
    };

    tryFetchingVersion();
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const tryFetchingUser = async () => {
      const res = await axiosInstance.get(`/users/${userId}`);
      setUser(res.data.data);
    };
    tryFetchingUser();
  }, []);

  // Sidebar menu items
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      path: "/inventory-home",
    },
    {
      id: "products",
      label: "Products",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      path: "/inventory-home/products",
    },
    {
      id: "orders",
      label: "Orders",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      path: "/inventory/orders",
    },
    {
      id: "customers",
      label: "Customers",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-6.393a9 9 0 01-13.5 6.393"
          />
        </svg>
      ),
      path: "/inventory-home/customers",
    },
    {
      id: "categories",
      label: "Categories",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      ),
      path: "/inventory-home/categories",
    },
    {
      id: "reports",
      label: "Reports",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      submenu: [
        {
          id: "sales-report",
          label: "Sales Report",
          path: "/inventory/reports/sales",
        },
        {
          id: "stock-report",
          label: "Stock Report",
          path: "/inventory/reports/stock",
        },
        {
          id: "profit-loss",
          label: "Profit & Loss",
          path: "/inventory/reports/profit-loss",
        },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      path: "/inventory/settings",
    },
  ];

  const handleItemClick = (item) => {
    if (item.submenu) {
      setExpandedMenu(expandedMenu === item.id ? null : item.id);
    } else {
      onItemSelect(item.id);
      if (item.path) {
        router.push(item.path);
      }
    }
  };

  const isItemActive = (item) => {
    if (item.submenu) {
      return item.submenu.some((subItem) => selectedItem === subItem.id);
    }
    return selectedItem === item.id;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-50 z-30 lg:hidden"
          onClick={() => onItemSelect(selectedItem)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static top-16 left-0 h-[calc(100vh-4rem)] 
        bg-white shadow-lg lg:shadow-none z-40 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-16"}
        w-64 lg:w-64
      `}
      >
        {/* Sidebar Content */}
        <div className="h-full flex flex-col">
          {/* User Info (Hidden when collapsed) */}
          <div
            className={`p-4 border-b border-gray-200 ${!isOpen && "lg:hidden"}`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  <img
                    src={`${baseImageURL}${user?.avatar}`}
                    alt={user?.fullName}
                    className="w-10 h-10 rounded-full"
                  />
                </span>
              </div>
              <div className={!isOpen ? "lg:hidden" : ""}>
                <h3 className="font-semibold text-gray-800">
                  Inventory {user?.role}
                </h3>
                <p className="text-xs text-gray-500">{user?.fullName}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 
                      rounded-lg transition-all duration-200
                      ${
                        isItemActive(item)
                          ? "bg-blue-50 text-blue-600 border border-blue-100"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                      ${!isOpen && "lg:justify-center lg:px-2"}
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`${isItemActive(item) ? "text-blue-600" : "text-gray-500"}`}
                      >
                        {item.icon}
                      </span>
                      <span className={`font-medium ${!isOpen && "lg:hidden"}`}>
                        {item.label}
                      </span>
                    </div>

                    {/* Submenu Indicator */}
                    {item.submenu && (
                      <svg
                        className={`w-4 h-4 transition-transform ${!isOpen && "lg:hidden"} ${
                          expandedMenu === item.id ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Submenu Items */}
                  {item.submenu && expandedMenu === item.id && (
                    <div
                      className={`mt-1 ml-2 pl-8 space-y-1 ${!isOpen && "lg:hidden"}`}
                    >
                      {item.submenu.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => {
                            onItemSelect(subItem.id);
                            if (subItem.path) {
                              router.push(subItem.path);
                            }
                          }}
                          className={`
                            w-full text-left px-3 py-2 rounded-lg text-sm
                            transition-colors duration-200
                            ${
                              selectedItem === subItem.id
                                ? "bg-blue-100 text-blue-600 font-medium"
                                : "text-gray-600 hover:bg-gray-100"
                            }
                          `}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div
            className={`p-4 border-t border-gray-200 ${!isOpen && "lg:hidden"}`}
          >
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-2">Need help?</p>
              <a href="https://moshiurrahman.online" target="_blank">
                <button className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors">
                  Contact Support
                </button>
              </a>
            </div>

            {/* Version Info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">v{version}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
