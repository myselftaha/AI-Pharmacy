import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const MedicineTable = ({ medicines, onEdit, onDelete }) => {
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
                    <thead className="sticky top-0 z-10 bg-white">
                        <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                            <th className="px-4 py-4">Image</th>
                            <th className="px-4 py-4">Name</th>
                            <th className="px-4 py-4">Description</th>
                            <th className="px-4 py-4">Items per Pack</th>
                            <th className="px-4 py-4">Unit</th>
                            <th className="px-4 py-4">Pack Price</th>
                            <th className="px-4 py-4">Unit Price</th>
                            <th className="px-4 py-4">Expiry Date</th>
                            <th className="px-4 py-4">Stock</th>
                            <th className="px-4 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {medicines.map((med) => (
                            <tr key={med._id || med.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                        {med.category?.charAt(0) || 'M'}
                                    </div>
                                </td>
                                <td className="px-4 py-4 font-medium text-gray-900">{med.name}</td>
                                <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate" title={med.description}>
                                    {med.description}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500">{med.packSize || 1}</td>
                                <td className="px-4 py-4 text-sm text-gray-500">{med.unit}</td>
                                <td className="px-4 py-4 font-bold text-gray-900">Rs. {med.price.toFixed(2)}</td>
                                <td className="px-4 py-4 text-sm text-green-600 font-medium">Rs. {(med.price / (med.packSize || 1)).toFixed(2)}</td>
                                <td className={`px-4 py-4 text-sm font-medium ${med.expiryDate && new Date(med.expiryDate) <= new Date(new Date().setMonth(new Date().getMonth() + 3))
                                    ? 'text-red-500'
                                    : 'text-gray-900'
                                    }`}>
                                    {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className={`px-4 py-4 text-sm ${med.stock <= 0 ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                                    {med.stock <= 0 ? 'Out of Stock' : med.stock}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit && onEdit(med)}
                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete && onDelete(med)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
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
            {medicines.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No medicines found. Add your first medicine to get started!
                </div>
            )}
        </div>
    );
};

export default MedicineTable;
