"use client";
import axiosInstance from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
    FaCreditCard,
    FaMobile,
    FaMoneyBillWave,
    FaUniversity,
    FaWallet
} from "react-icons/fa";
import {
    FiAlertCircle,
    FiArrowLeft,
    FiCheckCircle,
    FiDollarSign,
    FiFileText,
    FiInfo,
    FiTag,
    FiX
} from "react-icons/fi";

const PayExpense = () => {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    expenseName: "",
    expenseCategory: "",
    expenseCost: "",
    paymentMethod: "cash",
    description: ""
  });

  // Form errors
  const [errors, setErrors] = useState({});

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/expense-category");
        
        if (response.data.success) {
          // Only show active categories (not deleted)
          const activeCategories = response.data.data.filter(cat => !cat.isDeleted);
          setCategories(activeCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.expenseName.trim()) {
      newErrors.expenseName = "Expense name is required";
    }

    if (!formData.expenseCategory) {
      newErrors.expenseCategory = "Please select a category";
    }

    if (!formData.expenseCost) {
      newErrors.expenseCost = "Expense amount is required";
    } else if (isNaN(formData.expenseCost) || parseFloat(formData.expenseCost) <= 0) {
      newErrors.expenseCost = "Please enter a valid amount";
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = "Please select a payment method";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    try {
      setSubmitting(true);

      const expenseData = {
        expenseName: formData.expenseName.trim(),
        expenseCategory: formData.expenseCategory,
        expenseCost: parseFloat(formData.expenseCost),
        paymentMethod: formData.paymentMethod,
        description: formData.description.trim() || "",
        status: "paid"
      };

      console.log("Submitting expense:", expenseData);

      const response = await axiosInstance.post("/expenses", expenseData);

      if (response.data.success) {
        toast.success("Expense recorded successfully!");
        
        // Reset form
        setFormData({
          expenseName: "",
          expenseCategory: "",
          expenseCost: "",
          paymentMethod: "cash",
          description: ""
        });
        setErrors({});

        // Show success message
        setTimeout(() => {
          router.push("/all-expense");
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting expense:", error);
      toast.error(error.response?.data?.message || "Failed to record expense");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.back();
  };

  // Get payment method icon
  const getPaymentIcon = (method) => {
    switch (method) {
      case "cash":
        return <FaMoneyBillWave className="text-green-600" size={20} />;
      case "bank":
        return <FaUniversity className="text-blue-600" size={20} />;
      case "bkash":
        return <FaMobile className="text-pink-600" size={20} />;
      case "nagad":
        return <FaMobile className="text-orange-600" size={20} />;
      case "card":
        return <FaCreditCard className="text-purple-600" size={20} />;
      default:
        return <FaWallet className="text-gray-600" size={20} />;
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-gray-600" size={24} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Pay Expense
              </h1>
              <p className="text-gray-600 mt-1">
                Record and track your business expenses
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiDollarSign size={20} />
              Expense Payment Details
            </h2>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Expense Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Expense Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiTag className="text-gray-400" size={18} />
                </div>
                <input
                  type="text"
                  name="expenseName"
                  value={formData.expenseName}
                  onChange={handleChange}
                  placeholder="e.g., Office Rent, Electricity Bill, Internet"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    errors.expenseName ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.expenseName && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <FiAlertCircle size={14} />
                  {errors.expenseName}
                </p>
              )}
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Expense Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiTag className="text-gray-400" size={18} />
                </div>
                <select
                  name="expenseCategory"
                  value={formData.expenseCategory}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white ${
                    errors.expenseCategory ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category.categoryName}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.expenseCategory && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <FiAlertCircle size={14} />
                  {errors.expenseCategory}
                </p>
              )}
              {categories.length === 0 && (
                <p className="text-sm text-yellow-600 flex items-center gap-1 mt-1">
                  <FiInfo size={14} />
                  No categories found. Please create a category first.
                </p>
              )}
            </div>

            {/* Expense Amount */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiDollarSign className="text-gray-400" size={18} />
                </div>
                <input
                  type="number"
                  name="expenseCost"
                  value={formData.expenseCost}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    errors.expenseCost ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-sm text-gray-500">BDT</span>
                </div>
              </div>
              {errors.expenseCost && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <FiAlertCircle size={14} />
                  {errors.expenseCost}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { value: "cash", label: "Cash", icon: <FaMoneyBillWave size={20} />, color: "green" },
                  { value: "bank", label: "Bank", icon: <FaUniversity size={20} />, color: "blue" },
                  { value: "bkash", label: "bKash", icon: <FaMobile size={20} />, color: "pink" },
                  { value: "nagad", label: "Nagad", icon: <FaMobile size={20} />, color: "orange" },
                  { value: "card", label: "Card", icon: <FaCreditCard size={20} />, color: "purple" }
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.value }))}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      formData.paymentMethod === method.value
                        ? `border-${method.color}-500 bg-${method.color}-50`
                        : "border-gray-200 hover:border-gray-300 bg-gray-50"
                    }`}
                  >
                    <div className={`${
                      formData.paymentMethod === method.value
                        ? `text-${method.color}-600`
                        : "text-gray-500"
                    }`}>
                      {method.icon}
                    </div>
                    <span className={`text-xs font-medium ${
                      formData.paymentMethod === method.value
                        ? `text-${method.color}-700`
                        : "text-gray-600"
                    }`}>
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>
              {errors.paymentMethod && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <FiAlertCircle size={14} />
                  {errors.paymentMethod}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Description
                <span className="text-gray-400 text-xs ml-2">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <FiFileText className="text-gray-400" size={18} />
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Add any additional notes about this expense..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Form Footer */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 order-2 sm:order-1"
              >
                <FiX size={18} />
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || categories.length === 0}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 order-1 sm:order-2 ${
                  submitting || categories.length === 0
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={18} />
                    Record Expense
                  </>
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FiInfo className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Payment Information
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    After recording, this expense will appear in the &quot;All Expenses&quot; list.
                    Make sure all details are correct before submitting.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Quick Tips Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-5"
        >
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiInfo className="text-blue-600" />
            Quick Tips
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Use descriptive expense names for easy tracking</p>
            <p>• Categorize expenses properly for better reporting</p>
            <p>• Double-check the amount before submitting</p>
            <p>• Add descriptions for unusual or large expenses</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PayExpense;