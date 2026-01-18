import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { useMongoDBAuthState } from './mongoAuthState.js';
import pino from 'pino';
import qrcode from 'qrcode';

// Global state
let sock = null;
let status = 'DISCONNECTED'; // DISCONNECTED, QR_READY, CONNECTED
let qrCodeUrl = null;
let reconnectAttempts = 0;

// Initialize
export const initializeWhatsApp = async () => {
    try {
        if (sock) return; // Already initialized

        console.log('[WHATSAPP] Initializing Baileys Socket...');

        // Use MongoDB Auth
        const { state, saveCreds } = await useMongoDBAuthState('whatsapp_sessions');

        sock = makeWASocket({
            auth: state,
            printQRInTerminal: true, // Helpful for local dev logs
            logger: pino({ level: 'silent' }), // Reduce noise
            browser: ['AI Pharmacy POS', 'Chrome', '1.0.0'], // Spoof browser to look legit
            connectTimeoutMs: 60000,
        });

        // Event: Credentials Updated
        sock.ev.on('creds.update', saveCreds);

        // Event: Connection Update (QR, Open, Close)
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('[WHATSAPP] QR Code received');
                status = 'QR_READY';
                try {
                    qrCodeUrl = await qrcode.toDataURL(qr);
                } catch (err) {
                    console.error('[WHATSAPP] QR Generation Error:', err);
                }
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('[WHATSAPP] Connection closed. Reconnecting:', shouldReconnect);
                status = 'DISCONNECTED';
                sock = null;
                qrCodeUrl = null;

                // Reconnect loop (only if not logged out explicitly)
                if (shouldReconnect) {
                    if (reconnectAttempts < 5) {
                        reconnectAttempts++;
                        setTimeout(initializeWhatsApp, 3000); // Retry after 3s
                    } else {
                        console.log('[WHATSAPP] Max reconnect attempts reached.');
                    }
                } else {
                    console.log('[WHATSAPP] Logged out. Waiting for manual re-init.');
                }
            }

            if (connection === 'open') {
                console.log('[WHATSAPP] Connection Opened (Connected)');
                status = 'CONNECTED';
                qrCodeUrl = null;
                reconnectAttempts = 0;
            }
        });

        // Initialize listeners immediately
    } catch (error) {
        console.error('[WHATSAPP] Init Error:', error);
        status = 'DISCONNECTED';
    }
};

export const getStatus = () => {
    return {
        status: status === 'CONNECTED' ? 'AUTHENTICATED' : status, // Map to frontend expected string
        qrCodeUrl,
        info: sock?.user ? {
            wid: sock.user.id,
            pushname: sock.user.name || 'AI Pharmacy',
            platform: 'Baileys'
        } : null
    };
};

export const sendMessage = async (number, message) => {
    console.log(`[WHATSAPP] Sending to ${number}...`);

    // Helper to ensure connection exists (specifically for Vercel/Serverless hot-start)
    if (!sock) {
        console.warn('[WHATSAPP] Socket not ready, attempting to initialize...');
        await initializeWhatsApp();
        // Wait minor delay for connection? simpler to throw error if not ready instant
        // Baileys 'connect' is async. If we just called init, we might need to wait.
        // For simplicity, we assume 'init' was called at server start or we fail fast.
        throw new Error('WhatsApp connecting... please try again in 5 seconds.');
    }

    if (status !== 'CONNECTED') {
        throw new Error('WhatsApp not connected. Please check status in Settings.');
    }

    try {
        // Format Number
        let jid = number.toString().replace(/\D/g, ''); // Remove non-digits
        if (!jid.includes('@s.whatsapp.net')) {
            // Basic formatting for PK
            if (jid.startsWith('03')) jid = '92' + jid.substring(1);
            if (!jid.startsWith('92') && jid.length === 10) jid = '92' + jid;

            jid = `${jid}@s.whatsapp.net`;
        }

        // Verify existence (Optional, can slow things down. Baileys sends anyway usually)
        // const [result] = await sock.onWhatsApp(jid);
        // if (!result?.exists) throw new Error('Number not found on WhatsApp');

        // Send
        await sock.sendMessage(jid, { text: message });
        console.log(`[WHATSAPP] Message sent to ${jid}`);
        return { success: true };

    } catch (error) {
        console.error('[WHATSAPP] Send Error:', error);
        throw new Error(error.message || 'Failed to send message');
    }
};

export const logout = async () => {
    try {
        if (sock) {
            await sock.logout(); // This will trigger connection.close with loggedOut reason
            // Also clear MongoDB session manually to be safe?
            // The logout event should clean local state, but we might want to wipe DB.
            const { state } = await useMongoDBAuthState('whatsapp_sessions');
            if (state.keys.set) {
                // We can't easily "clear all" with the current simple adapter without a specialized method,
                // but Baileys logout usually sends a signal to keys to clear specific data.
                // We will rely on Baileys logic.
            }
        }
        sock = null;
        status = 'DISCONNECTED';
        qrCodeUrl = null;
        return { success: true };
    } catch (error) {
        console.error('[WHATSAPP] Logout Error:', error);
        throw error;
    }
};
