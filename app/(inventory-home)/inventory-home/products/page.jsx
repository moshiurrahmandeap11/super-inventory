"use client";
import axiosInstance, {
  baseImageURL,
} from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import {
  FiEdit2,
  FiEye,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2
} from "react-icons/fi";
import Lottie from "react-lottie";
import Swal from "sweetalert2";

import {
  default as loadingAnimation,
  default as successAnimation,
} from "@/public/success-animation.json";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterCategory, setFilterCategory] = useState("all");
  const [categories, setCategories] = useState([]);

  // Lottie options
  const successOptions = {
    loop: false,
    autoplay: true,
    animationData: successAnimation,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const loadingOptions = {
    loop: true,
    autoplay: true,
    animationData: loadingAnimation,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  // Fetch products
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/products");
      if (res.data.success) {
        setProducts(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/product-categories");
      if (res.data.success) {
        setCategories(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          product.name?.toLowerCase().includes(searchLower) ||
          product.category?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter((product) => {
      // Category filter
      if (filterCategory !== "all") {
        return product.category === filterCategory;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by name
      if (sortOrder === "asc") {
        return a.name?.localeCompare(b.name);
      } else {
        return b.name?.localeCompare(a.name);
      }
    });

  // Handle Add Product
  const handleAddProduct = () => {
    Swal.fire({
      title: "Add New Product",
      html: `
        <div class="space-y-4" id="add-product-form">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Product Name*</label>
              <input type="text" id="swal-name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Enter product name" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category*</label>
              <select id="swal-category" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required>
                <option value="">Select Category</option>
                ${categories
                  .map(
                    (cat) => `
                    <option value="${cat.name}">
                      ${cat.name}
                    </option>
                  `
                  )
                  .join("")}
              </select>
            </div>
          </div>
                    
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
            <input type="file" id="swal-image" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
          </div>
                    
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="swal-description" class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Enter product description..."></textarea>
          </div>
        </div>
      `,
      width: "600px",
      showCancelButton: true,
      confirmButtonText: "Add Product",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#10B981",
      cancelButtonColor: "#6B7280",
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const name = document.getElementById("swal-name").value;
        const category = document.getElementById("swal-category").value;
        const imageFile = document.getElementById("swal-image").files[0];
        const description = document.getElementById("swal-description").value;

        // Validation
        if (!name || !category) {
          Swal.showValidationMessage("Please fill all required fields");
          return false;
        }

        try {
          const formData = new FormData();
          formData.append("name", name);
          formData.append("category", category);
          formData.append("description", description || "");
          if (imageFile) {
            formData.append("image", imageFile);
          }

          const response = await axiosInstance.post("/products", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          if (response.data.success) {
            return true;
          } else {
            Swal.showValidationMessage(
              response.data.message || "Failed to add product"
            );
            return false;
          }
        } catch (error) {
          Swal.showValidationMessage(
            error.response?.data?.message || "Failed to add product"
          );
          return false;
        }
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Show success animation
        Swal.fire({
          title: "Success!",
          html: `
            <div class="text-center">
              <div class="mb-4">
                <Lottie options={successOptions} height={100} width={100} />
              </div>
              <p class="text-lg font-semibold text-gray-900">Product added successfully!</p>
            </div>
          `,
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
        }).then(() => {
          fetchProducts();
          toast.success("Product added successfully!");
        });
      }
    });
  };

  // Handle Edit Product
  const handleEditProduct = (product) => {
    Swal.fire({
      title: "Edit Product",
      html: `
        <div class="space-y-4" id="edit-product-form">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Product Name*</label>
              <input type="text" id="swal-edit-name" value="${product.name || ""}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category*</label>
              <select id="swal-edit-category" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required>
                <option value="">Select Category</option>
                ${categories
                  .map(
                    (cat) => `
                    <option value="${cat.name}" ${product.category === cat.name ? "selected" : ""}>
                      ${cat.name}
                    </option>
                  `
                  )
                  .join("")}
              </select>
            </div>
          </div>
                    
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Current Image</label>
            ${
              product.image
                ? `
              <div class="flex items-center space-x-4">
                <img src="${`${baseImageURL}${product.image}`}" alt="${product.name}" class="w-20 h-20 object-cover rounded-lg">
                <span class="text-sm text-gray-500">Current product image</span>
              </div>
            `
                : '<p class="text-sm text-gray-500">No image uploaded</p>'
            }
          </div>
                    
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Update Image</label>
            <input type="file" id="swal-edit-image" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <p class="text-xs text-gray-500 mt-1">Leave empty to keep current image</p>
          </div>
                    
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="swal-edit-description" class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Enter product description...">${product.description || ""}</textarea>
          </div>
        </div>
      `,
      width: "600px",
      showCancelButton: true,
      confirmButtonText: "Update Product",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3B82F6",
      cancelButtonColor: "#6B7280",
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const name = document.getElementById("swal-edit-name").value;
        const category = document.getElementById("swal-edit-category").value;
        const imageFile = document.getElementById("swal-edit-image").files[0];
        const description = document.getElementById("swal-edit-description").value;

        // Validation
        if (!name || !category) {
          Swal.showValidationMessage("Please fill all required fields");
          return false;
        }

        try {
          const formData = new FormData();
          formData.append("name", name);
          formData.append("category", category);
          formData.append("description", description || "");
          if (imageFile) {
            formData.append("image", imageFile);
          }

          const response = await axiosInstance.patch(
            `/products/${product._id}`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (response.data.success) {
            return true;
          } else {
            Swal.showValidationMessage(
              response.data.message || "Failed to update product"
            );
            return false;
          }
        } catch (error) {
          Swal.showValidationMessage(
            error.response?.data?.message || "Failed to update product"
          );
          return false;
        }
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Show success animation
        Swal.fire({
          title: "Success!",
          html: `
            <div class="text-center">
              <div class="mb-4">
                <Lottie options={successOptions} height={100} width={100} />
              </div>
              <p class="text-lg font-semibold text-gray-900">Product updated successfully!</p>
            </div>
          `,
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
        }).then(() => {
          fetchProducts();
          toast.success("Product updated successfully!");
        });
      }
    });
  };

  // Handle Delete Product
  const handleDeleteProduct = (product) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Delete "${product.name}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axiosInstance.delete(
            `/products/${product._id}`
          );

          if (response.data.success) {
            Swal.fire({
              title: "Deleted!",
              html: `
                <div class="text-center">
                  <div class="mb-4">
                    <Lottie options={successOptions} height={100} width={100} />
                  </div>
                  <p class="text-lg font-semibold text-gray-900">Product deleted successfully!</p>
                </div>
              `,
              showConfirmButton: false,
              timer: 2000,
            }).then(() => {
              fetchProducts();
              toast.success("Product deleted successfully!");
            });
          } else {
            toast.error(response.data.message || "Failed to delete product");
          }
        } catch (error) {
          toast.error(
            error.response?.data?.message || "Failed to delete product"
          );
        }
      }
    });
  };

  // Handle View Product Details
  const handleViewProduct = (product) => {
    Swal.fire({
      title: product.name,
      html: `
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <p class="text-lg font-semibold text-gray-900">${product.category || "N/A"}</p>
            </div>
          </div>
                    
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
              <p class="text-lg font-semibold text-gray-900">${new Date(product.createdAt).toLocaleDateString()}</p>
              <p class="text-sm text-gray-500">Last updated: ${new Date(product.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
                    
          ${
            product.image
              ? `
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
              <div class="flex justify-center">
                <img src="${`${baseImageURL}${product.image}`}" alt="${product.name}" class="max-w-full h-64 object-contain rounded-lg">
              </div>
            </div>
          `
              : ""
          }
                    
          ${
            product.description
              ? `
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <div class="p-3 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                ${product.description}
              </div>
            </div>
          `
              : ""
          }
        </div>
      `,
      width: "600px",
      showConfirmButton: false,
      showCloseButton: true,
    });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setSortOrder("asc");
  };

  // Extract unique categories from products
  const uniqueCategories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Lottie options={loadingOptions} height={100} width={100} />
          <p className="text-gray-600 mt-4">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Products
            </h1>
            <p className="text-gray-600 mt-2">Manage your products</p>
          </div>
          <button
            onClick={handleAddProduct}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
          >
            <FiPlus className="mr-2" size={20} />
            Add Product
          </button>
        </div>
      </div>

      {/* Mobile View Stats */}
      <div className="block lg:hidden mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Total Products</p>
            <p className="text-lg font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Categories</p>
            <p className="text-lg font-bold text-blue-600">{uniqueCategories.length}</p>
          </div>
        </div>
      </div>

      {/* Desktop View Stats */}
      <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiPackage className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-2xl font-bold text-blue-600">
                {uniqueCategories.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiPackage className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">With Images</p>
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p.image).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiPackage className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort and Reset */}
          <div className="md:col-span-4 flex justify-between items-center mt-2">
            <div className="flex items-center space-x-4">
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="flex items-center text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors text-sm"
              >
                {sortOrder === "asc" ? (
                  <>
                    <FaSortAmountDown className="mr-2" /> A-Z
                  </>
                ) : (
                  <>
                    <FaSortAmountUp className="mr-2" /> Z-A
                  </>
                )}
              </button>
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors text-sm"
            >
              <FiRefreshCw className="mr-2" />
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Products Cards */}
      <div className="block lg:hidden">
        <div className="space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <FiPackage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your filters or add a new product
              </p>
              <button
                onClick={handleAddProduct}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center"
              >
                <FiPlus className="mr-2" />
                Add Product
              </button>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start">
                    {product.image ? (
                      <img
                        src={`${baseImageURL}${product.image}`}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover mr-3"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                        <FiPackage className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {product.name}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 mt-1 inline-block">
                        {product.category}
                      </span>
                      {product.description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    <p>Added: {new Date(product.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewProduct(product)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <FiEye size={16} />
                    </button>
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-yellow-600 hover:text-yellow-900 bg-yellow-50 hover:bg-yellow-100 p-2 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Desktop Products Table */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="text-gray-500">
                      <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-lg font-medium">
                        No products found
                      </p>
                      <p className="mt-1">
                        Try adjusting your filters or add a new product
                      </p>
                      <button
                        onClick={handleAddProduct}
                        className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center"
                      >
                        <FiPlus className="mr-2" />
                        Add Product
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image ? (
                          <img
                            src={`${baseImageURL}${product.image}`}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                            <FiPackage className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {product._id?.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {product.description || "No description"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewProduct(product)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-md transition-colors"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-yellow-600 hover:text-yellow-900 bg-yellow-50 hover:bg-yellow-100 p-2 rounded-md transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Info */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing <span className="font-medium">{filteredProducts.length}</span>{" "}
          of <span className="font-medium">{products.length}</span> products
        </div>
      </div>
    </div>
  );
};

export default Products;