"use client"
import axiosInstance from '@/app/SharedComponents/AxiosInstance/AxiosInstance';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { FiEdit2, FiGrid, FiHash, FiPlus, FiRefreshCw, FiSearch, FiTrash2 } from 'react-icons/fi';
import Swal from 'sweetalert2';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const [totalProducts, setTotalProducts] = useState({});
    const [products, setProducts] = useState([]);

    // Fetch categories and products
    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get("/product-categories");
            if (res.data.success) {
                setCategories(res.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await axiosInstance.get("/products");
            if (res.data.success) {
                setProducts(res.data.data || []);
                
                // Calculate product count per category
                const productCount = {};
                res.data.data.forEach(product => {
                    if (product.category) {
                        productCount[product.category] = (productCount[product.category] || 0) + 1;
                    }
                });
                setTotalProducts(productCount);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    // Handle Add Category
    const handleAddCategory = () => {
        Swal.fire({
            title: 'Add New Category',
            html: `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Category Name*</label>
                        <input type="text" id="swal-category-name" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                               placeholder="Enter category name"
                               autofocus>
                    </div>
                    <div class="text-sm text-gray-500">
                        <p>Category names are case-insensitive and duplicates are not allowed.</p>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Add Category',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#6B7280',
            width: '500px',
            preConfirm: async () => {
                const name = document.getElementById('swal-category-name').value.trim();
                
                if (!name) {
                    Swal.showValidationMessage('Category name is required');
                    return false;
                }

                if (name.length < 2) {
                    Swal.showValidationMessage('Category name must be at least 2 characters long');
                    return false;
                }

                try {
                    const response = await axiosInstance.post('/product-categories', { name });
                    
                    if (response.data.success) {
                        return true;
                    } else {
                        Swal.showValidationMessage(response.data.message || 'Failed to add category');
                        return false;
                    }
                } catch (error) {
                    const errorMsg = error.response?.data?.message || 'Failed to add category';
                    Swal.showValidationMessage(errorMsg);
                    return false;
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Show success message
                Swal.fire({
                    title: 'Success!',
                    text: 'Category added successfully',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    fetchCategories();
                    toast.success('Category added successfully!');
                });
            }
        });
    };

    // Handle Edit Category
    const handleEditCategory = (category) => {
        Swal.fire({
            title: 'Edit Category',
            html: `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Category Name*</label>
                        <input type="text" id="swal-edit-category-name" 
                               value="${category.name}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                               placeholder="Enter category name">
                    </div>
                    <div class="text-sm text-gray-500">
                        <p>Category was created: ${new Date(category.createdAt).toLocaleDateString()}</p>
                        <p>Last updated: ${new Date(category.updatedAt).toLocaleDateString()}</p>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Update Category',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#6B7280',
            width: '500px',
            preConfirm: async () => {
                const name = document.getElementById('swal-edit-category-name').value.trim();
                
                if (!name) {
                    Swal.showValidationMessage('Category name is required');
                    return false;
                }

                if (name.length < 2) {
                    Swal.showValidationMessage('Category name must be at least 2 characters long');
                    return false;
                }

                try {
                    const response = await axiosInstance.patch(`/product-categories/${category._id}`, { name });
                    
                    if (response.data.success) {
                        return true;
                    } else {
                        Swal.showValidationMessage(response.data.message || 'Failed to update category');
                        return false;
                    }
                } catch (error) {
                    const errorMsg = error.response?.data?.message || 'Failed to update category';
                    Swal.showValidationMessage(errorMsg);
                    return false;
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Show success message
                Swal.fire({
                    title: 'Updated!',
                    text: 'Category updated successfully',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    fetchCategories();
                    toast.success('Category updated successfully!');
                });
            }
        });
    };

    // Handle Delete Category
    const handleDeleteCategory = (category) => {
        // Check if category has products
        const productCount = totalProducts[category.name] || 0;
        
        if (productCount > 0) {
            Swal.fire({
                title: 'Cannot Delete Category',
                html: `
                    <div class="space-y-4">
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-sm font-medium text-red-800">This category contains products!</h3>
                                    <div class="mt-2 text-sm text-red-700">
                                        <p>You cannot delete this category because it contains <strong>${productCount}</strong> product(s).</p>
                                        <p class="mt-1">Please reassign or delete all products in this category first.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#6B7280',
                width: '600px'
            });
            return;
        }

        Swal.fire({
            title: 'Are you sure?',
            html: `
                <div class="space-y-4">
                    <p>You are about to delete the category:</p>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold text-gray-900">${category.name}</h3>
                        <p class="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            reverseButtons: true,
            width: '500px'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await axiosInstance.delete(`/product-categories/${category._id}`);
                    
                    if (response.data.success) {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Category has been deleted successfully.',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        }).then(() => {
                            fetchCategories();
                            toast.success('Category deleted successfully!');
                        });
                    } else {
                        toast.error(response.data.message || 'Failed to delete category');
                    }
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to delete category');
                }
            }
        });
    };

    // Filter and sort categories
    const filteredCategories = categories
        .filter(category => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return category.name.toLowerCase().includes(searchLower);
        })
        .sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.name.localeCompare(b.name);
            } else {
                return b.name.localeCompare(a.name);
            }
        });

    // Reset filters
    const resetFilters = () => {
        setSearchTerm('');
        setSortOrder('asc');
    };

    // Get product count for a category
    const getProductCount = (categoryName) => {
        return totalProducts[categoryName] || 0;
    };

    // Get stock status color
    const getStockStatusColor = (count) => {
        if (count === 0) return 'text-gray-500 bg-gray-100';
        if (count <= 5) return 'text-yellow-600 bg-yellow-100';
        return 'text-green-600 bg-green-100';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading categories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Categories</h1>
                        <p className="text-gray-600 mt-2">Manage your product categories</p>
                    </div>
                    <button
                        onClick={handleAddCategory}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
                    >
                        <FiPlus className="mr-2" size={20} />
                        Add Category
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Categories</p>
                            <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FiGrid className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Products</p>
                            <p className="text-2xl font-bold text-purple-900">{products.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FiHash className="text-purple-600" size={24} />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Empty Categories</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {categories.filter(cat => getProductCount(cat.name) === 0).length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FiGrid className="text-gray-400" size={24} />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Popular Category</p>
                            <p className="text-lg font-bold text-gray-900 truncate">
                                {categories.length > 0 ? 
                                    categories.reduce((a, b) => 
                                        getProductCount(a.name) > getProductCount(b.name) ? a : b
                                    ).name : 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {categories.length > 0 ? 
                                    getProductCount(categories.reduce((a, b) => 
                                        getProductCount(a.name) > getProductCount(b.name) ? a : b
                                    ).name) + ' products' : ''}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <FiHash className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search categories by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Sort and Reset */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="flex items-center text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                        >
                            {sortOrder === 'asc' ? (
                                <><FaSortAmountDown className="mr-2" /> A-Z</>
                            ) : (
                                <><FaSortAmountUp className="mr-2" /> Z-A</>
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

            {/* Categories Grid - Mobile View */}
            <div className="block lg:hidden">
                <div className="space-y-4">
                    {filteredCategories.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                            <FiGrid className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                            <p className="text-gray-500 mb-4">Try adjusting your search or add a new category</p>
                            <button
                                onClick={handleAddCategory}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center"
                            >
                                <FiPlus className="mr-2" />
                                Add Category
                            </button>
                        </div>
                    ) : (
                        filteredCategories.map((category) => {
                            const productCount = getProductCount(category.name);
                            return (
                                <div key={category._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                                                <FiGrid className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                                                <p className="text-xs text-gray-500">
                                                    Created: {new Date(category.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStockStatusColor(productCount)}`}>
                                                {productCount} product{productCount !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <div className="text-sm text-gray-500">
                                            <p>Last updated: {new Date(category.updatedAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditCategory(category)}
                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(category)}
                                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Categories Table - Desktop View */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Products Count
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Updated
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center">
                                        <div className="text-gray-500">
                                            <FiGrid className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-2 text-lg font-medium">No categories found</p>
                                            <p className="mt-1">Try adjusting your search or add a new category</p>
                                            <button
                                                onClick={handleAddCategory}
                                                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center"
                                            >
                                                <FiPlus className="mr-2" />
                                                Add Category
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map((category) => {
                                    const productCount = getProductCount(category.name);
                                    return (
                                        <tr key={category._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                                                        <FiGrid className="text-white" size={14} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {category.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            ID: {category._id?.slice(-6)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStockStatusColor(productCount)}`}>
                                                        {productCount} product{productCount !== 1 ? 's' : ''}
                                                    </span>
                                                    {productCount > 0 && (
                                                        <div className="ml-3 w-24">
                                                            <div className="bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className={`h-2 rounded-full ${
                                                                        productCount === 0 ? 'bg-gray-400' :
                                                                        productCount <= 5 ? 'bg-yellow-500' :
                                                                        'bg-green-500'
                                                                    }`}
                                                                    style={{ 
                                                                        width: `${Math.min(100, (productCount / Math.max(...Object.values(totalProducts))) * 100)}%` 
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(category.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(category.updatedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEditCategory(category)}
                                                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-md transition-colors flex items-center"
                                                    >
                                                        <FiEdit2 className="mr-2" size={14} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(category)}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-md transition-colors flex items-center"
                                                    >
                                                        <FiTrash2 className="mr-2" size={14} />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Info */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <div>
                    Showing <span className="font-medium">{filteredCategories.length}</span> of{' '}
                    <span className="font-medium">{categories.length}</span> categories
                </div>
                <div className="text-xs text-gray-400">
                    Click on a category to see its products
                </div>
            </div>

            {/* Empty Categories Alert */}
            {categories.filter(cat => getProductCount(cat.name) === 0).length > 0 && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Empty Categories
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>
                                    You have {categories.filter(cat => getProductCount(cat.name) === 0).length} category/categories with no products.
                                    Consider deleting them or adding products.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;