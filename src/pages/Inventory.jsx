import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Filter, Edit, Clock, AlertTriangle, ChevronDown, Download, CheckSquare, Square, ArrowUpDown, Save, MoreHorizontal, Calendar, TrendingUp, Package, DollarSign, X, AlertCircle, FileText, Brain } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AddToInventoryModal from '../components/inventory/AddToInventoryModal';
import EditInventoryModal from '../components/inventory/EditInventoryModal';
import API_URL from '../config/api';
import { useSettings } from '../context/SettingsContext';

// ... (rest of imports)

const Inventory = () => {
    const navigate = useNavigate();
    const [medicines, setMedicines] = useState([]);
    const [supplies, setSupplies] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Modal States for detailed views
    const [showExpiresModal, setShowExpiresModal] = useState(false);
    const [showLowStockModal, setShowLowStockModal] = useState(false);
    const [expiryFilterMode, setExpiryFilterMode] = useState('soon'); // 'soon' or 'expired'

    // ... (rest of state)

    // New Features State
    const [selectedItems, setSelectedItems] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [advancedFilters, setAdvancedFilters] = useState({ status: 'All', category: 'All' });
    const [editingPrice, setEditingPrice] = useState({ id: null, value: '' });
    const [enrichedLowStockItems, setEnrichedLowStockItems] = useState([]);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const { showToast } = useToast();
    const { settings } = useSettings();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
            // Optional: clear state so it doesn't persist on refresh/back if unwanted,
            // but for now keeping it simple.
        }
        if (location.state?.openAddModal) {
            setIsAddModalOpen(true);
        }
        // Clear state to prevent reopening on refresh
        if (location.state) {
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        fetchMedicines();
        fetchSupplies();
        fetchEnrichedLowStock();
    }, []);

    const fetchMedicines = async () => {
        try {
            const response = await fetch(`${API_URL}/api/medicines?limit=1000`, { // Fetch more for overview
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setMedicines(data.data || []);
        } catch (error) {
            console.error('Error fetching medicines:', error);
            showToast('Failed to fetch inventory', 'error');
        }
    };

    const fetchSupplies = async () => {
        try {
            const response = await fetch(`${API_URL}/api/supplies?limit=1000`, { // Fetch more for overview
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setSupplies(data.data || []);
        } catch (error) {
            console.error('Error fetching supplies:', error);
        }
    };

    const fetchEnrichedLowStock = async () => {
        try {
            const response = await fetch(`${API_URL}/api/medicines/low-stock`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setEnrichedLowStockItems(data);
        } catch (error) {
            console.error('Error fetching low stock data:', error);
        }
    };

    const [aiData, setAiData] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    const fetchAiLowStock = async () => {
        setAiLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/inventory/ai-low-stock`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setAiData(data);
        } catch (error) {
            console.error('Error fetching AI data:', error);
            showToast('Failed to load AI insights', 'error');
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'ai-alerts' && !aiData) {
            fetchAiLowStock();
        }
    }, [activeTab]);

    const handleAddToInventory = async (medicineId, formData) => {
        try {
            const payload = {
                ...formData,
                inInventory: true
            };

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/medicines/${medicineId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Refresh all related data
                await Promise.all([
                    fetchMedicines(),
                    fetchSupplies(),
                    fetchEnrichedLowStock()
                ]);
                setIsAddModalOpen(false);
                showToast('Product added to inventory successfully!', 'success');
            } else {
                showToast('Failed to add to inventory', 'error');
            }
        } catch (error) {
            console.error('Error adding to inventory:', error);
            showToast('Error adding to inventory', 'error');
        }
    };

    const handleUpdateInventory = async (medicineId, formData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/medicines/${medicineId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Refresh all related data
                await Promise.all([
                    fetchMedicines(),
                    fetchSupplies(),
                    fetchEnrichedLowStock()
                ]);
                setIsEditModalOpen(false);
                showToast('Inventory updated successfully!', 'success');
            } else {
                showToast('Failed to update inventory', 'error');
            }
        } catch (error) {
            console.error('Error updating inventory:', error);
            showToast('Error updating inventory', 'error');
        }
    };



    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === displayItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(displayItems.map(item => item._id));
        }
    };

    const toggleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handlePriceEditSubmit = async (medicine) => {
        if (!editingPrice.value || isNaN(editingPrice.value)) return;

        try {
            await handleUpdateInventory(medicine._id || medicine.id, {
                price: parseFloat(editingPrice.value)
            });
            setEditingPrice({ id: null, value: '' });
        } catch (error) {
            console.error(error);
            showToast('Failed to update price', 'error');
        }
    };

    const handleBulkStatusUpdate = async (newStatus) => {
        try {
            const promises = selectedItems.map(id => {
                // Find item to get current data or just send patch if API supports it.
                // Reusing handleUpdateInventory logic but customized for bulk.
                const token = localStorage.getItem('token');
                return fetch(`${API_URL}/api/medicines/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: newStatus })
                });
            });

            await Promise.all(promises);
            await fetchMedicines();
            setSelectedItems([]);
            showToast(`Updated status for ${selectedItems.length} items`, 'success');
        } catch (error) {
            showToast('Bulk update failed', 'error');
        }
    };

    const handleExport = (format = 'excel') => {
        // Determine what data to export based on active tab
        let dataToExport = [];
        let sheetName = 'All Inventory';

        switch (activeTab) {
            case 'expires':
                dataToExport = displayItems;
                sheetName = 'Expiring Items';
                break;
            case 'lowstock':
                dataToExport = displayItems;
                sheetName = 'Low Stock Items';
                break;
            default:
                dataToExport = displayItems;
                sheetName = 'All Inventory';
        }

        if (format === 'excel') {
            // Prepare data for Excel
            const excelData = dataToExport.map(item => ({
                'ID': item.id || item._id,
                'Name': item.name,
                'Formula': item.genericName || item.formulaCode || '-',
                'Category': item.category,
                'Location': item.boxNumber || '-',
                'Stock (Packs)': (item.stock / (item.packSize || 1)).toFixed(2),
                'MRP': item.mrp || 0,
                'Price': item.price,
                'Status': item.status,
                'Expiry': item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            const fileName = `${sheetName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            showToast('Exported to Excel', 'success');
        } else {
            // Handle PDF Export
            const doc = new jsPDF('l', 'mm', 'a4');
            const headers = ['Name', 'Formula', 'Category', 'Stock', 'Price', 'Expiry', 'Status'];
            const body = dataToExport.map(item => [
                item.name || 'N/A',
                item.genericName || item.formulaCode || '-',
                item.category || 'N/A',
                ((item.stock || 0) / (item.packSize || 1)).toFixed(1),
                (Number(item.price) || 0).toFixed(2),
                item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A',
                item.status || 'Active'
            ]);

            doc.setFontSize(18);
            doc.text(sheetName, 14, 22);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

            autoTable(doc, {
                head: [headers],
                body: body,
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: [0, 201, 80] },
                styles: { fontSize: 8 }
            });

            doc.save(`${sheetName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
            showToast('Exported to PDF', 'success');
        }
        setShowExportDropdown(false);
    };

    // Base filter for search, barcode, and status
    const getFilteredMedicines = (items) => {
        if (!Array.isArray(items)) return [];
        return items.filter(med => {
            const term = searchQuery.toLowerCase();
            const matchesSearch = med.name.toLowerCase().includes(term) ||
                (med.sku && med.sku.toLowerCase().includes(term)) ||
                (med.genericName && med.genericName.toLowerCase().includes(term)) ||
                (med.formulaCode && med.formulaCode.toLowerCase().includes(term)) ||
                (med.boxNumber && med.boxNumber.toLowerCase().includes(term)) ||
                (med.barcodes && med.barcodes.some(b => b.code && b.code.toLowerCase().includes(term)));

            const matchesStatus = advancedFilters.status === 'All' || med.status === advancedFilters.status;
            const matchesCategory = advancedFilters.category === 'All' || med.category === advancedFilters.category;

            return matchesSearch && matchesStatus && matchesCategory;
        });
    };

    // Filter medicines that are IN inventory
    const inventoryItems = (Array.isArray(medicines) ? medicines : []).filter(med => {
        return med.inInventory === true || med.stock > 0;
    });

    // ... (expiring and lowstock filters remain similar but use new derived data if needed)
    // Filter expiring items (expires within next 3 months) - FROM INVENTORY ITEMS ONLY
    const allExpiringItems = inventoryItems.filter(med => {
        if (!med.expiryDate) return false;
        const today = new Date();
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(today.getMonth() + 3);
        const expiryDate = new Date(med.expiryDate);
        return expiryDate <= threeMonthsFromNow;
    });

    const allLowStockItems = inventoryItems.filter(med => {
        const packSize = med.packSize || 1;
        const stockInPacks = (med.stock || 0) / packSize;
        const minStockInPacks = med.minStock || 10;
        return stockInPacks <= minStockInPacks;
    });

    const inventoryItemsFiltered = getFilteredMedicines(inventoryItems);
    const expiringItems = getFilteredMedicines(allExpiringItems);
    const lowStockItems = getFilteredMedicines(allLowStockItems);

    // Dashboard Statistics Calculation
    const inventoryStats = useMemo(() => {
        let totalItems = 0;
        let totalValue = 0;
        let potentialProfit = 0;
        let lowStockCount = 0;
        const categoryStats = {};

        inventoryItems.forEach(item => {
            const packs = (item.stock || 0) / (item.packSize || 1);
            const price = item.price || 0;
            const cost = item.costPrice || 0;

            const retailVal = packs * price;
            const costVal = packs * cost;

            totalItems++;
            totalValue += retailVal;
            potentialProfit += (retailVal - costVal);

            if (packs <= (item.minStock || 10)) lowStockCount++;

            if (!categoryStats[item.category]) {
                categoryStats[item.category] = {
                    name: item.category,
                    units: 0,
                    value: 0,
                    count: 0
                };
            }
            categoryStats[item.category].units += packs;
            categoryStats[item.category].value += retailVal;
            categoryStats[item.category].count += 1;
        });

        const categoryList = Object.values(categoryStats)
            .sort((a, b) => b.value - a.value);

        const topValueItems = [...inventoryItems]
            .sort((a, b) => {
                const valA = ((a.stock || 0) / (a.packSize || 1)) * (a.price || 0);
                const valB = ((b.stock || 0) / (b.packSize || 1)) * (b.price || 0);
                return valB - valA;
            })
            .slice(0, 5);

        return {
            totalItems,
            totalValue,
            potentialProfit,
            lowStockCount,
            categoryList,
            topValueItems
        };
    }, [inventoryItems]);

    const getDisplayItems = () => {
        let items = [];
        switch (activeTab) {
            case 'expires': items = expiringItems; break;
            case 'lowstock': items = enrichedLowStockItems; break; // Use enriched data
            default: items = inventoryItemsFiltered;
        }

        // Sort items
        const safeItems = Array.isArray(items) ? items : [];
        return [...safeItems].sort((a, b) => {
            const { key, direction } = sortConfig;
            let valA = a[key];
            let valB = b[key];

            // Handle special cases
            if (key === 'stockValue') {
                valA = ((a.stock || 0) / (a.packSize || 1)) * (a.costPrice || 0);
                valB = ((b.stock || 0) / (b.packSize || 1)) * (b.costPrice || 0);
            } else if (key === 'stock') {
                valA = (a.stock || 0) / (a.packSize || 1);
                valB = (b.stock || 0) / (b.packSize || 1);
            } else if (key === 'margin') {
                valA = ((a.price - (a.costPrice || 0)) / (a.price || 1));
                valB = ((b.price - (b.costPrice || 0)) / (b.price || 1));
            } else if (key === 'location') {
                valA = a.boxNumber || '';
                valB = b.boxNumber || '';
            } else if (key === 'lastUpdated') {
                valA = new Date(a.lastUpdated || 0).getTime();
                valB = new Date(b.lastUpdated || 0).getTime();
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB ? valB.toLowerCase() : '';
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const displayItems = getDisplayItems();

    const tabs = [
        { id: 'all', label: 'All Inventory', count: inventoryItemsFiltered.length },
        { id: 'expires', label: 'Expires', count: expiringItems.length },
        { id: 'lowstock', label: 'Low Stock', count: enrichedLowStockItems.length }
    ];

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>
                    <p className="text-gray-500 text-sm">Manage stock levels, value, and expirations</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto items-center">

                    <div className="relative">
                        <button
                            onClick={() => setShowExportDropdown(!showExportDropdown)}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Download size={18} />
                            <span>Export</span>
                            <ChevronDown size={14} className={`transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showExportDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => handleExport('excel')}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                        <TrendingUp size={16} />
                                    </div>
                                    <span>Export Excel</span>
                                </button>
                                <button
                                    onClick={() => handleExport('pdf')}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                                        <FileText size={16} />
                                    </div>
                                    <span>Export PDF</span>
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'all' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <span className="flex items-center gap-2">
                        <Package size={18} />
                        Inventory Overview
                    </span>
                    {activeTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
                </button>
                <button
                    onClick={() => setActiveTab('lowstock')}
                    className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'lowstock' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <span className="flex items-center gap-2">
                        <AlertTriangle size={18} />
                        Low Stock
                    </span>
                    {activeTab === 'lowstock' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600" />}
                </button>
                {settings?.autoReorder && (
                    <button
                        onClick={() => setActiveTab('ai-alerts')}
                        className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'ai-alerts' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <span className="flex items-center gap-2">
                            <Brain size={18} />
                            AI Low Stock Alerts
                        </span>
                        {activeTab === 'ai-alerts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600" />}
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {activeTab === 'all' && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Total Items */}
                            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50 shadow-sm flex flex-col justify-between h-auto">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Total Items</span>
                                    <div className="p-2 rounded-lg bg-white/60 text-blue-600">
                                        <Package size={18} />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {inventoryStats.totalItems.toLocaleString()}
                                </div>
                            </div>

                            {/* Inventory Value */}
                            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50 shadow-sm flex flex-col justify-between h-auto">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Inventory Value</span>
                                    <div className="p-2 rounded-lg bg-white/60 text-emerald-600">
                                        <DollarSign size={18} />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-emerald-600">
                                    {/* Format roughly if needed */}
                                    Rs {(inventoryStats.totalValue / 1000).toFixed(1)}k
                                </div>
                            </div>

                            {/* Low Stock */}
                            <div className="p-4 rounded-xl border border-red-100 bg-red-50 shadow-sm flex flex-col justify-between h-auto">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Low Stock</span>
                                    <div className="p-2 rounded-lg bg-white/60 text-red-600">
                                        <AlertTriangle size={18} />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-red-600">
                                    {inventoryStats.lowStockCount}
                                </div>
                            </div>

                            {/* Potential Profit */}
                            <div className="p-4 rounded-xl border border-orange-100 bg-orange-50 shadow-sm flex flex-col justify-between h-auto">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Potential Profit</span>
                                    <div className="p-2 rounded-lg bg-white/60 text-orange-600">
                                        <TrendingUp size={18} />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-orange-600">
                                    Rs {(inventoryStats.potentialProfit / 1000).toFixed(1)}k
                                </div>
                            </div>
                        </div>

                        {/* Charts & Lists Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Stock by Category - Expanded to take more space if needed, or keep as is */}
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-3 min-h-[200px] flex flex-col">
                                <h3 className="font-bold text-gray-900 text-base mb-6">Stock by Category</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {inventoryStats.categoryList.slice(0, 5).map((cat, index) => (
                                        <div key={index} className="p-3 border border-gray-100 rounded-lg bg-gray-50 flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-gray-700 text-sm truncate w-full" title={cat.name}>{cat.name}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-gray-500 font-medium">{cat.units.toFixed(0)} Units</span>
                                                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${index === 0 ? 'bg-blue-500' :
                                                            index === 1 ? 'bg-indigo-500' :
                                                                index === 2 ? 'bg-cyan-500' :
                                                                    index === 3 ? 'bg-teal-500' :
                                                                        'bg-gray-400'
                                                            }`}
                                                        style={{ width: `${Math.min((cat.value / inventoryStats.totalValue) * 100 * 3, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {inventoryStats.categoryList.length === 0 && (
                                    <div className="flex items-center justify-center flex-1 text-gray-400 text-sm">
                                        No category data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Highest Value Items (Grid Style) */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mt-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900 text-lg">Top Value Assets</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                                {inventoryStats.topValueItems.map((item, index) => (
                                    <div key={item._id} className="p-5 rounded-xl border border-gray-100 bg-gray-50/30 flex flex-col gap-4 hover:border-indigo-100 hover:shadow-sm transition-all h-32 justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-white text-gray-500 border border-gray-200'
                                                }`}>
                                                #{index + 1}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rank</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm truncate leading-tight" title={item.name}>{item.name}</h4>
                                            <p className="text-sm text-gray-500 mt-1 font-medium">Rs {(((item.stock || 0) / (item.packSize || 1)) * (item.price || 0)).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'lowstock' && (
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col min-h-[600px]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-gray-900 text-xl">Low Stock Alerts</h3>
                                <p className="text-sm text-gray-500">Items below minimum stock level</p>
                            </div>
                            <button
                                onClick={fetchEnrichedLowStock}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                                title="Refresh List"
                            >
                                <TrendingUp size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 font-bold tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Product</th>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Stock</th>
                                        {settings?.autoReorder && <th className="px-4 py-3">Suggested</th>}
                                        <th className="px-4 py-3 text-right rounded-r-lg">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {enrichedLowStockItems.length > 0 ? (
                                        enrichedLowStockItems.map(item => (
                                            <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-gray-800 text-sm leading-tight">{item.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{item.supplier || 'N/A'}</p>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-600 font-medium">
                                                    {item.category}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${item.stock === 0 ? 'bg-red-500' : 'bg-yellow-500'}`}
                                                                style={{ width: `${Math.min(((item.stock / (item.packSize || 1)) / (item.minStock || 10)) * 100, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className={`text-xs font-bold ${item.stock === 0 ? 'text-red-500' : 'text-yellow-600'}`}>
                                                            {(item.stock / (item.packSize || 1)) % 1 === 0 ? (item.stock / (item.packSize || 1)) : (item.stock / (item.packSize || 1)).toFixed(1)}
                                                        </span>
                                                    </div>
                                                </td>
                                                {settings?.autoReorder && (
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-700">
                                                                {item.reorderSuggestion?.suggestedQuantity || '-'}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 uppercase">
                                                                {item.reorderSuggestion?.urgency || 'Normal'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => navigate('/suppliers')}
                                                        className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded hover:bg-indigo-100 uppercase tracking-wide transition-colors"
                                                    >
                                                        Order
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={settings?.autoReorder ? 5 : 4} className="px-4 py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <CheckSquare size={32} className="text-green-500 mb-2" />
                                                    <p className="font-medium">All stock levels healthy!</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'ai-alerts' && (
                    !aiData ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* AI Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-red-50 border border-red-100 p-5 rounded-xl">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-red-600 font-medium text-sm">Critical Actions</p>
                                            <h3 className="text-2xl font-bold text-red-800 mt-1">{aiData.summary.criticalCount} Items</h3>
                                        </div>
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <AlertTriangle className="text-red-600" size={20} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-red-500 mt-2">Stockout within 3 days</p>
                                </div>
                                <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-orange-600 font-medium text-sm">High Priority</p>
                                            <h3 className="text-2xl font-bold text-orange-800 mt-1">{aiData.summary.highCount} Items</h3>
                                        </div>
                                        <div className="p-2 bg-orange-100 rounded-lg">
                                            <Clock className="text-orange-600" size={20} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-orange-500 mt-2">Stockout within 7 days</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-blue-600 font-medium text-sm">Monitor</p>
                                            <h3 className="text-2xl font-bold text-blue-800 mt-1">{aiData.summary.moderateCount} Items</h3>
                                        </div>
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <TrendingUp className="text-blue-600" size={20} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-blue-500 mt-2">Active sales velocity</p>
                                </div>
                            </div>

                            {/* AI Predictions Table */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        <Brain className="text-purple-600" size={18} />
                                        AI Supply Chain Recommendations
                                    </h3>
                                    <button onClick={fetchAiLowStock} className="text-xs text-purple-600 font-bold hover:underline">
                                        Refresh Analysis
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500">Risk Level</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500">Medicine</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500">Stock Status</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500">Velocity</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500">AI Analysis</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500">Action</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500">Confidence</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {aiData.predictions.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="py-12 text-center text-gray-400">
                                                        No low stock risks detected. System healthy.
                                                    </td>
                                                </tr>
                                            ) : (
                                                aiData.predictions.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-3 px-4">
                                                            {item.risk === 'CRITICAL' && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">CRITICAL</span>}
                                                            {item.risk === 'HIGH' && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">HIGH RISK</span>}
                                                            {item.risk === 'MODERATE' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">MODERATE</span>}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="font-medium text-gray-800">{item.name}</div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="text-sm font-bold text-gray-700">{item.stock} {item.unit}</div>
                                                            <div className="text-xs text-red-500 font-medium">Out in ~{item.daysRemaining} days</div>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-gray-600">
                                                            {item.salesVelocity} units/day
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-gray-600 italic max-w-xs truncate" title={item.prediction}>
                                                            "{item.prediction}"
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-xs font-bold text-gray-700">Order: {item.suggestedOrder} units</span>
                                                                <span className="text-[10px] text-gray-400 uppercase">{item.action.replace('_', ' ')}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${item.confidence > 80 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                                        style={{ width: `${item.confidence}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs font-medium">{item.confidence}%</span>
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
                    )
                )}
            </div>

            <AddToInventoryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onConfirm={handleAddToInventory}
                supplies={medicines}
            />

            <EditInventoryModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onConfirm={handleUpdateInventory}
                product={selectedItem}
            />

            {/* Expiring Items Modal */}
            {
                showExpiresModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {expiryFilterMode === 'soon' ? 'Expiring Soon Report' : 'Expired Items Inventory'}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {expiryFilterMode === 'soon'
                                            ? 'Items expiring within the next 3 months'
                                            : 'Items that have already reached their expiration date'}
                                    </p>
                                </div>
                                <button onClick={() => setShowExpiresModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-4">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider rounded-l-lg">Product</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider rounded-r-lg">Expiry Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {(() => {
                                            const filteredItems = expiringItems.filter(item => {
                                                const isExpired = new Date(item.expiryDate) < new Date();
                                                return expiryFilterMode === 'expired' ? isExpired : !isExpired;
                                            });

                                            return filteredItems.length > 0 ? (
                                                filteredItems.map((item) => {
                                                    const daysToExpiry = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                                                    const isExpired = daysToExpiry < 0;

                                                    return (
                                                        <tr key={item._id} className="hover:bg-gray-50 transition-colors group">
                                                            <td className="px-4 py-2.5">
                                                                <div className="font-bold text-gray-800 text-xs">{item.name}</div>
                                                                <div className="text-[10px] text-gray-400 group-hover:text-gray-500">{item.genericName}</div>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">
                                                                    {item.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="font-medium text-gray-700 text-xs">{(item.stock / (item.packSize || 1)) % 1 === 0 ? (item.stock / (item.packSize || 1)) : (item.stock / (item.packSize || 1)).toFixed(1)} Packs</span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border ${isExpired ? 'bg-red-50 border-red-100 text-red-700' : 'bg-orange-50 border-orange-100 text-orange-700'
                                                                    }`}>
                                                                    <Clock size={12} />
                                                                    <span className="font-bold text-[10px]">
                                                                        {new Date(item.expiryDate).toLocaleDateString()}
                                                                    </span>
                                                                    <span className="text-[9px] uppercase font-bold opacity-75 border-l border-current pl-1.5 ml-1">
                                                                        {isExpired ? 'Expired' : `${daysToExpiry} Days`}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-10 text-center text-gray-400">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                                                <CheckSquare size={24} />
                                                            </div>
                                                            <p className="font-medium text-sm">
                                                                {expiryFilterMode === 'soon' ? 'No items expiring soon' : 'No expired items found'}
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Low Stock Modal */}
            {
                showLowStockModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Low Stock Alerts</h2>
                                    <p className="text-sm text-gray-500 mt-1">Detailed reorder analysis and forecasts</p>
                                </div>
                                <button onClick={() => setShowLowStockModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-4">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider rounded-l-lg">Product</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sales Velocity</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reorder Suggestion</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Supplier</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider rounded-r-lg">Forecast (7/15/30d)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {enrichedLowStockItems.length > 0 ? (
                                            enrichedLowStockItems.map((item) => {
                                                const suggestion = item.reorderSuggestion || {};
                                                const urgency = suggestion.urgency || 'Warning';

                                                return (
                                                    <tr key={item._id} className="hover:bg-gray-50 transition-colors group">
                                                        <td className="px-4 py-2.5">
                                                            <div className="font-bold text-gray-800 text-xs">{item.name}</div>
                                                            <div className="text-[10px] text-gray-400 mt-0.5">{item.category}</div>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="flex flex-col gap-0.5">
                                                                <div className={`font-bold text-xs ${item.stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                                                                    {(item.stock / (item.packSize || 1)).toFixed(1)} {item.unit || 'Units'}
                                                                </div>
                                                                <div className="text-[9px] uppercase font-bold text-gray-400">
                                                                    Min: {item.minStock || 10}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${item.salesVelocity === 'Fast' ? 'bg-green-50 text-green-700' :
                                                                item.salesVelocity === 'Slow' ? 'bg-gray-50 text-gray-600' :
                                                                    'bg-blue-50 text-blue-700'
                                                                }`}>
                                                                {item.salesVelocity || 'Normal'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="bg-gray-100 px-2 py-1 rounded text-center min-w-[50px]">
                                                                    <div className="text-[9px] text-gray-400 font-bold uppercase">Order</div>
                                                                    <div className="font-bold text-gray-900 text-xs">{suggestion.suggestedQuantity || 0}</div>
                                                                </div>
                                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${urgency === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                                                    }`}>
                                                                    {urgency}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="text-xs font-medium text-gray-700">
                                                                {item.preferredSupplierId?.name || item.supplier || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            {item.forecasts && (
                                                                <div className="flex items-center gap-1.5 text-[10px]">
                                                                    <span className={`px-1 py-0.5 rounded ${item.forecasts.days7?.willStockOut ? 'bg-red-100 text-red-700 font-bold' : 'bg-gray-100 text-gray-500'}`}>
                                                                        {item.forecasts.days7?.forecastedStock || 0}
                                                                    </span>
                                                                    <span className="text-gray-300">/</span>
                                                                    <span className={`px-1 py-0.5 rounded ${item.forecasts.days15?.willStockOut ? 'bg-red-100 text-red-700 font-bold' : 'bg-gray-100 text-gray-500'}`}>
                                                                        {item.forecasts.days15?.forecastedStock || 0}
                                                                    </span>
                                                                    <span className="text-gray-300">/</span>
                                                                    <span className={`px-1 py-0.5 rounded ${item.forecasts.days30?.willStockOut ? 'bg-red-100 text-red-700 font-bold' : 'bg-gray-100 text-gray-500'}`}>
                                                                        {item.forecasts.days30?.forecastedStock || 0}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-10 text-center text-gray-400">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                                            <CheckSquare size={24} />
                                                        </div>
                                                        <p className="font-medium text-sm">Stock levels healthy</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Inventory;
