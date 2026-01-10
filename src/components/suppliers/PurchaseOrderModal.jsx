import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import API_URL from '../../config/api';
import { useToast } from '../../context/ToastContext';

const PurchaseOrderModal = ({ isOpen, onClose, supplier, onSuccess }) => {
    const { showToast } = useToast();
    const [medicines, setMedicines] = useState([]);
    const [orderItems, setOrderItems] = useState([
        {
            medicineId: '',
            medicineName: '',
            quantity: 1,
            unitPrice: 0,
            total: 0
        }
    ]);
    const [orderStatus, setOrderStatus] = useState('Pending');
    const [expectedDelivery, setExpectedDelivery] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchMedicines();
            setExpectedDelivery('');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const fetchMedicines = async () => {
        try {
            const response = await fetch(`${API_URL}/api/medicines`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setMedicines(data);
        } catch (error) {
            console.error('Error fetching medicines:', error);
        }
    };

    const addItem = () => {
        setOrderItems([...orderItems, {
            medicineId: '',
            medicineName: '',
            quantity: 1,
            unitPrice: 0,
            total: 0
        }]);
    };

    const removeItem = (index) => {
        if (orderItems.length > 1) {
            const newItems = orderItems.filter((_, i) => i !== index);
            setOrderItems(newItems);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...orderItems];

        if (field === 'medicineId') {
            const med = medicines.find(m => m._id === value || m.id === Number(value));
            newItems[index].medicineId = value;
            newItems[index].medicineName = med ? med.name : '';
            newItems[index].unitPrice = med ? (med.costPrice || 0) : 0;
        } else {
            newItems[index][field] = value;
        }

        // Calculate total
        const qty = Number(newItems[index].quantity) || 0;
        const price = Number(newItems[index].unitPrice) || 0;
        newItems[index].total = qty * price;

        setOrderItems(newItems);
    };

    const subtotal = orderItems.reduce((acc, item) => acc + item.total, 0);
    const gst = 0; // Removed default 17% tax
    const grandTotal = subtotal + gst;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const invalidItem = orderItems.find(i => !i.medicineId);
        if (invalidItem) {
            showToast('Please select medicine for all rows', 'error');
            return;
        }

        try {
            // Prepare items with all required fields for backend
            const preparedItems = orderItems.map(item => ({
                medicineId: item.medicineId,
                medicineName: item.medicineName,
                batchNumber: `BATCH-${Date.now()}`, // Auto-generate batch number
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year from now
                billedQuantity: item.quantity,
                bonusQuantity: 0,
                unitPrice: item.unitPrice,
                tradeDiscount: 0,
                taxPercent: 17,
                netItemTotal: item.total,
                costPerUnit: item.unitPrice
            }));

            const response = await fetch(`${API_URL}/api/purchase-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    distributorId: supplier._id,
                    distributorInvoiceNumber: `INV-${Date.now()}`,
                    invoiceDate: new Date().toISOString(),
                    items: preparedItems,
                    status: orderStatus,
                    expectedDelivery: expectedDelivery || new Date().toISOString(),
                    notes: '',
                    subtotal,
                    gstAmount: gst,
                    whtAmount: 0,
                    total: grandTotal
                })
            });

            if (response.ok) {
                showToast('Purchase order created successfully', 'success');
                if (onSuccess) onSuccess(); // Notify parent to refresh list
                onClose();
            } else {
                const errorData = await response.json();
                console.error('Purchase order error:', errorData);
                showToast(errorData.message || 'Failed to create purchase order', 'error');
            }
        } catch (error) {
            console.error('Error saving order:', error);
            showToast('Network error', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Create Purchase Order</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Create a new order for {supplier.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Order Items */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-700">Order Items</h3>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
                            >
                                <Plus size={16} />
                                Add Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {orderItems.map((item, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="grid grid-cols-12 gap-3 items-end">
                                        <div className="col-span-5">
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Medicine</label>
                                            <select
                                                value={item.medicineId}
                                                onChange={(e) => handleItemChange(index, 'medicineId', e.target.value)}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                                            >
                                                <option value="">Select medicine</option>
                                                {medicines.map(m => (
                                                    <option key={m._id} value={m._id || m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5 whitespace-nowrap">Quantity (Packs)</label>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5 whitespace-nowrap">Price per Pack</label>
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Total</label>
                                            <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900">
                                                Rs {item.total}
                                            </div>
                                        </div>

                                        <div className="col-span-1 flex justify-end">
                                            {orderItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex items-start gap-3">
                            <div className="p-1 bg-amber-100 rounded text-amber-600">
                                <AlertCircle size={16} />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-amber-900">Pending Order</h4>
                                <p className="text-xs text-amber-700 mt-0.5">This order will be created as <strong>Pending</strong>. Stock will be updated only after you verify and "Receive" it from the ledger.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected Delivery</label>
                            <input
                                type="date"
                                value={expectedDelivery}
                                onChange={(e) => setExpectedDelivery(e.target.value)}
                                placeholder="dd----yyyy"
                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between gap-12">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium text-gray-900">Rs {subtotal.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between gap-12">
                                <span className="text-gray-600">GST</span>
                                <span className="font-medium text-gray-900">Rs {gst.toFixed(0)}</span>
                            </div>
                            <div className="h-px bg-gray-200 my-2"></div>
                            <div className="flex justify-between gap-12">
                                <span className="text-lg font-semibold text-gray-900">Total</span>
                                <span className="text-lg font-bold text-[#00c950]">Rs {grandTotal.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="flex-1 px-6 py-2.5 bg-[#00c950] hover:bg-[#00b347] text-white rounded-lg font-medium text-sm transition-all shadow-sm"
                        >
                            Create Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrderModal;
