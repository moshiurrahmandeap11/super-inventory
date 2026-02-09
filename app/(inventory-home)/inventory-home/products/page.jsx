"use client";
import axiosInstance, {
  baseImageURL,
} from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import {
  FiAlertTriangle,
  FiDollarSign,
  FiEdit2,
  FiEye,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiXCircle,
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
  const [filterStock, setFilterStock] = useState("all");
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
          product.category?.toLowerCase().includes(searchLower) ||
          product.supplier?.toLowerCase().includes(searchLower)
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
    .filter((product) => {
      // Stock filter
      if (filterStock === "low") return product.quantity <= 10;
      if (filterStock === "out") return product.quantity === 0;
      if (filterStock === "in") return product.quantity > 10;
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

  // Calculate total cost
  const calculateTotalCost = (costPrice, quantity) => {
    const cost = parseFloat(costPrice) || 0;
    const qty = parseFloat(quantity) || 0;
    return (cost * qty).toFixed(2);
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (!num && num !== 0) return "0";
    return parseFloat(num).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  // Format currency
  const formatCurrency = (num) => {
    if (!num && num !== 0) return "$0.00";
    return `$${parseFloat(num).toFixed(2)}`;
  };

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
                                `,
                                  )
                                  .join("")}
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Price ($)*</label>
                            <input type="number" id="swal-price" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                                   placeholder="0.00" 
                                   min="0" 
                                   step="0.01"
                                   oninput="formatDecimal(this)"
                                   required>
                            <p class="text-xs text-gray-500 mt-1">Enter price with up to 2 decimal places</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Cost Price ($)*</label>
                            <input type="number" id="swal-costPrice" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                                   placeholder="0.00" 
                                   min="0" 
                                   step="0.01"
                                   oninput="formatDecimal(this)"
                                   required>
                            <p class="text-xs text-gray-500 mt-1">Enter cost price with up to 2 decimal places</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Quantity*</label>
                            <input type="number" id="swal-quantity" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                                   placeholder="0" 
                                   min="0" 
                                   step="0.01"
                                   oninput="formatDecimal(this)"
                                   required>
                            <p class="text-xs text-gray-500 mt-1">Enter quantity (supports decimal values like 2.5)</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Supplier*</label>
                            <input type="text" id="swal-supplier" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Supplier name" required>
                        </div>
                    </div>

                    <!-- Total Cost Calculation -->
                    <div id="total-cost-section" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="text-sm font-medium text-blue-800">Total Inventory Cost:</p>
                                <p class="text-xs text-blue-600">Cost Price × Quantity</p>
                            </div>
                            <div>
                                <p id="total-cost-display" class="text-xl font-bold text-blue-900">$0.00</p>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                        <input type="file" id="swal-image" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <div id="swal-description-editor" class="min-h-[200px]"></div>
                    </div>
                </div>
            `,
      width: "800px",
      showCancelButton: true,
      confirmButtonText: "Add Product",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#10B981",
      cancelButtonColor: "#6B7280",
      showLoaderOnConfirm: true,
      didOpen: () => {
        // Format decimal helper function
        window.formatDecimal = function(input) {
          // Allow decimal input with up to 2 decimal places
          let value = input.value;
          if (value && !value.endsWith('.') && value.includes('.')) {
            const decimalParts = value.split('.');
            if (decimalParts[1].length > 2) {
              input.value = decimalParts[0] + '.' + decimalParts[1].substring(0, 2);
            }
          }
        };

        // Initialize RichTextEditor
        const editorContainer = document.getElementById(
          "swal-description-editor",
        );
        if (editorContainer) {
          // Create a container for React component
          editorContainer.innerHTML = '<div id="richtext-editor"></div>';
          
          setTimeout(() => {
            const textarea = document.createElement('textarea');
            textarea.id = 'description-textarea';
            textarea.className = 'w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';
            textarea.placeholder = 'Enter product description...';
            editorContainer.querySelector('#richtext-editor').appendChild(textarea);
            
            textarea.addEventListener('input', (e) => {
              window.currentDescription = e.target.value;
            });
          }, 100);
        }

        // Add event listeners for total cost calculation
        const costPriceInput = document.getElementById('swal-costPrice');
        const quantityInput = document.getElementById('swal-quantity');
        const totalCostDisplay = document.getElementById('total-cost-display');

        const updateTotalCost = () => {
          const cost = costPriceInput.value || 0;
          const qty = quantityInput.value || 0;
          const total = calculateTotalCost(cost, qty);
          totalCostDisplay.textContent = `$${total}`;
        };

        costPriceInput.addEventListener('input', updateTotalCost);
        quantityInput.addEventListener('input', updateTotalCost);
      },
      preConfirm: async () => {
        const name = document.getElementById("swal-name").value;
        const category = document.getElementById("swal-category").value;
        const price = document.getElementById("swal-price").value;
        const costPrice = document.getElementById("swal-costPrice").value;
        const quantity = document.getElementById("swal-quantity").value;
        const supplier = document.getElementById("swal-supplier").value;
        const imageFile = document.getElementById("swal-image").files[0];
        const description = window.currentDescription || "";

        // Validation
        if (
          !name ||
          !category ||
          !price ||
          !costPrice ||
          !quantity ||
          !supplier
        ) {
          Swal.showValidationMessage("Please fill all required fields");
          return false;
        }

        // Check if cost price is less than price
        if (parseFloat(costPrice) > parseFloat(price)) {
          Swal.showValidationMessage("Cost price cannot be higher than selling price");
          return false;
        }

        // Check if values are valid numbers
        if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
          Swal.showValidationMessage("Please enter a valid price");
          return false;
        }

        if (isNaN(parseFloat(costPrice)) || parseFloat(costPrice) < 0) {
          Swal.showValidationMessage("Please enter a valid cost price");
          return false;
        }

        if (isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0) {
          Swal.showValidationMessage("Please enter a valid quantity");
          return false;
        }

        try {
          const formData = new FormData();
          formData.append("name", name);
          formData.append("category", category);
          formData.append("price", parseFloat(price).toFixed(2));
          formData.append("costPrice", parseFloat(costPrice).toFixed(2));
          formData.append("quantity", parseFloat(quantity));
          formData.append("supplier", supplier);
          formData.append("description", description);
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
              response.data.message || "Failed to add product",
            );
            return false;
          }
        } catch (error) {
          Swal.showValidationMessage(
            error.response?.data?.message || "Failed to add product",
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
                                    <option value="${cat.name}" ${product.category === cat.name ? 'selected' : ''}>
                                        ${cat.name}
                                    </option>
                                `,
                                  )
                                  .join("")}
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Price ($)*</label>
                            <input type="number" id="swal-edit-price" 
                                   value="${product.price || 0}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                                   min="0" 
                                   step="0.01"
                                   oninput="formatDecimalEdit(this)"
                                   required>
                            <p class="text-xs text-gray-500 mt-1">Enter price with up to 2 decimal places</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Cost Price ($)*</label>
                            <input type="number" id="swal-edit-costPrice" 
                                   value="${product.costPrice || 0}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                                   min="0" 
                                   step="0.01"
                                   oninput="formatDecimalEdit(this)"
                                   required>
                            <p class="text-xs text-gray-500 mt-1">Enter cost price with up to 2 decimal places</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Quantity*</label>
                            <input type="number" id="swal-edit-quantity" 
                                   value="${product.quantity || 0}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                                   min="0" 
                                   step="0.01"
                                   oninput="formatDecimalEdit(this)"
                                   required>
                            <p class="text-xs text-gray-500 mt-1">Enter quantity (supports decimal values like 2.5)</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Supplier*</label>
                            <input type="text" id="swal-edit-supplier" value="${product.supplier || ""}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required>
                        </div>
                    </div>

                    <!-- Total Cost Calculation -->
                    <div id="edit-total-cost-section" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="text-sm font-medium text-blue-800">Total Inventory Cost:</p>
                                <p class="text-xs text-blue-600">Cost Price × Quantity</p>
                            </div>
                            <div>
                                <p id="edit-total-cost-display" class="text-xl font-bold text-blue-900">$${calculateTotalCost(product.costPrice, product.quantity)}</p>
                            </div>
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
                        <div id="swal-edit-description-editor" class="min-h-[200px]"></div>
                    </div>
                </div>
            `,
      width: "800px",
      showCancelButton: true,
      confirmButtonText: "Update Product",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3B82F6",
      cancelButtonColor: "#6B7280",
      showLoaderOnConfirm: true,
      didOpen: () => {
        // Format decimal helper function for edit
        window.formatDecimalEdit = function(input) {
          // Allow decimal input with up to 2 decimal places
          let value = input.value;
          if (value && !value.endsWith('.') && value.includes('.')) {
            const decimalParts = value.split('.');
            if (decimalParts[1].length > 2) {
              input.value = decimalParts[0] + '.' + decimalParts[1].substring(0, 2);
            }
          }
        };

        // Initialize RichTextEditor for edit
        const editorContainer = document.getElementById(
          "swal-edit-description-editor",
        );
        if (editorContainer) {
          editorContainer.innerHTML = '<div id="edit-richtext-editor"></div>';
          
          setTimeout(() => {
            const textarea = document.createElement('textarea');
            textarea.id = 'edit-description-textarea';
            textarea.className = 'w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';
            textarea.placeholder = 'Enter product description...';
            textarea.value = product.description || '';
            editorContainer.querySelector('#edit-richtext-editor').appendChild(textarea);
            
            textarea.addEventListener('input', (e) => {
              window.currentEditDescription = e.target.value;
            });
          }, 100);
        }

        // Add event listeners for total cost calculation
        const costPriceInput = document.getElementById('swal-edit-costPrice');
        const quantityInput = document.getElementById('swal-edit-quantity');
        const totalCostDisplay = document.getElementById('edit-total-cost-display');

        const updateTotalCost = () => {
          const cost = costPriceInput.value || 0;
          const qty = quantityInput.value || 0;
          const total = calculateTotalCost(cost, qty);
          totalCostDisplay.textContent = `$${total}`;
        };

        costPriceInput.addEventListener('input', updateTotalCost);
        quantityInput.addEventListener('input', updateTotalCost);
      },
      preConfirm: async () => {
        const name = document.getElementById("swal-edit-name").value;
        const category = document.getElementById("swal-edit-category").value;
        const price = document.getElementById("swal-edit-price").value;
        const costPrice = document.getElementById("swal-edit-costPrice").value;
        const quantity = document.getElementById("swal-edit-quantity").value;
        const supplier = document.getElementById("swal-edit-supplier").value;
        const imageFile = document.getElementById("swal-edit-image").files[0];
        const description =
          window.currentEditDescription || product.description || "";

        // Validation
        if (
          !name ||
          !category ||
          !price ||
          !costPrice ||
          !quantity ||
          !supplier
        ) {
          Swal.showValidationMessage("Please fill all required fields");
          return false;
        }

        // Check if cost price is less than price
        if (parseFloat(costPrice) > parseFloat(price)) {
          Swal.showValidationMessage("Cost price cannot be higher than selling price");
          return false;
        }

        // Check if values are valid numbers
        if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
          Swal.showValidationMessage("Please enter a valid price");
          return false;
        }

        if (isNaN(parseFloat(costPrice)) || parseFloat(costPrice) < 0) {
          Swal.showValidationMessage("Please enter a valid cost price");
          return false;
        }

        if (isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0) {
          Swal.showValidationMessage("Please enter a valid quantity");
          return false;
        }

        try {
          const formData = new FormData();
          formData.append("name", name);
          formData.append("category", category);
          formData.append("price", parseFloat(price).toFixed(2));
          formData.append("costPrice", parseFloat(costPrice).toFixed(2));
          formData.append("quantity", parseFloat(quantity));
          formData.append("supplier", supplier);
          formData.append("description", description);
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
            },
          );

          if (response.data.success) {
            return true;
          } else {
            Swal.showValidationMessage(
              response.data.message || "Failed to update product",
            );
            return false;
          }
        } catch (error) {
          Swal.showValidationMessage(
            error.response?.data?.message || "Failed to update product",
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
            `/products/${product._id}`,
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
            error.response?.data?.message || "Failed to delete product",
          );
        }
      }
    });
  };

  // Handle View Product Details
  const handleViewProduct = (product) => {
    const totalCost = calculateTotalCost(product.costPrice, product.quantity);
    const totalValue = (Number(product.price) * Number(product.quantity)).toFixed(2);
    
    Swal.fire({
      title: product.name,
      html: `
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <p class="text-lg font-semibold text-gray-900">${product.category || "N/A"}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                            <p class="text-lg font-semibold text-gray-900">${product.supplier || "N/A"}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-blue-50 p-3 rounded-lg">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Price</label>
                            <p class="text-xl font-bold text-blue-900">${formatCurrency(product.price)}</p>
                        </div>
                        <div class="bg-green-50 p-3 rounded-lg">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                            <p class="text-xl font-bold text-green-900">${formatCurrency(product.costPrice)}</p>
                        </div>
                        <div class="bg-purple-50 p-3 rounded-lg">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Profit</label>
                            <p class="text-xl font-bold text-purple-900">${formatCurrency(product.profit)}</p>
                        </div>
                    </div>

                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="text-sm font-medium text-yellow-800">Total Inventory Value:</p>
                                <p class="text-xs text-yellow-600">Price × Quantity</p>
                            </div>
                            <div>
                                <p class="text-xl font-bold text-yellow-900">${formatCurrency(totalValue)}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="text-sm font-medium text-red-800">Total Inventory Cost:</p>
                                <p class="text-xs text-red-600">Cost Price × Quantity</p>
                            </div>
                            <div>
                                <p class="text-xl font-bold text-red-900">${formatCurrency(totalCost)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                            <div class="flex items-center">
                                <p class="text-2xl font-bold ${product.quantity <= 10 ? "text-red-600" : "text-gray-900"}">${formatNumber(product.quantity)}</p>
                                ${
                                  product.quantity === 0
                                    ? '<span class="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Out of Stock</span>'
                                    : product.quantity <= 10
                                    ? '<span class="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Low Stock</span>'
                                    : '<span class="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">In Stock</span>'
                                }
                            </div>
                            <div class="mt-2">
                                <div class="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Stock Level</span>
                                    <span>${formatNumber(product.quantity)} units</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="h-2 rounded-full ${
                                      product.quantity === 0 ? 'bg-red-500' :
                                      product.quantity <= 10 ? 'bg-yellow-500' :
                                      'bg-green-500'
                                    }" style="width: ${Math.min(100, product.quantity)}%"></div>
                                </div>
                            </div>
                        </div>
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
      width: "800px",
      showConfirmButton: false,
      showCloseButton: true,
    });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterStock("all");
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
            <p className="text-gray-600 mt-2">Manage your inventory products</p>
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
            <p className="text-xs text-gray-500">Low Stock</p>
            <p className="text-lg font-bold text-red-600">
              {products.filter((p) => p.quantity <= 10).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Out of Stock</p>
            <p className="text-lg font-bold text-yellow-600">
              {products.filter((p) => p.quantity === 0).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Total Value</p>
            <p className="text-lg font-bold text-green-600">
              ${formatNumber(products.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 0), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop View Stats */}
      <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {products.filter((p) => p.quantity <= 10).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FiAlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold text-yellow-600">
                {products.filter((p) => p.quantity === 0).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiXCircle className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-green-600">
                ${formatNumber(products.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 0), 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="text-green-600" size={24} />
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
                placeholder="Search products by name, category, or supplier..."
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

          {/* Stock Filter */}
          <div>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Stock</option>
              <option value="in">In Stock (10+)</option>
              <option value="low">Low Stock (≤10)</option>
              <option value="out">Out of Stock</option>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or add a new product</p>
              <button
                onClick={handleAddProduct}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center"
              >
                <FiPlus className="mr-2" />
                Add Product
              </button>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const totalValue = (Number(product.price) * Number(product.quantity)).toFixed(2);
              return (
                <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">${formatNumber(product.price)}</p>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 mt-1 inline-block">
                          {product.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        product.quantity === 0
                          ? "text-red-600"
                          : product.quantity <= 10
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}>
                        {formatNumber(product.quantity)} in stock
                      </p>
                      <p className="text-xs text-gray-500">${formatNumber(totalValue)} value</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                      <p>{product.supplier}</p>
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
              );
            })
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
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
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
                filteredProducts.map((product) => {
                  const totalValue = (Number(product.price) * Number(product.quantity)).toFixed(2);
                  const totalCost = calculateTotalCost(product.costPrice, product.quantity);
                  return (
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${formatNumber(product.price)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Cost: ${formatNumber(product.costPrice)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="mr-2">
                            <span
                              className={`text-sm font-medium ${
                                product.quantity === 0
                                  ? "text-red-600"
                                  : product.quantity <= 10
                                    ? "text-yellow-600"
                                    : "text-green-600"
                              }`}
                            >
                              {formatNumber(product.quantity)}
                            </span>
                          </div>
                          <div className="w-20">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  product.quantity === 0
                                    ? "bg-red-500"
                                    : product.quantity <= 10
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                }`}
                                style={{
                                  width: `${Math.min(100, product.quantity)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${formatNumber(totalValue)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Cost: ${formatNumber(totalCost)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.supplier}
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
                  );
                })
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
        <div className="text-xs text-gray-400">
          Total Inventory Value: $
          {formatNumber(filteredProducts.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 0), 0))}
        </div>
      </div>
    </div>
  );
};

export default Products;