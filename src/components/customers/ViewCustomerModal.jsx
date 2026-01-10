import React, { useEffect } from 'react';
import { X, Mail, Phone, MapPin, Calendar, DollarSign, ShoppingBag } from 'lucide-react';

const ViewCustomerModal = ({ isOpen, onClose, customer }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !customer) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="bg-green-600 p-4 flex justify-between items-center text-white">
                    <h2 className="font-bold text-lg">Customer Details</h2>
                    <button onClick={onClose} className="hover:bg-green-700 p-1 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Customer Name & Avatar */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-2xl">
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">{customer.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${customer.status === 'VIP'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-green-100 text-green-700'
                                }`}>
                                {customer.status}
                            </span>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 mb-3">Contact Information</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Mail size={18} className="text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm font-medium text-gray-800">{customer.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone size={18} className="text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="text-sm font-medium text-gray-800">{customer.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin size={18} className="text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Address</p>
                                        <p className="text-sm font-medium text-gray-800">{customer.address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 mb-3">Purchase History</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Calendar size={18} className="text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Member Since</p>
                                        <p className="text-sm font-medium text-gray-800">{customer.joinDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ShoppingBag size={18} className="text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Total Purchases</p>
                                        <p className="text-sm font-medium text-gray-800">{customer.totalPurchases}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <DollarSign size={18} className="text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Total Spent</p>
                                        <p className="text-sm font-medium text-green-600">${customer.totalSpent.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewCustomerModal;
