import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Save, Info, Tag, Package, Beaker } from 'lucide-react';
import API_URL from '../../config/api';
import { useToast } from '../../context/ToastContext';

const ReceiveStockModal = ({ isOpen, onClose, order, onSuccess }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [isFetchingMedicine, setIsFetchingMedicine] = useState(false);

    useEffect(() => {
        if (isOpen && order) {
            initializeItems();
        }
    }, [isOpen, order]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const initializeItems = async () => {
        try {
            setIsFetchingMedicine(true);

            // Initialize with basic order data
            const initialItems = order.items.map(item => ({
                medicineId: item.medicineId,
                medicineName: item.medicineName,
                orderedQuantity: item.billedQuantity,
                receivedQuantity: item.billedQuantity,
                bonusQuantity: item.bonusQuantity || 0,
                batchNumber: '',
                expiryDate: '',
                unitPrice: item.unitPrice, // This is Cost Price from PO
                sellingPrice: 0,
                mrp: 0,
                packSize: 1,
                formula: '',
                netItemTotal: item.netItemTotal
            }));

            // Fetch current medicine details for each item to pre-fill MRD, Formula, etc.
            const updatedItems = await Promise.all(initialItems.map(async (item) => {
                try {
                    const res = await fetch(`${API_URL}/api/medicines/${item.medicineId}`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    if (res.ok) {
                        const med = await res.json();
                        return {
                            ...item,
                            sellingPrice: med.price || med.sellingPrice || (item.unitPrice * 1.2),
                            mrp: med.mrp || 0,
                            packSize: med.packSize || 1,
                            formula: med.formulaCode || med.genericName || ''
                        };
                    }
                } catch (e) {
                    console.error("Error fetching medicine details:", e);
                }
                return item;
            }));

            setItems(updatedItems);
        } catch (error) {
            console.error("Error initializing items:", error);
            showToast("Error loading medicine details", "error");
        } finally {
            setIsFetchingMedicine(false);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        // Recalculate total if quantity changes
        if (field === 'receivedQuantity') {
            const qty = Number(value) || 0;
            const price = Number(newItems[index].unitPrice) || 0;
            newItems[index].netItemTotal = qty * price;
        }

        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const incompleteItem = items.find(i => !i.batchNumber || !i.expiryDate);
        if (incompleteItem) {
            showToast('Please provide Batch Number and Expiry Date for all items', 'error');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/purchase-orders/${order._id}/receive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ items, invoiceDate: new Date().toISOString() })
            });

            if (response.ok) {
                showToast('Stock received and inventory updated', 'success');
                if (onSuccess) onSuccess();
                onClose();
            } else {
                const err = await response.json();
                showToast(err.message || 'Failed to receive stock', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Save size={24} className="text-[#00c950]" />
                            Receive Stock & Verify Details
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">Order #{order._id.slice(-6).toUpperCase()} | Supplier: {order.distributorName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                    {isFetchingMedicine ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00c950]"></div>
                            <p className="text-sm text-gray-500 mt-4">Fetching medicine details...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {items.map((item, index) => (
                                <div key={index} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-[#00c950]/30">
                                    <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-lg bg-[#00c950]/10 flex items-center justify-center text-[#00c950] font-bold text-sm">
                                                {index + 1}
                                            </span>
                                            <h3 className="font-bold text-gray-900 uppercase tracking-tight">{item.medicineName}</h3>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase">
                                            <span>Ordered: {item.orderedQuantity}</span>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="grid grid-cols-12 gap-6">
                                            {/* Left Column: Product Info */}
                                            <div className="col-span-12 lg:col-span-12 grid grid-cols-4 gap-4 mb-4">
                                                <div className="relative">
                                                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase mb-2">
                                                        <Beaker size={12} className="text-teal-500" />
                                                        Formula / Generic
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={item.formula}
                                                        onChange={(e) => handleItemChange(index, 'formula', e.target.value)}
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-[#00c950] focus:ring-4 focus:ring-[#00c950]/10 transition-all"
                                                        placeholder="e.g. Paracetamol"
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase mb-2">
                                                        <Package size={12} className="text-blue-500" />
                                                        Units/Pack
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={item.packSize}
                                                        onChange={(e) => handleItemChange(index, 'packSize', e.target.value)}
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-[#00c950] focus:ring-4 focus:ring-[#00c950]/10 transition-all"
                                                        placeholder="10"
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase mb-2">
                                                        <Tag size={12} className="text-orange-500" />
                                                        MRP
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={item.mrp}
                                                        onChange={(e) => handleItemChange(index, 'mrp', e.target.value)}
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-[#00c950] focus:ring-4 focus:ring-[#00c950]/10 transition-all"
                                                        placeholder="0.00"
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase mb-2">
                                                        <Tag size={12} className="text-green-500" />
                                                        Selling Price
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={item.sellingPrice}
                                                        onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value)}
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-[#00c950] focus:ring-4 focus:ring-[#00c950]/10 transition-all"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>

                                            {/* Physical Details */}
                                            <div className="col-span-12 grid grid-cols-4 gap-4">
                                                <div className="relative">
                                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Quantity (Packs)</label>
                                                    <input
                                                        type="number"
                                                        value={item.receivedQuantity}
                                                        onChange={(e) => handleItemChange(index, 'receivedQuantity', e.target.value)}
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-[#00c950] focus:ring-4 focus:ring-[#00c950]/10 transition-all"
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Bonus Qty</label>
                                                    <input
                                                        type="number"
                                                        value={item.bonusQuantity}
                                                        onChange={(e) => handleItemChange(index, 'bonusQuantity', e.target.value)}
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-[#00c950] focus:ring-4 focus:ring-[#00c950]/10 transition-all"
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-2 flex items-center gap-1">
                                                        Batch # <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={item.batchNumber}
                                                        onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value.toUpperCase())}
                                                        className="w-full bg-white border border-[#00c950]/30 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-[#00c950] focus:ring-4 focus:ring-[#00c950]/15 transition-all"
                                                        placeholder="BCX-21"
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-2 flex items-center gap-1">
                                                        Expiry Date <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={item.expiryDate}
                                                        onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                                                        className="w-full bg-white border border-red-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </form>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3 text-amber-600 bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100 max-w-xl">
                        <Info size={18} className="flex-shrink-0" />
                        <span className="text-[11px] font-bold uppercase tracking-tight leading-relaxed">
                            Verifying these details updates the Medicine master record, updates current stock, and adds new batches to inventory.
                        </span>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3 bg-white border border-gray-300 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || isFetchingMedicine}
                            className="flex items-center gap-3 bg-[#00c950] hover:bg-[#00b347] disabled:bg-gray-300 text-white px-10 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-[#00c950]/20 active:scale-95"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    Verify & Add to Stock
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiveStockModal;
