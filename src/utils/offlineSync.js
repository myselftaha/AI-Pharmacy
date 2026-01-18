const DB_NAME = 'PharmacyPOS_Offline';
const DB_VERSION = 1;

export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('medicines')) {
                db.createObjectStore('medicines', { keyPath: '_id' });
            }
            if (!db.objectStoreNames.contains('pendingTransactions')) {
                db.createObjectStore('pendingTransactions', { autoIncrement: true });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

export const saveMedicinesToLocal = async (medicines) => {
    const db = await initDB();
    const tx = db.transaction('medicines', 'readwrite');
    const store = tx.objectStore('medicines');

    // Clear old data
    store.clear();

    medicines.forEach(med => {
        store.put(med);
    });

    return new Promise((resolve) => {
        tx.oncomplete = () => resolve(true);
    });
};

export const getMedicinesFromLocal = async () => {
    const db = await initDB();
    const tx = db.transaction('medicines', 'readonly');
    const store = tx.objectStore('medicines');
    const request = store.getAll();

    return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result);
    });
};

export const queueTransaction = async (transaction) => {
    const db = await initDB();
    const tx = db.transaction('pendingTransactions', 'readwrite');
    const store = tx.objectStore('pendingTransactions');
    store.add({
        ...transaction,
        queuedAt: new Date().toISOString(),
        retryCount: 0,
        lastAttemptAt: null,
        lastError: null
    });

    return new Promise((resolve) => {
        tx.oncomplete = () => resolve(true);
    });
};

export const getPendingTransactions = async () => {
    const db = await initDB();
    const tx = db.transaction('pendingTransactions', 'readonly');
    const store = tx.objectStore('pendingTransactions');

    return new Promise((resolve) => {
        const results = [];
        const request = store.openCursor();

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                results.push({
                    id: cursor.key,
                    data: cursor.value
                });
                cursor.continue();
            } else {
                resolve(results);
            }
        };
    });
};

export const clearPendingTransaction = async (id) => {
    const db = await initDB();
    const tx = db.transaction('pendingTransactions', 'readwrite');
    const store = tx.objectStore('pendingTransactions');
    store.delete(id);

    return new Promise((resolve) => {
        tx.oncomplete = () => resolve(true);
    });
};

export const updatePendingTransaction = async (id, updates) => {
    const db = await initDB();
    const tx = db.transaction('pendingTransactions', 'readwrite');
    const store = tx.objectStore('pendingTransactions');
    const request = store.get(id);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const existingData = request.result;
            if (!existingData) {
                reject(new Error('Transaction not found in pending queue'));
                return;
            }
            const updatedData = { ...existingData, ...updates };
            const updateRequest = store.put(updatedData);
            updateRequest.onsuccess = () => resolve(true);
            updateRequest.onerror = () => reject(updateRequest.error);
        };
        request.onerror = () => reject(request.error);
    });
};
