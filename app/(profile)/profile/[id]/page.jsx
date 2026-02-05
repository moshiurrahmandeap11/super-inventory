"use client";
import axiosInstance, { baseImageURL } from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const Profile = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const res = await axiosInstance.get(`/users/${id}`);
        if (res.data.success) {
          setUser(res.data.data);
        } else {
          toast.error("Failed to load user profile");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error(error.response?.data?.error || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchUser();
    }
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">User not found</h3>
          <p className="text-gray-600 mb-4">The requested profile could not be loaded.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600 mt-1">View and manage user information</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-linear-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-lg">
                  {user?.avatar ? (
                    <img 
                      src={`${baseImageURL}${user?.avatar}`} 
                      alt={user?.fullName || "User"} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    user?.fullName?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>
                {user?.role && (
                  <span className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {user.role}
                  </span>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {user?.fullName || "No Name Provided"}
                </h2>
                <p className="text-gray-600 mb-4 flex items-center justify-center sm:justify-start gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89-4.26a2 2 0 012.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {user?.email || "No email provided"}
                </p>
                
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Active
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Member since {formatDate(user?.createdAt).split(",")[0]}
                  </span>
                </div>
              </div>

              {/* Edit Button */}
              <div className="mt-4 sm:mt-0">
                <Link
                  href={`/profile/edit/${user?._id || id}`}
                  className="inline-flex items-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
              Profile Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User ID */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500">User ID</label>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm text-gray-800 font-mono break-all">
                    {user?._id || "N/A"}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user?._id || "");
                      toast.success("ID copied to clipboard!");
                    }}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Copy ID"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500">Role</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user?.role === "admin" ? "bg-purple-100 text-purple-800" :
                    user?.role === "manager" ? "bg-blue-100 text-blue-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "User"}
                  </span>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500">Email Address</label>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89-4.26a2 2 0 012.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-800">{user?.email || "N/A"}</span>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-gray-800">{user?.fullName || "N/A"}</span>
                </div>
              </div>

              {/* Account Created */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-500">Account Created</label>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-800">{formatDate(user?.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Additional Info (if available) */}
            {(user?.bio || user?.phone || user?.address) && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {user?.phone && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-gray-800">{user.phone}</span>
                      </div>
                    </div>
                  )}
                  
                  {user?.address && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-500">Address</label>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-gray-800">{user.address}</span>
                      </div>
                    </div>
                  )}
                  
                  {user?.bio && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500">Bio</label>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-800 whitespace-pre-line">{user.bio}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/profile/edit/${user?._id || id}`}
                className="flex-1 inline-flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Link>
              
              <button
                onClick={() => router.back()}
                className="flex-1 inline-flex items-center justify-center px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;