"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiChevronDown,
  FiFileText,
  FiHome,
  FiPackage,
  FiShoppingCart,
  FiUsers
} from "react-icons/fi";

const Sidebar = ({ isOpen, onToggle }) => {
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const closeSidebarOnMobile = () => {
    if (isMobile && onToggle) {
      onToggle();
    }
  };

  const handleNavigation = (path) => {
    router.push(path);
    closeSidebarOnMobile();
  };

  const handleSubmenuToggle = (index) => {
    if (openSubmenu === index) {
      setOpenSubmenu(null);
    } else {
      setOpenSubmenu(index);
    }
  };

  const menuItems = [
    {
      label: "Dashboard",
      icon: <FiHome className="text-lg" />,
      path: "/inventory-home",
      exact: true,
    },
    {
      label: "Products Manager",
      icon: <FiPackage className="text-lg" />,
      submenu: [
        { label: "Products", path: "/inventory-home/products" },
        { label: "Product Categories", path: "/inventory-home/categories" },
        { label: "Add Stock", path: "/inventory-home/add-stock"}, 
        { label: "Low Stock Items", path: "/inventory-home/low-stock-items" },
        { label: "Purchases Invoices", path: "/inventory-home/purchases-invoices"},
      ],
    },
    {
      label: "Sales",
      icon: <FiShoppingCart className="text-lg" />,
      submenu: [
        { label: "Sales Items", path: "/inventory-home/sales-items" },
        { label: "Orders", path: "/inventory-home/orders" },
        { label: "Sales Invoices", path: "/inventory-home/sales-invoices" },
      ],
    },
    {
      label: "Parties",
      icon: <FiUsers className="text-lg" />,
      submenu: [
        {label: "Customers", path: "/inventory-home/customers"},
        {label: "Suppliers", path: "/inventory-home/supplier"}
      ]
    },
    {
      label: "Reports",
      icon: <FiFileText className="text-lg" />,
      submenu: [
        { label: "Sales Report", path: "/inventory-home/sales-report" },
        { label: "Inventory Report", path: "/inventory-home/reports/inventory" },
        { label: "Profit & Loss", path: "/inventory-home/reports/profit-loss" },
      ],
    },
  ];

  // Check if item is active
  const isItemActive = (item) => {
    if (item.path) {
      return item.exact ? pathname === item.path : pathname.startsWith(item.path);
    }
    
    if (item.submenu) {
      return item.submenu.some(sub => pathname.startsWith(sub.path));
    }
    
    return false;
  };

  return (
    <>
      {/* Backdrop Overlay for Mobile */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebarOnMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-72 bg-gradient-to-b from-white to-gray-50 
          shadow-xl z-50 border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:block
        `}
        style={{ top: '64px' }} // Adjust based on header height
      >
        {/* Desktop Header (Only visible on desktop) */}
        <div className="hidden lg:flex flex-col p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Inventory Manager</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your inventory efficiently</p>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-12rem)]">
          {menuItems.map((item, index) => {
            const isActive = isItemActive(item);
            const hasSubmenu = item.submenu;
            const isSubmenuOpen = openSubmenu === index;

            return (
              <div key={index} className="mb-1">
                {/* Main Menu Item */}
                <button
                  onClick={() => 
                    hasSubmenu ? handleSubmenuToggle(index) : handleNavigation(item.path)
                  }
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl
                    transition-all duration-200 ease-in-out
                    ${isActive 
                      ? "bg-blue-50 border-l-4 border-blue-500 text-blue-600" 
                      : "hover:bg-gray-50 hover:text-gray-900 text-gray-700"
                    }
                    ${hasSubmenu && isSubmenuOpen ? "bg-gray-50" : ""}
                  `}
                  aria-expanded={hasSubmenu ? isSubmenuOpen : undefined}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${isActive ? "text-blue-600" : "text-gray-500"}`}>
                      {item.icon}
                    </span>
                    <span className="font-medium text-sm lg:text-base">{item.label}</span>
                  </div>

                  {hasSubmenu && (
                    <FiChevronDown
                      className={`
                        transition-transform duration-200
                        ${isSubmenuOpen ? "rotate-180 text-blue-600" : "text-gray-400"}
                      `}
                      size={18}
                    />
                  )}
                </button>

                {/* Submenu Items */}
                {hasSubmenu && isSubmenuOpen && (
                  <div className="ml-8 mt-1 space-y-1 animate-fadeIn">
                    {item.submenu.map((sub, subIndex) => {
                      const isSubActive = pathname === sub.path || pathname.startsWith(sub.path);
                      
                      return (
                        <button
                          key={subIndex}
                          onClick={() => handleNavigation(sub.path)}
                          className={`
                            w-full text-left px-4 py-2.5 rounded-lg text-sm
                            transition-colors duration-200
                            ${isSubActive
                              ? "bg-blue-100 text-blue-600 font-medium"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }
                          `}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Add CSS for animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        /* Custom scrollbar for sidebar */
        nav::-webkit-scrollbar {
          width: 4px;
        }
        nav::-webkit-scrollbar-track {
          background: transparent;
        }
        nav::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        nav::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </>
  );
};

export default Sidebar;