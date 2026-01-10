import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, User, Trash2, RotateCcw, FileText,
    Calendar, AlertCircle, Printer, X, Banknote, CreditCard,
    Package, ChevronDown, Minus, Plus, Info, CheckCircle2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import API_URL from '../config/api';

const Return = () => {
    // --- State ---
    const [medicines, setMedicines] = useState([]);
    const [filteredMedicines, setFilteredMedicines] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [returnCart, setReturnCart] = useState([]); // Array of items being returned
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerName, setCustomerName] = useState('');

    const [returnMode, setReturnMode] = useState('invoice'); // 'manual' or 'invoice'
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [supplies, setSupplies] = useState([]);

    const { showToast } = useToast();

    const [refundMethod, setRefundMethod] = useState('Cash');
    const [returnNotes, setReturnNotes] = useState('');
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [returnReceipt, setReturnReceipt] = useState(null);
    const [dateFilter, setDateFilter] = useState('Today');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const searchInputRef = React.useRef(null);
    const invoiceInputRef = React.useRef(null);

    const returnReasons = [
        'Wrong item',
        'Damaged / Broken',
        'Expired',
        'Customer changed mind',
        'Doctor change of prescription',
        'Other'
    ];

    // --- Data Fetching ---
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [medsRes, custRes, suppliesRes] = await Promise.all([
                fetch(`${API_URL}/api/medicines`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/customers`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/supplies`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const medsData = await medsRes.json();
            const custData = await custRes.json();
            const suppliesData = await suppliesRes.json();

            setMedicines((Array.isArray(medsData) ? medsData : []).filter(med => med.status === 'Active' && med.inInventory));
            setCustomers(Array.isArray(custData) ? custData : []);
            setSupplies(Array.isArray(suppliesData) ? suppliesData : []);
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Failed to load system data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async (q = '') => {
        try {
            const today = new Date();
            let startDate = '';
            let endDate = today.toISOString().split('T')[0];

            if (dateFilter === 'Custom') {
                startDate = customDates.start;
                endDate = customDates.end;
            } else if (dateFilter === 'Today') {
                startDate = endDate;
            } else if (dateFilter === 'Yesterday') {
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                startDate = yesterday.toISOString().split('T')[0];
                endDate = startDate;
            } else if (dateFilter === 'This Month') {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                startDate = firstDay.toISOString().split('T')[0];
            }

            const params = new URLSearchParams({
                startDate,
                endDate,
                range: dateFilter,
                type: 'Sale',
                limit: '50'
            });
            if (q) params.append('searchQuery', q);

            const response = await fetch(`${API_URL}/api/transactions?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const result = await response.json();
            const txArray = Array.isArray(result) ? result : (result.data || []);
            const sales = txArray.filter(tx => tx.status !== 'Voided');
            setTransactions(sales);
            setFilteredTransactions(sales);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            showToast('Failed to fetch invoices', 'error');
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransactions(invoiceSearchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [invoiceSearchQuery, dateFilter, customDates]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery, invoiceSearchQuery, returnMode]);

    // Focus search on mount
    useEffect(() => {
        if (returnMode === 'manual') searchInputRef.current?.focus();
        else invoiceInputRef.current?.focus();
    }, [returnMode]);

    // Scroll selected item into view
    useEffect(() => {
        const element = document.getElementById(`result-item-${selectedIndex}`);
        if (element) {
            element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [selectedIndex]);

    // --- Search Logic ---
    useEffect(() => {
        const lowerQuery = searchQuery.toLowerCase();
        if (!lowerQuery) {
            setFilteredMedicines([]);
            return;
        }
        setFilteredMedicines(medicines.filter(m =>
            m.name.toLowerCase().includes(lowerQuery) ||
            m.formulaCode?.toLowerCase().includes(lowerQuery)
        ));
    }, [searchQuery, medicines]);

    // Removal of local filtering useEffect as it's now server-driven

    // --- Helpers ---
    const calculateTotalRefund = () => {
        return returnCart.reduce((sum, item) => sum + (item.price * (parseInt(item.returnQty) || 0)), 0);
    };

    const handleAddItemToReturn = (item, fromInvoice = false) => {
        // Prevent duplicate items
        if (returnCart.find(i => i.id === (item._id || item.id))) {
            showToast('Item already in return list', 'info');
            return;
        }

        const newItem = {
            id: item._id || item.id,
            name: item.name,
            price: item.price,
            originalQty: fromInvoice ? item.quantity : 999, // Max for manual
            returnQty: 1,
            returnReason: returnReasons[0],
            restock: true,
            batch: '',
            invoiceMetadata: fromInvoice ? {
                id: selectedInvoice.invoiceNumber || selectedInvoice.transactionId,
                date: item.createdAt || selectedInvoice.createdAt || selectedInvoice.date,
                soldQty: item.quantity,
                soldPrice: item.price
            } : null
        };

        setReturnCart([...returnCart, newItem]);
        if (!selectedCustomer && selectedInvoice?.customer) {
            setSelectedCustomer(selectedInvoice.customer);
            setCustomerName(selectedInvoice.customer.name);
        }

        // Focus back to search
        if (returnMode === 'manual') searchInputRef.current?.focus();
        else invoiceInputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setSelectedInvoice(null);
            setSelectedIndex(0);
            return;
        }

        // If we are in invoice mode and have a selected invoice, we might be navigating its ITEMS
        if (returnMode === 'invoice' && selectedInvoice) {
            const invoiceItems = selectedInvoice.items.filter(item =>
                medicines.some(m => (m._id || m.id).toString() === (item.id || item.medicineId || item._id).toString())
            );

            if (invoiceItems.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % invoiceItems.length);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + invoiceItems.length) % invoiceItems.length);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItemToReturn(invoiceItems[selectedIndex], true);
                }
                return;
            }
        }

        const list = returnMode === 'manual' ? filteredMedicines : filteredTransactions;
        if (list.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % list.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + list.length) % list.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const item = list[selectedIndex];
            if (returnMode === 'manual') {
                handleAddItemToReturn(item);
            } else {
                setSelectedInvoice(item);
                setSelectedIndex(0); // Reset index for item navigation
            }
        }
    };

    const updateItemInCart = (id, field, value) => {
        setReturnCart(prev => prev.map(item => {
            if (item.id === id) {
                if (field === 'returnQty') {
                    const qty = Math.max(1, Math.min(item.originalQty, parseInt(value) || 0));
                    return { ...item, [field]: qty };
                }
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleProcessReturn = async () => {
        if (returnCart.length === 0) return;

        try {
            const totalRefund = calculateTotalRefund();
            const transactionData = {
                transactionId: `RET-${Date.now()}`,
                type: 'Return',
                originalTransactionId: selectedInvoice?.transactionId || null,
                customer: selectedCustomer ? {
                    id: selectedCustomer._id || selectedCustomer.id,
                    name: selectedCustomer.name,
                    phone: selectedCustomer.phone || '',
                    email: selectedCustomer.email || ''
                } : {
                    name: customerName || 'Walk-in',
                    id: null,
                    phone: '',
                    email: ''
                },
                items: returnCart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.returnQty,
                    subtotal: item.price * item.returnQty,
                    returnReason: item.returnReason,
                    restock: item.restock,
                    batchId: item.batch
                })),
                subtotal: totalRefund,
                total: totalRefund,
                paymentMethod: refundMethod,
                notes: returnNotes,
                processedBy: JSON.parse(localStorage.getItem('user'))?.username || 'Admin'
            };

            const response = await fetch(`${API_URL}/api/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(transactionData)
            });

            if (response.ok) {
                const data = await response.json();
                setReturnReceipt({
                    ...transactionData,
                    billNumber: data.billNumber,
                    invoiceNumber: data.invoiceNumber,
                    date: new Date().toISOString()
                });
                setReturnCart([]);
                setReturnNotes('');

                // Cleanup: remove the invoice from transactions list so it's gone after processing
                if (selectedInvoice) {
                    setTransactions(prev => prev.filter(tx => tx._id !== selectedInvoice._id));
                }

                setSelectedInvoice(null);
                setShowReceiptModal(true);
                showToast('Return processed successfully', 'success');
                // fetchTransactions(); // Removing this to prevent reloading if we want to keep it "cleared" locally
            } else {
                const errorData = await response.json();
                console.error('Server Error:', errorData);
                showToast(errorData.message || 'Failed to process return', 'error');
            }
        } catch (error) {
            console.error('Return Error:', error);
            showToast('Error processing return', 'error');
        }
    };

    // --- Components ---
    const ReturnItemCard = ({ item }) => (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-3 shadow-sm relative group overflow-hidden">
            <button
                onClick={() => setReturnCart(prev => prev.filter(i => i.id !== item.id))}
                className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-all"
            >
                <Trash2 size={16} />
            </button>

            <div className="flex flex-col gap-3">
                <div>
                    <h4 className="font-bold text-gray-800 pr-8">{item.name}</h4>
                    <p className="text-xs text-gray-400 font-medium">Rs. {item.price} • Max: {item.originalQty}</p>
                </div>

                {item.invoiceMetadata && (
                    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                        <div className="flex items-start gap-2 text-[10px] leading-relaxed">
                            <Info size={12} className="text-gray-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-gray-700 font-bold">Original Sale:</p>
                                <p className="text-gray-500">Invoice: {item.invoiceMetadata.id}</p>
                                <p className="text-gray-500">Date: {new Date(item.invoiceMetadata.date || Date.now()).toLocaleDateString()}</p>
                                <p className="text-gray-500">Sold: {item.invoiceMetadata.soldQty} x Rs. {item.invoiceMetadata.soldPrice}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Qty</span>
                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                            <button
                                onClick={() => updateItemInCart(item.id, 'returnQty', item.returnQty - 1)}
                                className="p-1.5 hover:text-red-600"
                            >
                                <Minus size={14} />
                            </button>
                            <input
                                type="number"
                                value={item.returnQty}
                                onChange={(e) => updateItemInCart(item.id, 'returnQty', e.target.value)}
                                className="w-8 text-center bg-transparent font-bold text-sm focus:outline-none"
                            />
                            <button
                                onClick={() => updateItemInCart(item.id, 'returnQty', item.returnQty + 1)}
                                className="p-1.5 hover:text-[#00c950]"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Line Total</p>
                        <p className="font-bold text-gray-800">Rs. {(item.price * item.returnQty).toFixed(2)}</p>
                    </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-gray-50">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Return Reason *</label>
                        <div className="relative">
                            <select
                                value={item.returnReason}
                                onChange={(e) => updateItemInCart(item.id, 'returnReason', e.target.value)}
                                className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-red-500/20 font-medium"
                            >
                                {returnReasons.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 px-1">
                        <div className="flex items-center gap-2">
                            <Package size={14} className="text-gray-400" />
                            <span className="text-[11px] font-medium text-gray-600">Restock to Inventory</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={item.restock}
                                onChange={(e) => updateItemInCart(item.id, 'restock', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00c950]"></div>
                        </label>
                    </div>

                    <div className="relative">
                        <select
                            value={item.batch}
                            onChange={(e) => updateItemInCart(item.id, 'batch', e.target.value)}
                            className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs appearance-none focus:outline-none font-medium"
                        >
                            <option value="">Select Batch (Optional)...</option>
                            {supplies.filter(s => s.medicineId === item.id).map(s => (
                                <option key={s._id} value={s._id}>{s.batchNumber} (Exp: {new Date(s.expiryDate).toLocaleDateString()})</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Process Return</h1>
                            <p className="text-gray-500 text-sm mt-1">Search for items to return to inventory</p>
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setReturnMode('manual')}
                                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${returnMode === 'manual' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Manual Return
                            </button>
                            <button
                                onClick={() => setReturnMode('invoice')}
                                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${returnMode === 'invoice' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Return by Invoice
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-6">
                        {returnMode === 'invoice' ? (
                            <>
                                <div className="flex items-center gap-3 pr-6 border-r border-gray-100">
                                    <Calendar size={18} className="text-gray-400" />
                                    <span className="text-sm font-bold text-gray-700 whitespace-nowrap">Filter by:</span>
                                    <div className="flex gap-2">
                                        {['Today', 'Yesterday', 'This Month', 'Custom'].map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setDateFilter(f)}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${dateFilter === f ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {dateFilter === 'Custom' && (
                                    <div className="flex items-center gap-2 px-6 border-r border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={customDates.start}
                                                onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                                                className="px-2 py-1 text-xs border border-gray-200 rounded focus:border-red-400 focus:outline-none"
                                            />
                                            <span className="text-gray-400 text-xs">-</span>
                                            <input
                                                type="date"
                                                value={customDates.end}
                                                onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                                                className="px-2 py-1 text-xs border border-gray-200 rounded focus:border-red-400 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="flex-1 relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={20} />
                                    <input
                                        ref={invoiceInputRef}
                                        type="text"
                                        placeholder="Search by Bill # or Customer Name..."
                                        value={invoiceSearchQuery}
                                        onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={20} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search medicine name or formula..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                                />
                            </div>
                        )}
                    </div>

                    {/* Results Area */}
                    <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-auto p-4 custom-scrollbar" id="return-results-container">
                            {returnMode === 'invoice' ? (
                                <div className="space-y-3">
                                    {filteredTransactions.length > 0 ? filteredTransactions.map((tx, idx) => (
                                        <div
                                            key={tx._id}
                                            id={`result-item-${idx}`}
                                            onClick={() => setSelectedInvoice(tx)}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedInvoice?._id === tx._id ? 'border-blue-500 bg-blue-50/10' : idx === selectedIndex ? 'border-blue-300 bg-blue-50/5 ring-1 ring-blue-100' : 'border-gray-50 hover:border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-gray-900">Bill #{tx.billNumber}</h3>
                                                        <span className="text-[10px] text-gray-400">• {new Date(tx.createdAt || tx.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <User size={12} className="text-gray-400" />
                                                        <span className="font-medium">{tx.customer?.name || 'Walk-in'}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-gray-900">Rs. {tx.total?.toFixed(2)}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold">{tx.items?.length} items</p>
                                                </div>
                                            </div>

                                            {selectedInvoice?._id === tx._id && (
                                                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {tx.items
                                                        .map((item, idx) => (
                                                            <button
                                                                key={idx}
                                                                id={selectedInvoice?._id === tx._id ? `result-item-${idx}` : undefined}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAddItemToReturn(item, true);
                                                                }}
                                                                className={`flex flex-col p-3 rounded-lg border transition-all text-left ${selectedInvoice?._id === tx._id && idx === selectedIndex ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-100' : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-sm'}`}
                                                            >
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="text-xs font-bold text-gray-800 line-clamp-1">{item.name}</span>
                                                                    <Plus size={12} className="text-blue-500" />
                                                                </div>
                                                                <span className="text-[10px] text-gray-500 font-medium">{item.quantity} units available</span>
                                                            </button>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40">
                                            <Search size={48} className="mb-4 text-gray-300" />
                                            <p className="text-lg font-bold text-gray-400">No invoices found</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredMedicines.map((m, idx) => (
                                        <div
                                            key={m._id}
                                            id={`result-item-${idx}`}
                                            onClick={() => handleAddItemToReturn(m)}
                                            className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-sm flex flex-col gap-2 ${idx === selectedIndex ? 'border-red-400 ring-2 ring-red-500/10' : 'border-gray-100 hover:border-red-200 hover:bg-red-50/10'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-gray-800 line-clamp-1">{m.name}</h3>
                                                <Plus size={16} className="text-red-400" />
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{m.formulaCode || 'Generic'}</p>
                                            <div className="flex justify-between items-end mt-2">
                                                <span className="text-xs font-bold text-gray-400">STOCK: {m.stock}</span>
                                                <span className="text-lg font-bold text-gray-900">Rs. {m.price}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Return Summary Sidebar */}
                <div className="w-[380px] flex flex-col gap-4 overflow-hidden">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden relative">
                        {/* Summary Header */}
                        <div className="p-5 border-b border-gray-100 bg-gray-50">
                            <h2 className="font-bold text-red-800 flex items-center gap-2.5">
                                <RotateCcw size={18} />
                                Return Summary
                            </h2>
                        </div>

                        {/* Customer Info (Optional) */}
                        <div className="p-5 border-b border-gray-50">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-wider">Customer (Optional)</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    value={customerName}
                                    placeholder="Walk-in Customer"
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-auto p-5 space-y-2 bg-gray-50/10 custom-scrollbar">
                            {returnCart.length > 0 ? (
                                returnCart.map((item) => <ReturnItemCard key={item.id} item={item} />)
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 mt-10">
                                    <Package size={24} className="text-gray-400 mb-4" />
                                    <p className="text-sm font-bold text-gray-400">No items selected</p>
                                </div>
                            )}
                        </div>

                        {/* Footer / Controls */}
                        <div className="p-5 bg-white border-t border-gray-100 space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block px-1">Refund Method</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setRefundMethod('Cash')}
                                            className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border-2 transition-all font-bold text-sm shadow-sm ${refundMethod === 'Cash'
                                                ? 'border-[#fb2c36] bg-red-50/50 text-[#fb2c36]'
                                                : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-200'
                                                }`}
                                        >
                                            <Banknote size={20} />
                                            Cash
                                        </button>
                                        <button
                                            onClick={() => setRefundMethod('Card')}
                                            className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border-2 transition-all font-bold text-sm shadow-sm ${refundMethod === 'Card'
                                                ? 'border-blue-500 bg-blue-50/50 text-blue-500'
                                                : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-200'
                                                }`}
                                        >
                                            <CreditCard size={20} />
                                            Card
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center py-4 px-1 border-t border-gray-50">
                                    <span className="text-sm font-bold text-gray-800">Total Refund</span>
                                    <span className="text-2xl font-bold text-red-600">
                                        <span className="text-sm mr-1">Rs.</span>
                                        {calculateTotalRefund().toFixed(2)}
                                    </span>
                                </div>

                                <button
                                    onClick={handleProcessReturn}
                                    disabled={returnCart.length === 0}
                                    className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-red-500/10 hover:bg-red-700 disabled:opacity-50 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 active:transform active:scale-[0.98]"
                                >
                                    <RotateCcw size={18} />
                                    Confirm Return
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            {
                showReceiptModal && returnReceipt && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4 print:static print:bg-white print:p-0 print:block">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none">
                            {/* Header */}
                            <div className="bg-red-600 p-4 flex justify-between items-center text-white print:hidden">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <CheckCircle2 size={20} />
                                    Return Success
                                </h2>
                                <button onClick={() => setShowReceiptModal(false)} className="hover:bg-red-700 p-1 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Receipt Content */}
                            <div className="p-6 print:p-0" id="printable-receipt">
                                <div className="text-center mb-6">
                                    <h1 className="text-2xl font-bold text-gray-800 mb-1">MedKit POS</h1>
                                    <p className="text-sm text-gray-500">Pharmacy Management System</p>
                                    <p className="text-xs text-gray-400 mt-2">{new Date(returnReceipt.date).toLocaleString()}</p>
                                    <div className="mt-2">
                                        <p className="text-xl font-bold text-gray-800">Bill #: {returnReceipt.billNumber}</p>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type: Return Voucher</p>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                {returnReceipt.customer && (
                                    <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                                        <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Customer Details</h3>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-gray-800">{returnReceipt.customer.name}</p>
                                            <p className="text-xs text-gray-600">{returnReceipt.customer.phone}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-b border-dashed border-gray-300 py-4 mb-4 space-y-3">
                                    {returnReceipt.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <div>
                                                <span className="font-medium text-gray-800">{item.name}</span>
                                                <div className="text-xs text-gray-500">
                                                    {item.quantity} x Rs. {item.price.toFixed(2)}
                                                </div>
                                                <div className="text-[10px] text-red-500 italic">Reason: {item.returnReason}</div>
                                            </div>
                                            <span className="font-medium text-gray-800">
                                                Rs. {item.subtotal.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2 text-sm mb-6">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>Rs. {returnReceipt.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200">
                                        <span>Total Refund</span>
                                        <span className="text-red-600 text-xl font-bold">Rs. {returnReceipt.total.toFixed(2)}</span>
                                    </div>

                                    <div className="pt-4 mt-4 border-t border-dashed border-gray-300">
                                        <div className="flex justify-between text-gray-800 text-sm font-medium">
                                            <span>Refund Method</span>
                                            <span>{returnReceipt.paymentMethod || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer for Print */}
                                <div className="hidden print:block text-center text-xs text-gray-500 mt-8">
                                    <p>Thank you for your patience!</p>
                                    <p>Inventory has been updated.</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 print:hidden">
                                <button
                                    onClick={() => setShowReceiptModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Done
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                                >
                                    <Printer size={18} />
                                    Print Receipt
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div >
    );
};

export default Return;
