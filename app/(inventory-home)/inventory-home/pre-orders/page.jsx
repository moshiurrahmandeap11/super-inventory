"use client";
import axiosInstance from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiShoppingCart,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX
} from "react-icons/fi";
import Swal from "sweetalert2";

const PreOrders = () => {
  const [preOrders, setPreOrders] = useState([]);
  const [filteredPreOrders, setFilteredPreOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPreOrder, setSelectedPreOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedSalesManager, setSelectedSalesManager] = useState("");
  const [convertDiscount, setConvertDiscount] = useState(0);
  const [convertVat, setConvertVat] = useState(0);
  const [duePayment, setDuePayment] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNote, setPaymentNote] = useState("");

  // Fetch pre-orders and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch pre-orders
        const preOrdersRes = await axiosInstance.get("/pre-order-sale");
        if (preOrdersRes.data.success) {
          // Only show pre-orders that haven't been converted
          const activePreOrders = preOrdersRes.data.data?.filter(o => !o.convertedToSale) || [];
          setPreOrders(activePreOrders);
          setFilteredPreOrders(activePreOrders);
        }

        // Fetch users for sales manager dropdown
        const usersRes = await axiosInstance.get("/users");
        if (usersRes.data.success) {
          setUsers(usersRes.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load pre-orders");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter pre-orders based on search
  useEffect(() => {
    let filtered = [...preOrders];
    
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerPhone?.includes(searchTerm) ||
          order._id?.includes(searchTerm)
      );
    }
    
    setFilteredPreOrders(filtered);
  }, [searchTerm, preOrders]);

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `BDT ${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}`;
  };

  // Calculate sale totals
  const calculateSaleTotals = (preOrder) => {
    const subtotal = preOrder.totalAmount || 0;
    const discountAmount = (subtotal * convertDiscount) / 100;
    const amountAfterDiscount = subtotal - discountAmount;
    const vatAmount = (amountAfterDiscount * convertVat) / 100;
    const grandTotal = amountAfterDiscount + vatAmount;
    
    return {
      subtotal,
      discountAmount,
      vatAmount,
      grandTotal
    };
  };

  // Handle convert to sale button click
  const handleConvertClick = (preOrder) => {
    setSelectedPreOrder(preOrder);
    setConvertDiscount(0);
    setConvertVat(0);
    setDuePayment(preOrder.dueAmount || 0);
    setPaymentMethod("cash");
    setPaymentNote("");
    setSelectedSalesManager("");
    setIsModalOpen(true);
  };

  // Handle confirm conversion with due payment
  const handleConfirmConversion = async () => {
    if (!selectedSalesManager) {
      toast.error("Please select a sales manager");
      return;
    }

    if (!selectedPreOrder) return;

    if (duePayment < 0) {
      toast.error("Due payment cannot be negative");
      return;
    }

    if (duePayment > selectedPreOrder.dueAmount) {
      toast.error(`Due payment cannot exceed ${formatCurrency(selectedPreOrder.dueAmount)}`);
      return;
    }

    try {
      setSubmitting(true);

      const totals = calculateSaleTotals(selectedPreOrder);
      
      // Calculate final payment
      const advancePaid = selectedPreOrder.paidAmount || 0;
      const additionalPayment = duePayment;
      const totalPaid = advancePaid + additionalPayment;
      const finalDue = totals.grandTotal - totalPaid;

      // Prepare data for sales-invoices
      const saleData = {
        productID: selectedPreOrder.productID,
        productName: selectedPreOrder.productName,
        productCategory: selectedPreOrder.productCategory,
        productPrice: selectedPreOrder.productPrice,
        productQty: selectedPreOrder.productQTY,
        discount: totals.discountAmount,
        vat: convertVat,
        paidAmount: totalPaid,
        salesManager: selectedSalesManager,
        customerName: selectedPreOrder.customerName,
        customerPhone: selectedPreOrder.customerPhone,
        customerAddress: selectedPreOrder.customerAddress,
        // Payment details
        paymentMethod,
        paymentNote: paymentNote || `Converted from pre-order. Advance: ${formatCurrency(advancePaid)}, Additional: ${formatCurrency(additionalPayment)}`,
        // Tracking
        convertedFromPreOrder: selectedPreOrder._id,
        originalPreOrderDate: selectedPreOrder.createdAt,
        preOrderAdvance: advancePaid,
        additionalPayment: additionalPayment
      };

      console.log("Converting to sale:", saleData);

      // Send to sales-invoices
      const response = await axiosInstance.post("/sales-invoices", saleData);

      if (response.data.success) {
        // DELETE the pre-order after successful conversion
        await axiosInstance.delete(`/pre-order-sale/${selectedPreOrder._id}`);

        toast.success("Pre-order converted to sale and removed successfully!");
        setIsModalOpen(false);
        
        // Refresh pre-orders list - remove the converted one
        const updatedPreOrders = preOrders.filter(o => o._id !== selectedPreOrder._id);
        setPreOrders(updatedPreOrders);
        setFilteredPreOrders(updatedPreOrders);

        // Show success message with payment details
        Swal.fire({
          icon: "success",
          title: "Converted Successfully!",
          html: `
            <div class="text-center space-y-3">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <FiCheckCircle class="w-8 h-8 text-green-600" />
              </div>
              <p class="text-lg font-semibold text-gray-900">Pre-Order Converted to Sale</p>
              <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                <p class="text-sm font-medium text-gray-700">Invoice: ${response.data.data.invoiceNumber}</p>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Grand Total:</span>
                  <span class="font-bold text-blue-600">${formatCurrency(totals.grandTotal)}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Advance Paid:</span>
                  <span class="font-medium text-green-600">${formatCurrency(advancePaid)}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Additional Payment:</span>
                  <span class="font-medium text-green-600">${formatCurrency(additionalPayment)}</span>
                </div>
                <div class="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span class="text-gray-600">Total Paid:</span>
                  <span class="font-semibold text-green-600">${formatCurrency(totalPaid)}</span>
                </div>
                ${finalDue > 0 ? `
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Due Amount:</span>
                    <span class="font-semibold text-orange-600">${formatCurrency(finalDue)}</span>
                  </div>
                ` : `
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Payment Status:</span>
                    <span class="font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Paid in Full</span>
                  </div>
                `}
              </div>
            </div>
          `,
          confirmButtonColor: "#3B82F6",
          confirmButtonText: "Done"
        });
      }
    } catch (error) {
      console.error("Error converting pre-order:", error);
      toast.error(error.response?.data?.message || "Failed to convert pre-order");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete pre-order
  const handleDeletePreOrder = (preOrder) => {
    Swal.fire({
      title: "Delete Pre-Order?",
      text: "This action cannot be undone. The pre-order will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosInstance.delete(`/pre-order-sale/${preOrder._id}`);
          
          // Remove from state
          const updatedPreOrders = preOrders.filter(o => o._id !== preOrder._id);
          setPreOrders(updatedPreOrders);
          setFilteredPreOrders(updatedPreOrders);
          
          toast.success("Pre-order deleted successfully");
          
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Pre-order has been deleted.",
            timer: 1500,
            showConfirmButton: false
          });
        } catch (error) {
          console.error("Error deleting pre-order:", error);
          toast.error("Failed to delete pre-order");
        }
      }
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
              {[1,2,3,4].map(i => (
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Pre-Orders Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Convert pre-orders to sales with due payment
                </p>
              </div>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  const res = await axiosInstance.get("/pre-order-sale");
                  if (res.data.success) {
                    const activePreOrders = res.data.data?.filter(o => !o.convertedToSale) || [];
                    setPreOrders(activePreOrders);
                    setFilteredPreOrders(activePreOrders);
                    toast.success("Data refreshed!");
                  }
                } catch (error) {
                  toast.error("Failed to refresh");
                } finally {
                  setLoading(false);
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Pre-Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {preOrders.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiShoppingCart className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Advance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(preOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiCreditCard className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Due</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(preOrders.reduce((sum, o) => sum + (o.dueAmount || 0), 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiClock className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(preOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiDollarSign className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by customer name, phone, product or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
        </div>

        {/* Pre-Orders List */}
        {filteredPreOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiShoppingCart className="text-gray-400" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Active Pre-Orders
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? "No pre-orders match your search criteria."
                  : "All pre-orders have been converted to sales. Create a new pre-order to get started."}
              </p>
              {!searchTerm && (
                <a
                  href="/pre-order"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                >
                  <FiPackage className="mr-2" />
                  Create New Pre-Order
                </a>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Pre-Order Info
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPreOrders.map((order, index) => {
                      const duePercentage = (order.dueAmount / order.totalAmount) * 100;
                      
                      return (
                        <motion.tr
                          key={order._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-mono text-xs text-gray-500">
                              #{order._id?.slice(-8).toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatDate(order.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {order.customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customerPhone}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {order.productName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Qty: {order.productQTY} × {formatCurrency(order.productPrice)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(order.totalAmount)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Advance:</span>
                                <span className="font-medium text-green-600">
                                  {formatCurrency(order.paidAmount)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Due:</span>
                                <span className="font-medium text-orange-600">
                                  {formatCurrency(order.dueAmount)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                  className="bg-orange-500 h-1.5 rounded-full"
                                  style={{ width: `${duePercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {formatDate(order.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleConvertClick(order)}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
                              >
                                <FiCheckCircle size={16} />
                                Convert
                              </button>
                              <button
                                onClick={() => handleDeletePreOrder(order)}
                                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                                title="Delete Pre-Order"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-4">
              {filteredPreOrders.map((order) => {
                const duePercentage = (order.dueAmount / order.totalAmount) * 100;
                
                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FiUser className="text-blue-500" size={16} />
                          <span className="font-semibold text-gray-900">
                            {order.customerName}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 ml-6">
                          {order.customerPhone}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xs text-gray-500">
                          #{order._id?.slice(-8).toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Product</p>
                        <p className="font-medium text-gray-900 truncate">
                          {order.productName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Qty: {order.productQTY}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                        <p className="font-bold text-blue-600">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Unit: {formatCurrency(order.productPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Advance Paid</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(order.paidAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Due Amount</span>
                        <span className="font-medium text-orange-600">
                          {formatCurrency(order.dueAmount)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-orange-500 h-1.5 rounded-full"
                          style={{ width: `${duePercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConvertClick(order)}
                        className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <FiCheckCircle size={18} />
                        Convert to Sale
                      </button>
                      <button
                        onClick={() => handleDeletePreOrder(order)}
                        className="w-12 h-12 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Convert to Sale Modal with Due Payment */}
        <AnimatePresence>
          {isModalOpen && selectedPreOrder && (
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
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FiCheckCircle className="text-green-600" size={20} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Convert to Sale
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Complete the payment to convert pre-order to sale
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
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Pre-order Summary Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                      <FiShoppingCart className="mr-2" size={18} />
                      Pre-Order Summary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Customer:</span>
                          <span className="font-medium text-gray-900">{selectedPreOrder.customerName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium text-gray-900">{selectedPreOrder.customerPhone}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Product:</span>
                          <span className="font-medium text-gray-900">{selectedPreOrder.productName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium text-gray-900">{selectedPreOrder.productQTY} pcs</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Unit Price:</span>
                          <span className="font-medium text-gray-900">{formatCurrency(selectedPreOrder.productPrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium text-gray-900">{formatCurrency(selectedPreOrder.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Advance Paid:</span>
                          <span className="font-medium text-green-600">{formatCurrency(selectedPreOrder.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Due Amount:</span>
                          <span className="font-medium text-orange-600">{formatCurrency(selectedPreOrder.dueAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discount & VAT Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Discount (%)
                        <span className="text-gray-400 text-xs ml-2">(Optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={convertDiscount}
                          onChange={(e) => setConvertDiscount(parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          placeholder="0%"
                        />
                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        VAT/Tax (%)
                        <span className="text-gray-400 text-xs ml-2">(Optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={convertVat}
                          onChange={(e) => setConvertVat(parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          placeholder="0%"
                        />
                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Due Payment Section */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-200">
                    <h3 className="font-semibold text-orange-900 mb-4 flex items-center">
                      <FiDollarSign className="mr-2" size={18} />
                      Due Payment Collection
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Due Amount Display */}
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm text-gray-600">Total Due Amount:</span>
                        <span className="text-lg font-bold text-orange-600">
                          {formatCurrency(selectedPreOrder.dueAmount)}
                        </span>
                      </div>

                      {/* Payment Input */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Pay Now <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">BDT</span>
                          <input
                            type="number"
                            min="0"
                            max={selectedPreOrder.dueAmount}
                            step="0.01"
                            value={duePayment}
                            onChange={(e) => setDuePayment(parseFloat(e.target.value) || 0)}
                            className="w-full pl-16 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                            placeholder="Enter amount"
                          />
                        </div>
                        {duePayment > selectedPreOrder.dueAmount && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <FiAlertCircle className="mr-1" size={14} />
                            Cannot exceed due amount
                          </p>
                        )}
                      </div>

                      {/* Payment Method */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Payment Method
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {["cash", "bkash", "nagad", "bank"].map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                                paymentMethod === method
                                  ? "bg-orange-600 text-white shadow-md"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Payment Note */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Payment Note
                          <span className="text-gray-400 text-xs ml-2">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={paymentNote}
                          onChange={(e) => setPaymentNote(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                          placeholder="Add a note for this payment"
                        />
                      </div>
                    </div>
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
                      {users.map((user) => (
                        <option key={user._id} value={user.fullName || user.name}>
                          {user.fullName || user.name} - {user.role || "Staff"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sale Summary */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Sale Summary</h3>
                    
                    {(() => {
                      const totals = calculateSaleTotals(selectedPreOrder);
                      const additionalPayment = duePayment;
                      const totalPaid = (selectedPreOrder.paidAmount || 0) + additionalPayment;
                      const finalDue = totals.grandTotal - totalPaid;
                      
                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                          </div>
                          
                          {convertDiscount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Discount ({convertDiscount}%):</span>
                              <span>- {formatCurrency(totals.discountAmount)}</span>
                            </div>
                          )}
                          
                          {convertVat > 0 && (
                            <div className="flex justify-between text-sm text-blue-600">
                              <span>VAT ({convertVat}%):</span>
                              <span>+ {formatCurrency(totals.vatAmount)}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between pt-2 border-t border-gray-200">
                            <span className="font-semibold">Grand Total:</span>
                            <span className="font-bold text-blue-600">{formatCurrency(totals.grandTotal)}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Advance Paid:</span>
                            <span className="font-medium text-green-600">{formatCurrency(selectedPreOrder.paidAmount)}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Additional Payment:</span>
                            <span className="font-medium text-green-600">{formatCurrency(additionalPayment)}</span>
                          </div>
                          
                          <div className="flex justify-between pt-2 border-t border-gray-200">
                            <span className="font-semibold">Total Paid:</span>
                            <span className="font-bold text-green-600">{formatCurrency(totalPaid)}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="font-semibold">Final Due:</span>
                            <span className={`font-bold ${finalDue > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              {finalDue > 0 ? formatCurrency(finalDue) : 'Paid in Full'}
                            </span>
                          </div>
                          
                          {finalDue === 0 && (
                            <div className="mt-2 p-2 bg-green-100 rounded-lg text-center">
                              <span className="text-sm font-medium text-green-800">
                                ✓ This invoice will be marked as PAID
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Important Note */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FiAlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Once confirmed, this pre-order will be permanently deleted and converted to a sale invoice.
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Stock will be reduced and invoice will be generated. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors order-2 sm:order-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmConversion}
                      disabled={
                        !selectedSalesManager || 
                        submitting || 
                        duePayment < 0 || 
                        duePayment > selectedPreOrder.dueAmount
                      }
                      className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center order-1 sm:order-2 ${
                        selectedSalesManager && 
                        !submitting && 
                        duePayment >= 0 && 
                        duePayment <= selectedPreOrder.dueAmount
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
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
                          Confirm & Convert
                        </>
                      )}
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

export default PreOrders;