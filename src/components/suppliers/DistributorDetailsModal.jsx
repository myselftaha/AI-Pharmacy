import React, { useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Clock, Wallet, MessageCircle } from 'lucide-react';

const DistributorDetailsModal = ({ isOpen, onClose, supplier }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !supplier) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Distributor Details</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Complete information about this distributor.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Distributor Header */}
                    <div className="flex items-start justify-between pb-6 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center">
                                <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{supplier.name}</h3>
                                <p className="text-gray-500 text-sm mt-0.5">{supplier.city || 'Location Not Set'}</p>
                            </div>
                        </div>
                        {supplier.totalPayable > 0 && (
                            <span className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                                Outstanding Balance
                            </span>
                        )}
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                            Contact Information
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <User size={18} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Contact Person</p>
                                    <p className="text-sm font-semibold text-gray-900">{supplier.contactPerson || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Phone size={18} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                                    <p className="text-sm font-semibold text-gray-900">{supplier.phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Mail size={18} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Email</p>
                                    <p className="text-sm font-semibold text-gray-900 truncate">{supplier.email || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <MapPin size={18} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Address</p>
                                    <p className="text-sm font-semibold text-gray-900">{supplier.address || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-[#25D366]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <MessageCircle size={18} className="text-[#25D366]" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">WhatsApp</p>
                                    <p className="text-sm font-semibold text-gray-900">{supplier.whatsappNumber || 'Not Set'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Details */}
                    <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                            Financial Details
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Clock size={18} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Credit Days</p>
                                    <p className="text-sm font-semibold text-gray-900">{supplier.creditDays || 30} days</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Wallet size={18} className="text-red-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Outstanding Balance</p>
                                    <p className="text-sm font-bold text-red-500">Rs {supplier.totalPayable?.toLocaleString() || 0}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Calendar size={18} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Added On</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {supplier.createdAt
                                            ? new Date(supplier.createdAt).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })
                                            : 'N/A'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DistributorDetailsModal;
