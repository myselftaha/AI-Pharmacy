import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
    Mail, Send, TrendingUp, AlertTriangle, Calendar, Package,
    FileText, RotateCcw, CheckCircle, XCircle, Loader, ChevronLeft
} from 'lucide-react';

const EmailReports = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [customEmail, setCustomEmail] = useState('');
    const [sendingStates, setSendingStates] = useState({});
    const [lastSent, setLastSent] = useState({});

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    // Report types configuration
    const reports = [
        {
            id: 'daily-summary',
            title: 'Daily Sales Summary',
            description: 'Complete sales report with revenue, top products, and payment breakdown',
            icon: TrendingUp,
            color: 'green',
            endpoint: '/api/email/send-daily-summary',
            gradient: 'from-green-500 to-emerald-600'
        },
        {
            id: 'low-stock',
            title: 'Low Stock Alert',
            description: 'Medicines running low in inventory that need reordering',
            icon: AlertTriangle,
            color: 'red',
            endpoint: '/api/email/send-low-stock-alert',
            gradient: 'from-red-500 to-rose-600'
        },
        {
            id: 'expiry-alert',
            title: 'Expiry Alert',
            description: 'Medicines expiring soon within the configured timeframe',
            icon: Calendar,
            color: 'orange',
            endpoint: '/api/email/send-expiry-alert',
            gradient: 'from-orange-500 to-amber-600'
        },
        {
            id: 'inventory',
            title: 'Full Inventory Report',
            description: 'Complete inventory status with stock levels and valuations',
            icon: Package,
            color: 'blue',
            endpoint: '/api/email/send-inventory-report',
            gradient: 'from-blue-500 to-indigo-600'
        },
        {
            id: 'returns',
            title: 'Returns Report',
            description: 'Summary of all product returns and refunds',
            icon: RotateCcw,
            color: 'purple',
            endpoint: '/api/email/send-returns-report',
            gradient: 'from-purple-500 to-violet-600'
        },
        {
            id: 'transactions',
            title: 'Transaction History',
            description: 'Detailed transaction log for a specified period',
            icon: FileText,
            color: 'cyan',
            endpoint: '/api/email/send-transaction-history',
            gradient: 'from-cyan-500 to-teal-600'
        }
    ];

    const handleSendEmail = async (report) => {
        const emailToSend = customEmail.trim() || undefined;

        // Validate custom email if provided
        if (customEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customEmail.trim())) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        setSendingStates(prev => ({ ...prev, [report.id]: true }));

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(report.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ customEmail: emailToSend })
            });

            const data = await response.json();

            if (data.success) {
                showToast(data.message || 'Email sent successfully!', 'success');
                setLastSent(prev => ({ ...prev, [report.id]: new Date().toLocaleTimeString() }));
            } else {
                if (data.reason === 'disabled') {
                    showToast('This notification type is disabled in Settings', 'error');
                } else if (data.count === 0) {
                    showToast(data.message || 'No data to send', 'info');
                } else {
                    showToast(data.message || 'Failed to send email', 'error');
                }
            }
        } catch (err) {
            console.error('Email send error:', err);
            showToast('Error sending email. Please try again.', 'error');
        } finally {
            setSendingStates(prev => ({ ...prev, [report.id]: false }));
        }
    };

    const getColorClasses = (color) => {
        const colors = {
            green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', icon: 'bg-green-100' },
            red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: 'bg-red-100' },
            orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', icon: 'bg-orange-100' },
            blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: 'bg-blue-100' },
            purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', icon: 'bg-purple-100' },
            cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', icon: 'bg-cyan-100' }
        };
        return colors[color] || colors.green;
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
                        <Mail className="text-green-500" size={32} />
                        Email Reports Center
                    </h2>
                    <p className="text-sm text-gray-500">Send professional reports directly to your email</p>
                </div>
            </div>

            {/* Custom Email Input */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Custom Email Address (Optional)
                        </label>
                        <input
                            type="email"
                            value={customEmail}
                            onChange={(e) => setCustomEmail(e.target.value)}
                            placeholder={`Leave empty to send to default email from Settings`}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Enter a different email address to override the default recipient
                        </p>
                    </div>
                    {customEmail && (
                        <button
                            onClick={() => setCustomEmail('')}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors self-end mb-6"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Reports Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                    {reports.map(report => {
                        const Icon = report.icon;
                        const colors = getColorClasses(report.color);
                        const isSending = sendingStates[report.id];
                        const lastSentTime = lastSent[report.id];

                        return (
                            <div
                                key={report.id}
                                className={`bg-white rounded-xl shadow-sm border-2 ${colors.border} hover:shadow-lg transition-all duration-300 overflow-hidden group`}
                            >
                                {/* Card Header with Gradient */}
                                <div className={`bg-gradient-to-r ${report.gradient} p-6 text-white`}>
                                    <div className="flex items-start justify-between">
                                        <div className={`${colors.icon} p-3 rounded-xl shadow-lg`}>
                                            <Icon size={28} className="text-white" />
                                        </div>
                                        {lastSentTime && (
                                            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-xs">
                                                <CheckCircle size={12} />
                                                <span>{lastSentTime}</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold mt-4">{report.title}</h3>
                                </div>

                                {/* Card Body */}
                                <div className="p-6">
                                    <p className="text-gray-600 text-sm mb-6 min-h-[40px]">
                                        {report.description}
                                    </p>

                                    {/* Send Button */}
                                    <button
                                        onClick={() => handleSendEmail(report)}
                                        disabled={isSending}
                                        className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r ${report.gradient} text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                                    >
                                        {isSending ? (
                                            <>
                                                <Loader size={18} className="animate-spin" />
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                <span>Send Email</span>
                                            </>
                                        )}
                                    </button>

                                    {customEmail && (
                                        <p className="text-xs text-gray-500 mt-2 text-center">
                                            Will send to: <span className="font-semibold">{customEmail}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <Mail className="text-blue-600" size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-1">Email Settings</h4>
                        <p className="text-sm text-blue-700">
                            Make sure your notification toggles are enabled in <strong>Settings → Notifications</strong> for emails to be sent.
                            Reports will be sent from the configured Gmail account.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailReports;
