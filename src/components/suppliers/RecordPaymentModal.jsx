import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import API_URL from '../../config/api';
import { useToast } from '../../context/ToastContext';

const RecordPaymentModal = ({ isOpen, onClose, onSuccess, supplier }) => {
    const { showToast } = useToast();
    const [outstandingBalance, setOutstandingBalance] = useState(0);
    const [formData, setFormData] = useState({
        amount: '',
        referenceNumber: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && supplier) {
            fetchSupplierBalance();
            setFormData({ amount: '', referenceNumber: '' });
        }
    }, [isOpen, supplier]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const fetchSupplierBalance = async () => {
        try {
            const response = await fetch(`${API_URL}/api/suppliers/${supplier._id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setOutstandingBalance(data.stats?.balance || supplier.totalPayable || 0);
        } catch (error) {
            console.error('Error fetching balance:', error);
            setOutstandingBalance(supplier.totalPayable || 0);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.amount || formData.amount <= 0) {
            showToast('Please enter a valid payment amount', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/suppliers/${supplier._id}/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    amount: parseFloat(formData.amount),
                    note: formData.referenceNumber,
                    date: new Date().toISOString(),
                    method: 'Bank Transfer'
                })
            });

            if (response.ok) {
                showToast('Payment recorded successfully', 'success');
                if (onSuccess) onSuccess();
                onClose();
            } else {
                const errorData = await response.json();
                showToast(errorData.message || 'Failed to record payment', 'error');
            }
        } catch (err) {
            console.error('Payment error:', err);
            showToast('Error recording payment', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Record a payment made to {supplier.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Outstanding Balance Display */}
                    <div className={`p-4 rounded-lg border transition-colors ${outstandingBalance < 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            {outstandingBalance < 0 ? 'Supplier Credit' : 'Outstanding Balance'}
                        </label>
                        <div className={`text-2xl font-bold ${outstandingBalance < 0 ? 'text-blue-600' : 'text-red-500'
                            }`}>
                            Rs {Math.abs(outstandingBalance).toLocaleString()}
                            {outstandingBalance < 0 && <span className="text-sm ml-1 font-normal">(Cr)</span>}
                        </div>
                    </div>

                    {/* Payment Amount */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700">
                            Payment Amount (PKR) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                name="amount"
                                required
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="Enter amount"
                                step="0.01"
                                min="0"
                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#00c950] focus:ring-2 focus:ring-[#00c950]/20 transition-all pr-16"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, amount: String((parseFloat(prev.amount) || 0) + 1) }))}
                                    className="text-gray-400 hover:text-gray-600 text-xs leading-none py-0.5"
                                >
                                    ▲
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, amount: String(Math.max(0, (parseFloat(prev.amount) || 0) - 1)) }))}
                                    className="text-gray-400 hover:text-gray-600 text-xs leading-none py-0.5"
                                >
                                    ▼
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Reference Number */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700">Reference Number</label>
                        <input
                            type="text"
                            name="referenceNumber"
                            value={formData.referenceNumber}
                            onChange={handleChange}
                            placeholder="e.g., CHQ-12345"
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-2.5 bg-[#00c950] hover:bg-[#00b347] text-white rounded-lg font-medium text-sm transition-all shadow-sm disabled:opacity-50"
                        >
                            {loading ? 'Recording...' : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordPaymentModal;
