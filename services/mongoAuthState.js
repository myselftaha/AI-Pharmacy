import mongoose from 'mongoose';
import { proto, initAuthCreds, BufferJSON } from '@whiskeysockets/baileys';

// Define Schema for WhatsApp Sessions
const sessionSchema = new mongoose.Schema({
    _id: String, // The key (e.g., 'creds', 'app-state-sync-key-xxxx')
    data: Object // The value (JSON)
});

// Prevent model overwrite if file is reloaded
const Session = mongoose.models.WhatsAppSession || mongoose.model('WhatsAppSession', sessionSchema);

export const clearAllSessions = async () => {
    try {
        await Session.deleteMany({});
        console.log('[MongoDB] All WhatsApp sessions cleared.');
        return true;
    } catch (error) {
        console.error('[MongoDB] Error clearing sessions:', error);
        return false;
    }
};

export const useMongoDBAuthState = async (collectionName = 'whatsapp_sessions') => {

    // 1. Read Data (With Buffer Reviver)
    const readData = async (id) => {
        try {
            const doc = await Session.findById(id);
            if (!doc || !doc.data) return null;
            // Deserializing: JSON.stringify to ensure it's a string, then parse with buffer reviver
            return JSON.parse(JSON.stringify(doc.data), BufferJSON.reviver);
        } catch (error) {
            console.error('Error reading auth data:', error);
            return null;
        }
    };

    // 2. Write Data (With Buffer Replacer)
    const writeData = async (id, data) => {
        try {
            // Serializing: Convert Buffers to JSON-friendly format
            const serialized = JSON.parse(JSON.stringify(data, BufferJSON.replacer));

            // Upsert (Update if exists, Insert if not)
            await Session.findByIdAndUpdate(
                id,
                { _id: id, data: serialized },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('Error writing auth data:', error);
        }
    };

    const removeData = async (id) => {
        try {
            await Session.findByIdAndDelete(id);
        } catch (error) {
            console.error('Error removing auth data:', error);
        }
    };

    // --- Handling Credentials ---
    let creds;
    try {
        const stored = await readData('creds');
        creds = stored || initAuthCreds();
    } catch (error) {
        console.warn('Corrupt credentials found, resetting session...', error);
        await Session.deleteMany({}); // Wipe if corrupt
        creds = initAuthCreds();
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            if (value) {
                                tasks.push(writeData(key, value));
                            } else {
                                tasks.push(removeData(key));
                            }
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => {
            return writeData('creds', creds);
        }
    };
};
