import React, { useState, useEffect } from 'react';
import { X, Save, Info, Tag, Package, Percent, DollarSign, MapPin } from 'lucide-react';

const EditInventoryModal = ({ isOpen, onClose, onConfirm, product }) => {
    const [formData, setFormData] = useState({
        name: '',
        genericName: '', // Formula Code
        category: '',
        description: '',
        boxNumber: '',
        stock: '',
        packSize: '',
        minStock: '',
        expiryDate: '',
        costPrice: '',
        mrp: '',
        price: '', // Selling Price
        discountPercentage: '',
        margin: '',
        cgstPercentage: '',
        sgstPercentage: '',
        igstPercentage: ''
    });

    useEffect(() => {
        if (isOpen && product) {
            const price = product.price || 0;
            const cost = product.costPrice || 0;
            setFormData({
                name: product.name || '',
                genericName: product.genericName || product.formulaCode || '',
                category: product.category || '',
                description: product.description || '',
                boxNumber: product.boxNumber || '',
                stock: (product.stock / (product.packSize || 1)).toFixed(1),
                packSize: product.packSize || 1,
                minStock: product.minStock || 10,
                expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
                costPrice: cost,
                mrp: product.mrp || 0,
                price: price,
                discountPercentage: product.discountPercentage || 0,
                margin: calculateMargin(price, cost),
                cgstPercentage: product.cgstPercentage || 0,
                sgstPercentage: product.sgstPercentage || 0,
                igstPercentage: product.igstPercentage || 0
            });
        }
    }, [isOpen, product]);

    const calculateMargin = (price, cost) => {
        if (!price || !cost || parseFloat(price) === 0) return '0.00';
        const margin = ((parseFloat(price) - parseFloat(cost)) / parseFloat(price)) * 100;
        return margin.toFixed(2);
    };

    const handlePriceChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // If MRP or Discount changes, update Selling Price (price)
            if (field === 'mrp' || field === 'discountPercentage') {
                const mrp = parseFloat(field === 'mrp' ? value : prev.mrp) || 0;
                const disc = parseFloat(field === 'discountPercentage' ? value : prev.discountPercentage) || 0;
                newData.price = (mrp * (1 - disc / 100)).toFixed(2);
            }

            // Always update margin when prices change
            newData.margin = calculateMargin(newData.price, newData.costPrice);
            return newData;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(product._id, formData);
    };

    if (!isOpen || !product) return null;

    const InputField = ({ label, name, value, type = "text", onChange, icon: Icon, readOnly = false, placeholder = "" }) => (
        <div className="space-y-1.5">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                {Icon && <Icon size={12} className="text-gray-400" />}
                {label}
            </label>
            <div className="relative group">
                <input
                    type={type}
                    value={value}
                    readOnly={readOnly}
                    placeholder={placeholder}
                    onChange={(e) => onChange ? onChange(e) : setFormData(prev => ({ ...prev, [name]: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl border text-[13px] font-semibold transition-all outline-none 
                        ${readOnly
                            ? 'bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-white border-gray-200 group-hover:border-green-300 focus:border-green-600 focus:ring-4 focus:ring-green-600/5'}`}
                />
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
            <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-600 p-8 flex justify-between items-center text-white shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">Inventory Editor</div>
                            <span className="text-white/40 text-xs font-medium">ID: {product._id || product.id}</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">{product.name}</h2>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all active:scale-90 border border-white/10">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/30">
                    <div className="grid grid-cols-12 gap-8">

                        {/* LEFT COLUMN: Metadata & Stock */}
                        <div className="col-span-12 lg:col-span-7 space-y-8">

                            {/* Section: Basic Information */}
                            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-5">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-50">
                                    <Info size={18} className="text-green-600" />
                                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Product Details</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Product Name" value={formData.name} name="name" icon={Package} />
                                    <InputField label="Formula / Generic Name" value={formData.genericName} name="genericName" icon={Tag} placeholder="e.g. Paracetamol" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Category" value={formData.category} name="category" />
                                    <InputField label="Shelf Location / Box" value={formData.boxNumber} name="boxNumber" icon={MapPin} placeholder="e.g. Rack A-12" />
                                </div>
                                <InputField label="Description" value={formData.description} name="description" placeholder="Notes about this product..." />
                            </div>

                            {/* Section: Inventory Control */}
                            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-5">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-50">
                                    <Package size={18} className="text-green-500" />
                                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Stock & Tracking</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <InputField label="Current Packs" value={formData.stock} name="stock" type="number" />
                                    <InputField label="Items / Pack" value={formData.packSize} name="packSize" type="number" />
                                    <InputField label="Low Stock Alert" value={formData.minStock} name="minStock" type="number" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Expiry Date" value={formData.expiryDate} name="expiryDate" type="date" />
                                    <div className="flex items-end pb-1.5 px-1">
                                        <div className="text-[10px] text-gray-400 font-medium italic">
                                            * Stock is stored as individual units in database.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Pricing & Tax */}
                        <div className="col-span-12 lg:col-span-5 space-y-8">

                            {/* Section: Pricing Strategy */}
                            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-5">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-50">
                                    <DollarSign size={18} className="text-orange-500" />
                                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Pricing Strategy</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label="Purchase Cost (Pack)"
                                        value={formData.costPrice}
                                        name="costPrice"
                                        type="number"
                                        onChange={(e) => handlePriceChange('costPrice', e.target.value)}
                                    />
                                    <InputField
                                        label="MRP (Pack)"
                                        value={formData.mrp}
                                        name="mrp"
                                        type="number"
                                        onChange={(e) => handlePriceChange('mrp', e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label="Discount %"
                                        value={formData.discountPercentage}
                                        name="discountPercentage"
                                        type="number"
                                        icon={Percent}
                                        onChange={(e) => handlePriceChange('discountPercentage', e.target.value)}
                                    />
                                    <InputField
                                        label="Final Sale Price"
                                        value={formData.price}
                                        name="price"
                                        type="number"
                                        onChange={(e) => handlePriceChange('price', e.target.value)}
                                    />
                                </div>
                                <div className="bg-green-50 p-4 rounded-2xl flex justify-between items-center border border-green-100">
                                    <span className="text-[10px] font-black text-green-700 uppercase">Projected Profit Margin</span>
                                    <span className={`text-xl font-black ${parseFloat(formData.margin) < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                                        {formData.margin}%
                                    </span>
                                </div>
                            </div>

                            {/* Section: Taxation (GST) */}
                            <div className="bg-green-600/5 p-6 rounded-[24px] border border-green-600/10 space-y-5">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-green-600/10">
                                    <Tag size={18} className="text-green-600" />
                                    <h3 className="text-sm font-black text-green-600 uppercase tracking-wide">Taxation Settings (GST)</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <InputField label="CGST %" value={formData.cgstPercentage} name="cgstPercentage" type="number" />
                                    <InputField label="SGST %" value={formData.sgstPercentage} name="sgstPercentage" type="number" />
                                    <InputField label="IGST %" value={formData.igstPercentage} name="igstPercentage" type="number" />
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-gray-100 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all active:scale-95 text-sm"
                        >
                            Cancel Changes
                        </button>
                        <button
                            type="submit"
                            className="px-10 py-3.5 bg-gradient-to-r from-green-600 to-green-600 text-white rounded-2xl font-black text-sm hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-green-600/40 transition-all active:scale-95 flex items-center gap-3"
                        >
                            <Save size={20} />
                            Commit Update
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditInventoryModal;
