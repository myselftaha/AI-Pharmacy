import React from 'react';
import { Trash2 } from 'lucide-react';

const StaffList = ({ staff, onViewEdit, onPaySalary, onAddAdvance, onToggleStatus, onDelete }) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                            <th className="px-6 py-4">Staff Name</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Phone</th>
                            <th className="px-6 py-4">Salary Type</th>
                            <th className="px-6 py-4">Base Salary</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Salary Status</th>
                            <th className="px-6 py-4">Advance Balance</th>
                            <th className="px-6 py-4">Last Salary Paid</th>
                            <th className="px-6 py-4">Cycle</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {staff.map((row) => (
                            <tr
                                key={row._id}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => onViewEdit(row)}
                            >
                                <td className="px-6 py-3 font-medium text-gray-900">{row.name}</td>
                                <td className="px-6 py-3 text-sm text-gray-500">{row.role}</td>
                                <td className="px-6 py-3 text-sm text-gray-500">{row.phone}</td>
                                <td className="px-6 py-3 text-sm text-gray-500">{row.salaryType}</td>
                                <td className="px-6 py-3 text-sm text-gray-500">
                                    Rs. {(row.baseSalary || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-3">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleStatus(row);
                                        }}
                                        className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${row.status === 'Active'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : 'bg-gray-100 text-gray-500 border-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`w-2 h-2 rounded-full mr-2 ${row.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'
                                                }`}
                                        />
                                        {row.status}
                                    </button>
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-500">
                                    <span
                                        className={`inline-flex px-2 py-1 rounded-full text-[11px] font-semibold ${row.salaryStatus === 'Paid'
                                                ? 'bg-green-50 text-green-700'
                                                : row.salaryStatus === 'Partially Paid'
                                                    ? 'bg-yellow-50 text-yellow-700'
                                                    : 'bg-red-50 text-red-700'
                                            }`}
                                    >
                                        {row.salaryStatus || 'Paid'}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-500">
                                    Rs. {(row.advanceBalance || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-500">
                                    {row.lastSalaryPaidOn
                                        ? new Date(row.lastSalaryPaidOn).toLocaleDateString()
                                        : '-'}
                                </td>
                                <td className="px-6 py-3 text-xs text-gray-500">
                                    <span className="inline-flex px-2 py-1 rounded-full bg-gray-100">
                                        {row.salaryCycle || 'Monthly'}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onViewEdit(row);
                                            }}
                                            className="text-blue-500 hover:text-blue-700 font-medium text-sm"
                                        >
                                            View / Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPaySalary(row);
                                            }}
                                            className="text-green-600 hover:text-green-700 font-medium text-sm"
                                        >
                                            Pay Salary
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddAdvance(row);
                                            }}
                                            className="text-gray-700 hover:text-gray-900 font-medium text-sm"
                                        >
                                            Add Advance
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(row);
                                            }}
                                            className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                            title="Delete Staff"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {staff.length === 0 && (
                            <tr>
                                <td
                                    colSpan={11}
                                    className="px-6 py-8 text-center text-sm text-gray-400"
                                >
                                    No staff members found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StaffList;


