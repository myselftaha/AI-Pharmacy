import React from 'react';
import { X, User, Calendar, DollarSign, ShoppingBag, Tag } from 'lucide-react';

const TransactionDetailsModal = ({ isOpen, onClose, transaction }) => {
    if (!isOpen || !transaction) return null;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 md:p-8">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {transaction.billNumber ? `Bill #${transaction.billNumber}` : 'Transaction Details'}
                        </h2>
                        {transaction.invoiceNumber && (
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">Invoice: {transaction.invoiceNumber}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Customer and Date Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <User size={18} />
                                <span className="text-sm font-medium">Customer</span>
                            </div>
                            <p className="font-bold text-gray-800">{transaction.customer.name}</p>
                            {transaction.customer.email && (
                                <p className="text-sm text-gray-500 mt-1">{transaction.customer.email}</p>
                            )}
                            {transaction.customer.phone && (
                                <p className="text-sm text-gray-500">{transaction.customer.phone}</p>
                            )}
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <Calendar size={18} />
                                <span className="text-sm font-medium">Date & Time</span>
                            </div>
                            <p className="font-bold text-gray-800">{formatDate(transaction.createdAt)}</p>
                            <p className="text-sm text-gray-500 mt-1">Processed by: {transaction.processedBy}</p>
                        </div>
                    </div>

                    {/* Items */}
                    <div>
                        <div className="flex items-center gap-2 text-gray-700 mb-3">
                            <ShoppingBag size={20} />
                            <h3 className="font-bold text-lg">
                                {transaction.type === 'Return' ? 'Items Returned' : 'Items Purchased'}
                            </h3>
                        </div>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr className="text-xs font-bold text-gray-500 uppercase">
                                        <th className="px-4 py-3 text-left">Item</th>
                                        <th className="px-4 py-3 text-center">Quantity</th>
                                        <th className="px-4 py-3 text-right">Price</th>
                                        <th className="px-4 py-3 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {transaction.items.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">Rs. {item.price.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-800">Rs. {item.subtotal.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Voucher Info (if applicable) */}
                    {transaction.voucher && transaction.voucher.code && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-yellow-800 mb-2">
                                <Tag size={18} />
                                <span className="font-bold">Voucher Applied</span>
                            </div>
                            <div className="text-sm text-yellow-700">
                                <p><span className="font-medium">Code:</span> {transaction.voucher.code}</p>
                                <p>
                                    <span className="font-medium">Discount:</span>{' '}
                                    {transaction.voucher.discountType === 'Percentage'
                                        ? `${transaction.voucher.discountValue}%`
                                        : `Rs. ${transaction.voucher.discountValue}`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Total Breakdown */}
                    <div className={`rounded-lg p-4 ${transaction.type === 'Return'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-200'
                        }`}>
                        <div className={`flex items-center gap-2 mb-3 ${transaction.type === 'Return' ? 'text-red-800' : 'text-green-800'
                            }`}>
                            <DollarSign size={20} />
                            <h3 className="font-bold text-lg">Payment Summary</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-gray-700">
                                <span>Subtotal:</span>
                                <span className="font-medium">Rs. {transaction.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Platform Fee:</span>
                                <span className="font-medium">Rs. {transaction.platformFee.toFixed(2)}</span>
                            </div>
                            {transaction.discount > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Discount:</span>
                                    <span className="font-medium">-Rs. {transaction.discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className={`border-t pt-2 mt-2 ${transaction.type === 'Return' ? 'border-red-300' : 'border-green-300'
                                }`}>
                                <div className={`flex justify-between font-bold text-lg ${transaction.type === 'Return' ? 'text-red-800' : 'text-green-800'
                                    }`}>
                                    <span>{transaction.type === 'Return' ? 'Total Refund:' : 'Total Paid:'}</span>
                                    <span>Rs. {Math.abs(transaction.total).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 mt-2">
                                <span>Payment Method:</span>
                                <span className="font-medium">{transaction.paymentMethod}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailsModal;
