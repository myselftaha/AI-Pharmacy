import React, { useState, useEffect } from 'react';
import { X, Ticket, Check, AlertCircle, Search } from 'lucide-react';
import API_URL from '../../config/api';


const ApplyVoucherModal = ({ isOpen, onClose, onApply, cartTotal }) => {
    const [voucherCode, setVoucherCode] = useState('');
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [validating, setValidating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchActiveVouchers();
            setVoucherCode('');
            setError('');
            setSuccess('');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const fetchActiveVouchers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/vouchers`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            // Filter only active vouchers that are valid today
            const now = new Date();
            const active = data.filter(v =>
                v.status === 'Active' &&
                new Date(v.validFrom) <= now &&
                new Date(v.validUntil) >= now &&
                v.usedCount < v.maxUses
            );
            setAvailableVouchers(active);
        } catch (err) {
            console.error('Error fetching vouchers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleValidateAndApply = async (code) => {
        setValidating(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_URL}/api/vouchers/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ code, purchaseAmount: cartTotal })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Voucher applied! Discount: Rs. ${data.discountAmount.toFixed(2)}`);
                setTimeout(() => {
                    onApply(data.voucher, data.discountAmount);
                    onClose();
                }, 1000);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to validate voucher. Please try again.');
        } finally {
            setValidating(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!voucherCode.trim()) return;
        handleValidateAndApply(voucherCode);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Ticket className="text-green-600" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Apply Voucher</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Enter Voucher Code
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={voucherCode}
                                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                placeholder="e.g., SAVE20"
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 uppercase"
                            />
                            <button
                                type="submit"
                                disabled={validating || !voucherCode.trim()}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {validating ? 'Checking...' : 'Apply'}
                            </button>
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                                <Check size={16} />
                                <span>{success}</span>
                            </div>
                        )}
                    </form>

                    {/* Available Vouchers List */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                            Available Vouchers
                        </h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {loading ? (
                                <div className="text-center py-4 text-gray-400 text-sm">Loading vouchers...</div>
                            ) : availableVouchers.length > 0 ? (
                                availableVouchers.map(voucher => (
                                    <div
                                        key={voucher._id}
                                        onClick={() => setVoucherCode(voucher.code)}
                                        className="p-3 border border-gray-100 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-gray-800 group-hover:text-green-700">
                                                {voucher.code}
                                            </span>
                                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                {voucher.discountType === 'Percentage' ? `${voucher.discountValue}% OFF` : `Rs. ${voucher.discountValue} OFF`}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-1">{voucher.description}</p>
                                        {voucher.minPurchase > 0 && (
                                            <p className="text-xs text-gray-400 mt-1">Min. purchase: Rs. {voucher.minPurchase}</p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
                                    No active vouchers available
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplyVoucherModal;
