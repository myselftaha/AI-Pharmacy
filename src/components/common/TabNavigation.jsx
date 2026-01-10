import React from 'react';

const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide border-b border-gray-200">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all rounded-t-lg border-b-2 whitespace-nowrap
                            ${isActive
                                ? 'border-green-500 text-green-600 bg-green-50/50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }
                        `}
                    >
                        {Icon && <Icon size={18} className={isActive ? 'text-green-500' : 'text-gray-400'} />}
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
};

export default TabNavigation;
