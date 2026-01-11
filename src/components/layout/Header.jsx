import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Mail, Settings, LogOut } from 'lucide-react';
import NotificationBell from '../common/NotificationBell';
import { useSettings } from '../../context/SettingsContext';

const Header = ({ title, subtitle, action }) => {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const username = user?.username || 'Guest';
    const role = user?.role || 'Guest';
    const { settings } = useSettings();

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

    const menuItems = [
        {
            icon: Mail,
            label: 'Email Reports',
            onClick: () => {
                navigate('/email-reports');
                setIsDropdownOpen(false);
            },
            color: 'text-green-600'
        },
        {
            icon: Settings,
            label: 'Settings',
            onClick: () => {
                navigate('/settings');
                setIsDropdownOpen(false);
            },
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
        <div className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-50">
            <div>
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {settings?.storeName || 'MedKitPOS'} <span className="text-sm font-normal text-gray-500">{subtitle}</span>
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                </div>

                <NotificationBell />

                {action}

                {/* Profile Dropdown */}
                <div className="relative pl-4 border-l border-gray-200" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold uppercase">
                            {username.charAt(0)}
                        </div>
                        <div className="text-sm text-left">
                            <p className="font-semibold text-gray-900 capitalize">{username}</p>
                            <p className="text-gray-500">{role}</p>
                        </div>
                        <ChevronDown
                            size={16}
                            className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                            {menuItems.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <React.Fragment key={item.label}>
                                        <button
                                            onClick={item.onClick}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <Icon size={18} className={item.color} />
                                            <span className={`font-medium ${item.color}`}>{item.label}</span>
                                        </button>
                                        {index < menuItems.length - 1 && (
                                            <div className="border-t border-gray-100 my-1" />
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
