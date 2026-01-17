import React, { useState } from 'react';
import { Eye, Printer, Repeat, Ban, AlertTriangle, MoreVertical, Copy } from 'lucide-react';

const TransactionTable = ({ transactions, onViewDetails, onVoid, onReturn, onDuplicate, onPrint }) => {
    const [actionOpenId, setActionOpenId] = useState(null);

    const toggleActionMenu = (id) => {
        setActionOpenId(actionOpenId === id ? null : id);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper to determine status color
    const getStatusStyle = (status) => {
        if (status === 'Voided') return 'bg-gray-100 text-gray-500 line-through';
        return 'bg-green-50 text-green-700'; // Posted
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
            {transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-lg">No transactions found</p>
                    <p className="text-sm mt-2">Try adjusting your filters or search query</p>
                </div>
            ) : (
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr className="text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Bill #</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4 text-center">Items</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-right">Tax</th>
                                <th className="px-6 py-4 text-right">Net</th>
                                <th className="px-6 py-4">Payment</th>
                                <th className="px-6 py-4">By</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map((tx) => {
                                const isVoided = tx.status === 'Voided';
                                const isReturn = tx.type === 'Return';
                                const itemCount = tx.items.reduce((sum, i) => sum + (i.quantity || 0), 0);
                                const netAmount = tx.total - (tx.tax || 0);

                                return (
                                    <tr key={tx._id} className={`hover:bg-gray-50 transition-colors ${isVoided ? 'bg-gray-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${isVoided ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                                                {tx.status || 'Posted'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 text-sm">
                                            <span className="font-bold text-lg">{tx.billNumber ? `#${tx.billNumber}` : 'N/A'}</span>
                                            {tx.invoiceNumber && (
                                                <span className="block text-[10px] text-gray-500 font-medium mt-0.5 tracking-wider">{tx.invoiceNumber}</span>
                                            )}
                                            {tx.originalBillNumber && (
                                                <span className="block text-[10px] text-blue-500 font-bold mt-1">Ref: Bill #{tx.originalBillNumber}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${isReturn ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm">{itemCount}</td>

                                        <td className={`px-6 py-4 text-right font-bold text-sm ${isVoided ? 'text-gray-400 line-through' : isReturn ? 'text-red-600' : 'text-gray-900'}`}>
                                            Rs. {Math.abs(tx.total).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs text-gray-500">
                                            {tx.tax ? `Rs. ${tx.tax.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs text-gray-600 font-medium">
                                            Rs. {Math.abs(netAmount).toFixed(2)}
                                        </td>

                                        <td className="px-6 py-4 text-xs text-gray-600">{tx.paymentMethod}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{tx.processedBy}</td>

                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={() => toggleActionMenu(tx._id)}
                                                className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors"
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {/* Action Dropdown */}
                                            {actionOpenId === tx._id && (
                                                <div
                                                    className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 flex flex-col py-1 text-left"
                                                    onMouseLeave={() => setActionOpenId(null)}
                                                >
                                                    <button
                                                        onClick={() => { onViewDetails(tx); setActionOpenId(null); }}
                                                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <Eye size={14} /> View Details
                                                    </button>
                                                    <button
                                                        onClick={() => { onPrint(tx); setActionOpenId(null); }}
                                                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <Printer size={14} /> Reprint Receipt
                                                    </button>
                                                    {!isVoided && !isReturn && (
                                                        <>
                                                            <button
                                                                onClick={() => { onReturn(tx); setActionOpenId(null); }}
                                                                className="px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                                                            >
                                                                <Repeat size={14} /> Return Sale
                                                            </button>
                                                            <button
                                                                onClick={() => { onDuplicate(tx); setActionOpenId(null); }}
                                                                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                                            >
                                                                <Copy size={14} /> Duplicate
                                                            </button>
                                                        </>
                                                    )}

                                                    {!isVoided && (
                                                        <button
                                                            onClick={() => { onVoid(tx); setActionOpenId(null); }}
                                                            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 mt-1"
                                                        >
                                                            <Ban size={14} /> Void Transaction
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TransactionTable;
