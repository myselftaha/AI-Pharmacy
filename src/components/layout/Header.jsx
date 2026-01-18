import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Mail, Settings, LogOut, Bell } from 'lucide-react';
import NotificationBell from '../common/NotificationBell';
import { useSettings } from '../../context/SettingsContext';

const Header = ({ action }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // User Info
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const username = user?.username || 'Guest';
    const role = user?.role || 'Guest';

    // Context
    const { settings, checkStoreStatus } = useSettings();
    const storeStatus = checkStoreStatus ? checkStoreStatus() : { isOpen: false, status: 'Closed' };

    // Dropdown State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Static Title
    const currentTitle = "Pharmacy POS";

    const menuItems = [
        {
            icon: Mail,
            label: 'Email Reports',
            onClick: () => { navigate('/email-reports'); setIsDropdownOpen(false); },
            color: 'text-green-600'
        },
        {
            icon: Settings,
            label: 'Settings',
            onClick: () => { navigate('/settings'); setIsDropdownOpen(false); },
            color: 'text-gray-600'
        },
        {
            icon: LogOut,
            label: 'Logout',
            onClick: handleLogout,
            color: 'text-red-600'
        }
    ];

    return (
        <div className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200/80 flex items-center justify-between px-8 sticky top-0 z-50 transition-all duration-300">
            {/* Left: Page Title & status */}
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
                    {currentTitle}
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${storeStatus.isOpen ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                        {storeStatus.status}
                    </span>
                </h1>
                <p className="text-xs text-gray-400 font-medium mt-0.5 ml-0.5">
                    {settings?.storeName || 'MedKit Pharmacy'}
                </p>
            </div>

            {/* Right: Actions, Notifications, Profile */}
            <div className="flex items-center gap-6">

                {/* Custom Action (if any) */}
                {action}

                <div className="h-8 w-px bg-gray-200 mx-2"></div>

                <NotificationBell />

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 group px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200"
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center text-green-700 font-bold shadow-sm group-hover:shadow-md transition-all">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="font-semibold text-gray-800 text-sm leading-tight capitalize">{username}</p>
                            <p className="text-xs text-gray-500 font-medium">{role}</p>
                        </div>
                        <ChevronDown
                            size={16}
                            className={`text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Account</p>
                            </div>

                            {menuItems.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <React.Fragment key={item.label}>
                                        <button
                                            onClick={item.onClick}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                                        >
                                            <div className={`p-2 rounded-lg bg-gray-50 group-hover:bg-white transition-colors ${item.color.replace('text-', 'text-opacity-80 ')}`}>
                                                <Icon size={18} className={item.color} />
                                            </div>
                                            <span className={`font-medium text-sm text-gray-700 group-hover:text-gray-900`}>{item.label}</span>
                                        </button>
                                        {index < menuItems.length - 1 && (
                                            <div className="border-t border-gray-50 mx-4" />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Header;
