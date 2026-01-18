import React, { useState, useEffect } from 'react';
import { Search, Plus, Mail, Phone, MapPin, TrendingUp, DollarSign, Clock, Users, Edit3 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import AddCustomerModal from '../components/customers/AddCustomerModal';
import ViewCustomerModal from '../components/customers/ViewCustomerModal';
import EditCustomerModal from '../components/customers/EditCustomerModal';
import API_URL from '../config/api';


const Customers = () => {
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [dateFilter, setDateFilter] = useState('Today');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    useEffect(() => {
        handleDateFilterChange('Today');
    }, []);

    const fetchCustomers = async (startDate = null, endDate = null) => {
        try {
            let url = `${API_URL}/api/customers?`;
            const params = new URLSearchParams();

            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const token = localStorage.getItem('token');
            const response = await fetch(url + params.toString(), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            const safeData = Array.isArray(data) ? data : [];
            setCustomers(safeData);
            setFilteredCustomers(safeData);
        } catch (error) {
            console.error('Error fetching customers:', error);
            showToast('Failed to fetch customers', 'error');
            setCustomers([]);
            setFilteredCustomers([]);
        }
    };

    // Helper to format date as YYYY-MM-DD in local time
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Calculate date ranges based on filter
    const getDateRange = (filter) => {
        const now = new Date();
        let startDate = null;
        let endDate = formatDate(now);

        switch (filter) {
            case 'Today':
                startDate = formatDate(now);
                endDate = formatDate(now);
                break;
            case 'Yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                startDate = formatDate(yesterday);
                endDate = formatDate(yesterday);
                break;
            case 'Week':
                const lastWeek = new Date(now);
                lastWeek.setDate(lastWeek.getDate() - 7);
                startDate = formatDate(lastWeek);
                break;
            case 'Month':
                const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                startDate = formatDate(thisMonth);
                break;
            case 'Custom':
                return { startDate: customStartDate, endDate: customEndDate };
            default:
                return { startDate: null, endDate: null };
        }
        return { startDate, endDate };
    };

    // Handle filter change
    const handleDateFilterChange = (filter) => {
        setDateFilter(filter);
        if (filter !== 'Custom') {
            const { startDate, endDate } = getDateRange(filter);
            fetchCustomers(startDate, endDate);
        }
    };

    // Handle custom date apply
    const handleCustomDateApply = () => {
        if (!customStartDate || !customEndDate) {
            console.warn('Please select both start and end dates');
            return;
        }
        fetchCustomers(customStartDate, customEndDate);
    };

    const handleAddCustomer = () => {
        setIsAddModalOpen(true);
    };

    const handleSaveCustomer = async (customerData) => {
        try {
            console.log('Saving customer:', customerData);
            const response = await fetch(`${API_URL}/api/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(customerData)
            });

            if (response.ok) {
                await fetchCustomers(); // Refresh list
                setIsAddModalOpen(false);
                showToast('Customer added successfully', 'success');
            } else {
                const errorText = await response.text();
                showToast('Failed to save customer: ' + errorText, 'error');
            }
        } catch (error) {
            console.error('Error adding customer:', error);
            showToast('Error adding customer: ' + error.message, 'error');
        }
    };

    const handleViewCustomer = (customer) => {
        setSelectedCustomer(customer);
        setIsViewModalOpen(true);
    };

    const handleEditCustomer = (customer) => {
        setSelectedCustomer(customer);
        setIsEditModalOpen(true);
    };

    const handleUpdateCustomer = async (customerId, customerData) => {
        try {
            const response = await fetch(`${API_URL}/api/customers/${customerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(customerData)
            });

            if (response.ok) {
                await fetchCustomers(); // Refresh list
                setIsEditModalOpen(false);
                setSelectedCustomer(null);
                showToast('Customer updated successfully', 'success');
            } else {
                const errorText = await response.text();
                showToast('Failed to update customer: ' + errorText, 'error');
            }
        } catch (error) {
            console.error('Error updating customer:', error);
            showToast('Error updating customer: ' + error.message, 'error');
        }
    };

    // Apply search filter
    useEffect(() => {
        const safeCustomers = Array.isArray(customers) ? customers : [];
        const filtered = safeCustomers.filter(customer =>
            customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer?.phone?.includes(searchQuery)
        );
        setFilteredCustomers(filtered);
    }, [searchQuery, customers]);

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Customer Management</h1>
                    <p className="text-sm text-gray-500">Track and manage your pharmacy's customer base</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all shadow-sm"
                        />
                    </div>

                    <button
                        onClick={handleAddCustomer}
                        className="w-full md:w-auto px-6 py-2 bg-green-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={18} />
                        Add Customer
                    </button>
                </div>
            </div>

            {/* Premium KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    {
                        label: 'Total Customers',
                        value: (Array.isArray(filteredCustomers) ? filteredCustomers : []).length,
                        icon: Users,
                        color: 'text-blue-600',
                        bg: 'bg-blue-50',
                        border: 'border-blue-100'
                    },
                    {
                        label: "Today's New Joiners",
                        value: (Array.isArray(filteredCustomers) ? filteredCustomers : []).filter(c => {
                            if (!c.joinDate) return false;
                            const joinDate = new Date(c.joinDate);
                            const today = new Date();
                            return joinDate.toDateString() === today.toDateString();
                        }).length,
                        icon: Plus,
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-50',
                        border: 'border-emerald-100'
                    },
                    {
                        label: 'Total Revenue',
                        value: `Rs. ${(Array.isArray(filteredCustomers) ? filteredCustomers : []).reduce((sum, c) => sum + (c.totalSpent || 0), 0).toLocaleString()}`,
                        icon: DollarSign,
                        color: 'text-indigo-600',
                        bg: 'bg-indigo-50',
                        border: 'border-indigo-100'
                    },
                    {
                        label: 'High Value Customers',
                        value: (Array.isArray(filteredCustomers) ? filteredCustomers : []).filter(c => (c.totalSpent || 0) > 1000).length,
                        icon: TrendingUp,
                        color: 'text-orange-600',
                        bg: 'bg-orange-50',
                        border: 'border-orange-100'
                    }
                ].map((card, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${card.border} ${card.bg} shadow-sm group hover:shadow-md transition-all`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.label}</span>
                            <div className={`p-2 rounded-lg bg-white/80 ${card.color} shadow-sm group-hover:scale-110 transition-transform`}>
                                <card.icon size={18} />
                            </div>
                        </div>
                        <div className={`text-2xl font-bold ${card.color}`}>
                            {card.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        {['Today', 'Yesterday', 'Week', 'Month', 'All Time', 'Custom'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => handleDateFilterChange(filter)}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${dateFilter === filter
                                    ? 'bg-green-500 text-white shadow-md shadow-green-200'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}

                        {dateFilter === 'Custom' && (
                            <div className="flex items-center gap-2 ml-2 p-1 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-left-2">
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="bg-transparent px-2 py-1 text-sm outline-none font-medium"
                                />
                                <span className="text-gray-300">to</span>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="bg-transparent px-2 py-1 text-sm outline-none font-medium"
                                />
                                <button
                                    onClick={handleCustomDateApply}
                                    className="px-4 py-1.5 bg-white text-green-600 border border-green-100 rounded-lg text-xs font-bold hover:bg-green-50 transition-colors shadow-sm"
                                >
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="text-xs font-medium text-gray-400">
                        Join Date Filter: <span className="text-gray-900 font-bold">{dateFilter}</span>
                    </div>
                </div>
            </div>

            {/* Customers Table Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#fcfdfe] border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer Profile</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Details</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Address</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">History</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Financials</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {filteredCustomers.map((customer, index) => (
                            <tr key={customer._id || customer.id} className="hover:bg-gray-50/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xs border border-gray-100 transition-transform group-hover:scale-105">
                                            {customer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-800 text-sm">{customer.name}</div>
                                            <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                <Clock size={10} /> {customer.joinDate || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Mail size={12} className="text-gray-300" />
                                            <span>{customer.email || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Phone size={12} className="text-gray-300" />
                                            <span>{customer.phone || '—'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <MapPin size={12} className="text-gray-300 shrink-0" />
                                        <span className="max-w-[140px] truncate">{customer.address || '—'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-gray-700 font-semibold">{customer.totalPurchases || 0}</span>
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Orders</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-gray-900 font-bold">Rs. {(customer.totalSpent || 0).toLocaleString()}</span>
                                        <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-tighter">Net Spent</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${customer.status === 'Active'
                                        ? 'text-emerald-600'
                                        : 'text-gray-400'
                                        }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${customer.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                        {customer.status || 'Active'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleViewCustomer(customer)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="View Profile"
                                        >
                                            <Search size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleEditCustomer(customer)}
                                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                            title="Edit Details"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredCustomers.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="inline-flex p-4 bg-gray-50 rounded-full text-gray-300 mb-4">
                            <Users size={32} />
                        </div>
                        <h3 className="text-gray-800 font-bold">No customers found</h3>
                        <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">
                <span>Displaying {filteredCustomers.length} Profile(s)</span>
                <span>Database: {customers.length} Entries</span>
            </div>

            <AddCustomerModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSaveCustomer}
            />

            <ViewCustomerModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                customer={selectedCustomer}
            />

            <EditCustomerModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                customer={selectedCustomer}
                onSave={handleUpdateCustomer}
            />
        </div>
    );
};

export default Customers;
