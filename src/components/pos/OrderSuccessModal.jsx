import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';

const OrderSuccessModal = ({ isOpen, onClose }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                <div className="bg-green-600 h-32 flex items-center justify-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-green-100 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        <Check size={40} className="text-green-600 stroke-[3]" />
                    </div>
                </div>

                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Successful!</h2>
                    <p className="text-gray-500 mb-8">
                        The bill has been printed and the transaction has been recorded successfully.
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                    >
                        Continue Selling
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessModal;
