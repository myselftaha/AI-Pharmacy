import React, { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExcelImportModal = ({ isOpen, onClose, onImport }) => {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [results, setResults] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
                alert('Please select an Excel file (.xlsx or .xls)');
                return;
            }
            setFile(selectedFile);
            setResults(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            alert('Please select a file first');
            return;
        }

        setImporting(true);
        setResults(null);

        try {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                    if (jsonData.length === 0) {
                        alert('Excel file is empty');
                        setImporting(false);
                        return;
                    }

                    // Call the parent import handler
                    const result = await onImport(jsonData);
                    setResults(result);

                } catch (error) {
                    console.error('Error parsing Excel:', error);
                    alert('Error reading Excel file: ' + error.message);
                } finally {
                    setImporting(false);
                }
            };

            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error importing:', error);
            alert('Import failed: ' + error.message);
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        // Sample data for template
        const templateData = [
            {
                name: 'Paracetamol 500mg',
                description: 'Pain reliever and fever reducer',
                price: 10,
                stock: 100,
                unit: 'pcs',
                netContent: '10 tablets',
                category: 'Pain Relief',
                costPrice: 7,
                minStock: 20,
                supplier: 'ABC Pharma',
                formulaCode: 'PCM500',
                genericName: 'Paracetamol',
                shelfLocation: 'A-1',
                mrp: 15,
                sellingPrice: 12,
                packSize: 10,
                status: 'Active',
                expiryDate: '2025-12-31'
            },
            {
                name: 'Amoxicillin 250mg',
                description: 'Antibiotic',
                price: 50,
                stock: 50,
                unit: 'pcs',
                netContent: '10 capsules',
                category: 'Antibiotics',
                costPrice: 35,
                minStock: 15,
                supplier: 'XYZ Pharma',
                formulaCode: 'AMX250',
                genericName: 'Amoxicillin',
                shelfLocation: 'B-2',
                mrp: 60,
                sellingPrice: 55,
                packSize: 10,
                status: 'Active',
                expiryDate: '2026-06-30'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Medicines');

        // Column widths
        ws['!cols'] = [
            { wch: 25 }, // name
            { wch: 35 }, // description
            { wch: 10 }, // price
            { wch: 10 }, // stock
            { wch: 10 }, // unit
            { wch: 15 }, // netContent
            { wch: 15 }, // category
            { wch: 10 }, // costPrice
            { wch: 10 }, // minStock
            { wch: 15 }, // supplier
            { wch: 15 }, // formulaCode
            { wch: 15 }, // genericName
            { wch: 15 }, // shelfLocation
            { wch: 10 }, // mrp
            { wch: 12 }, // sellingPrice
            { wch: 10 }, // packSize
            { wch: 10 }, // status
            { wch: 12 }  // expiryDate
        ];

        XLSX.writeFile(wb, 'medicines_template.xlsx');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                            <FileSpreadsheet className="text-green-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Import Medicines from Excel</h2>
                            <p className="text-sm text-gray-500">Upload an Excel file to add multiple medicines at once</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Template Download */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Download className="text-blue-600 flex-shrink-0" size={20} />
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-900 text-sm mb-1">
                                    Download Template First
                                </h3>
                                <p className="text-xs text-blue-700 mb-3">
                                    Use our template to ensure your data is formatted correctly. It includes sample data and all required columns.
                                </p>
                                <button
                                    onClick={downloadTemplate}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    <Download size={16} />
                                    Download Template
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Excel File
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="hidden"
                                id="excel-upload"
                            />
                            <label
                                htmlFor="excel-upload"
                                className="cursor-pointer flex flex-col items-center gap-3"
                            >
                                <Upload className="text-gray-400" size={40} />
                                {file ? (
                                    <div className="text-green-600 font-medium">{file.name}</div>
                                ) : (
                                    <>
                                        <div className="font-medium text-gray-700">
                                            Click to upload Excel file
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Supports .xlsx and .xls files
                                        </div>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Results */}
                    {results && (
                        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <CheckCircle className="text-green-600" size={20} />
                                Import Results
                            </h3>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-800">{results.results.total}</div>
                                    <div className="text-xs text-gray-600">Total</div>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{results.results.successful}</div>
                                    <div className="text-xs text-green-700">Successful</div>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-lg">
                                    <div className="text-2xl font-bold text-red-600">{results.results.failed}</div>
                                    <div className="text-xs text-red-700">Failed</div>
                                </div>
                            </div>

                            {results.results.errors.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-medium text-red-700 text-sm mb-2 flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        Errors ({results.results.errors.length})
                                    </h4>
                                    <div className="max-h-40 overflow-auto bg-red-50 rounded p-3 text-xs space-y-1">
                                        {results.results.errors.map((error, idx) => (
                                            <div key={idx} className="text-red-700">
                                                Row {error.row}: {error.name} - {error.error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!file || importing}
                            className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {importing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    Import Medicines
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExcelImportModal;
