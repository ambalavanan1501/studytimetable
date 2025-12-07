import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Toast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const [isExiting, setIsExiting] = useState(false);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300); // Wait for exit animation
    };

    // Auto-dismiss logic inside the item to handle animation visually before removal?
    // Actually the context handles removal, but we want animation. 
    // If context removes it, it disappears instantly from the list. 
    // So context should wait? Or we just rely on CSS animation-in/out?
    // The current context implementation removes it after 5s. 
    // If we want smooth exit, we need coordination.
    // For now, let's stick to the previous simple implementation but with correct imports.

    // Check if the item is about to be removed by context? 
    // No, context just removes it. 
    // Let's just render it.

    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
    };

    const bgColors = {
        success: 'bg-emerald-50 border-emerald-100',
        error: 'bg-red-50 border-red-100',
        info: 'bg-blue-50 border-blue-100',
    };

    return (
        <div
            className={cn(
                "flex items-center gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 transform translate-x-0 opacity-100 mb-3 w-full max-w-sm",
                "bg-white dark:bg-slate-800 dark:border-slate-700",
                isExiting ? "translate-x-full opacity-0" : "animate-in slide-in-from-right-full fade-in"
            )}
            role="alert"
        >
            <div className={cn("p-2 rounded-full bg-opacity-20", bgColors[toast.type].replace('bg-', 'bg-').split(' ')[0])}>
                {icons[toast.type]}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{toast.message}</p>
            </div>
            <button
                onClick={handleDismiss}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return createPortal(
        <div className="fixed top-4 right-4 z-[100] flex flex-col items-end w-full max-w-sm pointer-events-none">
            <div className="pointer-events-auto w-full">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
                ))}
            </div>
        </div>,
        document.body
    );
}
