import React, { useEffect, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, Clock, AlertTriangle, Info, Tag, Trash2, Filter, CheckCheck } from 'lucide-react';
import API_URL from '../config/api';

const Notifications = () => {
    const {
        notifications,
        markAsRead,
        markAllRead,
        fetchNotifications
    } = useNotifications();

    const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, HISTORY
    const [localNotifications, setLocalNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We might want to fetch *all* history here, not just the limited socket/context ones
        const fetchAllHistory = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/api/notifications?limit=50`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.notifications) {
                    setLocalNotifications(data.notifications);
                }
            } catch (error) {
                console.error("Failed to load history", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllHistory();
    }, [notifications]); // Refresh when context notifications change

    const filteredList = localNotifications.filter(n => {
        if (filter === 'UNREAD') return !n.isRead;
        return true;
    });

    const getIcon = (type) => {
        switch (type) {
            case 'EXPIRY': return <Clock size={20} className="text-red-500" />;
            case 'LOW_STOCK': return <AlertTriangle size={20} className="text-orange-500" />;
            case 'SALE': return <Tag size={20} className="text-green-500" />;
            default: return <Info size={20} className="text-blue-500" />;
        }
    };

    const getBgColor = (type) => {
        switch (type) {
            case 'EXPIRY': return 'bg-red-50 border-red-100';
            case 'LOW_STOCK': return 'bg-orange-50 border-orange-100';
            case 'SALE': return 'bg-green-50 border-green-100';
            default: return 'bg-blue-50 border-blue-100';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                    <p className="text-gray-500 text-sm">Stay updated with critical alerts and system messages</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={markAllRead}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <CheckCheck size={18} /> Mark All Read
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 border-b border-gray-200 pb-1">
                <button
                    onClick={() => setFilter('ALL')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${filter === 'ALL' ? 'border-green-500 text-green-600 bg-green-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    All Notifications
                </button>
                <button
                    onClick={() => setFilter('UNREAD')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${filter === 'UNREAD' ? 'border-green-500 text-green-600 bg-green-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Unread Only
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">Loading...</div>
                ) : filteredList.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Bell size={48} className="mx-auto mb-4 opacity-10" />
                        <p>No notifications found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredList.map((notification) => (
                            <div
                                key={notification._id}
                                className={`p-6 hover:bg-gray-50 transition-colors flex gap-4 ${notification.isRead ? 'opacity-75' : 'bg-blue-50/30'}`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${getBgColor(notification.type)}`}>
                                    {getIcon(notification.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-semibold ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                                            {notification.title}
                                        </h3>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed mb-2">
                                        {notification.message}
                                    </p>

                                    {!notification.isRead && (
                                        <button
                                            onClick={() => markAsRead(notification._id)}
                                            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
                                        >
                                            <Check size={14} /> Mark as Read
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Placeholder */}
            {localNotifications.length >= 50 && (
                <div className="text-center pt-4">
                    <button className="text-sm text-gray-500 hover:text-gray-800 font-medium">Load More</button>
                </div>
            )}
        </div>
    );
};

export default Notifications;
