import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet, useLocation } from 'react-router-dom';

const MainLayout = ({ action }) => {
    const location = useLocation();
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);

    const getPageTitle = (pathname) => {
        switch (pathname) {
            case '/pos': return { title: 'POS Terminal', subtitle: 'Sales & Inventory' };
            case '/history': return { title: 'Sales History', subtitle: 'Sales History' };
            case '/medicines': return { title: 'Medicines Management', subtitle: 'Manage drugs and batches' };
            case '/suppliers': return { title: 'Distributor Management', subtitle: 'Manage wholesalers & suppliers' };
            case '/expenses': return { title: 'Expense Management', subtitle: 'Track Shop Expenses' };
            case '/reports': return { title: 'Profit & Loss Report', subtitle: 'Financial Overview' };
            case '/users': return { title: 'User Management', subtitle: 'User Management' };
            case '/customers': return { title: 'Customer Management', subtitle: 'Customer Management' };
            case '/vouchers': return { title: 'Voucher Management', subtitle: 'Voucher Management' };
            default: return { title: 'Dashboard', subtitle: 'Dashboard' };
        }
    };

    const { title, subtitle } = getPageTitle(location.pathname);

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            <Sidebar
                isHoveredExternally={isSidebarHovered}
                onHoverChange={setIsSidebarHovered}
            />

            <div
                style={{ willChange: 'margin-left' }}
                className={`flex-1 flex flex-col max-h-screen overflow-hidden transition-all duration-300 ease-in-out ${isSidebarHovered ? 'ml-64' : 'ml-20'}`}
            >
                <Header title={title} subtitle={subtitle} action={action} />
                <main className="p-8 flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
