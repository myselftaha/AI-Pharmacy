import React, { useEffect } from 'react';
import { X, Printer, CheckCircle, Store } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { QRCodeCanvas } from 'qrcode.react';

const BillModal = ({ isOpen, onClose, items, total, onPrint, customer, discount = 0, transactionId, billNumber, invoiceNumber, paymentMethod, voucher }) => {
    const { settings, formatPrice } = useSettings();
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const date = new Date().toLocaleString();

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[150] p-4 print:static print:bg-white print:p-0 print:block">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none">
                {/* Header */}
                <div className="bg-green-600 p-4 flex justify-between items-center text-white print:hidden">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <CheckCircle size={20} />
                        Confirm Sale
                    </h2>
                    <button onClick={onClose} className="hover:bg-green-700 p-1 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Receipt Content */}
                <div className="p-6 print:p-0" id="printable-receipt">
                    <div className="text-center mb-6">
                        {settings?.storeLogo ? (
                            <div className="flex justify-center mb-2">
                                <img src={settings.storeLogo} alt="Logo" className="h-16 w-auto object-contain" />
                            </div>
                        ) : (
                            <div className="flex justify-center mb-2 text-green-600 print:grayscale">
                                <Store size={32} />
                            </div>
                        )}
                        <h1 className="text-2xl font-bold text-gray-800 mb-1">{settings?.storeName || 'MedKit POS'}</h1>
                        <p className="text-sm text-gray-500 whitespace-pre-wrap">{settings?.storeAddress || 'Pharmacy Management System'}</p>
                        {settings?.storePhone && <p className="text-xs text-gray-500">Tel: {settings.storePhone}</p>}
                        {settings?.storeEmail && <p className="text-xs text-gray-500">Email: {settings.storeEmail}</p>}

                        <div className="border-b border-gray-200 w-full my-3"></div>

                        <p className="text-xs text-gray-400">{date}</p>
                        {billNumber ? (
                            <div className="mt-2">
                                <p className="text-xl font-bold text-gray-800">Bill #: {billNumber}</p>
                                {invoiceNumber && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice: {invoiceNumber}</p>}
                            </div>
                        ) : (
                            transactionId && (
                                <div className="mt-2">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Draft Transaction</p>
                                    <p className="text-sm font-medium text-gray-500">{transactionId}</p>
                                </div>
                            )
                        )}
                    </div>

                    {/* Customer Info */}
                    {customer && (
                        <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                            <h3 className="text-xs font-semibold text-gray-500 mb-2">CUSTOMER DETAILS</h3>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-800">{customer.name}</p>
                                <p className="text-xs text-gray-600">{customer.email}</p>
                                <p className="text-xs text-gray-600">{customer.phone}</p>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-b border-dashed border-gray-300 py-4 mb-4 space-y-3">
                        {items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <div>
                                    <span className="font-medium text-gray-800">{item.name}</span>
                                    {item.mrp > 0 && (
                                        <div className="text-[10px] text-gray-400 line-through">MRP: Rs. {item.mrp.toFixed(2)}</div>
                                    )}
                                    <div className="text-xs text-gray-500">
                                        {item.quantity} x Rs. {item.price.toFixed(2)}
                                    </div>
                                </div>
                                <span className="font-medium text-gray-800">
                                    Rs. {(item.quantity * item.price).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2 text-sm mb-6">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatPrice(total - 0.10 + discount)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Platform Fee</span>
                            <span>{formatPrice(0.10)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount {voucher ? `(${voucher.code})` : ''}</span>
                                <span>-Rs. {discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span>{formatPrice(total)}</span>
                        </div>

                        <div className="pt-4 mt-4 border-t border-dashed border-gray-300">
                            <div className="flex justify-between text-gray-800 text-sm font-medium">
                                <span>Payment Method</span>
                                <span>{paymentMethod || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer for Print */}
                    <div className="hidden print:block text-center mt-8 space-y-2">
                        <div className="text-xs font-medium text-gray-800 border-t border-dashed border-gray-300 pt-2">
                            {settings?.receiptHeader}
                        </div>
                        {settings?.receiptFooter && (
                            <p className="text-xs text-gray-500 whitespace-pre-wrap">{settings.receiptFooter}</p>
                        )}
                        {settings?.receiptTerms && (
                            <div className="text-[10px] text-gray-400 mt-2 border-t border-gray-100 pt-1">
                                <span className="font-bold">Terms:</span> {settings.receiptTerms}
                            </div>
                        )}
                        <p className="text-[10px] text-gray-400 mt-2">Powered by MedKit POS</p>

                        {/* QR Code */}
                        {(settings?.showQRCode || true) && (
                            <div className="flex justify-center mt-4 pt-2 border-t border-dashed border-gray-200">
                                <QRCodeCanvas
                                    value={JSON.stringify({
                                        id: transactionId || billNumber,
                                        total: total,
                                        date: new Date().toISOString()
                                    })}
                                    size={64}
                                    level={"M"}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 print:hidden">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onPrint}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                    >
                        <Printer size={18} />
                        Print Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillModal;
