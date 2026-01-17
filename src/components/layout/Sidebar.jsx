import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    ShoppingBag,
    Clock,
    Package,
    LogOut,
    Ticket,
    Truck,
    UserCheck,
    Contact,
    ShieldCheck,
    LayoutGrid,
    ClipboardList,
    RotateCcw,
    DollarSign,
    FileText,
    Wallet,
    Calendar,
    Settings as SettingsIcon
} from 'lucide-react';
import clsx from 'clsx';
import { useSettings } from '../../context/SettingsContext';

import { USER_ROLES } from '../../config/roles';

// Static configuration defined outside component to prevent re-creation
const NAV_SECTIONS = [
    {
        section: 'MAIN MENU',
        items: [
            {
                icon: LayoutGrid,
                label: 'Dashboard',
                path: '/dashboard',
                allowedRoles: [USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
            },
            {
                icon: ShoppingBag,
                label: 'Sales',
                path: '/pos',
                allowedRoles: [USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.COUNTER_SALESMAN, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
            },
            {
                icon: UserCheck,
                label: 'Customers',
                path: '/customers',
                allowedRoles: [USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.COUNTER_SALESMAN, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
            },
            {
                icon: Clock,
                label: 'History',
                path: '/history',
                allowedRoles: [USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.COUNTER_SALESMAN, USER_ROLES.ACCOUNTANT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
            },
            {
                icon: Truck,
                label: 'Distributors',
                path: '/suppliers',
                allowedRoles: [USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.ACCOUNTANT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
            },
            {
                icon: Package,
                label: 'Medicines',
                path: '/medicines',
                allowedRoles: [USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
            },
            {
                icon: ClipboardList,
                label: 'Inventory',
                path: '/inventory',
                allowedRoles: [USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.HELPER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
            },
            {
                icon: RotateCcw,
                label: 'Returns',
                path: '/return',
                allowedRoles: [USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
            },
            {
                icon: Calendar,
                label: 'Expiry',
                path: '/expiry',
                allowedRoles: [USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
            },
        ]
    },
    {
        section: 'GENERAL',
        items: [
            {
                icon: Contact,
                label: 'Staff',
                path: '/staff',
                allowedRoles: [USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
            },
            {
                icon: ShieldCheck,
                label: 'Users',
                path: '/users',
                allowedRoles: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
            },
            {
                icon: Ticket,
                label: 'Vouchers',
                path: '/vouchers',
                allowedRoles: [USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.ACCOUNTANT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
            },
            {
                icon: Wallet,
                label: 'Cash Drawer',
                path: '/cash-drawer',
                allowedRoles: [USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.ACCOUNTANT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
            },
            {
                icon: FileText,
                label: 'Reports',
                path: '/reports',
                allowedRoles: [USER_ROLES.OWNER, USER_ROLES.ACCOUNTANT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
            },
            {
                icon: SettingsIcon,
                label: 'Settings',
                path: '/settings',
                allowedRoles: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
            },
        ]
    }
];

const SidebarItem = React.memo(({ item, isHovered, role }) => {
    const isAdmin = role === 'Admin' || role === 'Super Admin';
    if (item.requiresAdmin && !isAdmin) return null;
    if (item.allowedRoles && !item.allowedRoles.includes(role)) return null;

    return (
        <NavLink
            to={item.path}
            className={({ isActive }) => clsx(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive
                    ? "bg-green-500/10 text-green-500 shadow-sm"
                    : "hover:bg-white/5 hover:text-white"
            )}
        >
            <item.icon size={24} className={clsx("flex-shrink-0 transition-transform duration-200", isHovered ? "" : "group-hover:scale-110")} />

            <span
                className={clsx(
                    "font-medium whitespace-nowrap transition-all duration-300 origin-left",
                    isHovered ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-2 w-0 overflow-hidden"
                )}
            >
                {item.label}
            </span>

            {/* Tooltip for collapsed state */}
            {!isHovered && (
                <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 font-semibold shadow-xl border border-gray-700">
                    {item.label}
                </div>
            )}
        </NavLink>
    );
});

const Sidebar = ({ isHoveredExternally, onHoverChange }) => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const [isInternalHover, setIsInternalHover] = useState(false);

    // Determine hover state based on props or internal state
    const isHovered = isHoveredExternally !== undefined ? isHoveredExternally : isInternalHover;

    const userStr = localStorage.getItem('user');
    const user = useMemo(() => userStr ? JSON.parse(userStr) : null, [userStr]);
    const role = user?.role;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleMouseEnter = () => {
        if (onHoverChange) {
            onHoverChange(true);
        } else {
            setIsInternalHover(true);
        }
    };

    const handleMouseLeave = () => {
        if (onHoverChange) {
            onHoverChange(false);
        } else {
            setIsInternalHover(false);
        }
    };

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ willChange: 'width' }}
            className={clsx(
                "h-screen bg-[#1a1f2c] text-gray-300 flex flex-col fixed left-0 top-0 overflow-hidden z-50 shadow-2xl border-r border-gray-800 transition-all duration-300 ease-in-out",
                isHovered ? "w-64" : "w-20"
            )}
        >
            {/* Logo Section */}
            <div className="p-4 py-6 flex items-center gap-3 overflow-hidden">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-green-500/20 overflow-hidden">
                    {settings?.storeLogo ? (
                        <img src={settings.storeLogo} alt="Logo" className="w-full h-full object-contain bg-white" />
                    ) : (
                        <span>{settings?.storeName?.charAt(0) || 'i'}</span>
                    )}
                </div>
                <h1
                    className={clsx(
                        "text-xl font-bold text-white whitespace-nowrap transition-all duration-300 origin-left",
                        isHovered ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-4 w-0"
                    )}
                >
                    {settings?.storeName || 'MedKitPOS'}
                </h1>
            </div>

            {/* Navigation Section */}
            <div className="flex-1 px-3 overflow-y-auto scrollbar-hide py-2">
                {NAV_SECTIONS.map((section, idx) => (
                    <div key={idx} className="mb-8">
                        <h2
                            className={clsx(
                                "text-[10px] font-bold text-gray-500 mb-3 px-3 uppercase tracking-widest whitespace-nowrap transition-all duration-300",
                                isHovered ? "opacity-100" : "opacity-0"
                            )}
                        >
                            {section.section}
                        </h2>
                        <div className="space-y-1.5">
                            {section.items.map((item) => (
                                <SidebarItem
                                    key={item.path}
                                    item={item}
                                    isHovered={isHovered}
                                    role={role}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Logout Section */}
            <div className="p-3 border-t border-gray-800/50 bg-[#1a1f2c]">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 px-4 py-4 text-red-500 hover:bg-red-500/10 w-full rounded-xl transition-all duration-200 group relative overflow-hidden"
                >
                    <LogOut size={24} className="flex-shrink-0 group-hover:rotate-12 transition-transform" />
                    <span
                        className={clsx(
                            "font-bold whitespace-nowrap text-sm tracking-wide uppercase transition-all duration-300 origin-left",
                            isHovered ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-2 w-0 overflow-hidden"
                        )}
                    >
                        Log out
                    </span>
                    {!isHovered && (
                        <div className="absolute left-16 bg-red-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 font-bold shadow-xl">
                            Log out
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
