'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
    value: string;
    onChange: (val: string) => void;
    minuteStep?: number;
    disabled?: boolean;
    className?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const parse = (v: string) => {
    const m = (v || '').match(/^(\d{1,2}):(\d{1,2})$/);
    return m ? { h: clamp(parseInt(m[1]), 0, 23), m: clamp(parseInt(m[2]), 0, 59) } : { h: 0, m: 0 };
};
const fmt = (h: number, m: number) => `${pad(clamp(h, 0, 23))}:${pad(clamp(m, 0, 59))}`;

// Sugerencias cercanas: alrededor del valor actual con saltos de 15 y 30 min
const buildSuggestions = (h: number, m: number): string[] => {
    const base = h * 60 + m;
    const offsets = [-60, -30, -15, 0, 15, 30, 60];
    const out = new Set<string>();
    offsets.forEach(o => {
        const t = ((base + o) % (24 * 60) + 24 * 60) % (24 * 60);
        out.add(fmt(Math.floor(t / 60), t % 60));
    });
    // Añade los redondos cercanos
    out.add(fmt(h, 0));
    out.add(fmt(h, 30));
    out.add(fmt((h + 1) % 24, 0));
    return Array.from(out).sort();
};

export default function TimePicker({ value, onChange, minuteStep = 5, disabled, className = '' }: Props) {
    const { h, m } = parse(value);
    const [hStr, setHStr] = useState(pad(h));
    const [mStr, setMStr] = useState(pad(m));
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const p = parse(value);
        setHStr(pad(p.h));
        setMStr(pad(p.m));
    }, [value]);

    useEffect(() => {
        const onClickOut = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClickOut);
        return () => document.removeEventListener('mousedown', onClickOut);
    }, []);

    const commit = (nh: number, nm: number) => {
        const v = fmt(nh, nm);
        setHStr(pad(clamp(nh, 0, 23)));
        setMStr(pad(clamp(nm, 0, 59)));
        onChange(v);
    };

    const stepH = (delta: number) => commit((h + delta + 24) % 24, m);
    const stepM = (delta: number) => {
        const total = h * 60 + m + delta * minuteStep;
        const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
        commit(Math.floor(wrapped / 60), wrapped % 60);
    };

    const onHourChange = (raw: string) => {
        const digits = raw.replace(/\D/g, '').slice(0, 2);
        setHStr(digits);
    };
    const onHourBlur = () => {
        const n = parseInt(hStr || '0');
        commit(isNaN(n) ? h : clamp(n, 0, 23), m);
    };
    const onMinChange = (raw: string) => {
        const digits = raw.replace(/\D/g, '').slice(0, 2);
        setMStr(digits);
    };
    const onMinBlur = () => {
        const n = parseInt(mStr || '0');
        commit(h, isNaN(n) ? m : clamp(n, 0, 59));
    };

    const suggestions = buildSuggestions(h, m);

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div
                className={`inline-flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 focus-within:border-indigo-500 transition-colors ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => !disabled && setOpen(true)}
            >
                {/* Hora */}
                <div className="flex flex-col items-center">
                    <button type="button" onClick={(e) => { e.stopPropagation(); stepH(1); }}
                        className="text-gray-400 hover:text-indigo-300 cursor-pointer leading-none p-0.5"
                        title="Subir hora"><ChevronUp className="w-3 h-3" /></button>
                    <input
                        type="text" inputMode="numeric"
                        value={hStr}
                        onFocus={() => setOpen(true)}
                        onChange={e => onHourChange(e.target.value)}
                        onBlur={onHourBlur}
                        className="w-7 text-center bg-transparent text-white text-sm font-bold focus:outline-none"
                        aria-label="Hora"
                    />
                    <button type="button" onClick={(e) => { e.stopPropagation(); stepH(-1); }}
                        className="text-gray-400 hover:text-indigo-300 cursor-pointer leading-none p-0.5"
                        title="Bajar hora"><ChevronDown className="w-3 h-3" /></button>
                </div>
                <span className="text-white font-bold">:</span>
                {/* Minuto */}
                <div className="flex flex-col items-center">
                    <button type="button" onClick={(e) => { e.stopPropagation(); stepM(1); }}
                        className="text-gray-400 hover:text-indigo-300 cursor-pointer leading-none p-0.5"
                        title={`+${minuteStep} min`}><ChevronUp className="w-3 h-3" /></button>
                    <input
                        type="text" inputMode="numeric"
                        value={mStr}
                        onFocus={() => setOpen(true)}
                        onChange={e => onMinChange(e.target.value)}
                        onBlur={onMinBlur}
                        className="w-7 text-center bg-transparent text-white text-sm font-bold focus:outline-none"
                        aria-label="Minutos"
                    />
                    <button type="button" onClick={(e) => { e.stopPropagation(); stepM(-1); }}
                        className="text-gray-400 hover:text-indigo-300 cursor-pointer leading-none p-0.5"
                        title={`-${minuteStep} min`}><ChevronDown className="w-3 h-3" /></button>
                </div>
            </div>

            {open && !disabled && (
                <div className="absolute left-0 top-full mt-1 z-30 bg-[#1e2336] border border-[#3b4256] rounded-lg shadow-xl p-2 w-44">
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1 px-1">Sugerencias</p>
                    <div className="grid grid-cols-3 gap-1">
                        {suggestions.map(s => {
                            const isCurrent = s === fmt(h, m);
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => { const p = parse(s); commit(p.h, p.m); setOpen(false); }}
                                    className={`text-[11px] font-bold py-1 rounded transition-colors cursor-pointer ${isCurrent ? 'bg-indigo-600 text-white' : 'bg-black/30 text-gray-300 hover:bg-indigo-500/20 hover:text-white'}`}
                                >{s}</button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
