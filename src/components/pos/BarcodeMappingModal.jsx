import React, { useState, useEffect } from 'react';
import { X, Search, Barcode, Save, AlertCircle } from 'lucide-react';

const BarcodeMappingModal = ({ isOpen, onClose, scannedCode, medicines = [], onSaveMapping }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [unit, setUnit] = useState('Piece'); // Default
    const [packSize, setPackSize] = useState('1');

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setSelectedMedicine(null);
            setUnit('');
            setPackSize('1');
        }
    }, [isOpen, scannedCode]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Auto-set unit when medicine is selected
    useEffect(() => {
        if (selectedMedicine) {
            setUnit(selectedMedicine.unit || 'Piece');
        }
    }, [selectedMedicine]);

    const filteredMedicines = medicines.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(med.id).includes(searchTerm)
    ).slice(0, 5); // Limit results

    const handleSave = () => {
        if (!selectedMedicine) return;
        onSaveMapping({
            medicineId: selectedMedicine.id || selectedMedicine._id,
            barcode: scannedCode,
            unit,
            packSize: parseFloat(packSize)
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-400 to-red-500 p-6 text-white flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Barcode className="h-6 w-6" />
                            Unknown Barcode
                        </h2>
                        <p className="text-red-100 text-sm mt-1">
                            This barcode is not in the system. Map it to a product?
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Scanned Code Display */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                        <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                            <Barcode className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 uppercase font-semibold">Scanned Code</span>
                            <div className="font-mono text-lg font-bold text-gray-800 tracking-wider">
                                {scannedCode}
                            </div>
                        </div>
                    </div>

                    {/* Product Search */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Link to Product</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search product by name or ID..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setSelectedMedicine(null); // Clear selection on type
                                }}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:outline-none transition-all ${selectedMedicine
                                    ? 'border-green-500 ring-green-200 bg-green-50/50'
                                    : 'border-gray-200 focus:border-red-500 focus:ring-red-100'
                                    }`}
                            />
                        </div>

                        {/* Search Results Dropdown */}
                        {searchTerm && !selectedMedicine && (
                            <div className="border border-gray-100 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-50">
                                {filteredMedicines.map(med => (
                                    <button
                                        key={med.id || med._id}
                                        onClick={() => {
                                            setSelectedMedicine(med);
                                            setSearchTerm(med.name);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex justify-between items-center group"
                                    >
                                        <div>
                                            <div className="font-medium text-gray-800 group-hover:text-red-600 transition-colors">{med.name}</div>
                                            <div className="text-xs text-gray-500">Stock: {med.stock} • {med.unit}</div>
                                        </div>
                                        <div className="text-sm font-bold text-gray-400">#{med.id}</div>
                                    </button>
                                ))}
                                {filteredMedicines.length === 0 && (
                                    <div className="p-4 text-center text-sm text-gray-400">
                                        No matching products found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Unit & Pack Size Configuration */}
                    {selectedMedicine && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Unit Type</label>
                                <input
                                    type="text"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Pack Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={packSize}
                                    onChange={(e) => setPackSize(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none"
                                />
                                <p className="text-[10px] text-gray-400">
                                    Items to deduct from stock per scan
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 text-gray-600 font-semibold hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={!selectedMedicine}
                            onClick={handleSave}
                            className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${selectedMedicine
                                ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-md hover:from-orange-600 hover:to-red-700'
                                : 'bg-gray-200 cursor-not-allowed text-gray-400'
                                }`}
                        >
                            <Save size={18} />
                            Save & Add
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodeMappingModal;
