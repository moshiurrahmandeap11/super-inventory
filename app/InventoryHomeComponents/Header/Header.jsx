"use client";
import axiosInstance, { baseImageURL } from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const Header = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [user, setUser] = useState(null);
const [basic, setBasic] = useState(null);
const [loading, setLoading] = useState(true);
console.log(basic);

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


  useEffect(() => {
    const loadUser = async () => {
      if (typeof window !== "undefined") {
        // check localStorage first
        const cachedUser = localStorage.getItem("cachedUser");
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
          return; // cached data found, API call skip
        }



        // if not cached, fetch from API
        const userId = localStorage.getItem("userId");
        if (userId) {
          try {
            const res = await axiosInstance.get(`/users/${userId}`);
            setUser(res.data.data);

            // save to localStorage for future renders
            localStorage.setItem("cachedUser", JSON.stringify(res.data.data));
          } catch (error) {
            console.error("Error fetching user:", error);
          }
        }
      }
    };

    loadUser();
  }, []);

  // Update time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      // Backend logout call
      await axiosInstance.post("/users/logout"); // /users/logout route tumi backend e banaisos

      //  Frontend local storage cleanup
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("cachedUser");
      localStorage.removeItem("savedCredentials");

      toast.success("Logged out successfully");

      //  Redirect to home/login page
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed. Try again.");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              aria-label="Toggle sidebar"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isSidebarOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

{/* Logo / Brand */}
<div className="flex items-center gap-3 ml-2 lg:ml-0">

  {/* Logo */}
  {basic?.logo && (
    <img
      src={`${baseImageURL}${basic.logo}`}
      alt="Website Logo"
      className="h-10 w-10 object-contain rounded-lg "
    />
  )}

  {/* Text Section */}
  <div className="flex flex-col leading-tight">
    <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
      {basic?.websiteName || "Super Inventory"}
    </h1>

    <p className="text-xs text-gray-500 hidden sm:block">
      {getGreeting()} •{" "}
      {new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
    </p>
  </div>

</div>

          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Current Time */}
            <div className="hidden sm:block">
              <div className="flex items-center justify-center gap-3 text-sm font-bold  text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <p className="font-bold">Time :</p> {currentTime}
              </div>
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    <img src={`${baseImageURL}${user?.avatar}`} alt={user?.fullName} className="w-8 h-8 rounded-full" />
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role || "User"}
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
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
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">
                        {user?.fullName}
                      </p>
                    </div>

                    <Link href={`/profile/${user?._id}`}>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center">
                        <svg
                          className="w-4 h-4 mr-3 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        My Profile
                      </button>
                    </Link>

                    <Link href="/settings">
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center">
                        <svg
                          className="w-4 h-4 mr-3 text-gray-500"
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
                        Settings
                      </button>
                    </Link>

                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
