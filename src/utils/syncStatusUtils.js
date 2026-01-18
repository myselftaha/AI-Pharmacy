import { getPendingTransactions, clearPendingTransaction, updatePendingTransaction } from './offlineSync';

/**
 * Get sync statistics
 * @returns {Promise<{total: number, syncable: number, exhausted: number, failed: number}>}
 */
export const getSyncStats = async () => {
    const pending = await getPendingTransactions();
    const MAX_RETRIES = 3;

    const stats = {
        total: pending.length,
        syncable: pending.filter(p => (p.data.retryCount || 0) < MAX_RETRIES).length,
        exhausted: pending.filter(p => (p.data.retryCount || 0) >= MAX_RETRIES).length,
        failed: pending.filter(p => p.data.lastError).length
    };

    return stats;
};

/**
 * Get all transactions that have exhausted retry attempts
 * @returns {Promise<Array>}
 */
export const getFailedTransactions = async () => {
    const pending = await getPendingTransactions();
    const MAX_RETRIES = 3;

    return pending
        .filter(p => (p.data.retryCount || 0) >= MAX_RETRIES)
        .map(p => ({
            id: p.id,
            transactionId: p.data.transactionId,
            queuedAt: p.data.queuedAt,
            retryCount: p.data.retryCount,
            lastError: p.data.lastError,
            lastAttemptAt: p.data.lastAttemptAt,
            customer: p.data.customer?.name || 'Unknown',
            total: p.data.total
        }));
};

/**
 * Reset retry count for a specific transaction to allow manual retry
 * @param {number} id - IndexedDB transaction ID
 * @returns {Promise<boolean>}
 */
export const resetRetryCount = async (id) => {
    try {
        await updatePendingTransaction(id, {
            retryCount: 0,
            lastError: null,
            lastAttemptAt: null
        });
        return true;
    } catch (error) {
        console.error('Failed to reset retry count:', error);
        return false;
    }
};

/**
 * Reset all failed transactions to allow retry
 * @returns {Promise<number>} Number of transactions reset
 */
export const resetAllFailedTransactions = async () => {
    const failedTransactions = await getFailedTransactions();
    let resetCount = 0;

    for (const tx of failedTransactions) {
        const success = await resetRetryCount(tx.id);
        if (success) resetCount++;
    }

    return resetCount;
};

/**
 * Manually remove a transaction from the sync queue (use with caution!)
 * @param {number} id - IndexedDB transaction ID
 * @returns {Promise<boolean>}
 */
export const removePendingTransaction = async (id) => {
    try {
        await clearPendingTransaction(id);
        return true;
    } catch (error) {
        console.error('Failed to remove pending transaction:', error);
        return false;
    }
};

/**
 * Get detailed information about pending sync queue
 * @returns {Promise<Array>}
 */
export const getAllPendingDetails = async () => {
    const pending = await getPendingTransactions();

    return pending.map(p => ({
        id: p.id,
        transactionId: p.data.transactionId,
        type: p.data.type || 'Sale',
        customer: p.data.customer?.name || 'Unknown',
        total: p.data.total || 0,
        itemCount: p.data.items?.length || 0,
        queuedAt: p.data.queuedAt,
        retryCount: p.data.retryCount || 0,
        lastAttemptAt: p.data.lastAttemptAt,
        lastError: p.data.lastError,
        status: (p.data.retryCount || 0) >= 3 ? 'Failed' : (p.data.retryCount || 0) > 0 ? 'Retrying' : 'Pending'
    }));
};
