"use client"
import axiosInstance from '@/app/SharedComponents/AxiosInstance/AxiosInstance';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useEffect, useState } from 'react';
import { FaBoxes } from 'react-icons/fa';
import {
    FiCalendar,
    FiChevronLeft,
    FiChevronRight,
    FiChevronsLeft,
    FiChevronsRight,
    FiCreditCard,
    FiDollarSign,
    FiDownload,
    FiEye,
    FiPackage,
    FiRefreshCw,
    FiSearch,
    FiTrash2,
    FiTrendingUp,
    FiUser
} from 'react-icons/fi';
import {
    MdOutlineReceipt,
    MdOutlineStorefront
} from 'react-icons/md';
import Swal from 'sweetalert2';

const PurchasesInvoice = () => {
    const [purchasesInvoice, setPurchasesInvoice] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [basicSettings, setBasicSettings] = useState(null);

    useEffect(() => {
        fetchData();
        fetchBasicSettings();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get("/purchases-invoices");
            if(res.data.success) {
                setPurchasesInvoice(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching purchases:", error);
            showErrorAlert('Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    };

    const fetchBasicSettings = async () => {
        try {
            const res = await axiosInstance.get("/basic-settings");
            if(res.data.success) {
                setBasicSettings(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    };

    const showSuccessAlert = (message) => {
        Swal.fire({
            title: 'Success!',
            text: message,
            icon: 'success',
            confirmButtonColor: '#10B981',
            timer: 2000,
            showConfirmButton: false
        });
    };

    const showErrorAlert = (message) => {
        Swal.fire({
            title: 'Error!',
            text: message,
            icon: 'error',
            confirmButtonColor: '#EF4444'
        });
    };

    // Handle view invoice details
    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setShowDetailsModal(true);
    };

    // Handle download invoice as PDF
    const handleDownloadInvoice = async (invoice) => {
        try {
            const doc = new jsPDF();

            // Company Header
            doc.setFontSize(24);
            doc.setTextColor(37, 99, 235);
            doc.text(basicSettings?.websiteName || 'Inventory System', 105, 20, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(basicSettings?.address || 'Address not specified', 105, 28, { align: 'center' });
            doc.text(`Phone: ${basicSettings?.phone || 'N/A'} | Email: ${basicSettings?.email || 'N/A'}`, 105, 32, { align: 'center' });

            // Invoice Title
            doc.setFontSize(16);
            doc.setTextColor(0, 0, 0);
            doc.text('PURCHASE INVOICE', 105, 45, { align: 'center' });

            // Invoice Details
            doc.setFontSize(10);
            doc.text(`Invoice #: PI-${invoice._id.slice(-8)}`, 20, 60);
            doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, 65);
            doc.text(`Purchase Manager: ${invoice.purchaseManager || 'N/A'}`, 20, 70);

            // Supplier Details
            doc.setFontSize(11);
            doc.setTextColor(37, 99, 235);
            doc.text('Supplier Information', 20, 85);
            doc.setDrawColor(37, 99, 235);
            doc.line(20, 87, 60, 87);

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Name: ${invoice.supplierName}`, 120, 60);
            doc.text(`Phone: ${invoice.supplierPhone || 'N/A'}`, 120, 65);
            doc.text(`Address: ${invoice.supplierAddress || 'N/A'}`, 120, 70);

            // Product Table
            autoTable(doc, {
                startY: 95,
                head: [['Product', 'Category', 'Qty', 'Cost Price', 'Discount', 'VAT', 'Total']],
                body: [[
                    invoice.productName,
                    invoice.productCategory || 'N/A',
                    invoice.productQTY,
                    `$${invoice.costPrice?.toFixed(3)}`,
                    `$${invoice.purchaseDiscount?.toFixed(3)}`,
                    `$${invoice.vat?.toFixed(3)}`,
                    `$${invoice.total?.toFixed(3)}`
                ]],
                theme: 'grid',
                headStyles: { 
                    fillColor: [37, 99, 235],
                    textColor: 255,
                    fontSize: 10
                },
                styles: { 
                    fontSize: 10, 
                    cellPadding: 5,
                    textColor: [0, 0, 0]
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
            doc.text(`$${invoice.subTotal?.toFixed(3)}`, 180, totalsY, { align: 'right' });

            doc.text('Discount:', 120, totalsY + 5);
            doc.text(`-$${invoice.purchaseDiscount?.toFixed(3)}`, 180, totalsY + 5, { align: 'right' });

            doc.text('VAT/Tax:', 120, totalsY + 10);
            doc.text(`$${invoice.vat?.toFixed(3)}`, 180, totalsY + 10, { align: 'right' });

            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('Grand Total:', 120, totalsY + 20);
            doc.text(`$${invoice.total?.toFixed(3)}`, 180, totalsY + 20, { align: 'right' });

            doc.text('Paid Amount:', 120, totalsY + 25);
            doc.text(`$${invoice.paidAmount?.toFixed(3)}`, 180, totalsY + 25, { align: 'right' });

            // Due Amount
            if (invoice.due > 0) {
                doc.setTextColor(239, 68, 68);
            } else {
                doc.setTextColor(34, 197, 94);
            }
            
            doc.text('Due Amount:', 120, totalsY + 30);
            doc.text(`$${invoice.due?.toFixed(3)}`, 180, totalsY + 30, { align: 'right' });

            // Reset text color
            doc.setTextColor(0, 0, 0);

            // Footer and Signatures
            const signatureY = totalsY + 50;
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text('Supplier Signature', 50, signatureY, { align: 'center' });
            doc.line(30, signatureY + 5, 70, signatureY + 5);

            doc.text('Authorized Signature', 150, signatureY, { align: 'center' });
            doc.line(130, signatureY + 5, 170, signatureY + 5);

            // Terms
            doc.text('Thank you for your business!', 105, signatureY + 20, { align: 'center' });
            doc.setFontSize(8);
            doc.text('This is a purchase invoice for stock purchase.', 105, signatureY + 25, { align: 'center' });

            // Save PDF
            doc.save(`Purchase_Invoice_${invoice._id.slice(-8)}.pdf`);
            
            showSuccessAlert('Invoice downloaded successfully!');
        } catch (error) {
            console.error('Error generating invoice:', error);
            showErrorAlert('Failed to generate invoice');
        }
    };

    // Handle delete invoice
    const handleDeleteInvoice = (invoice) => {
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
                                <p class="text-sm text-red-700">This action cannot be undone.</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-gray-900">Purchase Invoice</h3>
                        <div class="grid grid-cols-2 gap-3 mt-3 text-sm">
                            <div>
                                <span class="text-gray-600">Supplier:</span>
                                <span class="font-medium ml-2">${invoice.supplierName}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Total:</span>
                                <span class="font-medium ml-2">$${invoice.total?.toFixed(3)}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Product:</span>
                                <span class="font-medium ml-2">${invoice.productName}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Quantity:</span>
                                <span class="font-medium ml-2">${invoice.productQTY} units</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete Invoice',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            reverseButtons: true,
            width: window.innerWidth < 640 ? '90%' : '500px',
            backdrop: 'rgba(0,0,0,0.4)'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await axiosInstance.delete(`/purchases-invoices/${invoice._id}`);
                    
                    if (response.data.success) {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Invoice deleted successfully',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        });
                        fetchData();
                    }
                } catch (error) {
                    showErrorAlert(error.response?.data?.message || 'Failed to delete invoice');
                }
            }
        });
    };

    // Filter invoices
    const filteredInvoices = purchasesInvoice.filter(invoice => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            invoice.productName?.toLowerCase().includes(searchLower) ||
            invoice.supplierName?.toLowerCase().includes(searchLower) ||
            invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
            invoice.productCategory?.toLowerCase().includes(searchLower)
        );
    });

    // Sort invoices by date (newest first)
    const sortedInvoices = [...filteredInvoices].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, sortedInvoices.length);
    const currentInvoices = sortedInvoices.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Calculate statistics
    const stats = {
        totalInvoices: purchasesInvoice.length,
        totalAmount: purchasesInvoice.reduce((sum, inv) => sum + (inv.total || 0), 0),
        totalPaid: purchasesInvoice.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0),
        totalDue: purchasesInvoice.reduce((sum, inv) => sum + (inv.due || 0), 0),
        totalProducts: [...new Set(purchasesInvoice.map(inv => inv.productName))].length,
        totalSuppliers: [...new Set(purchasesInvoice.map(inv => inv.supplierName))].length,
        todayInvoices: purchasesInvoice.filter(inv => 
            new Date(inv.createdAt).toDateString() === new Date().toDateString()
        ).length,
        avgInvoice: purchasesInvoice.length > 0 ? 
            purchasesInvoice.reduce((sum, inv) => sum + (inv.total || 0), 0) / purchasesInvoice.length : 0
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-3 text-gray-600">Loading purchase invoices...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-black p-4 md:p-6">
            {/* Details Modal */}
            {showDetailsModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <MdOutlineReceipt className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">Purchase Invoice Details</h3>
                                        <p className="text-blue-100 mt-1">Invoice #PI-{selectedInvoice._id.slice(-8)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column - Invoice Details */}
                                <div className="space-y-6">
                                    {/* Invoice Header */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium text-blue-800">Invoice Number</p>
                                                <p className="text-2xl font-bold text-blue-900">PI-{selectedInvoice._id.slice(-8)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-blue-800">Date</p>
                                                <p className="font-semibold text-gray-900">
                                                    {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(selectedInvoice.createdAt).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Details */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                            <FiPackage className="mr-2" />
                                            Product Details
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Product Name</span>
                                                <span className="font-medium">{selectedInvoice.productName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Category</span>
                                                <span className="font-medium">{selectedInvoice.productCategory || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Quantity</span>
                                                <span className="font-medium">{selectedInvoice.productQTY} units</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Cost Price</span>
                                                <span className="font-bold text-green-600">${selectedInvoice.costPrice?.toFixed(3)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Supplier Details */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                            <MdOutlineStorefront className="mr-2" />
                                            Supplier Details
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Name</span>
                                                <span className="font-medium">{selectedInvoice.supplierName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Phone</span>
                                                <span className="font-medium">{selectedInvoice.supplierPhone || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Address</span>
                                                <span className="font-medium">{selectedInvoice.supplierAddress || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Payment Details */}
                                <div className="space-y-6">
                                    {/* Payment Summary */}
                                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                                        <h4 className="font-semibold text-emerald-800 mb-3 flex items-center">
                                            <FiDollarSign className="mr-2" />
                                            Payment Summary
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Subtotal</span>
                                                <span className="font-medium">${selectedInvoice.subTotal?.toFixed(3)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Discount</span>
                                                <span className="font-medium text-red-600">-${selectedInvoice.purchaseDiscount?.toFixed(3)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">VAT/Tax</span>
                                                <span className="font-medium">${selectedInvoice.vat?.toFixed(3)}</span>
                                            </div>
                                            <div className="flex justify-between pt-3 border-t border-emerald-200">
                                                <span className="font-semibold text-gray-800">Grand Total</span>
                                                <span className="text-xl font-bold text-green-600">${selectedInvoice.total?.toFixed(3)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Paid Amount</span>
                                                <span className="font-medium">${selectedInvoice.paidAmount?.toFixed(3)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Due Amount</span>
                                                <span className={`font-bold ${selectedInvoice.due > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                    ${selectedInvoice.due?.toFixed(3)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Purchase Manager */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                            <FiUser className="mr-2" />
                                            Purchase Information
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Purchase Manager</span>
                                                <span className="font-medium">{selectedInvoice.purchaseManager || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Created Date</span>
                                                <span className="font-medium">
                                                    {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-800 mb-3">Actions</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handleDownloadInvoice(selectedInvoice)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
                                            >
                                                <FiDownload className="mr-2" />
                                                Download PDF
                                            </button>
                                            <button
                                                onClick={() => handleDeleteInvoice(selectedInvoice)}
                                                className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
                                            >
                                                <FiTrash2 className="mr-2" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-8xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Purchase Invoices</h1>
                            <p className="text-gray-600 mt-2">Manage and track all purchase invoices</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={fetchData}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
                            >
                                <FiRefreshCw className="mr-2" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-800">Total Invoices</p>
                                <p className="text-2xl font-bold text-blue-900">{stats.totalInvoices}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                <MdOutlineReceipt className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-800">Total Amount</p>
                                <p className="text-2xl font-bold text-green-900">${stats.totalAmount.toFixed(3)}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                                <FiDollarSign className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-800">Total Due</p>
                                <p className="text-2xl font-bold text-amber-900">${stats.totalDue.toFixed(3)}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                                <FiCreditCard className="text-amber-600" size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-800">Today&apos;s Invoices</p>
                                <p className="text-2xl font-bold text-purple-900">{stats.todayInvoices}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-violet-100 rounded-lg flex items-center justify-center">
                                <FiCalendar className="text-purple-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-indigo-800">Total Suppliers</p>
                                <p className="text-xl font-bold text-indigo-900">{stats.totalSuppliers}</p>
                            </div>
                            <MdOutlineStorefront className="text-indigo-600" size={20} />
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-800">Total Products</p>
                                <p className="text-xl font-bold text-emerald-900">{stats.totalProducts}</p>
                            </div>
                            <FaBoxes className="text-emerald-600" size={20} />
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-rose-800">Avg. Invoice</p>
                                <p className="text-xl font-bold text-rose-900">${stats.avgInvoice.toFixed(3)}</p>
                            </div>
                            <FiTrendingUp className="text-rose-600" size={20} />
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="md:col-span-3">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search invoices by product, supplier, or category..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Reset Button */}
                        <div>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setCurrentPage(1);
                                }}
                                className="w-full flex items-center justify-center text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                            >
                                <FiRefreshCw className="mr-2" />
                                Clear Search
                            </button>
                        </div>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Purchase Invoices
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Showing {currentInvoices.length} of {sortedInvoices.length} invoices
                                </p>
                            </div>
                            <div className="mt-2 md:mt-0">
                                <p className="text-sm text-gray-600">
                                    Total Value: <span className="font-bold text-green-600">${stats.totalAmount.toFixed(3)}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Invoice Details
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Supplier
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <div className="text-gray-500">
                                                <MdOutlineReceipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                                <p className="text-lg font-medium">No invoices found</p>
                                                <p className="mt-1">Try adjusting your search</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentInvoices.map((invoice) => (
                                        <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        PI-{invoice._id.slice(-8)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(invoice.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {invoice.purchaseManager || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {invoice.productName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Qty: {invoice.productQTY} | ${invoice.costPrice?.toFixed(3)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {invoice.supplierName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {invoice.supplierPhone || 'No phone'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        ${invoice.total?.toFixed(3)}
                                                    </div>
                                                    {invoice.purchaseDiscount > 0 && (
                                                        <div className="text-xs text-red-600">
                                                            -${invoice.purchaseDiscount?.toFixed(3)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <div className="text-sm text-gray-600">
                                                        Paid: <span className="font-medium">${invoice.paidAmount?.toFixed(3)}</span>
                                                    </div>
                                                    <div className={`text-xs font-medium ${invoice.due > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                        Due: ${invoice.due?.toFixed(3)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleViewInvoice(invoice)}
                                                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <FiEye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadInvoice(invoice)}
                                                        className="bg-green-50 hover:bg-green-100 text-green-600 p-2 rounded-lg transition-colors"
                                                        title="Download PDF"
                                                    >
                                                        <FiDownload size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteInvoice(invoice)}
                                                        className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors"
                                                        title="Delete Invoice"
                                                    >
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden">
                        <div className="p-4 space-y-4">
                            {currentInvoices.length === 0 ? (
                                <div className="text-center py-12">
                                    <MdOutlineReceipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <p className="text-lg font-medium">No invoices found</p>
                                    <p className="text-gray-500 mt-1">Try adjusting your search</p>
                                </div>
                            ) : (
                                currentInvoices.map((invoice) => (
                                    <div key={invoice._id} className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-bold text-gray-900">PI-{invoice._id.slice(-8)}</h4>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(invoice.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${invoice.due > 0 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                                Due: ${invoice.due?.toFixed(3)}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-3 mb-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-gray-500">Product</p>
                                                    <p className="font-medium">{invoice.productName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Quantity</p>
                                                    <p className="font-medium">{invoice.productQTY} units</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Supplier</p>
                                                    <p className="font-medium">{invoice.supplierName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Total</p>
                                                    <p className="font-bold text-green-600">${invoice.total?.toFixed(3)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between pt-3 border-t border-gray-200">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleViewInvoice(invoice)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <FiEye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadInvoice(invoice)}
                                                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                                                    title="Download PDF"
                                                >
                                                    <FiDownload size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteInvoice(invoice)}
                                                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                                                    title="Delete Invoice"
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
                </div>

                {/* Pagination */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Results Info */}
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-semibold text-gray-900">{startIndex + 1}-{endIndex}</span> of{' '}
                            <span className="font-semibold text-gray-900">{sortedInvoices.length}</span> invoices
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

export default PurchasesInvoice;