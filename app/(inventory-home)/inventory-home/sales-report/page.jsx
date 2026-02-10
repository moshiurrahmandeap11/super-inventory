"use client";
import axiosInstance from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const SalesReport = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'graph'
  const [graphType, setGraphType] = useState("line"); // 'line', 'bar', 'pie'
  console.log("report", report);

  // Fetch report data
  useEffect(() => {
    const tryFetchingReport = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axiosInstance.get("/sales-items");
        if (res.data.success) {
          setReport(res.data.data);
        }
      } catch (err) {
        setError("Failed to fetch sales report. Please try again.");
        console.error("Error fetching sales report:", err);
      } finally {
        setLoading(false);
      }
    };

    tryFetchingReport();
  }, []);

  // Handle delete
  const handleDelete = async (id) => {
    console.log(id);
    if (!window.confirm("Are you sure you want to delete this sales record?")) {
      return;
    }

    try {
      const res = await axiosInstance.delete(`/sales-items/${id}`);
      if (res.data.success) {
        setReport((prevReport) => prevReport.filter((item) => item._id !== id));
        alert("Sales record deleted successfully!");
      }
    } catch (err) {
      console.error("Error deleting sales record:", err);
      alert("Failed to delete sales record. Please try again.");
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    if (!report.length)
      return { totalSales: 0, totalRevenue: 0, averageDiscount: 0 };

    const totalRevenue = report.reduce((sum, item) => {
      const discountedPrice = item.productPrice * (1 - item.discount / 100);
      return sum + discountedPrice;
    }, 0);

    const totalSales = report.length;
    const averageDiscount =
      report.reduce((sum, item) => sum + item.discount, 0) / report.length;

    return { totalSales, totalRevenue, averageDiscount };
  }, [report]);

  // Prepare data for charts
  const chartData = useMemo(() => {
    // Group by date for line/bar charts
    const dailyData = {};
    report.forEach((item) => {
      const date = new Date(item.createdAt).toLocaleDateString();
      const revenue = item.productPrice * (1 - item.discount / 100);

      if (!dailyData[date]) {
        dailyData[date] = { date, sales: 0, revenue: 0 };
      }
      dailyData[date].sales += 1;
      dailyData[date].revenue += revenue;
    });

    // Convert to array and sort by date
    return Object.values(dailyData).sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
  }, [report]);

  // Prepare data for pie chart (by category)
  const categoryData = useMemo(() => {
    const categoryMap = {};
    report.forEach((item) => {
      const category = item.productCategory || "Uncategorized";
      const revenue = item.productPrice * (1 - item.discount / 100);

      if (!categoryMap[category]) {
        categoryMap[category] = { name: category, value: 0 };
      }
      categoryMap[category].value += revenue;
    });

    return Object.values(categoryMap);
  }, [report]);

  // Colors for charts
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Sales Report
        </h1>
        <p className="text-gray-600">
          Track and analyze your sales performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Total Sales
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {totals.totalSales}
          </p>
          <p className="text-sm text-gray-500 mt-2">Number of transactions</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Total Revenue
          </h3>
          <p className="text-3xl font-bold text-green-600">
            ৳{totals.totalRevenue.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">After discounts</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Average Discount
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {totals.averageDiscount.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 mt-2">Per transaction</p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode("table")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "table"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode("graph")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "graph"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Graph View
          </button>
        </div>

        {viewMode === "graph" && (
          <div className="flex space-x-2">
            <button
              onClick={() => setGraphType("line")}
              className={`px-3 py-1 rounded text-sm ${
                graphType === "line"
                  ? "bg-blue-100 text-blue-600 border border-blue-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Line Chart
            </button>
            <button
              onClick={() => setGraphType("bar")}
              className={`px-3 py-1 rounded text-sm ${
                graphType === "bar"
                  ? "bg-blue-100 text-blue-600 border border-blue-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setGraphType("pie")}
              className={`px-3 py-1 rounded text-sm ${
                graphType === "pie"
                  ? "bg-blue-100 text-blue-600 border border-blue-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pie Chart
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {viewMode === "table" ? (
          /* Table View */
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
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sold By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No sales records found
                    </td>
                  </tr>
                ) : (
                  report.map((item) => {
                    const finalPrice =
                      item.productPrice * (1 - item.discount / 100);
                    const saleDate = new Date(
                      item.createdAt,
                    ).toLocaleDateString();
                    const saleTime = new Date(
                      item.createdAt,
                    ).toLocaleTimeString();

                    return (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.productName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {item?.productID}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ৳{item.productPrice}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-semibold ${
                              item.discount > 0
                                ? "text-green-600"
                                : "text-gray-600"
                            }`}
                          >
                            {item.discount}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          ৳{finalPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.salesManager}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{saleDate}</div>
                          <div className="text-xs text-gray-400">
                            {saleTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Graph View */
          <div className="p-4 md:p-6">
            <div className="h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                {graphType === "line" && (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`৳${value}`, "Revenue"]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      name="Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#82ca9d"
                      name="Number of Sales"
                    />
                  </LineChart>
                )}

                {graphType === "bar" && (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`৳${value}`, "Revenue"]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar
                      dataKey="sales"
                      fill="#82ca9d"
                      name="Number of Sales"
                    />
                  </BarChart>
                )}

                {graphType === "pie" && (
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) =>
                        `${entry.name}: ৳${entry.value.toFixed(2)}`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`৳${value}`, "Revenue"]} />
                    <Legend />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>

            {graphType === "pie" && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryData.map((category, index) => (
                  <div
                    key={category.name}
                    className="flex items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className="w-4 h-4 rounded mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <div className="flex-1">
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-600">
                        ৳{category.value.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {viewMode === "table" && report.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Showing <span className="font-bold">{report.length}</span> sales
                records
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Total Revenue:
                <span className="font-bold text-green-600 ml-2">
                  ৳{totals.totalRevenue.toFixed(2)}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReport;
