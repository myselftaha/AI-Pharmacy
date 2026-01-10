import React from 'react';
import { Eye, ChevronRight } from 'lucide-react';

const GroupedMedicineTable = ({ groupedMedicines, onViewDetails }) => {
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
                            <th className="px-6 py-3">Medicine Name</th>
                            <th className="px-6 py-3 text-center">Batch Count</th>
                            <th className="px-6 py-3">Suppliers</th>
                            <th className="px-6 py-3">Total Stock</th>
                            <th className="px-6 py-3">Stock Status</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {groupedMedicines.map((group) => (
                            <tr key={group.name} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => onViewDetails(group)}>
                                <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                                    {group.name}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center justify-center bg-gray-100 text-gray-600 font-bold px-2.5 py-0.5 rounded-lg text-xs">
                                        {group.batches.length}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                                    {group.suppliers}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                    {group.totalStock % 1 === 0 ? group.totalStock : group.totalStock.toFixed(2)}
                                    <span className="text-[10px] text-gray-400 font-normal uppercase ml-1">Packs</span>
                                </td>
                                <td className="px-6 py-4">
                                    {group.totalStock <= 0 ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10">
                                            Out of Stock
                                        </span>
                                    ) : group.totalStock < 50 ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                            Low Stock
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                                            In Stock
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewDetails(group);
                                        }}
                                        className="text-gray-400 group-hover:text-blue-600 transition-colors"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {groupedMedicines.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No medicines found. Add a new supply entry to get started!
                </div>
            )}
        </div>
    );
};

export default GroupedMedicineTable;
