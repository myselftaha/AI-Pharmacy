import React, { useState, useEffect } from 'react';
import { X, Search, Package, AlertCircle, Trash2, ArrowLeftRight, Calendar, Info } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import API_URL from '../../config/api';

const PurchaseReturnModal = ({ isOpen, onClose, supplierId, supplierName, onSuccess }) => {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [batches, setBatches] = useState([]);
    const [returnItems, setReturnItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen && supplierId) {
            fetchSupplierBatches();
        }
    }, [isOpen, supplierId]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const fetchSupplierBatches = async () => {
        try {
            // Updated to fetch only available batches for this supplier
            const response = await fetch(`${API_URL}/api/batches`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            const supplierBatches = data.filter(b =>
                (b.supplierId === supplierId || b.supplierName === supplierName) &&
                b.quantity > 0
            );
            setBatches(supplierBatches);
        } catch (error) {
            console.error('Error fetching batches:', error);
            showToast('Failed to load supplier stock', 'error');
        }
    };

    const handleAddItem = (batch) => {
        if (returnItems.find(item => item.batchId === batch._id)) {
            showToast('Item already in return list', 'info');
            return;
        }

        setReturnItems([
            ...returnItems,
            {
                batchId: batch._id,
                medicineId: batch.medicineId,
                medicineName: batch.medicineName,
                batchNumber: batch.batchNumber,
                maxQty: batch.quantity,
                quantity: 1,
                unitPrice: batch.costPrice || 0,
                total: batch.costPrice || 0,
                expiryDate: batch.expiryDate
            }
        ]);
        showToast(`Added ${batch.medicineName} to returns`, 'success');
    };

    const handleUpdateQty = (idx, qty) => {
        const newItems = [...returnItems];
        const item = newItems[idx];
        const requestedQty = Math.max(1, Math.min(item.maxQty, parseInt(qty) || 0));

        newItems[idx] = {
            ...item,
            quantity: requestedQty,
            total: requestedQty * item.unitPrice
        };
        setReturnItems(newItems);
    };

    const handleRemoveItem = (idx) => {
        setReturnItems(returnItems.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (returnItems.length === 0) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/purchase-returns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    supplierId,
                    items: returnItems,
                    totalAmount: returnItems.reduce((sum, item) => sum + item.total, 0),
                    notes,
                    date: new Date()
                })
            });

            if (response.ok) {
                showToast('Debit Note created and balance adjusted', 'success');
                if (onSuccess) onSuccess();
                onClose();
                setReturnItems([]);
                setNotes('');
            } else {
                const err = await response.json();
                showToast(err.message || 'Failed to process return', 'error');
            }
        } catch (error) {
            console.error('Submit Return Error:', error);
            showToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredBatches = batches.filter(b =>
        b.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalReturnVal = returnItems.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shadow-sm">
                            <ArrowLeftRight size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">Purchase Return</h2>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Adjust Inventory & Credits for {supplierName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-gray-50/20">
                    {/* Left Side: Stock Selection */}
                    <div className="lg:w-1/2 p-6 border-r border-gray-100 flex flex-col gap-6 overflow-hidden">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search products or batch..."
                                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-red-500 shadow-sm transition-all"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Available Stock</h3>
                            {filteredBatches.length > 0 ? (
                                filteredBatches.map(batch => (
                                    <div
                                        key={batch._id}
                                        onClick={() => handleAddItem(batch)}
                                        className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:border-red-200 hover:bg-red-50/10 cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 group-hover:text-red-600 transition-colors uppercase">{batch.medicineName}</p>
                                                <div className="flex items-center gap-3 mt-1.5 text-[9px]">
                                                    <span className="font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase">BN: {batch.batchNumber}</span>
                                                    <span className="font-semibold text-gray-400 flex items-center gap-1">
                                                        <Calendar size={10} /> {new Date(batch.expiryDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-900">Qty: {batch.quantity}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Rs {batch.costPrice}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 opacity-30">
                                    <Package size={40} className="mx-auto text-gray-400 mb-2" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No records found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Return Cart */}
                    <div className="lg:w-1/2 p-6 flex flex-col gap-6 overflow-hidden bg-white/50">
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Return List</h3>
                            {returnItems.map((item, idx) => (
                                <div key={idx} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm relative group animate-in slide-in-from-right-4">
                                    <button
                                        onClick={() => handleRemoveItem(idx)}
                                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>

                                    <div className="flex justify-between items-start pr-6">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 uppercase">{item.medicineName}</p>
                                            <p className="text-[9px] font-semibold text-gray-400 mt-1">Batch: {item.batchNumber} • Exp: {new Date(item.expiryDate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-md font-bold text-red-500">Rs {item.total.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Return Qty</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateQty(idx, e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-sm font-bold text-gray-700 outline-none focus:border-red-500"
                                                />
                                                <span className="text-[10px] font-semibold text-gray-400">/ {item.maxQty}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1 opacity-60">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Cost Rate</label>
                                            <div className="bg-gray-100 rounded-lg px-2 py-1 text-sm font-bold text-gray-500">
                                                Rs {item.unitPrice}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {returnItems.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
                                    <ArrowLeftRight size={50} className="text-gray-300" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Select items to return</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Info size={12} /> Remarks
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-red-500 h-24 resize-none shadow-sm transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="p-6 border-t border-gray-100 bg-white grid grid-cols-12 gap-8 flex-shrink-0">
                    <div className="col-span-12 lg:col-span-7 flex items-center">
                        <div className="bg-red-50/50 p-4 rounded-xl text-red-500 flex items-center gap-3 border border-red-100">
                            <AlertCircle size={18} className="shrink-0" />
                            <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                This will reduce shop inventory and <br />
                                deduct the total from distributor ledger.
                            </p>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-5 flex flex-col items-end gap-4 justify-center">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated Adjustment</span>
                            <span className="text-3xl font-bold text-red-500">Rs {totalReturnVal.toLocaleString()}</span>
                        </div>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-2.5 bg-white border border-gray-200 text-gray-400 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || returnItems.length === 0}
                                className="flex-[2] px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Authorize Return'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseReturnModal;
