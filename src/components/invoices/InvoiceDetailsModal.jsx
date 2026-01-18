import React, { useState } from 'react';
import { X, Printer, Trash2 } from 'lucide-react';

const InvoiceDetailsModal = ({ isOpen, onClose, invoice, onVoid, onPaySelected }) => {
    const [selectedItems, setSelectedItems] = useState([]);

    if (!isOpen || !invoice) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleItemToggle = (itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSelectAll = () => {
        const unpaidItems = invoice.items.filter(item => item.paymentStatus !== 'Paid');
        if (selectedItems.length === unpaidItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(unpaidItems.map(item => item.id));
        }
    };

    const handlePaySelected = () => {
        const itemsToPay = invoice.items.filter(item => selectedItems.includes(item.id));
        if (onPaySelected) {
            onPaySelected(itemsToPay);
        }
        setSelectedItems([]);
    };

    // Group items by date
    const groupedItems = invoice.items.reduce((groups, item) => {
        const dateKey = new Date(item.addedDate || item.date).toLocaleDateString();
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(item);
        return groups;
    }, {});

    const unpaidItems = invoice.items.filter(item => item.paymentStatus !== 'Paid');
    const selectedTotal = invoice.items
        .filter(item => selectedItems.includes(item.id))
        .reduce((sum, item) => sum + (item.dueAmount || item.totalCost || 0), 0);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:bg-transparent print:block print:p-0">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden print:shadow-none print:max-w-none print:rounded-none max-h-[90vh] flex flex-col">
                <div className="bg-gray-50 p-4 flex justify-between items-center border-b border-gray-100 print:hidden">
                    <h2 className="font-bold text-lg text-gray-800">Invoice Details</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <div id="printable-invoice" className="p-8 print:p-8">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">PURCHASE INVOICE</h1>
                                <p className="text-gray-500">{invoice.ref}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 mb-1">Date</p>
                                <p className="font-bold text-gray-900">{new Date(invoice.date).toLocaleDateString()}</p>

                                <div className="mt-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${invoice.status === 'Settled' ? 'bg-gray-100 text-gray-600' :
                                        invoice.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                        {invoice.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b-2 border-gray-100">
                                    <th className="text-left py-3 text-sm font-bold text-gray-500 uppercase print:hidden">
                                        {unpaidItems.length > 0 && (
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.length === unpaidItems.length && unpaidItems.length > 0}
                                                onChange={handleSelectAll}
                                                className="rounded border-gray-300"
                                            />
                                        )}
                                    </th>
                                    <th className="text-left py-3 text-sm font-bold text-gray-500 uppercase">Date Added</th>
                                    <th className="text-left py-3 text-sm font-bold text-gray-500 uppercase">Item</th>
                                    <th className="text-left py-3 text-sm font-bold text-gray-500 uppercase">Batch</th>
                                    <th className="text-right py-3 text-sm font-bold text-gray-500 uppercase">Qty</th>
                                    <th className="text-right py-3 text-sm font-bold text-gray-500 uppercase">Cost</th>
                                    <th className="text-right py-3 text-sm font-bold text-gray-500 uppercase">Total</th>
                                    <th className="text-right py-3 text-sm font-bold text-gray-500 uppercase">Paid</th>
                                    <th className="text-right py-3 text-sm font-bold text-gray-500 uppercase">Due</th>
                                    <th className="text-center py-3 text-sm font-bold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {Object.entries(groupedItems).map(([date, items]) => (
                                    <React.Fragment key={date}>
                                        {items.map((item, index) => (
                                            <tr key={item.id || index} className={selectedItems.includes(item.id) ? 'bg-blue-50' : ''}>
                                                <td className="py-4 print:hidden">
                                                    {item.paymentStatus === 'Paid' ? (
                                                        <span className="text-green-600 text-xs font-bold">✓</span>
                                                    ) : (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItems.includes(item.id)}
                                                            onChange={() => handleItemToggle(item.id)}
                                                            className="rounded border-gray-300"
                                                        />
                                                    )}
                                                </td>
                                                <td className="py-4 text-gray-600 text-sm">
                                                    {new Date(item.addedDate || item.date).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 text-gray-900 font-medium">{item.name || 'Unknown Item'}</td>
                                                <td className="py-4 text-gray-500">{item.batchNumber || '-'}</td>
                                                <td className="py-4 text-right text-gray-900">{item.quantity || 0}</td>
                                                <td className="py-4 text-right text-gray-900">Rs. {(item.unitCost || 0).toFixed(2)}</td>
                                                <td className="py-4 text-right text-gray-900 font-bold">Rs. {(item.totalCost || 0).toLocaleString()}</td>
                                                <td className="py-4 text-right text-green-600">Rs. {(item.paidAmount || 0).toLocaleString()}</td>
                                                <td className="py-4 text-right text-red-600 font-medium">Rs. {(item.dueAmount || 0).toLocaleString()}</td>
                                                <td className="py-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                                                            item.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {item.paymentStatus || 'Unpaid'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="flex justify-end border-t border-gray-100 pt-8">
                            <div className="w-80 space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>Total Amount</span>
                                    <span className="font-bold text-gray-900">Rs. {invoice.amount?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                    <span>Paid</span>
                                    <span className="font-bold">Rs. {invoice.paid?.toLocaleString()}</span>
                                </div>
                                {selectedItems.length > 0 && (
                                    <div className="flex justify-between text-blue-600 print:hidden">
                                        <span>Selected ({selectedItems.length} items)</span>
                                        <span className="font-bold">Rs. {selectedTotal.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-100 pt-3 flex justify-between text-red-600 text-lg font-bold">
                                    <span>Due Amount</span>
                                    <span>Rs. {invoice.due?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between print:hidden">
                    <button
                        onClick={() => onVoid(invoice)}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium border border-transparent hover:border-red-100"
                    >
                        <Trash2 size={18} />
                        <span>Void Invoice</span>
                    </button>

                    <div className="flex gap-3">
                        {selectedItems.length > 0 && (
                            <button
                                onClick={handlePaySelected}
                                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold shadow-lg shadow-green-500/20"
                            >
                                Pay Selected (Rs. {selectedTotal.toLocaleString()})
                            </button>
                        )}
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            <Printer size={18} />
                            <span>Print</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-bold"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailsModal;
