import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const VoidModal = ({ isOpen, onClose, onConfirm, transaction }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !transaction) return null;

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError('Please provide a reason for voiding this transaction.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await onConfirm(transaction, reason);
            setReason(''); // Reset after success
            onClose();
        } catch (err) {
            setError('Failed to void transaction. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] transition-all duration-300">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl scale-100 opacity-100 transform transition-all border border-gray-100">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full text-red-600">
                            <AlertTriangle size={20} className="stroke-[2.5px]" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Void Transaction</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-600 leading-relaxed">
                        Are you sure you want to void transaction <span className="font-bold text-gray-900">{transaction.transactionId}</span>?
                        <br />
                        <span className="text-sm text-red-500 mt-1 block">This action cannot be undone and will restore inventory.</span>
                    </p>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Amount:</span>
                            <span className="font-bold text-gray-900">Rs. {transaction.total?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Customer:</span>
                            <span className="font-bold text-gray-900">{transaction.customer?.name || 'Walk-in'}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                            Reason for Voiding <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder="e.g., Customer returned items, Entry error..."
                            className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm min-h-[80px] resize-none
                                ${error
                                    ? 'border-red-300 focus:ring-red-100'
                                    : 'border-gray-200 focus:border-red-500 focus:ring-red-500/10'
                                }`}
                            autoFocus
                        />
                        {error && (
                            <p className="text-xs text-red-500 font-medium animate-pulse">
                                {error}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-600 font-semibold text-sm hover:bg-gray-100 rounded-xl transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-red-600 text-white font-semibold text-sm rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Voiding...
                            </>
                        ) : (
                            'Confirm Void'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoidModal;
