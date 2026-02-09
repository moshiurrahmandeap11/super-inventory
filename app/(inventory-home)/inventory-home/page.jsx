"use client";
import axiosInstance from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaArrowRight, FaRegChartBar, FaShoppingCart } from "react-icons/fa";
import {
    FiAlertTriangle,
    FiCalendar,
    FiDollarSign,
    FiGrid,
    FiPackage,
    FiTrendingUp,
    FiXCircle,
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
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState(null);
  console.log(categories);

  useEffect(() => {
    const tryFetchingCategories = async() => {
        const res = await axiosInstance.get("/product-categories")
        if(res.data.success) {
            setCategories(res.data.data)
        }
    }
    tryFetchingCategories();
  }, [])

  const stockCount =
  products?.filter(p => p.quantity > 0 && p.quantity <= 10).length || 0;

  const zeroStock = products?.filter(p => p.quantity === 0).length || 0;


  useEffect(() => {
    const tryFetchingProducts = async () => {
      const res = await axiosInstance.get("/products");
      if (res.data.success) {
        setProducts(res.data.data);
      }
    };
    tryFetchingProducts();
  }, []);

  const lowStockCount = products?.filter(
    (product) => product.quantity <= 10,
  ).length;

  const totalStockValue =
    products?.reduce(
      (sum, product) => sum + product.costPrice * product.quantity,
      0,
    ) || 0;

  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      type: "sale",
      item: "Laptop",
      quantity: 2,
      time: "2 hours ago",
      amount: "$2400",
    },
    {
      id: 2,
      type: "purchase",
      item: "Smartphone",
      quantity: 50,
      time: "5 hours ago",
      amount: "$25,000",
    },
    {
      id: 3,
      type: "low_stock",
      item: "Mouse",
      quantity: 5,
      time: "1 day ago",
      amount: "",
    },
    {
      id: 4,
      type: "sale",
      item: "Monitor",
      quantity: 3,
      time: "2 days ago",
      amount: "$900",
    },
  ]);

  const [topProducts, setTopProducts] = useState([
    {
      id: 1,
      name: "Gaming Laptop",
      category: "Electronics",
      stock: 15,
      sales: 245,
    },
    {
      id: 2,
      name: "Wireless Mouse",
      category: "Accessories",
      stock: 120,
      sales: 189,
    },
    {
      id: 3,
      name: "USB-C Cable",
      category: "Accessories",
      stock: 200,
      sales: 156,
    },
    {
      id: 4,
      name: "Mechanical Keyboard",
      category: "Electronics",
      stock: 25,
      sales: 98,
    },
  ]);

  

  const homeItems = [
    {
      id: 1,
      label: "Total Products",
      path: "/inventory-home/products",
      icon: <FiPackage className="text-2xl" />,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500",
      value: `${products?.length}`,
    },
    {
      id: 2,
      label: "Total Categories",
      path: "/inventory-home/categories",
      icon: <FiGrid className="text-2xl" />,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500",
      value: `${categories?.length}`,
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
      path: "/out-of-stock",
      icon: <FiXCircle className="text-2xl" />,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-500",
      value: zeroStock,
    },
    {
      id: 5,
      label: "Total Stock Value",
      path: "/total-stock-value",
      icon: <FiDollarSign className="text-2xl" />,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500",
      value: `$ ${totalStockValue}`,
    },
    {
      id: 6,
      label: "Today Sales",
      path: "/today-sales",
      icon: <FaShoppingCart className="text-2xl" />,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-500",
      value: "$4,250",
    },
    {
      id: 7,
      label: "Monthly Revenue",
      path: "/monthly-revenue",
      icon: <FiTrendingUp className="text-2xl" />,
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-500",
      value: "$89,450",
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

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setStats({
        totalCategories: 24,
        lowStockItems: 18,
        outOfStock: 7,
        totalStockValue: 124580,
        todaySales: 4250,
        monthlyRevenue: 89450,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case "sale":
        return <FaShoppingCart className="text-green-500" />;
      case "purchase":
        return <FiPackage className="text-blue-500" />;
      case "low_stock":
        return <FiAlertTriangle className="text-yellow-500" />;
      default:
        return <FaRegChartBar className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
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
              {products?.length}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500">This Month Sales</p>
            <p className="text-lg font-semibold text-gray-900">$89.4K</p>
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
              ৳ {totalStockValue.toLocaleString()}
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

                  {/* Progress bar for some items */}
                  {(item.id === 3 || item.id === 4) && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Stock Level</span>
                        <span>{item.id === 3 ? "15%" : "0%"}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.id === 3 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: item.id === 3 ? "15%" : "0%" }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {item.id === 5 && (
                    <div className="mt-4 flex items-center">
                      <FiTrendingUp className="text-green-500 mr-2" />
                      <span className="text-sm text-green-600 font-medium">
                        +12.5% from last month
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
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Recent Activities
            </h2>
            <Link
              href="/activities"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              View All
              <FaArrowRight className="ml-1" size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="mr-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium text-gray-900">{activity.item}</p>
                    {activity.amount && (
                      <span className="font-semibold text-gray-900">
                        {activity.amount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center mt-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        activity.type === "sale"
                          ? "bg-green-100 text-green-800"
                          : activity.type === "purchase"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {activity.type === "sale"
                        ? "Sale"
                        : activity.type === "purchase"
                          ? "Purchase"
                          : "Low Stock"}
                    </span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      Qty: {activity.quantity}
                    </span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products */}
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

          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {product.category}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-gray-500">
                        Stock: {product.stock}
                      </span>
                      <span className="text-xs font-semibold text-blue-600">
                        Sales: {product.sales}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/add-product">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center">
                  <FiPackage className="mr-2" />
                  Add Product
                </button>
              </Link>
              <Link href="/reports">
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center">
                  <FaRegChartBar className="mr-2" />
                  Generate Report
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-around">
        <Link href="/" className="flex flex-col items-center text-blue-600">
          <FiGrid size={20} />
          <span className="text-xs mt-1">Dashboard</span>
        </Link>
        <Link
          href="/products"
          className="flex flex-col items-center text-gray-500"
        >
          <FiPackage size={20} />
          <span className="text-xs mt-1">Products</span>
        </Link>
        <Link
          href="/sales"
          className="flex flex-col items-center text-gray-500"
        >
          <FaShoppingCart size={20} />
          <span className="text-xs mt-1">Sales</span>
        </Link>
        <Link
          href="/reports"
          className="flex flex-col items-center text-gray-500"
        >
          <FaRegChartBar size={20} />
          <span className="text-xs mt-1">Reports</span>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center">
            <FiCalendar className="text-blue-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-blue-800">Current Month</p>
              <p className="text-xl font-bold text-blue-900">October 2024</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center">
            <FiTrendingUp className="text-green-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-green-800">Sales Growth</p>
              <p className="text-xl font-bold text-green-900">+24.5%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center">
            <FiDollarSign className="text-purple-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-purple-800">Avg. Order Value</p>
              <p className="text-xl font-bold text-purple-900">$145.80</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryHome;
