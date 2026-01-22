import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import API_URL from '../../config/api';
import { useToast } from '../../context/ToastContext';
import RecordPaymentModal from './RecordPaymentModal';
import ReceiveStockModal from './ReceiveStockModal';
import PurchaseOrderModal from './PurchaseOrderModal';
import { ShoppingCart, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import ConfirmationModal from '../common/ConfirmationModal';

const DistributorLedgerModal = ({ isOpen, onClose, supplier, onUpdate }) => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('ledger');
    const [ledgerData, setLedgerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
    const [isReceiveStockOpen, setIsReceiveStockOpen] = useState(false);
    const [isPurchaseOrderOpen, setIsPurchaseOrderOpen] = useState(false);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderToCancel, setOrderToCancel] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    // Pagination and Filtering State
    const [currentPage, setCurrentPage] = useState(1);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const itemsPerPage = 10;

    const handlePaymentSuccess = () => {
        fetchLedger();
        setIsRecordPaymentOpen(false);
        if (onUpdate) onUpdate();
    };

    useEffect(() => {
        if (isOpen && supplier) {
            fetchLedger();
            fetchPurchaseOrders();
        }
    }, [isOpen, supplier]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/suppliers/${supplier._id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setLedgerData(data);
        } catch (error) {
            console.error('Error fetching ledger:', error);
            showToast('Failed to fetch ledger details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchPurchaseOrders = async () => {
        try {
            const response = await fetch(`${API_URL}/api/purchase-orders/supplier/${supplier._id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setPurchaseOrders(data);
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
        }
    };

    const handleCancelOrderClick = (orderId) => {
        setOrderToCancel(orderId);
        setIsCancelConfirmOpen(true);
    };

    const confirmCancelOrder = async () => {
        if (!orderToCancel) return;
        try {
            setCancelling(true);
            const response = await fetch(`${API_URL}/api/purchase-orders/${orderToCancel}/cancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                showToast('Order cancelled successfully', 'success');
                fetchPurchaseOrders();
                setIsCancelConfirmOpen(false);
                setOrderToCancel(null);
            } else {
                showToast('Failed to cancel order', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        } finally {
            setCancelling(false);
        }
    };

    const handleReceiveOrder = (order) => {
        setSelectedOrder(order);
        setIsReceiveStockOpen(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Distributor Ledger</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Financial history for {supplier.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total Purchases</span>
                            </div>
                            <div className="text-2xl font-bold text-red-500 truncate">Rs {ledgerData?.stats?.totalPurchased?.toLocaleString() || '0'}</div>
                        </div>

                        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total Payments</span>
                            </div>
                            <div className="text-2xl font-bold text-green-500 truncate">Rs {ledgerData?.stats?.totalPaid?.toLocaleString() || '0'}</div>
                        </div>

                        <div className={`bg-white p-5 rounded-lg border shadow-sm flex flex-col justify-between transition-colors ${(ledgerData?.stats?.balance || 0) < 0
                                ? 'border-blue-200 bg-blue-50/30'
                                : 'border-gray-200'
                            }`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-2 h-2 rounded-full ${(ledgerData?.stats?.balance || 0) < 0 ? 'bg-blue-500' :
                                        (ledgerData?.stats?.balance || 0) === 0 ? 'bg-green-500' : 'bg-red-500'
                                    }`}></div>
                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    {(ledgerData?.stats?.balance || 0) < 0 ? 'Current Credit' : 'Current Balance'}
                                </span>
                            </div>
                            <div className={`text-2xl font-bold ${(ledgerData?.stats?.balance || 0) < 0 ? 'text-blue-600' :
                                    (ledgerData?.stats?.balance || 0) === 0 ? 'text-green-500' : 'text-red-500'
                                } truncate`}>
                                Rs {Math.abs(ledgerData?.stats?.balance || 0).toLocaleString()}
                                {(ledgerData?.stats?.balance || 0) < 0 && <span className="text-xs ml-1 font-normal">(Cr)</span>}
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 flex flex-wrap items-center gap-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">From:</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setCurrentPage(1); }}
                                className="text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">To:</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setCurrentPage(1); }}
                                className="text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500"
                            />
                        </div>
                        <button
                            onClick={() => { setDateRange({ start: '', end: '' }); setCurrentPage(1); }}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                            Reset Filters
                        </button>
                    </div>

                    {/* Tabs and Record Payment Button */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex bg-white border border-gray-200 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('ledger')}
                                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'ledger'
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Ledger Entries
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'orders'
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Purchase Orders
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsPurchaseOrderOpen(true)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
                            >
                                <ShoppingCart size={18} />
                                New Order
                            </button>
                            <button
                                onClick={() => setIsRecordPaymentOpen(true)}
                                className="flex items-center gap-2 bg-[#00c950] hover:bg-[#00b347] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
                            >
                                <Plus size={18} />
                                Record Payment
                            </button>
                        </div>
                    </div>

                    {/* Content Section */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00c950]"></div>
                            <p className="text-sm text-gray-500 mt-4">Loading ledger...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            {activeTab === 'ledger' ? (
                                <div className="overflow-x-auto">
                                    <div className="min-h-[400px]">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Debit</th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Credit</th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(() => {
                                                    const filtered = (ledgerData?.ledger || []).filter(entry => {
                                                        const date = new Date(entry.date);
                                                        const start = dateRange.start ? new Date(dateRange.start) : null;
                                                        const end = dateRange.end ? new Date(dateRange.end) : null;
                                                        if (start && date < start) return false;
                                                        if (end) {
                                                            const adjustedEnd = new Date(end);
                                                            adjustedEnd.setHours(23, 59, 59, 999);
                                                            if (date > adjustedEnd) return false;
                                                        }
                                                        return true;
                                                    });

                                                    const totalPages = Math.ceil(filtered.length / itemsPerPage);
                                                    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                                                    if (paginated.length === 0) {
                                                        return (
                                                            <tr>
                                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                                                    <p className="text-sm font-medium">No transactions match your filters</p>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    return (
                                                        <>
                                                            {paginated.map((entry, index) => (
                                                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                                        {new Date(entry.date).toLocaleDateString()}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${entry.type === 'Invoice'
                                                                            ? 'bg-red-100 text-red-700'
                                                                            : 'bg-green-100 text-green-700'
                                                                            }`}>
                                                                            {entry.type === 'Invoice' ? 'Purchase' : 'Payment'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-[200px] truncate">
                                                                        {entry.description || entry.note || (entry.type === 'Invoice' ? `Purchase Order Receipt` : 'Payment')}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-right font-medium text-red-500">
                                                                        {entry.type === 'Invoice' ? `Rs ${entry.amount.toLocaleString()}` : '-'}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                                                                        {entry.type !== 'Invoice' ? `Rs ${entry.amount.toLocaleString()}` : '-'}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                                                                        Rs {entry.runningBalance?.toLocaleString() || '0'}
                                                                    </td>
                                                                </tr>
                                                            ))}

                                                            {/* Pagination UI */}
                                                            {totalPages > 1 && (
                                                                <tr>
                                                                    <td colSpan="6" className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-xs text-gray-500">
                                                                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
                                                                            </span>
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    disabled={currentPage === 1}
                                                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                                                    className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-white disabled:opacity-50"
                                                                                >
                                                                                    Previous
                                                                                </button>
                                                                                <button
                                                                                    disabled={currentPage === totalPages}
                                                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                                                    className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-white disabled:opacity-50"
                                                                                >
                                                                                    Next
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className="min-h-[400px]">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order #</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(() => {
                                                    const filtered = purchaseOrders.filter(order => {
                                                        const date = new Date(order.createdAt);
                                                        const start = dateRange.start ? new Date(dateRange.start) : null;
                                                        const end = dateRange.end ? new Date(dateRange.end) : null;
                                                        if (start && date < start) return false;
                                                        if (end) {
                                                            const adjustedEnd = new Date(end);
                                                            adjustedEnd.setHours(23, 59, 59, 999);
                                                            if (date > adjustedEnd) return false;
                                                        }
                                                        return true;
                                                    });

                                                    const totalPages = Math.ceil(filtered.length / itemsPerPage);
                                                    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                                                    if (paginated.length === 0) {
                                                        return (
                                                            <tr>
                                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                                                    <p className="text-sm font-medium">No orders match your filters</p>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    return (
                                                        <>
                                                            {paginated.map((order, index) => (
                                                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                                        #{order._id?.slice(-6).toUpperCase()}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                                        {order.items?.length || 0} items
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${order.status === 'Received' ? 'bg-green-100 text-green-700' :
                                                                            order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                                                'bg-amber-100 text-amber-700'
                                                                            }`}>
                                                                            {order.status || 'Pending'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                                                                        Rs {order.total?.toLocaleString() || 0}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            {order.status === 'Pending' && (
                                                                                <>
                                                                                    <button
                                                                                        onClick={() => handleReceiveOrder(order)}
                                                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                                        title="Receive Stock"
                                                                                    >
                                                                                        <CheckCircle size={18} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleCancelOrderClick(order._id)}
                                                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                                        title="Cancel Order"
                                                                                    >
                                                                                        <XCircle size={18} />
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}

                                                            {/* Pagination UI */}
                                                            {totalPages > 1 && (
                                                                <tr>
                                                                    <td colSpan="6" className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-xs text-gray-500">
                                                                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
                                                                            </span>
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    disabled={currentPage === 1}
                                                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                                                    className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-white disabled:opacity-50"
                                                                                >
                                                                                    Previous
                                                                                </button>
                                                                                <button
                                                                                    disabled={currentPage === totalPages}
                                                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                                                    className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-white disabled:opacity-50"
                                                                                >
                                                                                    Next
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <RecordPaymentModal
                isOpen={isRecordPaymentOpen}
                onClose={() => setIsRecordPaymentOpen(false)}
                supplier={supplier}
                onSuccess={handlePaymentSuccess}
            />

            <PurchaseOrderModal
                isOpen={isPurchaseOrderOpen}
                onClose={() => setIsPurchaseOrderOpen(false)}
                supplier={supplier}
                onSuccess={fetchPurchaseOrders}
            />

            <ReceiveStockModal
                isOpen={isReceiveStockOpen}
                onClose={() => setIsReceiveStockOpen(false)}
                order={selectedOrder}
                onSuccess={() => {
                    fetchPurchaseOrders();
                    fetchLedger();
                }}
            />

            <ConfirmationModal
                isOpen={isCancelConfirmOpen}
                onClose={() => {
                    setIsCancelConfirmOpen(false);
                    setOrderToCancel(null);
                }}
                onConfirm={confirmCancelOrder}
                title="Cancel Purchase Order"
                message="Are you sure you want to cancel this order? This action will set the order status to 'Cancelled' and cannot be reversed."
                confirmText="Yes, Cancel Order"
                cancelText="Keep Order"
                type="danger"
                isLoading={cancelling}
            />
        </div>
    );
};

export default DistributorLedgerModal;
