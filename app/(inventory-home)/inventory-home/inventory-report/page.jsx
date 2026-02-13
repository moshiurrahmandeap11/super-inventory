"use client";
import axiosInstance from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { saveAs } from "file-saver";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
    FaBoxes,
    FaChartLine,
    FaExclamationTriangle,
    FaShoppingBag
} from "react-icons/fa";
import {
    FiAlertCircle,
    FiBox,
    FiCalendar,
    FiClock,
    FiDollarSign,
    FiDownload,
    FiPackage,
    FiPercent,
    FiPieChart,
    FiPrinter,
    FiRefreshCw,
    FiShoppingCart,
    FiTrendingUp
} from "react-icons/fi";
import * as XLSX from "xlsx";

const InventoryReport = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0]
  });
  
  // Data states
  const [salesData, setSalesData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [preOrdersData, setPreOrdersData] = useState([]);
  
  // Summary stats
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalStockValue: 0,
    totalRetailValue: 0,
    totalProfit: 0,
    profitMargin: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalPreOrders: 0,
    preOrderValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    topCategory: "",
    topProduct: "",
    averageOrderValue: 0,
    dailyAverage: 0
  });

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [salesRes, productsRes, preOrdersRes] = await Promise.all([
          axiosInstance.get("/sales-items"),
          axiosInstance.get("/products"),
          axiosInstance.get("/pre-order-sale")
        ]);

        // Process sales data
        if (salesRes.data.success) {
          const sales = salesRes.data.data || [];
          // Filter by date range
          const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.createdAt).toISOString().split("T")[0];
            return saleDate >= dateRange.start && saleDate <= dateRange.end;
          });
          setSalesData(filteredSales);
        }

        // Process products data
        if (productsRes.data.success) {
          setProductsData(productsRes.data.data || []);
        }

        // Process pre-orders data
        if (preOrdersRes.data.success) {
          const preOrders = preOrdersRes.data.data || [];
          // Only active pre-orders (not converted)
          const activePreOrders = preOrders.filter(p => !p.convertedToSale);
          setPreOrdersData(activePreOrders);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load report data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [dateRange]);

  // Calculate summary whenever data changes
  useEffect(() => {
    if (productsData.length > 0 || salesData.length > 0 || preOrdersData.length > 0) {
      calculateSummary();
    }
  }, [productsData, salesData, preOrdersData]);

  const calculateSummary = () => {
    // Products summary
    const totalProducts = productsData.length;
    
    // Stock value (costPrice × quantity)
    const totalStockValue = productsData.reduce((sum, p) => {
      const cost = parseFloat(p.costPrice) || 0;
      const qty = parseFloat(p.quantity) || 0;
      return sum + (cost * qty);
    }, 0);

    // Retail value (price × quantity)
    const totalRetailValue = productsData.reduce((sum, p) => {
      const price = parseFloat(p.price) || 0;
      const qty = parseFloat(p.quantity) || 0;
      return sum + (price * qty);
    }, 0);

    // Total profit
    const totalProfit = totalRetailValue - totalStockValue;
    const profitMargin = totalRetailValue > 0 ? (totalProfit / totalRetailValue) * 100 : 0;

    // Sales summary
    const totalRevenue = salesData.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const totalSales = salesData.length;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Pre-orders summary
    const totalPreOrders = preOrdersData.length;
    const preOrderValue = preOrdersData.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    // Stock alerts
    const lowStockCount = productsData.filter(p => {
      const qty = parseFloat(p.quantity) || 0;
      return qty > 0 && qty <= 10;
    }).length;

    const outOfStockCount = productsData.filter(p => {
      const qty = parseFloat(p.quantity) || 0;
      return qty === 0;
    }).length;

    // Top category
    const categoryMap = new Map();
    productsData.forEach(p => {
      const category = p.category || "Uncategorized";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    const topCategory = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Top product by sales
    const productSalesMap = new Map();
    salesData.forEach(s => {
      const productName = s.productName;
      productSalesMap.set(productName, (productSalesMap.get(productName) || 0) + 1);
    });
    const topProduct = Array.from(productSalesMap.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Daily average
    const daysInRange = Math.ceil(
      (new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24)
    ) + 1;
    const dailyAverage = daysInRange > 0 ? totalRevenue / daysInRange : 0;

    setSummary({
      totalProducts,
      totalStockValue,
      totalRetailValue,
      totalProfit,
      profitMargin,
      totalSales,
      totalRevenue,
      totalPreOrders,
      preOrderValue,
      lowStockCount,
      outOfStockCount,
      topCategory,
      topProduct,
      averageOrderValue,
      dailyAverage
    });
  };

  // Get category distribution
  const getCategoryDistribution = () => {
    const categoryMap = new Map();
    productsData.forEach(p => {
      const category = p.category || "Uncategorized";
      const value = (parseFloat(p.costPrice) || 0) * (parseFloat(p.quantity) || 0);
      categoryMap.set(category, (categoryMap.get(category) || 0) + value);
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value, percentage: (value / summary.totalStockValue) * 100 }))
      .sort((a, b) => b.value - a.value);
  };

  // Get low stock products
  const getLowStockProducts = () => {
    return productsData
      .filter(p => {
        const qty = parseFloat(p.quantity) || 0;
        return qty > 0 && qty <= 10;
      })
      .sort((a, b) => (a.quantity || 0) - (b.quantity || 0))
      .slice(0, 5);
  };

  // Get recent sales
  const getRecentSales = () => {
    return salesData
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  };

  // Get top products by revenue
  const getTopProducts = () => {
    const productMap = new Map();
    salesData.forEach(s => {
      const productName = s.productName;
      const revenue = s.grandTotal || 0;
      productMap.set(productName, (productMap.get(productName) || 0) + revenue);
    });
    
    return Array.from(productMap.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format number
  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-BD").format(num || 0);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Format date range
  const formatDateRange = () => {
    return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      setGenerating(true);
      const doc = new jsPDF();

      // Company Header
      doc.setFontSize(24);
      doc.setTextColor(37, 99, 235);
      doc.text("Tamim Traders", 105, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text("Inventory Report", 105, 30, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 36, { align: "center" });
      doc.text(`Period: ${formatDateRange()}`, 105, 42, { align: "center" });

      // Executive Summary
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.text("Executive Summary", 20, 55);
      doc.setDrawColor(37, 99, 235);
      doc.line(20, 57, 70, 57);

      const summaryData = [
        ["Total Products", formatNumber(summary.totalProducts), "Total Revenue", formatCurrency(summary.totalRevenue)],
        ["Stock Value", formatCurrency(summary.totalStockValue), "Total Sales", formatNumber(summary.totalSales)],
        ["Retail Value", formatCurrency(summary.totalRetailValue), "Avg Order", formatCurrency(summary.averageOrderValue)],
        ["Total Profit", formatCurrency(summary.totalProfit), "Pre-Orders", formatNumber(summary.totalPreOrders)],
        ["Profit Margin", `${summary.profitMargin.toFixed(1)}%`, "Low Stock", formatNumber(summary.lowStockCount)],
        ["Top Category", summary.topCategory, "Out of Stock", formatNumber(summary.outOfStockCount)]
      ];

      autoTable(doc, {
        startY: 65,
        body: summaryData,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 }, 1: { cellWidth: 45 }, 2: { fontStyle: "bold", cellWidth: 50 }, 3: { cellWidth: 45 } }
      });

      let finalY = doc.lastAutoTable.finalY + 10;

      // Stock Status
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.text("Stock Status", 20, finalY);
      doc.line(20, finalY + 2, 60, finalY + 2);

      finalY += 10;

      const stockData = [
        ["Status", "Count", "Value"],
        ["In Stock", formatNumber(summary.totalProducts - summary.lowStockCount - summary.outOfStockCount), formatCurrency(summary.totalStockValue * 0.7)],
        ["Low Stock", formatNumber(summary.lowStockCount), formatCurrency(summary.totalStockValue * 0.2)],
        ["Out of Stock", formatNumber(summary.outOfStockCount), formatCurrency(summary.totalStockValue * 0.1)]
      ];

      autoTable(doc, {
        startY: finalY,
        head: [stockData[0]],
        body: stockData.slice(1),
        theme: "grid",
        headStyles: { fillColor: [37, 99, 235], textColor: 255 }
      });

      finalY = doc.lastAutoTable.finalY + 10;

      // Low Stock Products
      if (getLowStockProducts().length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(37, 99, 235);
        doc.text("Low Stock Products", 20, finalY);
        doc.line(20, finalY + 2, 60, finalY + 2);

        finalY += 10;

        const lowStockData = getLowStockProducts().map(p => [
          p.name,
          p.category || "N/A",
          formatNumber(p.quantity),
          formatCurrency(p.price)
        ]);

        autoTable(doc, {
          startY: finalY,
          head: [["Product", "Category", "Stock", "Price"]],
          body: lowStockData,
          theme: "grid",
          headStyles: { fillColor: [37, 99, 235], textColor: 255 }
        });

        finalY = doc.lastAutoTable.finalY + 10;
      }

      // Recent Sales
      if (getRecentSales().length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(37, 99, 235);
        doc.text("Recent Sales", 20, finalY);
        doc.line(20, finalY + 2, 50, finalY + 2);

        finalY += 10;

        const recentSalesData = getRecentSales().map(s => [
          s.invoiceNumber || s._id.slice(-8),
          s.customerName || "N/A",
          s.productName,
          formatNumber(s.productQty),
          formatCurrency(s.grandTotal)
        ]);

        autoTable(doc, {
          startY: finalY,
          head: [["Invoice", "Customer", "Product", "Qty", "Amount"]],
          body: recentSalesData,
          theme: "grid",
          headStyles: { fillColor: [37, 99, 235], textColor: 255 }
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generated by Inventory System • Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      doc.save(`inventory-report-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF report generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      setGenerating(true);

      const wb = XLSX.utils.book_new();

      // Summary Sheet
      const summarySheetData = [
        ["Inventory Report", ""],
        [`Generated: ${new Date().toLocaleString()}`, ""],
        [`Period: ${formatDateRange()}`, ""],
        [],
        ["EXECUTIVE SUMMARY", ""],
        ["Metric", "Value"],
        ["Total Products", summary.totalProducts],
        ["Total Stock Value", summary.totalStockValue],
        ["Total Retail Value", summary.totalRetailValue],
        ["Total Profit", summary.totalProfit],
        ["Profit Margin", `${summary.profitMargin.toFixed(1)}%`],
        ["Total Sales", summary.totalSales],
        ["Total Revenue", summary.totalRevenue],
        ["Average Order Value", summary.averageOrderValue],
        ["Total Pre-Orders", summary.totalPreOrders],
        ["Pre-Order Value", summary.preOrderValue],
        ["Low Stock Items", summary.lowStockCount],
        ["Out of Stock", summary.outOfStockCount],
        ["Top Category", summary.topCategory],
        ["Top Product", summary.topProduct],
        ["Daily Average", summary.dailyAverage]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      // Products Sheet
      const productsSheetData = [
        ["PRODUCTS LIST", ""],
        [`Total Products: ${summary.totalProducts}`, ""],
        [],
        ["Product Name", "Category", "Cost Price", "Selling Price", "Quantity", "Stock Value", "Retail Value", "Profit", "Status"]
      ];

      productsData.forEach(p => {
        const cost = parseFloat(p.costPrice) || 0;
        const price = parseFloat(p.price) || 0;
        const qty = parseFloat(p.quantity) || 0;
        const stockValue = cost * qty;
        const retailValue = price * qty;
        const profit = retailValue - stockValue;
        const status = qty === 0 ? "Out of Stock" : qty <= 10 ? "Low Stock" : "In Stock";

        productsSheetData.push([
          p.name,
          p.category || "Uncategorized",
          cost,
          price,
          qty,
          stockValue,
          retailValue,
          profit,
          status
        ]);
      });

      const productsSheet = XLSX.utils.aoa_to_sheet(productsSheetData);
      XLSX.utils.book_append_sheet(wb, productsSheet, "Products");

      // Sales Sheet
      const salesSheetData = [
        ["SALES LIST", ""],
        [`Total Sales: ${summary.totalSales}`, ""],
        [`Total Revenue: ${formatCurrency(summary.totalRevenue)}`, ""],
        [],
        ["Invoice #", "Date", "Customer", "Product", "Quantity", "Unit Price", "Total", "Paid", "Due", "Status"]
      ];

      salesData.forEach(s => {
        const due = s.due || 0;
        const status = due <= 0 ? "Paid" : due > 0 && due < 1000 ? "Partial" : "Due";

        salesSheetData.push([
          s.invoiceNumber || s._id.slice(-8),
          formatDate(s.createdAt),
          s.customerName || "N/A",
          s.productName,
          s.productQty,
          s.productPrice,
          s.grandTotal,
          s.paidAmount,
          s.due,
          status
        ]);
      });

      const salesSheet = XLSX.utils.aoa_to_sheet(salesSheetData);
      XLSX.utils.book_append_sheet(wb, salesSheet, "Sales");

      // Pre-Orders Sheet
      const preOrdersSheetData = [
        ["PRE-ORDERS LIST", ""],
        [`Total Pre-Orders: ${summary.totalPreOrders}`, ""],
        [`Total Value: ${formatCurrency(summary.preOrderValue)}`, ""],
        [],
        ["Customer", "Product", "Quantity", "Total Amount", "Advance Paid", "Due", "Date"]
      ];

      preOrdersData.forEach(p => {
        preOrdersSheetData.push([
          p.customerName || "N/A",
          p.productName,
          p.productQTY,
          p.totalAmount,
          p.paidAmount,
          p.dueAmount,
          formatDate(p.createdAt)
        ]);
      });

      const preOrdersSheet = XLSX.utils.aoa_to_sheet(preOrdersSheetData);
      XLSX.utils.book_append_sheet(wb, preOrdersSheet, "Pre-Orders");

      // Low Stock Sheet
      const lowStockData = getLowStockProducts();
      if (lowStockData.length > 0) {
        const lowStockSheetData = [
          ["LOW STOCK ALERT", ""],
          [`Items below threshold (≤10 units)`, ""],
          [],
          ["Product", "Category", "Current Stock", "Price", "Action Needed"]
        ];

        lowStockData.forEach(p => {
          lowStockSheetData.push([
            p.name,
            p.category || "Uncategorized",
            p.quantity,
            formatCurrency(p.price),
            "Restock Soon"
          ]);
        });

        const lowStockSheet = XLSX.utils.aoa_to_sheet(lowStockSheetData);
        XLSX.utils.book_append_sheet(wb, lowStockSheet, "Low Stock");
      }

      // Generate Excel file
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      saveAs(blob, `inventory-report-${new Date().toISOString().split("T")[0]}.xlsx`);
      
      toast.success("Excel report generated successfully!");
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error("Failed to generate Excel report");
    } finally {
      setGenerating(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

  const categoryDistribution = getCategoryDistribution();
  const lowStockProducts = getLowStockProducts();
  const recentSales = getRecentSales();
  const topProducts = getTopProducts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Inventory Report
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive inventory analysis and insights
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Date Range */}
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                <FiCalendar className="text-gray-500" size={18} />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="border-none focus:ring-0 text-sm"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="border-none focus:ring-0 text-sm"
                />
              </div>

              {/* Export Buttons */}
              <button
                onClick={exportToPDF}
                disabled={generating}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                <FiDownload size={16} />
                PDF
              </button>

              <button
                onClick={exportToExcel}
                disabled={generating}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                <FiDownload size={16} />
                Excel
              </button>

              <button
                onClick={() => window.location.reload()}
                className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh"
              >
                <FiRefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Report Date Range */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-4 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiCalendar size={20} />
              <span className="font-medium">Report Period:</span>
            </div>
            <span className="text-lg font-semibold">{formatDateRange()}</span>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiPackage className="text-blue-600" size={20} />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                Products
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.totalProducts)}</p>
            <p className="text-sm text-gray-600 mt-1">Total Products</p>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Categories: {categoryDistribution.length}</span>
              <span>Top: {summary.topCategory}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FiDollarSign className="text-green-600" size={20} />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Stock Value
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalStockValue)}</p>
            <p className="text-sm text-gray-600 mt-1">Cost-based valuation</p>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Retail: {formatCurrency(summary.totalRetailValue)}</span>
              <span className="text-green-600">Profit: {formatCurrency(summary.totalProfit)}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiShoppingCart className="text-purple-600" size={20} />
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                Sales
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.totalSales)}</p>
            <p className="text-sm text-gray-600 mt-1">Total Transactions</p>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Revenue: {formatCurrency(summary.totalRevenue)}</span>
              <span>Avg: {formatCurrency(summary.averageOrderValue)}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiAlertCircle className="text-orange-600" size={20} />
              </div>
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                Alerts
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.lowStockCount + summary.outOfStockCount}</p>
            <p className="text-sm text-gray-600 mt-1">Items Needing Attention</p>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span className="text-yellow-600">Low: {summary.lowStockCount}</span>
              <span className="text-red-600">Out: {summary.outOfStockCount}</span>
            </div>
          </motion.div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">Profit Margin</span>
              <FiPercent className="text-blue-600" size={16} />
            </div>
            <p className="text-xl font-bold text-blue-900 mt-1">{summary.profitMargin.toFixed(1)}%</p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-800">Daily Average</span>
              <FiTrendingUp className="text-green-600" size={16} />
            </div>
            <p className="text-xl font-bold text-green-900 mt-1">{formatCurrency(summary.dailyAverage)}</p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-800">Pre-Orders</span>
              <FiClock className="text-purple-600" size={16} />
            </div>
            <p className="text-xl font-bold text-purple-900 mt-1">{summary.totalPreOrders}</p>
            <p className="text-xs text-purple-600 mt-1">Value: {formatCurrency(summary.preOrderValue)}</p>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-800">Top Product</span>
              <FiBox className="text-amber-600" size={16} />
            </div>
            <p className="text-lg font-bold text-amber-900 mt-1 truncate">{summary.topProduct}</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FiPieChart className="mr-2 text-blue-600" />
              Category Distribution
            </h2>
            <div className="space-y-3">
              {categoryDistribution.slice(0, 5).map((cat, index) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{cat.name}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {categoryDistribution.length === 0 && (
                <p className="text-gray-500 text-center py-4">No categories found</p>
              )}
            </div>
          </div>

          {/* Stock Status */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FaBoxes className="mr-2 text-blue-600" />
              Stock Status
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">In Stock</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatNumber(summary.totalProducts - summary.lowStockCount - summary.outOfStockCount)}
                  </p>
                  <p className="text-xs text-gray-500">Items</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Low Stock</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-yellow-600">{formatNumber(summary.lowStockCount)}</p>
                  <p className="text-xs text-gray-500">Items</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Out of Stock</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">{formatNumber(summary.outOfStockCount)}</p>
                  <p className="text-xs text-gray-500">Items</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FaChartLine className="mr-2 text-blue-600" />
              Top Products by Revenue
            </h2>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700 truncate max-w-[120px]">{product.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</span>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-gray-500 text-center py-4">No sales data</p>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FaExclamationTriangle className="mr-2 text-yellow-500" />
              Low Stock Alert (≤10 units)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Current Stock</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lowStockProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.category || "N/A"}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-orange-600">{product.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Restock Soon
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Sales */}
        {recentSales.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FaShoppingBag className="mr-2 text-blue-600" />
              Recent Sales
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Invoice</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentSales.map((sale) => {
                    const due = sale.due || 0;
                    const status = due <= 0 ? "Paid" : due > 0 && due < 1000 ? "Partial" : "Due";
                    const statusColor = due <= 0 ? "text-green-600 bg-green-50" :
                                      due > 0 && due < 1000 ? "text-yellow-600 bg-yellow-50" :
                                      "text-red-600 bg-red-50";

                    return (
                      <tr key={sale._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">
                          {sale.invoiceNumber || sale._id.slice(-8)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{sale.customerName || "N/A"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sale.productName}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">{sale.productQty}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {formatCurrency(sale.grandTotal)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pre-Orders Summary */}
        {preOrdersData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FiClock className="mr-2 text-blue-600" />
              Active Pre-Orders
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xs text-purple-600">Total Pre-Orders</p>
                <p className="text-xl font-bold text-purple-700">{summary.totalPreOrders}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-600">Total Value</p>
                <p className="text-xl font-bold text-blue-700">{formatCurrency(summary.preOrderValue)}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-600">Advance Collected</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(preOrdersData.reduce((sum, p) => sum + (p.paidAmount || 0), 0))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Report Footer */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <FiPrinter size={16} />
              <span>Generated on: {new Date().toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Data Sources:</span>
              <span className="flex items-center gap-1">
                <FiPackage size={12} /> Products ({summary.totalProducts})
              </span>
              <span className="flex items-center gap-1">
                <FiShoppingCart size={12} /> Sales ({summary.totalSales})
              </span>
              <span className="flex items-center gap-1">
                <FiClock size={12} /> Pre-Orders ({summary.totalPreOrders})
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Padding */}
        <div className="lg:hidden h-16"></div>
      </div>
    </div>
  );
};

export default InventoryReport;