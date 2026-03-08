import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { createPortal } from 'react-dom';

interface StatsDateRangePickerProps {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    onChange: (start: string, end: string) => void;
}

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function StatsDateRangePicker({ startDate, endDate, onChange }: StatsDateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

    // El mes base para el calendario izquierdo
    const [baseDate, setBaseDate] = useState(() => {
        if (startDate) {
            const parts = startDate.split('-');
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
        }
        const d = new Date();
        d.setDate(1);
        return d;
    });

    // Estados temporales del proceso de selección
    const [tempStart, setTempStart] = useState<string | null>(startDate);
    const [tempEnd, setTempEnd] = useState<string | null>(endDate);
    const [hoverDate, setHoverDate] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if click is outside both the button container AND the portal popover
            const isOutsideContainer = containerRef.current && !containerRef.current.contains(event.target as Node);
            const isOutsidePopover = !document.getElementById('stats-date-picker-popover')?.contains(event.target as Node);

            if (isOutsideContainer && isOutsidePopover) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useLayoutEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Posicionar el popover anclado a la izquierda para que no se corte
            setPopoverStyle({
                top: `${rect.bottom + 8}px`,
                left: `${rect.left}px`
            });
        }
    }, [isOpen]);

    // Sync con props si cambian desde afuera
    useEffect(() => {
        if (!isOpen) {
            setTempStart(startDate);
            setTempEnd(endDate);
        }
    }, [startDate, endDate, isOpen]);

    const handlePrevMonth = () => {
        const _base = new Date(baseDate);
        _base.setMonth(_base.getMonth() - 1);
        setBaseDate(_base);
    };

    const handleNextMonth = () => {
        const _base = new Date(baseDate);
        _base.setMonth(_base.getMonth() + 1);
        setBaseDate(_base);
    };

    const handleDayClick = (dateStr: string) => {
        if (!tempStart || (tempStart && tempEnd)) {
            // Empezar nueva selección
            setTempStart(dateStr);
            setTempEnd(null);
        } else if (tempStart && !tempEnd) {
            // Terminar selección
            if (dateStr < tempStart) {
                // Invertido
                setTempEnd(tempStart);
                setTempStart(dateStr);
            } else {
                setTempEnd(dateStr);
            }
        }
    };

    const handleApply = () => {
        if (tempStart && tempEnd) {
            onChange(tempStart, tempEnd);
            setIsOpen(false);
        }
    };

    const formatDisplayDate = (dStr: string) => {
        if (!dStr) return '';
        const parts = dStr.split('-');
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getDaysInMonth = (year: number, monthIndex: number) => {
        return new Date(year, monthIndex + 1, 0).getDate();
    };

    const getFirstDayOfWeek = (year: number, monthIndex: number) => {
        const d = new Date(year, monthIndex, 1).getDay(); // 0 = Domingo
        return d === 0 ? 6 : d - 1; // Adaptar a Lunes = 0
    };

    const renderCalendarMonth = (offsetMonths: number) => {
        const targetDate = new Date(baseDate);
        targetDate.setMonth(targetDate.getMonth() + offsetMonths);

        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();

        const daysInMonth = getDaysInMonth(year, month);
        const firstDayIdx = getFirstDayOfWeek(year, month);

        const days = [];
        for (let i = 0; i < firstDayIdx; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);

        return (
            <div className="flex-1 w-full min-w-[240px]">
                <div className="text-center font-bold text-gray-200 mb-4 tracking-wide">
                    {MONTH_NAMES[month]} <span className="text-gray-400 font-normal">{year}</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                        <div key={'h' + d} className="text-[10px] font-bold text-gray-500">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                    {days.map((dayNum, i) => {
                        if (!dayNum) return <div key={i} className="h-8" />;

                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

                        const isStart = tempStart === dateStr;
                        const isEnd = tempEnd === dateStr;
                        const isSelected = !!tempStart && !!tempEnd && dateStr >= tempStart && dateStr <= tempEnd;
                        const isHoverTrail = !!tempStart && !tempEnd && !!hoverDate && (
                            (dateStr >= tempStart && dateStr <= hoverDate) ||
                            (dateStr >= hoverDate && dateStr <= tempStart)
                        );

                        const isActiveBg = isSelected || isHoverTrail;
                        const isEndCap = isStart || isEnd;

                        return (
                            <div
                                key={i}
                                className={`h-8 flex items-center justify-center relative cursor-pointer text-sm
                                    ${isActiveBg && !isEndCap ? 'bg-indigo-900/30' : ''}
                                    ${isStart ? 'bg-gradient-to-r from-transparent to-indigo-900/30 rounded-l-full' : ''}
                                    ${isEnd ? 'bg-gradient-to-l from-transparent to-indigo-900/30 rounded-r-full' : ''}
                                `}
                                onMouseEnter={() => setHoverDate(dateStr)}
                                onClick={() => handleDayClick(dateStr)}
                            >
                                <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-all
                                    ${isEndCap ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)] font-bold' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}
                                `}>
                                    {dayNum}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Botón Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-black/30 border border-gray-600 rounded-lg px-3 py-2.5 hover:border-indigo-500 hover:bg-black/40 transition-colors cursor-pointer group"
            >
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
                    <span className="text-sm text-gray-200 font-medium">
                        {formatDisplayDate(startDate)} <span className="text-gray-500 font-normal mx-1">al</span> {formatDisplayDate(endDate)}
                    </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>

            {/* Popover (Rendered in Portal) */}
            {isOpen && typeof window !== 'undefined' && createPortal(
                <div
                    id="stats-date-picker-popover"
                    className="fixed z-[100] bg-[#1e2024] border border-gray-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-5 min-w-[550px] animate-in fade-in zoom-in-95 duration-200"
                    style={popoverStyle}
                >

                    {/* Header Paginador */}
                    <div className="flex justify-between items-center mb-6 px-2">
                        <button onClick={handlePrevMonth} className="p-1.5 rounded-full bg-black/20 hover:bg-gray-700 text-gray-300 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Selecciona las fechas
                        </div>
                        <button onClick={handleNextMonth} className="p-1.5 rounded-full bg-black/20 hover:bg-gray-700 text-gray-300 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Calendarios Side-by-Side */}
                    <div className="flex gap-8 mb-6 relative">
                        {/* Divider */}
                        <div className="absolute left-1/2 top-4 bottom-4 w-px bg-gray-800 -translate-x-1/2"></div>

                        {renderCalendarMonth(0)}
                        {renderCalendarMonth(1)}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                        <div className="text-sm flex flex-col">
                            <span className="text-gray-400">Rango seleccionado:</span>
                            <span className="text-indigo-300 font-bold">
                                {tempStart ? formatDisplayDate(tempStart) : 'Inicio'} - {tempEnd ? formatDisplayDate(tempEnd) : 'Fin'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-gray-300 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={!tempStart || !tempEnd}
                                className="px-5 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
                            >
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
