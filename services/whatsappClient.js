import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import process from 'process';

// Global error handlers to prevent server crash on internal WWebJS/Puppeteer failures
process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err, origin) => {
    console.error(`[CRITICAL] Uncaught Exception: ${err.message}\nOrigin: ${origin}\nStack: ${err.stack}`);
});

let client;
let qrCodeUrl = null;
let status = 'DISCONNECTED'; // DISCONNECTED, QR_READY, READY, AUTHENTICATED

export const initializeWhatsApp = async () => {
    try {
        if (client) return;

        console.log('Initializing WhatsApp Client...');

        // Initialize client with local auth to save session
        client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'client-one',
                dataPath: './.wwebjs_auth'
            }),
            puppeteer: {
                headless: 'new', // Using 'new' headless mode is more stable for WWebJS
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            }
        });

        client.on('qr', async (qr) => {
            console.log('WhatsApp QR Code Received');
            try {
                qrCodeUrl = await qrcode.toDataURL(qr);
                status = 'QR_READY';
            } catch (err) {
                console.error('Error generating QR code:', err);
            }
        });

        client.on('ready', () => {
            console.log('WhatsApp Client is ready!');
            status = 'READY';
            qrCodeUrl = null; // Clear QR code once connected
        });

        client.on('authenticated', () => {
            console.log('WhatsApp Authenticated');
            status = 'AUTHENTICATED';
        });

        client.on('auth_failure', (msg) => {
            console.error('WhatsApp Authentication Failure:', msg);
            status = 'DISCONNECTED';
        });

        client.on('disconnected', (reason) => {
            console.log('WhatsApp Disconnected:', reason);
            status = 'DISCONNECTED';
            client = null;
            // Optional: Auto-reconnect logic could go here
        });

        await client.initialize();

    } catch (error) {
        console.error('Error initializing WhatsApp:', error);
        status = 'DISCONNECTED';
    }
};

export const getStatus = () => {
    return {
        status,
        qrCodeUrl,
        info: client?.info ? {
            wid: client.info.wid,
            pushname: client.info.pushname,
            platform: client.info.platform
        } : null
    };
};

export const sendMessage = async (number, message) => {
    console.log(`[WHATSAPP-CLIENT] Attempting to send message to ${number}. Status: ${status}`);

    if (!client) {
        throw new Error('WhatsApp client not initialized');
    }

    if (status !== 'READY' && status !== 'AUTHENTICATED') {
        throw new Error(`WhatsApp is not connected (Status: ${status}). Please scan QR code.`);
    }

    try {
        let cleanNumber = number.toString().replace(/\s+/g, '').replace(/[+\-()]/g, '');

        // Remove leading 92 if present to avoid double prefixing
        if (cleanNumber.startsWith('92') && cleanNumber.length > 10) {
            // Already includes country code
        } else if (cleanNumber.startsWith('0')) {
            cleanNumber = '92' + cleanNumber.substring(1);
        } else if (cleanNumber.length === 10) {
            cleanNumber = '92' + cleanNumber;
        }

        console.log(`[WHATSAPP-CLIENT] Validating number: ${cleanNumber}`);

        // Get the official ID for the number (ensures it's registered and formatted correctly)
        let chatId;
        try {
            const numberId = await client.getNumberId(cleanNumber);
            if (!numberId) {
                throw new Error(`The number ${cleanNumber} does not appear to be registered on WhatsApp. Please check the number.`);
            }
            chatId = numberId._serialized;
        } catch (err) {
            console.warn(`[WHATSAPP-CLIENT] getNumberId failed for ${cleanNumber}:`, err.message);
            // Fallback to manual construction if verification fails (sometimes WWebJS verification is flaky)
            chatId = `${cleanNumber}@c.us`;
        }

        console.log(`[WHATSAPP-CLIENT] Sending to ${chatId}...`);

        // Send with sendSeen: false to avoid the 'markedUnread' bug in WWebJS
        const response = await client.sendMessage(chatId, message, { sendSeen: false }).catch(err => {
            if (err && err.message && (err.message.includes('markedUnread') || err.message.includes('reading \'markedUnread\''))) {
                // Secondary fallback: if even with sendSeen: false it fails, it might be a deeper context issue
                console.log(`[WHATSAPP-CLIENT] Fatal 'markedUnread' error even with sendSeen:false. Attempting final fallback.`);
                throw new Error('WhatsApp internal error (markedUnread). This usually happens when the chat session is unstable. Please logout and login again from the Settings page.');
            }
            throw err;
        });

        console.log(`[WHATSAPP-CLIENT] Successfully sent to ${chatId}`);
        return { success: true, response };
    } catch (error) {
        console.error('[WHATSAPP-CLIENT] Final Send Error:', error);

        let finalMessage = error.message || 'Failed to send WhatsApp message';

        // Humanize common technical errors
        if (finalMessage.includes('markedUnread')) {
            finalMessage = "WhatsApp session sync issue. Please go to Settings, logout from WhatsApp, and scan the QR code again.";
        } else if (finalMessage === 't') {
            finalMessage = "WhatsApp session timeout. Please refresh and try again, or re-connect in Settings.";
        }

        throw new Error(finalMessage);
    }
};

export const logout = async () => {
    try {
        if (client) {
            await client.logout();
            client = null;
            status = 'DISCONNECTED';
            qrCodeUrl = null;
        }
        return { success: true };
    } catch (error) {
        console.error('Error logging out:', error);
        throw error;
    }
};
