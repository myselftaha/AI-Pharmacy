import React, { useState, useEffect } from 'react';
import { X, Trash2, ChevronDown, Banknote, CreditCard } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const CartItem = ({ item, onUpdateQuantity, onUpdateSaleType, onUpdateDiscount, onUpdateIsUnit, onUpdateCustomPrice, onRemove }) => {
    // Initialize with prop value converted to string, empty if 1
    const [localQuantity, setLocalQuantity] = useState(item.quantity > 1 ? item.quantity.toString() : '');
    const [localDiscount, setLocalDiscount] = useState(item.discount || '0');
    const [localPrice, setLocalPrice] = useState(item.customPrice || item.price);

    // Sync local state when prop updates
    useEffect(() => {
        setLocalQuantity(item.quantity > 1 ? item.quantity.toString() : '');
    }, [item.quantity]);

    useEffect(() => {
        setLocalDiscount(item.discount || '0');
    }, [item.discount]);

    useEffect(() => {
        setLocalPrice(item.customPrice || item.price);
    }, [item.customPrice, item.price]);

    const handleQuantityChange = (e) => {
        const val = e.target.value;
        if (val === '' || /^\d+$/.test(val)) {
            setLocalQuantity(val);
        }
    };

    const handleQuantityBlur = () => {
        const numVal = parseInt(localQuantity);
        if (!localQuantity || !numVal || numVal < 1) {
            setLocalQuantity('');
            onUpdateQuantity(item._id || item.id, 1);
        } else {
            onUpdateQuantity(item._id || item.id, numVal);
        }
    };

    const handleDiscountChange = (e) => {
        const val = e.target.value;
        if (val === '' || /^\d+\.?\d*$/.test(val)) {
            setLocalDiscount(val);
        }
    };

    const handleDiscountBlur = () => {
        const numVal = parseFloat(localDiscount) || 0;
        setLocalDiscount(numVal.toString());
        onUpdateDiscount(item._id || item.id, numVal);
    };

    const handlePriceChange = (e) => {
        const val = e.target.value;
        if (val === '' || /^\d+\.?\d*$/.test(val)) {
            setLocalPrice(val);
        }
    };

    const handlePriceBlur = () => {
        const numVal = parseFloat(localPrice) || item.price;
        setLocalPrice(numVal);
        onUpdateCustomPrice(item._id || item.id, numVal);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }

        // Arrow Navigation for Inputs
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const currentInput = e.target;
            const currentTd = currentInput.closest('td');
            const currentTr = currentInput.closest('tr');
            const cellIndex = Array.from(currentTr.children).indexOf(currentTd);

            const targetTr = e.key === 'ArrowUp'
                ? currentTr.previousElementSibling
                : currentTr.nextElementSibling;

            if (targetTr) {
                const targetTd = targetTr.children[cellIndex];
                const targetInput = targetTd?.querySelector('input');
                if (targetInput) {
                    targetInput.focus();
                    targetInput.select();
                }
            }
        }
    };

    const packSize = parseInt(item.packSize) || 1;
    const isPack = (item.saleType || 'Single') === 'Pack';
    const effectivePrice = isPack ? (item.customPrice || parseFloat(item.price)) : ((item.customPrice || parseFloat(item.price)) / packSize);
    const total = effectivePrice * (parseInt(localQuantity) || 0) - (parseFloat(localDiscount) || 0);

    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-2">
                <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                {item.mrp && (
                    <div className="text-[10px] text-gray-400 line-through">MRP: Rs. {item.mrp}</div>
                )}
            </td>
            <td className="py-3 px-1">
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Qty"
                    value={localQuantity}
                    onFocus={(e) => e.target.select()}
                    onChange={handleQuantityChange}
                    onBlur={handleQuantityBlur}
                    onKeyDown={handleKeyDown}
                    className="cart-quantity-input w-16 h-8 text-center border-2 border-blue-300 rounded-lg px-1 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </td>
            <td className="py-3 px-1">
                <div className="relative">
                    <select
                        value={item.saleType || 'Single'}
                        onChange={(e) => onUpdateSaleType(item._id || item.id, e.target.value)}
                        className="w-full h-9 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg pl-3 pr-8 shadow-sm appearance-none focus:outline-none focus:border-[#00c950] focus:ring-1 focus:ring-[#00c950] hover:border-[#00c950] transition-colors cursor-pointer"
                    >
                        <option value="Single">Single</option>
                        <option value="Pack">Pack</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
            </td>
            <td className="py-3 px-1">
                <input
                    type="text"
                    inputMode="decimal"
                    value={localPrice}
                    onFocus={(e) => e.target.select()}
                    onChange={handlePriceChange}
                    onBlur={handlePriceBlur}
                    onKeyDown={handleKeyDown}
                    className="w-20 h-8 text-center border border-gray-300 rounded-lg px-1 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </td>
            <td className="py-3 px-1">
                <div className="font-bold text-gray-800 text-sm">
                    Rs. {effectivePrice.toFixed(2)}
                    <span className="text-[10px] text-[#00c950] block font-bold">
                        Sale Price
                    </span>
                    <span className="text-[10px] text-gray-400 block font-normal">
                        {isPack ? 'per Pack' : 'per Unit'}
                    </span>
                </div>
            </td>
            <td className="py-3 px-1 text-right">
                <div className="font-bold text-green-600 text-sm">
                    Rs. {total.toFixed(2)}
                </div>
            </td>
            <td className="py-3 px-1 text-center">
                <button
                    onClick={() => onRemove(item._id || item.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                >
                    <X size={16} />
                </button>
            </td>
        </tr>
    );
};

