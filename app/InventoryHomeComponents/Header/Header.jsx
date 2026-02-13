"use client";
import axiosInstance, { baseImageURL } from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FiChevronDown,
  FiClock,
  FiDollarSign,
  FiLogOut,
  FiMenu,
  FiSettings,
  FiUser,
  FiX
} from "react-icons/fi";

const Header = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [user, setUser] = useState(null);
  const [basic, setBasic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");

  // Fetch basic settings
  useEffect(() => {
    const tryFetchBasic = async () => {
      try {
        const res = await axiosInstance.get("/basic-settings");
        if (res.data.success) {
          setBasic(res.data.data);
        }
      } catch (error) {
        console.error("Basic settings fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    tryFetchBasic();
  }, []);

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      if (typeof window !== "undefined") {
        const cachedUser = localStorage.getItem("cachedUser");
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
          return;
        }

        const userId = localStorage.getItem("userId");
        if (userId) {
          try {
            const res = await axiosInstance.get(`/users/${userId}`);
            setUser(res.data.data);
            localStorage.setItem("cachedUser", JSON.stringify(res.data.data));
          } catch (error) {
            console.error("Error fetching user:", error);
          }
        }
      }
    };
    loadUser();
  }, []);

  // Update time and greeting
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      // Update time
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );

      // Update date
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );

      // Update greeting
      const hour = now.getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 18) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/users/logout");
      
      // Clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("cachedUser");
      localStorage.removeItem("savedCredentials");

      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed. Try again.");
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isProfileOpen && !e.target.closest('.profile-menu')) {
        setIsProfileOpen(false);
      }
      if (isMobileMenuOpen && !e.target.closest('.mobile-menu')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen, isMobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-lg z-50 border-b border-gray-200">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Left Section - Logo & Sidebar Toggle */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {/* Sidebar Toggle - Mobile Only */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? (
                <FiX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              ) : (
                <FiMenu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              )}
            </button>

            {/* Logo & Brand */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Logo */}
              {basic?.logo && (
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                  <img
                    src={`${baseImageURL}${basic.logo}`}
                    alt={basic?.websiteName || "Logo"}
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Text Section - Hidden on very small screens */}
              <div className="hidden xs:block">
                <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-800 truncate max-w-[120px] sm:max-w-[200px] md:max-w-[250px]">
                  {basic?.websiteName || "Super Inventory"}
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
                  {greeting} • {currentDate}
                </p>
              </div>
            </div>

            {/* Balance Badge - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-1 ml-2 lg:ml-4 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full">
              <FiDollarSign className="text-green-600 w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                <span className="hidden lg:inline">Balance:</span> 0.00
              </span>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4">
            
            {/* Time - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 rounded-full">
              <FiClock className="text-gray-500 w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {currentTime}
              </span>
            </div>

            {/* Compact Time for Tablet */}
            <div className="hidden sm:block md:hidden">
              <div className="px-2 py-1 bg-gray-100 rounded-full">
                <span className="text-xs font-medium text-gray-700">
                  {currentTime}
                </span>
              </div>
            </div>

            {/* Mobile Balance - Only on mobile */}
            <div className="md:hidden flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full">
              <FiDollarSign className="text-green-600 w-3 h-3" />
              <span className="text-xs font-medium text-gray-700">0.00</span>
            </div>

            {/* User Profile */}
            <div className="relative profile-menu">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Avatar */}
                <div className="relative w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full overflow-hidden ring-2 ring-blue-100">
                  {user?.avatar ? (
                    <img
                      src={`${baseImageURL}${user.avatar}`}
                      alt={user?.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${user?.fullName}&background=3b82f6&color=fff`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-xs sm:text-sm">
                        {user?.fullName?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Info - Hidden on mobile */}
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role || "User"}
                  </p>
                </div>

                {/* Dropdown Icon */}
                <FiChevronDown 
                  className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-200"
                    >
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {user?.fullName?.charAt(0) || "U"}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user?.fullName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user?.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link href={`/profile/${user?._id}`}>
                          <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3">
                            <FiUser className="w-4 h-4 text-gray-500" />
                            <span>My Profile</span>
                          </button>
                        </Link>

                        <Link href="/settings">
                          <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3">
                            <FiSettings className="w-4 h-4 text-gray-500" />
                            <span>Settings</span>
                          </button>
                        </Link>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-100 my-1"></div>

                      {/* Logout */}
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                        >
                          <FiLogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>

                      {/* Footer Info */}
                      <div className="px-4 py-2 border-t border-gray-100 mt-1">
                        <p className="text-[10px] text-gray-400 text-center">
                          {basic?.websiteName || "Inventory System"} v1.0
                        </p>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Date & Greeting Bar */}
        <div className="sm:hidden flex items-center justify-between py-1 px-1 border-t border-gray-100 bg-gray-50/50">
          <span className="text-[10px] text-gray-600">{greeting}</span>
          <span className="text-[10px] text-gray-500">{currentDate}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;