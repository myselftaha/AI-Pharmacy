import React, { useState, useEffect } from 'react';
import { X, DollarSign, Wallet } from 'lucide-react';

const CashRefundModal = ({ isOpen, onClose, onConfirm, creditBalance, supplierName }) => {
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const refundAmount = parseFloat(amount);

        if (!refundAmount || refundAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (refundAmount > creditBalance) {
            setError(`Amount cannot exceed available credit (Rs. ${creditBalance.toLocaleString()})`);
            return;
        }

        onConfirm(refundAmount);
        setAmount('');
        setError('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex justify-between items-center text-white">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Record Cash Refund
                    </h2>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 text-sm mb-4">
                        Record a cash refund received from <span className="font-bold text-gray-800">{supplierName}</span>.
                        This will deduct from their credit balance and add to your cash-in-hand.
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-800">Available Credit:</span>
                        <span className="text-lg font-bold text-blue-700">Rs. {creditBalance.toLocaleString()}</span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Refund Amount <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value);
                                        setError('');
                                    }}
                                    className="w-full pl-10 pr-4 py-3 text-lg font-bold text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                />
                            </div>
                            {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                            >
                                Confirm Refund
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CashRefundModal;