const Cart = ({
    items,
    onUpdateQuantity,
    onUpdateSaleType,
    onUpdateDiscount,
    onUpdateIsUnit,
    onUpdateCustomPrice,
    onRemove,
    onPrintBill,
    onAttachCustomer,
    onClearAll,
    customer,
    discount = 0,
    paymentMethod,
    onPaymentMethodChange,
    voucher: selectedVoucher
}) => {
    // Calculate subtotal using custom prices and item-level discounts
    // Calculate subtotal using custom prices and item-level discounts
    const subtotal = items.reduce((sum, item) => {
        const packSize = parseInt(item.packSize) || 1;
        const isPack = (item.saleType || 'Single') === 'Pack';
        const basePrice = item.customPrice || item.price;
        const effectivePrice = isPack ? basePrice : (basePrice / packSize);

        const itemSubtotal = effectivePrice * item.quantity;
        const itemTotal = itemSubtotal - (item.discount || 0);
        return sum + itemTotal;
    }, 0);

    const platformFee = 0.10;
    const { formatPrice } = useSettings();
    const total = Math.max(0, subtotal + platformFee - discount);

    return (
        <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold text-lg text-gray-800">Current Sale</h2>
                <button
                    onClick={onClearAll}
                    disabled={items.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Trash2 size={14} />
                    Clear
                </button>
            </div>

            <div className="p-4 pb-2 text-sm text-gray-500">
                {items.length} items in cart
            </div>

            {/* Cart Items Table */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {items.length > 0 ? (
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white border-b-2 border-gray-200 z-10">
                            <tr className="text-xs text-gray-600">
                                <th className="text-left py-2 px-2 font-semibold">Item</th>
                                <th className="text-left py-2 px-1 font-semibold">Qty</th>
                                <th className="text-left py-2 px-1 font-semibold">Type</th>
                                <th className="text-left py-2 px-1 font-semibold">Price</th>
                                <th className="text-right py-2 px-2 font-semibold">Total</th>
                                <th className="text-center py-2 px-1 font-semibold"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <CartItem
                                    key={item._id || item.id}
                                    item={item}
                                    onUpdateQuantity={onUpdateQuantity}
                                    onUpdateSaleType={onUpdateSaleType}
                                    onUpdateDiscount={onUpdateDiscount}
                                    onUpdateIsUnit={onUpdateIsUnit}
                                    onUpdateCustomPrice={onUpdateCustomPrice}
                                    onRemove={onRemove}
                                />
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center text-gray-400 py-8">
                        Cart is empty
                    </div>
                )}
            </div>

            {/* Summary Section */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <h3 className="font-bold text-gray-800 mb-3">Summary</h3>
                <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Platform fee</span>
                        <span className="font-medium">{formatPrice(platformFee)}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>
                                Discount
                                {selectedVoucher && ` (${selectedVoucher.code})`}
                            </span>
                            <span className="font-medium">-{formatPrice(discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-gray-900 font-bold text-lg pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                </div>

                {/* Payment Method Selection */}
                <div className="mb-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onPaymentMethodChange('Cash')}
                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 transition-all font-bold text-sm ${paymentMethod === 'Cash'
                                ? 'border-[#00c950] bg-green-50 text-[#00c950]'
                                : 'border-white bg-white text-gray-400 hover:border-gray-200'
                                }`}
                        >
                            <Banknote size={18} />
                            Cash
                        </button>
                        <button
                            onClick={() => onPaymentMethodChange('Card')}
                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 transition-all font-bold text-sm ${paymentMethod === 'Card'
                                ? 'border-blue-500 bg-blue-50 text-blue-500'
                                : 'border-white bg-white text-gray-400 hover:border-gray-200'
                                }`}
                        >
                            <CreditCard size={18} />
                            Card
                        </button>
                    </div>
                </div>

                <button
                    onClick={onPrintBill}
                    disabled={items.length === 0}
                    className="w-full bg-[#00c950] text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Pay
                </button>
            </div>
        </div>
    );
};

export default Cart;
