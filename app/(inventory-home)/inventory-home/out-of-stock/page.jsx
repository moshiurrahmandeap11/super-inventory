"use client";
import axiosInstance from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FaBoxOpen, FaExclamationTriangle } from "react-icons/fa";
import {
    FiArrowLeft,
    FiChevronLeft,
    FiChevronRight,
    FiChevronsLeft,
    FiChevronsRight,
    FiDollarSign,
    FiDownload,
    FiEdit2,
    FiFilter,
    FiPackage,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiTrash2,
    FiX
} from "react-icons/fi";
import Swal from "sweetalert2";

const OutOfStock = () => {
  const [products, setProducts] = useState([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Fetch products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products
        const productsRes = await axiosInstance.get("/products");
        
        if (productsRes.data.success) {
          const allProducts = productsRes.data.data || [];
          setProducts(allProducts);
          
          // Filter out of stock products (quantity === 0)
          const outOfStock = allProducts.filter(
            product => product.quantity === 0 || product.quantity === "0" || product.quantity === 0.0
          );
          
          setOutOfStockProducts(outOfStock);
          setFilteredProducts(outOfStock);
        }

        // Fetch categories for filter
        try {
          const categoriesRes = await axiosInstance.get("/product-categories");
          if (categoriesRes.data.success) {
            setCategories(categoriesRes.data.data || []);
          }
        } catch (error) {
          console.error("Error fetching categories:", error);
        }

      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter and sort products
  useEffect(() => {
    let filtered = [...outOfStockProducts];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (product) => product.category === categoryFilter
      );
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(
        (product) => new Date(product.createdAt) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(
        (product) => new Date(product.createdAt) <= new Date(dateRange.end)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortOrder === "asc") {
        return (a.name || "").localeCompare(b.name || "");
      } else {
        return (b.name || "").localeCompare(a.name || "");
      }
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, dateRange, sortOrder, outOfStockProducts]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setDateRange({ start: "", end: "" });
    setSortOrder("asc");
    setCurrentPage(1);
    setShowMobileFilters(false);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `BDT ${amount?.toLocaleString() || 0}`;
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    Swal.fire({
      title: "Edit Product",
      html: `
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input id="edit-name" type="text" value="${product.name}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Price (BDT)</label>
            <input id="edit-price" type="number" value="${product.price}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input id="edit-category" type="text" value="${product.category || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3B82F6",
      preConfirm: async () => {
        const name = document.getElementById("edit-name").value;
        const price = document.getElementById("edit-price").value;
        const category = document.getElementById("edit-category").value;

        if (!name || !price) {
          Swal.showValidationMessage("Name and price are required");
          return false;
        }

        try {
          const response = await axiosInstance.patch(`/products/${product._id}`, {
            name,
            price: parseFloat(price),
            category
          });

          if (response.data.success) {
            // Refresh products
            const productsRes = await axiosInstance.get("/products");
            if (productsRes.data.success) {
              const allProducts = productsRes.data.data || [];
              setProducts(allProducts);
              const outOfStock = allProducts.filter(p => p.quantity === 0);
              setOutOfStockProducts(outOfStock);
            }
            return true;
          }
        } catch (error) {
          Swal.showValidationMessage(error.response?.data?.message || "Update failed");
          return false;
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Product has been updated.",
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  // Handle delete product
  const handleDeleteProduct = (product) => {
    Swal.fire({
      title: "Delete Product?",
      text: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axiosInstance.delete(`/products/${product._id}`);
          
          if (response.data.success) {
            // Refresh products
            const productsRes = await axiosInstance.get("/products");
            if (productsRes.data.success) {
              const allProducts = productsRes.data.data || [];
              setProducts(allProducts);
              const outOfStock = allProducts.filter(p => p.quantity === 0);
              setOutOfStockProducts(outOfStock);
            }
            
            Swal.fire({
              icon: "success",
              title: "Deleted!",
              text: "Product has been deleted.",
              timer: 1500,
              showConfirmButton: false
            });
          }
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to delete product");
        }
      }
    });
  };

  // Handle stock update
  const handleAddStock = (product) => {
    Swal.fire({
      title: "Add Stock",
      html: `
        <div class="space-y-4">
          <div class="bg-yellow-50 p-3 rounded-lg">
            <p class="text-sm text-yellow-800">
              Current stock: <span class="font-bold">0</span> units
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Quantity to Add <span class="text-red-500">*</span>
            </label>
            <input id="stock-quantity" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Add Stock",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#10B981",
      preConfirm: async () => {
        const quantity = document.getElementById("stock-quantity").value;
        
        if (!quantity || parseInt(quantity) < 1) {
          Swal.showValidationMessage("Please enter valid quantity");
          return false;
        }

        try {
          const response = await axiosInstance.patch(`/products/${product._id}`, {
            quantity: parseInt(quantity)
          });

          if (response.data.success) {
            // Refresh products
            const productsRes = await axiosInstance.get("/products");
            if (productsRes.data.success) {
              const allProducts = productsRes.data.data || [];
              setProducts(allProducts);
              const outOfStock = allProducts.filter(p => p.quantity === 0);
              setOutOfStockProducts(outOfStock);
            }
            return true;
          }
        } catch (error) {
          Swal.showValidationMessage(error.response?.data?.message || "Failed to add stock");
          return false;
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: "success",
          title: "Stock Added!",
          text: "Product is now back in stock.",
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Product Name", "Category", "Price", "Last Updated", "Product ID"];
    const csvData = filteredProducts.map(product => [
      product.name,
      product.category || "N/A",
      product.price || 0,
      formatDate(product.updatedAt || product.createdAt),
      product._id
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `out-of-stock-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Report exported successfully!");
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <FiArrowLeft className="text-gray-600" size={24} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Out of Stock
                  </h1>
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                    {outOfStockProducts.length} Products
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  Products that need immediate restocking
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                disabled={filteredProducts.length === 0}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  filteredProducts.length > 0
                    ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <FiDownload size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FiRefreshCw size={16} />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <Link href="/inventory-home/products">
                <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                  <FiPlus size={16} />
                  <span className="hidden sm:inline">Add Product</span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {outOfStockProducts.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FaBoxOpen className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(outOfStockProducts.reduce((sum, p) => sum + (p.price || 0), 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiDollarSign className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {new Set(outOfStockProducts.map(p => p.category)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiPackage className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Need Restock</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {outOfStockProducts.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FaExclamationTriangle className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by product name, category, or ID..."
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
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 bg-white"
              >
                <span>Sort: {sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
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

          {/* Mobile Filters Dropdown */}
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
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 bg-white"
                >
                  <span>Sort: {sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Products Table/Card View */}
        {filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiPackage className="text-green-600" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Out of Stock Products
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || categoryFilter !== "all"
                  ? "No products match your filter criteria."
                  : "All products are in stock. Great job managing your inventory!"}
              </p>
              {(searchTerm || categoryFilter !== "all") && (
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
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentProducts.map((product, index) => (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center mr-3">
                              <FiPackage className="text-red-600" size={18} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                ID: {product._id?.slice(-8).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                            {product.category || "Uncategorized"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(product.price)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                              0
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {formatDate(product.updatedAt || product.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAddStock(product)}
                              className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
                            >
                              <FiPlus size={14} />
                              Add Stock
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                              title="Edit Product"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                              title="Delete Product"
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
              {currentProducts.map((product) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center">
                        <FiPackage className="text-red-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          ID: {product._id?.slice(-8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                      Out of Stock
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Category</p>
                      <p className="text-sm font-medium text-gray-900">
                        {product.category || "Uncategorized"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Price</p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(product.updatedAt || product.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Stock Status</p>
                      <p className="text-sm font-medium text-red-600">0 units</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddStock(product)}
                      className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <FiPlus size={16} />
                      Add Stock
                    </button>
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="w-12 h-11 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="w-12 h-11 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <FiTrash2 size={18} />
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
                  <span className="font-semibold text-gray-900">{filteredProducts.length}</span> products
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

        {/* Mobile Bottom Padding */}
        <div className="lg:hidden h-16"></div>
      </div>
    </div>
  );
};

export default OutOfStock;