import React, { useState, useEffect } from 'react';

const roles = [
    'Pharmacist',
    'Assistant Pharmacist',
    'Salesman',
    'Cashier',
    'Store Keeper',
    'Delivery Rider',
    'Admin'
];

const salaryTypes = ['Monthly', 'Daily', 'Commission', 'Hybrid'];
const salaryCycles = ['Monthly', 'Weekly'];
const paymentMethods = ['Cash', 'Bank', 'EasyPaisa', 'JazzCash'];

const StaffProfileModal = ({ open, initialData, onClose, onSave, onPaySalary, onAddAdvance }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [form, setForm] = useState(() => ({
        name: initialData?.name || '',
        phone: initialData?.phone || '',
        cnic: initialData?.cnic || '',
        role: initialData?.role || 'Salesman',
        status: initialData?.status || 'Active',
        joiningDate: initialData?.joiningDate
            ? initialData.joiningDate.slice(0, 10)
            : new Date().toISOString().slice(0, 10),
        salaryType: initialData?.salaryType || 'Monthly',
        baseSalary: initialData?.baseSalary ?? '',
        salaryCycle: initialData?.salaryCycle || 'Monthly',
        paymentMethod: initialData?.paymentMethod || 'Cash',
        salesCommissionPercent: initialData?.salesCommissionPercent ?? '',
        monthlyBonus: initialData?.monthlyBonus ?? '',
    }));

    const [attendance, setAttendance] = useState({
        paidDays: 0,
        unpaidDays: 0,
        halfDays: 0,
        paidLeave: 0,
        unpaidLeave: 0
    });

    const [advanceAmount, setAdvanceAmount] = useState('');
    const [advances, setAdvances] = useState(initialData?.advances || []);
    const [payments, setPayments] = useState(initialData?.payments || []);
    const [permissions, setPermissions] = useState(initialData?.permissions || {});

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [open, onClose]);

    if (!open) return null;

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const cleanNumber = (val) => {
            if (val === '' || val === null || val === undefined) return 0;
            const n = parseFloat(val);
            return Number.isNaN(n) ? 0 : n;
        };

        const payload = {
            ...form,
            baseSalary: cleanNumber(form.baseSalary),
            salesCommissionPercent: cleanNumber(form.salesCommissionPercent),
            monthlyBonus: cleanNumber(form.monthlyBonus),
        };

        onSave(payload);
    };

    const handlePaySalary = () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        onPaySalary?.({
            periodStart: startOfMonth.toISOString(),
            periodEnd: today.toISOString(),
            ...attendance
        });
    };

    const handleAddAdvance = () => {
        const amount = parseFloat(advanceAmount);
        if (!amount || amount <= 0) return;
        onAddAdvance?.(
            { amount, date: new Date().toISOString() },
            (saved) => setAdvances((prev) => [saved, ...prev])
        );
        setAdvanceAmount('');
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {initialData ? 'Edit Staff' : 'Add Staff'}
                        </h2>
                        <p className="text-xs text-gray-500">
                            Manage staff profile, salary and payments
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 rounded-full p-2 hover:bg-gray-100"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-3 border-b border-gray-100 flex gap-4 text-sm">
                    <button
                        className={`pb-2 border-b-2 ${activeTab === 'basic'
                            ? 'border-green-500 text-green-600 font-semibold'
                            : 'border-transparent text-gray-500'
                            }`}
                        onClick={() => setActiveTab('basic')}
                    >
                        Basic Info
                    </button>
                    <button
                        className={`pb-2 border-b-2 ${activeTab === 'salary'
                            ? 'border-green-500 text-green-600 font-semibold'
                            : 'border-transparent text-gray-500'
                            }`}
                        onClick={() => setActiveTab('salary')}
                    >
                        Salary & Attendance
                    </button>
                    <button
                        className={`pb-2 border-b-2 ${activeTab === 'advances'
                            ? 'border-green-500 text-green-600 font-semibold'
                            : 'border-transparent text-gray-500'
                            }`}
                        onClick={() => setActiveTab('advances')}
                    >
                        Advances
                    </button>
                    <button
                        className={`pb-2 border-b-2 ${activeTab === 'history'
                            ? 'border-green-500 text-green-600 font-semibold'
                            : 'border-transparent text-gray-500'
                            }`}
                        onClick={() => setActiveTab('history')}
                    >
                        Salary History
                    </button>
                    <button
                        className={`pb-2 border-b-2 ${activeTab === 'permissions'
                            ? 'border-green-500 text-green-600 font-semibold'
                            : 'border-transparent text-gray-500'
                            }`}
                        onClick={() => setActiveTab('permissions')}
                    >
                        Permissions
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
                        {activeTab === 'basic' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                        CNIC (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={form.cnic}
                                        onChange={(e) => handleChange('cnic', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                        Role
                                    </label>
                                    <select
                                        value={form.role}
                                        onChange={(e) => handleChange('role', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                    >
                                        {roles.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                        Account Status
                                    </label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => handleChange('status', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Deactivated">Deactivated</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                        Joining Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.joiningDate}
                                        onChange={(e) => handleChange('joiningDate', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'salary' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                                            Salary type
                                        </label>
                                        <select
                                            value={form.salaryType}
                                            onChange={(e) => handleChange('salaryType', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                        >
                                            {salaryTypes.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                                            Base salary amount
                                        </label>
                                        <input
                                            type="number"
                                            value={form.baseSalary}
                                            onChange={(e) => handleChange('baseSalary', e.target.value)}
                                            min={0}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                                            Salary cycle
                                        </label>
                                        <select
                                            value={form.salaryCycle}
                                            onChange={(e) => handleChange('salaryCycle', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                        >
                                            {salaryCycles.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                                            Payment method
                                        </label>
                                        <select
                                            value={form.paymentMethod}
                                            onChange={(e) =>
                                                handleChange('paymentMethod', e.target.value)
                                            }
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                        >
                                            {paymentMethods.map((m) => (
                                                <option key={m} value={m}>
                                                    {m}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                                            Sales commission (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={form.salesCommissionPercent}
                                            onChange={(e) =>
                                                handleChange('salesCommissionPercent', e.target.value)
                                            }
                                            min={0}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                                            Monthly bonus / incentive
                                        </label>
                                        <input
                                            type="number"
                                            value={form.monthlyBonus}
                                            onChange={(e) =>
                                                handleChange('monthlyBonus', e.target.value)
                                            }
                                            min={0}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                        />
                                    </div>
                                </div>

                                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                                    <p className="text-xs font-semibold text-gray-600 mb-3">
                                        Salary-based attendance (for this period only)
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                        {['paidDays', 'unpaidDays', 'halfDays', 'paidLeave', 'unpaidLeave'].map(
                                            (field) => (
                                                <div key={field}>
                                                    <label className="block text-[11px] font-semibold text-gray-500 mb-1 capitalize">
                                                        {field.replace(/([A-Z])/g, ' $1')}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={attendance[field]}
                                                        onChange={(e) =>
                                                            setAttendance((prev) => ({
                                                                ...prev,
                                                                [field]: Number(e.target.value) || 0
                                                            }))
                                                        }
                                                        min={0}
                                                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                                    />
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-2 text-xs">
                                    <p className="text-xs font-semibold text-gray-600">
                                        Quick summary
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                        Use the Advances and Salary History tabs below for full money
                                        details. Attendance here is used only for salary calculation.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'advances' && (
                            <div className="space-y-3 text-xs">
                                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-2">
                                    <p className="text-xs font-semibold text-gray-600">
                                        Add advance salary
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={advanceAmount}
                                            onChange={(e) => setAdvanceAmount(e.target.value)}
                                            placeholder="Amount"
                                            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddAdvance}
                                            className="px-4 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-black"
                                        >
                                            Add advance
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-400">
                                        Advances will be automatically deducted when salary is paid.
                                    </p>
                                </div>
                                <div className="border border-gray-100 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-gray-600 mb-2">
                                        Advance history
                                    </p>
                                    <div className="max-h-48 overflow-y-auto space-y-1">
                                        {advances.length === 0 && (
                                            <div className="text-gray-400 text-center py-4">
                                                No advances recorded yet.
                                            </div>
                                        )}
                                        {advances.map((a) => (
                                            <div
                                                key={a._id}
                                                className="flex justify-between text-[11px] text-gray-600 border-b border-gray-100 py-1 last:border-0"
                                            >
                                                <span>
                                                    {new Date(a.date).toLocaleDateString()} – Rs.{' '}
                                                    {a.amount.toLocaleString()}
                                                </span>
                                                <span className="text-gray-400">
                                                    {a.note || 'Advance'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="space-y-3 text-xs">
                                <div className="border border-gray-100 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-gray-600 mb-2">
                                        Salary payments
                                    </p>
                                    <div className="max-h-56 overflow-y-auto">
                                        <table className="w-full text-left border-collapse text-[11px]">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                                    <th className="px-3 py-2">Period</th>
                                                    <th className="px-3 py-2">Base</th>
                                                    <th className="px-3 py-2">Deductions</th>
                                                    <th className="px-3 py-2">Advances</th>
                                                    <th className="px-3 py-2">Final</th>
                                                    <th className="px-3 py-2">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {payments.length === 0 && (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className="px-3 py-4 text-center text-gray-400"
                                                        >
                                                            No salary payments recorded yet.
                                                        </td>
                                                    </tr>
                                                )}
                                                {payments.map((p) => (
                                                    <tr key={p._id}>
                                                        <td className="px-3 py-2">
                                                            {new Date(p.periodStart).toLocaleDateString()}
                                                            {' - '}
                                                            {new Date(p.periodEnd).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            Rs. {(p.baseSalary || 0).toLocaleString()}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            Rs. {(p.unpaidDeduction || 0).toLocaleString()}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            Rs. {(p.advancesDeducted || 0).toLocaleString()}
                                                        </td>
                                                        <td className="px-3 py-2 font-semibold text-gray-800">
                                                            Rs. {(p.finalPayable || 0).toLocaleString()}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <span className="inline-flex px-2 py-1 rounded-full bg-green-50 text-green-700">
                                                                {p.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'permissions' && (
                            <div className="space-y-3 text-xs">
                                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                                    <p className="text-xs font-semibold text-gray-600 mb-3">
                                        Discount & access control
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                                                Max discount %
                                            </label>
                                            <input
                                                type="number"
                                                value={permissions.maxDiscountPercent || 0}
                                                onChange={(e) =>
                                                    setPermissions((prev) => ({
                                                        ...prev,
                                                        maxDiscountPercent: Number(e.target.value) || 0
                                                    }))
                                                }
                                                min={0}
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                                                Admin approval above %
                                            </label>
                                            <input
                                                type="number"
                                                value={permissions.approvalRequiredAbove || 0}
                                                onChange={(e) =>
                                                    setPermissions((prev) => ({
                                                        ...prev,
                                                        approvalRequiredAbove: Number(e.target.value) || 0
                                                    }))
                                                }
                                                min={0}
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                ['canSellControlledMedicines', 'Controlled medicine sales'],
                                                ['canOverridePrescription', 'Prescription override'],
                                                ['canApproveReturns', 'Return approval'],
                                                ['canEditInventory', 'Inventory edit'],
                                                ['canViewReports', 'Reports access'],
                                                ['canManageStaff', 'Staff management'],
                                            ].map(([field, label]) => (
                                                <label
                                                    key={field}
                                                    className="flex items-center gap-2 text-[11px]"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={permissions[field] || false}
                                                        onChange={(e) =>
                                                            setPermissions((prev) => ({
                                                                ...prev,
                                                                [field]: e.target.checked
                                                            }))
                                                        }
                                                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                    />
                                                    <span>{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-2">
                                        All changes are logged in the staff audit log for security.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                        <button
                            type="button"
                            onClick={handlePaySalary}
                            className="px-4 py-2 rounded-lg border border-green-500 text-green-600 text-sm font-semibold hover:bg-green-50"
                        >
                            Pay Salary
                        </button>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-600/20"
                            >
                                Save Staff
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StaffProfileModal;


