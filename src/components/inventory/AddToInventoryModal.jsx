import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Package, Tag, MapPin, Info, DollarSign, Percent, Save, ChevronDown } from 'lucide-react';

const AddToInventoryModal = ({ isOpen, onClose, onConfirm, supplies }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        genericName: '',
        category: '',
        boxNumber: '',
        description: '',
        stock: '', // Displayed as Packs
        packSize: 1,
        minStock: 10,
        expiryDate: '',
        mrp: '',
        price: '', // Final Sale Price
        costPrice: '',
        discountPercentage: 0,
        margin: '0.00',
        cgstPercentage: 0,
        sgstPercentage: 0,
        igstPercentage: 0
    });

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setSelectedProduct(null);
            setFormData({
                name: '',
                genericName: '',
                category: '',
                boxNumber: '',
                description: '',
                stock: '',
                packSize: 1,
                minStock: 10,
                expiryDate: '',
                mrp: '',
                price: '',
                costPrice: '',
                discountPercentage: 0,
                margin: '0.00',
                cgstPercentage: 0,
                sgstPercentage: 0,
                igstPercentage: 0
            });
        }
    }, [isOpen]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setSelectedProduct(null);
    };

    const calculateMargin = (price, cost) => {
        const p = parseFloat(price) || 0;
        const c = parseFloat(cost) || 0;
        if (p === 0) return '0.00';
        return (((p - c) / p) * 100).toFixed(2);
    };

    const selectProduct = (product) => {
        setSelectedProduct(product);
        setSearchTerm(product.name);

        const price = product.price || product.sellingPrice || '';
        const cost = product.purchaseCost || product.costPrice || '';
        const mrp = product.mrp || price || '';

        setFormData({
            ...formData,
            name: product.name || '',
            genericName: product.genericName || product.formulaCode || '',
            category: product.category || '',
            boxNumber: product.boxNumber || '',
            description: product.description || '',
            stock: product.currentStock || (product.stock / (product.packSize || 1)) || '',
            packSize: product.packSize || 1,
            minStock: product.minStock || 10,
            expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
            mrp: mrp,
            price: price,
            costPrice: cost,
            discountPercentage: product.discountPercentage || 0,
            margin: calculateMargin(price, cost),
            cgstPercentage: product.cgstPercentage || 0,
            sgstPercentage: product.sgstPercentage || 0,
            igstPercentage: product.igstPercentage || 0
        });
    };

    const handlePriceChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            if (field === 'mrp' || field === 'discountPercentage') {
                const mrp = parseFloat(field === 'mrp' ? value : prev.mrp) || 0;
                const disc = parseFloat(field === 'discountPercentage' ? value : prev.discountPercentage) || 0;
                newData.price = (mrp - (mrp * (disc / 100))).toFixed(2);
            }

            newData.margin = calculateMargin(newData.price, newData.costPrice);
            return newData;
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const filteredSupplies = searchTerm && !selectedProduct
        ? supplies.filter(item =>
            !item.inInventory &&
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedProduct) {
            onConfirm(selectedProduct._id || selectedProduct.id, {
                ...formData,
                stock: parseFloat(formData.stock),
                packSize: parseInt(formData.packSize),
                minStock: parseInt(formData.minStock),
                price: parseFloat(formData.price),
                costPrice: parseFloat(formData.costPrice),
                mrp: parseFloat(formData.mrp),
                discountPercentage: parseFloat(formData.discountPercentage),
                cgstPercentage: parseFloat(formData.cgstPercentage),
                sgstPercentage: parseFloat(formData.sgstPercentage),
                igstPercentage: parseFloat(formData.igstPercentage)
            });
        }
    };

    const InputField = ({ label, value, name, type = "text", icon: Icon, placeholder, readOnly = false, onChange }) => (
        <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
            <div className={`relative group transition-all ${readOnly ? 'opacity-70' : ''}`}>
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange || handleChange}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    className={`w-full bg-gray-50/50 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 outline-none transition-all placeholder:text-gray-300 ${readOnly ? 'cursor-not-allowed bg-gray-100/50 border-transparent' : 'hover:border-green-100 focus:border-green-500 focus:bg-white focus:shadow-xl focus:shadow-green-500/5'}`}
                />
                {Icon && <Icon className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 transition-colors ${readOnly ? '' : 'group-focus-within:text-green-500'}`} size={18} />}
            </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-md">
            <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[92vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-600 p-6 flex justify-between items-center text-white shrink-0 border-b border-green-500/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                            <Plus size={28} className="text-white" />
                        </div>
                        <div>
                            <div className="px-3 py-0.5 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-sm w-fit mb-0.5">Inventory Sync</div>
                            <h2 className="text-2xl font-black tracking-tight">Add Product to Inventory</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2.5 rounded-2xl transition-all active:scale-90 border border-white/10">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/30">

                    {/* Search Bar - Premium Style */}
                    <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm mb-6 relative">
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <Search size={14} className="text-green-600" />
                            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Product Search</h3>
                        </div>
                        <div className="relative group">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearch}
                                placeholder="Search by name from medicine records..."
                                className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-700 outline-none transition-all placeholder:text-gray-300 hover:border-green-100 focus:border-green-500 focus:bg-white focus:shadow-xl focus:shadow-green-500/10"
                            />
                            {searchTerm && !selectedProduct && filteredSupplies.length > 0 && (
                                <div className="absolute z-50 w-full bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-2xl mt-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    {filteredSupplies.map(item => (
                                        <button
                                            key={item._id || item.id}
                                            type="button"
                                            onClick={() => selectProduct(item)}
                                            className="w-full px-5 py-3 hover:bg-green-50 flex justify-between items-center group transition-colors border-b border-gray-50 last:border-0"
                                        >
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className="font-bold text-gray-800 text-xs group-hover:text-green-700 transition-colors uppercase tracking-tight">{item.name}</span>
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.category}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-[10px] font-bold text-gray-500">In Stock: {item.currentStock || (item.stock / (item.packSize || 1))} Packs</div>
                                                    <div className="text-[9px] text-gray-400 italic">Exp: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</div>
                                                </div>
                                                <Plus size={16} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6">

                        {/* LEFT COLUMN: Metadata & Stock */}
                        <div className="col-span-12 lg:col-span-7 space-y-6">

                            {/* Card: Basic Information */}
                            <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-2 mb-1 pb-1 border-b border-gray-50 text-green-600">
                                    <Info size={16} />
                                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">Identity & Location</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Product Name" value={formData.name} name="name" readOnly icon={Package} />
                                    <InputField label="Formula Name" value={formData.genericName} name="genericName" icon={Tag} placeholder="e.g. Paracetamol" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Category" value={formData.category} name="category" readOnly />
                                    <InputField label="Shelf / Box" value={formData.boxNumber} name="boxNumber" icon={MapPin} placeholder="e.g. Rack A-12" />
                                </div>
                                <InputField label="Description" value={formData.description} name="description" placeholder="Notes about this product..." />
                            </div>

                            {/* Card: Inventory Control */}
                            <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-2 mb-1 pb-1 border-b border-gray-50 text-blue-600">
                                    <Save size={16} />
                                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">Inventory Control</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <InputField label="Current Packs" value={formData.stock} name="stock" type="number" />
                                    <InputField label="Items / Pack" value={formData.packSize} name="packSize" type="number" />
                                    <InputField label="Min Level" value={formData.minStock} name="minStock" type="number" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Expiry Date" value={formData.expiryDate} name="expiryDate" type="date" />
                                    <div className="flex items-center gap-2 px-2 text-[9px] text-gray-400 font-bold italic h-full pt-3">
                                        <div className="w-0.5 h-6 bg-blue-100 rounded-full" />
                                        Stock records are linked to supply history.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Pricing & Tax */}
                        <div className="col-span-12 lg:col-span-5 space-y-6">

                            {/* Card: Pricing Strategy */}
                            <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-2 mb-1 pb-1 border-b border-gray-50 text-orange-500">
                                    <DollarSign size={16} />
                                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">Pricing Strategy</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label="Cost (Pack)"
                                        value={formData.costPrice}
                                        name="costPrice"
                                        type="number"
                                        onChange={(e) => handlePriceChange('costPrice', e.target.value)}
                                    />
                                    <InputField
                                        label="MRP"
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
                                        label="Sale Price"
                                        value={formData.price}
                                        name="price"
                                        type="number"
                                        onChange={(e) => handlePriceChange('price', e.target.value)}
                                    />
                                </div>
                                <div className="bg-green-50 p-4 rounded-2xl flex flex-col gap-1.5 border border-green-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-green-700 uppercase tracking-tighter">Profit Margin Preview</span>
                                        <span className={`text-lg font-black ${parseFloat(formData.margin) < 10 ? 'text-red-500' : 'text-green-600'}`}>
                                            {formData.margin}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-green-100/50 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${parseFloat(formData.margin) < 10 ? 'bg-red-500' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min(100, Math.max(0, parseFloat(formData.margin) * 2))}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Taxation (GST) */}
                            <div className="bg-green-600/5 p-5 rounded-[24px] border border-green-600/10 space-y-4">
                                <div className="flex items-center gap-2 mb-1 pb-1 border-b border-green-600/10 text-green-700">
                                    <Tag size={16} />
                                    <h3 className="text-xs font-black uppercase tracking-wide">Taxation (GST)</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <InputField label="CGST %" value={formData.cgstPercentage} name="cgstPercentage" type="number" />
                                    <InputField label="SGST %" value={formData.sgstPercentage} name="sgstPercentage" type="number" />
                                    <InputField label="IGST %" value={formData.igstPercentage} name="igstPercentage" type="number" />
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-8 bg-white p-6 rounded-[28px] border border-gray-100 shadow-xl">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Sync Status</span>
                            <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${selectedProduct ? 'bg-green-500' : 'bg-orange-500'}`} />
                                <span className={`text-xs font-bold ${selectedProduct ? 'text-green-600' : 'text-orange-600'}`}>
                                    {selectedProduct ? 'Verified' : 'Awaiting Selection'}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all active:scale-95 text-xs"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                disabled={!selectedProduct}
                                className="px-10 py-3 bg-gradient-to-r from-green-600 to-green-600 text-white rounded-2xl font-black text-xs hover:translate-y-[-2px] hover:shadow-lg hover:shadow-green-600/40 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
                            >
                                <Save size={18} />
                                Sync to Inventory
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddToInventoryModal;
