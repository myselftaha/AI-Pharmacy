import React, { createContext, useContext, useState, useEffect } from 'react';
import API_URL from '../config/api';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false); // Controls the dropdown visibility

    const fetchNotifications = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            // Fetch list
            const response = await fetch(`${API_URL}/api/notifications?limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.notifications) {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error marking as read:', error);
            // Revert on error if critical, but usually fine to ignore
        }
    };

    const markAllRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);

            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/api/notifications/mark-all-read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    // Polling every 60 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(() => {
            fetchNotifications(true);
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const toggleDropdown = () => setIsOpen(!isOpen);
    const closeDropdown = () => setIsOpen(false);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            fetchNotifications,
            markAsRead,
            markAllRead,
            isOpen,
            toggleDropdown,
            closeDropdown
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
