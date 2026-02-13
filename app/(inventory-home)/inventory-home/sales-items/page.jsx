"use client"
import axiosInstance from '@/app/SharedComponents/AxiosInstance/AxiosInstance';
import { AnimatePresence, motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import {
    FiCalendar,
    FiChevronLeft,
    FiChevronRight,
    FiChevronsLeft,
    FiChevronsRight,
    FiCreditCard,
    FiDollarSign,
    FiDownload,
    FiEdit2,
    FiEye,
    FiFilter,
    FiPackage,
    FiPercent,
    FiRefreshCw,
    FiSearch,
    FiShoppingCart,
    FiTag,
    FiTrash2,
    FiTrendingUp
} from 'react-icons/fi';
import Swal from 'sweetalert2';

const SalesItems = () => {
    const [products, setProducts] = useState([]);
    const [salesItems, setSalesItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [users, setUsers] = useState([]);
    const [basicSettings, setBasicSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [activeTab, setActiveTab] = useState('products'); // 'products' or 'sales'

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [productsRes, salesRes, customersRes, usersRes, settingsRes] = await Promise.all([
                axiosInstance.get("/products"),
                axiosInstance.get("/sales-invoices"),
                axiosInstance.get("/customers"),
                axiosInstance.get("/users"),
                axiosInstance.get("/basic-settings")
            ]);

            if (productsRes.data.success) {
                setProducts(productsRes.data.data || []);
            }
            if (salesRes.data.success) {
                setSalesItems(salesRes.data.data || []);
            }
            if (customersRes.data.success) {
                setCustomers(customersRes.data.data || []);
            }
            if (usersRes.data.success) {
                setUsers(usersRes.data.data || []);
            }
            if (settingsRes.data.success) {
                setBasicSettings(settingsRes.data.data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    // Handle selling a product with enhanced form
    const handleSellProduct = useCallback((product) => {
        Swal.fire({
            title: 'Sell Product',
            html: `
                <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <!-- Product Details -->
                    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                        <h4 class="font-semibold text-blue-900 mb-3 flex items-center">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Product Details
                        </h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-white p-3 rounded-lg shadow-sm">
                                <p class="text-xs text-gray-500 mb-1">Product ID</p>
                                <p class="font-mono text-sm font-semibold text-gray-800">${product._id?.slice(-8)}</p>
                            </div>
                            <div class="bg-white p-3 rounded-lg shadow-sm">
                                <p class="text-xs text-gray-500 mb-1">Product Name</p>
                                <p class="font-semibold text-gray-800">${product.name}</p>
                            </div>
                            <div class="bg-white p-3 rounded-lg shadow-sm">
                                <p class="text-xs text-gray-500 mb-1">Category</p>
                                <p class="font-semibold text-gray-800">${product.category || 'N/A'}</p>
                            </div>
                            <div class="bg-white p-3 rounded-lg shadow-sm">
                                <p class="text-xs text-gray-500 mb-1">Unit Price</p>
                                <p class="font-bold text-green-600">$${product.price?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div class="bg-white p-3 rounded-lg shadow-sm">
                                <p class="text-xs text-gray-500 mb-1">Available Stock</p>
                                <p class="font-semibold ${product.quantity > 0 ? 'text-green-600' : 'text-red-600'}">
                                    ${product.quantity || 0} units
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Customer Selection -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <FiUserCheck class="mr-2" />
                            Select Customer *
                        </label>
                        <select id="swal-customer" 
                                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                onchange="handleCustomerSelect(this)">
                            <option value="">Select a customer</option>
                            ${customers.map(customer => `
                                <option value="${customer._id}" 
                                        data-name="${customer.name || ''}"
                                        data-phone="${customer.phone || ''}"
                                        data-address="${customer.address || ''}">
                                    ${customer.name} - ${customer.phone}
                                </option>
                            `).join('')}
                            <option value="new">➕ Add New Customer</option>
                        </select>
                    </div>

                    <!-- Customer Details (Auto-filled) -->
                    <div id="customer-details-section" class="hidden space-y-3">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label class="block text-xs font-medium text-gray-600 mb-1">Customer Name</label>
                                <input type="text" id="swal-customer-name" 
                                       class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                       readonly>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
                                <input type="text" id="swal-customer-phone" 
                                       class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                       readonly>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-600 mb-1">Address</label>
                                <input type="text" id="swal-customer-address" 
                                       class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                       readonly>
                            </div>
                        </div>
                    </div>

                    <!-- Quantity Input -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Quantity *
                        </label>
                        <div class="flex items-center space-x-4">
                            <div class="flex-1">
                                <input type="number" id="swal-quantity" 
                                       value="1"
                                       min="1"
                                       max="${product.quantity || 1}"
                                       class="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                       oninput="updateCalculations()">
                            </div>
                            <div class="text-sm text-gray-500">
                                Max: ${product.quantity || 0} units available
                            </div>
                        </div>
                    </div>

                    <!-- Price & Tax Section -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Discount -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Discount ($)
                            </label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiPercent class="text-gray-400" />
                                </div>
                                <input type="number" id="swal-discount" 
                                       value="0"
                                       min="0"
                                       step="0.01"
                                       class="pl-10 w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                       oninput="updateCalculations()">
                            </div>
                        </div>

                        <!-- VAT/Tax -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                VAT/Tax (%)
                            </label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiPercent class="text-gray-400" />
                                </div>
                                <input type="number" id="swal-vat" 
                                       value="0"
                                       min="0"
                                       max="100"
                                       step="0.01"
                                       class="pl-10 w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                       oninput="updateCalculations()">
                            </div>
                        </div>
                    </div>

                    <!-- Payment Section -->
                    <div class="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                        <h5 class="font-semibold text-gray-800 mb-3">Payment Details</h5>
                        
                        <!-- Paid Amount -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Paid Amount ($) *
                            </label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiDollarSign class="text-gray-400" />
                                </div>
                                <input type="number" id="swal-paid-amount" 
                                       value="0"
                                       min="0"
                                       step="0.01"
                                       class="pl-10 w-full px-3 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                       oninput="updateCalculations()">
                            </div>
                        </div>

                        <!-- Sales Manager -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Sales Manager *
                            </label>
                            <select id="swal-sales-manager" 
                                    class="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                <option value="">Select Sales Manager</option>
                                ${users.map(user => `
                                    <option value="${user.fullName || user.name || 'Unknown'}">
                                        ${user.fullName || user.name} - ${user.role || 'Staff'}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- Calculation Preview -->
                    <div class="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
                        <h5 class="font-semibold text-emerald-800 mb-3">Order Summary</h5>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-sm text-gray-600">Subtotal:</span>
                                <span id="preview-subtotal" class="font-medium">$${(product.price || 0).toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm text-gray-600">Discount:</span>
                                <span id="preview-discount" class="font-medium text-red-600">$0.00</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm text-gray-600">VAT/Tax:</span>
                                <span id="preview-vat" class="font-medium text-blue-600">$0.00</span>
                            </div>
                            <div class="flex justify-between pt-2 border-t border-emerald-200">
                                <span class="text-sm font-semibold text-gray-800">Grand Total:</span>
                                <span id="preview-grand-total" class="text-lg font-bold text-green-600">$${(product.price || 0).toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm text-gray-600">Paid Amount:</span>
                                <span id="preview-paid" class="font-medium">$0.00</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm text-gray-600">Due Amount:</span>
                                <span id="preview-due" class="font-bold text-orange-600">$${(product.price || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            width: window.innerWidth < 768 ? '95%' : '800px',
            backdrop: 'rgba(0,0,0,0.5)',
            showCancelButton: true,
            confirmButtonText: 'Confirm Sale & Generate Invoice',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#6B7280',
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                const customerId = document.getElementById('swal-customer')?.value;
                const customerName = document.getElementById('swal-customer-name')?.value;
                const customerPhone = document.getElementById('swal-customer-phone')?.value;
                const customerAddress = document.getElementById('swal-customer-address')?.value;
                const quantity = document.getElementById('swal-quantity')?.value;
                const discount = document.getElementById('swal-discount')?.value;
                const vat = document.getElementById('swal-vat')?.value;
                const paidAmount = document.getElementById('swal-paid-amount')?.value;
                const salesManager = document.getElementById('swal-sales-manager')?.value;

                // Validations
                if (!customerId || customerId === '') {
                    Swal.showValidationMessage('Please select a customer');
                    return false;
                }

                if (customerId === 'new') {
                    Swal.showValidationMessage('Please select an existing customer or add new one first');
                    return false;
                }

                if (!quantity || quantity < 1) {
                    Swal.showValidationMessage('Please enter valid quantity');
                    return false;
                }

                if (parseInt(quantity) > product.quantity) {
                    Swal.showValidationMessage('Quantity exceeds available stock');
                    return false;
                }

                if (!paidAmount || parseFloat(paidAmount) < 0) {
                    Swal.showValidationMessage('Please enter valid paid amount');
                    return false;
                }

                if (!salesManager) {
                    Swal.showValidationMessage('Please select a sales manager');
                    return false;
                }

                try {
                    const response = await axiosInstance.post('/sales-invoices', {
                        productID: product._id,
                        productName: product.name,
                        productCostPrice: product.costPrice,
                        productPrice: product.price,
                        productQty: quantity,
                        productCategory: product.category,
                        discount: parseFloat(discount) || 0,
                        vat: parseFloat(vat) || 0,
                        paidAmount: parseFloat(paidAmount) || 0,
                        salesManager,
                        customerName,
                        customerPhone,
                        customerAddress
                    });

                    if (response.data.success) {
                        return response.data.data;
                    } else {
                        Swal.showValidationMessage(response.data.message || 'Failed to process sale');
                        return false;
                    }
                } catch (error) {
                    Swal.showValidationMessage(error.response?.data?.message || 'Failed to process sale');
                    return false;
                }
            },
            didOpen: () => {
                // Add custom JavaScript functions to the modal
                window.handleCustomerSelect = function(select) {
                    const customerDetails = document.getElementById('customer-details-section');
                    const nameInput = document.getElementById('swal-customer-name');
                    const phoneInput = document.getElementById('swal-customer-phone');
                    const addressInput = document.getElementById('swal-customer-address');

                    if (select.value === 'new') {
                        customerDetails.classList.remove('hidden');
                        nameInput.readOnly = false;
                        phoneInput.readOnly = false;
                        addressInput.readOnly = false;
                        nameInput.value = '';
                        phoneInput.value = '';
                        addressInput.value = '';
                    } else if (select.value) {
                        const selectedOption = select.options[select.selectedIndex];
                        customerDetails.classList.remove('hidden');
                        nameInput.value = selectedOption.dataset.name || '';
                        phoneInput.value = selectedOption.dataset.phone || '';
                        addressInput.value = selectedOption.dataset.address || '';
                        nameInput.readOnly = true;
                        phoneInput.readOnly = true;
                        addressInput.readOnly = true;
                    } else {
                        customerDetails.classList.add('hidden');
                    }
                };

                window.updateCalculations = function() {
                    const quantity = parseFloat(document.getElementById('swal-quantity')?.value) || 1;
                    const unitPrice = product.price || 0;
                    const discount = parseFloat(document.getElementById('swal-discount')?.value) || 0;
                    const vatPercent = parseFloat(document.getElementById('swal-vat')?.value) || 0;
                    const paidAmount = parseFloat(document.getElementById('swal-paid-amount')?.value) || 0;

                    const subtotal = quantity * unitPrice;
                    const vatAmount = (subtotal - discount) * (vatPercent / 100);
                    const grandTotal = subtotal - discount + vatAmount;
                    const due = grandTotal - paidAmount;

                    document.getElementById('preview-subtotal').textContent = `$${subtotal.toFixed(2)}`;
                    document.getElementById('preview-discount').textContent = `$${discount.toFixed(2)}`;
                    document.getElementById('preview-vat').textContent = `$${vatAmount.toFixed(2)}`;
                    document.getElementById('preview-grand-total').textContent = `$${grandTotal.toFixed(2)}`;
                    document.getElementById('preview-paid').textContent = `$${paidAmount.toFixed(2)}`;
                    document.getElementById('preview-due').textContent = `$${due.toFixed(2)}`;
                };

                // Initialize calculations
                window.updateCalculations();
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const invoiceData = result.value;
                
                // Show success message
                await Swal.fire({
                    title: 'Success!',
                    html: `
                        <div class="text-center">
                            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Sale Completed!</h3>
                            <p class="text-gray-600 mb-4">Invoice #${invoiceData.invoiceNumber} has been generated.</p>
                            <div class="bg-gray-50 p-3 rounded-lg mb-4">
                                <p class="text-sm text-gray-600">Total Amount: <span class="font-bold text-green-600">$${invoiceData.grandTotal?.toFixed(2)}</span></p>
                                <p class="text-sm text-gray-600">Due Amount: <span class="font-bold ${invoiceData.due > 0 ? 'text-orange-600' : 'text-green-600'}">$${invoiceData.due?.toFixed(2)}</span></p>
                            </div>
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'Download Invoice',
                    cancelButtonText: 'Close',
                    confirmButtonColor: '#3B82F6',
                    cancelButtonColor: '#6B7280'
                }).then(async (downloadResult) => {
                    if (downloadResult.isConfirmed) {
                        await generateInvoice(invoiceData.invoiceId);
                    }
                });

                await fetchAllData();
                toast.success('Sale recorded successfully!');
            }
        });
    }, [products, customers, users]);

// Generate PDF Invoice
const generateInvoice = useCallback(async (invoiceId) => {
    try {
        const response = await axiosInstance.get(`/sales-invoices/${invoiceId}`);
        if (!response.data.success) throw new Error('Invoice not found');

        const invoice = response.data.data;
        const doc = new jsPDF();

        // Company Header
        doc.setFontSize(24);
        doc.setTextColor(37, 99, 235); // Blue color
        doc.text(basicSettings?.websiteName || 'Inventory System', 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Gray color
        doc.text(basicSettings?.address || 'Address not specified', 105, 28, { align: 'center' });
        doc.text(`Phone: ${basicSettings?.phone || 'N/A'} | Email: ${basicSettings?.email || 'N/A'}`, 105, 32, { align: 'center' });

        // Invoice Title
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0); // Black color
        doc.text('SALES INVOICE', 105, 45, { align: 'center' });

        // Invoice Details
        doc.setFontSize(10);
        doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 60);
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, 65);
        doc.text(`Sales Manager: ${invoice.salesManager}`, 20, 70);

        // Customer Details
        doc.setFontSize(11);
        doc.setTextColor(37, 99, 235); // Blue color
        doc.text('Customer Information', 20, 85);
        doc.setDrawColor(37, 99, 235); // Blue color
        doc.line(20, 87, 60, 87);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0); // Black color
        doc.text(`Name: ${invoice.customerName}`, 120, 60);
        doc.text(`Phone: ${invoice.customerPhone}`, 120, 65);
        doc.text(`Address: ${invoice.customerAddress || 'N/A'}`, 120, 70);

        // Product Table
        autoTable(doc, {
            startY: 95,
            head: [['Product', 'Qty', 'Unit Price', 'Discount', 'VAT', 'Total']],
            body: [[
                invoice.productName,
                invoice.productQty,
                `$${invoice.productPrice?.toFixed(2) || '0.00'}`,
                `$${invoice.discount?.toFixed(2) || '0.00'}`,
                `$${invoice.vatAmount?.toFixed(2) || '0.00'}`,
                `$${invoice.grandTotal?.toFixed(2) || '0.00'}`
            ]],
            theme: 'grid',
            headStyles: { 
                fillColor: [37, 99, 235], // Blue color as array for fillColor
                textColor: 255,
                fontSize: 10
            },
            styles: { 
                fontSize: 10, 
                cellPadding: 5,
                textColor: [0, 0, 0] // Black color as array
            }
        });

        const finalY = doc.lastAutoTable?.finalY || 110;

        // Totals
        doc.setFontSize(11);
        doc.text('Payment Summary', 20, finalY + 10);
        doc.line(20, finalY + 12, 60, finalY + 12);

        const totalsY = finalY + 25;
        doc.setFontSize(10);
        doc.text('Subtotal:', 120, totalsY);
        doc.text(`$${invoice.subtotal?.toFixed(2) || (invoice.productPrice * invoice.productQty).toFixed(2)}`, 180, totalsY, { align: 'right' });

        doc.text('Discount:', 120, totalsY + 5);
        doc.text(`-$${invoice.discount?.toFixed(2) || '0.00'}`, 180, totalsY + 5, { align: 'right' });

        doc.text('VAT/Tax:', 120, totalsY + 10);
        doc.text(`$${invoice.vatAmount?.toFixed(2) || '0.00'}`, 180, totalsY + 10, { align: 'right' });

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Grand Total:', 120, totalsY + 20);
        doc.text(`$${invoice.grandTotal?.toFixed(2) || '0.00'}`, 180, totalsY + 20, { align: 'right' });

        doc.text('Paid Amount:', 120, totalsY + 25);
        doc.text(`$${invoice.paidAmount?.toFixed(2) || '0.00'}`, 180, totalsY + 25, { align: 'right' });

        // Fix: setTextColor expects separate RGB values, not an array
        if (invoice.due > 0) {
            doc.setTextColor(239, 68, 68); // Red for due amount
        } else {
            doc.setTextColor(34, 197, 94); // Green for no due
        }
        
        doc.text('Due Amount:', 120, totalsY + 30);
        doc.text(`$${invoice.due?.toFixed(2) || '0.00'}`, 180, totalsY + 30, { align: 'right' });

        // Reset text color to black for remaining content
        doc.setTextColor(0, 0, 0);

        // Footer and Signatures
        const signatureY = totalsY + 50;
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Gray color
        doc.text('Customer Signature', 50, signatureY, { align: 'center' });
        doc.line(30, signatureY + 5, 70, signatureY + 5);

        doc.text('Authorized Signature', 150, signatureY, { align: 'center' });
        doc.line(130, signatureY + 5, 170, signatureY + 5);

        // Terms
        doc.text('Thank you for your business!', 105, signatureY + 20, { align: 'center' });
        doc.setFontSize(8);
        doc.text('All sales are final. Goods once sold cannot be returned.', 105, signatureY + 25, { align: 'center' });

        // Save PDF
        doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
        
        toast.success('Invoice downloaded successfully!');
    } catch (error) {
        console.error('Error generating invoice:', error);
        toast.error('Failed to generate invoice');
    }
}, [basicSettings]);

    // Handle view sale details
    const handleViewSale = useCallback((sale) => {
        Swal.fire({
            title: 'Invoice Details',
            html: `
                <div class="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    <!-- Invoice Header -->
                    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 class="font-bold text-xl text-blue-900">${sale.invoiceNumber}</h3>
                                <p class="text-sm text-blue-700">Sales Invoice</p>
                            </div>
                            <div class="bg-white px-4 py-2 rounded-lg shadow-sm">
                                <p class="text-sm text-gray-600">Date:</p>
                                <p class="font-semibold">${new Date(sale.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Customer & Sales Info -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-white p-4 rounded-xl border border-gray-200">
                            <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                                <FiUser class="mr-2" />
                                Customer Information
                            </h4>
                            <div class="space-y-2">
                                <div class="flex items-center">
                                    <span class="text-sm text-gray-500 w-24">Name:</span>
                                    <span class="font-medium">${sale.customerName || 'N/A'}</span>
                                </div>
                                <div class="flex items-center">
                                    <span class="text-sm text-gray-500 w-24">Phone:</span>
                                    <span class="font-medium">${sale.customerPhone || 'N/A'}</span>
                                </div>
                                <div class="flex items-center">
                                    <span class="text-sm text-gray-500 w-24">Address:</span>
                                    <span class="font-medium">${sale.customerAddress || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white p-4 rounded-xl border border-gray-200">
                            <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                                <FiUserCheck class="mr-2" />
                                Sales Information
                            </h4>
                            <div class="space-y-2">
                                <div class="flex items-center">
                                    <span class="text-sm text-gray-500 w-24">Sales Manager:</span>
                                    <span class="font-medium">${sale.salesManager || 'N/A'}</span>
                                </div>
                                <div class="flex items-center">
                                    <span class="text-sm text-gray-500 w-24">Product:</span>
                                    <span class="font-medium">${sale.productName}</span>
                                </div>
                                <div class="flex items-center">
                                    <span class="text-sm text-gray-500 w-24">Quantity:</span>
                                    <span class="font-medium">${sale.productQty} units</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Invoice Details -->
                    <div class="bg-white p-4 rounded-xl border border-gray-200">
                        <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                            <FiDollarSign class="mr-2" />
                            Invoice Summary
                        </h4>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Subtotal:</span>
                                <span class="font-medium">$${sale.subtotal?.toFixed(2) || (sale.productPrice * sale.productQty).toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Discount:</span>
                                <span class="font-medium text-red-600">-$${sale.discount?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">VAT/Tax (${sale.vatPercent || 0}%):</span>
                                <span class="font-medium">$${sale.vatAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div class="flex justify-between pt-3 border-t border-gray-200">
                                <span class="font-semibold text-gray-800">Grand Total:</span>
                                <span class="text-lg font-bold text-green-600">$${sale.grandTotal?.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Paid Amount:</span>
                                <span class="font-medium">$${sale.paidAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Due Amount:</span>
                                <span class="font-bold ${sale.due > 0 ? 'text-orange-600' : 'text-green-600'}">$${sale.due?.toFixed(2) || '0.00'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Product Details -->
                    <div class="bg-white p-4 rounded-xl border border-gray-200">
                        <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                            <FiPackage class="mr-2" />
                            Product Details
                        </h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm text-gray-500">Product Name</p>
                                <p class="font-medium">${sale.productName}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Unit Price</p>
                                <p class="font-medium">$${sale.productPrice?.toFixed(2)}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Quantity</p>
                                <p class="font-medium">${sale.productQty} units</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Total</p>
                                <p class="font-medium">$${(sale.productPrice * sale.productQty).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            width: window.innerWidth < 768 ? '95%' : '800px',
            backdrop: 'rgba(0,0,0,0.5)',
            showCancelButton: true,
            confirmButtonText: 'Download Invoice',
            cancelButtonText: 'Close',
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#6B7280'
        }).then((result) => {
            if (result.isConfirmed) {
                generateInvoice(sale._id);
            }
        });
    }, [generateInvoice]);

    // Handle edit sale
    const handleEditSale = useCallback((sale) => {
        Swal.fire({
            title: 'Edit Invoice',
            html: `
                <div class="space-y-4">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <h4 class="font-semibold text-blue-900 mb-2">Invoice #${sale.invoiceNumber}</h4>
                        <p class="text-sm text-blue-700">Product: ${sale.productName}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Paid Amount ($)
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiDollarSign class="text-gray-400" />
                            </div>
                            <input type="number" id="swal-edit-paid-amount" 
                                   value="${sale.paidAmount || 0}"
                                   min="0"
                                   max="${sale.grandTotal}"
                                   step="0.01"
                                   class="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                        </div>
                        <p class="text-xs text-gray-500 mt-1">Grand Total: $${sale.grandTotal?.toFixed(2)} | Due: $${sale.due?.toFixed(2)}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Sales Manager
                        </label>
                        <select id="swal-edit-sales-manager" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                            <option value="">Select Sales Manager</option>
                            ${users.map(user => `
                                <option value="${user.fullName || user.name}" ${sale.salesManager === (user.fullName || user.name) ? 'selected' : ''}>
                                    ${user.fullName || user.name} - ${user.role || 'Staff'}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
            `,
            width: window.innerWidth < 640 ? '90%' : '500px',
            backdrop: 'rgba(0,0,0,0.4)',
            showCancelButton: true,
            confirmButtonText: 'Update Invoice',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#6B7280',
            preConfirm: async () => {
                const paidAmount = document.getElementById('swal-edit-paid-amount')?.value;
                const salesManager = document.getElementById('swal-edit-sales-manager')?.value;

                if (!salesManager) {
                    Swal.showValidationMessage('Please select a sales manager');
                    return false;
                }

                if (parseFloat(paidAmount) < 0 || parseFloat(paidAmount) > sale.grandTotal) {
                    Swal.showValidationMessage('Invalid paid amount');
                    return false;
                }

                try {
                    const response = await axiosInstance.put(`/sales-invoices/${sale._id}`, {
                        paidAmount: parseFloat(paidAmount) || 0
                    });

                    if (response.data.success) {
                        return true;
                    } else {
                        Swal.showValidationMessage(response.data.message || 'Failed to update invoice');
                        return false;
                    }
                } catch (error) {
                    Swal.showValidationMessage(error.response?.data?.message || 'Failed to update invoice');
                    return false;
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Updated!',
                    text: 'Invoice updated successfully',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                await fetchAllData();
                toast.success('Invoice updated successfully!');
            }
        });
    }, [users]);

    // Handle delete sale
    const handleDeleteSale = useCallback((sale) => {
        Swal.fire({
            title: 'Delete Invoice?',
            html: `
                <div class="space-y-4">
                    <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.728 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-red-700">This will restore stock and cannot be undone.</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-gray-900">Invoice #${sale.invoiceNumber}</h3>
                        <div class="grid grid-cols-2 gap-3 mt-3 text-sm">
                            <div>
                                <span class="text-gray-600">Customer:</span>
                                <span class="font-medium ml-2">${sale.customerName}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Amount:</span>
                                <span class="font-medium ml-2">$${sale.grandTotal?.toFixed(2)}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Product:</span>
                                <span class="font-medium ml-2">${sale.productName}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Quantity:</span>
                                <span class="font-medium ml-2">${sale.productQty} units</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete & Restore Stock',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            reverseButtons: true,
            width: window.innerWidth < 640 ? '90%' : '500px',
            backdrop: 'rgba(0,0,0,0.4)'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await axiosInstance.delete(`/sales-invoices/${sale._id}`);
                    
                    if (response.data.success) {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Invoice deleted & stock restored',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        });
                        await fetchAllData();
                        toast.success('Invoice deleted successfully!');
                    }
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to delete invoice');
                }
            }
        });
    }, []);

    // Stats calculation
    const stats = useMemo(() => {
        const totalRevenue = salesItems.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
        const totalPaid = salesItems.reduce((sum, sale) => sum + (sale.paidAmount || 0), 0);
        const totalDue = salesItems.reduce((sum, sale) => sum + (sale.due || 0), 0);
        const totalDiscount = salesItems.reduce((sum, sale) => sum + (sale.discount || 0), 0);
        const today = new Date().toDateString();
        const todaySales = salesItems.filter(sale => 
            new Date(sale.createdAt).toDateString() === today
        ).reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
        
        return {
            totalProducts: products.length,
            totalInvoices: salesItems.length,
            totalRevenue,
            totalPaid,
            totalDue,
            totalDiscount,
            todaySales,
            avgSale: salesItems.length > 0 ? totalRevenue / salesItems.length : 0
        };
    }, [products, salesItems]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
                product.name?.toLowerCase().includes(searchLower) ||
                product.category?.toLowerCase().includes(searchLower) ||
                product._id?.toLowerCase().includes(searchLower)
            );
        }).sort((a, b) => {
            if (sortOrder === 'asc') {
                return (a.name || '').localeCompare(b.name || '');
            } else {
                return (b.name || '').localeCompare(a.name || '');
            }
        });
    }, [products, searchTerm, sortOrder]);

    // Filter and sort sales
    const filteredSales = useMemo(() => {
        return salesItems.filter(sale => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
                sale.invoiceNumber?.toLowerCase().includes(searchLower) ||
                sale.productName?.toLowerCase().includes(searchLower) ||
                sale.customerName?.toLowerCase().includes(searchLower) ||
                sale.customerPhone?.includes(searchTerm)
            );
        }).sort((a, b) => {
            if (sortOrder === 'desc') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } else {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
        });
    }, [salesItems, searchTerm, sortOrder]);

    // Pagination
    const currentItems = activeTab === 'products' ? filteredProducts : filteredSales;
    const totalPages = Math.max(1, Math.ceil(currentItems.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, currentItems.length);
    const currentItemsPage = currentItems.slice(startIndex, endIndex);

    const handlePageChange = useCallback((page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }, [totalPages]);

    const resetFilters = useCallback(() => {
        setSearchTerm('');
        setSortOrder('desc');
        setCurrentPage(1);
        setShowMobileFilters(false);
    }, []);

    const getAvatarColor = useCallback((name) => {
        const colors = [
            'bg-gradient-to-br from-blue-500 to-blue-600',
            'bg-gradient-to-br from-emerald-500 to-emerald-600',
            'bg-gradient-to-br from-violet-500 to-violet-600',
            'bg-gradient-to-br from-rose-500 to-rose-600',
            'bg-gradient-to-br from-amber-500 to-amber-600'
        ];
        const index = (name?.charCodeAt(0) || 0) % colors.length;
        return colors[index];
    }, []);

    const LoadingSkeleton = () => (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                                <div className="h-3 bg-gray-100 rounded w-24"></div>
                            </div>
                        </div>
                        <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
                <div className="max-w-8xl mx-auto">
                    <LoadingSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-black bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-8xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Sales & Invoicing</h1>
                            <p className="text-gray-600">Manage products, create sales, and generate invoices</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={fetchAllData}
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
                            >
                                <FiRefreshCw className="mr-3" size={20} />
                                Refresh Data
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4 mb-8">
                    {[
                        { label: 'Products', value: stats.totalProducts, icon: FiPackage, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
                        { label: 'Invoices', value: stats.totalInvoices, icon: FiShoppingCart, color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50' },
                        { label: 'Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: FiDollarSign, color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50' },
                        { label: 'Paid', value: `$${stats.totalPaid.toFixed(2)}`, icon: FiCreditCard, color: 'from-green-500 to-emerald-500', bg: 'bg-green-50' },
                        { label: 'Due', value: `$${stats.totalDue.toFixed(2)}`, icon: FiTag, color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50' },
                        { label: 'Discount', value: `$${stats.totalDiscount.toFixed(2)}`, icon: FiPercent, color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50' },
                        { label: "Today's Sales", value: `$${stats.todaySales.toFixed(2)}`, icon: FiTrendingUp, color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50' },
                        { label: 'Avg. Invoice', value: `$${stats.avgSale.toFixed(2)}`, icon: FiCalendar, color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50' }
                    ].map((stat, index) => (
                        <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-600 mb-1">{stat.label}</p>
                                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                        <stat.icon className="text-white" size={18} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-1 mb-8">
                    <div className="flex flex-col sm:flex-row">
                        <button
                            onClick={() => {
                                setActiveTab('products');
                                setCurrentPage(1);
                            }}
                            className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all ${activeTab === 'products' 
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center justify-center">
                                <FiPackage className="mr-3" size={20} />
                                Products ({products.length})
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('sales');
                                setCurrentPage(1);
                            }}
                            className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all ${activeTab === 'sales' 
                                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center justify-center">
                                <FiShoppingCart className="mr-3" size={20} />
                                Invoices ({salesItems.length})
                            </div>
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Search Bar */}
                        <div className="flex-1">
                            <div className="relative">
                                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder={`Search ${activeTab === 'products' ? 'products by name or category' : 'invoices by number, customer, or product'}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Controls */}
                        <div className="flex items-center gap-3">
                            {/* Mobile Filter Toggle */}
                            <button
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className="lg:hidden bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-xl transition-colors"
                            >
                                <FiFilter size={20} />
                            </button>

                            {/* Desktop Controls */}
                            <div className="hidden lg:flex items-center gap-3">
                                <button
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium flex items-center transition-colors"
                                >
                                    {sortOrder === 'asc' ? (
                                        <><FaSortAmountDown className="mr-2" /> A-Z</>
                                    ) : (
                                        <><FaSortAmountUp className="mr-2" /> Z-A</>
                                    )}
                                </button>
                                
                                <button
                                    onClick={resetFilters}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium flex items-center transition-colors"
                                >
                                    <FiRefreshCw className="mr-2" />
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Filters Dropdown */}
                    <AnimatePresence>
                        {showMobileFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="lg:hidden overflow-hidden"
                            >
                                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                                    <button
                                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium flex items-center justify-center transition-colors"
                                    >
                                        {sortOrder === 'asc' ? (
                                            <><FaSortAmountDown className="mr-2" /> Sort A-Z</>
                                        ) : (
                                            <><FaSortAmountUp className="mr-2" /> Sort Z-A</>
                                        )}
                                    </button>
                                    
                                    <button
                                        onClick={resetFilters}
                                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium flex items-center justify-center transition-colors"
                                    >
                                        <FiRefreshCw className="mr-2" />
                                        Reset All Filters
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Products Tab Content */}
                {activeTab === 'products' && (
                    <>
                        {currentItemsPage.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center"
                            >
                                <div className="max-w-md mx-auto">
                                    <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <FiPackage className="text-gray-400" size={48} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No products found</h3>
                                    <p className="text-gray-600 mb-8">
                                        {searchTerm ? 'No products match your search.' : 'No products available.'}
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                                {currentItemsPage.map((product) => (
                                    <motion.div 
                                        key={product._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center">
                                                    <div className={`w-12 h-12 rounded-xl ${getAvatarColor(product.name)} flex items-center justify-center mr-4 shadow-lg`}>
                                                        <span className="text-white font-bold text-lg">
                                                            {product.name?.charAt(0)?.toUpperCase() || 'P'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">{product.name}</h3>
                                                        <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        ${product.price?.toFixed(2)}
                                                    </span>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Stock: {product.quantity || 0}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Product ID:</span>
                                                    <span className="font-mono text-gray-900">{product._id?.slice(-8)}</span>
                                                </div>
                                                {product.description && (
                                                    <div className="text-sm text-gray-600 line-clamp-2">
                                                        {product.description}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <button
                                                onClick={() => handleSellProduct(product)}
                                                disabled={!product.quantity || product.quantity <= 0}
                                                className={`w-full py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl ${
                                                    product.quantity && product.quantity > 0
                                                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white'
                                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                }`}
                                            >
                                                <div className="flex items-center justify-center">
                                                    <FiShoppingCart className="mr-3" size={20} />
                                                    {product.quantity && product.quantity > 0 ? 'Sell This Product' : 'Out of Stock'}
                                                </div>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Sales Tab Content */}
                {activeTab === 'sales' && (
                    <>
                        {currentItemsPage.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center"
                            >
                                <div className="max-w-md mx-auto">
                                    <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <FiShoppingCart className="text-gray-400" size={48} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No invoices found</h3>
                                    <p className="text-gray-600 mb-8">
                                        {searchTerm ? 'No invoices match your search.' : 'No invoices recorded yet.'}
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice</th>
                                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {currentItemsPage.map((sale) => (
                                                <motion.tr 
                                                    key={sale._id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="py-5 px-6">
                                                        <div className="font-mono font-medium text-gray-900">
                                                            {sale.invoiceNumber}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {sale.salesManager}
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-6">
                                                        <div>
                                                            <div className="font-medium text-gray-900">{sale.customerName}</div>
                                                            <div className="text-xs text-gray-500">{sale.customerPhone}</div>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-6">
                                                        <div>
                                                            <div className="font-medium text-gray-900">{sale.productName}</div>
                                                            <div className="text-xs text-gray-500">Qty: {sale.productQty}</div>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-6">
                                                        <div className="space-y-1">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                $${sale.grandTotal?.toFixed(2)}
                                                            </div>
                                                            {sale.discount > 0 && (
                                                                <div className="text-xs text-red-600">
                                                                    -$${sale.discount?.toFixed(2)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-6">
                                                        <div className="space-y-1">
                                                            <div className="text-sm text-gray-600">
                                                                Paid: <span className="font-medium">$${sale.paidAmount?.toFixed(2)}</span>
                                                            </div>
                                                            <div className={`text-xs font-medium ${sale.due > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                                Due: $${sale.due?.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-6">
                                                        <div className="text-sm text-gray-900">
                                                            {new Date(sale.createdAt).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-6">
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => handleViewSale(sale)}
                                                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg transition-colors"
                                                                title="View Details"
                                                            >
                                                                <FiEye size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => generateInvoice(sale._id)}
                                                                className="bg-green-50 hover:bg-green-100 text-green-600 p-2 rounded-lg transition-colors"
                                                                title="Download Invoice"
                                                            >
                                                                <FiDownload size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditSale(sale)}
                                                                className="bg-amber-50 hover:bg-amber-100 text-amber-600 p-2 rounded-lg transition-colors"
                                                                title="Edit Invoice"
                                                            >
                                                                <FiEdit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSale(sale)}
                                                                className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors"
                                                                title="Delete Invoice"
                                                            >
                                                                <FiTrash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Pagination */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Results Info */}
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-semibold text-gray-900">{startIndex + 1}-{endIndex}</span> of{' '}
                            <span className="font-semibold text-gray-900">{currentItems.length}</span> {activeTab === 'products' ? 'products' : 'invoices'}
                        </div>

                        {/* Items Per Page */}
                        <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-600">Rows per page:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        {/* Page Navigation */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                                className={`p-2.5 rounded-lg transition-colors ${currentPage === 1 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <FiChevronsLeft size={20} />
                            </button>
                            
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`p-2.5 rounded-lg transition-colors ${currentPage === 1 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <FiChevronLeft size={20} />
                            </button>
                            
                            {/* Page Numbers */}
                            <div className="flex items-center space-x-1">
                                {(() => {
                                    const pages = [];
                                    const maxVisiblePages = window.innerWidth < 640 ? 3 : 5;
                                    
                                    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                                    
                                    if (endPage - startPage + 1 < maxVisiblePages) {
                                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                    }
                                    
                                    for (let i = startPage; i <= endPage; i++) {
                                        pages.push(
                                            <button
                                                key={i}
                                                onClick={() => handlePageChange(i)}
                                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                                    currentPage === i
                                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                            >
                                                {i}
                                            </button>
                                        );
                                    }
                                    return pages;
                                })()}
                            </div>
                            
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`p-2.5 rounded-lg transition-colors ${currentPage === totalPages 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <FiChevronRight size={20} />
                            </button>
                            
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages}
                                className={`p-2.5 rounded-lg transition-colors ${currentPage === totalPages 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <FiChevronsRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesItems;