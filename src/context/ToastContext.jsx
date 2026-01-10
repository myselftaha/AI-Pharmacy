import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const toastVariants = {
    initial: { opacity: 0, y: 50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const icons = {
    success: Check,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle
};

const colors = {
    success: {
        bg: 'bg-white',
        border: 'border-green-100',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        titleColor: 'text-gray-800',
        textColor: 'text-green-700'
    },
    error: {
        bg: 'bg-white',
        border: 'border-red-100',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        titleColor: 'text-gray-800',
        textColor: 'text-red-700'
    },
    info: {
        bg: 'bg-white',
        border: 'border-blue-100',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        titleColor: 'text-gray-800',
        textColor: 'text-blue-700'
    },
    warning: {
        bg: 'bg-white',
        border: 'border-orange-100',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        titleColor: 'text-gray-800',
        textColor: 'text-orange-700'
    }
};

const ToastItem = ({ id, type, title, message, onClose }) => {
    const Icon = icons[type] || Info;
    const style = colors[type] || colors.info;

    return (
        <motion.div
            layout
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`${style.bg} ${style.border} border shadow-lg rounded-3xl p-4 flex items-center gap-4 min-w-[320px] max-w-md pointer-events-auto`}
        >
            <div className={`${style.iconBg} p-2 rounded-full shrink-0`}>
                <Icon size={24} className={style.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
                {title && <h4 className={`font-semibold ${style.titleColor} text-sm`}>{title}</h4>}
                {message && <p className={`text-sm font-medium ${style.textColor}`}>{message}</p>}
            </div>
            <button
                onClick={() => onClose(id)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
                <X size={18} />
            </button>
        </motion.div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', title) => {
        const id = Date.now().toString();
        
        // Auto-generate title if not provided, based on type
        let displayTitle = title;
        if (!displayTitle) {
            switch (type) {
                case 'success':
                    displayTitle = 'Success';
                    break;
                case 'error':
                    displayTitle = 'Error';
                    break;
                case 'warning':
                    displayTitle = 'Warning';
                    break;
                case 'info':
                    displayTitle = 'Information';
                    break;
                default:
                    displayTitle = 'Notification';
            }
        }

        // If message is the only thing provided and it's short, maybe use it as title?
        // But for consistency with existing calls like enqueueSnackbar('Message'), 
        // we'll keep 'message' as the subtitle/message part and use a default title.
        // Or if the user wants exactly the design: "Credit Card expired" (Title) "Update Payment Details" (Message).
        // Existing calls are: enqueueSnackbar('Transaction saved successfully!', { variant: 'success' })
        // This will become: showToast('Transaction saved successfully!', 'success')
        // Result: Title="Success", Message="Transaction saved successfully!"

        setToasts((prev) => [...prev, { id, message, type, title: displayTitle }]);

        // Auto remove after 4 seconds
        setTimeout(() => {
            removeToast(id);
        }, 4000);

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            {children}
            {createPortal(
                <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
                    <AnimatePresence mode="popLayout">
                        {toasts.map((toast) => (
                            <ToastItem key={toast.id} {...toast} onClose={removeToast} />
                        ))}
                    </AnimatePresence>
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};
