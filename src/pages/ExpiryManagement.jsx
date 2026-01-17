import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import {
    AlertTriangle,
    AlertCircle,
    Check,
    Trash2,
    RefreshCw,
    Calendar,
    DollarSign,
    Package,
    Search,
    Filter,
    Download,
    Brain,
    TrendingDown
} from 'lucide-react';
import API_URL from '../config/api';
import Loader from '../components/common/Loader';

const ExpiryManagement = () => {
    const { showToast } = useToast();
    const { settings } = useSettings();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'ai-insights'
    const [analytics, setAnalytics] = useState(null);
    const [predictions, setPredictions] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDisposing, setIsDisposing] = useState(false);

    useEffect(() => {
        fetchExpiryAnalytics();
        fetchAIPredictions();
    }, []);

    const fetchExpiryAnalytics = async () => {
        // setLoading(true); // Don't block UI for reload
        try {
            const response = await fetch(`${API_URL}/api/expiry/analytics`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching expiry analytics:', error);
            showToast('Failed to load expiry data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAIPredictions = async () => {
        try {
            const response = await fetch(`${API_URL}/api/expiry/ai-predictions`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setPredictions(data);
        } catch (error) {
            console.error('Error fetching AI predictions:', error);
        }
    };

    const handleDispose = async (medicineId, medicineName, stock) => {
        const quantity = prompt(`Enter quantity to dispose for ${medicineName} (Max: ${stock}):`);
        if (!quantity || isNaN(quantity) || quantity <= 0 || quantity > stock) {
            showToast('Invalid quantity', 'error');
            return;
        }

        const reason = prompt('Reason for disposal:') || 'Expired';

        setIsDisposing(true);
        try {
            const response = await fetch(`${API_URL}/api/expiry/dispose`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    medicineId,
                    quantity: parseInt(quantity),
                    reason,
                    disposedBy: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'Admin'
                })
            });

            const data = await response.json();
            if (response.ok) {
                showToast(`${medicineName} disposed successfully`, 'success');
                fetchExpiryAnalytics(); // Refresh data
                fetchAIPredictions();
            } else {
                showToast(data.message || 'Failed to dispose', 'error');
            }
        } catch (error) {
            console.error('Error disposing medicine:', error);
            showToast('Failed to dispose medicine', 'error');
        } finally {
            setIsDisposing(false);
        }
    };

    const exportReport = () => {
        if (!analytics) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Category,Medicine Name,Expiry Date,Days Remaining,Stock,Value (Rs.),Supplier\n";

        const categories = ['expired', 'critical', 'warning'];
        categories.forEach(cat => {
            analytics[cat].items.forEach(item => {
                csvContent += `${cat.toUpperCase()},${item.name},${new Date(item.expiryDate).toLocaleDateString()},${item.daysRemaining},${item.stock},${item.value.toFixed(2)},${item.supplier || 'N/A'}\n`;
            });
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `expiry_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Report exported successfully', 'success');
    };

    const getAllItems = () => {
        if (!analytics) return [];

        let items = [
            ...analytics.expired.items.map(i => ({ ...i, category: 'expired' })),
            ...analytics.critical.items.map(i => ({ ...i, category: 'critical' })),
            ...analytics.warning.items.map(i => ({ ...i, category: 'warning' }))
        ];

        // Filter by selected category
        if (selectedCategory !== 'all') {
            items = items.filter(i => i.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery) {
            items = items.filter(i =>
                i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (i.supplier && i.supplier.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        return items;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader type="wave" size="lg" message="Loading expiry data..." />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500">Failed to load expiry data</p>
            </div>
        );
    }

    const filteredItems = getAllItems();

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="text-[#00c950]" size={28} />
                        Smart Expiry Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">AI-powered expiry tracking and alerts</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { fetchExpiryAnalytics(); fetchAIPredictions(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    <button
                        onClick={exportReport}
                        className="flex items-center gap-2 px-4 py-2 bg-[#00c950] text-white rounded-lg hover:bg-[#00b048] transition-colors"
                    >
                        <Download size={16} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="text-red-600" size={24} />
                        <span className="text-xs font-semibold text-red-600 bg-red-200 px-2 py-1 rounded-full">URGENT</span>
                    </div>
                    <h3 className="text-2xl font-bold text-red-700">{analytics.expired.count}</h3>
                    <p className="text-sm text-red-600 font-medium">Expired Items</p>
                    <p className="text-xs text-red-500 mt-1">Loss: Rs. {analytics.expired.totalValue.toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="text-orange-600" size={24} />
                        <span className="text-xs font-semibold text-orange-600 bg-orange-200 px-2 py-1 rounded-full">CRITICAL</span>
                    </div>
                    <h3 className="text-2xl font-bold text-orange-700">{analytics.critical.count}</h3>
                    <p className="text-sm text-orange-600 font-medium">Expiring in {settings?.expiryAlertDays || 30} Days</p>
                    <p className="text-xs text-orange-500 mt-1">Value: Rs. {analytics.critical.totalValue.toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Calendar className="text-yellow-600" size={24} />
                        <span className="text-xs font-semibold text-yellow-600 bg-yellow-200 px-2 py-1 rounded-full">WARNING</span>
                    </div>
                    <h3 className="text-2xl font-bold text-yellow-700">{analytics.warning.count}</h3>
                    <p className="text-sm text-yellow-600 font-medium">Expiring in {(settings?.expiryAlertDays || 30) * 3} Days</p>
                    <p className="text-xs text-yellow-500 mt-1">Value: Rs. {analytics.warning.totalValue.toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Check className="text-green-600" size={24} />
                        <span className="text-xs font-semibold text-green-600 bg-green-200 px-2 py-1 rounded-full">SAFE</span>
                    </div>
                    <h3 className="text-2xl font-bold text-green-700">{analytics.safe.count}</h3>
                    <p className="text-sm text-green-600 font-medium">Safe Stock</p>
                    <p className="text-xs text-green-500 mt-1">Value: Rs. {analytics.safe.totalValue.toLocaleString()}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'inventory' ? 'text-[#00c950]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <span className="flex items-center gap-2">
                        <Package size={18} />
                        Expiry Inventory
                    </span>
                    {activeTab === 'inventory' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#00c950]" />}
                </button>
                <button
                    onClick={() => setActiveTab('ai-insights')}
                    className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'ai-insights' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <span className="flex items-center gap-2">
                        <Brain size={18} />
                        AI Insights & Predictions
                    </span>
                    {activeTab === 'ai-insights' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600" />}
                </button>
            </div>

            {/* Content Categories */}
            {activeTab === 'inventory' ? (
                <>
                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by medicine name or supplier..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c950]/20 focus:border-[#00c950]"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter size={18} className="text-gray-400" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c950]/20 focus:border-[#00c950]"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="expired">Expired Only</option>
                                    <option value="critical">Critical Only</option>
                                    <option value="warning">Warning Only</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Medicine Name</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Expiry Date</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Days Remaining</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Stock</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Value (Rs.)</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Supplier</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="py-12 text-center">
                                                <Package size={48} className="mx-auto text-gray-300 mb-2" />
                                                <p className="text-gray-500">No items found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => (
                                            <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-4">
                                                    {item.category === 'expired' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                                            <AlertCircle size={12} />
                                                            EXPIRED
                                                        </span>
                                                    )}
                                                    {item.category === 'critical' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                                                            <AlertTriangle size={12} />
                                                            CRITICAL
                                                        </span>
                                                    )}
                                                    {item.category === 'warning' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                                            <Calendar size={12} />
                                                            WARNING
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.name}</td>
                                                <td className="py-3 px-4 text-sm text-gray-600">
                                                    {new Date(item.expiryDate).toLocaleDateString('en-PK', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`text-sm font-semibold ${item.daysRemaining < 0 ? 'text-red-600' :
                                                        item.daysRemaining <= 30 ? 'text-orange-600' :
                                                            'text-yellow-600'
                                                        }`}>
                                                        {item.daysRemaining < 0
                                                            ? `${Math.abs(item.daysRemaining)} days ago`
                                                            : `${item.daysRemaining} days`
                                                        }
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-700">{item.stock}</td>
                                                <td className="py-3 px-4 text-sm font-medium text-gray-800">
                                                    Rs. {item.value.toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600">{item.supplier || 'N/A'}</td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() => handleDispose(item._id, item.name, item.stock)}
                                                        disabled={isDisposing}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 size={14} />
                                                        Dispose
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="mt-4 text-center text-sm text-gray-500">
                        Showing {filteredItems.length} of {analytics.expired.count + analytics.critical.count + analytics.warning.count} items
                    </div>
                </>
            ) : (
                /* AI Insights & Predictions Tab */
                <div className="space-y-6">
                    {!predictions ? (
                        <div className="flex justify-center p-12">
                            <Loader type="dots" />
                        </div>
                    ) : (
                        <>
                            {/* AI Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-purple-50 border border-purple-100 p-5 rounded-xl">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-purple-600 font-medium text-sm">Return to Supplier</p>
                                            <h3 className="text-2xl font-bold text-purple-800 mt-1">{predictions.summary.criticalCount} Items</h3>
                                        </div>
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <TrendingDown className="text-purple-600" size={20} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-purple-500 mt-2">Won't sell before expiry (95% Conf.)</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-blue-600 font-medium text-sm">Discount Candidates</p>
                                            <h3 className="text-2xl font-bold text-blue-800 mt-1">{predictions.summary.highCount} Items</h3>
                                        </div>
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <DollarSign className="text-blue-600" size={20} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-blue-500 mt-2">Slow moving, apply discount now</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-gray-600 font-medium text-sm">Monitor</p>
                                            <h3 className="text-2xl font-bold text-gray-800 mt-1">{predictions.summary.moderateCount} Items</h3>
                                        </div>
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <Search className="text-gray-600" size={20} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">May not clear in time</p>
                                </div>
                            </div>

                            {/* AI Predictions Table */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        <Brain className="text-purple-600" size={18} />
                                        AI Recommendations
                                    </h3>
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Auto-Generated</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500">Risk Level</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500">Medicine</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500">Expiry</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500">AI Analysis</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500">Recommended Action</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500">Confidence</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {[...predictions.predictions.critical, ...predictions.predictions.high].length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="py-8 text-center text-gray-400">
                                                        No high risk items detected using AI analysis.
                                                    </td>
                                                </tr>
                                            ) : (
                                                [...predictions.predictions.critical, ...predictions.predictions.high, ...predictions.predictions.moderate].map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-3 px-4">
                                                            {item.risk === 'CRITICAL' && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">CRITICAL</span>}
                                                            {item.risk === 'HIGH' && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">HIGH RISK</span>}
                                                            {item.risk === 'MODERATE' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold">MODERATE</span>}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="font-medium text-gray-800">{item.name}</div>
                                                            <div className="text-xs text-gray-500">Stock: {item.stock}</div>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-gray-600">
                                                            {new Date(item.expiryDate).toLocaleDateString()}
                                                            <div className="text-xs font-medium text-red-500">{item.daysRemaining} days left</div>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-gray-600 italic">
                                                            "{item.prediction}"
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {item.action === 'RETURN_TO_SUPPLIER' && (
                                                                <button className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 font-medium hover:bg-red-100">
                                                                    <TrendingDown size={14} /> Return to Supplier
                                                                </button>
                                                            )}
                                                            {item.action === 'APPLY_DISCOUNT' && (
                                                                <button className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 font-medium hover:bg-blue-100">
                                                                    <DollarSign size={14} /> Apply {item.suggestedDiscount}% Off
                                                                </button>
                                                            )}
                                                            {item.action === 'MONITOR' && (
                                                                <span className="text-xs text-gray-500 font-medium">Keep Monitoring</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-sm font-medium text-gray-700">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${item.confidence > 80 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                                        style={{ width: `${item.confidence}%` }}
                                                                    ></div>
                                                                </div>
                                                                {item.confidence}%
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExpiryManagement;
