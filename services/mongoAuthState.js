import mongoose from 'mongoose';
import { proto, initAuthCreds, BufferJSON } from '@whiskeysockets/baileys';

// Define Schema for WhatsApp Sessions
const sessionSchema = new mongoose.Schema({
    _id: String, // The key (e.g., 'creds', 'app-state-sync-key-xxxx')
    data: Object // The value (JSON)
});

// Prevent model overwrite if file is reloaded
const Session = mongoose.models.WhatsAppSession || mongoose.model('WhatsAppSession', sessionSchema);

export const useMongoDBAuthState = async (collectionName = 'whatsapp_sessions') => {
    // We ignore collectionName in this mongoose impl, but keep sig for compatibility

    // 1. Read Creds
    const readData = async (id) => {
        try {
            const data = await Session.findById(id);
            return data ? data.data : null;
        } catch (error) {
            console.error('Error reading auth data:', error);
            return null;
        }
    };

    const writeData = async (id, data) => {
        try {
            // Upsert (Update if exists, Insert if not)
            await Session.findByIdAndUpdate(
                id,
                { _id: id, data: data },
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

    // Load credentials
    const creds = (await readData('creds')) || initAuthCreds();

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
