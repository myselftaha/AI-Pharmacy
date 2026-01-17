import React, { createContext, useContext, useState, useEffect } from 'react';
import API_URL from '../config/api';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            // If no token, we can't fetch settings yet (wait for login)
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/api/settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            } else {
                console.error('Failed to fetch settings');
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSettings = async (newSettings) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newSettings)
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(data.settings);
                return { success: true, message: 'Settings updated successfully' };
            } else {
                const errorData = await response.json();
                return { success: false, message: errorData.message || 'Failed to update settings' };
            }
        } catch (err) {
            console.error('Error updating settings:', err);
            return { success: false, message: err.message };
        }
    };

    const restoreDefaults = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/settings/restore-defaults`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(data.settings);
                return { success: true, message: 'Restored default settings' };
            } else {
                return { success: false, message: 'Failed to restore defaults' };
            }
        } catch (err) {
            return { success: false, message: err.message };
        }
    };


    // Derived values helpers
    const getCurrency = () => settings?.currency || 'Rs';
    const formatPrice = (price) => {
        const p = parseFloat(price) || 0;
        const symbol = getCurrency();
        const position = settings?.currencyPosition || 'before';
        return position === 'after'
            ? `${p.toFixed(2)} ${symbol}`
            : `${symbol} ${p.toFixed(2)}`;
    };

    const checkStoreStatus = () => {
        if (!settings) return { isOpen: false, status: 'Closed' };

        const now = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentDay = days[now.getDay()];

        // Check if today is a working day
        if (!settings.workingDays?.includes(currentDay)) {
            return { isOpen: false, status: 'Closed (Day Off)' };
        }

        // Parse working hours
        const [startHour, startMinute] = (settings.workingHoursStart || '09:00').split(':').map(Number);
        const [endHour, endMinute] = (settings.workingHoursEnd || '21:00').split(':').map(Number);

        const startTime = new Date(now);
        startTime.setHours(startHour, startMinute, 0);

        const endTime = new Date(now);
        endTime.setHours(endHour, endMinute, 0);

        // Adjust validation if closing time is next day (e.g. 23:00 to 02:00) - Basic implementation assumes same day for now
        // Advanced: handling overnight shifts would require checking if end < start

        if (now >= startTime && now <= endTime) {
            return { isOpen: true, status: 'Open' };
        } else {
            return { isOpen: false, status: 'Closed' };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        const format = settings?.dateFormat || 'DD/MM/YYYY';

        switch (format) {
            case 'MM/DD/YYYY':
                return `${month}/${day}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'DD/MM/YYYY':
            default:
                return `${day}/${month}/${year}`;
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const format = settings?.timeFormat || '12h';

        if (format === '24h') {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        } else {
            let hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            return `${hours}:${minutes} ${ampm}`;
        }
    };

    return (
        <SettingsContext.Provider value={{
            settings,
            loading,
            error,
            refreshSettings: fetchSettings,
            updateSettings,
            restoreDefaults,
            formatPrice,
            getCurrency,
            checkStoreStatus,
            formatDate,
            formatTime
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
