"use client"
import axiosInstance from "@/app/SharedComponents/AxiosInstance/AxiosInstance";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";

const AdminSettings = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [basicSettings, setBasicSettings] = useState({
        websiteName: "InventoryPro",
        favicon: "",
        logo: ""
    });

    // Fetch current admin user
    useEffect(() => {
        const fetchAdminUser = async () => {
            try {
                setIsLoading(true);
                const userId = localStorage.getItem("userId");
                
                if (!userId) {
                    toast.error("Please login first");
                    window.location.href = "/login";
                    return;
                }

                const response = await axiosInstance.get(`/users/${userId}`);
                
                if (response.data.success) {
                    setUser(response.data.data);
                    
                    // Check if user is admin
                    if (response.data.data.role !== "admin") {
                        toast.error("Access denied. Admin only.");
                        window.location.href = "/settings";
                        return;
                    }
                    
                    // Fetch all users
                    await fetchAllUsers();
                    
                    // Fetch basic settings
                    await fetchBasicSettings();
                    
                } else {
                    toast.error("Failed to load admin data");
                }
            } catch (error) {
                console.error("Error fetching admin:", error);
                toast.error("Failed to load admin information");
                window.location.href = "/login";
            } finally {
                setIsLoading(false);
            }
        };

        fetchAdminUser();
    }, []);

    // Fetch all users
    const fetchAllUsers = async () => {
        try {
            const response = await axiosInstance.get("/users");
            if (response.data.success) {
                setUsers(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        }
    };

    // Fetch basic settings from localStorage or API
    const fetchBasicSettings = async () => {
        try {
            const savedSettings = localStorage.getItem("basicSettings");
            if (savedSettings) {
                setBasicSettings(JSON.parse(savedSettings));
            }
            
            // You can also fetch from API if needed
            // const response = await axiosInstance.get("/settings");
        } catch (error) {
            console.error("Error loading settings:", error);
        }
    };

    // Handle Users Box Click
    const handleUsersBoxClick = () => {
        Swal.fire({
            title: '<strong>User Management</strong>',
            html: generateUsersTableHTML(),
            width: '90%',
            maxWidth: '1200px',
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                container: 'swal-container',
                popup: 'swal-popup',
                title: 'swal-title',
                htmlContainer: 'swal-html'
            },
            didOpen: () => {
                // Add event listeners to action buttons
                users.forEach((userItem, index) => {
                    // Edit button
                    const editBtn = document.getElementById(`edit-user-${index}`);
                    if (editBtn) {
                        editBtn.addEventListener('click', () => handleEditUser(userItem));
                    }
                    
                    // Delete button
                    const deleteBtn = document.getElementById(`delete-user-${index}`);
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', () => handleDeleteUser(userItem));
                    }
                });
            }
        });
    };

    // Generate users table HTML for Swal
    const generateUsersTableHTML = () => {
        return `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${users.map((userItem, index) => `
                            <tr key="${userItem._id}" class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-10 w-10">
                                            <div class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                ${userItem.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">${userItem.fullName || 'No Name'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-900">${userItem.email}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        userItem.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                        userItem.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'
                                    }">
                                        ${userItem.role?.charAt(0).toUpperCase() + userItem.role?.slice(1) || 'User'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        userItem.status === 'active' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                    }">
                                        ${userItem.status?.charAt(0).toUpperCase() + userItem.status?.slice(1) || 'Active'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ${userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : 'N/A'}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div class="flex space-x-2">
                                        <button id="edit-user-${index}" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-sm transition-colors">
                                            Edit
                                        </button>
                                        <button id="delete-user-${index}" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm transition-colors">
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };

    // Handle Edit User
    const handleEditUser = async (userItem) => {
        Swal.fire({
            title: 'Edit User',
            html: `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select id="swal-status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                            <option value="active" ${userItem.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${userItem.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="suspended" ${userItem.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select id="swal-role" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                            <option value="user" ${userItem.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="manager" ${userItem.role === 'manager' ? 'selected' : ''}>Manager</option>
                            <option value="admin" ${userItem.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="swal-email" value="${userItem.email}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" id="swal-fullName" value="${userItem.fullName || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save Changes',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            preConfirm: async () => {
                const status = document.getElementById('swal-status').value;
                const role = document.getElementById('swal-role').value;
                const email = document.getElementById('swal-email').value;
                const fullName = document.getElementById('swal-fullName').value;

                if (!email) {
                    Swal.showValidationMessage('Email is required');
                    return false;
                }

                try {
                    const updateData = {
                        status,
                        role,
                        email,
                        fullName
                    };

                    const response = await axiosInstance.patch(`/users/${userItem._id}`, updateData);
                    
                    if (response.data.success) {
                        await fetchAllUsers();
                        return true;
                    } else {
                        Swal.showValidationMessage(response.data.error || 'Failed to update user');
                        return false;
                    }
                } catch (error) {
                    Swal.showValidationMessage(error.response?.data?.error || 'Failed to update user');
                    return false;
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Show success animation
                Swal.fire({
                    title: 'User Updated!',
                    html: `<div style="height: 150px;"><div id="lottie-container"></div></div>`,
                    showConfirmButton: false,
                    timer: 2000,
                    didOpen: () => {
                        // Create Lottie animation container
                        const container = document.getElementById('lottie-container');
                        if (container) {
                            container.innerHTML = `
                                <div id="lottie-animation" style="width: 150px; height: 150px; margin: 0 auto;"></div>
                            `;
                            
                            // Note: You'll need to initialize Lottie here if needed
                            // For now, we'll show a success message
                        }
                    }
                }).then(() => {
                    toast.success('User updated successfully!');
                });
            }
        });
    };

    // Handle Delete User
    const handleDeleteUser = (userItem) => {
        Swal.fire({
            title: 'Are you sure?',
            text: `Delete user ${userItem.email}? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await axiosInstance.delete(`/users/${userItem._id}`);
                    
                    if (response.data.success) {
                        // Show delete animation
                        Swal.fire({
                            title: 'Deleted!',
                            html: `
                                <div style="height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                    <div id="delete-animation" style="width: 150px; height: 150px;"></div>
                                    <p class="mt-4 text-gray-600">User has been deleted.</p>
                                </div>
                            `,
                            showConfirmButton: false,
                            timer: 2000
                        }).then(() => {
                            // Refresh users list
                            fetchAllUsers();
                            toast.success('User deleted successfully!');
                        });
                    } else {
                        toast.error(response.data.error || 'Failed to delete user');
                    }
                } catch (error) {
                    console.error("Delete error:", error);
                    toast.error(error.response?.data?.error || 'Failed to delete user');
                }
            }
        });
    };

    // Handle Basic Settings Box Click
    const handleBasicSettingsClick = () => {
        Swal.fire({
            title: 'Basic Settings',
            html: `
                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Website Name</label>
                        <input type="text" id="swal-websiteName" value="${basicSettings.websiteName}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Favicon URL</label>
                        <input type="text" id="swal-favicon" value="${basicSettings.favicon}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                               placeholder="https://example.com/favicon.ico">
                        <p class="text-xs text-gray-500 mt-1">Enter the full URL of your favicon</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                        <input type="text" id="swal-logo" value="${basicSettings.logo}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                               placeholder="https://example.com/logo.png">
                        <p class="text-xs text-gray-500 mt-1">Enter the full URL of your logo</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <p class="text-sm font-medium text-gray-700 mb-1">Current Favicon</p>
                            ${basicSettings.favicon ? 
                                `<img src="${basicSettings.favicon}" alt="Favicon" class="h-8 w-8 mx-auto rounded" onerror="this.style.display='none'">` : 
                                '<div class="h-8 w-8 mx-auto bg-gray-200 rounded flex items-center justify-center text-gray-500">None</div>'}
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <p class="text-sm font-medium text-gray-700 mb-1">Current Logo</p>
                            ${basicSettings.logo ? 
                                `<img src="${basicSettings.logo}" alt="Logo" class="h-8 w-auto mx-auto rounded" onerror="this.style.display='none'">` : 
                                '<div class="h-8 w-8 mx-auto bg-gray-200 rounded flex items-center justify-center text-gray-500">None</div>'}
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save Settings',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            width: '500px',
            preConfirm: () => {
                const websiteName = document.getElementById('swal-websiteName').value;
                const favicon = document.getElementById('swal-favicon').value;
                const logo = document.getElementById('swal-logo').value;

                if (!websiteName.trim()) {
                    Swal.showValidationMessage('Website name is required');
                    return false;
                }

                return { websiteName, favicon, logo };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const newSettings = result.value;
                setBasicSettings(newSettings);
                
                // Save to localStorage
                localStorage.setItem("basicSettings", JSON.stringify(newSettings));
                
                // Show success message
                Swal.fire({
                    title: 'Settings Saved!',
                    text: 'Basic settings have been updated successfully.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    toast.success('Settings updated successfully!');
                });
            }
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading admin settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
                            <p className="text-gray-600 mt-2">Manage users and system settings</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                                <p className="text-xs text-gray-500">Admin</p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-6.393a9 9 0 01-13.5 6.393" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                                <p className="text-sm text-gray-600">Total Users</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-2xl font-bold text-gray-900">
                                    {users.filter(u => u.status === 'active').length}
                                </p>
                                <p className="text-sm text-gray-600">Active Users</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-2xl font-bold text-gray-900">
                                    {users.filter(u => u.role === 'admin').length}
                                </p>
                                <p className="text-sm text-gray-600">Admins</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-2xl font-bold text-gray-900">
                                    {users.filter(u => u.status !== 'active').length}
                                </p>
                                <p className="text-sm text-gray-600">Inactive Users</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Settings Boxes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Users Management Box */}
                    <div 
                        onClick={handleUsersBoxClick}
                        className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Users Management</h2>
                                <p className="text-blue-100 mt-1">Manage all system users</p>
                            </div>
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-6.393a9 9 0 01-13.5 6.393" />
                                </svg>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-white">
                                <span className="text-lg font-medium">Total Users</span>
                                <span className="text-2xl font-bold">{users.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-white">
                                <span className="text-lg font-medium">Active Users</span>
                                <span className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</span>
                            </div>
                            <div className="flex items-center justify-between text-white">
                                <span className="text-lg font-medium">Admins</span>
                                <span className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</span>
                            </div>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-white border-opacity-20">
                            <div className="flex items-center text-white text-sm">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Click to manage users, edit roles, and more
                            </div>
                        </div>
                    </div>

                    {/* Basic Settings Box */}
                    <div 
                        onClick={handleBasicSettingsClick}
                        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Basic Settings</h2>
                                <p className="text-green-100 mt-1">Configure website settings</p>
                            </div>
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-white">
                                <span className="text-lg font-medium">Website Name</span>
                                <span className="text-xl font-bold truncate max-w-[150px]">{basicSettings.websiteName}</span>
                            </div>
                            <div className="flex items-center justify-between text-white">
                                <span className="text-lg font-medium">Favicon</span>
                                <span className="text-xl font-bold">
                                    {basicSettings.favicon ? 'Set' : 'Not Set'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-white">
                                <span className="text-lg font-medium">Logo</span>
                                <span className="text-xl font-bold">
                                    {basicSettings.logo ? 'Set' : 'Not Set'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-white border-opacity-20">
                            <div className="flex items-center text-white text-sm">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Click to configure website name, favicon, and logo
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent User Activity</h3>
                    <div className="space-y-3">
                        {users.slice(0, 5).map((userItem, index) => (
                            <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                        {userItem.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900">{userItem.fullName || 'No Name'}</p>
                                        <p className="text-xs text-gray-500">{userItem.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        userItem.status === 'active' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {userItem.status || 'Active'}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        userItem.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                        userItem.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {userItem.role || 'User'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Custom Styles for SweetAlert */}
            <style jsx global>{`
                .swal-container {
                    z-index: 99999 !important;
                }
                .swal-popup {
                    border-radius: 1rem !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                }
                .swal-title {
                    font-size: 1.5rem !important;
                    font-weight: bold !important;
                    margin: 2rem 1.5rem 1rem !important;
                }
                .swal-html {
                    margin: 0 1.5rem 2rem !important;
                    max-height: 60vh !important;
                    overflow-y: auto !important;
                }
                .swal-html::-webkit-scrollbar {
                    width: 8px;
                }
                .swal-html::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }
                .swal-html::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 4px;
                }
                .swal-html::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
            `}</style>
        </div>
    );
};

export default AdminSettings;