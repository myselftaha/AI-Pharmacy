import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import {
    Store, FileText, DollarSign, Package, Bell, Clock, Settings as SettingsIcon,
    Save, RotateCcw, Upload, Check, Download, RefreshCcw, Smartphone
} from 'lucide-react';
import API_URL from '../config/api';
import TabNavigation from '../components/common/TabNavigation';
import WhatsAppSettings from '../components/settings/WhatsAppSettings';

const Settings = () => {
    const { settings, updateSettings, restoreDefaults, loading } = useSettings();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('store');
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [backups, setBackups] = useState([]);
    const [loadingBackups, setLoadingBackups] = useState(false);

    const fetchBackups = async () => {
        try {
            setLoadingBackups(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/system/backups`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBackups(data);
            }
        } catch (err) {
            console.error('Failed to fetch backups', err);
        } finally {
            setLoadingBackups(false);
        }
    };

    const handleCreateBackup = async () => {
        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/system/backup`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                showToast('Backup created successfully', 'success');
                fetchBackups();
            } else {
                showToast(data.message || 'Backup failed', 'error');
            }
        } catch (err) {
            showToast('Backup failed', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRestoreBackup = async (filename) => {
        if (!window.confirm(`Are you sure you want to RESTORE from ${filename}? This will REPLACE all current data!`)) {
            return;
        }

        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/system/restore/${filename}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message || 'Restored successfully', 'success');
                // Optional: Force reload to reflect changes
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showToast(data.message || 'Restore failed', 'error');
            }
        } catch (err) {
            showToast('Restore failed', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadBackup = async (filename) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/system/backups/${filename}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            } else {
                showToast('Download failed', 'error');
            }
        } catch (err) {
            showToast('Download failed', 'error');
        }
    };

    useEffect(() => {
        if (activeTab === 'system') {
            fetchBackups();
        }
    }, [activeTab]);

    // Initialize form data from settings
    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle nested array changes (workingDays)
    const handleDayToggle = (day) => {
        setFormData(prev => {
            const currentDays = prev.workingDays || [];
            if (currentDays.includes(day)) {
                return { ...prev, workingDays: currentDays.filter(d => d !== day) };
            } else {
                return { ...prev, workingDays: [...currentDays, day] };
            }
        });
    };

    const handleSave = async () => {
        // Validation for Business Settings
        if (activeTab === 'business') {
            const { fiscalYearStart, workingHoursStart, workingHoursEnd } = formData;

            // Validate Fiscal Year (MM-DD)
            if (fiscalYearStart && !/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(fiscalYearStart)) {
                showToast('Fiscal Year Start must be in MM-DD format (e.g., 04-01)', 'error');
                return;
            }

            // Validate Working Hours
            if (workingHoursStart && workingHoursEnd) {
                if (workingHoursStart >= workingHoursEnd) {
                    showToast('Opening time cannot be later than or equal to closing time', 'error');
                    return;
                }
            }
        }

        setIsSaving(true);
        const result = await updateSettings(formData);
        setIsSaving(false);

        if (result.success) {
            showToast(result.message, 'success');
        } else {
            showToast(result.message, 'error');
        }
    };

    const handleRestore = async () => {
        if (window.confirm('Are you sure you want to restore default settings? This cannot be undone.')) {
            setIsSaving(true);
            const result = await restoreDefaults();
            setIsSaving(false);

            if (result.success) {
                showToast(result.message, 'success');
            } else {
                showToast(result.message, 'error');
            }
        }
    };

    // File upload handler (simulated for now)
    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, storeLogo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
    }

    const tabs = [
        { id: 'store', label: 'Store Info', icon: Store },
        { id: 'receipt', label: 'Receipt', icon: FileText },
        { id: 'tax', label: 'Tax & Pricing', icon: DollarSign },
        { id: 'stock', label: 'Stock', icon: Package },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'whatsapp', label: 'Communication', icon: Smartphone },
        { id: 'business', label: 'Business', icon: Clock },
        { id: 'system', label: 'System', icon: SettingsIcon },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">System Settings</h2>
                    <p className="text-sm text-gray-500">Configure your pharmacy POS system preferences</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRestore}
                        className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <RotateCcw size={18} />
                        Restore Defaults
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 disabled:opacity-50"
                    >
                        {isSaving ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Sidebar Tabs */}
                <div className="w-64 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <nav className="flex flex-col p-2 space-y-1">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${isActive
                                        ? 'bg-green-50 text-green-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon size={20} className={isActive ? 'text-green-600' : 'text-gray-400'} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Form Area */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-y-auto p-8">

                    {/* Store Info Tab */}
                    {activeTab === 'store' && (
                        <div className="space-y-6 max-w-2xl">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Store Information</h3>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy Name</label>
                                    <input
                                        type="text"
                                        name="storeName"
                                        value={formData.storeName || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                        placeholder="e.g. AI Pharmacy"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea
                                        name="storeAddress"
                                        value={formData.storeAddress || ''}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                        placeholder="Full address for receipts"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        name="storePhone"
                                        value={formData.storePhone || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="storeEmail"
                                        value={formData.storeEmail || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                    <input
                                        type="text"
                                        name="storeWebsite"
                                        value={formData.storeWebsite || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration/License No.</label>
                                    <input
                                        type="text"
                                        name="registrationNumber"
                                        value={formData.registrationNumber || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Store Logo</label>
                                    <div className="flex items-start gap-6">
                                        <div className="w-24 h-24 border rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                                            {formData.storeLogo ? (
                                                <img src={formData.storeLogo} alt="Logo" className="w-full h-full object-contain" />
                                            ) : (
                                                <Store className="text-gray-300" size={32} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="hidden"
                                                id="logo-upload"
                                            />
                                            <label
                                                htmlFor="logo-upload"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <Upload size={16} />
                                                Upload Logo
                                            </label>
                                            <p className="mt-2 text-xs text-gray-500">
                                                Recommended: Square image, PNG or JPG, max 1MB.<br />
                                                This logo will appear on receipts and the dashboard.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Receipt Settings Tab */}
                    {activeTab === 'receipt' && (
                        <div className="space-y-6 max-w-2xl">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Receipt Configuration</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Header Text</label>
                                    <input
                                        type="text"
                                        name="receiptHeader"
                                        value={formData.receiptHeader || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                        placeholder="Greeting at top of receipt"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Text</label>
                                    <textarea
                                        name="receiptFooter"
                                        value={formData.receiptFooter || ''}
                                        onChange={handleChange}
                                        rows="2"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                        placeholder="Message at bottom"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                                    <textarea
                                        name="receiptTerms"
                                        value={formData.receiptTerms || ''}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                        placeholder="Return policy, etc."
                                    />
                                </div>

                                <div className="flex gap-8 border-t pt-4">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="showQRCode"
                                            name="showQRCode"
                                            checked={formData.showQRCode || false}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                                        />
                                        <label htmlFor="showQRCode" className="text-gray-700 cursor-pointer select-none">Show QR Code</label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Template</label>
                                    <select
                                        name="receiptTemplate"
                                        value={formData.receiptTemplate || 'detailed'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
                                    >
                                        <option value="detailed">Detailed (Standard)</option>
                                        <option value="simple">Simple (Eco-friendly)</option>
                                        <option value="thermal">Thermal (3 inch)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tax & Pricing Tab */}
                    {activeTab === 'tax' && (
                        <div className="space-y-6 max-w-2xl">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Tax & Pricing</h3>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        name="taxRate"
                                        value={formData.taxRate ?? ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Applied to generic sales if no product tax</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                                    <input
                                        type="text"
                                        name="currency"
                                        value={formData.currency || 'Rs'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency Position</label>
                                    <select
                                        name="currencyPosition"
                                        value={formData.currencyPosition || 'before'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
                                    >
                                        <option value="before">Before Amount (Rs 100)</option>
                                        <option value="after">After Amount (100 Rs)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Discount (%)</label>
                                    <input
                                        type="number"
                                        name="maxDiscountPercent"
                                        value={formData.maxDiscountPercent ?? ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    />
                                </div>
                                <div className="col-span-2 pt-2">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="taxInclusive"
                                            name="taxInclusive"
                                            checked={formData.taxInclusive || false}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                                        />
                                        <div className="flex flex-col">
                                            <label htmlFor="taxInclusive" className="text-gray-700 cursor-pointer select-none font-medium">Tax Inclusive Prices</label>
                                            <span className="text-xs text-gray-500">If checked, product prices will be treated as including tax</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stock Management Tab */}
                    {activeTab === 'stock' && (
                        <div className="space-y-6 max-w-2xl">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Stock Management</h3>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                                    <input
                                        type="number"
                                        name="lowStockThreshold"
                                        value={formData.lowStockThreshold ?? ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Alert Days</label>
                                    <input
                                        type="number"
                                        name="expiryAlertDays"
                                        value={formData.expiryAlertDays ?? ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Alert X days before medicine expires</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Out of Stock Behavior</label>
                                    <select
                                        name="outOfStockBehavior"
                                        value={formData.outOfStockBehavior || 'allow'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
                                    >
                                        <option value="allow">Allow Sale (Negative Stock)</option>
                                        <option value="block">Block Sale</option>
                                        <option value="warn">Warn but Allow</option>
                                    </select>
                                </div>

                                <div className="col-span-2 pt-2">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="autoReorder"
                                            name="autoReorder"
                                            checked={formData.autoReorder || false}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                                        />
                                        <div className="flex flex-col">
                                            <label htmlFor="autoReorder" className="text-gray-700 cursor-pointer select-none font-medium">Auto Reorder Suggestions</label>
                                            <span className="text-xs text-gray-500">Automatically suggest purchase orders for low stock items</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6 max-w-2xl">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Notifications & Alerts</h3>
                            {/* ... existing content ... */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    {/* ... existing content ... */}
                                    <div>
                                        <h4 className="font-medium text-gray-800">Low Stock Alerts</h4>
                                        <p className="text-xs text-gray-500">Show dashboard alerts for low inventory</p>
                                    </div>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input
                                            type="checkbox"
                                            name="lowStockAlerts"
                                            id="lowStockAlerts"
                                            checked={formData.lowStockAlerts || false}
                                            onChange={handleChange}
                                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                            style={{ right: formData.lowStockAlerts ? '0' : 'auto', left: formData.lowStockAlerts ? 'auto' : '0' }}
                                        />
                                        <label htmlFor="lowStockAlerts" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.lowStockAlerts ? 'bg-green-500' : 'bg-gray-300'}`}></label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-gray-800">Expiry Alerts</h4>
                                        <p className="text-xs text-gray-500">Show dashboard alerts for expiring medicines</p>
                                    </div>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input
                                            type="checkbox"
                                            name="expiryAlerts"
                                            id="expiryAlerts"
                                            checked={formData.expiryAlerts || false}
                                            onChange={handleChange}
                                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                            style={{ right: formData.expiryAlerts ? '0' : 'auto', left: formData.expiryAlerts ? 'auto' : '0' }}
                                        />
                                        <label htmlFor="expiryAlerts" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.expiryAlerts ? 'bg-green-500' : 'bg-gray-300'}`}></label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-gray-800">Daily Sales Summary (Email)</h4>
                                        <p className="text-xs text-gray-500">Send end-of-day report to store email</p>
                                    </div>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input
                                            type="checkbox"
                                            name="dailySalesSummary"
                                            id="dailySalesSummary"
                                            checked={formData.dailySalesSummary || false}
                                            onChange={handleChange}
                                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                            style={{ right: formData.dailySalesSummary ? '0' : 'auto', left: formData.dailySalesSummary ? 'auto' : '0' }}
                                        />
                                        <label htmlFor="dailySalesSummary" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.dailySalesSummary ? 'bg-green-500' : 'bg-gray-300'}`}></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Communication (WhatsApp & Email) Tab */}
                    {activeTab === 'whatsapp' && (
                        <div className="space-y-8 max-w-4xl">
                            <WhatsAppSettings />

                            <div className="border-t pt-8">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                    </span>
                                    Email Configuration
                                </h3>

                                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-1 md:col-span-2 bg-blue-50 border border-blue-100 rounded-lg p-4">
                                            <p className="text-sm text-blue-800">
                                                <strong>Note:</strong> Your email password is securely stored in the server configuration and is not shown here.
                                            </p>
                                        </div>

                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email (Receiver)</label>
                                            <input
                                                type="email"
                                                name="ownerEmail"
                                                value={formData.ownerEmail || ''}
                                                onChange={handleChange}
                                                placeholder="Where you want to receive alerts (e.g. owner@example.com)"
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Low stock alerts and daily reports will be sent to this address.</p>
                                        </div>

                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Store Email / SMTP User (Sender)</label>
                                            <input
                                                type="text"
                                                name="smtpUser"
                                                value={formData.smtpUser || ''}
                                                onChange={handleChange}
                                                placeholder="e.g. yourpharmacy@gmail.com"
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">The Gmail account used to send the emails.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Business Settings Tab */}
                    {activeTab === 'business' && (
                        <div className="space-y-6 max-w-2xl">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Business Configuration</h3>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year Start</label>
                                    <input
                                        type="text"
                                        name="fiscalYearStart"
                                        value={formData.fiscalYearStart || '04-01'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                        placeholder="MM-DD"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                                    <select
                                        name="timezone"
                                        value={formData.timezone || 'Asia/Karachi'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
                                    >
                                        <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                                        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                        <option value="Europe/London">Europe/London (BST)</option>
                                        <option value="America/New_York">America/New_York (EST)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                                    <input
                                        type="time"
                                        name="workingHoursStart"
                                        value={formData.workingHoursStart || '09:00'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                                    <input
                                        type="time"
                                        name="workingHoursEnd"
                                        value={formData.workingHoursEnd || '21:00'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Working Days</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                            <button
                                                key={day}
                                                onClick={() => handleDayToggle(day)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.workingDays?.includes(day)
                                                    ? 'bg-green-500 text-white shadow-green-200 shadow-lg'
                                                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* System Settings Tab */}
                    {activeTab === 'system' && (
                        <div className="space-y-6 max-w-2xl">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">System Preferences</h3>

                            <div className="grid grid-cols-2 gap-6">

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                                    <select
                                        name="dateFormat"
                                        value={formData.dateFormat || 'DD/MM/YYYY'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
                                    >
                                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Format</label>
                                    <select
                                        name="timeFormat"
                                        value={formData.timeFormat || '12h'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
                                    >
                                        <option value="12h">12 Hour (09:00 PM)</option>
                                        <option value="24h">24 Hour (21:00)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Backup Frequency</label>
                                    <select
                                        name="backupFrequency"
                                        value={formData.backupFrequency || 'daily'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="manual">Manual Only</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t pt-6 mt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-800">Data Backup</h4>
                                        <p className="text-sm text-gray-500">Manage local backups of your data</p>
                                    </div>
                                    <button
                                        onClick={handleCreateBackup}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? <RefreshCcw className="animate-spin" size={16} /> : <Download size={16} />}
                                        Backup Now
                                    </button>
                                </div>

                                <div className="bg-gray-50 rounded-lg border p-4 max-h-60 overflow-y-auto">
                                    {loadingBackups ? (
                                        <div className="text-center text-gray-500 py-4">Loading backups...</div>
                                    ) : backups.length === 0 ? (
                                        <div className="text-center text-gray-500 py-4">No backups found</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {backups.map(backup => (
                                                <div key={backup.name} className="flex justify-between items-center bg-white p-3 rounded border hover:border-blue-300 transition-colors">
                                                    <div>
                                                        <div className="font-medium text-gray-800 text-sm">{backup.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(backup.created).toLocaleString()} • {(backup.size / 1024).toFixed(1)} KB
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleRestoreBackup(backup.name)}
                                                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                                                            title="Restore this backup"
                                                        >
                                                            <RotateCcw size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownloadBackup(backup.name)}
                                                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded"
                                                            title="Download"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div >
    );
};

export default Settings;
