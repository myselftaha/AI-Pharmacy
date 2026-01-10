import React, { useEffect } from 'react';
import { AlertCircle, X, HelpCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "warning", // 'warning', 'danger', 'info', 'success'
    isLoading = false
}) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const themes = {
        warning: {
            icon: <AlertTriangle className="text-amber-600" size={32} />,
            lightBg: "bg-amber-50",
            border: "border-amber-100/50",
            iconBg: "bg-amber-100",
            button: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
        },
        danger: {
            icon: <AlertCircle className="text-red-600" size={32} />,
            lightBg: "bg-red-50",
            border: "border-red-100/50",
            iconBg: "bg-red-100",
            button: "bg-red-600 hover:bg-red-700 shadow-red-600/20"
        },
        info: {
            icon: <HelpCircle className="text-blue-600" size={32} />,
            lightBg: "bg-blue-50",
            border: "border-blue-100/50",
            iconBg: "bg-blue-100",
            button: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
        },
        success: {
            icon: <CheckCircle2 className="text-green-600" size={32} />,
            lightBg: "bg-green-50",
            border: "border-green-100/50",
            iconBg: "bg-green-100",
            button: "bg-green-600 hover:bg-green-700 shadow-green-600/20"
        }
    };

    const theme = themes[type] || themes.warning;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                {/* Visual Header */}
                <div className={`${theme.lightBg} p-8 flex flex-col items-center border-b ${theme.border} relative`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full transition-all"
                    >
                        <X size={18} />
                    </button>

                    <div className={`${theme.iconBg} w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-white rotate-3 group-hover:rotate-0 transition-transform duration-300`}>
                        {theme.icon}
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 text-center px-4 leading-tight">{title}</h2>
                </div>

                {/* Body */}
                <div className="p-8 text-center pb-2">
                    <p className="text-gray-600 text-[15px] leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="p-8 flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`w-full py-4 px-4 ${theme.button} text-white font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            confirmText
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full py-4 px-4 bg-white border border-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 hover:text-gray-700 transition-all active:scale-[0.98]"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
