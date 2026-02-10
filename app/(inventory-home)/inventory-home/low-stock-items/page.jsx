"use client"
import axiosInstance from '@/app/SharedComponents/AxiosInstance/AxiosInstance';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import {
    FiAlertTriangle,
    FiChevronLeft,
    FiChevronRight,
    FiChevronsLeft,
    FiChevronsRight,
    FiDollarSign,
    FiEye,
    FiPackage,
    FiRefreshCw,
    FiSearch,
    FiShoppingCart,
    FiTrendingDown
} from 'react-icons/fi';
import Swal from 'sweetalert2';

const LowStockItems = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filterStockLevel, setFilterStockLevel] = useState('all'); // 'all', 'critical', 'low'

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get("/products");
            if(res.data.success) {
                setProducts(res.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    // Filter products with quantity <= 10 and apply search filter
    const lowStockProducts = products.filter(product => {
        // First filter for low stock (quantity <= 10)
        if (product.quantity > 10) return false;
        
        // Apply stock level filter
        if (filterStockLevel === 'critical' && product.quantity > 5) return false;
        if (filterStockLevel === 'low' && product.quantity <= 5) return false;

        // Apply search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                product.name?.toLowerCase().includes(searchLower) ||
                product.category?.toLowerCase().includes(searchLower) ||
                product.supplier?.toLowerCase().includes(searchLower) ||
                product._id?.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    // Sort products
    const sortedProducts = [...lowStockProducts].sort((a, b) => {
        if (sortOrder === 'asc') {
            return a.quantity - b.quantity; // Sort by quantity ascending
        } else {
            return b.quantity - a.quantity; // Sort by quantity descending
        }
    });

    // Pagination logic
    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = sortedProducts.slice(startIndex, endIndex);

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Reset filters
    const resetFilters = () => {
        setSearchTerm('');
        setSortOrder('asc');
        setFilterStockLevel('all');
        setCurrentPage(1);
    };

    // Get stock status
    const getStockStatus = (quantity) => {
        if (quantity === 0) {
            return {
                text: 'Out of Stock',
                color: 'text-red-600',
                bgColor: 'bg-red-100',
                badgeColor: 'bg-red-500',
                icon: '❌'
            };
        } else if (quantity <= 3) {
            return {
                text: 'Critical',
                color: 'text-red-600',
                bgColor: 'bg-red-50',
                badgeColor: 'bg-red-400',
                icon: '⚠️'
            };
        } else if (quantity <= 5) {
            return {
                text: 'Very Low',
                color: 'text-orange-600',
                bgColor: 'bg-orange-50',
                badgeColor: 'bg-orange-400',
                icon: '🔸'
            };
        } else {
            return {
                text: 'Low',
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-50',
                badgeColor: 'bg-yellow-400',
                icon: '📉'
            };
        }
    };

    // Format currency
    const formatCurrency = (num) => {
        if (!num && num !== 0) return "$0";
        return `$${parseFloat(num).toFixed(2)}`;
    };

    // Format number
    const formatNumber = (num) => {
        if (!num && num !== 0) return "0";
        return parseFloat(num).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3
        });
    };

    // Handle view product details
    const handleViewProduct = (product) => {
        const stockStatus = getStockStatus(product.quantity);
        const totalValue = (Number(product.price) * Number(product.quantity)).toFixed(2);
        const totalCost = (Number(product.costPrice) * Number(product.quantity)).toFixed(2);

        Swal.fire({
            title: product.name,
            html: `
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="${stockStatus.bgColor} p-4 rounded-lg">
                            <label class="block text-sm font-medium ${stockStatus.color} mb-1">Stock Status</label>
                            <div class="flex items-center">
                                <span class="text-2xl mr-2">${stockStatus.icon}</span>
                                <div>
                                    <p class="text-xl font-bold ${stockStatus.color}">${stockStatus.text}</p>
                                    <p class="text-sm text-gray-600">${formatNumber(product.quantity)} units remaining</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <label class="block text-sm font-medium text-blue-700 mb-1">Category</label>
                            <p class="text-xl font-bold text-blue-900">${product.category || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-green-50 p-4 rounded-lg">
                            <label class="block text-sm font-medium text-green-700 mb-1">Current Price</label>
                            <p class="text-2xl font-bold text-green-900">${formatCurrency(product.price)}</p>
                            <p class="text-sm text-green-600">Cost: ${formatCurrency(product.costPrice)}</p>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <label class="block text-sm font-medium text-purple-700 mb-1">Total Value</label>
                            <p class="text-2xl font-bold text-purple-900">${formatCurrency(totalValue)}</p>
                            <p class="text-sm text-purple-600">Cost: ${formatCurrency(totalCost)}</p>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Stock Progress</label>
                        <div class="space-y-2">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Current Stock</span>
                                <span class="font-semibold ${stockStatus.color}">${formatNumber(product.quantity)} units</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-3">
                                <div class="h-3 rounded-full ${stockStatus.badgeColor}" style="width: ${Math.min(100, (product.quantity / 10) * 100)}%"></div>
                            </div>
                            <div class="flex justify-between text-xs text-gray-500">
                                <span>0</span>
                                <span>5 (Low)</span>
                                <span>10 (Minimum)</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                            <p class="text-lg font-semibold text-gray-900">${product.supplier || 'N/A'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                            <p class="text-lg font-semibold text-gray-900">${new Date(product.updatedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    ${product.description ? `
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <div class="p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                                ${product.description}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `,
            width: '700px',
            showConfirmButton: false,
            showCloseButton: true,
        });
    };

    // Calculate statistics
    const stats = {
        totalLowStock: lowStockProducts.length,
        outOfStock: lowStockProducts.filter(p => p.quantity === 0).length,
        criticalStock: lowStockProducts.filter(p => p.quantity <= 3).length,
        veryLowStock: lowStockProducts.filter(p => p.quantity > 3 && p.quantity <= 5).length,
        lowStock: lowStockProducts.filter(p => p.quantity > 5 && p.quantity <= 10).length,
        totalValue: lowStockProducts.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 0), 0)
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading low stock items...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 text-black md:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Low Stock Items</h1>
                        <p className="text-gray-600 mt-2">Monitor and manage products with low inventory levels</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={fetchProducts}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
                        >
                            <FiRefreshCw className="mr-2" />
                            Refresh
                        </button>
                        <button
                            onClick={() => {
                                Swal.fire({
                                    title: 'Export Low Stock Report',
                                    html: `
                                        <div class="space-y-4">
                                            <p class="text-gray-600">Export ${lowStockProducts.length} low stock items to:</p>
                                            <div class="grid grid-cols-2 gap-3">
                                                <button onclick="window.exportType = 'csv'" class="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                                                    CSV File
                                                </button>
                                                <button onclick="window.exportType = 'pdf'" class="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                                                    PDF Report
                                                </button>
                                            </div>
                                        </div>
                                    `,
                                    showCancelButton: true,
                                    confirmButtonText: 'Export',
                                    preConfirm: () => {
                                        const type = window.exportType || 'csv';
                                        Swal.fire({
                                            title: 'Exporting...',
                                            text: `Preparing ${type.toUpperCase()} report`,
                                            allowOutsideClick: false,
                                            didOpen: () => {
                                                Swal.showLoading();
                                            }
                                        });
                                        // Simulate export
                                        setTimeout(() => {
                                            Swal.fire({
                                                icon: 'success',
                                                title: 'Exported!',
                                                text: `Low stock report exported as ${type.toUpperCase()}`,
                                                timer: 2000
                                            });
                                        }, 1500);
                                    }
                                });
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
                        >
                            <FiShoppingCart className="mr-2" />
                            Export Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Low Stock</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalLowStock}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <FiTrendingDown className="text-yellow-600" size={24} />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Out of Stock</p>
                            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <FiAlertTriangle className="text-red-600" size={24} />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Critical Stock (≤3)</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.criticalStock}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <span className="text-orange-600 text-xl">⚠️</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Value</p>
                            <p className="text-2xl font-bold text-green-600">${formatNumber(stats.totalValue)}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <FiDollarSign className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search low stock items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Stock Level Filter */}
                    <div>
                        <select
                            value={filterStockLevel}
                            onChange={(e) => setFilterStockLevel(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value="all">All Low Stock</option>
                            <option value="critical">Critical (≤3)</option>
                            <option value="low">Low (4-10)</option>
                        </select>
                    </div>

                    {/* Sort and Reset */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="flex items-center text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                        >
                            {sortOrder === 'asc' ? (
                                <><FaSortAmountDown className="mr-2" /> Stock ↑</>
                            ) : (
                                <><FaSortAmountUp className="mr-2" /> Stock ↓</>
                            )}
                        </button>
                        
                        <button
                            onClick={resetFilters}
                            className="flex items-center text-gray-600 hover:text-gray-900 ml-4"
                        >
                            <FiRefreshCw className="mr-2" />
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Low Stock Cards */}
            <div className="block lg:hidden">
                <div className="space-y-4">
                    {currentProducts.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                            <FiPackage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No low stock items found</h3>
                            <p className="text-gray-500 mb-4">All products have sufficient stock levels</p>
                        </div>
                    ) : (
                        currentProducts.map((product) => {
                            const stockStatus = getStockStatus(product.quantity);
                            const totalValue = (Number(product.price) * Number(product.quantity)).toFixed(2);
                            
                            return (
                                <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                                    <p className="text-sm text-gray-500">{product.category}</p>
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color} rounded-full`}>
                                                    {stockStatus.text}
                                                </span>
                                            </div>
                                            
                                            <div className="mt-2 grid grid-cols-2 gap-3">
                                                <div className="bg-gray-50 p-2 rounded-lg">
                                                    <p className="text-xs text-gray-500">Stock</p>
                                                    <p className={`text-lg font-bold ${stockStatus.color}`}>
                                                        {formatNumber(product.quantity)}
                                                    </p>
                                                </div>
                                                <div className="bg-gray-50 p-2 rounded-lg">
                                                    <p className="text-xs text-gray-500">Price</p>
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {formatCurrency(product.price)}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-2">
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span>Stock Level</span>
                                                    <span>{formatNumber(product.quantity)}/10</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full ${stockStatus.badgeColor}`}
                                                        style={{ width: `${Math.min(100, (product.quantity / 10) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <div className="text-sm text-gray-500">
                                            <p>Supplier: {product.supplier}</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleViewProduct(product)}
                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <FiEye size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Desktop Low Stock Table */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                                    Stock Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Value
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Supplier
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center">
                                        <div className="text-gray-500">
                                            <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-2 text-lg font-medium">No low stock items found</p>
                                            <p className="mt-1">All products have sufficient stock levels</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentProducts.map((product) => {
                                    const stockStatus = getStockStatus(product.quantity);
                                    const totalValue = (Number(product.price) * Number(product.quantity)).toFixed(2);
                                    
                                    return (
                                        <tr key={product._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {product.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ID: {product._id?.slice(-6)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="mr-2">{stockStatus.icon}</span>
                                                    <span className={`px-2 py-1 text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color} rounded-full`}>
                                                        {stockStatus.text}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="mr-3">
                                                        <span className={`text-sm font-medium ${stockStatus.color}`}>
                                                            {formatNumber(product.quantity)}
                                                        </span>
                                                    </div>
                                                    <div className="w-24">
                                                        <div className="bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className={`h-2 rounded-full ${stockStatus.badgeColor}`}
                                                                style={{ width: `${Math.min(100, (product.quantity / 10) * 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatCurrency(product.price)}
                                                <div className="text-xs text-gray-500">
                                                    Cost: {formatCurrency(product.costPrice)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatCurrency(totalValue)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {product.supplier}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleViewProduct(product)}
                                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-md transition-colors flex items-center"
                                                >
                                                    <FiEye className="mr-2" size={14} />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, sortedProducts.length)}</span> of{' '}
                    <span className="font-medium">{sortedProducts.length}</span> low stock items
                </div>
                
                {/* Items per page selector */}
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Show:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <FiChevronsLeft size={18} />
                    </button>
                    
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <FiChevronLeft size={18} />
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                                pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                                pageNumber = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNumber = totalPages - 4 + i;
                            } else {
                                pageNumber = currentPage - 2 + i;
                            }
                            
                            if (pageNumber > totalPages) return null;
                            
                            return (
                                <button
                                    key={pageNumber}
                                    onClick={() => handlePageChange(pageNumber)}
                                    className={`w-8 h-8 rounded-md text-sm font-medium ${
                                        currentPage === pageNumber
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {pageNumber}
                                </button>
                            );
                        })}
                    </div>
                    
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <FiChevronRight size={18} />
                    </button>
                    
                    <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <FiChevronsRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LowStockItems;