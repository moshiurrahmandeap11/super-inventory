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
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import { toast } from "react-hot-toast";
import {
    FaChartBar,
    FaChartLine,
    FaChartPie,
    FaTable
} from "react-icons/fa";
import {
    FiArrowLeft,
    FiCalendar,
    FiDollarSign,
    FiDownload,
    FiRefreshCw,
    FiShoppingCart,
    FiTrendingUp
} from "react-icons/fi";

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

const MonthlyRevenue = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState("graph");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [comparisonData, setComparisonData] = useState({
    previousMonth: 0,
    previousYear: 0,
    growth: 0
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Fetch monthly revenue data for all months
  useEffect(() => {
    const fetchAllMonthlyRevenue = async () => {
      try {
        setLoading(true);
        
        // Fetch data for all months of selected year
        const allMonthsData = [];
        
        for (let month = 0; month < 12; month++) {
          const response = await axiosInstance.get("/sales-items/monthly-revenue", {
            params: {
              year: selectedYear,
              month: month + 1 // API expects 1-12
            }
          });
          
          if (response.data.success) {
            allMonthsData.push({
              month: month,
              monthName: months[month],
              revenue: response.data.data.totalRevenue || 0,
              sales: response.data.data.totalSales || 0
            });
          }
        }
        
        setMonthlyData(allMonthsData);
        
        // Calculate comparisons
        const currentMonthData = allMonthsData[selectedMonth] || { revenue: 0, sales: 0 };
        const previousMonthData = allMonthsData[selectedMonth - 1] || { revenue: 0 };
        const sameMonthLastYear = await fetchSameMonthLastYear(selectedYear, selectedMonth);
        
        const growth = previousMonthData.revenue > 0 
          ? ((currentMonthData.revenue - previousMonthData.revenue) / previousMonthData.revenue) * 100 
          : 0;

        setComparisonData({
          previousMonth: previousMonthData.revenue,
          previousYear: sameMonthLastYear,
          growth
        });

      } catch (error) {
        console.error("Error fetching monthly revenue:", error);
        toast.error("Failed to load monthly revenue data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllMonthlyRevenue();
  }, [selectedYear]);

  // Fetch same month last year data
  const fetchSameMonthLastYear = async (year, month) => {
    try {
      const response = await axiosInstance.get("/sales-items/monthly-revenue", {
        params: {
          year: year - 1,
          month: month + 1
        }
      });
      return response.data.success ? response.data.data.totalRevenue || 0 : 0;
    } catch (error) {
      return 0;
    }
  };

  // Get current month data
  const currentMonthData = monthlyData[selectedMonth] || { revenue: 0, sales: 0 };

  // Chart configurations
  const lineChartData = {
    labels: monthlyData.map(d => d.monthName),
    datasets: [
      {
        label: "Revenue (BDT)",
        data: monthlyData.map(d => d.revenue),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: "Number of Sales",
        data: monthlyData.map(d => d.sales),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgb(16, 185, 129)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y1"
      }
    ]
  };

  const barChartData = {
    labels: monthlyData.map(d => d.monthName),
    datasets: [
      {
        label: "Revenue (BDT)",
        data: monthlyData.map(d => d.revenue),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderRadius: 8,
        barPercentage: 0.6
      }
    ]
  };

  const pieChartData = {
    labels: monthlyData.filter(d => d.revenue > 0).map(d => d.monthName),
    datasets: [
      {
        data: monthlyData.filter(d => d.revenue > 0).map(d => d.revenue),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(14, 165, 233, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(249, 115, 22, 0.8)",
          "rgba(99, 102, 241, 0.8)"
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
        },
        grid: { color: "rgba(0,0,0,0.05)" }
      },
      y1: {
        position: "right",
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { callback: (value) => value + " sales" }
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value)
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
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

  // Calculate totals
  const totalRevenue = monthlyData.reduce((sum, d) => sum + d.revenue, 0);
  const totalSales = monthlyData.reduce((sum, d) => sum + d.sales, 0);
  const avgRevenue = monthlyData.filter(d => d.revenue > 0).length > 0 
    ? totalRevenue / monthlyData.filter(d => d.revenue > 0).length 
    : 0;

  // Export data
  const exportData = () => {
    const headers = ["Month", "Revenue", "Number of Sales", "Avg. per Sale"];
    const csvData = monthlyData.map(d => [
      d.monthName,
      d.revenue,
      d.sales,
      d.sales > 0 ? d.revenue / d.sales : 0
    ]);

    // Add total row
    csvData.push([
      "TOTAL",
      totalRevenue,
      totalSales,
      totalSales > 0 ? totalRevenue / totalSales : 0
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly-revenue-${selectedYear}.csv`;
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
                    Monthly Revenue
                  </h1>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                    {selectedYear}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  Complete year-wise revenue analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportData}
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

        {/* Year Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <FiCalendar size={18} />
              <span className="font-medium">Select Year:</span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedYear === year
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {year}
                </button>
              ))}
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
                  {formatCurrency(totalRevenue)}
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
                <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalSales}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiShoppingCart className="text-blue-600" size={24} />
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
                <p className="text-sm text-gray-600 mb-1">Avg. Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(avgRevenue)}
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
                <p className="text-sm text-gray-600 mb-1">Best Month</p>
                <p className="text-lg font-bold text-gray-900">
                  {monthlyData.reduce((max, d) => d.revenue > max.revenue ? d : max, { revenue: 0, monthName: "N/A" }).monthName}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="text-orange-600" size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {months.map((month, index) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(index)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedMonth === index
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {month.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Current Month Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800 mb-1">{months[selectedMonth]} Revenue</p>
            <p className="text-xl font-bold text-blue-900">
              {formatCurrency(currentMonthData.revenue)}
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
            <p className="text-sm text-green-800 mb-1">{months[selectedMonth]} Sales</p>
            <p className="text-xl font-bold text-green-900">
              {currentMonthData.sales}
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-200">
            <p className="text-sm text-purple-800 mb-1">Avg. per Sale</p>
            <p className="text-xl font-bold text-purple-900">
              {formatCurrency(currentMonthData.sales > 0 
                ? currentMonthData.revenue / currentMonthData.sales 
                : 0)}
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6">
          <div className="flex flex-wrap justify-center gap-1">
            <button
              onClick={() => setViewType("graph")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                viewType === "graph"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaChartLine size={16} />
              <span>Line Graph</span>
            </button>

            <button
              onClick={() => setViewType("bar")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                viewType === "bar"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaChartBar size={16} />
              <span>Bar Chart</span>
            </button>

            <button
              onClick={() => setViewType("pie")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                viewType === "pie"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaChartPie size={16} />
              <span>Pie Chart</span>
            </button>

            <button
              onClick={() => setViewType("table")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                viewType === "table"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FaTable size={16} />
              <span>Table View</span>
            </button>
          </div>
        </div>

        {/* Chart/Table Container */}
        <motion.div
          key={viewType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6"
        >
          {viewType === "graph" && (
            <div className="h-[450px]">
              <Line data={lineChartData} options={chartOptions} />
            </div>
          )}

          {viewType === "bar" && (
            <div className="h-[450px]">
              <Bar data={barChartData} options={barOptions} />
            </div>
          )}

          {viewType === "pie" && (
            <div className="h-[450px]">
              <Pie data={pieChartData} options={pieOptions} />
            </div>
          )}

          {viewType === "table" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Number of Sales
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. per Sale
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {monthlyData.map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {data.monthName}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(data.revenue)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {data.sales}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {formatCurrency(data.sales > 0 ? data.revenue / data.sales : 0)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {totalRevenue > 0 ? ((data.revenue / totalRevenue) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Total</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(totalRevenue)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                      {totalSales}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(totalSales > 0 ? totalRevenue / totalSales : 0)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </motion.div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800 mb-1">vs Previous Month</p>
            <p className="text-xl font-bold text-blue-900">
              {formatCurrency(comparisonData.previousMonth)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {comparisonData.previousMonth > 0 
                ? `${comparisonData.growth >= 0 ? '+' : ''}${comparisonData.growth.toFixed(1)}% change`
                : 'No previous data'}
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
            <p className="text-sm text-green-800 mb-1">vs Same Month Last Year</p>
            <p className="text-xl font-bold text-green-900">
              {formatCurrency(comparisonData.previousYear)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {comparisonData.previousYear > 0 
                ? `${((currentMonthData.revenue - comparisonData.previousYear) / comparisonData.previousYear * 100).toFixed(1)}% year-over-year`
                : 'No previous data'}
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-200">
            <p className="text-sm text-purple-800 mb-1">Projected Annual</p>
            <p className="text-xl font-bold text-purple-900">
              {formatCurrency(avgRevenue * 12)}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              Based on {monthlyData.filter(d => d.revenue > 0).length} months of data
            </p>
          </div>
        </div>

        {/* Mobile Bottom Padding */}
        <div className="lg:hidden h-16"></div>
      </div>
    </div>
  );
};

export default MonthlyRevenue;