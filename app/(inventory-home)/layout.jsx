"use client";
import { useEffect, useState } from "react";
import Header from "../InventoryHomeComponents/Header/Header";
import Sidebar from "../InventoryHomeComponents/Sidebar/Sidebar";
import ProtectedRoute from "../SharedComponents/ProtectedRoute/ProtectedRoute";

export default function InventoryLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // Auto close on mobile
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header Component with sidebar toggle */}
        <Header
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          toggleSidebar={toggleSidebar}
          isMobile={isMobile}
        />
        
        <div className="flex pt-16"> {/* Add padding-top for fixed header */}
          {/* Sidebar Component */}
          <Sidebar 
            isOpen={isSidebarOpen}
            onToggle={toggleSidebar}
          />
          
          {/* Main Content Area */}
          <main
            className={`flex-1 transition-all duration-300 ${
              isSidebarOpen && !isMobile ? "lg:ml-0" : ""
            }`}
          >
            <div className="p-4 md:p-2 lg:p-2">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}