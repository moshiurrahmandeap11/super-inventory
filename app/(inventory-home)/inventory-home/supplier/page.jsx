"use client"
import axiosInstance from '@/app/SharedComponents/AxiosInstance/AxiosInstance';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import {
    FiChevronLeft,
    FiChevronRight,
    FiChevronsLeft,
    FiChevronsRight,
    FiEdit2,
    FiMail,
    FiMapPin,
    FiPhone,
    FiRefreshCw,
    FiSearch,
    FiTrash2,
    FiTruck,
    FiUserPlus
} from 'react-icons/fi';
import Swal from 'sweetalert2';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get("/suppliers");
            if(res.data.success) {
                setSuppliers(res.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            toast.error("Failed to load suppliers");
        } finally {
            setLoading(false);
        }
    };

    // Filter suppliers based on search
    const filteredSuppliers = suppliers.filter(supplier => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
            supplier.name?.toLowerCase().includes(searchLower) ||
            supplier.phone?.includes(searchTerm) ||
            supplier.email?.toLowerCase().includes(searchLower) ||
            supplier.address?.toLowerCase().includes(searchLower)
        );
    });

    // Sort suppliers
    const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
        if (sortOrder === 'asc') {
            return a.name?.localeCompare(b.name);
        } else {
            return b.name?.localeCompare(a.name);
        }
    });

    // Pagination logic
    const totalPages = Math.ceil(sortedSuppliers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSuppliers = sortedSuppliers.slice(startIndex, endIndex);

    // Handle Add Supplier
    const handleAddSupplier = () => {
        Swal.fire({
            title: 'Add New Supplier',
            html: `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                        <input type="text" id="swal-name" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                               placeholder="Enter supplier name" 
                               required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                        <input type="tel" id="swal-phone" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                               placeholder="Enter phone number" 
                               required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                        <input type="email" id="swal-email" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                               placeholder="Enter email address">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
                        <textarea id="swal-address" 
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                                  rows="3" 
                                  placeholder="Enter supplier address"></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Add Supplier',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#6B7280',
            width: '500px',
            preConfirm: async () => {
                const name = document.getElementById('swal-name').value.trim();
                const phone = document.getElementById('swal-phone').value.trim();
                const email = document.getElementById('swal-email').value.trim();
                const address = document.getElementById('swal-address').value.trim();

                // Validation
                if (!name) {
                    Swal.showValidationMessage('Full name is required');
                    return false;
                }

                if (!phone) {
                    Swal.showValidationMessage('Phone number is required');
                    return false;
                }

                // Simple phone validation
                if (phone.length < 10 || phone.length > 15) {
                    Swal.showValidationMessage('Please enter a valid phone number (10-15 digits)');
                    return false;
                }

                try {
                    const response = await axiosInstance.post('/suppliers', {
                        fullName: name,
                        phone: phone,
                        email: email || '',
                        address: address || ''
                    });

                    if (response.data.success) {
                        return true;
                    } else {
                        Swal.showValidationMessage(response.data.message || 'Failed to add supplier');
                        return false;
                    }
                } catch (error) {
                    Swal.showValidationMessage(error.response?.data?.message || 'Failed to add supplier');
                    return false;
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Success!',
                    text: 'Supplier added successfully',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    fetchSuppliers();
                    toast.success('Supplier added successfully!');
                });
            }
        });
    };

    // Handle Edit Supplier
    const handleEditSupplier = (supplier) => {
        Swal.fire({
            title: 'Edit Supplier',
            html: `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                        <input type="text" id="swal-edit-name" 
                               value="${supplier.name || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                               required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                        <input type="tel" id="swal-edit-phone" 
                               value="${supplier.phone || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                               required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                        <input type="email" id="swal-edit-email" 
                               value="${supplier.email || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
                        <textarea id="swal-edit-address" 
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                                  rows="3">${supplier.address || ''}</textarea>
                    </div>
                    
                    <div class="text-sm text-gray-500">
                        <p>Created: ${new Date(supplier.createdAt).toLocaleDateString()}</p>
                        ${supplier.updatedAt ? `<p>Last Updated: ${new Date(supplier.updatedAt).toLocaleDateString()}</p>` : ''}
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Update Supplier',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#6B7280',
            width: '500px',
            preConfirm: async () => {
                const name = document.getElementById('swal-edit-name').value.trim();
                const phone = document.getElementById('swal-edit-phone').value.trim();
                const email = document.getElementById('swal-edit-email').value.trim();
                const address = document.getElementById('swal-edit-address').value.trim();

                // Validation
                if (!name) {
                    Swal.showValidationMessage('Full name is required');
                    return false;
                }

                if (!phone) {
                    Swal.showValidationMessage('Phone number is required');
                    return false;
                }

                // Simple phone validation
                if (phone.length < 10 || phone.length > 15) {
                    Swal.showValidationMessage('Please enter a valid phone number (10-15 digits)');
                    return false;
                }

                try {
                    const response = await axiosInstance.put(`/suppliers/${supplier._id}`, {
                        fullName: name,
                        phone: phone,
                        email: email,
                        address: address
                    });

                    if (response.data.success) {
                        return true;
                    } else {
                        Swal.showValidationMessage(response.data.message || 'Failed to update supplier');
                        return false;
                    }
                } catch (error) {
                    Swal.showValidationMessage(error.response?.data?.message || 'Failed to update supplier');
                    return false;
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Updated!',
                    text: 'Supplier updated successfully',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    fetchSuppliers();
                    toast.success('Supplier updated successfully!');
                });
            }
        });
    };

    // Handle Delete Supplier
    const handleDeleteSupplier = (supplier) => {
        Swal.fire({
            title: 'Are you sure?',
            html: `
                <div class="space-y-4">
                    <p>You are about to delete the supplier:</p>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold text-gray-900">${supplier.name}</h3>
                        <p class="text-sm text-gray-500">${supplier.phone}</p>
                        ${supplier.email ? `<p class="text-sm text-gray-500">${supplier.email}</p>` : ''}
                    </div>
                    <p class="text-red-600 text-sm">This action cannot be undone.</p>
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
                    const response = await axiosInstance.delete(`/suppliers/${supplier._id}`);
                    
                    if (response.data.success) {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Supplier has been deleted successfully.',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        }).then(() => {
                            fetchSuppliers();
                            toast.success('Supplier deleted successfully!');
                        });
                    } else {
                        toast.error(response.data.message || 'Failed to delete supplier');
                    }
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to delete supplier');
                }
            }
        });
    };

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
        setCurrentPage(1);
    };

    // Get supplier avatar color
    const getAvatarColor = (name) => {
        const colors = [
            'bg-gradient-to-r from-blue-500 to-blue-600',
            'bg-gradient-to-r from-green-500 to-green-600',
            'bg-gradient-to-r from-purple-500 to-purple-600',
            'bg-gradient-to-r from-pink-500 to-pink-600',
            'bg-gradient-to-r from-yellow-500 to-yellow-600',
            'bg-gradient-to-r from-red-500 to-red-600',
            'bg-gradient-to-r from-indigo-500 to-indigo-600'
        ];
        const index = name?.charCodeAt(0) % colors.length || 0;
        return colors[index];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading suppliers...</p>
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
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Suppliers</h1>
                        <p className="text-gray-600 mt-2">Manage your supplier information</p>
                    </div>
                    <button
                        onClick={handleAddSupplier}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
                    >
                        <FiUserPlus className="mr-2" size={20} />
                        Add Supplier
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Suppliers</p>
                            <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FiTruck className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Today Added</p>
                            <p className="text-2xl font-bold text-green-600">
                                {suppliers.filter(s => {
                                    const today = new Date();
                                    const created = new Date(s.createdAt);
                                    return created.toDateString() === today.toDateString();
                                }).length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <FiUserPlus className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">With Email</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {suppliers.filter(s => s.email).length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FiMail className="text-purple-600" size={24} />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">With Address</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {suppliers.filter(s => s.address).length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <FiMapPin className="text-yellow-600" size={24} />
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
                                placeholder="Search suppliers by name, phone, email, or address..."
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

            {/* Mobile Suppliers Cards */}
            <div className="block lg:hidden">
                <div className="space-y-4">
                    {currentSuppliers.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                            <FiTruck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
                            <p className="text-gray-500 mb-4">Try adjusting your search or add a new supplier</p>
                            <button
                                onClick={handleAddSupplier}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center"
                            >
                                <FiUserPlus className="mr-2" />
                                Add Supplier
                            </button>
                        </div>
                    ) : (
                        currentSuppliers.map((supplier) => (
                            <div key={supplier._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start">
                                        <div className={`w-12 h-12 rounded-lg ${getAvatarColor(supplier.name)} flex items-center justify-center mr-3`}>
                                            <span className="text-white font-bold text-lg">
                                                {supplier.name?.charAt(0)?.toUpperCase() || 'S'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                                <FiPhone className="mr-1" size={14} />
                                                <span>{supplier.phone}</span>
                                            </div>
                                            {supplier.email && (
                                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                                    <FiMail className="mr-1" size={14} />
                                                    <span className="truncate max-w-[200px]">{supplier.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">
                                            {new Date(supplier.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                
                                {supplier.address && (
                                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-start">
                                            <FiMapPin className="mt-0.5 mr-2 text-gray-400 flex-shrink-0" size={14} />
                                            <p className="text-sm text-gray-600">{supplier.address}</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <div className="text-xs text-gray-500">
                                        <p>ID: {supplier._id?.slice(-6)}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEditSupplier(supplier)}
                                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <FiEdit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSupplier(supplier)}
                                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Desktop Suppliers Table */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Supplier
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact Info
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Address
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center">
                                        <div className="text-gray-500">
                                            <FiTruck className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-2 text-lg font-medium">No suppliers found</p>
                                            <p className="mt-1">Try adjusting your search or add a new supplier</p>
                                            <button
                                                onClick={handleAddSupplier}
                                                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center"
                                            >
                                                <FiUserPlus className="mr-2" />
                                                Add Supplier
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentSuppliers.map((supplier) => (
                                    <tr key={supplier._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`w-10 h-10 rounded-lg ${getAvatarColor(supplier.name)} flex items-center justify-center mr-3`}>
                                                    <span className="text-white font-bold">
                                                        {supplier.name?.charAt(0)?.toUpperCase() || 'S'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {supplier.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ID: {supplier._id?.slice(-6)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <FiPhone className="mr-2 text-gray-400" size={14} />
                                                    {supplier.phone}
                                                </div>
                                                {supplier.email && (
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <FiMail className="mr-2 text-gray-400" size={14} />
                                                        {supplier.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {supplier.address ? (
                                                <div className="flex items-start max-w-xs">
                                                    <FiMapPin className="mt-0.5 mr-2 text-gray-400 flex-shrink-0" size={14} />
                                                    <span className="text-sm text-gray-600 line-clamp-2">
                                                        {supplier.address}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">No address provided</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(supplier.createdAt).toLocaleDateString()}
                                            {supplier.updatedAt && (
                                                <div className="text-xs text-gray-400">
                                                    Updated: {new Date(supplier.updatedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditSupplier(supplier)}
                                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-md transition-colors flex items-center"
                                                >
                                                    <FiEdit2 className="mr-2" size={14} />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSupplier(supplier)}
                                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-md transition-colors flex items-center"
                                                >
                                                    <FiTrash2 className="mr-2" size={14} />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, sortedSuppliers.length)}</span> of{' '}
                    <span className="font-medium">{sortedSuppliers.length}</span> suppliers
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

export default Suppliers;