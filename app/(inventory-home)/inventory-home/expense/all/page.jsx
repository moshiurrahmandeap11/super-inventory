"use client";
import axiosInstance from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { saveAs } from "file-saver";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
    FaBoxOpen,
    FaChartLine,
    FaMoneyBillWave
} from "react-icons/fa";
import {
    FiArrowDown,
    FiArrowUp,
    FiChevronLeft,
    FiChevronRight,
    FiChevronsLeft,
    FiChevronsRight,
    FiDownload,
    FiEdit2,
    FiEye,
    FiFilter,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiTag,
    FiTrash2,
    FiX
} from "react-icons/fi";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

const AllExpense = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Form state for edit
  const [editForm, setEditForm] = useState({
    expenseName: "",
    expenseCategory: "",
    expenseCost: "",
    description: ""
  });

  // Fetch all expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/expenses");
        
        if (response.data.success) {
          // Filter out soft-deleted expenses
          const activeExpenses = response.data.data.filter(exp => !exp.isDeleted);
          setExpenses(activeExpenses);
          setFilteredExpenses(activeExpenses);
          
          // Extract unique categories for filter
          const uniqueCategories = [...new Set(activeExpenses.map(exp => exp.expenseCategory))];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error("Error fetching expenses:", error);
        toast.error("Failed to load expenses");
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  // Filter and sort expenses
  useEffect(() => {
    let filtered = [...expenses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(exp => 
        exp.expenseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.expenseCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp._id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(exp => exp.expenseCategory === selectedCategory);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(exp => 
        new Date(exp.createdAt) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(exp => 
        new Date(exp.createdAt) <= new Date(dateRange.end)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortOrder === "asc") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredExpenses(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortOrder, dateRange, expenses]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredExpenses.length);
  const currentExpenses = filteredExpenses.slice(startIndex, endIndex);

  // Calculate totals
  const totalExpenseAmount = filteredExpenses.reduce((sum, exp) => 
    sum + (parseFloat(exp.expenseCost) || 0), 0
  );
  
  const averageExpense = filteredExpenses.length > 0 
    ? totalExpenseAmount / filteredExpenses.length 
    : 0;

  const highestExpense = filteredExpenses.length > 0
    ? Math.max(...filteredExpenses.map(exp => parseFloat(exp.expenseCost) || 0))
    : 0;

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSortOrder("desc");
    setDateRange({ start: "", end: "" });
    setCurrentPage(1);
    setShowMobileFilters(false);
  };

  // Handle view expense
  const handleView = (expense) => {
    setSelectedExpense(expense);
    setIsViewModalOpen(true);
  };

  // Handle edit expense
  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setEditForm({
      expenseName: expense.expenseName || "",
      expenseCategory: expense.expenseCategory || "",
      expenseCost: expense.expenseCost || "",
      description: expense.description || ""
    });
    setIsEditModalOpen(true);
  };

  // Handle edit form submit
  const handleEditSubmit = async () => {
    try {
      // Validation
      if (!editForm.expenseName.trim()) {
        toast.error("Expense name is required");
        return;
      }
      if (!editForm.expenseCategory.trim()) {
        toast.error("Expense category is required");
        return;
      }
      if (!editForm.expenseCost || parseFloat(editForm.expenseCost) <= 0) {
        toast.error("Valid expense cost is required");
        return;
      }

      const response = await axiosInstance.put(`/expenses/${selectedExpense._id}`, {
        expenseName: editForm.expenseName,
        expenseCategory: editForm.expenseCategory,
        expenseCost: parseFloat(editForm.expenseCost),
        description: editForm.description
      });

      if (response.data.success) {
        toast.success("Expense updated successfully");
        setIsEditModalOpen(false);
        
        // Refresh data
        const refreshResponse = await axiosInstance.get("/expenses");
        if (refreshResponse.data.success) {
          const activeExpenses = refreshResponse.data.data.filter(exp => !exp.isDeleted);
          setExpenses(activeExpenses);
          setFilteredExpenses(activeExpenses);
        }
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error(error.response?.data?.message || "Failed to update expense");
    }
  };

  // FIXED: Handle delete expense with SweetAlert
  const handleDelete = (expense) => {
    Swal.fire({
      title: "Delete Expense?",
      html: `
        <div class="text-left">
          <p class="mb-4">Are you sure you want to delete this expense?</p>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="font-semibold text-gray-900">${expense.expenseName}</p>
            <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>
                <span class="text-gray-500">Category:</span>
                <span class="font-medium ml-2">${expense.expenseCategory}</span>
              </div>
              <div>
                <span class="text-gray-500">Amount:</span>
                <span class="font-medium ml-2 text-green-600">BDT ${parseFloat(expense.expenseCost).toLocaleString()}</span>
              </div>
              <div>
                <span class="text-gray-500">Date:</span>
                <span class="font-medium ml-2">${new Date(expense.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-red-600 mt-3 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.728 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            This action cannot be undone!
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      background: "#fff",
      backdrop: `
        rgba(0,0,0,0.4)
        left top
        no-repeat
      `
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Show loading state
          Swal.fire({
            title: "Deleting...",
            text: "Please wait",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });
          console.log("id", expense?._id);

          const response = await axiosInstance.delete(`/expenses/${expense._id}`);
          
          if (response.data.success) {
            // FIXED: Remove the deleted expense from state
            const updatedExpenses = expenses.filter(exp => exp._id !== expense._id);
            setExpenses(updatedExpenses);
            setFilteredExpenses(updatedExpenses);

            // Show success message with SweetAlert
            Swal.fire({
              icon: "success",
              title: "Deleted!",
              html: `
                <div class="text-center">
                  <p class="text-gray-600 mb-2">The expense has been deleted.</p>
                  <p class="text-sm text-gray-500">${expense.expenseName}</p>
                  <p class="text-xs text-gray-400 mt-2">Amount: BDT ${parseFloat(expense.expenseCost).toLocaleString()}</p>
                </div>
              `,
              timer: 2000,
              showConfirmButton: false,
              background: "#fff"
            });
          }
        } catch (error) {
          console.error("Error deleting expense:", error);
          
          // Show error message
          Swal.fire({
            icon: "error",
            title: "Error!",
            text: error.response?.data?.message || "Failed to delete expense",
            confirmButtonColor: "#EF4444"
          });
        }
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          icon: "info",
          title: "Cancelled",
          text: "Your expense is safe :)",
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ["EXPENSE REPORT", ""],
        [`Generated: ${new Date().toLocaleString()}`, ""],
        [`Total Expenses: ${filteredExpenses.length}`, ""],
        [`Total Amount: BDT ${totalExpenseAmount.toLocaleString()}`, ""],
        [`Average Expense: BDT ${averageExpense.toLocaleString()}`, ""],
        [`Highest Expense: BDT ${highestExpense.toLocaleString()}`, ""],
        [],
        ["CATEGORY WISE SUMMARY", ""],
        ["Category", "Count", "Total Amount"]
      ];

      // Add category wise data
      const categoryMap = new Map();
      filteredExpenses.forEach(exp => {
        const cat = exp.expenseCategory;
        const amount = parseFloat(exp.expenseCost) || 0;
        if (categoryMap.has(cat)) {
          const existing = categoryMap.get(cat);
          categoryMap.set(cat, {
            count: existing.count + 1,
            total: existing.total + amount
          });
        } else {
          categoryMap.set(cat, { count: 1, total: amount });
        }
      });

      categoryMap.forEach((value, key) => {
        summaryData.push([key, value.count, value.total]);
      });

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      // Details Sheet
      const detailsData = [
        ["EXPENSE DETAILS", ""],
        [],
        ["Date", "Expense Name", "Category", "Amount", "Description", "ID"]
      ];

      filteredExpenses.forEach(exp => {
        detailsData.push([
          new Date(exp.createdAt).toLocaleDateString(),
          exp.expenseName,
          exp.expenseCategory,
          parseFloat(exp.expenseCost) || 0,
          exp.description || "",
          exp._id
        ]);
      });

      const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);
      XLSX.utils.book_append_sheet(wb, detailsSheet, "Details");

      // Generate Excel file
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      saveAs(blob, `expenses-${new Date().toISOString().split("T")[0]}.xlsx`);

      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Failed to export report");
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `BDT ${parseFloat(amount || 0).toLocaleString()}`;
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                All Expenses
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and track all business expenses
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={exportToExcel}
                disabled={filteredExpenses.length === 0}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  filteredExpenses.length > 0
                    ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <FiDownload size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={resetFilters}
                className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                title="Reset Filters"
              >
                <FiRefreshCw size={18} />
              </button>
              <button
                onClick={() => window.location.href = "/pay-expense"}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <FiPlus size={16} />
                <span className="hidden sm:inline">Add Expense</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredExpenses.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaBoxOpen className="text-blue-600" size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalExpenseAmount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaMoneyBillWave className="text-green-600" size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Expense</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(averageExpense)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaChartLine className="text-purple-600" size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiTag className="text-orange-600" size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, category, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={18} />
                </button>
              )}
            </div>

            {/* Desktop Filters */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Date Range */}
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="End Date"
              />

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 bg-white"
              >
                {sortOrder === "asc" ? <FiArrowUp size={16} /> : <FiArrowDown size={16} />}
                <span>{sortOrder === "asc" ? "Oldest" : "Newest"}</span>
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white"
            >
              <FiFilter size={16} />
              <span>Filters</span>
            </button>
          </div>

          {/* Mobile Filters */}
          <AnimatePresence>
            {showMobileFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden mt-4 pt-4 border-t border-gray-200 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Start"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="End"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <button
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 bg-white"
                  >
                    {sortOrder === "asc" ? <FiArrowUp size={16} /> : <FiArrowDown size={16} />}
                    <span>{sortOrder === "asc" ? "Oldest First" : "Newest First"}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Expenses Table/Card View */}
        {filteredExpenses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaMoneyBillWave className="text-gray-400" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Expenses Found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedCategory !== "all" || dateRange.start
                  ? "No expenses match your filter criteria."
                  : "Start adding expenses to track your business costs."}
              </p>
              {(searchTerm || selectedCategory !== "all" || dateRange.start) && (
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Expense Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentExpenses.map((expense, index) => (
                      <motion.tr
                        key={expense._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {formatDate(expense.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {expense.expenseName}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            ID: {expense._id.slice(-8)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {expense.expenseCategory}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-bold text-gray-900">
                            {formatCurrency(expense.expenseCost)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {expense.description || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(expense)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <FiEye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(expense)}
                              className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(expense)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-4 mb-6">
              {currentExpenses.map((expense) => (
                <motion.div
                  key={expense._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{expense.expenseName}</h3>
                      <p className="text-xs text-gray-500 mt-1">ID: {expense._id.slice(-8)}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {expense.expenseCategory}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="font-bold text-gray-900">{formatCurrency(expense.expenseCost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="text-sm text-gray-600">{formatDate(expense.createdAt)}</span>
                    </div>
                    {expense.description && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Description:</p>
                        <p className="text-sm text-gray-700">{expense.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(expense)}
                      className="flex-1 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FiEye size={16} />
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(expense)}
                      className="flex-1 py-2.5 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FiEdit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense)}
                      className="flex-1 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FiTrash2 size={16} />
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{" "}
                  <span className="font-semibold text-gray-900">{endIndex}</span> of{" "}
                  <span className="font-semibold text-gray-900">{filteredExpenses.length}</span> expenses
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Rows:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg transition-colors ${
                        currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <FiChevronsLeft size={18} />
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg transition-colors ${
                        currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <FiChevronLeft size={18} />
                    </button>

                    <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium">
                      {currentPage}
                    </span>
                    <span className="text-sm text-gray-600">of {totalPages}</span>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg transition-colors ${
                        currentPage === totalPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <FiChevronRight size={18} />
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg transition-colors ${
                        currentPage === totalPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <FiChevronsRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* View Details Modal */}
        <AnimatePresence>
          {isViewModalOpen && selectedExpense && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setIsViewModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FiEye className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Expense Details</h2>
                        <p className="text-sm text-gray-500">ID: {selectedExpense._id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsViewModalOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiX className="text-gray-500" size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Expense Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Expense Name</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedExpense.expenseName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Category</p>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {selectedExpense.expenseCategory}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Amount</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedExpense.expenseCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedExpense.createdAt)}</p>
                    </div>
                  </div>

                  {selectedExpense.description && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Description</p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700">{selectedExpense.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-500 mb-2">Additional Information</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <span className="text-gray-900 ml-2">{formatDate(selectedExpense.createdAt)}</span>
                      </div>
                      {selectedExpense.updatedAt && (
                        <div>
                          <span className="text-gray-500">Last Updated:</span>
                          <span className="text-gray-900 ml-2">{formatDate(selectedExpense.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <AnimatePresence>
          {isEditModalOpen && selectedExpense && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setIsEditModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FiEdit2 className="text-green-600" size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Edit Expense</h2>
                        <p className="text-sm text-gray-500">Update expense information</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiX className="text-gray-500" size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Expense Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Expense Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.expenseName}
                      onChange={(e) => setEditForm({ ...editForm, expenseName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                      placeholder="Enter expense name"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.expenseCategory}
                      onChange={(e) => setEditForm({ ...editForm, expenseCategory: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                      placeholder="Enter category"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount (BDT) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.expenseCost}
                      onChange={(e) => setEditForm({ ...editForm, expenseCost: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                      placeholder="Enter amount"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                      <span className="text-gray-400 text-xs ml-2">(Optional)</span>
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none"
                      placeholder="Enter description"
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEditSubmit}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                    >
                      Update Expense
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Bottom Padding */}
        <div className="lg:hidden h-16"></div>
      </div>
    </div>
  );
};

export default AllExpense;