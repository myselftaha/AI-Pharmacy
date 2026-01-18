import React from 'react';
import { Filter, X, CreditCard, User, Tag, Activity } from 'lucide-react';

const FilterBar = ({ filters, setFilters, onClose }) => {

    const handleChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
    };

    const handleReset = () => {
        setFilters({
            paymentMethod: 'All',
            status: 'All',
            cashier: 'All',
            type: 'All',
            minAmount: '',
            maxAmount: ''
        });
    };

    const filterOptions = [
        { label: 'Payment Method', key: 'paymentMethod', icon: CreditCard, options: ['All', 'Cash', 'Card', 'Credit / On Account'] },
        { label: 'Status', key: 'status', icon: Activity, options: ['All', 'Posted', 'Voided'] },
        { label: 'Type', key: 'type', icon: Tag, options: ['All', 'Sale', 'Return'] },
        { label: 'Cashier', key: 'cashier', icon: User, options: ['All', 'Admin'] } // Should be dynamic in production
    ];

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#00c950]">
                        <Filter size={18} />
                    </div>
                    <h3 className="font-bold text-gray-800">Advanced Filters</h3>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleReset}
                        className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
                    >
                        <X size={16} /> Reset
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filterOptions.map((opt) => (
                    <div key={opt.key}>
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                            <opt.icon size={14} className="text-gray-400" />
                            {opt.label}
                        </label>
                        <select
                            value={filters[opt.key]}
                            onChange={(e) => handleChange(opt.key, e.target.value)}
                            className="w-full h-11 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:border-[#00c950] focus:ring-4 focus:ring-[#00c950]/5 transition-all appearance-none cursor-pointer"
                        >
                            {opt.options.map(o => (
                                <option key={o} value={o}>{o}</option>
                            ))}
                        </select>
                    </div>
                ))}

                <div className="lg:col-span-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                        <Activity size={14} className="text-gray-400" />
                        Amount Range (Rs)
                    </label>
                    <div className="flex gap-3 items-center">
                        <input
                            type="number"
                            placeholder="Min Price"
                            className="w-full h-11 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:border-[#00c950] focus:ring-4 focus:ring-[#00c950]/5 transition-all"
                            value={filters.minAmount}
                            onChange={(e) => handleChange('minAmount', e.target.value)}
                        />
                        <div className="w-4 h-[2px] bg-gray-200" />
                        <input
                            type="number"
                            placeholder="Max Price"
                            className="w-full h-11 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:border-[#00c950] focus:ring-4 focus:ring-[#00c950]/5 transition-all"
                            value={filters.maxAmount}
                            onChange={(e) => handleChange('maxAmount', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
                <Filter size={120} />
            </div>
        </div>
    );
};

FilterBar.Icon = Filter;

export default FilterBar;
