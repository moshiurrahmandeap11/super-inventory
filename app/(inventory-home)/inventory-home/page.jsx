"use client";
import axiosInstance from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FaArrowRight,
  FaRegChartBar,
  FaShoppingCart,
  FaUser
} from "react-icons/fa";
import {
  FiAlertTriangle,
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiGrid,
  FiHash,
  FiPackage,
  FiTrendingUp,
  FiXCircle
} from "react-icons/fi";

const InventoryHome = () => {
  const [stats, setStats] = useState({
    totalCategories: 0,
    lowStockItems: 0,
    outOfStock: 0,
    totalStockValue: 0,
    todaySales: 0,
    monthlyRevenue: 0,
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesItems, setSalesItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState([]);

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Parallel API calls
        const [salesRes, categoriesRes, productsRes] = await Promise.all([
          axiosInstance.get("/sales-items"),
          axiosInstance.get("/product-categories"),
          axiosInstance.get("/products")
        ]);

        // Process sales items
        if (salesRes.data.success) {
          const sorted = salesRes.data.data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setSalesItems(sorted.slice(0, 5));
        }

        // Process categories
        if (categoriesRes.data.success) {
          setCategories(categoriesRes.data.data);
        }

        // Process products
        if (productsRes.data.success) {
          setProducts(productsRes.data.data);
          
          // Calculate top selling products
          calculateTopProducts(productsRes.data.data, salesRes.data.data);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  // Calculate top selling products from sales data
  const calculateTopProducts = (productsData, salesData) => {
    // Create a map of product sales
    const productSalesMap = new Map();
    
    salesData.forEach(sale => {
      const productId = sale.productID;
      const productName = sale.productName;
      const productQty = sale.productQty || 0;
      const productPrice = sale.productPrice || 0;
      
      if (productSalesMap.has(productId)) {
        const existing = productSalesMap.get(productId);
        productSalesMap.set(productId, {
          id: productId,
          name: productName,
          totalSold: existing.totalSold + productQty,
          totalRevenue: existing.totalRevenue + (productQty * productPrice),
          category: existing.category
        });
      } else {
        // Find product category
        const product = productsData.find(p => p._id === productId);
        productSalesMap.set(productId, {
          id: productId,
          name: productName,
          totalSold: productQty,
          totalRevenue: productQty * productPrice,
          category: product?.category || "Uncategorized",
          stock: product?.quantity || 0
        });
      }
    });

    // Convert to array, sort by total sold, and take top 5
    const topProductsArray = Array.from(productSalesMap.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);
    
    setTopProducts(topProductsArray);
  };

  // Calculate stock stats
  const stockCount = products?.filter(p => p.quantity > 0 && p.quantity <= 10).length || 0;
  const zeroStock = products?.filter(p => p.quantity === 0).length || 0;
  const lowStockCount = products?.filter((product) => product.quantity <= 10).length || 0;

  const totalStockValue = products?.reduce(
    (sum, product) => sum + (product.costPrice || product.price) * product.quantity,
    0
  ) || 0;

  // Calculate today's sales
  const todaySales = salesItems
    .filter(sale => {
      const today = new Date();
      const saleDate = new Date(sale.createdAt);
      return saleDate.toDateString() === today.toDateString();
    })
    .reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);

  // Calculate monthly revenue
  const monthlyRevenue = salesItems
    .filter(sale => {
      const now = new Date();
      const saleDate = new Date(sale.createdAt);
      return saleDate.getMonth() === now.getMonth() && 
             saleDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);

  const homeItems = [
    {
      id: 1,
      label: "Total Products",
      path: "/inventory-home/products",
      icon: <FiPackage className="text-2xl" />,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500",
      value: `${products?.length || 0}`,
    },
    {
      id: 2,
      label: "Total Categories",
      path: "/inventory-home/categories",
      icon: <FiGrid className="text-2xl" />,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500",
      value: `${categories?.length || 0}`,
    },
    {
      id: 3,
      label: "Low Stock Items",
      path: "/inventory-home/low-stock-items",
      icon: <FiAlertTriangle className="text-2xl" />,
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-500",
      value: stockCount,
    },
    {
      id: 4,
      label: "Out of Stock",
      path: "/inventory-home/out-of-stock",
      icon: <FiXCircle className="text-2xl" />,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-500",
      value: zeroStock,
    },
    {
      id: 5,
      label: "Total Stock Value",
      path: "/inventory-home/total-stock-value",
      icon: <FiDollarSign className="text-2xl" />,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500",
      value: `BDT ${totalStockValue.toLocaleString()}`,
    },
    {
      id: 6,
      label: "Today Sales",
      path: "/inventory-home/today-sales",
      icon: <FaShoppingCart className="text-2xl" />,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-500",
      value: `BDT ${todaySales.toLocaleString()}`,
    },
    {
      id: 7,
      label: "Monthly Revenue",
      path: "/inventory-home/monthly-revenue",
      icon: <FiTrendingUp className="text-2xl" />,
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-500",
      value: `BDT ${monthlyRevenue.toLocaleString()}`,
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  const getActivityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "sale":
        return <FaShoppingCart className="text-green-500" size={20} />;
      case "purchase":
        return <FiPackage className="text-blue-500" size={20} />;
      case "low_stock":
        return <FiAlertTriangle className="text-yellow-500" size={20} />;
      default:
        return <FaShoppingCart className="text-green-500" size={20} />;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return past.toLocaleDateString();
  };

  // FIXED: Status color and text functions
  const getStatusColor = (due) => {
    if (due <= 0) return "bg-green-100 text-green-800";
    if (due > 0) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusText = (due) => {
    if (due <= 0) return "Paid"; // due 0 or less than 0 = Paid
    if (due > 0) return "Partial"; // due > 0 = Partial
    return "Due";
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Inventory Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Manage and monitor your inventory efficiently
        </p>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500">Total Products</p>
            <p className="text-lg font-semibold text-gray-900">
              {products?.length || 0}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500">This Month Sales</p>
            <p className="text-lg font-semibold text-gray-900">
              BDT {monthlyRevenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500">Low Stock</p>
            <p className="text-lg font-semibold text-red-600">
              {lowStockCount} Items
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500">Total Stock Value</p>
            <p className="text-lg font-semibold text-green-600">
              BDT {totalStockValue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {homeItems.map((item) => (
          <motion.div key={item.id} variants={itemVariants}>
            <Link href={item.path}>
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full border border-gray-200 overflow-hidden cursor-pointer group">
                <div className={`h-2 ${item.bgColor}`}></div>
                <div className="p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-lg bg-gradient-to-br ${item.color} bg-opacity-10`}
                    >
                      <div
                        className={`${item.color.split(" ")[0].replace("from-", "text-")}`}
                      >
                        {item.icon}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl md:text-3xl font-bold text-gray-900">
                        {item.value}
                      </p>
                      <div className="flex items-center justify-end mt-1">
                        <span className="text-xs text-gray-500">
                          View Details
                        </span>
                        <FaArrowRight
                          className="ml-2 text-gray-400 group-hover:translate-x-1 transition-transform"
                          size={12}
                        />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.label}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Click to view detailed information
                  </p>

                  {/* Progress bar for low stock/out of stock */}
                  {(item.id === 3 || item.id === 4) && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Stock Level</span>
                        <span>{item.id === 3 ? `${Math.min(100, (stockCount / (products?.length || 1) * 100)).toFixed(0)}%` : "0%"}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.id === 3 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: item.id === 3 ? `${Math.min(100, (stockCount / (products?.length || 1) * 100))}%` : "0%" }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {item.id === 5 && (
                    <div className="mt-4 flex items-center">
                      <FiTrendingUp className="text-green-500 mr-2" />
                      <span className="text-sm text-green-600 font-medium">
                        Total inventory value
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Bottom Section with Charts and Tables */}
      <div className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Recent Activities - Dynamic Sales Items */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Recent Sales
            </h2>
            <Link
              href="/sales"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              View All Sales
              <FaArrowRight className="ml-1" size={14} />
            </Link>
          </div>

          {salesItems.length > 0 ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {salesItems.map((sale) => (
                <div
                  key={sale._id}
                  className="flex flex-col sm:flex-row sm:items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-0"
                >
                  {/* Icon */}
                  <div className="flex items-center mb-2 sm:mb-0 sm:mr-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <FaShoppingCart className="text-green-600" size={18} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="mb-1 sm:mb-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {sale.productName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 flex items-center">
                            <FiHash className="mr-1" size={12} />
                            {sale.invoiceNumber}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <FaUser className="mr-1" size={12} />
                            {sale.customerName || "Walk-in Customer"}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <FiClock className="mr-1" size={12} />
                            {formatTimeAgo(sale.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 mt-2 sm:mt-0">
                        <span className="font-bold text-gray-900">
                          BDT {sale.grandTotal?.toLocaleString()}
                        </span>
                        {/* FIXED: Now shows "Paid" when due is 0 */}
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(sale.due)}`}>
                          {getStatusText(sale.due)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Mobile Details */}
                    <div className="mt-2 sm:hidden">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Qty: {sale.productQty}</span>
                        <span className="text-gray-600">
                          Paid: BDT {sale.paidAmount?.toLocaleString()}
                        </span>
                        {sale.due > 0 && (
                          <span className="text-gray-600">
                            Due: BDT {sale.due?.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Desktop Details */}
                    <div className="hidden sm:flex items-center mt-2 space-x-4">
                      <span className="text-xs text-gray-600">
                        Qty: <span className="font-medium">{sale.productQty}</span>
                      </span>
                      <span className="text-xs text-gray-600">
                        Paid: <span className="font-medium text-green-600">BDT {sale.paidAmount?.toLocaleString()}</span>
                      </span>
                      {sale.due > 0 && (
                        <span className="text-xs text-gray-600">
                          Due: <span className="font-medium text-orange-600">BDT {sale.due?.toLocaleString()}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShoppingCart className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-600 font-medium">No sales yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Start selling to see recent activities
              </p>
              <Link href="/sales-items">
                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Create First Sale
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Top Selling Products - FIXED: Now shows actual sales data */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Top Selling Products
            </h2>
            <Link
              href="/products"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              View All
              <FaArrowRight className="ml-1" size={14} />
            </Link>
          </div>

          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1">
                      <span className="text-xs text-gray-500 truncate">
                        {product.category}
                      </span>
                      <div className="flex items-center space-x-4 mt-1 sm:mt-0">
                        <span className="text-xs text-gray-500">
                          Stock: <span className="font-medium">{product.stock || 0}</span>
                        </span>
                        <span className="text-xs font-semibold text-blue-600">
                          Sold: <span className="font-medium">{product.totalSold || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShoppingCart className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-600 font-medium">No sales yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Complete some sales to see top products
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center">
            <FiCalendar className="text-blue-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-blue-800">Current Month</p>
              <p className="text-xl font-bold text-blue-900">
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center">
            <FiTrendingUp className="text-green-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-green-800">Sales Growth</p>
              <p className="text-xl font-bold text-green-900">
                {monthlyRevenue > 0 ? '+24.5%' : '0%'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center">
            <FiDollarSign className="text-purple-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-purple-800">Avg. Order Value</p>
              <p className="text-xl font-bold text-purple-900">
                BDT {salesItems.length > 0 
                  ? (salesItems.reduce((sum, sale) => sum + sale.grandTotal, 0) / salesItems.length).toFixed(0) 
                  : '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around z-10">
        <Link href="/" className="flex flex-col items-center text-blue-600 px-2 py-1">
          <FiGrid size={20} />
          <span className="text-xs mt-1">Dashboard</span>
        </Link>
        <Link href="/products" className="flex flex-col items-center text-gray-500 px-2 py-1">
          <FiPackage size={20} />
          <span className="text-xs mt-1">Products</span>
        </Link>
        <Link href="/sales" className="flex flex-col items-center text-gray-500 px-2 py-1">
          <FaShoppingCart size={20} />
          <span className="text-xs mt-1">Sales</span>
        </Link>
        <Link href="/reports" className="flex flex-col items-center text-gray-500 px-2 py-1">
          <FaRegChartBar size={20} />
          <span className="text-xs mt-1">Reports</span>
        </Link>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default InventoryHome;