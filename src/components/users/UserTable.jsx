import React from 'react';
import { Key, ShieldAlert, UserCog, ToggleLeft, ToggleRight, Clock } from 'lucide-react';

const UserTable = ({ users, onRefresh, onEdit, onResetPassword, onToggleStatus }) => {

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                            <th className="px-6 py-4">Username</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Created On</th>
                            <th className="px-6 py-4">Last Login</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${user.role === 'Super Admin' ? 'bg-purple-600 text-white shadow-md' : 'bg-green-100 text-green-700'
                                            }`}>
                                            {user.role === 'Super Admin' ? <ShieldAlert size={16} /> : user.username.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-900 block">{user.username}</span>
                                            {user.role === 'Super Admin' && <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Master Account</span>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.role === 'Super Admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                            user.role === 'Admin' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                                'bg-gray-100 text-gray-700 border border-gray-200'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center gap-1.5 text-xs font-bold ${user.status === 'Active' ? 'text-green-600' : 'text-red-500'
                                        }`}>
                                        <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-600' : 'bg-red-500'
                                            }`} />
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {formatDate(user.createdAt)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={14} className="text-gray-400" />
                                        {formatDate(user.lastLogin)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {user.role !== 'Super Admin' && (
                                        <div className="flex items-center justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onEdit(user)}
                                                title="Edit User"
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <UserCog size={18} />
                                            </button>
                                            <button
                                                onClick={() => onResetPassword(user)}
                                                title="Reset Password"
                                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                            >
                                                <Key size={18} />
                                            </button>
                                            <button
                                                onClick={() => onToggleStatus(user)}
                                                title={user.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                                                className={`p-2 rounded-lg transition-colors ${user.status === 'Active'
                                                        ? 'text-red-600 hover:bg-red-50'
                                                        : 'text-green-600 hover:bg-green-50'
                                                    }`}
                                            >
                                                {user.status === 'Active' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserTable;
