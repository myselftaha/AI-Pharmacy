import React, { useEffect, useState } from 'react';
import { getPendingTransactions, clearPendingTransaction, updatePendingTransaction, initDB } from '../../utils/offlineSync';
import API_URL from '../../config/api';
import { useToast } from '../../context/ToastContext';

const MAX_RETRIES = 3;

const SyncManager = ({ children }) => {
    const { showToast } = useToast();
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        const syncData = async () => {
            // Prevent concurrent syncs
            if (syncing || !navigator.onLine) return;

            setSyncing(true);

            try {
                const pending = await getPendingTransactions();

                // Filter out transactions that have exhausted retries
                const syncable = pending.filter(p => (p.data.retryCount || 0) < MAX_RETRIES);
                const exhausted = pending.filter(p => (p.data.retryCount || 0) >= MAX_RETRIES);

                if (syncable.length === 0) {
                    if (exhausted.length > 0) {
                        console.warn(`[SYNC] ${exhausted.length} transactions have exhausted retries`);
                    }
                    setSyncing(false);
                    return;
                }

                showToast(`🔄 Syncing ${syncable.length} offline transaction${syncable.length > 1 ? 's' : ''}...`, 'info');

                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('[SYNC] No auth token found');
                    setSyncing(false);
                    return;
                }

                let successCount = 0;
                let failCount = 0;

                for (const item of syncable) {
                    try {
                        console.log(`[SYNC] Attempting to sync: ${item.data.transactionId} (Retry ${item.data.retryCount || 0}/${MAX_RETRIES})`);

                        const response = await fetch(`${API_URL}/api/transactions`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(item.data)
                        });

                        if (response.ok) {
                            // Success! Remove from queue
                            await clearPendingTransaction(item.id);
                            successCount++;
                            console.log(`[SYNC] ✓ Successfully synced: ${item.data.transactionId}`);
                        } else {
                            // Server returned error (400, 500, etc.)
                            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));

                            // Update retry metadata
                            await updatePendingTransaction(item.id, {
                                retryCount: (item.data.retryCount || 0) + 1,
                                lastAttemptAt: new Date().toISOString(),
                                lastError: `${response.status}: ${errorData.message || 'Server error'}`
                            });

                            failCount++;
                            console.error(`[SYNC] ✗ Failed to sync ${item.data.transactionId}: ${response.status} ${errorData.message}`);
                        }
                    } catch (err) {
                        // Network error or timeout
                        await updatePendingTransaction(item.id, {
                            retryCount: (item.data.retryCount || 0) + 1,
                            lastAttemptAt: new Date().toISOString(),
                            lastError: err.message || 'Network error'
                        });

                        failCount++;
                        console.error(`[SYNC] ✗ Network error for ${item.data.transactionId}:`, err.message);
                    }
                }

                // Show results
                if (successCount > 0) {
                    showToast(`✅ Successfully synced ${successCount} transaction${successCount > 1 ? 's' : ''}`, 'success');
                }
                if (failCount > 0) {
                    const remaining = pending.length - successCount;
                    showToast(`⚠️ ${failCount} transaction${failCount > 1 ? 's' : ''} failed (${remaining} pending, will retry)`, 'warning');
                }
            } catch (error) {
                console.error('[SYNC] Sync process error:', error);
            } finally {
                setSyncing(false);
            }
        };

        // Initialize DB on mount
        initDB();

        // Listen for online event
        window.addEventListener('online', syncData);

        // Initial sync check (in case app loads while online with pending data)
        if (navigator.onLine) {
            setTimeout(syncData, 1000); // Small delay to let app initialize
        }

        return () => window.removeEventListener('online', syncData);
    }, [showToast]); // Only depend on showToast, syncing is in state

    return <>{children}</>;
};

export default SyncManager;
