"use client"
import axiosInstance, { baseImageURL } from '@/app/SharedComponents/AxiosInstance/AxiosInstance';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useEffect, useState } from 'react';
import { FaArrowRight, FaBoxes } from 'react-icons/fa';
import {
    FiCalendar,
    FiCreditCard,
    FiDollarSign,
    FiFilter,
    FiLayers,
    FiMinus,
    FiPackage,
    FiPercent,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiShoppingBag,
    FiTrendingUp,
    FiUser
} from 'react-icons/fi';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import {
    MdOutlineInventory2,
    MdOutlineStorefront,
    MdOutlineWarehouse
} from 'react-icons/md';
import Swal from 'sweetalert2';

const AddStock = () => {
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [users, setUsers] = useState([]);
    const [basicSettings, setBasicSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stockLoading, setStockLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formData, setFormData] = useState({
        supplierName: '',
        supplierPhone: '',
        supplierAddress: '',
        quantity: '',
        price: '',
        costPrice: '',
        discount: '0',
        vat: '0',
        paidAmount: '0',
        purchaseManager: ''
    });
    const [errors, setErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [categories, setCategories] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [expandedRows, setExpandedRows] = useState([]);

    // Fetch products, suppliers, users and settings
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [productsRes, suppliersRes, usersRes, settingsRes] = await Promise.all([
                    axiosInstance.get("/products"),
                    axiosInstance.get("/suppliers"),
                    axiosInstance.get("/users"),
                    axiosInstance.get("/basic-settings")
                ]);

                if (productsRes.data.success) {
                    setProducts(productsRes.data.data);
                    // Extract unique categories
                    const uniqueCategories = [...new Set(productsRes.data.data.map(p => p.category).filter(Boolean))];
                    setCategories(uniqueCategories);
                }

                if (suppliersRes.data.success) {
                    setSuppliers(suppliersRes.data.data);
                }

                if (usersRes.data.success) {
                    setUsers(usersRes.data.data);
                }

                if (settingsRes.data.success) {
                    setBasicSettings(settingsRes.data.data);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                showErrorAlert('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Show success alert
    const showSuccessAlert = (message) => {
        Swal.fire({
            title: 'Success!',
            text: message,
            icon: 'success',
            confirmButtonColor: '#10B981',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false
        });
    };

    // Show error alert
    const showErrorAlert = (message) => {
        Swal.fire({
            title: 'Error!',
            text: message,
            icon: 'error',
            confirmButtonColor: '#EF4444'
        });
    };

    // Handle add stock button click
    const handleAddStockClick = (product) => {
        setSelectedProduct(product);
        const defaultSupplier = suppliers.length > 0 ? suppliers[0] : null;
        setFormData({
            supplierName: defaultSupplier?.name || '',
            supplierPhone: defaultSupplier?.phone || '',
            supplierAddress: defaultSupplier?.address || '',
            quantity: '',
            price: product.price || '',
            costPrice: product.costPrice || '',
            discount: '0',
            vat: '0',
            paidAmount: '0',
            purchaseManager: users.find(u => u.role === 'admin')?.fullName || users[0]?.fullName || ''
        });
        setErrors({});
        setShowModal(true);
    };

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // For decimal inputs
        if (['quantity', 'price', 'costPrice', 'discount', 'vat', 'paidAmount'].includes(name)) {
            // Allow only numbers and up to 3 decimal places
            const regex = /^\d*\.?\d{0,3}$/;
            if (value === '' || regex.test(value)) {
                setFormData(prev => ({
                    ...prev,
                    [name]: value
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Handle supplier selection
    const handleSupplierChange = (e) => {
        const selectedSupplierId = e.target.value;
        const selectedSupplier = suppliers.find(s => s._id === selectedSupplierId);
        
        if (selectedSupplier) {
            setFormData(prev => ({
                ...prev,
                supplierName: selectedSupplier.name,
                supplierPhone: selectedSupplier.phone || '',
                supplierAddress: selectedSupplier.address || ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.supplierName) newErrors.supplierName = 'Please select a supplier';
        if (!formData.quantity) newErrors.quantity = 'Quantity is required';
        else if (parseFloat(formData.quantity) <= 0) newErrors.quantity = 'Quantity must be greater than 0';
        if (!formData.price) newErrors.price = 'Price is required';
        else if (parseFloat(formData.price) <= 0) newErrors.price = 'Price must be greater than 0';
        if (!formData.costPrice) newErrors.costPrice = 'Cost price is required';
        else if (parseFloat(formData.costPrice) <= 0) newErrors.costPrice = 'Cost price must be greater than 0';
        
        // Check if cost price is less than price
        if (formData.costPrice && formData.price && parseFloat(formData.costPrice) > parseFloat(formData.price)) {
            newErrors.costPrice = 'Cost price cannot be higher than selling price';
        }

        // Check discount and VAT
        if (parseFloat(formData.discount) < 0) newErrors.discount = 'Discount cannot be negative';
        if (parseFloat(formData.vat) < 0) newErrors.vat = 'VAT cannot be negative';
        if (parseFloat(formData.paidAmount) < 0) newErrors.paidAmount = 'Paid amount cannot be negative';

        // Calculate totals
        const subtotal = parseFloat(formData.costPrice) * parseFloat(formData.quantity);
        const total = subtotal - parseFloat(formData.discount) + parseFloat(formData.vat);
        
        if (parseFloat(formData.paidAmount) > total) {
            newErrors.paidAmount = 'Paid amount cannot exceed total amount';
        }

        if (!formData.purchaseManager) newErrors.purchaseManager = 'Please select a purchase manager';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Calculate invoice totals
    const calculateTotals = () => {
        const quantity = parseFloat(formData.quantity) || 0;
        const costPrice = parseFloat(formData.costPrice) || 0;
        const discount = parseFloat(formData.discount) || 0;
        const vat = parseFloat(formData.vat) || 0;
        const paid = parseFloat(formData.paidAmount) || 0;

        const subtotal = quantity * costPrice;
        const total = subtotal - discount + vat;
        const due = total - paid;

        return { subtotal, total, due };
    };

    // Generate PDF Invoice
    const generateInvoice = async (invoiceData) => {
        try {
            const doc = new jsPDF();
            const { subtotal, total, due } = calculateTotals();

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
            doc.setTextColor(0, 0, 0);
            doc.text('PURCHASE INVOICE', 105, 45, { align: 'center' });

            // Invoice Details
            doc.setFontSize(10);
            doc.text(`Invoice #: PI-${Date.now().toString().slice(-8)}`, 20, 60);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 65);
            doc.text(`Purchase Manager: ${formData.purchaseManager}`, 20, 70);

            // Supplier Details
            doc.setFontSize(11);
            doc.setTextColor(37, 99, 235);
            doc.text('Supplier Information', 20, 85);
            doc.setDrawColor(37, 99, 235);
            doc.line(20, 87, 60, 87);

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Name: ${formData.supplierName}`, 120, 60);
            doc.text(`Phone: ${formData.supplierPhone || 'N/A'}`, 120, 65);
            doc.text(`Address: ${formData.supplierAddress || 'N/A'}`, 120, 70);

            // Product Table
            autoTable(doc, {
                startY: 95,
                head: [['Product', 'Qty', 'Cost Price', 'Discount', 'VAT', 'Total']],
                body: [[
                    selectedProduct?.name,
                    formData.quantity,
                    `$${parseFloat(formData.costPrice).toFixed(3)}`,
                    `$${parseFloat(formData.discount).toFixed(3)}`,
                    `$${parseFloat(formData.vat).toFixed(3)}`,
                    `$${total.toFixed(3)}`
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
            doc.text(`$${subtotal.toFixed(3)}`, 180, totalsY, { align: 'right' });

            doc.text('Discount:', 120, totalsY + 5);
            doc.text(`-$${parseFloat(formData.discount).toFixed(3)}`, 180, totalsY + 5, { align: 'right' });

            doc.text('VAT/Tax:', 120, totalsY + 10);
            doc.text(`$${parseFloat(formData.vat).toFixed(3)}`, 180, totalsY + 10, { align: 'right' });

            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('Grand Total:', 120, totalsY + 20);
            doc.text(`$${total.toFixed(3)}`, 180, totalsY + 20, { align: 'right' });

            doc.text('Paid Amount:', 120, totalsY + 25);
            doc.text(`$${parseFloat(formData.paidAmount).toFixed(3)}`, 180, totalsY + 25, { align: 'right' });

            // Due Amount
            if (due > 0) {
                doc.setTextColor(239, 68, 68); // Red
            } else {
                doc.setTextColor(34, 197, 94); // Green
            }
            
            doc.text('Due Amount:', 120, totalsY + 30);
            doc.text(`$${due.toFixed(3)}`, 180, totalsY + 30, { align: 'right' });

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
            doc.text('This is a purchase invoice for stock addition.', 105, signatureY + 25, { align: 'center' });

            // Save PDF
            doc.save(`Purchase_Invoice_${Date.now()}.pdf`);
            
            showSuccessAlert('Invoice downloaded successfully!');
            return true;
        } catch (error) {
            console.error('Error generating invoice:', error);
            showErrorAlert('Failed to generate invoice');
            return false;
        }
    };

    // Handle form submit
    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setStockLoading(true);
            
            // Calculate new quantity by adding to existing quantity
            const currentQuantity = parseFloat(selectedProduct.quantity) || 0;
            const addedQuantity = parseFloat(formData.quantity);
            const newQuantity = currentQuantity + addedQuantity;
            
            // Handle multiple suppliers
            const currentSupplier = selectedProduct.supplier || '';
            let newSupplier = '';
            
            if (currentSupplier) {
                if (Array.isArray(currentSupplier)) {
                    if (!currentSupplier.includes(formData.supplierName)) {
                        newSupplier = [...currentSupplier, formData.supplierName];
                    } else {
                        newSupplier = currentSupplier;
                    }
                } else {
                    if (currentSupplier !== formData.supplierName) {
                        newSupplier = [currentSupplier, formData.supplierName];
                    } else {
                        newSupplier = currentSupplier;
                    }
                }
            } else {
                newSupplier = formData.supplierName;
            }

            // Prepare product update data
            const productUpdateData = {
                price: parseFloat(formData.price).toFixed(3),
                costPrice: parseFloat(formData.costPrice).toFixed(3),
                quantity: newQuantity.toFixed(3),
                supplier: newSupplier,
                profit: (parseFloat(formData.price) - parseFloat(formData.costPrice)).toFixed(3)
            };

            // Prepare purchase invoice data
            const invoiceData = {
                productName: selectedProduct.name,
                productID: selectedProduct._id,
                productCategory: selectedProduct.category,
                costPrice: parseFloat(formData.costPrice),
                productQTY: parseFloat(formData.quantity),
                supplierName: formData.supplierName,
                supplierPhone: formData.supplierPhone,
                supplierAddress: formData.supplierAddress,
                purchaseDiscount: parseFloat(formData.discount),
                vat: parseFloat(formData.vat),
                paidAmount: parseFloat(formData.paidAmount),
                purchaseManager: formData.purchaseManager
            };

            // Update product first
            const productRes = await axiosInstance.patch(`/products/${selectedProduct._id}`, productUpdateData);
            
            if (productRes.data.success) {
                // Create purchase invoice
                const invoiceRes = await axiosInstance.post('/purchases-invoices', invoiceData);
                
                if (invoiceRes.data.success) {
                    // Update products list
                    const updatedProducts = products.map(p => 
                        p._id === selectedProduct._id 
                            ? { 
                                ...p, 
                                price: parseFloat(formData.price).toFixed(3),
                                costPrice: parseFloat(formData.costPrice).toFixed(3),
                                quantity: newQuantity.toFixed(3),
                                supplier: newSupplier,
                                profit: (parseFloat(formData.price) - parseFloat(formData.costPrice)).toFixed(3)
                            }
                            : p
                    );
                    setProducts(updatedProducts);
                    
                    // Reset form and close modal
                    setShowModal(false);
                    setSelectedProduct(null);
                    setFormData({
                        supplierName: '',
                        supplierPhone: '',
                        supplierAddress: '',
                        quantity: '',
                        price: '',
                        costPrice: '',
                        discount: '0',
                        vat: '0',
                        paidAmount: '0',
                        purchaseManager: ''
                    });
                    
                    // Ask user if they want to download invoice
                    Swal.fire({
                        title: 'Success!',
                        html: `
                            <div class="text-center">
                                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <h3 class="text-lg font-semibold text-gray-900 mb-2">Stock Added Successfully!</h3>
                                <p class="text-gray-600 mb-4">Added ${addedQuantity} units to ${selectedProduct.name}</p>
                                <div class="bg-gray-50 p-3 rounded-lg mb-4">
                                    <p class="text-sm text-gray-600">New Stock: <span class="font-bold text-green-600">${newQuantity.toFixed(3)} units</span></p>
                                    <p class="text-sm text-gray-600">Purchase Invoice has been created</p>
                                </div>
                            </div>
                        `,
                        showCancelButton: true,
                        confirmButtonText: 'Download Invoice',
                        cancelButtonText: 'Close',
                        confirmButtonColor: '#3B82F6',
                        cancelButtonColor: '#6B7280'
                    }).then(async (result) => {
                        if (result.isConfirmed) {
                            await generateInvoice(invoiceRes.data.data);
                        }
                    });

                    showSuccessAlert(`Successfully added ${addedQuantity} units to ${selectedProduct.name}`);
                }
            }
        } catch (error) {
            console.error("Error updating stock:", error);
            showErrorAlert('Failed to update stock. Please try again.');
        } finally {
            setStockLoading(false);
        }
    };

    // Filter products
    const filteredProducts = products.filter(product => {
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                product.name?.toLowerCase().includes(searchLower) ||
                product.category?.toLowerCase().includes(searchLower) ||
                (product.supplier && typeof product.supplier === 'string' && product.supplier.toLowerCase().includes(searchLower)) ||
                (Array.isArray(product.supplier) && product.supplier.some(s => s.toLowerCase().includes(searchLower)))
            );
        }
        return true;
    }).filter(product => {
        if (filterCategory !== 'all') {
            return product.category === filterCategory;
        }
        return true;
    });

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (!sortConfig.key) return 0;
        
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortConfig.direction === 'asc' 
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
        
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });

    // Handle sort
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Toggle row expansion
    const toggleRowExpansion = (productId) => {
        setExpandedRows(prev => 
            prev.includes(productId) 
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    // Get sort icon
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? <IoIosArrowUp /> : <IoIosArrowDown />;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-3 text-gray-600">Loading products...</p>
                </div>
            </div>
        );
    }

    // Calculate totals
    const totalProducts = products.length;
    const productsWithStock = products.filter(p => p.quantity > 0).length;
    const productsWithoutStock = products.filter(p => !p.quantity || p.quantity <= 0).length;
    const totalStockValue = products.reduce((sum, product) => {
        return sum + (parseFloat(product.price) || 0) * (parseFloat(product.quantity) || 0);
    }, 0);
    const totalInventoryCost = products.reduce((sum, product) => {
        return sum + (parseFloat(product.costPrice) || 0) * (parseFloat(product.quantity) || 0);
    }, 0);
    const totalProfit = totalStockValue - totalInventoryCost;

    // Calculate invoice preview totals
    const invoiceTotals = calculateTotals();

    return (
        <div className="min-h-screen bg-gray-50 text-black p-4 md:p-6">
            {/* Modal */}
            {showModal && selectedProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <FiPackage className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">Add Stock & Generate Invoice</h3>
                                        <p className="text-blue-100 mt-1">Add stock details and create purchase invoice for {selectedProduct.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
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
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Column - Product Info & Stock */}
                                <div className="lg:col-span-1 space-y-6">
                                    {/* Product Info */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                                        <div className="flex items-center space-x-4">
                                            {selectedProduct.image ? (
                                                <img 
                                                    src={`${baseImageURL}${selectedProduct.image}`} 
                                                    alt={selectedProduct.name}
                                                    className="w-16 h-16 rounded-lg object-cover shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-sm">
                                                    <FiPackage className="w-8 h-8 text-blue-600" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 text-lg">{selectedProduct.name}</h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-medium rounded-full">
                                                        {selectedProduct.category}
                                                    </span>
                                                    <span className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-sm font-medium rounded-full">
                                                        <span className="flex items-center">
                                                            <FaBoxes className="mr-1" />
                                                            Current: {(parseFloat(selectedProduct.quantity) || 0).toFixed(3)}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stock Calculation */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-amber-800">Current Stock</p>
                                                        <p className="text-2xl font-bold text-amber-900">
                                                            {(parseFloat(selectedProduct.quantity) || 0).toFixed(3)}
                                                        </p>
                                                    </div>
                                                    <div className="p-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg">
                                                        <MdOutlineWarehouse className="w-6 h-6 text-amber-600" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-green-800">Add Stock</p>
                                                        <p className="text-2xl font-bold text-green-900">
                                                            {formData.quantity || '0.000'}
                                                        </p>
                                                    </div>
                                                    <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
                                                        <FiPlus className="w-6 h-6 text-green-600" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Total Stock Preview */}
                                        {formData.quantity && (
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-blue-800">Total Stock</p>
                                                        <p className="text-2xl font-bold text-blue-900">
                                                            {((parseFloat(selectedProduct.quantity) || 0) + (parseFloat(formData.quantity) || 0)).toFixed(3)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-lg font-medium text-blue-700">
                                                            {(parseFloat(selectedProduct.quantity) || 0).toFixed(3)}
                                                        </span>
                                                        <FaArrowRight className="w-4 h-4 text-blue-500" />
                                                        <span className="text-lg font-medium text-blue-700">
                                                            {((parseFloat(selectedProduct.quantity) || 0) + (parseFloat(formData.quantity) || 0)).toFixed(3)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Profit Calculation */}
                                    {formData.price && formData.costPrice && (
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-medium text-green-800 flex items-center">
                                                        <FiTrendingUp className="mr-2" />
                                                        Profit Calculation
                                                    </p>
                                                    <p className="text-xs text-green-600">Price - Cost Price</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-green-900">
                                                        ${(parseFloat(formData.price || 0) - parseFloat(formData.costPrice || 0)).toFixed(3)}
                                                    </p>
                                                    <p className="text-sm text-green-700">
                                                        Margin: {(
                                                            ((parseFloat(formData.price || 0) - parseFloat(formData.costPrice || 0)) / 
                                                            parseFloat(formData.costPrice || 1) * 100) || 0
                                                        ).toFixed(1)}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column - Form */}
                                <div className="lg:col-span-2">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Supplier Selection */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <span className="flex items-center">
                                                        <MdOutlineStorefront className="mr-2" />
                                                        Supplier <span className="text-red-500 ml-1">*</span>
                                                    </span>
                                                </label>
                                                <select
                                                    onChange={handleSupplierChange}
                                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                                                        errors.supplierName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                    }`}
                                                >
                                                    <option value="">Select Supplier</option>
                                                    {suppliers.map(supplier => (
                                                        <option key={supplier._id} value={supplier._id}>
                                                            {supplier.name} {supplier.phone ? `(${supplier.phone})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.supplierName && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.supplierName}</p>
                                                )}
                                            </div>

                                            {/* Purchase Manager */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <span className="flex items-center">
                                                        <FiUser className="mr-2" />
                                                        Purchase Manager <span className="text-red-500 ml-1">*</span>
                                                    </span>
                                                </label>
                                                <select
                                                    name="purchaseManager"
                                                    value={formData.purchaseManager}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                                                        errors.purchaseManager ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                    }`}
                                                >
                                                    <option value="">Select Manager</option>
                                                    {users.map(user => (
                                                        <option key={user._id} value={user.fullName || user.name}>
                                                            {user.fullName || user.name} - {user.role || 'Staff'}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.purchaseManager && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.purchaseManager}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quantity & Prices */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <span className="flex items-center">
                                                        <FaBoxes className="mr-2" />
                                                        Quantity <span className="text-red-500 ml-1">*</span>
                                                    </span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        name="quantity"
                                                        value={formData.quantity}
                                                        onChange={handleInputChange}
                                                        placeholder="0.000"
                                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                                                            errors.quantity ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                        }`}
                                                    />
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500">units</span>
                                                    </div>
                                                </div>
                                                {errors.quantity && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <span className="flex items-center">
                                                        <FiTrendingUp className="mr-2" />
                                                        Price <span className="text-red-500 ml-1">*</span>
                                                    </span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500">$</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="price"
                                                        value={formData.price}
                                                        onChange={handleInputChange}
                                                        placeholder="0.000"
                                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                                                            errors.price ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                {errors.price && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <span className="flex items-center">
                                                        <FiDollarSign className="mr-2" />
                                                        Cost Price <span className="text-red-500 ml-1">*</span>
                                                    </span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500">$</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="costPrice"
                                                        value={formData.costPrice}
                                                        onChange={handleInputChange}
                                                        placeholder="0.000"
                                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                                                            errors.costPrice ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                {errors.costPrice && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.costPrice}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Discount & VAT */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <span className="flex items-center">
                                                        <FiPercent className="mr-2" />
                                                        Discount ($)
                                                    </span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500">$</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="discount"
                                                        value={formData.discount}
                                                        onChange={handleInputChange}
                                                        placeholder="0.000"
                                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                                                            errors.discount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                {errors.discount && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.discount}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <span className="flex items-center">
                                                        <FiPercent className="mr-2" />
                                                        VAT/Tax ($)
                                                    </span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500">$</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="vat"
                                                        value={formData.vat}
                                                        onChange={handleInputChange}
                                                        placeholder="0.000"
                                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                                                            errors.vat ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                {errors.vat && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.vat}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <span className="flex items-center">
                                                        <FiCreditCard className="mr-2" />
                                                        Paid Amount <span className="text-red-500 ml-1">*</span>
                                                    </span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500">$</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="paidAmount"
                                                        value={formData.paidAmount}
                                                        onChange={handleInputChange}
                                                        placeholder="0.000"
                                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                                                            errors.paidAmount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                                {errors.paidAmount && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.paidAmount}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Invoice Preview */}
                                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                                            <h5 className="font-semibold text-emerald-800 mb-3 flex items-center">
                                                <FiCalendar className="mr-2" />
                                                Invoice Preview
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-white p-3 rounded-lg">
                                                    <p className="text-xs text-gray-500">Subtotal</p>
                                                    <p className="text-lg font-bold text-gray-900">${invoiceTotals.subtotal.toFixed(3)}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg">
                                                    <p className="text-xs text-gray-500">Grand Total</p>
                                                    <p className="text-lg font-bold text-green-600">${invoiceTotals.total.toFixed(3)}</p>
                                                </div>
                                                <div className={`p-3 rounded-lg ${invoiceTotals.due > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
                                                    <p className="text-xs text-gray-500">Due Amount</p>
                                                    <p className={`text-lg font-bold ${invoiceTotals.due > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                        ${invoiceTotals.due.toFixed(3)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 p-6">
                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                                    disabled={stockLoading}
                                >
                                    <FiMinus className="mr-2" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={stockLoading}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl"
                                >
                                    {stockLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <FiPlus className="mr-2" />
                                            Add Stock & Generate Invoice
                                        </>
                                    )}
                                </button>
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
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Stock Management</h1>
                            <p className="text-gray-600 mt-2">Manage product stock, prices, suppliers and generate purchase invoices</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:block text-right">
                                <p className="text-sm text-gray-500">Total Products</p>
                                <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-800">Total Products</p>
                                <p className="text-2xl font-bold text-blue-900">{totalProducts}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                <FiPackage className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-800">With Stock</p>
                                <p className="text-2xl font-bold text-green-900">{productsWithStock}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                                <MdOutlineInventory2 className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-800">Without Stock</p>
                                <p className="text-2xl font-bold text-amber-900">{productsWithoutStock}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                                <FiShoppingBag className="text-amber-600" size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-800">Total Value</p>
                                <p className="text-2xl font-bold text-purple-900">${totalStockValue.toFixed(3)}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-violet-100 rounded-lg flex items-center justify-center">
                                <FiDollarSign className="text-purple-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-indigo-800">Inventory Cost</p>
                                <p className="text-xl font-bold text-indigo-900">${totalInventoryCost.toFixed(3)}</p>
                            </div>
                            <FiLayers className="text-indigo-600" size={20} />
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-800">Total Profit</p>
                                <p className="text-xl font-bold text-emerald-900">${totalProfit.toFixed(3)}</p>
                            </div>
                            <FiTrendingUp className="text-emerald-600" size={20} />
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-rose-800">Profit Margin</p>
                                <p className="text-xl font-bold text-rose-900">
                                    {totalInventoryCost > 0 
                                        ? `${((totalProfit / totalInventoryCost) * 100).toFixed(1)}%`
                                        : '0.0%'}
                                </p>
                            </div>
                            <FiTrendingUp className="text-rose-600" size={20} />
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
                                    placeholder="Search products by name, category, or supplier..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <div className="relative">
                                <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map((category, index) => (
                                        <option key={index} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Reset Button */}
                        <div>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterCategory('all');
                                    setSortConfig({ key: null, direction: 'asc' });
                                }}
                                className="w-full flex items-center justify-center text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                            >
                                <FiRefreshCw className="mr-2" />
                                Reset All
                            </button>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Products List
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Showing {sortedProducts.length} of {products.length} products
                                </p>
                            </div>
                            <div className="mt-2 md:mt-0">
                                <p className="text-sm text-gray-600">
                                    Total Value: <span className="font-bold text-green-600">${totalStockValue.toFixed(3)}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                                        <div className="flex items-center">
                                            Product
                                            {getSortIcon('name')}
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}>
                                        <div className="flex items-center">
                                            Category
                                            {getSortIcon('category')}
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('price')}>
                                        <div className="flex items-center">
                                            Price
                                            {getSortIcon('price')}
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('costPrice')}>
                                        <div className="flex items-center">
                                            Cost Price
                                            {getSortIcon('costPrice')}
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('quantity')}>
                                        <div className="flex items-center">
                                            Stock
                                            {getSortIcon('quantity')}
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Supplier
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <div className="text-gray-500">
                                                <FiPackage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                                <p className="text-lg font-medium">No products found</p>
                                                <p className="mt-1">Try adjusting your search or filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedProducts.map((product) => {
                                        const hasStockInfo = product.quantity !== undefined && product.price !== undefined && product.costPrice !== undefined;
                                        const profit = hasStockInfo ? (product.price - product.costPrice).toFixed(3) : '0.000';
                                        const isExpanded = expandedRows.includes(product._id);
                                        
                                        return (
                                            <>
                                                <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            {product.image && (
                                                                <img 
                                                                    className="w-10 h-10 rounded-lg object-cover mr-3 shadow-sm"
                                                                    src={`${baseImageURL}${product.image}`} 
                                                                    alt={product.name}
                                                                />
                                                            )}
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {product.name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {product.description ? product.description.substring(0, 30) + '...' : 'No description'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800">
                                                            {product.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            ${hasStockInfo ? parseFloat(product.price).toFixed(3) : '0.000'}
                                                        </div>
                                                        {hasStockInfo && (
                                                            <div className="text-xs text-green-600 flex items-center">
                                                                <FiTrendingUp className="mr-1" size={12} />
                                                                Profit: ${profit}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        ${hasStockInfo ? parseFloat(product.costPrice).toFixed(3) : '0.000'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className={`text-sm font-medium ${
                                                            !hasStockInfo ? 'text-gray-400' :
                                                            product.quantity > 10 ? 'text-green-600' :
                                                            product.quantity > 0 ? 'text-amber-600' : 'text-red-600'
                                                        }`}>
                                                            {hasStockInfo ? parseFloat(product.quantity).toFixed(3) : '0.000'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {!hasStockInfo ? 'No stock info' : 
                                                            product.quantity > 10 ? 'In Stock' :
                                                            product.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">
                                                            {product.supplier ? (
                                                                Array.isArray(product.supplier) ? (
                                                                    <div className="flex items-center">
                                                                        <span className="px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs rounded-full">
                                                                            {product.supplier.length} suppliers
                                                                        </span>
                                                                        <button
                                                                            onClick={() => toggleRowExpansion(product._id)}
                                                                            className="ml-2 text-gray-400 hover:text-gray-600"
                                                                        >
                                                                            {isExpanded ? <IoIosArrowUp /> : <IoIosArrowDown />}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs rounded-full">
                                                                        {product.supplier}
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <span className="text-gray-400">No supplier</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => handleAddStockClick(product)}
                                                            disabled={stockLoading}
                                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                        >
                                                            <FiPlus className="mr-2" />
                                                            {hasStockInfo ? 'Update Stock' : 'Add Stock'}
                                                        </button>
                                                    </td>
                                                </tr>
                                                
                                                {/* Expanded Row for Multiple Suppliers */}
                                                {isExpanded && Array.isArray(product.supplier) && (
                                                    <tr>
                                                        <td colSpan="7" className="px-6 py-4 bg-gray-50">
                                                            <div className="pl-14">
                                                                <p className="text-sm font-medium text-gray-700 mb-2">Suppliers:</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {product.supplier.map((supplier, index) => (
                                                                        <span 
                                                                            key={index}
                                                                            className="px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 text-sm rounded-full"
                                                                        >
                                                                            {supplier}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddStock;