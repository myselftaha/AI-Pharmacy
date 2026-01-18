import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { Smartphone, RefreshCw, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import API_URL from '../../config/api';

const WhatsAppSettings = () => {
    const { showToast } = useToast();
    const [status, setStatus] = useState('LOADING'); // LOADING, DISCONNECTED, QR_READY, READY, AUTHENTICATED
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [clientInfo, setClientInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/whatsapp/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 500) throw new Error('Server Error');
            const data = await res.json();

            setStatus(data.status);
            setQrCodeUrl(data.qrCodeUrl);
            setClientInfo(data.info);
        } catch (err) {
            console.error('Error fetching WhatsApp status:', err);
            status !== 'LOADING' && showToast('Failed to check WhatsApp status', 'error');
        }
    };

    const handleInit = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/api/whatsapp/init`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showToast('Initializing WhatsApp Client...', 'info');
            // Poll for status update
            setTimeout(fetchStatus, 2000);
        } catch (err) {
            showToast('Failed to initialize client', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!window.confirm('This will wipe all WhatsApp session data and restart the client. Continue?')) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            // Use the new reset endpoint
            await fetch(`${API_URL}/api/whatsapp/reset`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showToast('Session reset. generating new QR...', 'success');
            // Wait a bit then fetch status
            setTimeout(fetchStatus, 3000);
        } catch (err) {
            showToast('Failed to reset session', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Poll for status every 5 seconds if not connected
    useEffect(() => {
        fetchStatus();
        const interval = setInterval(() => {
            if (status !== 'AUTHENTICATED' && status !== 'READY') {
                fetchStatus();
            }
        }, 5000); // Check every 5s for QR updates or connection

        return () => clearInterval(interval);
    }, [status]);

    return (
        <div className="space-y-6 max-w-2xl">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                <Smartphone size={20} className="text-green-600" />
                WhatsApp Integration
            </h3>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">

                {/* Status Indicator */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h4 className="font-medium text-gray-800">Connection Status</h4>
                        <p className="text-sm text-gray-500">
                            {status === 'AUTHENTICATED' || status === 'READY'
                                ? 'Connected and ready to send messages'
                                : 'Scan QR code to connect your WhatsApp'}
                        </p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${status === 'AUTHENTICATED' || status === 'READY'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {status === 'AUTHENTICATED' || status === 'READY' ? (
                            <><CheckCircle size={16} /> Connected</>
                        ) : (
                            <><AlertCircle size={16} /> {status}</>
                        )}
                    </div>
                </div>

                {/* QR Code Section */}
                {(status === 'QR_READY' || status === 'DISCONNECTED') && (
                    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        {qrCodeUrl ? (
                            <>
                                <img src={qrCodeUrl} alt="WhatsApp QR Code" className="w-64 h-64 border-4 border-white rounded-lg shadow-sm" />
                                <p className="mt-4 text-gray-600 text-sm font-medium animate-pulse">Scan with WhatsApp (Linked Devices)</p>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 mb-4">Client is initializing or disconnected...</p>
                                <div className="flex gap-2 justify-center">
                                    <button
                                        onClick={handleInit}
                                        disabled={loading}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {loading ? 'Initializing...' : 'Initialize Client'}
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        disabled={loading}
                                        className="px-6 py-2 bg-gray-100 text-red-600 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <RefreshCw size={16} /> Force Reset
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Connected Info */}
                {(status === 'AUTHENTICATED' || status === 'READY') && (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                            <h5 className="font-bold text-green-800 mb-1">Connected Device</h5>
                            {clientInfo ? (
                                <ul className="text-sm text-green-700 space-y-1">
                                    <li>User: {clientInfo.pushname || 'WhatsApp User'}</li>
                                    <li>Number: {clientInfo.wid?.user}</li>
                                    <li>Platform: {clientInfo.platform}</li>
                                </ul>
                            ) : (
                                <p className="text-sm text-green-600">Session Active</p>
                            )}
                        </div>

                        <button
                            onClick={handleReset}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all font-medium w-full justify-center"
                        >
                            <LogOut size={16} />
                            Disconnect & Reset
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default WhatsAppSettings;
