"use client";
import axiosInstance from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { AnimatePresence, motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
    FaMapMarkerAlt,
    FaPhone,
    FaRegClock,
    FaUserCircle
} from "react-icons/fa";
import {
    FiArrowLeft,
    FiChevronLeft,
    FiChevronRight,
    FiChevronsLeft,
    FiChevronsRight,
    FiClock,
    FiDollarSign,
    FiDownload,
    FiPackage,
    FiRefreshCw,
    FiSearch,
    FiShoppingCart,
    FiTrendingUp,
    FiUser,
    FiX
} from "react-icons/fi";

const TodaySales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dateFilter, setDateFilter] = useState("today");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    avgOrderValue: 0,
    topProduct: null,
    paymentStats: { cash: 0, card: 0, bkash: 0, nagad: 0 }
  });

  // Fetch today's sales
  useEffect(() => {
    const fetchTodaySales = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/sales-items/today-sales");
        
        if (response.data.success) {
          setSales(response.data.data || []);
          setFilteredSales(response.data.data || []);
          calculateStats(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching today's sales:", error);
        toast.error("Failed to load today's sales");
      } finally {
        setLoading(false);
      }
    };
    fetchTodaySales();
  }, []);

  // Calculate statistics
  const calculateStats = (salesData) => {
    const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
    const totalProducts = salesData.reduce((sum, sale) => sum + (sale.productQty || 0), 0);
    const avgOrderValue = salesData.length > 0 ? totalRevenue / salesData.length : 0;
    
    // Find top product
    const productMap = new Map();
    salesData.forEach(sale => {
      const productName = sale.productName;
      productMap.set(productName, (productMap.get(productName) || 0) + 1);
    });
    
    let topProduct = null;
    let maxCount = 0;
    productMap.forEach((count, product) => {
      if (count > maxCount) {
        maxCount = count;
        topProduct = product;
      }
    });

    setStats({
      totalSales: salesData.length,
      totalRevenue,
      totalProducts,
      avgOrderValue,
      topProduct,
      totalCustomers: new Set(salesData.map(s => s.customerPhone)).size
    });
  };

  // Filter and sort sales
  useEffect(() => {
    let filtered = [...sales];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (sale) =>
          sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.customerPhone?.includes(searchTerm) ||
          sale.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale._id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter (already handled by API, but for custom range)
    if (dateFilter === "custom" && customDateRange.start && customDateRange.end) {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= new Date(customDateRange.start) && 
               saleDate <= new Date(customDateRange.end);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortOrder === "asc") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredSales(filtered);
    setCurrentPage(1);
  }, [searchTerm, sortOrder, dateFilter, customDateRange, sales]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredSales.length);
  const currentSales = filteredSales.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setSortOrder("desc");
    setDateFilter("today");
    setCustomDateRange({ start: "", end: "" });
    setCurrentPage(1);
    setShowMobileFilters(false);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `BDT ${amount?.toLocaleString() || 0}`;
  };

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Get time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const saleDate = new Date(date);
    const diffInMinutes = Math.floor((now - saleDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  // Get payment status color
  const getPaymentStatus = (due) => {
    if (due <= 0) return { label: "Paid", color: "bg-green-100 text-green-800" };
    if (due > 0 && due < 1000) return { label: "Partial", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Due", color: "bg-red-100 text-red-800" };
  };

  // Handle view details
  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setShowDetailsModal(true);
  };

  // Generate PDF Invoice
  const generateInvoice = async (sale) => {
    try {
      const doc = new jsPDF();

      // Company Header
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235);
      doc.text("Tamim Traders", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("123 Business Street, Dhaka", 105, 28, { align: "center" });
      doc.text("Phone: +880 1234-567890 | Email: info@tamimtraders.com", 105, 32, { align: "center" });

      // Invoice Title
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("SALES INVOICE", 105, 45, { align: "center" });

      // Invoice Details
      doc.setFontSize(10);
      doc.text(`Invoice #: ${sale.invoiceNumber || "N/A"}`, 20, 60);
      doc.text(`Date: ${formatDate(sale.createdAt)}`, 20, 65);
      doc.text(`Time: ${formatTime(sale.createdAt)}`, 20, 70);
      doc.text(`Sales Manager: ${sale.salesManager || "N/A"}`, 20, 75);

      // Customer Details
      doc.setFontSize(11);
      doc.setTextColor(37, 99, 235);
      doc.text("Customer Information", 120, 60);
      doc.setDrawColor(37, 99, 235);
      doc.line(120, 62, 190, 62);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Name: ${sale.customerName || "N/A"}`, 120, 70);
      doc.text(`Phone: ${sale.customerPhone || "N/A"}`, 120, 75);
      doc.text(`Address: ${sale.customerAddress || "N/A"}`, 120, 80);

      // Product Table
      autoTable(doc, {
        startY: 95,
        head: [["Product", "Qty", "Unit Price", "Discount", "VAT", "Total"]],
        body: [[
          sale.productName || "N/A",
          sale.productQty || 0,
          formatCurrency(sale.productPrice || 0),
          formatCurrency(sale.discount || 0),
          `${sale.vatPercent || 0}%`,
          formatCurrency(sale.grandTotal || 0)
        ]],
        theme: "grid",
        headStyles: { 
          fillColor: [37, 99, 235],
          textColor: 255,
          fontSize: 10,
          fontStyle: "bold"
        },
        styles: { 
          fontSize: 10,
          cellPadding: 5
        }
      });

      const finalY = doc.lastAutoTable?.finalY || 110;

      // Totals
      doc.setFontSize(11);
      doc.text("Payment Summary", 20, finalY + 10);
      doc.line(20, finalY + 12, 60, finalY + 12);

      const totalsY = finalY + 25;
      doc.setFontSize(10);
      
      doc.text("Subtotal:", 120, totalsY);
      doc.text(formatCurrency(sale.subtotal || 0), 180, totalsY, { align: "right" });

      doc.text("Discount:", 120, totalsY + 5);
      doc.text(`-${formatCurrency(sale.discount || 0)}`, 180, totalsY + 5, { align: "right" });

      doc.text("VAT/Tax:", 120, totalsY + 10);
      doc.text(formatCurrency(sale.vatAmount || 0), 180, totalsY + 10, { align: "right" });

      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Grand Total:", 120, totalsY + 20);
      doc.text(formatCurrency(sale.grandTotal || 0), 180, totalsY + 20, { align: "right" });

      doc.text("Paid Amount:", 120, totalsY + 25);
      doc.text(formatCurrency(sale.paidAmount || 0), 180, totalsY + 25, { align: "right" });

      const due = sale.due || 0;
      if (due > 0) {
        doc.setTextColor(239, 68, 68);
      } else {
        doc.setTextColor(34, 197, 94);
      }
      
      doc.text("Due Amount:", 120, totalsY + 30);
      doc.text(formatCurrency(due), 180, totalsY + 30, { align: "right" });

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Footer
      const footerY = totalsY + 50;
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Customer Signature", 50, footerY, { align: "center" });
      doc.line(30, footerY + 5, 70, footerY + 5);

      doc.text("Authorized Signature", 150, footerY, { align: "center" });
      doc.line(130, footerY + 5, 170, footerY + 5);

      doc.text("Thank you for your business!", 105, footerY + 20, { align: "center" });
      doc.setFontSize(8);
      doc.text("This is a computer generated invoice - no signature required.", 105, footerY + 25, { align: "center" });

      // Save PDF
      doc.save(`Invoice_${sale.invoiceNumber || sale._id.slice(-8)}.pdf`);
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Invoice #",
      "Customer Name",
      "Customer Phone",
      "Product",
      "Quantity",
      "Unit Price",
      "Subtotal",
      "Discount",
      "VAT",
      "Grand Total",
      "Paid",
      "Due",
      "Sales Manager",
      "Time"
    ];

    const csvData = filteredSales.map(sale => [
      sale.invoiceNumber || sale._id.slice(-8),
      sale.customerName,
      sale.customerPhone,
      sale.productName,
      sale.productQty,
      sale.productPrice,
      sale.subtotal || 0,
      sale.discount || 0,
      `${sale.vatPercent || 0}%`,
      sale.grandTotal || 0,
      sale.paidAmount || 0,
      sale.due || 0,
      sale.salesManager || "N/A",
      formatTime(sale.createdAt)
    ]);

    // Add total row
    csvData.push([
      "TOTAL",
      "",
      "",
      "",
      filteredSales.reduce((sum, s) => sum + (s.productQty || 0), 0),
      "",
      filteredSales.reduce((sum, s) => sum + (s.subtotal || 0), 0),
      filteredSales.reduce((sum, s) => sum + (s.discount || 0), 0),
      "",
      filteredSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0),
      filteredSales.reduce((sum, s) => sum + (s.paidAmount || 0), 0),
      filteredSales.reduce((sum, s) => sum + (s.due || 0), 0),
      "",
      ""
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `today-sales-${new Date().toISOString().split("T")[0]}.csv`;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
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
                    Today&apos;s Sales
                  </h1>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                    {stats.totalSales} Sales
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  {new Date().toLocaleDateString("en-US", { 
                    weekday: "long", 
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                disabled={filteredSales.length === 0}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  filteredSales.length > 0
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
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  From {stats.totalSales} sales
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiDollarSign className="text-green-600" size={24} />
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
                <p className="text-sm text-gray-600 mb-1">Products Sold</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalProducts}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Units sold today
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiPackage className="text-blue-600" size={24} />
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
                <p className="text-sm text-gray-600 mb-1">Avg. Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.avgOrderValue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Per transaction
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="text-purple-600" size={24} />
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
                <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalCustomers || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Unique customers
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiUser className="text-orange-600" size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Top Product Banner */}
        {stats.topProduct && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl shadow-lg p-4 mb-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-white/90">🔥 Top Selling Product Today</p>
                  <p className="text-lg font-bold">{stats.topProduct}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                Best Seller
              </span>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by customer, product, invoice..."
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
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
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

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white"
            >
              <FiSearch size={16} />
              <span>Filters & Sort</span>
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
                    Sort Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Items Per Page
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sales List */}
        {filteredSales.length === 0 ? (
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
                No Sales Today
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? "No sales match your search criteria."
                  : "There are no sales recorded for today yet."}
              </p>
              {searchTerm && (
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
                        Invoice
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
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentSales.map((sale, index) => {
                      const paymentStatus = getPaymentStatus(sale.due);
                      return (
                        <motion.tr
                          key={sale._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-mono text-xs font-medium text-gray-900">
                              {sale.invoiceNumber || `#${sale._id.slice(-8)}`}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ID: {sale._id.slice(-8)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {sale.customerName}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {sale.customerPhone}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {sale.productName}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Qty: {sale.productQty} × {formatCurrency(sale.productPrice)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">
                              {formatCurrency(sale.grandTotal)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Paid: {formatCurrency(sale.paidAmount)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${paymentStatus.color}`}>
                              {paymentStatus.label}
                            </span>
                            {sale.due > 0 && (
                              <div className="text-xs text-orange-600 mt-1">
                                Due: {formatCurrency(sale.due)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {formatTime(sale.createdAt)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {getTimeAgo(sale.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewDetails(sale)}
                                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm font-medium"
                              >
                                View
                              </button>
                              <button
                                onClick={() => generateInvoice(sale)}
                                className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors text-sm font-medium"
                              >
                                Invoice
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
            <div className="lg:hidden space-y-4 mb-6">
              {currentSales.map((sale) => {
                const paymentStatus = getPaymentStatus(sale.due);
                return (
                  <motion.div
                    key={sale._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <FiShoppingCart className="text-white" size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {sale.customerName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {sale.customerPhone}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${paymentStatus.color}`}>
                        {paymentStatus.label}
                      </span>
                    </div>

                    {/* Product Info */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {sale.productName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Qty: {sale.productQty} × {formatCurrency(sale.productPrice)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatCurrency(sale.grandTotal)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Paid: {formatCurrency(sale.paidAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FiClock size={14} />
                        <span>{getTimeAgo(sale.createdAt)}</span>
                        <span className="mx-1">•</span>
                        <span>{formatTime(sale.createdAt)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(sale)}
                          className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => generateInvoice(sale)}
                          className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          Invoice
                        </button>
                      </div>
                    </div>

                    {/* Due Info */}
                    {sale.due > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Due Amount:</span>
                          <span className="text-sm font-semibold text-orange-600">
                            {formatCurrency(sale.due)}
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{" "}
                  <span className="font-semibold text-gray-900">{endIndex}</span> of{" "}
                  <span className="font-semibold text-gray-900">{filteredSales.length}</span> sales
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

        {/* Details Modal */}
        <AnimatePresence>
          {showDetailsModal && selectedSale && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowDetailsModal(false)}
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
                        <FiShoppingCart className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Sale Details
                        </h2>
                        <p className="text-sm text-gray-500">
                          Invoice: {selectedSale.invoiceNumber || `#${selectedSale._id.slice(-8)}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiX className="text-gray-500" size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Customer Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                      <FiUser className="mr-2" size={16} />
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <FaUserCircle className="text-gray-400" size={16} />
                        <span className="text-sm text-gray-600">Name:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedSale.customerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaPhone className="text-gray-400" size={16} />
                        <span className="text-sm text-gray-600">Phone:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedSale.customerPhone}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <FaMapMarkerAlt className="text-gray-400" size={16} />
                        <span className="text-sm text-gray-600">Address:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedSale.customerAddress || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-4 flex items-center">
                      <FiPackage className="mr-2" size={16} />
                      Product Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Product Name:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedSale.productName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Quantity:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedSale.productQty} units
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Unit Price:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedSale.productPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedSale.subtotal || selectedSale.productPrice * selectedSale.productQty)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-200">
                    <h3 className="font-semibold text-orange-900 mb-4 flex items-center">
                      <FiDollarSign className="mr-2" size={16} />
                      Payment Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Discount:</span>
                        <span className="text-sm font-medium text-red-600">
                          -{formatCurrency(selectedSale.discount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">VAT ({selectedSale.vatPercent || 0}%):</span>
                        <span className="text-sm font-medium text-blue-600">
                          +{formatCurrency(selectedSale.vatAmount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-orange-200">
                        <span className="text-sm font-semibold text-gray-900">Grand Total:</span>
                        <span className="text-base font-bold text-blue-600">
                          {formatCurrency(selectedSale.grandTotal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Paid Amount:</span>
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(selectedSale.paidAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Due Amount:</span>
                        <span className={`text-sm font-medium ${selectedSale.due > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {selectedSale.due > 0 ? formatCurrency(selectedSale.due) : 'Paid in Full'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <FaRegClock className="mr-2" size={16} />
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-500 block">Sales Manager</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedSale.salesManager || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Invoice Date</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(selectedSale.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Invoice Time</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatTime(selectedSale.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Payment Status</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full inline-block mt-1 ${
                          getPaymentStatus(selectedSale.due).color
                        }`}>
                          {getPaymentStatus(selectedSale.due).label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
                  <div className="flex gap-3">
                    <button
                      onClick={() => generateInvoice(selectedSale)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <FiDownload size={18} />
                      Download Invoice
                    </button>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Close
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

export default TodaySales;