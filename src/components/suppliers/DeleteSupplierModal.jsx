import React, { useEffect } from 'react';
import { AlertTriangle, X, PackageMinus, UserX } from 'lucide-react';

const DeleteSupplierModal = ({ isOpen, onClose, onConfirm, supplierName }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                {/* Header */}
                <div className="bg-red-50 p-6 flex flex-col items-center border-b border-red-100/50">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <AlertTriangle className="text-red-600" size={32} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 text-center">Delete Supplier: {supplierName}?</h2>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 text-center space-y-2">
                    <p className="text-gray-600 text-lg">
                        Do you also want to remove the <b>stock/inventory</b> associated with this supplier?
                    </p>
                    <p className="text-gray-500 text-sm">
                        <b>Yes, Decrease Stock:</b> Will delete the supplier AND reduce the medicine stock by the quantity this supplier provided.
                    </p>
                    <p className="text-gray-500 text-sm">
                        <b>No, Keep Stock:</b> Will delete only the supplier profile. Stock levels will remain unchanged.
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-0 flex flex-col gap-3">
                    <button
                        onClick={() => onConfirm(true)} // Delete Stock = true
                        className="w-full py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                    >
                        <PackageMinus size={20} />
                        Yes, Delete Supplier & Decrease Stock
                    </button>

                    <button
                        onClick={() => onConfirm(false)} // Delete Stock = false
                        className="w-full py-3 px-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <UserX size={20} />
                        No, Delete Supplier Only (Keep Stock)
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-2 text-gray-400 hover:text-gray-600 font-medium text-sm mt-1"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteSupplierModal;
