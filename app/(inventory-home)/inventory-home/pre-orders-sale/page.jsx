"use client";
import axiosInstance from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
    FiAlertCircle,
    FiArrowLeft,
    FiCheckCircle,
    FiPackage,
    FiPercent,
    FiShoppingCart,
    FiUser,
    FiUsers,
    FiX
} from "react-icons/fi";
import Swal from "sweetalert2";

const PreOrderSale = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [selectedProduct, setSelectedProduct] = useState("");
  const [productDetails, setProductDetails] = useState({
    name: "",
    category: "",
    price: 0,
    availableQty: 0
  });
  const [quantity, setQuantity] = useState(1);
  
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
    address: ""
  });
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [selectedSalesManager, setSelectedSalesManager] = useState("");

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, customersRes, usersRes] = await Promise.all([
          axiosInstance.get("/products"),
          axiosInstance.get("/customers"),
          axiosInstance.get("/users")
        ]);

        if (productsRes.data.success) setProducts(productsRes.data.data || []);
        if (customersRes.data.success) setCustomers(customersRes.data.data || []);
        if (usersRes.data.success) setUsers(usersRes.data.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle product selection
  const handleProductChange = (e) => {
    const productId = e.target.value;
    setSelectedProduct(productId);
    
    if (productId) {
      const product = products.find(p => p._id === productId);
      if (product) {
        setProductDetails({
          name: product.name || "",
          category: product.category || "",
          price: product.price || 0,
          availableQty: product.quantity || 0
        });
        setQuantity(1); // Reset quantity to 1
      }
    } else {
      setProductDetails({
        name: "",
        category: "",
        price: 0,
        availableQty: 0
      });
      setQuantity(1);
    }
  };

  // Handle customer selection
  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    setSelectedCustomer(customerId);
    
    if (customerId) {
      const customer = customers.find(c => c._id === customerId);
      if (customer) {
        setCustomerDetails({
          name: customer.name || "",
          phone: customer.phone || "",
          address: customer.address || ""
        });
      }
    } else {
      setCustomerDetails({
        name: "",
        phone: "",
        address: ""
      });
    }
  };

  // Calculate totals
  const subtotal = productDetails.price * quantity;
  const discountAmount = (subtotal * discount) / 100;
  const totalAmount = subtotal - discountAmount;
  const paidAmount = totalAmount * 0.5; // 50% advance payment for pre-order
  const dueAmount = totalAmount - paidAmount;

  // Handle convert to sale button click
  const handleConvertToSale = () => {
    // Validation
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }
    if (quantity < 1) {
      toast.error("Please enter valid quantity");
      return;
    }
    if (quantity > productDetails.availableQty) {
      toast.error(`Only ${productDetails.availableQty} units available`);
      return;
    }
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    setIsModalOpen(true);
  };

  // Handle confirm pre-order
  const handleConfirmPreOrder = async () => {
    if (!selectedSalesManager) {
      toast.error("Please select a sales manager");
      return;
    }

    try {
      setSubmitting(true);

      const preOrderData = {
        productID: selectedProduct,
        productName: productDetails.name,
        productCategory: productDetails.category,
        productPrice: productDetails.price,
        productQTY: quantity,
        discount: discount,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        dueAmount: dueAmount,
        customerName: customerDetails.name,
        customerPhone: customerDetails.phone,
        customerAddress: customerDetails.address || "N/A",
        salesManager: selectedSalesManager,
        status: "pre-order",
        createdAt: new Date()
      };

      const response = await axiosInstance.post("/pre-order-sale", preOrderData);

      if (response.data.success) {
        toast.success("Pre-order created successfully!");
        setIsModalOpen(false);
        
        // Reset form
        setSelectedProduct("");
        setProductDetails({ name: "", category: "", price: 0, availableQty: 0 });
        setQuantity(1);
        setSelectedCustomer("");
        setCustomerDetails({ name: "", phone: "", address: "" });
        setDiscount(0);
        setSelectedSalesManager("");
        
        // Show success message
        Swal.fire({
          icon: "success",
          title: "Pre-Order Created!",
          text: `Pre-order has been created successfully. Due amount: BDT ${dueAmount.toFixed(2)}`,
          confirmButtonColor: "#3B82F6"
        });
      }
    } catch (error) {
      console.error("Error creating pre-order:", error);
      toast.error(error.response?.data?.message || "Failed to create pre-order");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
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
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-gray-600" size={24} />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Pre-Order Sale
              </h1>
              <p className="text-gray-600">
                Create pre-orders for customers with advance payment
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Selection Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <FiPackage className="mr-3 text-blue-600" />
                Select Product
              </h2>
              
              <div className="space-y-5">
                {/* Product Dropdown */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={handleProductChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} - {product.category} (Stock: {product.quantity || 0})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto-filled Product Details */}
                {selectedProduct && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200"
                  >
                    <h3 className="font-semibold text-blue-900 mb-4">Product Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Category</label>
                        <input
                          type="text"
                          value={productDetails.category}
                          readOnly
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Price (BDT)</label>
                        <input
                          type="text"
                          value={`BDT ${productDetails.price.toLocaleString()}`}
                          readOnly
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-semibold text-green-600"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Quantity Input */}
                {selectedProduct && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input
                          type="number"
                          min="1"
                          max={productDetails.availableQty}
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div className={`px-4 py-3 rounded-xl ${
                        productDetails.availableQty > 10 
                          ? 'bg-green-100 text-green-800' 
                          : productDetails.availableQty > 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        <span className="text-sm font-medium">
                          Available: {productDetails.availableQty}
                        </span>
                      </div>
                    </div>
                    {quantity > productDetails.availableQty && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <FiAlertCircle className="mr-1" />
                        Quantity exceeds available stock
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Selection Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <FiUser className="mr-3 text-blue-600" />
                Select Customer
              </h2>
              
              <div className="space-y-5">
                {/* Customer Dropdown */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCustomer}
                    onChange={handleCustomerChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto-filled Customer Details */}
                {selectedCustomer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-200"
                  >
                    <h3 className="font-semibold text-purple-900 mb-4">Customer Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Phone</label>
                        <input
                          type="text"
                          value={customerDetails.phone}
                          readOnly
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-600 block mb-1">Address</label>
                        <input
                          type="text"
                          value={customerDetails.address || "N/A"}
                          readOnly
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <FiShoppingCart className="mr-3 text-blue-600" />
                Order Summary
              </h2>

              {selectedProduct && selectedCustomer ? (
                <div className="space-y-6">
                  {/* Product Info */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm text-gray-600">Product</span>
                      <span className="font-semibold text-gray-900">{productDetails.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Quantity</span>
                      <span className="font-semibold text-gray-900">{quantity} pcs</span>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unit Price</span>
                      <span className="font-medium">BDT {productDetails.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">BDT {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center">
                        <FiPercent className="mr-1" size={14} />
                        Discount ({discount}%)
                      </span>
                      <span className="font-medium">- BDT {discountAmount.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount</span>
                        <span className="text-blue-600">BDT {totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                    <h3 className="font-semibold text-orange-900 mb-3">Payment Summary (50% Advance)</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Advance Payment</span>
                        <span className="font-semibold text-green-600">BDT {paidAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Due Amount</span>
                        <span className="font-semibold text-red-600">BDT {dueAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Convert to Sale Button */}
                  <button
                    onClick={handleConvertToSale}
                    disabled={!selectedProduct || !selectedCustomer || quantity > productDetails.availableQty}
                    className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center ${
                      selectedProduct && selectedCustomer && quantity <= productDetails.availableQty
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FiShoppingCart className="mr-3" size={20} />
                    Convert to Pre-Order
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiShoppingCart className="text-gray-400" size={32} />
                  </div>
                  <p className="text-gray-600 font-medium">No product selected</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Select a product and customer to see order summary
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Convert to Sale Modal */}
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
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Confirm Pre-Order</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-gray-500" size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Discount Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FiPercent className="mr-2 text-blue-600" />
                    Discount (%) <span className="text-gray-400 text-xs ml-2">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter discount percentage"
                  />
                </div>

                {/* Sales Manager Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FiUsers className="mr-2 text-blue-600" />
                    Sales Manager <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={selectedSalesManager}
                    onChange={(e) => setSelectedSalesManager(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select sales manager</option>
                    {users.map(user => (
                      <option key={user._id} value={user.fullName || user.name}>
                        {user.fullName || user.name} - {user.role || 'Staff'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Order Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold">BDT {totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Advance (50%):</span>
                      <span className="font-semibold text-green-600">BDT {paidAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Amount:</span>
                      <span className="font-semibold text-orange-600">BDT {dueAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPreOrder}
                    disabled={!selectedSalesManager || submitting}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center ${
                      selectedSalesManager && !submitting
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="mr-2" size={18} />
                        Confirm Pre-Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PreOrderSale;