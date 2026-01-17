import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { Search, Plus, MapPin, Phone, Mail, MoreVertical, Eye, Pencil, Trash2, ShoppingCart, FileText, Users, Wallet, Clock } from 'lucide-react';
import API_URL from '../config/api';
import AddDistributorModal from '../components/suppliers/AddDistributorModal';
import PurchaseOrderModal from '../components/suppliers/PurchaseOrderModal';
import DistributorLedgerModal from '../components/suppliers/DistributorLedgerModal';
import DistributorDetailsModal from '../components/suppliers/DistributorDetailsModal';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';

const Suppliers = () => {
    const { showToast } = useToast();
    const [suppliers, setSuppliers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState(null);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);

    useEffect(() => {
        fetchSuppliers();

        // Close menu on click outside
        const handleClickOutside = () => setActiveMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/suppliers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setSuppliers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            showToast('Failed to fetch distributors', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredSuppliers = (Array.isArray(suppliers) ? suppliers : []).filter(s =>
        s?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s?.city && s.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s?.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const stats = {
        total: (Array.isArray(suppliers) ? suppliers : []).length,
        outstanding: (Array.isArray(suppliers) ? suppliers : []).reduce((acc, s) => acc + (s.totalPayable || 0), 0),
        avgCreditDays: (Array.isArray(suppliers) ? suppliers : []).length > 0
            ? Math.round(suppliers.reduce((acc, s) => acc + (s.creditDays || 30), 0) / suppliers.length)
            : 0
    };

    const handleAddDistributor = () => {
        setSelectedSupplier(null);
        setIsEditMode(false);
        setIsAddModalOpen(true);
    };

    const handleEditDistributor = (supplier) => {
        setSelectedSupplier(supplier);
        setIsEditMode(true);
        setIsAddModalOpen(true);
        setActiveMenuId(null);
    };

    const handleDeleteDistributor = (supplier) => {
        setSupplierToDelete(supplier);
        setIsDeleteModalOpen(true);
        setActiveMenuId(null);
    };

    const confirmDelete = async () => {
        if (!supplierToDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/suppliers/${supplierToDelete._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                showToast('Distributor removed successfully', 'success');
                fetchSuppliers();
            } else {
                showToast('Failed to delete distributor', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        }
        setSupplierToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const handleOpenOrder = (supplier) => {
        setSelectedSupplier(supplier);
        setIsOrderModalOpen(true);
        setActiveMenuId(null);
    };

    const handleOpenLedger = (supplier) => {
        setSelectedSupplier(supplier);
        setIsLedgerModalOpen(true);
        setActiveMenuId(null);
    };

    const handleOpenDetails = (supplier) => {
        setSelectedSupplier(supplier);
        setIsDetailsModalOpen(true);
        setActiveMenuId(null);
    };

    const toggleMenu = (e, supplierId) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === supplierId ? null : supplierId);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Distributors</h2>
                    <p className="text-gray-500 text-sm">Manage your medicine suppliers and wholesalers</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto items-center">
                    <div className="relative flex-1 md:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>
                    <button
                        onClick={handleAddDistributor}
                        className="flex items-center gap-2 bg-[#00c950] hover:bg-[#00b347] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Plus size={20} />
                        Add Distributor
                    </button>
                </div>
            </div>

            {/* Stats Cards (Kept functionally same, styling tweaked to match theme) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Total Distributors</p>
                            <h3 className="text-2xl font-bold text-gray-800">{stats.total}</h3>
                        </div>
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                            <Users size={20} className="text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Outstanding Balance</p>
                            <h3 className="text-2xl font-bold text-gray-800">Rs {stats.outstanding.toLocaleString()}</h3>
                            <p className="text-gray-400 text-xs mt-1">{suppliers.filter(s => s.totalPayable > 0).length} distributors</p>
                        </div>
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                            <Wallet size={20} className="text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Avg. Credit Days</p>
                            <h3 className="text-2xl font-bold text-gray-800">{stats.avgCreditDays}</h3>
                            <p className="text-gray-400 text-xs mt-1">Across all distributors</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Clock size={20} className="text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}

            {/* Distributor Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                {loading ? (
                    <div className="col-span-full flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                    </div>
                ) : filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map(supplier => (
                        <div
                            key={supplier._id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all relative"
                        >
                            {/* Three Dots Menu */}
                            <div className="absolute right-4 top-4">
                                <button
                                    onClick={(e) => toggleMenu(e, supplier._id)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                                >
                                    <MoreVertical size={20} />
                                </button>

                                {activeMenuId === supplier._id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                                        <button
                                            onClick={() => handleOpenDetails(supplier)}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <Eye size={16} />
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => handleEditDistributor(supplier)}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <Pencil size={16} />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleOpenOrder(supplier)}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <ShoppingCart size={16} />
                                            Create Order
                                        </button>
                                        <button
                                            onClick={() => handleOpenLedger(supplier)}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <FileText size={16} />
                                            View Ledger
                                        </button>
                                        <div className="h-px bg-gray-100 my-1"></div>
                                        <button
                                            onClick={() => handleDeleteDistributor(supplier)}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Distributor Info */}
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 pr-8">{supplier.name}</h3>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <MapPin size={14} />
                                        <span>{supplier.city || 'Location Not Set'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <Phone size={14} />
                                        <span>{supplier.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <Mail size={14} />
                                        <span className="truncate">{supplier.email || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Credit Days and Outstanding */}
                            <div className="space-y-3 mb-6 pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 text-sm">Credit Days</span>
                                    <span className="text-gray-900 font-semibold">{supplier.creditDays || 30} days</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 text-sm">Outstanding</span>
                                    <span className={`font-bold ${supplier.totalPayable > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        Rs {supplier.totalPayable?.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleOpenOrder(supplier)}
                                    className="flex items-center justify-center gap-2 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium text-sm transition-all"
                                >
                                    <ShoppingCart size={16} />
                                    <span>Order</span>
                                </button>
                                <button
                                    onClick={() => handleOpenLedger(supplier)}
                                    className="flex items-center justify-center gap-2 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium text-sm transition-all"
                                >
                                    <FileText size={16} />
                                    <span>Ledger</span>
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                        <Users size={64} className="mb-4 opacity-20" />
                        <p className="text-lg font-semibold text-gray-600">No distributors found</p>
                        <p className="text-sm">Try adjusting your search or add a new distributor.</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AddDistributorModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchSuppliers}
                isEditMode={isEditMode}
                initialData={selectedSupplier}
            />
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                itemName={supplierToDelete?.name}
                title="Delete Distributor?"
                message="This will permanently remove this distributor and all associated records from the system."
            />
            {selectedSupplier && (
                <>
                    <DistributorDetailsModal
                        isOpen={isDetailsModalOpen}
                        onClose={() => setIsDetailsModalOpen(false)}
                        supplier={selectedSupplier}
                        onUpdate={fetchSuppliers}
                    />
                    <PurchaseOrderModal
                        isOpen={isOrderModalOpen}
                        onClose={() => setIsOrderModalOpen(false)}
                        supplier={selectedSupplier}
                        onSuccess={fetchSuppliers}
                    />
                    <DistributorLedgerModal
                        isOpen={isLedgerModalOpen}
                        onClose={() => setIsLedgerModalOpen(false)}
                        supplier={selectedSupplier}
                        onUpdate={fetchSuppliers}
                    />
                </>
            )}
        </div>
    );
};

export default Suppliers;
