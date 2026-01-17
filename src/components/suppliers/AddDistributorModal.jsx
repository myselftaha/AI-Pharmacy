import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import API_URL from '../../config/api';
import { useToast } from '../../context/ToastContext';

const AddDistributorModal = ({ isOpen, onClose, onSuccess, initialData = null, isEditMode = false }) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        whatsappNumber: '',
        address: '',
        city: '',
        creditDays: 30,
        totalPayable: 0
    });

    useEffect(() => {
        if (isEditMode && initialData) {
            setFormData({
                name: initialData.name || '',
                contactPerson: initialData.contactPerson || '',
                phone: initialData.phone || '',
                email: initialData.email || '',
                whatsappNumber: initialData.whatsappNumber || '',
                address: initialData.address || '',
                city: initialData.city || '',
                creditDays: initialData.creditDays || 30,
                totalPayable: initialData.totalPayable || 0
            });
        } else if (!isOpen) {
            setFormData({
                name: '',
                contactPerson: '',
                phone: '',
                email: '',
                whatsappNumber: '',
                address: '',
                city: '',
                creditDays: 30,
                totalPayable: 0
            });
        }
    }, [isEditMode, initialData, isOpen]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'creditDays' || name === 'totalPayable' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Debug: Log the data being sent
        console.log('Submitting distributor data:', formData);

        try {
            const url = isEditMode
                ? `${API_URL}/api/suppliers/${initialData._id}`
                : `${API_URL}/api/suppliers`;

            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showToast(`Distributor ${isEditMode ? 'updated' : 'added'} successfully`, 'success');
                onSuccess();
                onClose();
            } else {
                const error = await response.json();
                showToast(error.message || 'Error saving distributor', 'error');
            }
        } catch (error) {
            console.error('Error saving distributor:', error);
            showToast('Network error', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Add New Distributor</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Add a new medicine supplier or wholesaler to your system.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">
                                Company Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Muller & Phipps"
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#00c950] focus:ring-2 focus:ring-[#00c950]/20 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">
                                Contact Person <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="contactPerson"
                                required
                                value={formData.contactPerson}
                                onChange={handleChange}
                                placeholder="e.g., Ahmed Khan"
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#00c950] focus:ring-2 focus:ring-[#00c950]/20 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="e.g., 0321-1234567"
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#00c950] focus:ring-2 focus:ring-[#00c950]/20 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="e.g., orders@company.pk"
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#00c950] focus:ring-2 focus:ring-[#00c950]/20 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                            <input
                                type="text"
                                name="whatsappNumber"
                                value={formData.whatsappNumber}
                                onChange={handleChange}
                                placeholder="e.g., 923211234567 (with country code)"
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#00c950] focus:ring-2 focus:ring-[#00c950]/20 transition-all"
                            />
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">
                                Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="address"
                                required
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="e.g., I.I Chundrigar Road"
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#00c950] focus:ring-2 focus:ring-[#00c950]/20 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">
                                City <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="city"
                                required
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="e.g., Karachi"
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#00c950] focus:ring-2 focus:ring-[#00c950]/20 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">Credit Days</label>
                            <input
                                type="number"
                                name="creditDays"
                                value={formData.creditDays}
                                onChange={handleChange}
                                placeholder="30"
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#00c950] focus:ring-2 focus:ring-[#00c950]/20 transition-all"
                            />
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">Outstanding Balance (PKR)</label>
                            <input
                                type="number"
                                name="totalPayable"
                                value={formData.totalPayable}
                                onChange={handleChange}
                                placeholder="0"
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#00c950] focus:ring-2 focus:ring-[#00c950]/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-2.5 bg-[#00c950] hover:bg-[#00b347] text-white rounded-lg font-medium text-sm transition-all shadow-sm"
                        >
                            Add Distributor
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDistributorModal;
