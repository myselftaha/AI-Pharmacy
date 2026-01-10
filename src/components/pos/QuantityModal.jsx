import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';

const QuantityModal = ({ isOpen, onClose, product, onConfirm }) => {
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (isOpen) {
            setQuantity(1); // Reset to 1 when modal opens
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !product) return null;

    const handleConfirm = () => {
        if (quantity > 0) {
            onConfirm(product, quantity);
            onClose();
        }
    };

    const increment = () => {
        if (quantity < product.stock) {
            setQuantity(prev => prev + 1);
        }
    };

    const decrement = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-green-600 p-4 flex justify-between items-center text-white">
                    <h2 className="font-bold text-lg">Select Quantity</h2>
                    <button onClick={onClose} className="hover:bg-green-700 p-1 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Product Info */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.description}</p>
                        <div className="mt-2 flex flex-col gap-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Pack Price: <span className="font-bold text-green-600">Rs. {product.price.toFixed(2)}</span></span>
                                <span className="text-gray-600">Unit Price: <span className="font-bold text-blue-600">Rs. {(product.price / (product.packSize || 1)).toFixed(2)}</span></span>
                            </div>
                            <span className="text-sm text-gray-600 font-medium">Available: {product.stock} Units</span>
                        </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity <span className="text-gray-500">(Single Units)</span>
                        </label>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={decrement}
                                disabled={quantity <= 1}
                                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                            >
                                <Minus size={20} className="text-gray-700" />
                            </button>

                            <input
                                type="number"
                                min="1"
                                max={product.stock}
                                value={quantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val >= 1 && val <= product.stock) {
                                        setQuantity(val);
                                    }
                                }}
                                className="w-24 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />

                            <button
                                onClick={increment}
                                disabled={quantity >= product.stock}
                                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                            >
                                <Plus size={20} className="text-gray-700" />
                            </button>
                        </div>
                        {product.packSize > 0 && (
                            <p className="text-xs text-gray-500 mt-2">Items per Pack: {product.packSize}</p>
                        )}
                    </div>

                    {/* Total Price */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Total Price:</span>
                            <span className="text-2xl font-bold text-green-600">
                                Rs. {((product.price / (product.packSize || 1)) * quantity).toFixed(2)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {quantity} × Rs. {(product.price / (product.packSize || 1)).toFixed(2)} per Unit
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuantityModal;
