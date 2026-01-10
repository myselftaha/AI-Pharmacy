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
        return settings?.currencyPosition === 'after'
            ? `${p.toFixed(2)} ${symbol}`
            : `${symbol} ${p.toFixed(2)}`;
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
            getCurrency
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
