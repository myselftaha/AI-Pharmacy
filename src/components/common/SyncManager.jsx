import React, { useEffect } from 'react';
import { getPendingTransactions, clearPendingTransaction, initDB } from '../../utils/offlineSync';
import API_URL from '../../config/api';
import { useToast } from '../../context/ToastContext';

const SyncManager = ({ children }) => {
    const { showToast } = useToast();

    useEffect(() => {
        const syncData = async () => {
            if (!navigator.onLine) return;

            const pending = await getPendingTransactions();
            if (pending.length === 0) return;

            showToast(`Syncing ${pending.length} offline transactions...`, 'info');

            const token = localStorage.getItem('token');
            if (!token) return;

            let successCount = 0;
            for (const item of pending) {
                try {
                    const response = await fetch(`${API_URL}/api/transactions`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(item.data)
                    });

                    if (response.ok) {
                        await clearPendingTransaction(item.id);
                        successCount++;
                    }
                } catch (err) {
                    console.error('Sync failed for transaction', item, err);
                }
            }

            if (successCount > 0) {
                showToast(`Successfully synced ${successCount} transactions.`, 'success');
            }
        };

        // Standard sync on online event
        window.addEventListener('online', syncData);

        // Initial sync check
        syncData();

        return () => window.removeEventListener('online', syncData);
    }, []);

    return <>{children}</>;
};

export default SyncManager;
