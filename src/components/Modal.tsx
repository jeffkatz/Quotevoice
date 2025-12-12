import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useEffect, useRef } from 'react';
import clsx from 'clsx';

type ModalProps = {
    isOpen: boolean;
    onClose?: () => void; // Made optional to support onCancel alias
    onCancel?: () => void; // Alias for onClose
    title: string;
    description?: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    confirmLabel?: string;
    cancelLabel?: string;
    confirmText?: string; // Alias for confirmLabel
    cancelText?: string; // Alias for cancelLabel
    onConfirm?: () => void;
    isLoading?: boolean;
    children?: React.ReactNode;
};

export default function Modal({
    isOpen,
    onClose,
    onCancel,
    title,
    description,
    type = 'info',
    confirmLabel = 'Confirm',
    cancelLabel,
    confirmText,
    cancelText,
    onConfirm,
    isLoading = false,
    children
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const handleClose = () => {
        if (onClose) onClose();
        else if (onCancel) onCancel();
    };

    const effectiveConfirmLabel = confirmText || confirmLabel;
    const effectiveCancelLabel = cancelText || cancelLabel || (type === 'confirm' ? 'Cancel' : 'Close');

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, onCancel]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle className="text-green-600" size={24} />;
            case 'warning': return <AlertTriangle className="text-amber-600" size={24} />;
            case 'error': return <AlertTriangle className="text-red-600" size={24} />;
            default: return <Info className="text-blue-600" size={24} />;
        }
    };

    const getButtonColor = () => {
        switch (type) {
            case 'success': return 'bg-green-600 hover:bg-green-700';
            case 'error': return 'bg-red-600 hover:bg-red-700';
            case 'warning': return 'bg-amber-600 hover:bg-amber-700';
            default: return 'bg-slate-900 hover:bg-slate-800';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
                role="dialog"
                aria-modal="true"
            >
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3 items-start">
                            <div className={clsx(
                                "p-2 rounded-xl shrink-0",
                                type === 'success' && "bg-green-50",
                                type === 'warning' && "bg-amber-50",
                                type === 'error' && "bg-red-50",
                                (type === 'info' || type === 'confirm') && "bg-blue-50"
                            )}>
                                {getIcon()}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 leading-tight">{title}</h3>
                                {description && (
                                    <p className="text-sm text-slate-500 mt-1">{description}</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {children && <div className="mt-2 text-sm text-slate-600">{children}</div>}

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            {effectiveCancelLabel}
                        </button>
                        {(onConfirm || type === 'confirm') && (
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={clsx(
                                    "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2",
                                    getButtonColor(),
                                    isLoading && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {isLoading ? 'Processing...' : effectiveConfirmLabel}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
