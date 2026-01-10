import React, { useState, useEffect } from 'react';
import { X, Save, Package, Info, DollarSign, Percent } from 'lucide-react';

const AddMedicineModal = ({ isOpen, onClose, onSave, suppliers, initialSupplier }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'Antibiotics',
        description: '',
        price: '', // Selling Price
        stock: '', // No. of Strips/Qty
        unit: 'Strip',
        netContent: '10', // Units / Strip
        formulaCode: '',
        batchNumber: '',
        supplierName: '',
        purchaseCost: '', // Cost Price (per strip)
        mrp: '',
        expiryDate: '',
        freeQuantity: '0',
        sellPrice: '',
        discountPercentage: '0',
        boxNumber: '',
        itemAmount: '0.00',
        discountAmount: '0.00',
        taxableAmount: '0.00',
        cgstPercentage: '0',
        cgstAmount: '0.00',
        sgstPercentage: '0',
        sgstAmount: '0.00',
        igstPercentage: '0',
        igstAmount: '0.00',
        totalGst: '0.00',
        payableAmount: '0.00',
        invoiceDate: '',
        invoiceDueDate: '',
        status: 'Posted',
        purchaseInvoiceNumber: ''
    });

    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({ ...prev, invoiceDate: getCurrentDate() }));
            if (initialSupplier) {
                const name = typeof initialSupplier === 'object' ? initialSupplier.name : initialSupplier;
                setFormData(prev => ({ ...prev, supplierName: name || '' }));
            }
        }
    }, [isOpen, initialSupplier]);

    useEffect(() => {
        if (isOpen && suppliers.length > 0 && !initialSupplier) {
            setFormData(prev => ({
                ...prev,
                supplierName: suppliers[0].name
            }));
        }
    }, [isOpen, suppliers, initialSupplier]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const calculateTotals = (data) => {
        const qty = parseFloat(data.stock) || 0;
        const cost = parseFloat(data.purchaseCost) || 0;
        const discPerc = parseFloat(data.discountPercentage) || 0;
        const cgstPerc = parseFloat(data.cgstPercentage) || 0;
        const sgstPerc = parseFloat(data.sgstPercentage) || 0;
        const igstPerc = parseFloat(data.igstPercentage) || 0;

        const itemAmount = qty * cost;
        const discountAmount = itemAmount * (discPerc / 100);
        const taxableAmount = itemAmount - discountAmount;

        const cgstAmount = taxableAmount * (cgstPerc / 100);
        const sgstAmount = taxableAmount * (sgstPerc / 100);
        const igstAmount = taxableAmount * (igstPerc / 100);
        const totalGst = cgstAmount + sgstAmount + igstAmount;
        const payableAmount = taxableAmount + totalGst;

        return {
            ...data,
            itemAmount: itemAmount.toFixed(2),
            discountAmount: discountAmount.toFixed(2),
            taxableAmount: taxableAmount.toFixed(2),
            cgstAmount: cgstAmount.toFixed(2),
            sgstAmount: sgstAmount.toFixed(2),
            igstAmount: igstAmount.toFixed(2),
            totalGst: totalGst.toFixed(2),
            payableAmount: payableAmount.toFixed(2)
        };
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            const calculationFields = ['stock', 'purchaseCost', 'discountPercentage', 'cgstPercentage', 'sgstPercentage', 'igstPercentage'];
            if (calculationFields.includes(name)) {
                return calculateTotals(newData);
            }
            return newData;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            quantity: parseInt(formData.stock),
            price: parseFloat(formData.sellPrice || formData.price),
            sellingPrice: parseFloat(formData.sellPrice || formData.price),
            purchaseCost: parseFloat(formData.purchaseCost)
        });
        onClose();
    };

    const margin = formData.sellPrice && formData.purchaseCost ? (((parseFloat(formData.sellPrice) - parseFloat(formData.purchaseCost)) / parseFloat(formData.sellPrice)) * 100).toFixed(2) : '0.00';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex justify-between items-center px-8 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Add New Supply Record</h2>
                        <p className="text-sm text-gray-500 mt-1">Add a new medicine batch and purchase invoice details.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1">

                    {/* Section 1: Supplier & Invoice */}
                    <div className="mb-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Info size={18} className="text-[#00c950]" />
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Supplier & Invoice Info</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <FormInput label="Supplier Name" value={formData.supplierName} name="supplierName" onChange={handleChange} required placeholder="Select Supplier" list="suppliers-list" colSpan="col-span-2" />
                            <datalist id="suppliers-list">
                                {suppliers.map((s, idx) => (
                                    <option key={idx} value={s.name || s} />
                                ))}
                            </datalist>
                            <FormInput label="Invoice Number" value={formData.purchaseInvoiceNumber} name="purchaseInvoiceNumber" onChange={handleChange} placeholder="INV-001" />
                            <FormInput label="Invoice Date" value={formData.invoiceDate} name="invoiceDate" onChange={handleChange} type="date" required />
                        </div>
                    </div>

                    {/* Section 2: Product Details */}
                    <div className="mb-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Package size={18} className="text-[#00c950]" />
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Product & Batch Details</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <FormInput label="Medicine Name" value={formData.name} name="name" onChange={handleChange} required placeholder="e.g. Augmentin 625mg" colSpan="col-span-2" />
                            <FormInput label="Formula" value={formData.formulaCode} name="formulaCode" onChange={handleChange} placeholder="e.g. Co-Amoxiclav" />
                            <FormInput label="Batch #" value={formData.batchNumber} name="batchNumber" onChange={handleChange} required placeholder="BN-123" />
                            <FormInput label="Expiry Date" value={formData.expiryDate} name="expiryDate" onChange={handleChange} type="date" required />
                            <FormInput label="Qty (Packs)" value={formData.stock} name="stock" onChange={handleChange} type="number" required />
                            <FormInput label="Bonus" value={formData.freeQuantity} name="freeQuantity" onChange={handleChange} type="number" />
                            <FormInput label="MRP" value={formData.mrp} name="mrp" onChange={handleChange} type="number" required />
                        </div>
                    </div>

                    {/* Section 3: Pricing & Inventory */}
                    <div className="mb-5 p-5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign size={18} className="text-[#00c950]" />
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Pricing & Inventory</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <FormInput label="Cost Price" value={formData.purchaseCost} name="purchaseCost" onChange={handleChange} type="number" required />
                            <FormInput label="Sell Price" value={formData.sellPrice || formData.price} name="sellPrice" onChange={handleChange} type="number" required />
                            <FormInput label="Disc %" value={formData.discountPercentage} name="discountPercentage" onChange={handleChange} type="number" />
                            <FormInput label="Box #" value={formData.boxNumber} name="boxNumber" onChange={handleChange} placeholder="Cabinet A" />
                            <FormInput label="Units/Pack" value={formData.netContent} name="netContent" onChange={handleChange} type="number" required />
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Margin</label>
                                <div className={`w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold flex items-center justify-center transition-all ${parseFloat(margin) < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                                    {margin}%
                                </div>
                            </div>
                            <FormInput label="Subtotal" value={formData.itemAmount} name="itemAmount" onChange={handleChange} readOnly />
                            <FormInput label="Discount" value={formData.discountAmount} name="discountAmount" onChange={handleChange} readOnly />
                        </div>
                    </div>

                    {/* Section 4: Taxation */}
                    <div className="mb-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Percent size={18} className="text-[#00c950]" />
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Taxation (GST)</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <FormInput label="Taxable Amt" value={formData.taxableAmount} name="taxableAmount" onChange={handleChange} readOnly />
                            <FormInput label="CGST %" value={formData.cgstPercentage} name="cgstPercentage" onChange={handleChange} type="number" />
                            <FormInput label="SGST %" value={formData.sgstPercentage} name="sgstPercentage" onChange={handleChange} type="number" />
                            <FormInput label="IGST %" value={formData.igstPercentage} name="igstPercentage" onChange={handleChange} type="number" />
                            <FormInput label="CGST Amt" value={formData.cgstAmount} name="cgstAmount" onChange={handleChange} readOnly />
                            <FormInput label="SGST Amt" value={formData.sgstAmount} name="sgstAmount" onChange={handleChange} readOnly />
                            <FormInput label="IGST Amt" value={formData.igstAmount} name="igstAmount" onChange={handleChange} readOnly />
                            <FormInput label="Total Tax" value={formData.totalGst} name="totalGst" onChange={handleChange} readOnly />
                        </div>
                    </div>

                    {/* Final Total */}
                    <div className="mt-6 flex justify-end">
                        <div className="px-2 py-1 flex flex-col items-end border-r-4 border-[#00c950] pr-6">
                            <span className="text-[10px] font-bold text-[#00c950] uppercase tracking-widest">Total Payable Amount</span>
                            <span className="text-3xl font-bold text-gray-900 ">Rs. {formData.payableAmount}</span>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-4 mt-6 pt-5 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-[#00c950] hover:bg-[#00b347] text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#00c950]/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            Add Supply Record
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const FormInput = ({ label, value, name, onChange, type = "text", placeholder, readOnly = false, required = false, list, colSpan = "col-span-1" }) => (
    <div className={`space-y-1.5 ${colSpan}`}>
        <label className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            list={list}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            className={`w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 outline-none transition-all ${readOnly ? 'bg-gray-50 cursor-not-allowed text-gray-500' : 'focus:border-[#00c950] focus:ring-2 focus:ring-[#00c950]/20'}`}
        />
    </div>
);

export default AddMedicineModal;
