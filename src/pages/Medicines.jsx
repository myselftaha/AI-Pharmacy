import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { Search, Plus, Filter, Package, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import GroupedMedicineTable from '../components/supplies/GroupedMedicineTable';
import MedicineDetailsModal from '../components/supplies/MedicineDetailsModal';
import AddMedicineModal from '../components/supplies/AddMedicineModal';
import EditSupplyModal from '../components/supplies/EditSupplyModal';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import ExcelImportModal from '../components/medicines/ExcelImportModal';
import API_URL from '../config/api';

const Medicines = () => {
    const { showToast } = useToast();
    const location = useLocation();

    // Medicines state
    const [medicines, setMedicines] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Grouping State
    const [selectedMedicineGroup, setSelectedMedicineGroup] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [medicineToDelete, setMedicineToDelete] = useState(null);
    const [preSelectedSupplier, setPreSelectedSupplier] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Initial load
    useEffect(() => {
        fetchMedicines(1); // Fetch first page
        fetchSuppliers();

        // Handle pre-selected supplier from SupplierDetails
        if (location.state?.supplierId) {
            setPreSelectedSupplier({
                id: location.state.supplierId,
                name: location.state.supplierName
            });
            setIsAddModalOpen(true);
            window.history.replaceState({}, document.title);
        }

        if (location.state?.openAddSupply) {
            setIsAddModalOpen(true);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Handle Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Re-fetch on search change or page change
    useEffect(() => {
        fetchMedicines(1);
    }, [debouncedSearch]);

    const fetchMedicines = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page,
                limit: pagination.limit,
                searchQuery: debouncedSearch
            });

            const response = await fetch(`${API_URL}/api/supplies?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMedicines(data.data || []);
                setPagination(data.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
            } else {
                showToast('Failed to fetch medicines', 'error');
            }
        } catch (error) {
            console.error('Error fetching medicines:', error);
            showToast('Error fetching medicines', 'error');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, pagination.limit, showToast]);

    // Grouping Logic
    const groupedMedicines = useMemo(() => {
        const groups = {};
        const medicineIdsAddedPerGroup = {}; // Track which medicines we've already added stock for

        medicines.forEach(m => {
            const nameKey = m.name?.trim().toLowerCase();
            if (!nameKey) return;

            if (!groups[nameKey]) {
                groups[nameKey] = {
                    name: m.name,
                    totalStock: 0,
                    batches: [],
                    suppliers: new Set()
                };
                medicineIdsAddedPerGroup[nameKey] = new Set();
            }

            groups[nameKey].batches.push(m);

            // Fix: Only add currentStock to total once per unique Medicine ID in this group
            // because every batch (supply) currently reports the FULL stock of the medicine.
            if (m.medicineId && !medicineIdsAddedPerGroup[nameKey].has(m.medicineId.toString())) {
                groups[nameKey].totalStock += (Number(m.currentStock) || 0);
                medicineIdsAddedPerGroup[nameKey].add(m.medicineId.toString());
            } else if (!m.medicineId) {
                // Fallback for cases where medicineId might be missing (should not happen normally)
                groups[nameKey].totalStock += (Number(m.currentStock) || 0);
            }

            if (m.supplierName) groups[nameKey].suppliers.add(m.supplierName);
        });

        return Object.values(groups).map(g => ({
            ...g,
            suppliers: Array.from(g.suppliers).join(', ')
        }));
    }, [medicines]);


    const fetchSuppliers = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/suppliers`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setSuppliers(data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    }, []);

    const handleSaveMedicine = async (medicineData) => {
        // ... (rest of logic remains same, just refetch medicines)
        try {
            const response = await fetch(`${API_URL}/api/supplies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(medicineData)
            });

            if (response.ok) {
                await fetchMedicines();
                setIsAddModalOpen(false);
                setPreSelectedSupplier(null);
                showToast('Medicine added successfully!', 'success');
            } else {
                const errorData = await response.json();
                showToast(errorData.message || 'Failed to add medicine', 'error');
            }
        } catch (error) {
            console.error('Error saving medicine:', error);
            showToast('Error saving medicine', 'error');
        }
    };

    const handleEditMedicine = (medicine) => {
        // Close details modal temporarily or keep it open?
        // Usually modals stack. Let's keep Details open, open Edit on top.
        setSelectedMedicine(medicine);
        setIsEditModalOpen(true);
    };

    const handleUpdateMedicine = async (updatedData) => {
        try {
            const response = await fetch(`${API_URL}/api/supplies/${selectedMedicine._id || selectedMedicine.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                await fetchMedicines();

                // If we are viewing details, we need to update the selectedMedicineGroup 'batches' as well?
                // The 'fetchMedicines' updates the 'medicines' state. 
                // The 'groupedMedicines' memo will re-run.
                // But 'selectedMedicineGroup' is local state. We need to update it.
                // Or better, derive 'selectedMedicineGroup' from 'groupedMedicines' via an ID or Name?
                // Since we don't have stable IDs for groups, we use Name.

                if (selectedMedicineGroup) {
                    // We need to find the updated group and set it again to force re-render of details modal content if needed
                    // Actually, let's solve this by using an effect or just closing for now?
                    // Better: The 'MedicineDetailsModal' receives 'medicineGroup'.
                    // If we pass the NEW group object from 'groupedMedicines', it will update.
                    // But 'selectedMedicineGroup' is a static snapshot in state currently.
                    // Let's just rely on the user closing and reopening OR update the snapshot.

                    // Simple fix: Close edit modal. 
                    setIsEditModalOpen(false);
                    setSelectedMedicine(null);
                    showToast('Medicine updated successfully!', 'success');
                } else {
                    setIsEditModalOpen(false);
                    setSelectedMedicine(null);
                    showToast('Medicine updated successfully!', 'success');
                }

            } else {
                const errorData = await response.json();
                showToast(errorData.message || 'Failed to update medicine', 'error');
            }
        } catch (error) {
            console.error('Error updating medicine:', error);
            showToast('Error updating medicine', 'error');
        }
    };

    // Sync the selected group with new data
    useEffect(() => {
        if (selectedMedicineGroup) {
            const updatedGroup = groupedMedicines.find(g => g.name === selectedMedicineGroup.name);
            if (updatedGroup) {
                setSelectedMedicineGroup(updatedGroup);
            }
        }
    }, [groupedMedicines]);


    const handleDeleteClick = (medicine) => {
        setMedicineToDelete(medicine);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!medicineToDelete) return;

        try {
            const medicineId = medicineToDelete._id || medicineToDelete.id;
            const response = await fetch(`${API_URL}/api/supplies/${medicineId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                await fetchMedicines();
                setIsDeleteModalOpen(false);
                setMedicineToDelete(null);
                showToast('Medicine deleted successfully!', 'success');
            } else {
                const errorData = await response.json();
                showToast(errorData.message || 'Failed to delete medicine', 'error');
            }
        } catch (error) {
            console.error('Error deleting medicine:', error);
            showToast('Error deleting medicine', 'error');
        }
    };

    const handleSyncStock = async (medicineGroup, calculatedTotal) => {
        if (!medicineGroup || !medicineGroup.batches.length) return;

        // Find the linked medicine ID from the first batch
        const firstBatch = medicineGroup.batches[0];
        const medicineId = firstBatch.medicineId;

        if (!medicineId) {
            showToast('Cannot sync: Missing Medicine ID', 'error');
            return;
        }

        try {
            // Update the medicine stock directly
            // We use the PUT /api/medicines/:id endpoint which updates specific fields
            const response = await fetch(`${API_URL}/api/medicines/${medicineId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    stock: calculatedTotal,
                })
            });

            if (response.ok) {
                await fetchMedicines(); // Refresh all data
                showToast('Stock synchronized successfully!', 'success');
            } else {
                const errorData = await response.json();
                showToast(errorData.message || 'Failed to sync stock', 'error');
            }
        } catch (error) {
            console.error('Error syncing stock:', error);
            showToast('Error syncing stock', 'error');
        }
    };

    const handleViewDetails = (group) => {
        setSelectedMedicineGroup(group);
        setIsDetailsModalOpen(true);
    };

    const handleExcelImport = async (excelData) => {
        try {
            const response = await fetch(`${API_URL}/api/medicines/bulk-import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ medicines: excelData })
            });

            const result = await response.json();

            if (response.ok) {
                showToast(result.message, result.results.failed > 0 ? 'warning' : 'success');
                await fetchMedicines(); // Refresh medicine list
                return result;
            } else {
                showToast(result.message || 'Import failed', 'error');
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error importing medicines:', error);
            showToast('Error importing medicines', 'error');
            throw error;
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Medicines</h2>
                    <p className="text-sm text-gray-500">
                        Manage medicine supplies, inventory, and purchase history.
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search medicines..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Upload size={18} />
                        <span>Import Excel</span>
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                    >
                        <Plus size={18} />
                        <span>Add Medicine</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto">
                    <GroupedMedicineTable
                        groupedMedicines={groupedMedicines}
                        onViewDetails={handleViewDetails}
                    />
                </div>

                {/* Pagination Bar */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> medicines
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchMedicines(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(pagination.pages)].map((_, i) => {
                                const pageNum = i + 1;
                                // Only show current, first, last, and pages around current
                                if (
                                    pageNum === 1 ||
                                    pageNum === pagination.pages ||
                                    (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                                ) {
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => fetchMedicines(pageNum)}
                                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${pagination.page === pageNum
                                                ? 'bg-green-500 text-white'
                                                : 'hover:bg-white border border-transparent hover:border-gray-200 text-gray-600'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                } else if (
                                    pageNum === pagination.page - 2 ||
                                    pageNum === pagination.page + 2
                                ) {
                                    return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                                }
                                return null;
                            })}
                        </div>
                        <button
                            onClick={() => fetchMedicines(pagination.page + 1)}
                            disabled={pagination.page >= pagination.pages}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            <MedicineDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                medicineGroup={selectedMedicineGroup}
                onEdit={handleEditMedicine}
                onDelete={handleDeleteClick}
                onSyncStock={handleSyncStock}
            />

            <AddMedicineModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setPreSelectedSupplier(null);
                }}
                onSave={handleSaveMedicine}
                suppliers={suppliers}
                initialSupplier={preSelectedSupplier}
            />

            <EditSupplyModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleUpdateMedicine}
                supply={selectedMedicine}
                suppliers={suppliers}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                itemName={medicineToDelete?.name}
            />

            <ExcelImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleExcelImport}
            />
        </div>
    );
};

export default Medicines;
