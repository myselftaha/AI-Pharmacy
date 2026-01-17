import React, { useState, useEffect } from 'react';
import { Search, Loader2, UserPlus } from 'lucide-react';
import UserTable from '../components/users/UserTable';
import AddUserModal from '../components/users/AddUserModal';
import EditUserModal from '../components/users/EditUserModal';
import ResetPasswordModal from '../components/users/ResetPasswordModal';
import { useToast } from '../context/ToastContext';
import API_URL from '../config/api';


const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const { showToast } = useToast();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch users');
            }
            const data = await response.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast(err.message, 'error');
            console.error('Fetch Users Error:', err);
            if (err.message.includes('Invalid') || err.message.includes('expired')) {
                // Optional: Redirect to login or prompt user
                showToast('Session expired. Please login again.', 'warning');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (userData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });
            const data = await response.json();

            if (response.ok) {
                showToast('User created successfully', 'success');
                setIsAddModalOpen(false);
                fetchUsers();
            } else {
                showToast(data.message || 'Error creating user', 'error');
            }
        } catch (err) {
            showToast('Network error: Could not connect to server', 'error');
        }
    };

    const handleEditUser = async (id, updateData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });
            const data = await response.json();
            if (response.ok) {
                showToast('User updated successfully', 'success');
                setIsEditModalOpen(false);
                fetchUsers();
            } else {
                showToast(data.message || 'Error updating user', 'error');
            }
        } catch (err) {
            showToast('Error updating user', 'error');
        }
    };

    const handleResetPassword = async (newPassword) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/users/${selectedUser._id}/reset-password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword })
            });
            if (response.ok) {
                showToast('Password reset successfully', 'success');
                setIsResetModalOpen(false);
            } else {
                const data = await response.json();
                showToast(data.message || 'Error resetting password', 'error');
            }
        } catch (err) {
            showToast('Error resetting password', 'error');
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            const token = localStorage.getItem('token');
            const newStatus = user.status === 'Active' ? 'Deactivated' : 'Active';
            const response = await fetch(`${API_URL}/api/users/${user._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                showToast(`User ${newStatus.toLowerCase()} successfully`, 'info');
                fetchUsers();
            } else {
                const data = await response.json();
                showToast(data.message || 'Action restricted', 'warning');
            }
        } catch (err) {
            showToast('Action failed', 'error');
        }
    };

    const filteredUsers = (Array.isArray(users) ? users : []).filter(user =>
        user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user?.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Users Management</h2>
                    <p className="text-sm text-gray-500">Security-first access control for staff</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by username or role"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                        />
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 flex items-center gap-2 active:scale-95"
                    >
                        <UserPlus size={20} />
                        <span>Add New User</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <Loader2 className="animate-spin text-green-600 mb-3" size={40} />
                    <p className="text-gray-500 font-medium">Fetching secure user list...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <UserTable
                        users={filteredUsers}
                        onRefresh={fetchUsers}
                        onEdit={(user) => { setSelectedUser(user); setIsEditModalOpen(true); }}
                        onResetPassword={(user) => { setSelectedUser(user); setIsResetModalOpen(true); }}
                        onToggleStatus={handleToggleStatus}
                    />
                    <div className="flex justify-between items-center px-2">
                        <p className="text-sm text-gray-500 font-medium">
                            Showing <span className="text-gray-900">{filteredUsers.length}</span> of <span className="text-gray-900">{users.length}</span> results
                        </p>
                        <button
                            onClick={fetchUsers}
                            className="text-xs font-bold text-green-600 hover:text-green-700 uppercase tracking-wider"
                        >
                            Refresh List
                        </button>
                    </div>
                </div>
            )}

            <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddUser} />
            <EditUserModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleEditUser} user={selectedUser} />
            <ResetPasswordModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onReset={handleResetPassword} username={selectedUser?.username} />
        </div>
    );
};

export default Users;
