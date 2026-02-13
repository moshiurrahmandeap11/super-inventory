"use client";
import axiosInstance from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
    FaFolderOpen,
    FaTags
} from "react-icons/fa";
import {
    FiArchive,
    FiChevronLeft,
    FiChevronRight,
    FiChevronsLeft,
    FiChevronsRight,
    FiClock,
    FiEdit2,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiTag,
    FiTrash2,
    FiX
} from "react-icons/fi";
import Swal from "sweetalert2";

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    categoryName: ""
  });
  const [showDeleted, setShowDeleted] = useState(false);

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/expense-category");
        
        if (response.data.success) {
          // Filter based on showDeleted state
          const allCategories = response.data.data || [];
          if (!showDeleted) {
            const activeCategories = allCategories.filter(cat => !cat.isDeleted);
            setCategories(activeCategories);
            setFilteredCategories(activeCategories);
          } else {
            setCategories(allCategories);
            setFilteredCategories(allCategories);
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [showDeleted]);

  // Filter and sort categories
  useEffect(() => {
    let filtered = [...categories];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(cat => 
        cat.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat._id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortOrder === "asc") {
        return (a.categoryName || "").localeCompare(b.categoryName || "");
      } else {
        return (b.categoryName || "").localeCompare(a.categoryName || "");
      }
    });

    setFilteredCategories(filtered);
    setCurrentPage(1);
  }, [searchTerm, sortOrder, categories]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredCategories.length);
  const currentCategories = filteredCategories.slice(startIndex, endIndex);

  // Calculate stats
  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => !c.isDeleted).length;
  const deletedCategories = categories.filter(c => c.isDeleted).length;
  const newestCategory = categories.length > 0 
    ? categories.reduce((newest, cat) => {
        return new Date(cat.createdAt) > new Date(newest.createdAt) ? cat : newest;
      }, categories[0])
    : null;

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  // Handle add/edit category
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        const response = await axiosInstance.put(`/expense-category/${editingCategory._id}`, {
          categoryName: formData.categoryName.trim()
        });

        if (response.data.success) {
          toast.success("Category updated successfully");
          
          // Update local state
          setCategories(categories.map(cat => 
            cat._id === editingCategory._id 
              ? { ...cat, categoryName: formData.categoryName.trim(), updatedAt: new Date() }
              : cat
          ));
        }
      } else {
        // Add new category
        const response = await axiosInstance.post("/expense-category", {
          categoryName: formData.categoryName.trim()
        });

        if (response.data.success) {
          toast.success("Category added successfully");
          
          // Add to local state
          setCategories([...categories, {
            _id: response.data.data._id,
            categoryName: formData.categoryName.trim(),
            createdAt: new Date(),
            updatedAt: new Date()
          }]);
        }
      }

      // Close modal and reset form
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ categoryName: "" });
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(error.response?.data?.message || "Failed to save category");
    }
  };

  // Handle delete category
  const handleDelete = (category) => {
    Swal.fire({
      title: "Delete Category?",
      html: `
        <div class="text-left">
          <p class="mb-4">Are you sure you want to delete this category?</p>
          <div class="bg-gray-50 p-3 rounded-lg">
            <p class="font-medium">${category.categoryName}</p>
            <p class="text-xs text-gray-500 mt-1">ID: ${category._id.slice(-8)}</p>
          </div>
          <p class="text-xs text-yellow-600 mt-3 flex items-center gap-1">
            <FaExclamationTriangle />
            Categories in use will be soft deleted
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axiosInstance.delete(`/expense-category/${category._id}`);
          
          if (response.data.success) {
            toast.success(response.data.message || "Category deleted successfully");
            
            // Update local state
            if (response.data.softDeleted) {
              // Soft delete - mark as deleted
              setCategories(categories.map(cat => 
                cat._id === category._id 
                  ? { ...cat, isDeleted: true, deletedAt: new Date() }
                  : cat
              ));
            } else {
              // Hard delete - remove from list
              setCategories(categories.filter(cat => cat._id !== category._id));
            }
          }
        } catch (error) {
          console.error("Error deleting category:", error);
          toast.error(error.response?.data?.message || "Failed to delete category");
        }
      }
    });
  };

  // Handle edit click
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ categoryName: category.categoryName });
    setIsModalOpen(true);
  };

  // Handle add click
  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ categoryName: "" });
    setIsModalOpen(true);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Expense Categories
                </h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  {activeCategories} Active
                </span>
              </div>
              <p className="text-gray-600 mt-2">
                Manage and organize your expense categories
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Show Deleted Toggle */}
              <button
                onClick={() => setShowDeleted(!showDeleted)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  showDeleted
                    ? "bg-orange-100 text-orange-700 border border-orange-300"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FiArchive size={16} />
                <span className="hidden sm:inline">
                  {showDeleted ? "Hide Deleted" : "Show Deleted"}
                </span>
                {deletedCategories > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-orange-200 text-orange-800 rounded-full text-xs">
                    {deletedCategories}
                  </span>
                )}
              </button>

              <button
                onClick={resetFilters}
                className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                title="Reset Filters"
              >
                <FiRefreshCw size={18} />
              </button>

              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <FiPlus size={16} />
                <span className="hidden sm:inline">Add Category</span>
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
                <p className="text-sm text-gray-600 mb-1">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCategories}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaTags className="text-blue-600" size={24} />
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
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeCategories}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaFolderOpen className="text-green-600" size={24} />
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
                <p className="text-sm text-gray-600 mb-1">Deleted</p>
                <p className="text-2xl font-bold text-orange-600">
                  {deletedCategories}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiArchive className="text-orange-600" size={24} />
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
                <p className="text-sm text-gray-600 mb-1">Newest</p>
                <p className="text-lg font-bold text-gray-900 truncate max-w-[120px]">
                  {newestCategory?.categoryName || "N/A"}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiClock className="text-purple-600" size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search categories by name..."
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

            <div className="flex items-center gap-2">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              >
                <option value="asc">A to Z</option>
                <option value="desc">Z to A</option>
              </select>

              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Grid/Table */}
        {filteredCategories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaTags className="text-gray-400" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {showDeleted ? "No Deleted Categories" : "No Categories Found"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? "No categories match your search criteria."
                  : showDeleted
                    ? "No categories have been deleted yet."
                    : "Start by adding your first expense category."}
              </p>
              {!showDeleted && (
                <button
                  onClick={handleAdd}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg inline-flex items-center gap-2"
                >
                  <FiPlus size={18} />
                  Add Category
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
                        Category Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentCategories.map((category, index) => (
                      <motion.tr
                        key={category._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`hover:bg-gray-50 transition-colors ${
                          category.isDeleted ? "bg-orange-50/30" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              category.isDeleted 
                                ? "bg-orange-100 text-orange-600"
                                : "bg-blue-100 text-blue-600"
                            }`}>
                              <FiTag size={16} />
                            </div>
                            <span className={`font-medium ${
                              category.isDeleted ? "text-gray-500" : "text-gray-900"
                            }`}>
                              {category.categoryName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-gray-500">
                            {category._id.slice(-8)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {formatDate(category.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {category.isDeleted ? (
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                              Deleted
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!category.isDeleted && (
                              <>
                                <button
                                  onClick={() => handleEdit(category)}
                                  className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <FiEdit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(category)}
                                  className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </>
                            )}
                            {category.isDeleted && (
                              <span className="text-xs text-gray-400 italic">
                                Inactive
                              </span>
                            )}
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
              {currentCategories.map((category) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${
                    category.isDeleted ? "border-orange-200 bg-orange-50/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        category.isDeleted 
                          ? "bg-orange-100 text-orange-600"
                          : "bg-blue-100 text-blue-600"
                      }`}>
                        <FiTag size={20} />
                      </div>
                      <div>
                        <h3 className={`font-semibold ${
                          category.isDeleted ? "text-gray-500" : "text-gray-900"
                        }`}>
                          {category.categoryName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          ID: {category._id.slice(-8)}
                        </p>
                      </div>
                    </div>
                    {category.isDeleted ? (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                        Deleted
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-800">{formatDate(category.createdAt)}</span>
                    </div>
                    {category.updatedAt && category.updatedAt !== category.createdAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Updated:</span>
                        <span className="text-gray-800">{formatDate(category.updatedAt)}</span>
                      </div>
                    )}
                  </div>

                  {!category.isDeleted && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="flex-1 py-2.5 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <FiEdit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="flex-1 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <FiTrash2 size={16} />
                        Delete
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{" "}
                  <span className="font-semibold text-gray-900">{endIndex}</span> of{" "}
                  <span className="font-semibold text-gray-900">{filteredCategories.length}</span> categories
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
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

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        editingCategory ? "bg-green-100" : "bg-blue-100"
                      }`}>
                        {editingCategory ? (
                          <FiEdit2 className={editingCategory ? "text-green-600" : "text-blue-600"} size={20} />
                        ) : (
                          <FiPlus className="text-blue-600" size={20} />
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {editingCategory ? "Edit Category" : "Add Category"}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {editingCategory ? "Update category name" : "Create a new expense category"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiX className="text-gray-500" size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.categoryName}
                        onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="e.g., Office Supplies, Travel, Utilities"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Category name should be unique and descriptive
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                      >
                        {editingCategory ? "Update" : "Create"}
                      </button>
                    </div>
                  </form>
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

export default Category;