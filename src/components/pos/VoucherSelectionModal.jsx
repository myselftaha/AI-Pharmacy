import React, { useState, useEffect } from 'react';
import { X, Search, Ticket, Calendar, DollarSign } from 'lucide-react';
import API_URL from '../../config/api';


const VoucherSelectionModal = ({ isOpen, onClose, onSelectVoucher, currentVoucher }) => {
    const [vouchers, setVouchers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchVouchers();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/vouchers`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            // Filter only active vouchers
            setVouchers(data.filter(v => v.status === 'Active'));
        } catch (error) {
            console.error('Error fetching vouchers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredVouchers = vouchers.filter(voucher =>
        voucher.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voucher.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleSelect = (voucher) => {
        onSelectVoucher(voucher);
        onClose();
    };

    const handleRemoveVoucher = () => {
        onSelectVoucher(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-800">Select Voucher</h2>
                        {currentVoucher && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                Current: {currentVoucher.code}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {currentVoucher && (
                            <button
                                onClick={handleRemoveVoucher}
                                className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
                            >
                                Remove Voucher
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search vouchers by code or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Voucher List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading vouchers...</div>
                    ) : filteredVouchers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchQuery ? 'No vouchers found matching your search' : 'No active vouchers available'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredVouchers.map((voucher) => (
                                <div
                                    key={voucher._id || voucher.id}
                                    onClick={() => handleSelect(voucher)}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 group-hover:bg-green-200 transition-colors">
                                            <Ticket size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-lg">{voucher.code}</h4>
                                            <p className="text-sm text-gray-500">{voucher.description}</p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    <span>Valid until {formatDate(voucher.validUntil)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <DollarSign size={12} />
                                                    <span>Min. spend Rs. {voucher.minPurchase}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-green-600">
                                            {voucher.discountType === 'Percentage'
                                                ? `${voucher.discountValue}% OFF`
                                                : `Rs. ${voucher.discountValue} OFF`}
                                        </div>
                                        <button className="mt-2 px-4 py-1 bg-green-500 text-white text-sm rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <div className="text-sm text-gray-500">
                        Showing {filteredVouchers.length} active vouchers
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoucherSelectionModal;
