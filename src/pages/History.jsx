import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import TransactionTable from '../components/history/TransactionTable';
import TransactionDetailsModal from '../components/history/TransactionDetailsModal';
import SummaryBar from '../components/history/SummaryBar';
import FilterBar from '../components/history/FilterBar';
import VoidModal from '../components/history/VoidModal';
import ZReport from '../components/history/ZReport';
import BillModal from '../components/pos/BillModal';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

import { USER_ROLES } from '../config/roles';

const History = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Role Check
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isCounterSalesman = user?.role === USER_ROLES.COUNTER_SALESMAN;

    // Data State
    const [transactions, setTransactions] = useState([]);
    const [summaryStats, setSummaryStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('Today'); // Salesman always Today
    const [customDates, setCustomDates] = useState({ start: '', end: '' });
    const [filters, setFilters] = useState({
        paymentMethod: 'All',
        status: 'All',
        cashier: 'All',
        type: 'All',
        minAmount: '',
        maxAmount: ''
    });
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Modal State
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
    const [transactionToVoid, setTransactionToVoid] = useState(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [transactionToPrint, setTransactionToPrint] = useState(null);

    // Fetch Transactions
    const fetchTransactions = async (page = 1) => {
        try {
            setLoading(true);
            const { startDate, endDate } = getDateRange(dateFilter);

            const params = new URLSearchParams({
                page,
                limit: pagination.limit,
                searchQuery,
                range: dateFilter
            });

            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            if (filters.paymentMethod !== 'All') params.append('paymentMethod', filters.paymentMethod);
            if (filters.status !== 'All') params.append('status', filters.status);
            if (filters.cashier !== 'All') params.append('cashier', filters.cashier);
            if (filters.type !== 'All') params.append('type', filters.type);
            if (filters.minAmount) params.append('minAmount', filters.minAmount);
            if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/transactions?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch transactions');
            const data = await response.json();

            setTransactions(data.data || []);
            setPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 1 });

            const statsResponse = await fetch(`${API_URL}/api/transactions/stats/summary?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setSummaryStats(statsData);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Failed to load history data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getDateRange = (filter) => {
        const now = new Date();
        let startDate = null;
        let endDate = now.toISOString().split('T')[0];

        if (filter === 'Custom') return { startDate: customDates.start, endDate: customDates.end };

        if (filter === 'Today') {
            startDate = now.toISOString().split('T')[0];
        } else if (filter === 'Yesterday') {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            startDate = yesterday.toISOString().split('T')[0];
            endDate = yesterday.toISOString().split('T')[0];
        } else if (filter === 'Week') {
            const lastWeek = new Date(now);
            lastWeek.setDate(now.getDate() - 7);
            startDate = lastWeek.toISOString().split('T')[0];
        } else if (filter === 'Month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        }

        return { startDate, endDate };
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchTransactions(1);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, dateFilter, filters]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= (pagination?.pages || 1)) {
            fetchTransactions(newPage);
        }
    };

    const handleCustomDateApply = () => {
        if (customDates.start && customDates.end) {
            fetchTransactions(1);
        } else {
            showToast('Please select dates', 'warning');
        }
    };

    const handleExportExcel = async () => {
        // ... (existing export logic)
    };

    const handleZReport = () => {
        window.print();
    };

    const handleVoid = (transaction) => {
        setTransactionToVoid(transaction);
        setIsVoidModalOpen(true);
    };

    const handleConfirmVoid = async (transaction, reason) => {
        try {
            const response = await fetch(`${API_URL}/api/transactions/${transaction._id}/void`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ reason, voidedBy: 'Admin' })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to void');
            }

            showToast('Transaction voided successfully', 'success');
            fetchTransactions(pagination.page);
        } catch (error) {
            showToast(error.message, 'error');
            throw error;
        }
    };

    const handleReturn = (transaction) => {
        navigate('/return', { state: { returnTransaction: transaction } });
    };

    const handleDuplicate = (transaction) => {
        showToast('Duplicating order...', 'info');
    };

    const handlePrint = (transaction) => {
        setTransactionToPrint(transaction);
        setIsPrintModalOpen(true);
    };

    const handleActualPrint = () => {
        window.print();
        setIsPrintModalOpen(false);
    };

    return (
        <>
            <div className="p-6 max-w-[1600px] mx-auto print:hidden">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Sales History</h1>
                        <p className="text-sm text-gray-500">Manage and track all transactions</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search Bill, Invoice, Customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00c950] focus:ring-4 focus:ring-[#00c950]/5 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`flex-1 md:flex-none px-4 py-2 border rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${showAdvancedFilters
                                    ? 'bg-green-50 border-green-200 text-green-600'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <FilterBar.Icon size={18} />
                                Filters
                            </button>

                            <button
                                onClick={handleZReport}
                                className="flex-1 md:flex-none px-4 py-2 bg-[#00c950] text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-lg hover:shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Calendar size={18} />
                                Z-Report
                            </button>
                        </div>
                    </div>
                </div>

                <SummaryBar stats={summaryStats} onExport={handleExportExcel} loading={loading} />

                <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                        Showing {pagination.total || 0} transactions
                    </p>
                </div>

                {showAdvancedFilters && (
                    <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <FilterBar
                            filters={filters}
                            setFilters={setFilters}
                            onClose={() => setShowAdvancedFilters(false)}
                        />
                    </div>
                )}

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {['Today', 'Yesterday', 'Week', 'Month', 'Custom'].map((filter) => (
                                <button
                                    key={filter}
                                    disabled={isCounterSalesman && filter !== 'Today'}
                                    onClick={() => setDateFilter(filter)}
                                    className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${dateFilter === filter
                                        ? 'bg-[#00c950] text-white shadow-md shadow-green-200'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}

                            {dateFilter === 'Custom' && (
                                <div className="flex items-center gap-2 ml-2 p-1 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-left-2">
                                    <input
                                        type="date"
                                        value={customDates.start}
                                        onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
                                        className="bg-transparent px-2 py-1 text-sm outline-none font-medium"
                                    />
                                    <span className="text-gray-300">to</span>
                                    <input
                                        type="date"
                                        value={customDates.end}
                                        onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
                                        className="bg-transparent px-2 py-1 text-sm outline-none font-medium"
                                    />
                                    <button
                                        onClick={handleCustomDateApply}
                                        className="px-4 py-1.5 bg-white text-[#00c950] border border-green-100 rounded-lg text-xs font-bold hover:bg-green-50 transition-colors shadow-sm"
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="text-sm font-medium text-gray-400">
                            Filtered by: <span className="text-gray-900 font-bold">{dateFilter}</span>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    {loading && (
                        <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-xl min-h-[400px]">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 border-4 border-gray-100 border-t-[#00c950] rounded-full animate-spin"></div>
                                <p className="text-sm font-medium text-gray-500">Loading transactions...</p>
                            </div>
                        </div>
                    )}
                    <TransactionTable
                        transactions={transactions}
                        onViewDetails={(tx) => { setSelectedTransaction(tx); setIsDetailsModalOpen(true); }}
                        onVoid={handleVoid}
                        onReturn={handleReturn}
                        onDuplicate={handleDuplicate}
                        onPrint={handlePrint}
                    />
                </div>
            </div>

            <TransactionDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                transaction={selectedTransaction}
            />

            <VoidModal
                isOpen={isVoidModalOpen}
                onClose={() => setIsVoidModalOpen(false)}
                onConfirm={handleConfirmVoid}
                transaction={transactionToVoid}
            />

            <BillModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                onPrint={handleActualPrint}
                items={transactionToPrint?.items || []}
                total={transactionToPrint?.total || 0}
                discount={transactionToPrint?.discount || 0}
                customer={transactionToPrint?.customer}
                transactionId={transactionToPrint?.transactionId}
                billNumber={transactionToPrint?.billNumber}
                invoiceNumber={transactionToPrint?.invoiceNumber}
                paymentMethod={transactionToPrint?.paymentMethod}
            />

            <ZReport
                stats={summaryStats}
                dateFilter={dateFilter}
                customDates={customDates}
            />
        </>
    );
};

export default History;
