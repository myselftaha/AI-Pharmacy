import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Lock, 
    User, 
    Loader2, 
    Eye, 
    EyeOff, 
    Store, 
    Pill, 
    Stethoscope, 
    Activity, 
    ClipboardList,
    ShieldCheck
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import API_URL from '../config/api';

const LoginPage = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showToast('Login Successful', 'success');
                navigate('/');
            } else {
                showToast(data.message || 'Login failed', 'error');
            }
        } catch (err) {
            showToast('Network error: Could not connect to backend', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full font-sans">
            {/* Left Side - Dark Branding Area */}
            <div className="hidden lg:flex w-1/2 bg-[#0f172a] flex-col items-center justify-center relative overflow-hidden p-12">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 transform -rotate-12"><Pill size={120} /></div>
                    <div className="absolute bottom-20 right-20 transform rotate-45"><Stethoscope size={150} /></div>
                    <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2"><Activity size={100} /></div>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3 mb-16">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                            <span className="text-white font-bold text-2xl">i</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">MedKitPOS</h1>
                    </div>

                    {/* Illustration Composition */}
                    <div className="relative w-96 h-96">
                        {/* Isometric-style composition using CSS/Icons */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                                {/* Base Platform */}
                                <div className="w-64 h-32 bg-slate-800 rounded-2xl transform rotate-x-60 rotate-z-45 shadow-2xl border border-slate-700"></div>
                                
                                {/* Store Icon floating above */}
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[120%]">
                                    <Store size={120} className="text-green-500 drop-shadow-2xl" />
                                </div>

                                {/* Floating Elements */}
                                <div className="absolute top-0 right-0 transform -translate-y-20 translate-x-10 animate-bounce" style={{ animationDuration: '3s' }}>
                                    <div className="bg-white p-3 rounded-lg shadow-xl">
                                        <ClipboardList size={24} className="text-green-600" />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 transform translate-y-10 -translate-x-10 animate-bounce" style={{ animationDuration: '4s' }}>
                                    <div className="bg-white p-3 rounded-lg shadow-xl">
                                        <Pill size={24} className="text-green-600" />
                                    </div>
                                </div>
                                <div className="absolute top-1/2 left-0 transform -translate-x-16 -translate-y-10 animate-pulse">
                                    <div className="bg-slate-700 p-4 rounded-xl shadow-lg border border-slate-600">
                                        <ShieldCheck size={32} className="text-green-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center p-8">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                        <p className="text-gray-500 text-sm">Sign In</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-5">
                            <div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="username"
                                        required
                                        value={credentials.username}
                                        onChange={handleChange}
                                        className="w-full pl-4 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-700 placeholder-gray-400"
                                        placeholder="Username"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        value={credentials.password}
                                        onChange={handleChange}
                                        className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-700 placeholder-gray-400"
                                        placeholder="Password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    <span>Signing In...</span>
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        <div className="flex items-center justify-end">
                            <button type="button" className="text-sm font-medium text-green-600 hover:text-green-700">
                                Forgot Password?
                            </button>
                        </div>

                        <div className="pt-4 text-center">
                            <p className="text-sm text-gray-500">
                                Don't have an account?{' '}
                                <span className="text-green-600 font-medium cursor-pointer hover:underline">
                                    Sign up.
                                </span>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
