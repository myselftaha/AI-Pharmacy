import React, { useState, useEffect } from 'react';
import { Search, Plus, Ticket, Calendar, DollarSign, Users } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import AddVoucherModal from '../components/vouchers/AddVoucherModal';
import EditVoucherModal from '../components/vouchers/EditVoucherModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import API_URL from '../config/api';


const Vouchers = () => {
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [voucherToDelete, setVoucherToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchVouchers();
    }, []);

    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/vouchers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setVouchers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching vouchers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateVoucher = async (voucherData) => {
        try {
            const response = await fetch(`${API_URL}/api/vouchers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(voucherData)
            });

            if (response.ok) {
                await fetchVouchers();
                setIsAddModalOpen(false);
                showToast('Voucher created successfully', 'success');
            } else {
                const error = await response.json();
                showToast('Failed to create voucher: ' + error.message, 'error');
            }
        } catch (error) {
            console.error('Error creating voucher:', error);
            showToast('Error creating voucher: ' + error.message, 'error');
        }
    };

    const handleEditVoucher = (voucher) => {
        setSelectedVoucher(voucher);
        setIsEditModalOpen(true);
    };

    const handleUpdateVoucher = async (voucherId, voucherData) => {
        try {
            const response = await fetch(`${API_URL}/api/vouchers/${voucherId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(voucherData)
            });

            if (response.ok) {
                await fetchVouchers();
                setIsEditModalOpen(false);
                setSelectedVoucher(null);
                showToast('Voucher updated successfully', 'success');
            } else {
                const error = await response.json();
                showToast('Failed to update voucher: ' + error.message, 'error');
            }
        } catch (error) {
            console.error('Error updating voucher:', error);
            showToast('Error updating voucher: ' + error.message, 'error');
        }
    };

    const handleToggleStatus = async (voucher) => {
        try {
            const response = await fetch(`${API_URL}/api/vouchers/${voucher._id}/toggle-status`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                await fetchVouchers();
            } else {
                const error = await response.json();
                alert('Failed to toggle status: ' + error.message);
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Error toggling status: ' + error.message);
        }
    };

    const handleDeleteVoucher = (voucherId) => {
        setVoucherToDelete(voucherId);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteVoucher = async () => {
        if (!voucherToDelete) return;
        try {
            setDeleting(true);
            const response = await fetch(`${API_URL}/api/vouchers/${voucherToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                await fetchVouchers();
                showToast('Voucher deleted successfully', 'success');
                setIsDeleteConfirmOpen(false);
                setVoucherToDelete(null);
            } else {
                const error = await response.json();
                showToast('Failed to delete voucher: ' + error.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting voucher:', error);
            showToast('Error deleting voucher: ' + error.message, 'error');
        } finally {
            setDeleting(false);
        }
    };

    const safeVouchers = Array.isArray(vouchers) ? vouchers : [];
    const filteredVouchers = safeVouchers.filter(voucher =>
        voucher?.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voucher?.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeVouchers = safeVouchers.filter(v => v.status === 'Active');
    const totalUsage = safeVouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0);
    const avgDiscount = safeVouchers.length > 0
        ? (safeVouchers.reduce((sum, v) => sum + (v.discountValue || 0), 0) / safeVouchers.length).toFixed(0)
        : 0;

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Voucher Management</h2>
                    <p className="text-xs text-gray-500 mt-1 italic">Note: Only one voucher can be Active at a time. Activating one will deactivate others.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search vouchers"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                    >
                        <Plus size={18} />
                        <span>Create Voucher</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Ticket className="text-green-600" size={20} />
                        </div>
                        <div className="text-gray-500 text-sm">Total Vouchers</div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">{vouchers.length}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Ticket className="text-blue-600" size={20} />
                        </div>
                        <div className="text-gray-500 text-sm">Active Vouchers</div>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">{activeVouchers.length}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Users className="text-purple-600" size={20} />
                        </div>
                        <div className="text-gray-500 text-sm">Total Usage</div>
                    </div>
                    <div className="text-3xl font-bold text-purple-600">{totalUsage}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="text-orange-600" size={20} />
                        </div>
                        <div className="text-gray-500 text-sm">Avg. Discount</div>
                    </div>
                    <div className="text-3xl font-bold text-orange-600">{avgDiscount}%</div>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading vouchers...</div>
            ) : (
                <>
                    {/* Vouchers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVouchers.map(voucher => (
                            <div key={voucher._id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                                <div className={`h-2 ${voucher.status === 'Active' ? 'bg-green-500' : voucher.status === 'Inactive' ? 'bg-gray-400' : 'bg-red-400'}`}></div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                                <Ticket className="text-green-600" size={24} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-xl text-gray-800">{voucher.code}</div>
                                                <div className="text-sm text-gray-500">{voucher.description}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Discount</span>
                                            <span className="font-bold text-green-600">
                                                {voucher.discountType === 'Percentage'
                                                    ? `${voucher.discountValue}%`
                                                    : `Rs. ${voucher.discountValue}`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Min. Purchase</span>
                                            <span className="font-medium text-gray-800">Rs. {voucher.minPurchase.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Usage</span>
                                            <span className="font-medium text-gray-800">
                                                {voucher.usedCount} / {voucher.maxUses}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all"
                                            style={{ width: `${(voucher.usedCount / voucher.maxUses) * 100}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                        <Calendar size={14} />
                                        <span>{formatDate(voucher.validFrom)} - {formatDate(voucher.validUntil)}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditVoucher(voucher)}
                                            className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(voucher)}
                                            className="flex-1 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                                        >
                                            {voucher.status === 'Active' ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteVoucher(voucher._id)}
                                            className="px-3 py-2 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredVouchers.length === 0 && (
                        <div className="text-center text-gray-400 py-12">
                            {searchQuery ? 'No vouchers found matching your search' : 'No vouchers yet. Create your first voucher!'}
                        </div>
                    )}

                    <div className="mt-4 text-sm text-gray-500">
                        Showing {filteredVouchers.length} of {vouchers.length} vouchers
                    </div>
                </>
            )}

            <AddVoucherModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleCreateVoucher}
            />

            <EditVoucherModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedVoucher(null);
                }}
                voucher={selectedVoucher}
                onSave={handleUpdateVoucher}
            />

            <ConfirmationModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => {
                    setIsDeleteConfirmOpen(false);
                    setVoucherToDelete(null);
                }}
                onConfirm={confirmDeleteVoucher}
                title="Delete Voucher"
                message="Are you sure you want to delete this voucher? This action cannot be undone and will permanently remove it from the system."
                confirmText="Yes, Delete Voucher"
                cancelText="Keep Voucher"
                type="danger"
                isLoading={deleting}
            />
        </div>
    );
};

export default Vouchers;
