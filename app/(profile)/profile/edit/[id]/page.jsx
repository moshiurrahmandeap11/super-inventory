"use client";
import axiosInstance, {
  baseImageURL,
} from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import successAnimation from "@/public/success-animation.json"; // লটিফাইলের জন্য
import Lottie from "lottie-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const EditProfile = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const res = await axiosInstance.get(`/users/${id}`);
        if (res.data.success) {
          setUser(res.data.data);
          setFormData({
            fullName: res.data.data.fullName || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });

          // Set image preview with base URL
          setImagePreview(
            res.data.data.avatar
              ? `${baseImageURL}${res.data.data.avatar}`
              : null,
          );
        } else {
          toast.error("Failed to load user data");
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      // Check file type
      if (!file.type.match("image.*")) {
        toast.error("Please select an image file");
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    // Set back to original image with base URL
    setImagePreview(user?.avatar ? `${baseImageURL}${user.avatar}` : null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    // Password validation
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        toast.error("Please enter current password to change password");
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }

      if (formData.newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Prepare update data
      const updateData = {};

      // Add fullName if changed
      if (formData.fullName !== user?.fullName) {
        updateData.fullName = formData.fullName;
      }

      // Add password if provided
      if (formData.newPassword) {
        updateData.password = formData.newPassword;
        updateData.currentPassword = formData.currentPassword;
      }

      // Update user info if there are changes
      if (Object.keys(updateData).length > 0) {
        const res = await axiosInstance.patch(`/users/${id}`, updateData);
        if (!res.data.success) {
          toast.error(res.data.error || "Failed to update profile");
          return;
        }
      }

      // Upload image if changed
      if (imageFile) {
        const formDataImg = new FormData();
        formDataImg.append("avatar", imageFile);

        const imageRes = await axiosInstance.patch(
          `/users/${id}/avatar`,
          formDataImg,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        if (!imageRes.data.success) {
          toast.error(imageRes.data.error || "Failed to update image");
          return;
        }
      }

      // Show success animation
      setShowSuccess(true);
      toast.success("Profile updated successfully!");

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(`/profile/${id}`);
      }, 3000);
    } catch (error) {
      console.error("Update error:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      fullName: user?.fullName || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setImageFile(null);
    // Reset to original image with base URL
    setImagePreview(user?.avatar ? `${baseImageURL}${user.avatar}` : null);
  };

  // Calculate if form has changes
  const hasChanges = () => {
    const nameChanged = formData.fullName !== user?.fullName;
    const passwordChanged = formData.newPassword.length > 0;
    const imageChanged = imageFile !== null;

    return nameChanged || passwordChanged || imageChanged;
  };

  // Get user initial for avatar fallback
  const getUserInitial = () => {
    return user?.fullName?.charAt(0)?.toUpperCase() || "U";
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
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            User not found
          </h3>
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

  // Success Animation Component
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <Lottie
              animationData={successAnimation}
              loop={false}
              className="w-48 h-48 mx-auto"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Profile Updated Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Your profile has been updated. You will be redirected to your
            profile page in a few seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push(`/profile/${id}`)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Profile Now
            </button>
            <button
              onClick={() => setShowSuccess(false)}
              className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
            >
              Edit More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Edit Profile
              </h1>
              <p className="text-gray-600 mt-1">
                Update your profile information
              </p>
            </div>
            <button
              onClick={() => router.push(`/profile/${id}`)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="hidden sm:inline">Back to Profile</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 sm:p-8">
              {/* Profile Image Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Profile Image
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-linear-to-r from-blue-50 to-indigo-100">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.parentElement.innerHTML = `
                                                            <div class="w-full h-full flex items-center justify-center text-4xl font-bold text-blue-600">
                                                                ${getUserInitial()}
                                                            </div>
                                                        `;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-blue-600">
                          {getUserInitial()}
                        </div>
                      )}
                    </div>

                    {/* Change Image Button */}
                    <div className="mt-4 flex flex-wrap gap-3 justify-center">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <div className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Change Photo
                        </div>
                      </label>

                      {imageFile && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="inline-flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-sm text-gray-600 mb-2">
                      Upload a new profile image. JPG, PNG or GIF, max 5MB.
                    </p>
                    <p className="text-xs text-gray-500">
                      Recommended size: 500x500 pixels
                    </p>
                    {user?.avatar && (
                      <p className="text-xs text-gray-500 mt-2">
                        Current image: {user.avatar}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Information Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <svg
                        className="w-5 h-5 text-gray-400 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89-4.26a2 2 0 012.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-gray-800">{user?.email}</span>
                      <span className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                        Cannot be changed
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Change Password Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Change Password
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <label
                        htmlFor="currentPassword"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div></div> {/* Empty div for grid alignment */}
                    {/* New Password */}
                    <div className="space-y-2">
                      <label
                        htmlFor="newPassword"
                        className="block text-sm font-medium text-gray-700"
                      >
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="Enter new password"
                      />
                    </div>
                    {/* Confirm New Password */}
                    <div className="space-y-2">
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      Password Requirements
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li className="flex items-center">
                        <svg
                          className={`w-4 h-4 mr-2 ${formData.newPassword.length >= 6 ? "text-green-500" : "text-blue-400"}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        At least 6 characters long
                      </li>
                      <li className="flex items-center">
                        <svg
                          className={`w-4 h-4 mr-2 ${formData.newPassword && formData.newPassword === formData.confirmPassword ? "text-green-500" : "text-blue-400"}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Passwords must match
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting || !hasChanges()}
                  className="flex-1 inline-flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin w-5 h-5 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasChanges()}
                  className="flex-1 inline-flex items-center justify-center px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Reset
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/profile/${id}`)}
                  className="flex-1 inline-flex items-center justify-center px-5 py-3 border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Tips Section */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">
            Tips for updating your profile
          </h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 mt-0.5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Use a clear profile photo that shows your face for better
                recognition
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 mt-0.5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Your email address cannot be changed for security reasons
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 mt-0.5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Choose a strong password with a mix of letters, numbers, and
                symbols
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
