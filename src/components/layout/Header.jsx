import React from 'react';
import { Search } from 'lucide-react';

const Header = ({ title, subtitle, action }) => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const username = user?.username || 'Guest';
    const role = user?.role || 'Guest';

    return (
        <div className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
            <div>
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    MedKitPOS <span className="text-sm font-normal text-gray-500">{subtitle}</span>
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

                {action}

                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold uppercase">
                        {username.charAt(0)}
                    </div>
                    <div className="text-sm">
                        <p className="font-semibold text-gray-900 capitalize">{username}</p>
                        <p className="text-gray-500">{role}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
