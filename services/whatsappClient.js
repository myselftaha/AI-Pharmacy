import { makeWASocket, DisconnectReason } from '@whiskeysockets/baileys';
import { useMongoDBAuthState, clearAllSessions } from './mongoAuthState.js';
import pino from 'pino';
import qrcode from 'qrcode';

// Global state
let sock = null;
let status = 'DISCONNECTED'; // DISCONNECTED, CONNECTING, QR_READY, CONNECTED
let qrCodeUrl = null;
let reconnectAttempts = 0;

// Initialize
export const initializeWhatsApp = async () => {
    try {
        if (sock) return; // Already initialized
        
        status = 'CONNECTING';
        console.log('[WHATSAPP] Initializing Baileys Socket...');

        // Use MongoDB Auth
        const { state, saveCreds } = await useMongoDBAuthState('whatsapp_sessions');

        sock = makeWASocket({
            auth: state,
            logger: pino({ level: 'silent' }), // Reduce noise
            printQRInTerminal: false,
            browser: ['AI Pharmacy', 'Chrome', '1.0.0'],
            connectTimeoutMs: 30000, // Shorter timeout for serverless
            syncFullHistory: false,
            generateHighQualityLinkPreview: true,
            // Add long-lived connection settings if not serverless
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        });

        // Event: Credentials Updated
        sock.ev.on('creds.update', saveCreds);

        // Event: Connection Update
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
                const statusCode = (lastDisconnect?.error)?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                console.log(`[WHATSAPP] Connection closed (${statusCode}). Reconnecting: ${shouldReconnect}`);
                
                status = 'DISCONNECTED';
                sock = null;
                qrCodeUrl = null;

                if (shouldReconnect && reconnectAttempts < 3) {
                    reconnectAttempts++;
                    setTimeout(initializeWhatsApp, 2000);
                } else if (!shouldReconnect) {
                    reconnectAttempts = 0;
                }
            }

            if (connection === 'open') {
                console.log('[WHATSAPP] Connection Opened');
                status = 'CONNECTED';
                qrCodeUrl = null;
                reconnectAttempts = 0;
            }
        });

    } catch (error) {
        console.error('[WHATSAPP] Init Error:', error);
        status = 'DISCONNECTED';
        sock = null;
    }
};

export const getStatus = () => {
    // If we're on Vercel and disconnected but might have a session, 
    // we return CONNECTING and trigger a silent init if not already running
    if (status === 'DISCONNECTED' && !sock) {
        // We don't await here to avoid blocking the status request
        initializeWhatsApp().catch(e => console.error('Silent Init Error:', e));
    }

    return {
        status: status === 'CONNECTED' ? 'AUTHENTICATED' : status,
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

    // Ensure connection exists
    if (!sock) {
        await initializeWhatsApp();
        // Wait a bit for connection if we just triggered it
        let waitCount = 0;
        while (status !== 'CONNECTED' && waitCount < 10) {
            await new Promise(r => setTimeout(r, 1000));
            waitCount++;
        }
    }

    if (status !== 'CONNECTED') {
        throw new Error('WhatsApp is connecting. Please wait a few seconds.');
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
            await sock.logout();
        }
        sock = null;
        status = 'DISCONNECTED';
        qrCodeUrl = null;
        return { success: true };
    } catch (error) {
        console.error('[WHATSAPP] Logout Error:', error);
        // Continue to cleanup local state even if logout fails
        sock = null;
        status = 'DISCONNECTED';
        return { success: true };
    }
};

export const hardReset = async () => {
    console.log('[WHATSAPP] Hard Resetting...');
    try {
        // 1. Close Socket
        if (sock) {
            sock.end(new Error('Resetting'));
            sock = null;
        }

        // 2. Wipe DB
        await clearAllSessions();

        // 3. Re-Init
        status = 'DISCONNECTED';
        qrCodeUrl = null;

        // Small delay to ensure DB write propagates (optional but safe)
        setTimeout(() => {
            initializeWhatsApp();
        }, 1000);

        return { success: true };
    } catch (error) {
        console.error('[WHATSAPP] Hard Reset Error:', error);
        throw error;
    }
};
