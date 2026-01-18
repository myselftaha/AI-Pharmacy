import React, { useState, useEffect, useRef } from 'react';
import { X, Search, User, Mail, Phone } from 'lucide-react';
import API_URL from '../../config/api';

const AttachCustomerModal = ({ isOpen, onClose, onSelectCustomer }) => {
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Reset selection when search changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/customers`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setCustomers(data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery)
    );

    const handleSelectCustomer = (customer) => {
        onSelectCustomer(customer);
        onClose();
    };

    // Keyboard Navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < filteredCustomers.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCustomers.length > 0) {
                    handleSelectCustomer(filteredCustomers[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCustomers, selectedIndex, onClose]);

    // Scroll active item into view
    useEffect(() => {
        if (isOpen && listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex];
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Select Customer</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">ESC to Close</span>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search customers by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#00c950]/20 focus:border-[#00c950] shadow-sm"
                            autoFocus
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs text-gray-500 font-medium">↑</kbd>
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs text-gray-500 font-medium">↓</kbd>
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs text-gray-500 font-medium">Enter</kbd>
                        </div>
                    </div>
                </div>

                {/* Customer List */}
                <div className="flex-1 overflow-y-auto p-4" ref={listRef}>
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading customers...</div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {searchQuery ? 'No customers found matching your search' : 'No customers available'}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredCustomers.map((customer, index) => {
                                const isSelected = index === selectedIndex;
                                return (
                                    <div
                                        key={customer._id || customer.id}
                                        onClick={() => handleSelectCustomer(customer)}
                                        className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200
                                            ${isSelected
                                                ? 'border-[#00c950] bg-[#00c950]/5 shadow-md scale-[1.01]'
                                                : 'border-gray-100 hover:border-[#00c950]/30 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 transition-colors
                                            ${isSelected ? 'bg-[#00c950] text-white' : 'bg-gray-100 text-gray-500'}
                                        `}>
                                            {customer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{customer.name}</h4>
                                            <div className="flex flex-col sm:flex-row sm:gap-4 mt-0.5">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Mail size={12} />
                                                    <span>{customer.email}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Phone size={12} />
                                                    <span>{customer.phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                            ${isSelected
                                                ? 'bg-[#00c950] text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-600'
                                            }
                                        `}>
                                            Select
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center text-xs text-gray-400">
                    <div>
                        Use <span className="font-semibold text-gray-600">Arrow Keys</span> to navigate
                    </div>
                    <div>
                        Showing {filteredCustomers.length} of {customers.length} customers
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttachCustomerModal;
