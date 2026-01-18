import React, { useState, useEffect } from 'react';
import { X, Ticket, Calendar, DollarSign } from 'lucide-react';

const AddVoucherModal = ({ isOpen, onClose, onSave }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'Percentage',
        discountValue: '',
        minPurchase: '0',
        maxDiscount: '',
        validFrom: '',
        validUntil: '',
        maxUses: ''
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.code.trim()) newErrors.code = 'Voucher code is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.discountValue || formData.discountValue <= 0) {
            newErrors.discountValue = 'Discount value must be greater than 0';
        }
        if (formData.discountType === 'Percentage' && formData.discountValue > 100) {
            newErrors.discountValue = 'Percentage cannot exceed 100%';
        }
        if (!formData.validFrom) newErrors.validFrom = 'Start date is required';
        if (!formData.validUntil) newErrors.validUntil = 'End date is required';
        if (formData.validFrom && formData.validUntil && new Date(formData.validFrom) > new Date(formData.validUntil)) {
            newErrors.validUntil = 'End date must be after start date';
        }
        if (!formData.maxUses || formData.maxUses <= 0) {
            newErrors.maxUses = 'Max uses must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        const voucherData = {
            code: formData.code.toUpperCase(),
            description: formData.description,
            discountType: formData.discountType,
            discountValue: parseFloat(formData.discountValue),
            minPurchase: parseFloat(formData.minPurchase) || 0,
            maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
            validFrom: new Date(formData.validFrom),
            validUntil: new Date(formData.validUntil),
            maxUses: parseInt(formData.maxUses),
            status: 'Active'
        };

        await onSave(voucherData);
        handleClose();
    };

    const handleClose = () => {
        setFormData({
            code: '',
            description: '',
            discountType: 'Percentage',
            discountValue: '',
            minPurchase: '0',
            maxDiscount: '',
            validFrom: '',
            validUntil: '',
            maxUses: ''
        });
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Ticket className="text-green-600" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Create New Voucher</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Voucher Code */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Voucher Code *
                        </label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            placeholder="e.g., SAVE20"
                            className={`w-full px-4 py-2 border ${errors.code ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 uppercase`}
                        />
                        {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe the voucher offer"
                            rows="2"
                            className={`w-full px-4 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500`}
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>

                    {/* Discount Type and Value */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Discount Type *
                            </label>
                            <select
                                name="discountType"
                                value={formData.discountType}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                            >
                                <option value="Percentage">Percentage (%)</option>
                                <option value="Fixed">Fixed Amount (Rs.)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Discount Value *
                            </label>
                            <input
                                type="number"
                                name="discountValue"
                                value={formData.discountValue}
                                onChange={handleChange}
                                placeholder={formData.discountType === 'Percentage' ? '20' : '10.00'}
                                step={formData.discountType === 'Percentage' ? '1' : '0.01'}
                                className={`w-full px-4 py-2 border ${errors.discountValue ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500`}
                            />
                            {errors.discountValue && <p className="text-red-500 text-xs mt-1">{errors.discountValue}</p>}
                        </div>
                    </div>

                    {/* Min Purchase and Max Discount */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Min. Purchase (Rs.)
                            </label>
                            <input
                                type="number"
                                name="minPurchase"
                                value={formData.minPurchase}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Max Discount (Rs.)
                                {formData.discountType === 'Fixed' && <span className="text-gray-400 text-xs ml-1">(Optional)</span>}
                            </label>
                            <input
                                type="number"
                                name="maxDiscount"
                                value={formData.maxDiscount}
                                onChange={handleChange}
                                placeholder={formData.discountType === 'Percentage' ? '50.00' : 'N/A'}
                                step="0.01"
                                disabled={formData.discountType === 'Fixed'}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 disabled:bg-gray-100"
                            />
                        </div>
                    </div>

                    {/* Valid Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Valid From *
                            </label>
                            <input
                                type="date"
                                name="validFrom"
                                value={formData.validFrom}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border ${errors.validFrom ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500`}
                            />
                            {errors.validFrom && <p className="text-red-500 text-xs mt-1">{errors.validFrom}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Valid Until *
                            </label>
                            <input
                                type="date"
                                name="validUntil"
                                value={formData.validUntil}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border ${errors.validUntil ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500`}
                            />
                            {errors.validUntil && <p className="text-red-500 text-xs mt-1">{errors.validUntil}</p>}
                        </div>
                    </div>

                    {/* Max Uses */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Maximum Uses *
                        </label>
                        <input
                            type="number"
                            name="maxUses"
                            value={formData.maxUses}
                            onChange={handleChange}
                            placeholder="100"
                            className={`w-full px-4 py-2 border ${errors.maxUses ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500`}
                        />
                        {errors.maxUses && <p className="text-red-500 text-xs mt-1">{errors.maxUses}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                        >
                            Create Voucher
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddVoucherModal;
