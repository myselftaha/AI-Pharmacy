
import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const SupplyTable = ({ supplies, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full">
            <div
                className="overflow-auto flex-1 scrollbar-hide"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr className="text-[10px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Invoice #</th>
                            <th className="px-6 py-3">Supplier</th>
                            <th className="px-6 py-3">Medicine</th>
                            <th className="px-6 py-3">Batch</th>
                            <th className="px-6 py-3">Cost Price</th>
                            <th className="px-6 py-3">Purchased Qty</th>
                            <th className="px-6 py-3">Expiry</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {supplies.map((supply) => (
                            <tr key={supply._id || supply.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {new Date(supply.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-800 whitespace-nowrap">
                                    {supply.purchaseInvoiceNumber}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                    {supply.supplierName}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{supply.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{supply.batchNumber}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-800 whitespace-nowrap">
                                    Rs. {(supply.purchaseCost * (supply.packSize || 1)).toFixed(2)}
                                    <div className="text-[9px] text-gray-400 font-normal uppercase">Per Pack</div>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-800 whitespace-nowrap">
                                    {supply.quantity} <span className="text-[10px] text-gray-400 font-normal uppercase">Packs</span>
                                </td>
                                <td className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${supply.expiryDate && new Date(supply.expiryDate) <= new Date(new Date().setMonth(new Date().getMonth() + 3))
                                    ? 'text-red-500'
                                    : 'text-gray-900'
                                    }`}>
                                    {supply.expiryDate ? new Date(supply.expiryDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(supply)}
                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(supply)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {supplies.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No purchase records found. Add a new supply entry to get started!
                </div>
            )}
        </div>
    );
};

export default SupplyTable;
