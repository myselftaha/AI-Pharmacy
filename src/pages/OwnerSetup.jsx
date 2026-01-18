import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import API_URL from '../config/api';


const OwnerSetup = ({ onComplete }) => {
    const [formData, setFormData] = useState({
        ownerName: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const response = await fetch(`${API_URL}/api/system/status`);
            const data = await response.json();
            if (data.isSetupCompleted) {
                navigate('/login');
            }
        } catch (err) {
            console.error('Status check failed', err);
        } finally {
            setChecking(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/system/setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ownerName: formData.ownerName,
                    username: formData.username,
                    password: formData.password
                })
            });
            const data = await response.json();

            if (response.ok) {
                showToast('System setup successful! Please login.', 'success');
                if (onComplete) onComplete();
                navigate('/login');
            } else {
                showToast(data.message || 'Setup failed', 'error');
            }
        } catch (err) {
            showToast('Network error: Could not connect to server', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <Loader2 className="animate-spin text-green-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-green-600 p-8 text-center text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">System Owner Setup</h1>
                    <p className="text-green-100 text-sm mt-1">One-time initial configuration for MedKit POS</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Owner Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="ownerName"
                                    required
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    placeholder="e.g. Admin"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Owner Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    placeholder="Enter username (e.g. admin)"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Complete Setup & Lock System'}
                    </button>

                    <p className="text-[10px] text-gray-400 text-center uppercase font-bold tracking-widest mt-4">
                        Secure Installation Mode
                    </p>
                </form>
            </div>
        </div>
    );
};

export default OwnerSetup;
