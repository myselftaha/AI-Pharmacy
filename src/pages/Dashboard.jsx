import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    AlertTriangle,
    Clock,
    ArrowUpRight,
    Search,
    RotateCcw,
    DollarSign,
    Wallet,
    CreditCard,
    ArrowDownRight,
    Package,
    ShieldAlert,
    ShoppingCart,
    Truck,
    Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import { useSettings } from '../context/SettingsContext';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import Loader from '../components/common/Loader';
const Dashboard = () => {
    const { settings, formatPrice } = useSettings();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
    const [stats, setStats] = useState({
        todaySales: 0,
        todayProfit: 0,
        todayReturns: 0,
        todayReturnsCount: 0,
        todayTransactions: 0,
        totalPayables: 0,
        expiryCount: 0,
        expiryValue: 0,
        lowStockCount: 0
    });
    const [salesTrend, setSalesTrend] = useState([]);
    const [categorySales, setCategorySales] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [dateRange, setDateRange] = useState('Today');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    const getDateRangeParams = () => {
        const end = new Date();
        const start = new Date();

        // Helper to get local YYYY-MM-DD
        const toLocalISOString = (date) => {
            const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
            const localDate = new Date(date.getTime() - offset);
            return localDate.toISOString().split('T')[0];
        };

        if (dateRange === 'Today') {
            // start is today, end is today
        } else if (dateRange === 'Yesterday') {
            start.setDate(end.getDate() - 1);
            end.setDate(end.getDate() - 1);
        } else if (dateRange === 'This Week') {
            const day = end.getDay();
            const diff = end.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            start.setDate(diff);
        } else if (dateRange === 'This Month') {
            start.setDate(1);
        } else if (dateRange === 'Custom') {
            return {
                startDate: customStartDate,
                endDate: customEndDate
            };
        }

        return {
            startDate: toLocalISOString(start),
            endDate: toLocalISOString(end)
        };
    };

    const handleDateRangeChange = (range) => {
        setDateRange(range);
        if (range !== 'Custom') {
            // Logic handled in useEffect dependency
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { startDate, endDate } = getDateRangeParams();

                // If custom range is selected but dates are not valid, don't fetch yet or use defaults
                if (dateRange === 'Custom' && (!startDate || !endDate)) {
                    return;
                }

                setLoading(true);

                // 1. Fetch Accurate Backend Stats (Respects user selected range)
                const token = localStorage.getItem('token');
                const statsResponse = await fetch(`${API_URL}/api/dashboard/stats?startDate=${startDate}&endDate=${endDate}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const statsData = await statsResponse.json();

                // 2. Fetch Transactions for Charts (Always fetch last 30 days to ensure trends/charts work)
                // Calculate 30 days ago from today
                const today = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);

                // Helper for local ISO
                const toLocalISO = (d) => {
                    const offset = d.getTimezoneOffset() * 60000;
                    return new Date(d.getTime() - offset).toISOString().split('T')[0];
                };

                const chartStart = toLocalISO(thirtyDaysAgo);
                const chartEnd = toLocalISO(today);

                const txResponse = await fetch(`${API_URL}/api/transactions?startDate=${chartStart}&endDate=${chartEnd}&limit=1000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const txData = await txResponse.json();
                const transactions = txData.data || []; // Handle pagination response structure

                // 3. Fetch Medicines (Minimal version for category mapping)
                const medResponse = await fetch(`${API_URL}/api/medicines?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const medData = await medResponse.json();
                const medicines = medData.data || [];

                processDashboardData(statsData, transactions, medicines);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dateRange, customStartDate, customEndDate]);

    const processDashboardData = (backendStats, transactions, medicines) => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // 1. KPI Stats - Use Optimized Backend Data
        const lowStockThreshold = settings?.lowStockThreshold || 10;
        const lowStockCount = medicines.filter(m => (m.stock || 0) <= (m.minStock || lowStockThreshold)).length;

        setStats({
            todaySales: backendStats.raw.sales,
            todayProfit: backendStats.raw.sales - backendStats.raw.expenses - backendStats.raw.returns, // Simple formula
            todayReturns: backendStats.raw.returns,
            todayReturnsCount: 0, // Placeholder
            todayTransactions: 0, // Placeholder
            totalPayables: 0, // Placeholder
            expiryCount: 0, // Placeholder
            expiryValue: 0,
            lowStockCount: lowStockCount
        });

        // 2. Sales Trend (Last 7 Days)
        // We still calculate this from raw transactions for now as backend stats is single-range
        const trendData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

            const daysTx = transactions.filter(t =>
                new Date(t.createdAt).toISOString().split('T')[0] === dStr && t.type !== 'Return'
            );
            const dayTotal = daysTx.reduce((sum, t) => sum + (t.total || 0), 0);

            trendData.push({
                name: dayLabel,
                sales: dayTotal
            });
        }

        // 3. Category Sales (Pie Chart - Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const recentTx = transactions.filter(t => new Date(t.createdAt) >= thirtyDaysAgo && t.type !== 'Return');

        const catMap = {};
        recentTx.forEach(tx => {
            tx.items.forEach(item => {
                let category = 'Uncategorized';
                // Flexible match for medicine
                const med = medicines.find(m => m.name === item.name || m.id == item.id || m._id == item.id);
                if (med && med.category) category = med.category;

                if (!catMap[category]) catMap[category] = 0;
                catMap[category] += (item.quantity * (item.price || 0));
            });
        });

        const pieData = Object.keys(catMap).map(cat => ({
            name: cat,
            value: catMap[cat]
        })).sort((a, b) => b.value - a.value).slice(0, 5);

        // 4. Top Selling Products (This Month)
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const thisMonthTx = transactions.filter(t => new Date(t.createdAt) >= thisMonthStart && t.type !== 'Return');
        const productMap = {};
        thisMonthTx.forEach(tx => {
            tx.items.forEach(item => {
                if (!productMap[item.name]) productMap[item.name] = 0;
                productMap[item.name] += item.quantity;
            });
        });
        const top5 = Object.keys(productMap)
            .map(name => ({ name, quantity: productMap[name] }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        // Set Chart Data
        setSalesTrend(trendData);
        setCategorySales(pieData);
        setTopProducts(top5);
        setRecentTransactions([...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
    };

    const MetricCard = ({ title, value, subtext, icon: Icon, colorClass, iconBgClass, onClick }) => (
        <div
            onClick={onClick}
            className={`bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        >
            <div className="flex justify-between items-start z-10">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                </div>
                <div className={`p-2 rounded-lg ${iconBgClass}`}>
                    <Icon className={colorClass} size={20} />
                </div>
            </div>
            {subtext && (
                <div className="text-xs text-gray-500 mt-2 z-10 flex items-center gap-1">
                    {subtext}
                </div>
            )}

            {/* Decoration */}
            <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-10 ${iconBgClass.replace('bg-', 'bg-')}`}></div>
        </div>
    );


    return (
        <div className="pb-8 space-y-6">
            {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50">
                    <Loader type="pulse" message="Loading dashboard data..." size="lg" />
                </div>
            )}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <div className="flex gap-4 items-center">


                    {/* Quick Actions Dropdown */}                    <div className="relative">
                        <button
                            onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                            style={{ backgroundColor: '#00c950', borderColor: '#00c950' }}
                            className="flex items-center gap-2 px-4 py-2.5 text-white rounded-lg font-bold hover:brightness-90 transition-all shadow-sm active:scale-95"
                        >
                            <Plus size={20} className="text-white" />
                            <span className="hidden md:inline">Quick Actions</span>
                        </button>

                        {isQuickActionsOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setIsQuickActionsOpen(false)}
                                ></div>
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => {
                                                navigate('/pos');
                                                setIsQuickActionsOpen(false);
                                            }}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-green-50 rounded-lg transition-colors group"
                                        >
                                            <div className="p-2 bg-green-100 text-green-600 rounded-lg group-hover:bg-white transition-colors">
                                                <ShoppingCart size={18} />
                                            </div>
                                            <span className="font-semibold text-gray-700">New Sale</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                navigate('/medicines', { state: { openAddSupply: true } });
                                                setIsQuickActionsOpen(false);
                                            }}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-blue-50 rounded-lg transition-colors group"
                                        >
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-white transition-colors">
                                                <Truck size={18} />
                                            </div>
                                            <span className="font-semibold text-gray-700">Purchase Invoice</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                navigate('/suppliers');
                                                setIsQuickActionsOpen(false);
                                            }}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-purple-50 rounded-lg transition-colors group"
                                        >
                                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-white transition-colors">
                                                <CreditCard size={18} />
                                            </div>
                                            <span className="font-semibold text-gray-700">Record Payment</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                navigate('/suppliers');
                                                setIsQuickActionsOpen(false);
                                            }}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-orange-50 rounded-lg transition-colors group"
                                        >
                                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-white transition-colors">
                                                <RotateCcw size={18} />
                                            </div>
                                            <span className="font-semibold text-gray-700">Purchase Return</span>
                                        </button>

                                        <div className="h-px bg-gray-100 my-1"></div>

                                        <button
                                            onClick={() => {
                                                navigate('/inventory', { state: { openAddModal: true } });
                                                setIsQuickActionsOpen(false);
                                            }}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-teal-50 rounded-lg transition-colors group"
                                        >
                                            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg group-hover:bg-white transition-colors">
                                                <Package size={18} />
                                            </div>
                                            <span className="font-semibold text-gray-700">Add Product</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

            </div>

            {/* Date Filter & Metrics */}
            <div className="flex flex-col gap-6">


                {/* Custom Date Range Picker */}
                {dateRange === 'Custom' && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-end items-end gap-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                            />
                        </div>
                    </div>
                )}

                {/* 1. Top Row: Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <MetricCard
                        title="Today's Sales"
                        value={formatPrice(stats.todaySales)}
                        subtext="Gross Sales"
                        icon={TrendingUp}
                        colorClass="text-green-600"
                        iconBgClass="bg-green-100"
                        onClick={() => navigate('/history')}
                    />
                    <MetricCard
                        title="Net Profit"
                        value={formatPrice(stats.todayProfit)}
                        subtext="Est. Earnings"
                        icon={Wallet}
                        colorClass="text-green-600"
                        iconBgClass="bg-green-100"
                        onClick={() => navigate('/reports')}
                    />

                    <MetricCard
                        title="Payables"
                        value={`Rs. ${stats.totalPayables.toLocaleString()}`}
                        subtext="Due to Suppliers"
                        icon={CreditCard}
                        colorClass="text-orange-600"
                        iconBgClass="bg-orange-100"
                        onClick={() => navigate('/suppliers')}
                    />
                    <MetricCard
                        title="Returns"
                        value={`Rs. ${stats.todayReturns.toLocaleString()}`}
                        subtext={`${stats.todayReturnsCount} Returned Items`}
                        icon={RotateCcw}
                        colorClass="text-purple-600"
                        iconBgClass="bg-purple-100"
                        onClick={() => navigate('/history')}
                    />

                    <MetricCard
                        title="Expiry Alerts"
                        value={stats.expiryCount}
                        subtext={`Value at Risk: Rs. ${stats.expiryValue?.toLocaleString() || '0'}`}
                        icon={Clock}
                        colorClass="text-orange-600"
                        iconBgClass="bg-orange-100"
                        onClick={() => navigate('/inventory', { state: { activeTab: 'expires' } })}
                    />

                    <MetricCard
                        title="Low Stock"
                        value={stats.lowStockCount}
                        subtext="View Reorder Suggestions"
                        icon={ShieldAlert}
                        colorClass="text-red-600"
                        iconBgClass="bg-red-100"
                        onClick={() => navigate('/inventory', { state: { activeTab: 'lowstock' } })}
                    />
                </div>

                {/* 2. Middle Row: Sales Trend (Line Chart) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-800">Sales Trend (Last 7 Days)</h2>
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={300}>
                                <BarChart data={salesTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(value) => formatPrice(value)} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value) => [formatPrice(value), 'Sales']}
                                        cursor={{ fill: '#f9fafb' }}
                                    />
                                    <Bar dataKey="sales" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. Category Sales (Pie Chart) */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-800">Sales by Category</h2>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Package size={20} />
                            </div>
                        </div>
                        <div className="h-64 relative">
                            {categorySales.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={300}>
                                    <PieChart>
                                        <Pie
                                            data={categorySales}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categorySales.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <Package size={48} className="mb-2 opacity-20" />
                                    <p>No sales data yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Bottom Row: Top Products & Recent Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Products */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-800 text-lg mb-6">Top Selling Medicines (This Month)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-bold text-gray-500 uppercase border-b border-gray-100">
                                        <th className="pb-3">Product Name</th>
                                        <th className="pb-3 text-right">Quantity Sold</th>
                                        <th className="pb-3 text-right">Trend</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {topProducts.map((product, index) => (
                                        <tr key={index} className="group hover:bg-gray-50 transition-colors">
                                            <td className="py-3 text-sm font-medium text-gray-800">{product.name}</td>
                                            <td className="py-3 text-sm text-gray-800 text-right font-bold">{product.quantity}</td>
                                            <td className="py-3 text-right">
                                                <span className="inline-flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                    <TrendingUp size={12} className="mr-1" /> High
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {topProducts.length === 0 && (
                                        <tr><td colSpan="3" className="py-4 text-center text-gray-400">No sales data yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-800 text-lg">Recent Transactions</h3>
                            <a href="/history" className="text-sm text-green-600 font-medium hover:underline">View All</a>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-bold text-gray-500 uppercase border-b border-gray-100">
                                        <th className="pb-3">ID</th>
                                        <th className="pb-3">Customer</th>
                                        <th className="pb-3">Amount</th>
                                        <th className="pb-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {recentTransactions.map((tx, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 text-sm text-gray-500">
                                                {tx.transactionId || `#${tx._id.substr(-6)}`}
                                            </td>
                                            <td className="py-3 text-sm font-medium text-gray-800">
                                                {tx.customer?.name || 'Walk-in'}
                                            </td>
                                            <td className="py-3 text-sm font-bold text-gray-800">
                                                {formatPrice(tx.total)}
                                            </td>
                                            <td className="py-3 text-right">
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${(tx.type === 'Return' || tx.total < 0)
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-green-100 text-green-600'
                                                    }`}>
                                                    {tx.type || 'Completed'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {recentTransactions.length === 0 && (
                                        <tr><td colSpan="4" className="py-4 text-center text-gray-400">No recent transactions</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
