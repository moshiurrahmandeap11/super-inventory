"use client";
import axiosInstance from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from "chart.js";
import { saveAs } from "file-saver";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import { toast } from "react-hot-toast";
import {
    FaArrowDown,
    FaArrowUp,
    FaBalanceScale,
    FaChartLine,
    FaCoins,
    FaMoneyBillWave,
    FaTable
} from "react-icons/fa";
import {
    FiArrowLeft,
    FiCalendar,
    FiDownload,
    FiRefreshCw,
    FiTrendingDown,
    FiTrendingUp
} from "react-icons/fi";
import * as XLSX from "xlsx";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const ProfitOrLoss = () => {
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState("normal"); // normal, graph
  const [period, setPeriod] = useState("monthly"); // daily, weekly, monthly, yearly
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Data states
  const [salesData, setSalesData] = useState([]);
  const [todaySales, setTodaySales] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState({ totalRevenue: 0, totalSales: 0 });
  const [productsData, setProductsData] = useState([]);

  // Profit/Loss data
  const [profitLossData, setProfitLossData] = useState({
    revenue: 0,
    costOfGoodsSold: 0,
    grossProfit: 0,
    grossMargin: 0,
    expenses: 0,
    netProfit: 0,
    netMargin: 0,
    profitPerSale: 0,
    dailyAverage: 0,
    monthlyAverage: 0,
    bestDay: { date: "", profit: 0 },
    worstDay: { date: "", profit: 0 },
    profitTrend: "up" // up, down, neutral
  });

  // Historical data for charts
  const [historicalData, setHistoricalData] = useState([]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [salesRes, todaySalesRes, monthlyRes, productsRes] = await Promise.all([
          axiosInstance.get("/sales-items"),
          axiosInstance.get("/sales-items/today-sales"),
          axiosInstance.get("/sales-items/monthly-revenue"),
          axiosInstance.get("/products")
        ]);

        // Process sales data
        if (salesRes.data.success) {
          setSalesData(salesRes.data.data || []);
        }

        // Process today's sales
        if (todaySalesRes.data.success) {
          setTodaySales(todaySalesRes.data.data || []);
        }

        // Process monthly revenue
        if (monthlyRes.data.success) {
          setMonthlyRevenue(monthlyRes.data.data);
        }

        // Process products data
        if (productsRes.data.success) {
          setProductsData(productsRes.data.data || []);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Calculate profit/loss whenever data changes
  useEffect(() => {
    if (salesData.length > 0 && productsData.length > 0) {
      calculateProfitLoss();
      generateHistoricalData();
    }
  }, [salesData, productsData, period, selectedDate, selectedMonth, selectedYear]);

  const calculateProfitLoss = () => {
    // Filter data based on selected period
    let filteredSales = [];
    let revenue = 0;
    let costOfGoodsSold = 0;

    switch (period) {
      case "daily":
        filteredSales = salesData.filter(sale => {
          const saleDate = new Date(sale.createdAt).toISOString().split("T")[0];
          return saleDate === selectedDate;
        });
        break;

      case "weekly":
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredSales = salesData.filter(sale => new Date(sale.createdAt) >= weekAgo);
        break;

      case "monthly":
        filteredSales = salesData.filter(sale => {
          const saleDate = new Date(sale.createdAt);
          return saleDate.getMonth() === selectedMonth && 
                 saleDate.getFullYear() === selectedYear;
        });
        break;

      case "yearly":
        filteredSales = salesData.filter(sale => {
          return new Date(sale.createdAt).getFullYear() === selectedYear;
        });
        break;

      default:
        filteredSales = salesData;
    }

    // Calculate revenue
    revenue = filteredSales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);

    // Calculate COGS (Cost of Goods Sold)
    // For each sale, find the product's cost price
    filteredSales.forEach(sale => {
      const product = productsData.find(p => p._id === sale.productID);
      if (product) {
        const costPrice = parseFloat(product.costPrice) || 0;
        const quantity = sale.productQty || 0;
        costOfGoodsSold += costPrice * quantity;
      }
    });

    // Calculate gross profit
    const grossProfit = revenue - costOfGoodsSold;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Estimate expenses (10% of revenue for demonstration - you can modify based on actual data)
    const expenses = revenue * 0.1;
    const netProfit = grossProfit - expenses;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // Profit per sale
    const profitPerSale = filteredSales.length > 0 ? netProfit / filteredSales.length : 0;

    // Daily average
    const daysInPeriod = filteredSales.length > 0 
      ? new Set(filteredSales.map(s => new Date(s.createdAt).toDateString())).size 
      : 1;
    const dailyAverage = daysInPeriod > 0 ? netProfit / daysInPeriod : 0;

    // Monthly average
    const monthlyAverage = netProfit;

    // Find best and worst days
    const profitByDay = new Map();
    filteredSales.forEach(sale => {
      const date = new Date(sale.createdAt).toDateString();
      const product = productsData.find(p => p._id === sale.productID);
      const cost = product ? (parseFloat(product.costPrice) || 0) * (sale.productQty || 0) : 0;
      const saleProfit = (sale.grandTotal || 0) - cost - ((sale.grandTotal || 0) * 0.1); // minus expenses

      if (profitByDay.has(date)) {
        profitByDay.set(date, profitByDay.get(date) + saleProfit);
      } else {
        profitByDay.set(date, saleProfit);
      }
    });

    let bestDay = { date: "", profit: -Infinity };
    let worstDay = { date: "", profit: Infinity };

    profitByDay.forEach((profit, date) => {
      if (profit > bestDay.profit) {
        bestDay = { date, profit };
      }
      if (profit < worstDay.profit) {
        worstDay = { date, profit };
      }
    });

    // Determine trend
    const profitTrend = netProfit >= 0 ? "up" : "down";

    setProfitLossData({
      revenue,
      costOfGoodsSold,
      grossProfit,
      grossMargin,
      expenses,
      netProfit,
      netMargin,
      profitPerSale,
      dailyAverage,
      monthlyAverage,
      bestDay,
      worstDay,
      profitTrend
    });
  };

  const generateHistoricalData = () => {
    const data = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthSales = salesData.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate.getMonth() === date.getMonth() && 
               saleDate.getFullYear() === date.getFullYear();
      });

      let monthRevenue = 0;
      let monthCost = 0;

      monthSales.forEach(sale => {
        monthRevenue += sale.grandTotal || 0;
        const product = productsData.find(p => p._id === sale.productID);
        if (product) {
          monthCost += (parseFloat(product.costPrice) || 0) * (sale.productQty || 0);
        }
      });

      const monthProfit = monthRevenue - monthCost - (monthRevenue * 0.1); // minus expenses

      data.push({
        month: months[date.getMonth()],
        year: date.getFullYear(),
        revenue: monthRevenue,
        cost: monthCost,
        profit: monthProfit,
        margin: monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0
      });
    }

    setHistoricalData(data);
  };

  // Chart configurations
  const lineChartData = {
    labels: historicalData.map(d => d.month),
    datasets: [
      {
        label: "Revenue",
        data: historicalData.map(d => d.revenue),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: false,
        yAxisID: "y"
      },
      {
        label: "Cost",
        data: historicalData.map(d => d.cost),
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        fill: false,
        yAxisID: "y"
      },
      {
        label: "Profit",
        data: historicalData.map(d => d.profit),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        fill: false,
        yAxisID: "y"
      }
    ]
  };

  const barChartData = {
    labels: historicalData.map(d => d.month),
    datasets: [
      {
        label: "Profit Margin (%)",
        data: historicalData.map(d => d.margin),
        backgroundColor: historicalData.map(d => 
          d.margin >= 0 ? "rgba(16, 185, 129, 0.8)" : "rgba(239, 68, 68, 0.8)"
        ),
        borderRadius: 8,
        barPercentage: 0.6,
        yAxisID: "y"
      }
    ]
  };

  const pieChartData = {
    labels: ["Revenue", "Cost", "Profit"],
    datasets: [
      {
        data: [
          profitLossData.revenue,
          profitLossData.costOfGoodsSold,
          profitLossData.netProfit
        ],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(16, 185, 129, 0.8)"
        ],
        borderWidth: 2,
        borderColor: "#fff"
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.parsed.y !== undefined) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value)
        }
      }
    }
  };

  const marginChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => value.toFixed(1) + "%"
        }
      }
    }
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

  // Format percentage
  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ["PROFIT & LOSS REPORT", ""],
        [`Generated: ${new Date().toLocaleString()}`, ""],
        [`Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`, ""],
        [],
        ["PROFIT & LOSS SUMMARY", ""],
        ["Metric", "Value"],
        ["Total Revenue", profitLossData.revenue],
        ["Cost of Goods Sold", profitLossData.costOfGoodsSold],
        ["Gross Profit", profitLossData.grossProfit],
        ["Gross Margin", `${profitLossData.grossMargin.toFixed(1)}%`],
        ["Expenses (Est.)", profitLossData.expenses],
        ["Net Profit/Loss", profitLossData.netProfit],
        ["Net Margin", `${profitLossData.netMargin.toFixed(1)}%`],
        ["Profit per Sale", profitLossData.profitPerSale],
        ["Daily Average", profitLossData.dailyAverage],
        ["Monthly Average", profitLossData.monthlyAverage],
        ["Best Day", `${profitLossData.bestDay.date}: ${formatCurrency(profitLossData.bestDay.profit)}`],
        ["Worst Day", `${profitLossData.worstDay.date}: ${formatCurrency(profitLossData.worstDay.profit)}`]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      // Historical Data Sheet
      const historicalSheetData = [
        ["MONTHLY TREND", ""],
        [],
        ["Month", "Year", "Revenue", "Cost", "Profit", "Margin (%)"]
      ];

      historicalData.forEach(d => {
        historicalSheetData.push([
          d.month,
          d.year,
          d.revenue,
          d.cost,
          d.profit,
          d.margin.toFixed(1)
        ]);
      });

      const historicalSheet = XLSX.utils.aoa_to_sheet(historicalSheetData);
      XLSX.utils.book_append_sheet(wb, historicalSheet, "Monthly Trend");

      // Generate Excel file
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      saveAs(blob, `profit-loss-${new Date().toISOString().split("T")[0]}.xlsx`);

      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Failed to export report");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
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
                    Profit & Loss Analysis
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
                    profitLossData.netProfit >= 0 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {profitLossData.netProfit >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                    {profitLossData.netProfit >= 0 ? "Profitable" : "Loss"}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  Real-time profit/loss analysis with multiple views
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <FiDownload size={16} />
                Export
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

        {/* Period Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <FiCalendar size={18} />
              <span className="font-medium">Period:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {["daily", "weekly", "monthly", "yearly"].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    period === p
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {period === "daily" && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            )}

            {period === "monthly" && (
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {months.map((month, index) => (
                    <option key={month} value={index}>{month}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}

            {period === "yearly" && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Main Profit/Loss Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-r rounded-2xl shadow-xl p-6 md:p-8 mb-8 text-white ${
            profitLossData.netProfit >= 0 
              ? "from-green-600 to-emerald-700" 
              : "from-red-600 to-rose-700"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                {profitLossData.netProfit >= 0 
                  ? <FaArrowUp className="text-white" size={32} />
                  : <FaArrowDown className="text-white" size={32} />
                }
              </div>
              <div>
                <p className="text-white/80 text-sm md:text-base mb-1">Net Profit/Loss</p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                  {formatCurrency(profitLossData.netProfit)}
                </h2>
                <p className="text-white/80 text-sm mt-2">
                  {profitLossData.netMargin >= 0 ? '+' : ''}{profitLossData.netMargin.toFixed(1)}% margin
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                <p className="text-white/80 text-xs">Revenue</p>
                <p className="text-xl font-semibold">{formatCurrency(profitLossData.revenue)}</p>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                <p className="text-white/80 text-xs">COGS</p>
                <p className="text-xl font-semibold">{formatCurrency(profitLossData.costOfGoodsSold)}</p>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                <p className="text-white/80 text-xs">Gross Profit</p>
                <p className="text-xl font-semibold">{formatCurrency(profitLossData.grossProfit)}</p>
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
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaMoneyBillWave className="text-blue-600" size={20} />
              </div>
              <span className={`text-sm font-medium ${
                profitLossData.grossMargin >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {formatPercentage(profitLossData.grossMargin)}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(profitLossData.grossProfit)}</p>
            <p className="text-sm text-gray-600 mt-1">Gross Profit</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaCoins className="text-purple-600" size={20} />
              </div>
              <span className="text-sm font-medium text-purple-600">Per Sale</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(profitLossData.profitPerSale)}</p>
            <p className="text-sm text-gray-600 mt-1">Profit per Transaction</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="text-green-600" size={20} />
              </div>
              <span className="text-sm font-medium text-green-600">Daily Avg</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(profitLossData.dailyAverage)}</p>
            <p className="text-sm text-gray-600 mt-1">Average Daily Profit</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaBalanceScale className="text-orange-600" size={20} />
              </div>
              <span className="text-sm font-medium text-orange-600">Expenses</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(profitLossData.expenses)}</p>
            <p className="text-sm text-gray-600 mt-1">Estimated (10% of revenue)</p>
          </motion.div>
        </div>

        {/* View Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6">
          <div className="flex flex-wrap justify-center gap-1">
            <button
              onClick={() => setViewType("normal")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                viewType === "normal"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaTable size={16} />
              <span>Normal View</span>
            </button>

            <button
              onClick={() => setViewType("graph")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                viewType === "graph"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaChartLine size={16} />
              <span>Graph View</span>
            </button>
          </div>
        </div>

        {/* Content based on view type */}
        <AnimatePresence mode="wait">
          {viewType === "normal" ? (
            <motion.div
              key="normal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Profit/Loss Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Profit/Loss Breakdown</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <span className="text-gray-600">Revenue</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(profitLossData.revenue)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <span className="text-gray-600">Cost of Goods Sold</span>
                      <span className="font-semibold text-red-600">- {formatCurrency(profitLossData.costOfGoodsSold)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Gross Profit</span>
                      <span className={`font-bold ${profitLossData.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profitLossData.grossProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <span className="text-gray-600">Expenses (10%)</span>
                      <span className="font-semibold text-orange-600">- {formatCurrency(profitLossData.expenses)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-900 font-bold">Net Profit/Loss</span>
                      <span className={`text-xl font-bold ${profitLossData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profitLossData.netProfit)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Key Metrics</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Gross Margin</span>
                        <span className="font-medium text-gray-900">{profitLossData.grossMargin.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(profitLossData.grossMargin, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Net Margin</span>
                        <span className={`font-medium ${profitLossData.netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {profitLossData.netMargin.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${profitLossData.netMargin >= 0 ? 'bg-green-600' : 'bg-red-600'}`}
                          style={{ width: `${Math.min(Math.abs(profitLossData.netMargin), 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs text-green-600 mb-1">Best Day</p>
                        <p className="text-sm font-semibold text-gray-900">{profitLossData.bestDay.date}</p>
                        <p className="text-xs text-green-600">{formatCurrency(profitLossData.bestDay.profit)}</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-xs text-red-600 mb-1">Worst Day</p>
                        <p className="text-sm font-semibold text-gray-900">{profitLossData.worstDay.date}</p>
                        <p className="text-xs text-red-600">{formatCurrency(profitLossData.worstDay.profit)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Data Table */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Performance</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Month</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Revenue</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Cost</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Profit</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {historicalData.slice(-6).map((data, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {data.month} {data.year}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-blue-600">
                            {formatCurrency(data.revenue)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-red-600">
                            {formatCurrency(data.cost)}
                          </td>
                          <td className={`px-4 py-3 text-right text-sm font-semibold ${
                            data.profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(data.profit)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">
                            {data.margin.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="graph"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Revenue/Cost/Profit Chart */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue, Cost & Profit Trend</h2>
                <div className="h-[400px]">
                  <Line data={lineChartData} options={chartOptions} />
                </div>
              </div>

              {/* Margin Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Profit Margin by Month</h2>
                  <div className="h-[300px]">
                    <Bar data={barChartData} options={marginChartOptions} />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Current Period Distribution</h2>
                  <div className="h-[300px]">
                    <Pie data={pieChartData} options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const label = context.label || "";
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }} />
                  </div>
                </div>
              </div>

              {/* Summary Cards for Graph View */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-800">Best Performing Month</p>
                  <p className="text-xl font-bold text-blue-900">
                    {historicalData.reduce((max, d) => d.profit > max.profit ? d : max, { profit: -Infinity, month: "N/A" }).month}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Profit: {formatCurrency(historicalData.reduce((max, d) => d.profit > max.profit ? d : max, { profit: -Infinity }).profit)}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                  <p className="text-sm text-green-800">Average Monthly Profit</p>
                  <p className="text-xl font-bold text-green-900">
                    {formatCurrency(historicalData.reduce((sum, d) => sum + d.profit, 0) / historicalData.length)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Based on {historicalData.length} months
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                  <p className="text-sm text-purple-800">Profit Trend</p>
                  <p className="text-xl font-bold text-purple-900 flex items-center gap-2">
                    {profitLossData.profitTrend === "up" ? (
                      <>
                        <FiTrendingUp className="text-green-600" />
                        <span className="text-green-600">Improving</span>
                      </>
                    ) : (
                      <>
                        <FiTrendingDown className="text-red-600" />
                        <span className="text-red-600">Declining</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Bottom Padding */}
        <div className="lg:hidden h-16"></div>
      </div>
    </div>
  );
};

export default ProfitOrLoss;