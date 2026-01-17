import React, { useState, useEffect } from 'react';
import { X, UserCog } from 'lucide-react';
import { USER_ROLES } from '../../config/roles';

const EditUserModal = ({ isOpen, onClose, onSave, user }) => {
    const [formData, setFormData] = useState({
        role: '',
        status: '',
        permissions: []
    });

    useEffect(() => {
        if (user) {
            setFormData({
                role: user.role,
                status: user.status,
                permissions: user.permissions || []
            });
        }
    }, [user]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !user) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(user._id, formData);
    };

    const roles = Object.values(USER_ROLES);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <UserCog size={20} />
                        <h2 className="font-bold">Edit User: {user.username}</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        >
                            {user.role === 'Super Admin' && <option value="Super Admin">Super Admin</option>}
                            {roles.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                        {user.role === 'Super Admin' && (
                            <p className="mt-1 text-[10px] text-purple-600 font-bold uppercase italic">
                                Note: Super Admin role is protected
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">User Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            disabled={user.role === 'Super Admin'}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                        >
                            <option value="Active">Active</option>
                            <option value="Deactivated">Deactivated</option>
                        </select>
                        {user.role === 'Super Admin' && (
                            <p className="mt-1 text-[10px] text-gray-400 italic">
                                Cannot deactivate Super Admin
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
