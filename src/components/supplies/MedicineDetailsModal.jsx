import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import SupplyTable from './SupplyTable';

const MedicineDetailsModal = ({ isOpen, onClose, medicineGroup, onEdit, onDelete, onSyncStock }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !medicineGroup) return null;

    // Calculate sum of batches
    const totalPurchased = medicineGroup.batches.reduce((sum, batch) => sum + (Number(batch.quantity) || 0), 0);
    const hasMismatch = totalPurchased !== medicineGroup.totalStock;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-6xl h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            {medicineGroup.name}
                            <span className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full font-bold">
                                Total Stock via Inventory: {medicineGroup.totalStock}
                            </span>
                            {hasMismatch && (
                                <button
                                    onClick={() => onSyncStock && onSyncStock(medicineGroup, totalPurchased)}
                                    className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-bold hover:bg-yellow-200 transition-colors flex items-center gap-1"
                                    title="Discrepancy detected between Inventory Stock and Sum of Batches. Click to sync."
                                >
                                    <span>Mismatch (Batch Sum: {totalPurchased}) - Sync Now</span>
                                </button>
                            )}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Batch-wise details and history</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden p-6 bg-gray-50">
                    <SupplyTable
                        supplies={medicineGroup.batches}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </div>
            </div>
        </div>
    );
};

export default MedicineDetailsModal;
