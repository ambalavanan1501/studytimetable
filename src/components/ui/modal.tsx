import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className={cn(
                    "relative w-full bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-scale-up border border-white/40",
                    className
                )}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/20">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-500 hover:text-slate-900"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}
