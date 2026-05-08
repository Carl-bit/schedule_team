'use client';
import { useEffect, useState } from 'react';

type Listener<T> = (v: T) => void;
function createSignal<T>(initial: T) {
    let value = initial;
    const subs = new Set<Listener<T>>();
    return {
        get: () => value,
        set: (v: T) => { value = v; subs.forEach(s => s(v)); },
        subscribe: (cb: Listener<T>) => { subs.add(cb); return () => { subs.delete(cb); }; },
    };
}

const activeLabelSig = createSignal<string | null>(null);

export const setActiveLabel = (id: string | null) => activeLabelSig.set(id);
export const getActiveLabel = () => activeLabelSig.get();

export function useActiveLabel(): [string | null, (id: string | null) => void] {
    const [v, setV] = useState<string | null>(activeLabelSig.get());
    useEffect(() => activeLabelSig.subscribe(setV), []);
    return [v, setActiveLabel];
}

// Comandos disparados desde el sidebar y manejados en CalendarPanel
type Cmd = 'create' | 'undo' | 'save';
const cmdListeners = new Set<(c: Cmd) => void>();
export const sendCalendarCommand = (c: Cmd) => cmdListeners.forEach(l => l(c));
export function useCalendarCommand(handler: (c: Cmd) => void) {
    useEffect(() => { cmdListeners.add(handler); return () => { cmdListeners.delete(handler); }; }, [handler]);
}

// Mirror del estado de assignments para que el sidebar habilite undo/save
const historyHasSig = createSignal<boolean>(false);
export const setHistoryHas = (v: boolean) => historyHasSig.set(v);
export function useHistoryHas() {
    const [v, setV] = useState<boolean>(historyHasSig.get());
    useEffect(() => historyHasSig.subscribe(setV), []);
    return v;
}
