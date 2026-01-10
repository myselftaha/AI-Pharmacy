import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200]">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                {/* Header */}
                <div className="bg-green-50 p-6 flex flex-col items-center border-b border-green-100/50">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <AlertTriangle className="text-green-600" size={32} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 text-center">{title || 'Delete Supply Record?'}</h2>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 text-center">
                    <p className="text-gray-600 mb-2">
                        Are you sure you want to delete <span className="font-bold text-gray-800">{itemName || 'this item'}</span>?
                    </p>
                    <p className="text-gray-500 text-sm">
                        {message || 'This action cannot be undone. The record will be permanently removed from the purchase history.'}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 px-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                    >
                        Yes, Delete It
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
