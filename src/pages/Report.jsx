import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    Clock,
    ArrowUpRight,
    Download,
    ChevronDown,
    Layers,
    PieChart as PieChartIcon,
    BarChart2,
    Activity,
    FileText,
    AlertCircle,
    Calendar,
    MoreVertical,
    CheckCircle2
} from 'lucide-react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area
} from 'recharts';

// Mock Data removed - using API
const mockData = {}; // Placeholder to prevent crash during refactor if references exist

const Report = () => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [dateRange, setDateRange] = useState('This Month');
    // Custom date state
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    // API State
    const [loading, setLoading] = useState(true);
    const [apiData, setApiData] = useState({
        overview: null,
        sales: null,
        inventory: null
    });
    const [exporting, setExporting] = useState(false);

    const tabs = ['Overview', 'Sales Analysis', 'Quick Reports'];
    const dateOptions = ['Today', 'This Week', 'This Month', 'Year', 'All Time', 'Custom'];

    useEffect(() => {
        const fetchReportData = async () => {
            // Only fetch if tab data is missing or dateRange changed
            // For simplicity, refetch on tab switch to ensure freshness
            setLoading(true);
            try {
                const queryParams = { range: dateRange };
                if (dateRange === 'Custom') {
                    if (!customStart || !customEnd) {
                        setLoading(false);
                        return; // Wait for both dates
                    }
                    queryParams.startDate = customStart;
                    queryParams.endDate = customEnd;
                }
                const query = new URLSearchParams(queryParams);
                let newData = { ...apiData };

                if (activeTab === 'Overview' || activeTab === 'Quick Reports') {
                    const token = localStorage.getItem('token');
                    const [analyticsRes, trendsRes] = await Promise.all([
                        fetch(`/api/reports/analytics?${query}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                        fetch(`/api/reports/sales-trends?${query}`, { headers: { 'Authorization': `Bearer ${token}` } })
                    ]);
                    const analytics = await analyticsRes.json();
                    const trends = await trendsRes.json();
                    newData.overview = { ...analytics, ...trends };
                } else if (activeTab === 'Sales Analysis') {
                    // Reuse or fetch new
                    const token = localStorage.getItem('token');
                    const [analyticsRes, trendsRes] = await Promise.all([
                        fetch(`/api/reports/analytics?${query}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                        fetch(`/api/reports/sales-trends?${query}`, { headers: { 'Authorization': `Bearer ${token}` } })
                    ]);
                    const analytics = await analyticsRes.json();
                    const trends = await trendsRes.json();
                    newData.sales = {
                        kpis: analytics.salesKpis || [],
                        monthlyTrend: trends.salesProfitTrend || [],
                        peakHours: trends.peakHours || [],
                        creditSales: analytics.creditSales || { total: 0, collected: 0, percentage: 0 },
                        returns: analytics.returns || { total: 0, processed: 0, percentage: 0 }
                    };
                }

                setApiData(newData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, dateRange, customStart, customEnd]);


    // Utility to download CSV
    const downloadCSV = (filename, data) => {
        if (!data || data.length === 0) return;

        // Handle nested objects/arrays for simple CSV
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(fieldName => {
                    const value = row[fieldName] !== undefined ? row[fieldName] : '';
                    // Escape commas and quotes
                    const stringValue = String(value).replace(/"/g, '""');
                    return `"${stringValue}"`;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Utility to download PDF
    const downloadPDF = (filename, data) => {
        if (!data || data.length === 0) return;

        const doc = new jsPDF();
        const headers = Object.keys(data[0]);
        const body = data.map(item => headers.map(header => item[header]));

        doc.setFontSize(18);
        doc.text(filename.replace(/_/g, ' '), 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Period: ${dateRange}`, 14, 35);

        autoTable(doc, {
            head: [headers],
            body: body,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [0, 201, 80] }, // #00c950 in RGB
            alternateRowStyles: { fillColor: [240, 253, 244] } // #f0fdf4 in RGB (green-50)
        });

        doc.save(`${filename}.pdf`);
    };

    const handleExport = async (report, format = 'CSV') => {
        setSelectedReport(report);

        // Prepare data based on report title
        let exportData = [];
        const title = report.title || "Report";
        const dateStr = new Date().toISOString().split('T')[0];

        try {
            if (title === 'Top Selling Items') {
                exportData = (apiData.overview?.topMedicines || []).map(m => ({
                    Name: m.name,
                    Sold: m.sold,
                    Revenue: m.revenue,
                    Growth: m.growth
                }));
            } else if (title === 'Stock Valuation') {
                const res = await fetch('/api/reports/inventory-health', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const inv = await res.json();
                exportData = (inv.categoryStock || []).map(c => ({
                    Category: c.name,
                    Stock_Units: c.stock,
                    Status: c.stock < 10 ? 'Low Stock' : 'In Stock'
                }));
                // Add summary row
                exportData.push({
                    Category: 'TOTAL VALUATION',
                    Stock_Units: inv.kpis?.find(k => k.label === 'Cost Value')?.value || 'N/A',
                    Status: inv.kpis?.find(k => k.label === 'Retail Value')?.value || 'N/A'
                });
            } else if (title === 'Payment Methods') {
                exportData = (apiData.overview?.paymentMethods || []).map(m => ({
                    Method: m.name,
                    Total: m.value
                }));
            } else if (title === 'Category Analysis') {
                exportData = (apiData.overview?.salesByCategory || []).map(m => ({
                    Category: m.name,
                    Percentage: m.percentage + '%'
                }));
            } else if (title === 'GST Report') {
                // If we have detailed transaction data, we could list them
                // For now, export the summary KPI
                exportData = [{
                    Report: 'GST Summary',
                    Total_GST: apiData.overview?.salesKpis?.find(k => k.label === 'GST Collected')?.value || '0'
                }];
            } else if (title === 'Daily Sales Report') {
                // Fetch detailed transactions for the current range
                const queryParams = { range: dateRange };
                if (dateRange === 'Custom') {
                    queryParams.startDate = customStart;
                    queryParams.endDate = customEnd;
                }
                const query = new URLSearchParams(queryParams);
                const res = await fetch(`/api/transactions?${query}&limit=1000`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                const txList = data.data || data.transactions || [];

                if (txList.length === 0) {
                    alert("No transactions found for the selected period.");
                    setExporting(false);
                    return;
                }

                exportData = txList.map(tx => ({
                    Date: new Date(tx.createdAt).toLocaleDateString(),
                    Invoice: tx.invoiceNumber || tx.billNumber || 'N/A',
                    Customer: tx.customer?.name || 'Walk-in',
                    Items: tx.items?.length || 0,
                    Total: tx.total,
                    Method: tx.paymentMethod
                }));
            } else if (title === 'Profit & Loss') {
                exportData = (apiData.overview?.quickSummary || []).map(s => ({
                    Item: s.label,
                    Value: s.value
                }));
                // Add Margin if available
                const margin = apiData.overview?.kpis?.find(k => k.label === 'Total Profit')?.trend;
                if (margin) exportData.push({ Item: 'Profit Margin', Value: margin });
            } else if (title === 'Monthly Trend') {
                exportData = (apiData.overview?.salesProfitTrend || []).map(t => ({
                    Period: t.name,
                    Sales: t.sales,
                    Profit: t.profit
                }));
            } else {
                // Fallback for others: export current KPIs
                exportData = (apiData.overview?.kpis || []).map(k => ({
                    Metric: k.label,
                    Value: k.value
                }));
                // Add extra info from quick summary
                (apiData.overview?.quickSummary || []).forEach(s => {
                    if (!exportData.find(e => e.Metric === s.label)) {
                        exportData.push({ Metric: s.label, Value: s.value });
                    }
                });
            }

            if (format === 'CSV') {
                downloadCSV(`${title.replace(/\s+/g, '_')}_${dateStr}`, exportData);
            } else if (format === 'JSON') {
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${title.replace(/\s+/g, '_')}_${dateStr}.json`;
                a.click();
            } else if (format === 'PDF') {
                downloadPDF(`${title.replace(/\s+/g, '_')}_${dateStr}`, exportData);
            }

            setShowExportModal(false);
            setShowExportDropdown(false);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Export failed: " + err.message);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] p-4 lg:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-gray-500 text-sm">Business insights and performance metrics</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Date Range Picker */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDateDropdown(!showDateDropdown)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                        >
                            <Calendar className="w-4 h-4 text-[#00c950]" />
                            {dateRange}
                            <ChevronDown className="w-4 h-4 opacity-50" />
                        </button>
                        {showDateDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                                {dateOptions.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setDateRange(option);
                                            setShowDateDropdown(false);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Custom Date Inputs */}
                    {dateRange === 'Custom' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00c950]"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00c950]"
                            />
                        </div>
                    )}

                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-6 border-b border-gray-200 mb-8 flex-wrap">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-sm font-semibold whitespace-nowrap transition-all relative ${activeTab === tab
                            ? 'text-[#00c950]'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00c950] rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="transition-all duration-300">
                {activeTab === 'Overview' && <OverviewTab data={apiData.overview} loading={loading} />}
                {activeTab === 'Sales Analysis' && <SalesAnalysisTab data={apiData.sales} loading={loading} />}
                {activeTab === 'Quick Reports' && <QuickReportsTab onExport={(report) => {
                    setSelectedReport(report);
                    setShowExportModal(true);
                }} data={apiData.overview} />}
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                    <FileText className="text-[#00c950] w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Export Report</h3>
                                    <p className="text-sm text-gray-500">{selectedReport?.title}</p>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-6">Choose your preferred format to download this report.</p>

                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { label: 'PDF Document', format: 'PDF', sub: 'Best for printing' },
                                    { label: 'Excel Spreadsheet (CSV)', format: 'CSV', sub: 'Best for data analysis' },
                                    { label: 'JSON Data', format: 'JSON', sub: 'For developers' }
                                ].map((item) => (
                                    <button
                                        key={item.format}
                                        disabled={exporting}
                                        onClick={() => handleExport(selectedReport, item.format)}
                                        className={`flex items-center justify-between p-4 border border-gray-100 rounded-xl transition-all group text-left ${exporting ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#00c950] hover:bg-green-50/50'}`}
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">
                                                {item.label}
                                                {exporting && <span className="ml-2 text-[10px] text-green-600 animate-pulse">Processing...</span>}
                                            </p>
                                            <p className="text-[10px] text-gray-400">{item.sub}</p>
                                        </div>
                                        {exporting ? (
                                            <div className="w-4 h-4 border-2 border-[#00c950] border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Download className="w-4 h-4 text-gray-400 group-hover:text-[#00c950]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="px-6 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Sub-components (Tabs) ---

const OverviewTab = ({ data, loading }) => {
    if (loading || !data) {
        return <div className="p-12 text-center text-gray-500">Loading analytics...</div>;
    }

    // Helper to map icon names to components if needed, or just rely on string matching if we pass components
    // Current API returns icon names like 'Activity'. The mock data passed Component objects.
    // We need a map.
    const iconMap = {
        'Activity': Activity,
        'TrendingUp': TrendingUp,
        'TrendingDown': TrendingDown,
        'BarChart2': BarChart2,
        'DollarSign': DollarSign,
        'Layers': Layers,
        'Package': Package,
        'AlertCircle': AlertCircle,
        'CheckCircle2': CheckCircle2,
        'Clock': Clock
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {data.kpis && data.kpis.map((kpi, idx) => {
                    const Icon = iconMap[kpi.icon] || Activity;
                    const colorSchemes = [
                        { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', iconBg: 'bg-white/60', hoverBorder: 'hover:border-blue-200' },
                        { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', iconBg: 'bg-white/60', hoverBorder: 'hover:border-emerald-200' },
                        { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', iconBg: 'bg-white/60', hoverBorder: 'hover:border-orange-200' },
                        { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', iconBg: 'bg-white/60', hoverBorder: 'hover:border-purple-200' },
                    ];
                    const scheme = colorSchemes[idx % colorSchemes.length];

                    return (
                        <div key={idx} className={`${scheme.bg} p-6 rounded-2xl border ${scheme.border} shadow-sm relative overflow-hidden group ${scheme.hoverBorder} transition-all`}>
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-gray-500 mb-1">{kpi.label}</p>
                                <div className="flex items-end justify-between">
                                    <div className="space-y-1">
                                        <h3 className={`text-2xl font-bold ${scheme.text}`}>{kpi.value}</h3>
                                        {kpi.trend && (
                                            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${kpi.isUp ? 'text-green-600 bg-white/80' : 'text-red-600 bg-white/80'
                                                }`}>
                                                {kpi.isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                                {kpi.trend}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`w-10 h-10 ${scheme.iconBg} rounded-xl flex items-center justify-center ${scheme.text} transition-colors group-hover:bg-white shrink-0`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales & Profit Trend */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-gray-900">Sales & Profit Trend</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-[#00c950] rounded-full" />
                                <span className="text-xs text-gray-500 font-medium">Sales</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-400 rounded-full" />
                                <span className="text-xs text-gray-500 font-medium">Profit</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={data.salesProfitTrend || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#F8FAFC' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="sales" fill="#00c950" radius={[4, 4, 0, 0]} barSize={32} />
                                <Line type="monotone" dataKey="profit" stroke="#FB923C" strokeWidth={3} dot={{ r: 4, fill: '#FB923C', strokeWidth: 2, stroke: '#fff' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-8">Payment Methods</h3>
                    <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie
                                    data={data.paymentMethods || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {data.paymentMethods && data.paymentMethods.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 mt-6">
                        {data.paymentMethods && data.paymentMethods.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-sm text-gray-600 font-medium">{entry.name}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900">Rs. {entry.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales by Category */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6">Sales by Category</h3>
                    <div className="space-y-6">
                        {data.salesByCategory && data.salesByCategory.map((cat, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm font-medium mb-2">
                                    <span className="text-gray-700">{cat.name}</span>
                                    <span className="text-green-600 font-bold">{cat.percentage}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full transition-all duration-1000"
                                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Selling Medicines */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6">Top Selling Medicines</h3>
                    <div className="space-y-1">
                        {data.topMedicines && data.topMedicines.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 font-bold text-xs group-hover:bg-green-100 transition-colors">
                                        0{idx + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800">{item.name}</h4>
                                        <p className="text-xs text-gray-500">{item.sold} units sold</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900">{item.revenue}</p>
                                    <div className={`flex items-center gap-1 text-[10px] font-bold justify-end ${item.isUp ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {item.isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                        {item.growth}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SalesAnalysisTab = ({ data, loading }) => {
    if (loading || !data) {
        return <div className="p-12 text-center text-gray-500">Loading sales analysis...</div>;
    }

    // Icon mapping
    const iconMap = {
        'Activity': Activity,
        'TrendingUp': TrendingUp,
        'TrendingDown': TrendingDown,
        'BarChart2': BarChart2,
        'DollarSign': DollarSign,
        'Layers': Layers,
        'Package': Package,
        'AlertCircle': AlertCircle,
        'CheckCircle2': CheckCircle2,
        'Clock': Clock
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {data.kpis && data.kpis.map((kpi, idx) => {
                    const Icon = iconMap[kpi.icon] || Activity;
                    const colorSchemes = [
                        { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', iconBg: 'bg-white/60', hoverBorder: 'hover:border-indigo-200' },
                        { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-600', iconBg: 'bg-white/60', hoverBorder: 'hover:border-green-200' },
                        { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', iconBg: 'bg-white/60', hoverBorder: 'hover:border-yellow-200' },
                        { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', iconBg: 'bg-white/60', hoverBorder: 'hover:border-purple-200' },
                    ];
                    const scheme = colorSchemes[idx % colorSchemes.length];

                    return (
                        <div key={idx} className={`${scheme.bg} p-6 rounded-2xl border ${scheme.border} shadow-sm relative overflow-hidden group ${scheme.hoverBorder} transition-all`}>
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-gray-500 mb-1">{kpi.label}</p>
                                <div className="flex items-end justify-between">
                                    <h3 className={`text-2xl font-bold ${scheme.text}`}>{kpi.value}</h3>
                                    <div className={`w-10 h-10 ${scheme.iconBg} rounded-xl flex items-center justify-center ${scheme.text} transition-colors group-hover:bg-white shrink-0`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Monthly Sales Trend */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-8">Monthly Sales Trend</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <AreaChart data={data.monthlyTrend || []}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00c950" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#00c950" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="sales" stroke="#00c950" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Peak Hours */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-8 text-sm uppercase tracking-wider text-gray-400">Transaction Volume by Hour</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={data.peakHours || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                                <Tooltip
                                    cursor={{ fill: '#F8FAFC' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="sales" fill="#00c950" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Credit & Returns */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-500 text-sm">Credit Sales</h4>
                            {data.creditSales && <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">{data.creditSales.percentage}%</span>}
                        </div>
                        {data.creditSales && (
                            <>
                                <p className="text-2xl font-bold text-gray-900 mb-1">Rs. {data.creditSales.total.toLocaleString()}</p>
                                <p className="text-xs text-gray-400 mb-4">Collected: Rs. {data.creditSales.collected.toLocaleString()}</p>
                                <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-400" style={{ width: `${data.creditSales.percentage}%` }} />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-500 text-sm">Returns & Refunds</h4>
                            {data.returns && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">{data.returns.percentage}%</span>}
                        </div>
                        {data.returns && (
                            <>
                                <p className="text-2xl font-bold text-gray-900 mb-1">Rs. {data.returns.total.toLocaleString()}</p>
                                <p className="text-xs text-gray-400 mb-4">Processed: Rs. {data.returns.processed.toLocaleString()}</p>
                                <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-400" style={{ width: `${data.returns.percentage}%` }} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const InventoryTab = ({ data, loading }) => {
    if (loading || !data) {
        return <div className="p-12 text-center text-gray-500">Loading inventory data...</div>;
    }

    const iconMap = {
        'Activity': Activity,
        'TrendingUp': TrendingUp,
        'TrendingDown': TrendingDown,
        'BarChart2': BarChart2,
        'DollarSign': DollarSign,
        'Layers': Layers,
        'Package': Package,
        'AlertCircle': AlertCircle,
        'CheckCircle2': CheckCircle2,
        'Clock': Clock
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {data.kpis && data.kpis.map((kpi, idx) => {
                    const Icon = iconMap[kpi.icon] || Package;
                    return (
                        <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-green-100 transition-all">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-gray-500 mb-1">{kpi.label}</p>
                                <div className="flex items-end justify-between">
                                    <h3 className="text-2xl font-bold text-gray-900">{kpi.value}</h3>
                                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 transition-colors group-hover:bg-green-100 shrink-0">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Horizontal Bar Chart */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-8">Stock Distribution by Category</h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={data.categoryStock || []} margin={{ left: 40, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }} width={120} />
                                <Tooltip
                                    cursor={{ fill: '#F8FAFC' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="stock" radius={[0, 4, 4, 0]} barSize={24}>
                                    {data.categoryStock && data.categoryStock.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alerts Sidebar */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 px-2 mb-4 text-sm uppercase tracking-tighter">Inventory Alerts</h3>
                    {data.alerts && data.alerts.map((alert, idx) => {
                        const Icon = iconMap[alert.icon] || AlertCircle;
                        return (
                            <div key={idx} className={`p-5 rounded-2xl border ${alert.color.split(' ').slice(-1)[0]} flex items-start gap-4 transition-all hover:translate-x-1 cursor-pointer bg-white`}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${alert.color.split(' ').slice(1, 2)[0]} border border-white`}>
                                    <Icon className={`w-6 h-6 ${alert.color.split(' ')[0]}`} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">{alert.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xl font-bold text-gray-900">{alert.count}</p>
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${alert.title.includes('Expired') ? 'bg-red-500' : 'bg-orange-500'} ${alert.title.includes('Total') ? 'hidden' : ''}`} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const QuickReportsTab = ({ onExport, data }) => {
    // Local constants since these are just menu items
    const quickReports = [
        { title: 'Daily Sales Report', desc: 'Sales breakdown by day', icon: FileText },
        { title: 'Stock Valuation', desc: 'Current inventory value', icon: Package },
        { title: 'Profit & Loss', desc: 'Revenue and expenses', icon: TrendingUp },
        { title: 'GST Report', desc: 'Tax collection summary', icon: FileText },
        { title: 'Top Selling Items', desc: 'Best performing products', icon: BarChart2 },
        { title: 'Category Analysis', desc: 'Sales by category', icon: PieChartIcon },
        { title: 'Payment Methods', desc: 'Payment type breakdown', icon: DollarSign },
        { title: 'Monthly Trend', desc: 'Month-over-month analysis', icon: Activity },
    ];

    return (
        <div className="space-y-8">
            {/* Generate Reports Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Generate Reports</h3>
                    <p className="text-sm text-gray-500">Select a report type and export in your preferred format</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickReports.map((report, idx) => {
                        const colorSchemes = [
                            { bg: 'bg-indigo-50/50', border: 'border-indigo-100', text: 'text-indigo-600', hoverBg: 'hover:bg-indigo-50', hoverBorder: 'hover:border-indigo-300' },
                            { bg: 'bg-green-50/50', border: 'border-green-100', text: 'text-green-600', hoverBg: 'hover:bg-green-50', hoverBorder: 'hover:border-green-300' },
                            { bg: 'bg-yellow-50/50', border: 'border-yellow-100', text: 'text-yellow-600', hoverBg: 'hover:bg-yellow-50', hoverBorder: 'hover:border-yellow-300' },
                            { bg: 'bg-pink-50/50', border: 'border-pink-100', text: 'text-pink-600', hoverBg: 'hover:bg-pink-50', hoverBorder: 'hover:border-pink-300' },
                            { bg: 'bg-blue-50/50', border: 'border-blue-100', text: 'text-blue-600', hoverBg: 'hover:bg-blue-50', hoverBorder: 'hover:border-blue-300' },
                            { bg: 'bg-orange-50/50', border: 'border-orange-100', text: 'text-orange-600', hoverBg: 'hover:bg-orange-50', hoverBorder: 'hover:border-orange-300' },
                            { bg: 'bg-cyan-50/50', border: 'border-cyan-100', text: 'text-cyan-600', hoverBg: 'hover:bg-cyan-50', hoverBorder: 'hover:border-cyan-300' },
                            { bg: 'bg-rose-50/50', border: 'border-rose-100', text: 'text-rose-600', hoverBg: 'hover:bg-rose-50', hoverBorder: 'hover:border-rose-300' },
                        ];
                        const scheme = colorSchemes[idx % colorSchemes.length];

                        return (
                            <button
                                key={idx}
                                onClick={() => onExport(report)}
                                className={`flex items-start gap-4 p-4 rounded-xl border ${scheme.bg} ${scheme.border} ${scheme.hoverBg} ${scheme.hoverBorder} transition-all text-left group shadow-sm`}
                            >
                                <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center ${scheme.text} group-hover:scale-110 shrink-0 transition-all border ${scheme.border} shadow-sm`}>
                                    <report.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm mb-1">{report.title}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-1">{report.desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Report Summary Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Report Summary</h3>
                    <p className="text-sm text-gray-500">Key metrics at a glance</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {(data?.quickSummary || [
                        { label: 'Period Sales', value: 'N/A', colorScheme: { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600' } },
                        { label: 'Period Profit', value: 'N/A', colorScheme: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-600' } },
                        { label: 'GST Collected', value: 'N/A', colorScheme: { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600' } },
                        { label: 'Discounts', value: 'N/A', colorScheme: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600' } },
                    ]).map((summary, idx) => (
                        <div key={idx} className={`${summary.colorScheme?.bg || 'bg-gray-50'} p-4 rounded-xl border ${summary.colorScheme?.border || 'border-gray-100'} shadow-sm`}>
                            <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">{summary.label}</p>
                            <p className={`text-xl font-bold ${summary.colorScheme?.text || 'text-gray-900'}`}>{summary.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Report;
