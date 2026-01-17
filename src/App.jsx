import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import History from './pages/History';
import Medicines from './pages/Medicines';
import Suppliers from './pages/Suppliers';
import Inventory from './pages/Inventory';
import SupplierDetails from './pages/SupplierDetails';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import API_URL from './config/api';

import Users from './pages/Users';
import Customers from './pages/Customers';
import Vouchers from './pages/Vouchers';
import Return from './pages/Return';
import Report from './pages/Report';
import Staff from './pages/Staff';
import CashDrawer from './pages/CashDrawer';
import OwnerSetup from './pages/OwnerSetup';
import LoaderDemo from './pages/LoaderDemo';
import ExpiryManagement from './pages/ExpiryManagement';
import Loader from './components/common/Loader';
import { ToastProvider } from './context/ToastContext';
import { USER_ROLES } from './config/roles';

import SyncManager from './components/common/SyncManager';
import { SettingsProvider } from './context/SettingsContext';
import Settings from './pages/Settings';
import { NotificationProvider } from './context/NotificationContext';
import Notifications from './pages/Notifications';
import EmailReports from './pages/EmailReports';

function App() {
  const [setupStatus, setSetupStatus] = useState({ isSetupCompleted: false, loading: true });

  useEffect(() => {
    const checkSetup = async () => {
      try {
        console.log('Checking system setup status...');
        const response = await fetch(`${API_URL}/api/system/status`);
        const data = await response.json();
        console.log('Setup status received:', data);
        setSetupStatus({ isSetupCompleted: data.isSetupCompleted, loading: false });
      } catch (err) {
        console.error('Failed to check setup status', err);
        setSetupStatus({ isSetupCompleted: true, loading: false });
      }
    };
    checkSetup();
  }, []);


  const isSetup = setupStatus.isSetupCompleted;

  if (setupStatus.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader type="spinner" size="lg" />
      </div>
    );
  }



  // ... imports remain same ...

  const RootRedirect = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) return <Navigate to="/login" replace />;

    switch (user.role) {
      case USER_ROLES.OWNER:
      case USER_ROLES.STORE_MANAGER:
      case USER_ROLES.ADMIN:
      case USER_ROLES.SUPER_ADMIN:
        return <Navigate to="/dashboard" replace />;

      case USER_ROLES.PHARMACIST:
        return <Navigate to="/medicines" replace />; // Focus on stock

      case USER_ROLES.COUNTER_SALESMAN:
        return <Navigate to="/pos" replace />;

      case USER_ROLES.ACCOUNTANT:
        return <Navigate to="/reports" replace />;

      case USER_ROLES.HELPER:
        return <Navigate to="/inventory" replace />;

      default:
        return <Navigate to="/pos" replace />;
    }
  };

  return (
    <ToastProvider>
      <SettingsProvider>
        <SyncManager>
          <NotificationProvider>
            <Router>
              <Routes>
                {/* Setup & Login - Mutual Exclusivity based on setup status */}
                <Route
                  path="/setup"
                  element={isSetup ? <Navigate to="/login" replace /> : <OwnerSetup onComplete={() => setSetupStatus({ isSetupCompleted: true, loading: false })} />}
                />
                <Route
                  path="/login"
                  element={!isSetup ? <Navigate to="/setup" replace /> : <LoginPage />}
                />

                {/* Protected Routes - Only accessible if setup is completed */}
                <Route element={!isSetup ? <Navigate to="/setup" replace /> : <ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<RootRedirect />} />

                    {/* Dashboard: Owner, Manager */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="dashboard" element={<Dashboard />} />
                    </Route>

                    {/* Sales/POS: Owner, Manager, Pharmacist, Counter Salesman */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.COUNTER_SALESMAN, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="pos" element={<Home />} />
                      <Route path="customers" element={<Customers />} />
                    </Route>

                    {/* Admin/Owner Restricted Routes */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="users" element={<Users />} />
                      <Route path="loaders" element={<LoaderDemo />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="email-reports" element={<EmailReports />} />
                    </Route>

                    {/* Staff: Owner, Manager */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="staff" element={<Staff />} />
                    </Route>

                    {/* Financial/Reports: Owner, Accountant */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.ACCOUNTANT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="reports" element={<Report />} />
                    </Route>

                    {/* Vouchers, Cash Drawer: Owner, Manager, Accountant */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.ACCOUNTANT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="vouchers" element={<Vouchers />} />
                      <Route path="cash-drawer" element={<CashDrawer />} />
                    </Route>

                    {/* Inventory/Medicines: Owner, Manager, Pharmacist */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="medicines" element={<Medicines />} />
                      <Route path="return" element={<Return />} />
                      <Route path="expiry" element={<ExpiryManagement />} />
                    </Route>

                    {/* Inventory View: Owner, Manager, Pharmacist, Helper */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.HELPER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="inventory" element={<Inventory />} />
                    </Route>

                    {/* Distributors: Owner, Manager, Accountant */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.ACCOUNTANT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="suppliers" element={<Suppliers />} />
                      <Route path="suppliers/:id" element={<SupplierDetails />} />
                    </Route>

                    {/* History: Owner, Manager, Pharmacist, Salesman (Limited), Accountant */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.COUNTER_SALESMAN, USER_ROLES.ACCOUNTANT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="history" element={<History />} />
                    </Route>

                    {/* Notifications: Accessible to all authorized roles */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.COUNTER_SALESMAN, USER_ROLES.ACCOUNTANT, USER_ROLES.HELPER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="notifications" element={<Notifications />} />
                    </Route>

                  </Route>
                </Route>
                {/* Global Catch-all */}
                <Route path="*" element={<Navigate to={isSetup ? "/" : "/setup"} replace />} />
              </Routes>
            </Router>
          </NotificationProvider>
        </SyncManager>
      </SettingsProvider>
    </ToastProvider>
  );
}

export default App;
