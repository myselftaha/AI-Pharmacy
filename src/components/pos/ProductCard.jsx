import React from 'react';
import { Plus } from 'lucide-react';

const ProductCard = ({ product, onAdd }) => {
    const isOutOfStock = product.stock <= 0;

    return (
        <div className={`bg-white p-4 rounded-xl border ${isOutOfStock ? 'border-red-300 bg-red-50/10' : 'border-gray-100'} shadow-sm hover:shadow-md transition-shadow flex flex-col h-full relative overflow-hidden`}>
            {isOutOfStock && (
                <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">
                    OUT OF STOCK
                </div>
            )}

            <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>

                <div className={`flex flex-col gap-1 text-xs mb-3 ${isOutOfStock ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                    <div className="flex justify-between">
                        <span>Pack: {product.packSize || 1} Items</span>
                        <span>Stock: {product.stock} Units</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col mt-auto pt-3 border-t border-gray-50">
                <span className={`font-bold ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>Rs. {product.price.toFixed(2)} [Pack]</span>
                <span className="text-[10px] text-gray-400 font-medium">
                    Rs. {(product.price / (product.packSize || 1)).toFixed(2)} [Unit]
                </span>
            </div>
            <div className="flex items-center justify-end mt-2">
                <button
                    onClick={() => !isOutOfStock && onAdd(product)}
                    disabled={isOutOfStock}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors ${isOutOfStock
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600'
                        }`}
                >
                    <Plus size={18} />
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
