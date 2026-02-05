"use client";
import { useEffect, useState } from "react";
import Header from "../InventoryHomeComponents/Header/Header";
import Sidebar from "../InventoryHomeComponents/Sidebar/Sidebar";
import ProtectedRoute from "../SharedComponents/ProtectedRoute/ProtectedRoute";

export default function InventoryLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarOpen");
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  const [selectedItem, setSelectedItem] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedItem") || "dashboard";
    }
    return "dashboard";
  });

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  // Save selected item
  const handleItemSelect = (item) => {
    setSelectedItem(item);
    localStorage.setItem("selectedItem", item);

    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen text-black bg-gray-50">
        <Header
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <div className="flex pt-16">
          <Sidebar
            isOpen={isSidebarOpen}
            selectedItem={selectedItem}
            onItemSelect={handleItemSelect}
          />

          {/* Main Content */}
          <main
            className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "lg:ml-64" : ""}`}
          >
            <div className="p-4 md:p-6">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
