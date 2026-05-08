'use client';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToasts, dismiss } from '@/app/hooks/useNotify';
import { useEffect, useState } from 'react';

export default function ToastContainer() {
    const toasts = useToasts();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted || typeof document === 'undefined') return null;
    return createPortal(
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pointer-events-none">
            {toasts.map(t => (
                <div key={t.id}
                    className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border min-w-[320px] max-w-[480px] backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200 ${
                        t.type === 'success' ? 'bg-[#1a2e1f] border-emerald-500/40 text-emerald-300' :
                        t.type === 'error' ? 'bg-[#2e1a1a] border-red-500/40 text-red-300' :
                        'bg-[#1a1f2e] border-sky-500/40 text-sky-300'
                    }`}>
                    {t.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> :
                     t.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> :
                     <Info className="w-5 h-5 shrink-0" />}
                    <p className="font-bold text-sm text-white pr-2 flex-1">{t.message}</p>
                    <button onClick={() => dismiss(t.id)} className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                        <X className="w-4 h-4 text-gray-300" />
                    </button>
                </div>
            ))}
        </div>,
        document.body
    );
}
