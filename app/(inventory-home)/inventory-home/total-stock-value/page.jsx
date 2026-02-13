"use client";
import axiosInstance from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
    FaBoxes,
    FaChartLine,
    FaPercentage
} from "react-icons/fa";
import {
    FiArrowLeft,
    FiBarChart2,
    FiBox,
    FiChevronRight,
    FiDollarSign,
    FiDownload,
    FiPackage,
    FiPieChart,
    FiRefreshCw
} from "react-icons/fi";

const TotalStockValue = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [timeframe, setTimeframe] = useState("all");
  const [viewType, setViewType] = useState("summary"); // summary, details, chart

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/products");
        
        if (response.data.success) {
          setProducts(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Calculate total stock value (costPrice × quantity)
  const calculateTotalStockValue = () => {
    return products.reduce((total, product) => {
      const costPrice = parseFloat(product.costPrice) || 0;
      const quantity = parseFloat(product.quantity) || 0;
      return total + (costPrice * quantity);
    }, 0);
  };

  // Calculate total retail value (price × quantity)
  const calculateTotalRetailValue = () => {
    return products.reduce((total, product) => {
      const price = parseFloat(product.price) || 0;
      const quantity = parseFloat(product.quantity) || 0;
      return total + (price * quantity);
    }, 0);
  };

  // Calculate total profit (retail - cost)
  const calculateTotalProfit = () => {
    const totalCost = calculateTotalStockValue();
    const totalRetail = calculateTotalRetailValue();
    return totalRetail - totalCost;
  };

  // Calculate profit margin
  const calculateProfitMargin = () => {
    const totalRetail = calculateTotalRetailValue();
    const totalProfit = calculateTotalProfit();
    return totalRetail > 0 ? (totalProfit / totalRetail) * 100 : 0;
  };

  // Calculate average cost per item
  const calculateAverageCost = () => {
    const totalQuantity = products.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0);
    const totalValue = calculateTotalStockValue();
    return totalQuantity > 0 ? totalValue / totalQuantity : 0;
  };

  // Calculate category-wise stock value
  const getCategoryWiseValue = () => {
    const categoryMap = new Map();
    
    products.forEach(product => {
      const category = product.category || "Uncategorized";
      const costPrice = parseFloat(product.costPrice) || 0;
      const quantity = parseFloat(product.quantity) || 0;
      const value = costPrice * quantity;
      
      if (categoryMap.has(category)) {
        categoryMap.set(category, categoryMap.get(category) + value);
      } else {
        categoryMap.set(category, value);
      }
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Get top products by stock value
  const getTopProductsByValue = (limit = 5) => {
    return products
      .map(product => ({
        ...product,
        stockValue: (parseFloat(product.costPrice) || 0) * (parseFloat(product.quantity) || 0)
      }))
      .sort((a, b) => b.stockValue - a.stockValue)
      .slice(0, limit);
  };

  // Get low stock products (quantity < 10)
  const getLowStockProducts = () => {
    return products.filter(p => (parseFloat(p.quantity) || 0) < 10 && (parseFloat(p.quantity) || 0) > 0);
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

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 10000000) {
      return (num / 10000000).toFixed(2) + "Cr";
    } else if (num >= 100000) {
      return (num / 100000).toFixed(2) + "L";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + "K";
    }
    return num.toString();
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Product Name", "Category", "Cost Price", "Quantity", "Stock Value", "Retail Price", "Profit"];
    const csvData = products.map(product => {
      const costPrice = parseFloat(product.costPrice) || 0;
      const quantity = parseFloat(product.quantity) || 0;
      const stockValue = costPrice * quantity;
      const retailPrice = parseFloat(product.price) || 0;
      const retailValue = retailPrice * quantity;
      const profit = retailValue - stockValue;
      
      return [
        product.name,
        product.category || "Uncategorized",
        costPrice,
        quantity,
        stockValue,
        retailValue,
        profit
      ];
    });

    // Add total row
    csvData.push([
      "TOTAL",
      "",
      "",
      products.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0),
      calculateTotalStockValue(),
      calculateTotalRetailValue(),
      calculateTotalProfit()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-value-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Report exported successfully!");
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-8xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalStockValue = calculateTotalStockValue();
  const totalRetailValue = calculateTotalRetailValue();
  const totalProfit = calculateTotalProfit();
  const profitMargin = calculateProfitMargin();
  const averageCost = calculateAverageCost();
  const totalQuantity = products.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0);
  const totalProducts = products.length;
  const categoryWiseValue = getCategoryWiseValue();
  const topProducts = getTopProductsByValue();
  const lowStockProducts = getLowStockProducts();

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
                    Total Stock Value
                  </h1>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                    {totalProducts} Products
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  Cost-based valuation of current inventory
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FiDownload size={16} />
                <span className="hidden sm:inline">Export Report</span>
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

        {/* Main Value Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 md:p-8 mb-8 text-white"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <FiDollarSign className="text-white" size={32} />
              </div>
              <div>
                <p className="text-blue-100 text-sm md:text-base mb-1">Total Stock Value (Cost Price)</p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                  {formatCurrency(totalStockValue)}
                </h2>
                <p className="text-blue-100 text-sm mt-2">
                  Based on {totalQuantity.toLocaleString()} units across {totalProducts} products
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                <p className="text-blue-100 text-xs">Avg. Cost/Item</p>
                <p className="text-xl font-semibold">{formatCurrency(averageCost)}</p>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                <p className="text-blue-100 text-xs">Total Items</p>
                <p className="text-xl font-semibold">{formatNumber(totalQuantity)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FaChartLine className="text-green-600" size={20} />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Retail Value
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Retail Value</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalRetailValue)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Based on selling price
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaPercentage className="text-purple-600" size={20} />
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                Profit Margin
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Profit</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalProfit)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${Math.min(profitMargin, 100)}%` }}
                ></div>
              </div>
              <span className="text-xs font-semibold text-purple-600">
                {profitMargin.toFixed(1)}%
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiPackage className="text-blue-600" size={20} />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                Categories
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Categories</p>
            <p className="text-2xl font-bold text-gray-900">
              {categoryWiseValue.length}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {categoryWiseValue.slice(0, 2).map(c => c.name).join(", ")}
              {categoryWiseValue.length > 2 && ` +${categoryWiseValue.length - 2} more`}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaBoxes className="text-orange-600" size={20} />
              </div>
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                Low Stock
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
            <p className="text-2xl font-bold text-gray-900">
              {lowStockProducts.length}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {lowStockProducts.length > 0 
                ? `${lowStockProducts[0]?.name} ${lowStockProducts.length > 1 ? `+${lowStockProducts.length - 1} more` : ''}`
                : 'All items well stocked'}
            </p>
          </motion.div>
        </div>

        {/* Category Wise Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <FiPieChart className="mr-2 text-blue-600" />
                Stock Value by Category
              </h2>
              <span className="text-sm text-gray-500">
                Total: {formatCurrency(totalStockValue)}
              </span>
            </div>

            <div className="space-y-4">
              {categoryWiseValue.map((category, index) => {
                const percentage = (category.value / totalStockValue) * 100;
                const colors = [
                  "bg-blue-600",
                  "bg-green-600",
                  "bg-purple-600",
                  "bg-orange-600",
                  "bg-pink-600",
                  "bg-indigo-600"
                ];
                const color = colors[index % colors.length];
                
                return (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          {category.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(category.value)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`${color} h-2.5 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {categoryWiseValue.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No categories found
                </div>
              )}
            </div>
          </motion.div>

          {/* Top Products by Value */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <FiBarChart2 className="mr-2 text-blue-600" />
              Top Products by Value
            </h2>

            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product._id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        Qty: {product.quantity}
                      </span>
                      <span className="text-xs text-gray-500">
                        • Cost: {formatCurrency(product.costPrice)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(product.stockValue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {((product.stockValue / totalStockValue) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}

              {topProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No products found
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link
                href="/inventory-home/products"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center"
              >
                View All Products
                <FiChevronRight className="ml-1" size={16} />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Products Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <FiBox className="mr-2 text-blue-600" />
              Product-wise Stock Value
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retail Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => {
                  const costPrice = parseFloat(product.costPrice) || 0;
                  const quantity = parseFloat(product.quantity) || 0;
                  const stockValue = costPrice * quantity;
                  const retailPrice = parseFloat(product.price) || 0;
                  const retailValue = retailPrice * quantity;
                  const profit = retailValue - stockValue;
                  
                  return (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {product._id.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          {product.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {formatCurrency(costPrice)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-medium ${
                          quantity < 10 ? 'text-orange-600' : 'text-gray-900'
                        }`}>
                          {quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(stockValue)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {formatCurrency(retailValue)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-medium ${
                          profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {formatCurrency(profit)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-sm text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    {formatCurrency(totalStockValue)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    {formatCurrency(totalRetailValue)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                    {formatCurrency(totalProfit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>

        {/* Mobile Summary Cards */}
        <div className="lg:hidden grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total Products</p>
            <p className="text-xl font-bold text-gray-900">{totalProducts}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total Quantity</p>
            <p className="text-xl font-bold text-gray-900">{formatNumber(totalQuantity)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Avg Cost/Item</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(averageCost)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Profit Margin</p>
            <p className="text-xl font-bold text-purple-600">{profitMargin.toFixed(1)}%</p>
          </div>
        </div>

        {/* Mobile Bottom Padding */}
        <div className="lg:hidden h-16"></div>
      </div>
    </div>
  );
};

export default TotalStockValue;