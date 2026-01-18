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
                        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total Purchases</span>
                            </div>
                            <div className="text-2xl font-bold text-red-500">Rs {ledgerData?.stats?.totalPurchased?.toLocaleString() || '150,000'}</div>
                        </div>

                        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total Payments</span>
                            </div>
                            <div className="text-2xl font-bold text-green-500">Rs {ledgerData?.stats?.totalPaid?.toLocaleString() || '25,000'}</div>
                        </div>

                        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-2 h-2 rounded-full ${(ledgerData?.stats?.balance || 0) === 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Current Balance</span>
                            </div>
                            <div className={`text-2xl font-bold ${(ledgerData?.stats?.balance || 0) === 0 ? 'text-green-500' : 'text-red-500'}`}>
                                Rs {ledgerData?.stats?.balance?.toLocaleString() || '0'}
                            </div>
                        </div>
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
                                            {ledgerData?.ledger?.length > 0 ? (
                                                ledgerData.ledger.map((entry, index) => (
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
                                                        <td className="px-6 py-4 text-sm text-gray-900">
                                                            {entry.type === 'Invoice'
                                                                ? `Invoice #INV-2024-001 - Me...`
                                                                : entry.note || 'Payment via Bank Transfer'}
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
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                                        <p className="text-sm font-medium">No transactions recorded</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
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
                                            {purchaseOrders.length > 0 ? (
                                                purchaseOrders.map((order, index) => (
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
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                                        <p className="text-sm font-medium">No purchase orders found</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
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
