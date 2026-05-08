'use client';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';
export interface Toast { id: string; message: string; type: ToastType; duration: number; }

type Listener = (toasts: Toast[]) => void;
const listeners = new Set<Listener>();
let toasts: Toast[] = [];
const emit = () => listeners.forEach(l => l(toasts));

export function notify(message: string, type: ToastType = 'success', duration = 5000) {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const toast: Toast = { id, message, type, duration };
    toasts = [...toasts, toast];
    emit();
    if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
    }
    return id;
}
export const notifySuccess = (m: string, d?: number) => notify(m, 'success', d);
export const notifyError = (m: string, d?: number) => notify(m, 'error', d);
export const notifyInfo = (m: string, d?: number) => notify(m, 'info', d);

export function dismiss(id: string) {
    toasts = toasts.filter(t => t.id !== id);
    emit();
}

export function useToasts() {
    const [list, setList] = useState<Toast[]>(toasts);
    useEffect(() => {
        const l: Listener = (next) => setList(next);
        listeners.add(l);
        return () => { listeners.delete(l); };
    }, []);
    return list;
}
