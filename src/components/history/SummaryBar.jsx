import React from 'react';
import { DollarSign, TrendingUp, AlertCircle, ShoppingBag, CreditCard, Wallet, Banknote } from 'lucide-react';

const SummaryBar = ({ stats, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-5 gap-4 mb-6">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    const cards = [
        {
            label: 'Gross Sales',
            value: stats.grossSales,
            icon: DollarSign,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100'
        },
        {
            label: 'Net Sales',
            value: stats.netSales,
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-100'
        },
        {
            label: 'Returns',
            value: stats.returns,
            icon: AlertCircle,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100'
        },
        {
            label: 'Discounts',
            value: stats.discounts, // Assuming API returns this
            icon: ShoppingBag, // Just a placeholder icon
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-100'
        },
        // Combine Payment types into one card or line? User asked for summary bar with all these.
        // Gross, Discounts, Tax, Returns, Net Sales, Items Sold, Bills Count
        // Maybe a second row for payment breakdown?
    ];

    const formatCurrency = (val) => `Rs. ${(val || 0).toFixed(2)}`;

    return (
        <div className="space-y-4 mb-6">
            {/* Primary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {cards.map((card, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${card.border} ${card.bg} shadow-sm`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">{card.label}</span>
                            <div className={`p-2 rounded-lg bg-white/60 ${card.color}`}>
                                <card.icon size={18} />
                            </div>
                        </div>
                        <div className={`text-2xl font-bold ${card.color}`}>
                            {formatCurrency(card.value)}
                        </div>
                    </div>
                ))}

                {/* Tax Card (Separate to match 5 col grid) */}
                <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Tax</span>
                        <div className="p-2 rounded-lg bg-gray-50 text-gray-600">
                            <DollarSign size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {formatCurrency(stats.tax)}
                    </div>
                </div>
            </div>

            {/* Secondary Metrics & Payment Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Items Sold</span>
                    <span className="text-xl font-bold text-gray-800">{stats.itemsSold || 0}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Bills Count</span>
                    <span className="text-xl font-bold text-gray-800">{stats.billsCount || 0}</span>
                </div>

                {/* Payment Methods */}
                <div className="md:col-span-4 grid grid-cols-3 gap-4 bg-gray-50 p-2 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3 px-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-green-600"><Banknote size={16} /></div>
                        <div>
                            <div className="text-xs text-gray-500 font-medium">Cash Sales</div>
                            <div className="text-sm font-bold text-gray-800">{formatCurrency(stats.cashSales)}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-3 border-l border-gray-200">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-purple-600"><CreditCard size={16} /></div>
                        <div>
                            <div className="text-xs text-gray-500 font-medium">Card Sales</div>
                            <div className="text-sm font-bold text-gray-800">{formatCurrency(stats.cardSales)}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-3 border-l border-gray-200">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600"><Wallet size={16} /></div>
                        <div>
                            <div className="text-xs text-gray-500 font-medium">Credit / On-Account</div>
                            <div className="text-sm font-bold text-gray-800">{formatCurrency(stats.creditSales)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryBar;
