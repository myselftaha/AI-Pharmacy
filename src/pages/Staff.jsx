import React, { useState, useEffect } from 'react';
import {
    Users, UserCheck, Briefcase, DollarSign, Shield,
    Search, Download, Plus, Phone, Mail, MapPin, Calendar,
    MoreVertical, Edit, Trash2, X, Check, History
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import API_URL from '../config/api';
import { useToast } from '../context/ToastContext';

const Staff = () => {
    const { showToast } = useToast();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All Roles');
    const [shiftFilter, setShiftFilter] = useState('All Shifts');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSalaryModal, setShowSalaryModal] = useState(false);
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);

    const [salaryData, setSalaryData] = useState({
        periodStart: '',
        periodEnd: '',
        paidDays: 30,
        unpaidDays: 0,
        paymentMethod: 'Cash'
    });

    const [advanceData, setAdvanceData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
    });

    const [formData, setFormData] = useState({
        name: '',
        fatherName: '',
        cnic: '',
        phone: '',
        email: '',
        address: '',
        city: 'Lahore',
        role: 'Counter Salesman',
        employmentType: 'Permanent',
        shift: 'Morning',
        baseSalary: '',
        joiningDate: new Date().toISOString().split('T')[0],
        emergencyContactName: '',
        emergencyContactPhone: '',
        status: 'Active'
    });

    const ROLES = [
        'Owner',
        'Pharmacist',
        'Counter Salesman',
        'Store Manager',
        'Accountant',
        'Helper / Peon'
    ];

    const SHIFTS = ['Morning (8 AM - 4 PM)', 'Evening (4 PM - 12 AM)', 'Night (12 AM - 8 AM)', 'Full Day'];
    const EMPLOYMENT_TYPES = ['Permanent', 'Contract', 'Part-time'];
    const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/staff`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaff(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            showToast('Failed to fetch staff', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async () => {
        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                salaryType: 'Monthly',
                salaryCycle: 'Monthly',
                paymentMethod: 'Cash'
            };

            if (isEditing && selectedStaff) {
                await axios.put(`${API_URL}/api/staff/${selectedStaff._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showToast('Staff member updated successfully!', 'success');
            } else {
                await axios.post(`${API_URL}/api/staff`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showToast('Staff member added successfully!', 'success');
            }

            setShowAddModal(false);
            resetForm();
            fetchStaff();
        } catch (error) {
            showToast(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} staff`, 'error');
        }
    };

    const handleDeleteStaff = async () => {
        if (!selectedStaff) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/staff/${selectedStaff._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Staff member deleted successfully', 'success');
            setShowDeleteModal(false);
            fetchStaff();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to delete staff', 'error');
        }
    };

    const handlePaySalary = async () => {
        if (!selectedStaff) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/staff/${selectedStaff._id}/payments`, salaryData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Salary payment recorded successfully', 'success');
            setShowSalaryModal(false);
            fetchStaff();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to record salary payment', 'error');
        }
    };

    const handleAddAdvance = async () => {
        if (!selectedStaff) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/staff/${selectedStaff._id}/advances`, advanceData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Salary advance recorded successfully', 'success');
            setShowAdvanceModal(false);
            fetchStaff();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to record salary advance', 'error');
        }
    };

    const fetchPaymentHistory = async (staffId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/staff/${staffId}/payments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPaymentHistory(Array.isArray(response.data) ? response.data : []);
            setShowHistoryModal(true);
        } catch (error) {
            showToast('Failed to fetch payment history', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            fatherName: '',
            cnic: '',
            phone: '',
            email: '',
            address: '',
            city: 'Lahore',
            role: 'Counter Salesman',
            employmentType: 'Permanent',
            shift: 'Morning',
            baseSalary: '',
            joiningDate: new Date().toISOString().split('T')[0],
            emergencyContactName: '',
            emergencyContactPhone: '',
            status: 'Active'
        });
        setIsEditing(false);
        setSelectedStaff(null);
    };

    const openEditModal = (member) => {
        setSelectedStaff(member);
        setFormData({
            name: member.name || '',
            fatherName: member.fatherName || '',
            cnic: member.cnic || '',
            phone: member.phone || '',
            email: member.email || '',
            address: member.address || '',
            city: member.city || 'Lahore',
            role: member.role || 'Counter Salesman',
            employmentType: member.employmentType || 'Permanent',
            shift: member.shift || 'Morning',
            baseSalary: member.baseSalary || '',
            joiningDate: member.joiningDate ? new Date(member.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            emergencyContactName: member.emergencyContactName || '',
            emergencyContactPhone: member.emergencyContactPhone || '',
            status: member.status || 'Active'
        });
        setIsEditing(true);
        setShowAddModal(true);
        setActiveDropdown(null);
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            'Owner': 'bg-cyan-100 text-cyan-700 border-cyan-200',
            'Pharmacist': 'bg-blue-100 text-blue-700 border-blue-200',
            'Counter Salesman': 'bg-purple-100 text-purple-700 border-purple-200',
            'Store Manager': 'bg-indigo-100 text-indigo-700 border-indigo-200',
            'Accountant': 'bg-orange-100 text-orange-700 border-orange-200',
            'Helper / Peon': 'bg-green-100 text-green-700 border-green-200'
        };
        return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const getShiftDisplay = (shift) => {
        if (!shift) return 'Full Day';
        if (shift.includes('Morning')) return 'Morning';
        if (shift.includes('Evening')) return 'Evening';
        if (shift.includes('Night')) return 'Night';
        return 'Full Day';
    };

    const [showExportMenu, setShowExportMenu] = useState(false);

    // ... existing init ...

    // Export Functions
    const downloadCSV = () => {
        const headers = ['Name', 'Role', 'Phone', 'Email', 'City', 'Shift', 'Status', 'Salary'];
        const data = filteredStaff.map(member => [
            member.name,
            member.role,
            member.phone,
            member.email,
            member.city,
            member.shift || 'Full Day',
            member.status,
            member.baseSalary
        ]);

        const csvContent = [
            headers.join(','),
            ...data.map(row => row.map(cell => `"${cell || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'staff_list.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportMenu(false);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Staff List', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        const tableColumn = ["Name", "Role", "Phone", "Shift", "Status", "Salary"];
        const tableRows = filteredStaff.map(member => [
            member.name,
            member.role,
            member.phone,
            member.shift || 'Full Day',
            member.status,
            member.baseSalary
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [22, 163, 74] }, // green-600
            alternateRowStyles: { fillColor: [240, 253, 244] } // green-50
        });

        doc.save('staff_list.pdf');
        setShowExportMenu(false);
    };

    const getInitials = (name) => {
        const parts = name.split(' ');
        return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0] + (parts[0][1] || '');
    };

    // Filter staff
    const filteredStaff = (Array.isArray(staff) ? staff : []).filter(member => {
        const matchesSearch = searchQuery === '' ||
            member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.cnic?.includes(searchQuery) ||
            member.phone?.includes(searchQuery) ||
            member.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === 'All Roles' || member.role === roleFilter;
        const matchesShift = shiftFilter === 'All Shifts' || getShiftDisplay(member.shift) === shiftFilter;
        const matchesStatus = statusFilter === 'All Status' || member.status === statusFilter;

        return matchesSearch && matchesRole && matchesShift && matchesStatus;
    });

    // Calculate statistics
    const safeStaff = Array.isArray(staff) ? staff : [];
    const stats = {
        total: safeStaff.length,
        active: safeStaff.filter(s => s.status === 'Active').length,
        inactive: safeStaff.filter(s => s.status === 'Deactivated').length,
        pharmacists: safeStaff.filter(s => s.role === 'Pharmacist').length,
        totalSalary: safeStaff.filter(s => s.status === 'Active').reduce((sum, s) => sum + (s.baseSalary || 0), 0),
        roles: [...new Set(safeStaff.map(s => s.role))].length
    };

    // Role Permissions Data
    const ROLE_PERMISSIONS = [
        {
            role: 'Owner',
            badgeColor: 'bg-green-100 text-green-700 border-green-200', // Green as per image
            permissions: [
                { label: 'Full system access', allowed: true },
                { label: 'Manage staff & roles', allowed: true },
                { label: 'View all reports', allowed: true },
                { label: 'Settings & configuration', allowed: true },
                { label: 'Financial management', allowed: true }
            ]
        },
        {
            role: 'Pharmacist',
            badgeColor: 'bg-teal-50 text-teal-700 border-teal-200', // Light Blue/Teal as per image
            permissions: [
                { label: 'POS & billing', allowed: true },
                { label: 'Inventory management', allowed: true },
                { label: 'Prescription verification', allowed: true },
                { label: 'Controlled medicines', allowed: true },
                { label: 'Basic reports', allowed: true }
            ]
        },
        {
            role: 'Counter Salesman',
            badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
            permissions: [
                { label: 'POS & billing only', allowed: true },
                { label: 'View medicine stock', allowed: true },
                { label: 'No inventory edits', allowed: false },
                { label: 'No controlled medicines', allowed: false },
                { label: 'No reports access', allowed: false }
            ]
        },
        {
            role: 'Store Manager',
            badgeColor: 'bg-teal-100 text-teal-700 border-teal-200', // Stronger Teal
            permissions: [
                { label: 'POS & billing', allowed: true },
                { label: 'Inventory management', allowed: true },
                { label: 'Staff management', allowed: true },
                { label: 'Distributor management', allowed: true },
                { label: 'Most reports', allowed: true }
            ]
        },
        {
            role: 'Accountant',
            badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
            permissions: [
                { label: 'Financial reports', allowed: true },
                { label: 'Distributor ledgers', allowed: true },
                { label: 'GST & tax reports', allowed: true },
                { label: 'Salary management', allowed: true },
                { label: 'No POS access', allowed: false }
            ]
        },
        {
            role: 'Helper / Peon',
            badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
            permissions: [
                { label: 'Stock checking', allowed: true },
                { label: 'Medicine delivery', allowed: true },
                { label: 'No billing access', allowed: false },
                { label: 'No system access', allowed: false },
                { label: 'No reports', allowed: false }
            ]
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
                    <p className="text-gray-600 mt-1">Manage pharmacy employees, shifts, and salaries</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Download size={18} />
                            Export
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1">
                                <button
                                    onClick={downloadCSV}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600"
                                >
                                    Export as CSV
                                </button>
                                <button
                                    onClick={downloadPDF}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600"
                                >
                                    Export as PDF
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 flex items-center gap-2 shadow-lg shadow-green-500/20"
                    >
                        <Plus size={18} />
                        Add Staff
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-5 gap-4 mb-8">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-600 text-sm mb-1">Total Staff</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <Users className="text-green-500" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-600 text-sm mb-1">Active Staff</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.active}</h3>
                            <p className="text-xs text-gray-500 mt-1">{stats.inactive} inactive</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <UserCheck className="text-green-500" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-600 text-sm mb-1">Pharmacists</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.pharmacists}</h3>
                            <p className="text-xs text-gray-500 mt-1">Licensed</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Briefcase className="text-blue-500" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-600 text-sm mb-1">Monthly Salary Bill</p>
                            <h3 className="text-3xl font-bold text-gray-900">Rs {stats.totalSalary.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                            <DollarSign className="text-orange-500" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-600 text-sm mb-1">Roles</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.roles}</h3>
                            <p className="text-xs text-gray-500 mt-1">Permission levels</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <Shield className="text-purple-500" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, CNIC, phone, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    >
                        <option>All Roles</option>
                        {ROLES.map(role => <option key={role}>{role}</option>)}
                    </select>
                    <select
                        value={shiftFilter}
                        onChange={(e) => setShiftFilter(e.target.value)}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    >
                        <option>All Shifts</option>
                        <option>Morning</option>
                        <option>Evening</option>
                        <option>Night</option>
                        <option>Full Day</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    >
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Deactivated</option>
                    </select>
                </div>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-3 gap-4">
                {filteredStaff.map((member) => (
                    <div key={member._id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow relative">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-lg">
                                    {getInitials(member.name)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                                        <Check className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadgeColor(member.role)}`}>
                                            {member.role}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                                            {getShiftDisplay(member.shift)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setActiveDropdown(activeDropdown === member._id ? null : member._id)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <MoreVertical size={18} />
                                </button>

                                {activeDropdown === member._id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 overflow-hidden">
                                        <button
                                            onClick={() => openEditModal(member)}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Edit size={14} /> Edit Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedStaff(member);
                                                fetchPaymentHistory(member._id);
                                                setActiveDropdown(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <History size={14} /> View History
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedStaff(member);
                                                setShowSalaryModal(true);
                                                setActiveDropdown(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <DollarSign size={14} /> Pay Salary
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedStaff(member);
                                                setShowAdvanceModal(true);
                                                setActiveDropdown(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Plus size={14} /> Add Advance
                                        </button>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button
                                            onClick={() => {
                                                setSelectedStaff(member);
                                                setShowDeleteModal(true);
                                                setActiveDropdown(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Trash2 size={14} /> Delete Staff
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>



                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${member.salaryStatus === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' :
                                    member.salaryStatus === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                        'bg-red-100 text-red-700 border-red-200'
                                    }`}>
                                    {member.salaryStatus || 'Unpaid'}
                                </span>
                                {member.pendingSalary > 0 && (
                                    <span className="text-red-600 font-medium text-xs">Due: Rs {member.pendingSalary.toLocaleString()}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone size={14} />
                                <span>{member.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail size={14} />
                                <span className="truncate">{member.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin size={14} />
                                <span>Lahore</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div>
                                <p className="text-xs text-gray-500">Salary</p>
                                <p className="text-sm font-semibold text-green-600">Rs {member.baseSalary?.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Joined</p>
                                <p className="text-sm font-medium text-gray-700">
                                    {member.joiningDate ? new Date(member.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {
                filteredStaff.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No staff members found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters</p>
                    </div>
                )
            }

            {/* Role Permissions Section */}
            <div className="bg-white rounded-xl p-8 border border-gray-200 mt-8 mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="text-sm text-green-600" size={24} />
                    <h2 className="text-xl font-bold text-gray-900">Role Permissions</h2>
                </div>
                <p className="text-gray-500 mb-6 text-sm">Overview of access levels for each role in Pakistani pharmacy</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ROLE_PERMISSIONS.map((role, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${role.badgeColor} inline-block mb-4`}>
                                {role.role}
                            </span>
                            <div className="space-y-3">
                                {role.permissions.map((perm, pIdx) => (
                                    <div key={pIdx} className="flex items-start gap-2 text-sm text-gray-600">
                                        {perm.allowed ? (
                                            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        ) : (
                                            <X className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                        )}
                                        <span className={!perm.allowed ? "text-gray-400" : ""}>{perm.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Staff Modal */}
            {
                showAddModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Add New Staff</h2>
                                    <p className="text-gray-600 text-sm mt-1">Add a new employee to the pharmacy</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Personal Information */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Enter full name"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Father's Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.fatherName}
                                                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                                placeholder="Father's name"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                CNIC Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.cnic}
                                                onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                                                placeholder="35201-1234567-1"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="0321-1234567"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email (Optional)
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="staff@pharmacy.pk"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Address <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="Full address"
                                                rows="3"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                City <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            >
                                                {CITIES.map(city => (
                                                    <option key={city} value={city}>{city}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Employment Details */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-4">Employment Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Role / Position <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            >
                                                {ROLES.map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Employment Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.employmentType}
                                                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            >
                                                {EMPLOYMENT_TYPES.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Shift <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.shift}
                                                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            >
                                                {SHIFTS.map(shift => (
                                                    <option key={shift} value={shift}>{shift}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Monthly Salary (PKR) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.baseSalary}
                                                onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                                                placeholder="25000"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Joining Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.joiningDate}
                                                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Contact */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-4">Emergency Contact (Optional)</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contact Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.emergencyContactName}
                                                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                                                placeholder="Emergency contact name"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contact Phone
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.emergencyContactPhone}
                                                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                                                placeholder="0300-1234567"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Account Status */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-gray-900">Account Status</p>
                                        <p className="text-sm text-gray-600">Staff member is currently active</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, status: formData.status === 'Active' ? 'Deactivated' : 'Active' })}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${formData.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.status === 'Active' ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddStaff}
                                    className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                                >
                                    Add Staff
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Delete Confirmation Modal */}
            {
                showDeleteModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md p-6">
                            <div className="text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                                    <Trash2 className="h-6 w-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Delete Staff Member</h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    Are you sure you want to delete <strong>{selectedStaff?.name}</strong>? This action cannot be undone and all historical data for this member will be permanently removed.
                                </p>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteStaff}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Pay Salary Modal */}
            {
                showSalaryModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Pay Salary - {selectedStaff?.name}</h2>
                                <button onClick={() => setShowSalaryModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
                                        <input
                                            type="date"
                                            value={salaryData.periodStart}
                                            onChange={(e) => setSalaryData({ ...salaryData, periodStart: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
                                        <input
                                            type="date"
                                            value={salaryData.periodEnd}
                                            onChange={(e) => setSalaryData({ ...salaryData, periodEnd: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay (PKR)</label>
                                    <input
                                        type="number"
                                        readOnly
                                        value={selectedStaff?.baseSalary}
                                        className="w-full px-4 py-2 bg-gray-50 border rounded-lg text-gray-600"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Base monthly salary from profile</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                    <select
                                        value={salaryData.paymentMethod}
                                        onChange={(e) => setSalaryData({ ...salaryData, paymentMethod: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank">Bank Transfer</option>
                                        <option value="EasyPaisa">EasyPaisa</option>
                                        <option value="JazzCash">JazzCash</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowSalaryModal(false)}
                                    className="px-4 py-2 text-gray-600 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePaySalary}
                                    className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                                >
                                    Confirm Payment
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Advance Modal */}
            {
                showAdvanceModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Add Advance - {selectedStaff?.name}</h2>
                                <button onClick={() => setShowAdvanceModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount (PKR)</label>
                                    <input
                                        type="number"
                                        value={advanceData.amount}
                                        onChange={(e) => setAdvanceData({ ...advanceData, amount: e.target.value })}
                                        placeholder="Enter amount"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={advanceData.date}
                                        onChange={(e) => setAdvanceData({ ...advanceData, date: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Note / Reason</label>
                                    <textarea
                                        value={advanceData.note}
                                        onChange={(e) => setAdvanceData({ ...advanceData, note: e.target.value })}
                                        placeholder="e.g. Medical emergency, Loan"
                                        rows="3"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none resize-none"
                                    />
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowAdvanceModal(false)}
                                    className="px-4 py-2 text-gray-600 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddAdvance}
                                    className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
                                >
                                    Record Advance
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Salary History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Salary History</h2>
                                <p className="text-sm text-gray-500">{selectedStaff?.name}</p>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-0">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Period</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Type</th>
                                        <th className="px-6 py-3">Method</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {paymentHistory.length > 0 ? (
                                        paymentHistory.map((payment) => (
                                            <tr key={payment._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(payment.periodStart).toLocaleDateString()} - {new Date(payment.periodEnd).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    Rs {payment.finalPayable.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    Salary
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {payment.paymentMethod}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {payment.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                No payment history found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-gray-100 text-right">
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Staff;
