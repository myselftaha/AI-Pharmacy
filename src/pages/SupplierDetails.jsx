import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, TrendingDown, Package, Plus, FileText, AlertCircle, Clock, Calendar, RotateCcw, DollarSign } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import RecordPaymentModal from '../components/suppliers/RecordPaymentModal';
import InvoiceDetailsModal from '../components/invoices/InvoiceDetailsModal';
import PurchaseReturnModal from '../components/suppliers/PurchaseReturnModal';
import CashRefundModal from '../components/suppliers/CashRefundModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import API_URL from '../config/api';


const SupplierDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [supplier, setSupplier] = useState(null);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({
        totalPurchased: 0,
        totalPaid: 0,
        cashPayments: 0,
        totalReturns: 0,
        balance: 0,
        supplierCredit: 0,
        totalSKUs: 0,
        totalQuantity: 0,
        overdueAmount: 0,
        dueIn15Days: 0
    });
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false); // New State
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [filter, setFilter] = useState('All');
    const [monthFilter, setMonthFilter] = useState('All');

    // Confirmation Modal States
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'warning',
        confirmText: 'Confirm',
        isLoading: false
    });

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const fetchSupplierDetails = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/suppliers/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch supplier');

            const responseData = await response.json();
            const supplierInfo = responseData.supplier || responseData;

            setSupplier(supplierInfo);
            setHistory(responseData.ledger || []);
            setStats(responseData.stats || {
                totalPurchased: 0,
                totalPaid: 0,
                balance: supplierInfo.totalPayable || 0,
                totalSKUs: 0,
                totalQuantity: 0,
                overdueAmount: 0,
                dueIn15Days: 0
            });
            setTopProducts(responseData.topProducts || []);
            setLoading(false);

        } catch (err) {
            console.error(err);
            showToast('Failed to fetch supplier details', 'error');
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchSupplierDetails();
    }, [id, fetchSupplierDetails]);

    const handleRecordPayment = async (paymentData) => {
        try {
            showToast('Payment recorded successfully!', 'success');
            setIsPaymentModalOpen(false);
            fetchSupplierDetails();
        } catch (error) {
            console.error('Error recording payment:', error);
            showToast('Error recording payment', 'error');
        }
    };

    const handleCashRefund = async (amount) => {
        try {
            const response = await fetch(`${API_URL}/api/suppliers/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    supplierId: id,
                    amount: amount
                })
            });

            if (response.ok) {
                showToast('Cash refund recorded successfully!', 'success');
                setIsRefundModalOpen(false);
                fetchSupplierDetails();
            } else {
                const error = await response.json();
                showToast(error.message || 'Failed to record refund', 'error');
            }
        } catch (error) {
            console.error('Error recording refund:', error);
            showToast('Error recording refund', 'error');
        }
    };

    const handleVoidInvoice = (invoice) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Void Invoice',
            message: `Are you sure you want to void/delete invoice ${invoice.ref}? This will delete ${invoice.items ? invoice.items.length : 1} items from stock.`,
            confirmText: 'Yes, Void Invoice',
            type: 'danger',
            onConfirm: () => confirmVoidInvoice(invoice)
        });
    };

    const confirmVoidInvoice = async (invoice) => {
        try {
            setConfirmConfig(prev => ({ ...prev, isLoading: true }));
            if (invoice.type === 'Invoice') {
                await fetch(`${API_URL}/api/supplies/${invoice.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
            } else if (invoice.items) {
                for (const item of invoice.items) {
                    await fetch(`${API_URL}/api/supplies/${item.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                }
            }

            showToast('Invoice voided successfully', 'success');
            setIsInvoiceModalOpen(false);
            setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            fetchSupplierDetails();
        } catch (error) {
            console.error('Error voiding invoice:', error);
            showToast('Failed to void invoice', 'error');
        } finally {
            setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handlePaySelected = async (itemsToPay) => {
        setIsInvoiceModalOpen(false);
        setSelectedInvoice(prev => ({ ...prev, selectedItems: itemsToPay }));
        setIsPaymentModalOpen(true);
    };

    const handleClearHistory = () => {
        setConfirmConfig({
            isOpen: true,
            title: 'Clear All Transactions?',
            message: `WARNING: This will permanently delete ALL transactions for ${supplier.name}. This includes all invoices, payments, and returns. The supplier will be reset to zero balance. This action cannot be undone.`,
            confirmText: 'Yes, Clear Everything',
            type: 'danger',
            onConfirm: confirmClearHistory
        });
    };

    const confirmClearHistory = async () => {
        try {
            setConfirmConfig(prev => ({ ...prev, isLoading: true }));
            const response = await fetch(`${API_URL}/api/suppliers/${id}/clear-history`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                showToast('Supplier history cleared successfully!', 'success');
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                fetchSupplierDetails();
            } else {
                const error = await response.json();
                showToast(error.message || 'Failed to clear history', 'error');
            }
        } catch (error) {
            console.error('Error clearing history:', error);
            showToast('Error clearing supplier history', 'error');
        } finally {
            setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        }
    };

    const activeList = useMemo(() => {
        let list = history;

        if (filter !== 'All') {
            list = list.filter(item => {
                if (filter === 'Invoice') return item.type === 'Invoice';
                if (filter === 'Payment') return item.type === 'Payment' || item.type === 'Debit Note';
                return true;
            });
        }

        if (monthFilter !== 'All') {
            list = list.filter(item => {
                const date = new Date(item.date);
                return date.toLocaleString('default', { month: 'long' }) === monthFilter;
            });
        }

        return list;
    }, [filter, monthFilter, history]);

    const handleRowClick = (item) => {
        if (item.type === 'Invoice') {
            // Group all items belonging to this invoice reference
            // Only group if there is a valid reference (not N/A)
            let invoiceItems = [item];

            if (item.ref && item.ref !== 'N/A') {
                invoiceItems = history.filter(i => i.type === 'Invoice' && i.ref === item.ref);
            }

            // Calculate aggregated totals
            const totalAmount = invoiceItems.reduce((sum, i) => sum + (i.amount || 0), 0);
            const totalPaid = invoiceItems.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
            const totalDue = totalAmount - totalPaid;

            // Determine aggregate status
            let status = 'Posted';
            const allPaid = invoiceItems.every(i => i.paymentStatus === 'Paid');
            const somePaid = invoiceItems.some(i => i.paymentStatus === 'Paid' || i.paymentStatus === 'Partial');

            if (allPaid) status = 'Settled';
            else if (somePaid) status = 'Partially Paid';

            const invoiceData = {
                ...item,
                items: invoiceItems, // Modal expects this array
                amount: totalAmount,
                paid: totalPaid,
                due: totalDue,
                status: status
            };

            setSelectedInvoice(invoiceData);
            setIsInvoiceModalOpen(true);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (!supplier) return <div className="p-8 text-center text-red-500">Supplier not found</div>;

    return (
        <div className="flex flex-col h-full space-y-6 overflow-y-auto pb-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/suppliers')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{supplier.name}</h1>
                        <p className="text-gray-500 text-sm">
                            {supplier.contactPerson} • {supplier.phone}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleClearHistory}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                        title="Clear all transactions and reset supplier"
                    >
                        <RotateCcw size={18} />
                        <span>Clear History</span>
                    </button>
                    <button
                        onClick={() => setIsReturnModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg font-bold hover:bg-red-200 transition-colors"
                    >
                        <span>Return / Debit Note</span>
                    </button>
                    <button
                        onClick={() => navigate('/medicines', { state: { supplierId: supplier._id, supplierName: supplier.name, openAddSupply: true } })}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={18} />
                        <span>Create Invoice</span>
                    </button>
                </div>
            </div>

            {/* Top Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Total Purchased */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Package size={20} />
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 bg-gray-50 text-gray-600 rounded-lg">Purchases</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Rs. {stats.totalPurchased?.toLocaleString()}</h3>
                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                            <span>{stats.totalQuantity} items</span>
                            <span>•</span>
                            <span>{stats.totalSKUs} SKUs</span>
                        </div>
                    </div>
                </div>

                {/* 2. Total Paid (Cash/Bank Only) */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <TrendingDown size={20} />
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 bg-gray-50 text-gray-600 rounded-lg">Cash Payments</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Rs. {stats.totalPaid?.toLocaleString()}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Cash/Bank/Check only
                            {stats.totalReturns > 0 && ` • Returns: Rs. ${stats.totalReturns?.toLocaleString()}`}
                        </p>
                    </div>
                </div>

                {/* 3. Net Payable / Supplier Credit */}
                <div className={`p-5 rounded-2xl border shadow-sm ring-1 ${stats.balance > 0 ? 'bg-white border-red-100 ring-red-50' :
                    stats.balance < 0 ? 'bg-white border-blue-100 ring-blue-50' :
                        'bg-white border-green-100 ring-green-50'
                    }`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className={`p-2 rounded-lg ${stats.balance > 0 ? 'bg-red-50 text-red-600' :
                            stats.balance < 0 ? 'bg-blue-50 text-blue-600' :
                                'bg-green-50 text-green-600'
                            }`}>
                            <Wallet size={20} />
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${stats.balance > 0 ? 'bg-red-50 text-red-600' :
                            stats.balance < 0 ? 'bg-blue-50 text-blue-600' :
                                'bg-green-50 text-green-600'
                            }`}>
                            {stats.balance > 0 ? 'Net Payable' : stats.balance < 0 ? 'Supplier Credit' : 'Net Payable'}
                        </span>
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold ${stats.balance > 0 ? 'text-red-600' :
                            stats.balance < 0 ? 'text-blue-600' :
                                'text-green-600'
                            }`}>
                            Rs. {Math.abs(stats.balance || 0).toLocaleString()}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.balance > 0 ? 'You owe them' :
                                stats.balance < 0 ? 'They owe you (Credit)' :
                                    'Fully Settled ✓'}
                        </p>
                        {/* Cash Refund Button */}
                        {stats.storedCredit > 0 && (
                            <button
                                onClick={() => setIsRefundModalOpen(true)}
                                className="w-full mt-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                                <DollarSign size={14} />
                                Record Cash Refund
                            </button>
                        )}
                    </div>
                </div>

                {/* 4. Payment Aging (New) */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                            <Clock size={20} />
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 bg-gray-50 text-gray-600 rounded-lg">Aging</span>
                    </div>
                    <div className="space-y-1">
                        {stats.overdueAmount > 0 && (
                            <div className="flex justify-between text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded">
                                <span>Overdue</span>
                                <span>Rs. {stats.overdueAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs text-gray-600 px-2 py-1">
                            <span>Due (15 Days)</span>
                            <span className="font-medium">Rs. {stats.dueIn15Days.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Products Section (New) */}
            {topProducts.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Package size={16} className="text-blue-500" />
                        Top 5 Products Purchased (Last Price Track)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {topProducts.map((prod, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p className="font-bold text-gray-800 text-sm truncate" title={prod.name}>{prod.name}</p>
                                <div className="flex justify-between items-end mt-2">
                                    <div>
                                        <p className="text-xs text-gray-500">Last Cost</p>
                                        <p className="font-mono font-bold text-blue-600">Rs.{prod.lastPrice}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Total Qty</p>
                                        <p className="font-bold text-gray-700">{prod.totalQty}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Transaction History */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">
                        {filter === 'Invoice' ? 'Invoices' : filter === 'Payment' ? 'Payments' : 'Transaction History'}
                    </h3>
                    <div className="flex gap-3">
                        <select
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="px-4 py-1 text-sm font-medium border border-gray-200 rounded-lg outline-none focus:border-green-500 bg-white text-gray-700 cursor-pointer"
                        >
                            <option value="All">All Months</option>
                            {months.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>

                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {['All', 'Invoice', 'Payment'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-1 text-sm font-medium rounded-md transition-all ${filter === f ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {f === 'All' ? 'All' : f + 's'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                {filter === 'All' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bill/Credit</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Payment/Debit</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-blue-600 bg-blue-50">Balance</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {activeList.length > 0 ? (
                                activeList.map((item) => (
                                    <tr
                                        key={item.id}
                                        className={`hover:bg-gray-50 transition-colors ${item.type === 'Invoice' ? 'cursor-pointer' : ''}`}
                                        onClick={() => handleRowClick(item)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(item.date).toLocaleDateString()}
                                        </td>

                                        {filter === 'All' && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.type === 'Invoice' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                        )}

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {item.type === 'Invoice' ? (
                                                <div title={item.name}>
                                                    <span className="text-blue-600 font-bold block">{item.ref}</span>
                                                    <span className="text-xs text-gray-400 truncate max-w-[150px] block">{item.name}</span>
                                                </div>
                                            ) : item.ref}
                                        </td>

                                        {/* Due Date Column */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {item.dueDate ? (
                                                <span className={`flex items-center gap-1 ${new Date(item.dueDate) < new Date() && item.status !== 'Settled' ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                                    {new Date(item.dueDate).toLocaleDateString()}
                                                    {new Date(item.dueDate) < new Date() && item.status !== 'Settled' && <AlertCircle size={14} />}
                                                </span>
                                            ) : '-'}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.type === 'Invoice' ? (
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'Settled' ? 'bg-green-100 text-green-700' :
                                                    item.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                    Posted
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                                            {item.type === 'Invoice' ? `Rs. ${item.amount?.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                                            {(item.type === 'Payment' || item.type === 'Debit Note') ? `Rs. ${item.amount?.toLocaleString()}` : '-'}
                                        </td>

                                        {/* Running Balance */}
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${(item.runningBalance || 0) === 0 ? 'text-green-600 bg-green-50' :
                                            (item.runningBalance || 0) > 0 ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'
                                            }`}>
                                            {item.runningBalance < 0 ? `(${Math.abs(item.runningBalance).toLocaleString()})` : `Rs. ${item.runningBalance?.toLocaleString()}`}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {item.type === 'Invoice' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}
                                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="View Details"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                                                <FileText size={32} />
                                            </div>
                                            <p className="font-medium">No transactions found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <RecordPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onConfirm={handleRecordPayment}
                supplierBalance={stats.balance}
                creditBalance={stats.storedCredit} // Pass stored credit
                supplierId={id}
                selectedInvoice={selectedInvoice}
            />

            <PurchaseReturnModal
                isOpen={isReturnModalOpen}
                onClose={() => setIsReturnModalOpen(false)}
                supplierId={supplier?._id}
                supplierName={supplier?.name}
                onConfirm={async (data) => {
                    try {
                        const response = await fetch(`${API_URL}/api/suppliers/return`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify(data)
                        });

                        if (response.ok) {
                            showToast('Purchase Return processed successfully!', 'success');
                            setIsReturnModalOpen(false);
                            fetchSupplierDetails();
                        } else {
                            showToast('Failed to process return', 'error');
                        }
                    } catch (error) {
                        console.error('Error processing return:', error);
                        showToast('Error processing return', 'error');
                    }
                }}
            />

            <CashRefundModal
                isOpen={isRefundModalOpen}
                onClose={() => setIsRefundModalOpen(false)}
                onConfirm={handleCashRefund}
                creditBalance={stats.storedCredit || 0}
                supplierName={supplier.name}
            />

            <InvoiceDetailsModal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                invoice={selectedInvoice}
                onVoid={handleVoidInvoice}
                onPaySelected={handlePaySelected}
            />

            <ConfirmationModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                type={confirmConfig.type}
                isLoading={confirmConfig.isLoading}
            />
        </div>
    );
};

export default SupplierDetails;
