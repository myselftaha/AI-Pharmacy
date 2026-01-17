import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, MessageCircle } from 'lucide-react';
import API_URL from '../../config/api';
import { useToast } from '../../context/ToastContext';
import AddMedicineModal from '../supplies/AddMedicineModal';

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
    const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
    const [currentItemIndex, setCurrentItemIndex] = useState(null);
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchMedicines();
            fetchSuppliers();
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
            const response = await fetch(`${API_URL}/api/supplies`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();

            // Handle both formats: direct array or paginated { data: [...] }
            let suppliesData = [];
            if (Array.isArray(data)) {
                suppliesData = data;
            } else if (data.data && Array.isArray(data.data)) {
                suppliesData = data.data;
            }

            // Group supplies by medicine name and keep only one per medicine
            // Prioritize supplies with cost price info
            const uniqueMedicines = {};
            suppliesData.forEach(supply => {
                const nameKey = supply.name?.trim().toLowerCase();
                if (!nameKey) return;

                // Extract price from various possible fields
                const price = supply.costPrice || supply.unitCost || supply.purchasePrice || supply.price || 0;

                // If we don't have this medicine yet, or the new one has better pricing info
                if (!uniqueMedicines[nameKey] ||
                    (price > 0 && (!uniqueMedicines[nameKey].costPrice || uniqueMedicines[nameKey].costPrice === 0))) {
                    uniqueMedicines[nameKey] = {
                        _id: supply._id,
                        id: supply._id,
                        name: supply.name,
                        costPrice: price
                    };
                }
            });

            setMedicines(Object.values(uniqueMedicines));
        } catch (error) {
            console.error('Error fetching medicines:', error);
            setMedicines([]);
        }
    };

    const handleAddNewMedicine = (itemIndex) => {
        setCurrentItemIndex(itemIndex);
        setShowAddMedicineModal(true);
    };

    const handleMedicineAdded = async (newMedicine) => {
        // Refresh medicine list
        await fetchMedicines();

        // Auto-select the newly added medicine for the current item
        if (currentItemIndex !== null && newMedicine && newMedicine._id) {
            handleItemChange(currentItemIndex, 'medicineId', newMedicine._id);
        }

        setShowAddMedicineModal(false);
        setCurrentItemIndex(null);
        showToast('Medicine added successfully', 'success');
    };

    const fetchSuppliers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/suppliers`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSuppliers(data);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
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

    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

    const handleWhatsAppSend = async () => {
        // Validate order items
        const invalidItem = orderItems.find(i => !i.medicineId);
        if (invalidItem) {
            showToast('Please select medicine for all rows', 'error');
            return;
        }

        // Check if supplier has WhatsApp number
        if (!supplier.whatsappNumber) {
            showToast('Supplier WhatsApp number not available. Please update supplier details.', 'error');
            return;
        }

        try {
            setSendingWhatsApp(true);
            const token = localStorage.getItem('token');

            // Check connection first
            const statusRes = await fetch(`${API_URL}/api/whatsapp/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const statusData = await statusRes.json();

            if (statusData.status !== 'AUTHENTICATED' && statusData.status !== 'READY') {
                if (window.confirm('WhatsApp is not connected in Settings. Do you want to fallback to WhatsApp Web/Desktop app?')) {
                    // Fallback to original window.open logic
                    const orderDate = new Date().toLocaleDateString('en-PK');
                    const deliveryDate = expectedDelivery ? new Date(expectedDelivery).toLocaleDateString('en-PK') : 'Not specified';

                    let message = `*📦 PURCHASE ORDER REQUEST*\n\n`;
                    message += `*From:* AI Pharmacy\n`;
                    message += `*To:* ${supplier.name}\n`;
                    message += `*Date:* ${orderDate}\n`;
                    message += `*Expected Delivery:* ${deliveryDate}\n\n`;
                    message += `*ORDER ITEMS:*\n`;
                    message += `─────────────────────\n`;

                    orderItems.forEach((item, index) => {
                        message += `${index + 1}. *${item.medicineName}*\n`;
                        message += `   Qty: ${item.quantity} packs\n`;
                        message += `   Price: Rs ${item.unitPrice}\n`;
                        message += `   Total: Rs ${item.total}\n\n`;
                    });

                    message += `─────────────────────\n`;
                    message += `*Subtotal:* Rs ${subtotal.toFixed(0)}\n`;
                    if (gst > 0) message += `*GST:* Rs ${gst.toFixed(0)}\n`;
                    message += `*GRAND TOTAL:* Rs ${grandTotal.toFixed(0)}\n\n`;
                    message += `Please confirm availability and delivery date.\n`;
                    message += `Thank you! 🙏`;

                    const encodedMessage = encodeURIComponent(message);
                    const cleanNumber = supplier.whatsappNumber.replace(/[^0-9]/g, '');
                    window.open(`https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMessage}`, '_blank');
                }
                setSendingWhatsApp(false);
                return;
            }

            // Construct Message for API
            const orderDate = new Date().toLocaleDateString('en-PK');
            const deliveryDate = expectedDelivery ? new Date(expectedDelivery).toLocaleDateString('en-PK') : 'Not specified';

            let message = `*📦 PURCHASE ORDER REQUEST*\n\n`;
            message += `*From:* AI Pharmacy\n`;
            message += `*To:* ${supplier.name}\n`;
            message += `*Date:* ${orderDate}\n`;
            message += `*Expected Delivery:* ${deliveryDate}\n\n`;
            message += `*ORDER ITEMS:*\n`;
            message += `─────────────────────\n`;

            orderItems.forEach((item, index) => {
                message += `${index + 1}. *${item.medicineName}*\n`;
                message += `   Qty: ${item.quantity} packs\n`;
                message += `   Price: Rs ${item.unitPrice}\n`;
                message += `   Total: Rs ${item.total}\n\n`;
            });

            message += `─────────────────────\n`;
            message += `*Subtotal:* Rs ${subtotal.toFixed(0)}\n`;
            if (gst > 0) message += `*GST:* Rs ${gst.toFixed(0)}\n`;
            message += `*GRAND TOTAL:* Rs ${grandTotal.toFixed(0)}\n\n`;
            message += `Please confirm availability and delivery date.\n`;
            message += `Thank you! 🙏`;

            // Send via API
            const response = await fetch(`${API_URL}/api/whatsapp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    number: supplier.whatsappNumber,
                    message: message
                })
            });

            const data = await response.json();
            if (response.ok) {
                showToast('Message sent directly to WhatsApp!', 'success');
            } else {
                console.error('WhatsApp API Failure:', data);
                showToast(`Failed to send: ${data.message || 'Unknown Server Error'}`, 'error');
            }

        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            showToast('Error sending message', 'error');
        } finally {
            setSendingWhatsApp(false);
        }
    };

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
                                            <div className="flex gap-2">
                                                <select
                                                    value={item.medicineId}
                                                    onChange={(e) => handleItemChange(index, 'medicineId', e.target.value)}
                                                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                                                >
                                                    <option value="" disabled>Select medicine</option>
                                                    {Array.isArray(medicines) && medicines.map(m => (
                                                        <option key={m._id} value={m._id || m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddNewMedicine(index)}
                                                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1"
                                                    title="Add new medicine"
                                                >
                                                    <Plus size={14} />
                                                    Add
                                                </button>
                                            </div>
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
                        {supplier.whatsappNumber && (
                            <button
                                type="button"
                                onClick={handleWhatsAppSend}
                                disabled={sendingWhatsApp}
                                className={`flex items-center gap-2 px-6 py-2.5 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-lg font-medium text-sm transition-all shadow-sm ${sendingWhatsApp ? 'opacity-75 cursor-wait' : ''}`}
                            >
                                <MessageCircle size={18} />
                                {sendingWhatsApp ? 'Sending...' : 'Send via WhatsApp'}
                            </button>
                        )}
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

            {/* Add Medicine Modal */}
            <AddMedicineModal
                isOpen={showAddMedicineModal}
                onClose={() => {
                    setShowAddMedicineModal(false);
                    setCurrentItemIndex(null);
                }}
                onSave={handleMedicineAdded}
                suppliers={suppliers}
                initialSupplier={supplier}
            />
        </div>
    );
};

export default PurchaseOrderModal;
