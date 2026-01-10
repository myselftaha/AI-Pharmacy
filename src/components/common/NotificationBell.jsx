import React, { useRef, useEffect } from 'react';
import { Bell, Check, Clock, AlertTriangle, Info, Tag, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllRead,
        isOpen,
        toggleDropdown,
        closeDropdown
    } = useNotifications();

    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [closeDropdown]);

    const getIcon = (type) => {
        switch (type) {
            case 'EXPIRY': return <Clock size={16} className="text-red-500" />;
            case 'LOW_STOCK': return <AlertTriangle size={16} className="text-orange-500" />;
            case 'SALE': return <Tag size={16} className="text-green-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    const getBgColor = (type) => {
        switch (type) {
            case 'EXPIRY': return 'bg-red-50';
            case 'LOW_STOCK': return 'bg-orange-50';
            case 'SALE': return 'bg-green-50';
            default: return 'bg-blue-50';
        }
    };

    const navigate = useNavigate();

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className={`absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in slide-in-from-top-2`}>
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
                            >
                                <CheckCheck size={14} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        onClick={() => markAsRead(notification._id)}
                                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${notification.isRead ? 'opacity-60' : 'bg-white'}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 min-w-[32px] w-8 h-8 rounded-full flex items-center justify-center ${getBgColor(notification.type)}`}>
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className={`text-sm font-semibold ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.isRead && (
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-medium tracking-wide">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-2 border-t border-gray-100 bg-gray-50/50 text-center">
                        <button
                            onClick={() => {
                                closeDropdown();
                                navigate('/notifications');
                            }}
                            className="text-xs font-medium text-gray-500 hover:text-gray-800 w-full py-1"
                        >
                            View All History
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
