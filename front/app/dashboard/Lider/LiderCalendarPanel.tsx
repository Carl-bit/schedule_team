'use client';
import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Users, Clock, CalendarOff, Briefcase, X } from 'lucide-react';
import { API_BASE } from '@/app/lib/api';
import { formatTime } from '@/app/lib/dates';
import type { Empleado, EtiquetaHorario } from '@/app/types';

type Source = 'plan' | 'registro' | 'ausencia';
interface CalEvent {
    id: string;
    empleado_id: string;
    nombre_empleado: string;
    source: Source;
    inicio: string;
    fin?: string;
    detalle: string;
    estado_id?: number;
    color: string; // color tailwind unico por trabajador
    etiquetaName?: string;
}

const PALETTE = [
    'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
    'bg-cyan-500', 'bg-violet-500', 'bg-pink-500', 'bg-teal-500',
    'bg-orange-500', 'bg-sky-500', 'bg-fuchsia-500', 'bg-lime-500',
];
const colorForEmpleado = (id: string, empleados: Empleado[]) => {
    const idx = empleados.findIndex(e => e.empleado_id === id);
    return PALETTE[(idx >= 0 ? idx : 0) % PALETTE.length];
};

const formatDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtHm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

// Encuentra la etiqueta que mejor matchea el rango inicio-fin (solo para mostrar nombre del turno)
const matchEtiqueta = (inicio: string, fin: string | undefined, etiquetas: EtiquetaHorario[]): EtiquetaHorario | undefined => {
    if (!fin) return undefined;
    const ini = new Date(inicio);
    const f = new Date(fin);
    const range = `${fmtHm(ini)} - ${fmtHm(f)}`;
    return etiquetas.find(e => e.rango_horas === range);
};

export default function LiderCalendarPanel() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [events, setEvents] = useState<CalEvent[]>([]);
    const [etiquetasCompartidas, setEtiquetasCompartidas] = useState<EtiquetaHorario[]>([]);
    const [filterEmpleado, setFilterEmpleado] = useState<string>('');
    const [filterSource, setFilterSource] = useState<'todos' | Source>('plan');
    const [loading, setLoading] = useState(false);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const t = Date.now();
                const [empRes, planRes, horaRes, ausRes, etqRes] = await Promise.all([
                    fetch(`${API_BASE}/empleados?t=${t}`),
                    fetch(`${API_BASE}/planificacion?t=${t}`),
                    fetch(`${API_BASE}/hora?t=${t}`),
                    fetch(`${API_BASE}/ausencias?t=${t}`),
                    fetch(`${API_BASE}/etiquetas/compartidas?t=${t}`),
                ]);
                const [empData, planData, horaData, ausData, etqData] = await Promise.all([
                    empRes.json(), planRes.json(), horaRes.json(), ausRes.json(), etqRes.json()
                ]);

                const emps: Empleado[] = Array.isArray(empData) ? empData : [];
                setEmpleados(emps);
                const etqs: EtiquetaHorario[] = Array.isArray(etqData) ? etqData : [];
                setEtiquetasCompartidas(etqs);

                const findName = (id: string) => emps.find(e => e.empleado_id === id)?.nombre_empleado || id;
                const evs: CalEvent[] = [];
                const seen = new Set<string>(); // dedupe: empleado|source|inicio|fin

                const pushUnique = (ev: CalEvent) => {
                    const key = `${ev.empleado_id}|${ev.source}|${ev.inicio}|${ev.fin || ''}`;
                    if (seen.has(key)) return;
                    seen.add(key);
                    evs.push(ev);
                };

                if (Array.isArray(planData)) {
                    planData.forEach((p: any) => {
                        const matched = matchEtiqueta(p.inicio_turno, p.fin_turno, etqs);
                        pushUnique({
                            id: `plan_${p.plan_id}`,
                            empleado_id: p.empleado_id,
                            nombre_empleado: p.nombre_empleado || findName(p.empleado_id),
                            source: 'plan',
                            inicio: p.inicio_turno,
                            fin: p.fin_turno,
                            detalle: `${formatTime(p.inicio_turno)} - ${formatTime(p.fin_turno)}`,
                            estado_id: p.estado_id,
                            color: colorForEmpleado(p.empleado_id, emps),
                            etiquetaName: matched?.nombre,
                        });
                    });
                }

                if (Array.isArray(horaData)) {
                    horaData.forEach((h: any) => {
                        const matched = matchEtiqueta(h.inicio_trabajo, h.fin_trabajo, etqs);
                        pushUnique({
                            id: `hora_${h.registro_id}`,
                            empleado_id: h.empleado_id,
                            nombre_empleado: findName(h.empleado_id),
                            source: 'registro',
                            inicio: h.inicio_trabajo,
                            fin: h.fin_trabajo,
                            detalle: h.fin_trabajo ? `${formatTime(h.inicio_trabajo)} - ${formatTime(h.fin_trabajo)}` : `${formatTime(h.inicio_trabajo)} - en curso`,
                            estado_id: h.estado_id,
                            color: colorForEmpleado(h.empleado_id, emps),
                            etiquetaName: matched?.nombre,
                        });
                    });
                }

                if (Array.isArray(ausData)) {
                    ausData.forEach((a: any) => {
                        // Solo ausencias que ya estan aprobadas o realmente confirmadas
                        // Las pendientes / rechazadas no deberian aparecer en la grilla del calendario
                        if (a.estado_id !== 2) return;
                        const ini = new Date(a.inicio_ausencia);
                        const fin = new Date(a.fin_ausencia);
                        const cur = new Date(ini);
                        while (cur <= fin) {
                            pushUnique({
                                id: `aus_${a.ausencia_id}_${formatDateStr(cur)}`,
                                empleado_id: a.empleado_id,
                                nombre_empleado: a.nombre_empleado || findName(a.empleado_id),
                                source: 'ausencia',
                                inicio: new Date(cur).toISOString(),
                                detalle: a.motivo || 'Ausencia',
                                estado_id: a.estado_id,
                                color: colorForEmpleado(a.empleado_id, emps),
                            });
                            cur.setDate(cur.getDate() + 1);
                        }
                    });
                }

                setEvents(evs);
            } catch (err) {
                console.error('Error cargando calendario lider:', err);
            }
            setLoading(false);
        };
        fetchAll();
    }, []);

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek === -1) startDayOfWeek = 6;
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startDayOfWeek);

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const totalCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;

        const days = [];
        for (let i = 0; i < totalCells; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            days.push({
                dateStr: formatDateStr(d),
                dayNumber: d.getDate(),
                isCurrentMonth: d.getMonth() === month,
                isToday: formatDateStr(d) === formatDateStr(new Date()),
            });
        }
        return days;
    }, [currentDate]);

    const filteredEvents = useMemo(() => {
        return events.filter(e => {
            if (filterEmpleado && e.empleado_id !== filterEmpleado) return false;
            if (filterSource !== 'todos' && e.source !== filterSource) return false;
            return true;
        });
    }, [events, filterEmpleado, filterSource]);

    const eventsByDay = useMemo(() => {
        const map: Record<string, CalEvent[]> = {};
        filteredEvents.forEach(ev => {
            const ds = formatDateStr(new Date(ev.inicio));
            if (!map[ds]) map[ds] = [];
            map[ds].push(ev);
        });
        return map;
    }, [filteredEvents]);

    // Agrupa los eventos de un dia por trabajador (uno por trabajador con todos sus turnos/eventos)
    const groupByEmpleado = (evs: CalEvent[]) => {
        const map = new Map<string, { empleado_id: string; nombre_empleado: string; color: string; eventos: CalEvent[] }>();
        evs.forEach(ev => {
            const g = map.get(ev.empleado_id);
            if (g) g.eventos.push(ev);
            else map.set(ev.empleado_id, { empleado_id: ev.empleado_id, nombre_empleado: ev.nombre_empleado, color: ev.color, eventos: [ev] });
        });
        // ordenar eventos de cada trabajador por inicio
        return Array.from(map.values()).map(g => ({
            ...g,
            eventos: g.eventos.sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()),
        }));
    };

    const monthLabel = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const sourceIcon = (s: Source) => s === 'plan' ? <Briefcase className="w-3 h-3" /> : s === 'registro' ? <Clock className="w-3 h-3" /> : <CalendarOff className="w-3 h-3" />;
    const sourceLabel = (s: Source) => s === 'plan' ? 'Turno' : s === 'registro' ? 'Hora trabajada' : 'Ausencia';

    return (
        <div className="flex flex-col h-full overflow-hidden font-sans" style={{ background: 'var(--pr-bg)', color: 'var(--pr-fg)' }}>
            {/* Header */}
            <header className="grid grid-cols-[1fr_auto_1fr] items-center p-4" style={{ borderBottom: '1px solid var(--pr-bsub)', background: 'var(--pr-bg-deep)' }}>
                <div className="flex flex-col justify-self-start">
                    <h2 className="text-xl font-extrabold capitalize flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        <Calendar className="w-5 h-5" style={{ color: 'var(--pr-primary)' }} />
                        Calendario del Equipo
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--pr-fgm)' }}>Visualiza turnos, horas y ausencias de tus trabajadores.</p>
                </div>
                <div className="flex items-center gap-2 justify-self-center rounded-xl p-1.5" style={{ background: 'var(--pr-bg-card)', border: '1px solid var(--pr-border)' }}>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                        <ChevronLeft className="w-5 h-5" style={{ color: 'var(--pr-fgm)' }} />
                    </button>
                    <span className="capitalize font-bold px-2 min-w-[160px] text-center">{monthLabel}</span>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                        <ChevronRight className="w-5 h-5" style={{ color: 'var(--pr-fgm)' }} />
                    </button>
                </div>
                <div className="flex items-center gap-2 justify-self-end">
                    <button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold px-3 py-1.5 rounded-lg border hover:bg-white/5 cursor-pointer" style={{ borderColor: 'var(--pr-border)', color: 'var(--pr-fgm)' }}>Hoy</button>
                </div>
            </header>

            {/* Filtros */}
            <div className="flex items-center gap-3 px-4 py-3 flex-wrap" style={{ borderBottom: '1px solid var(--pr-bsub)' }}>
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: 'var(--pr-fgm)' }} />
                    <select value={filterEmpleado} onChange={e => setFilterEmpleado(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer">
                        <option value="">Todos los trabajadores</option>
                        {empleados.map(e => <option key={e.empleado_id} value={e.empleado_id}>{e.nombre_empleado}</option>)}
                    </select>
                </div>
                <div className="flex gap-1">
                    {([
                        { k: 'todos' as const, label: 'Todos' },
                        { k: 'plan' as const, label: 'Turnos' },
                        { k: 'registro' as const, label: 'Horas' },
                        { k: 'ausencia' as const, label: 'Ausencias' },
                    ]).map(f => (
                        <button key={f.k} onClick={() => setFilterSource(f.k)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterSource === f.k ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="text-xs ml-auto" style={{ color: 'var(--pr-fgs)' }}>{filteredEvents.length} eventos</div>
            </div>

            {/* Grid */}
            <div className="flex-1 flex flex-col overflow-hidden p-2 relative">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-[#1e2024] p-4 rounded-xl border border-gray-700">
                            <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-7 gap-px mb-px shrink-0" style={{ background: 'var(--pr-border)' }}>
                    {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(d => (
                        <div key={d} className="text-center text-[11px] font-extrabold uppercase tracking-[0.1em] py-3"
                            style={{ color: 'var(--pr-fgs)', background: 'var(--pr-bg-deep)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-px flex-1 overflow-hidden custom-scrollbar" style={{ background: 'var(--pr-border)', gridAutoRows: '1fr' }}>
                    {calendarDays.map(day => {
                        const dayEvs = eventsByDay[day.dateStr] || [];
                        const grupos = groupByEmpleado(dayEvs);
                        const cellBg = day.isCurrentMonth ? 'var(--pr-bg-card)' : 'var(--pr-bg-deep)';
                        const opacity = day.isCurrentMonth ? 1 : 0.5;
                        return (
                            <div key={day.dateStr} className="flex flex-col p-2 overflow-hidden min-h-0" style={{ background: cellBg, opacity }}>
                                <div className="flex items-center justify-between mb-1 shrink-0">
                                    <span className="text-[11px] font-extrabold w-6 h-6 flex items-center justify-center rounded-full"
                                        style={{ background: day.isToday ? 'var(--pr-primary)' : 'transparent', color: day.isToday ? '#fff' : 'var(--pr-fg)' }}>
                                        {day.dayNumber}
                                    </span>
                                    {grupos.length > 3 && (
                                        <button onClick={() => setSelectedDay(day.dateStr)}
                                            className="text-[10px] font-bold text-indigo-300 hover:text-white px-1.5 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 cursor-pointer">
                                            +{grupos.length - 3}
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 overflow-hidden">
                                    {grupos.slice(0, 3).map(g => (
                                        <button key={g.empleado_id} onClick={() => setSelectedDay(day.dateStr)}
                                            className={`flex items-center gap-1 px-1.5 py-1 rounded text-[10px] text-white truncate text-left cursor-pointer hover:brightness-110 ${g.color}`}
                                            title={`${g.nombre_empleado} · ${g.eventos.length} ${g.eventos.length === 1 ? 'evento' : 'eventos'}`}>
                                            <span className="font-bold truncate">{g.nombre_empleado}</span>
                                            {g.eventos.length > 1 && <span className="opacity-80 ml-auto shrink-0">×{g.eventos.length}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal detalle del dia */}
            {selectedDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDay(null)}>
                    <div className="bg-[#1e2024] border border-gray-700 p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-5 border-b border-gray-800 pb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-400" />
                                {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>
                            <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full p-1 cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            {groupByEmpleado(eventsByDay[selectedDay] || []).map(g => (
                                <div key={g.empleado_id} className="p-3 bg-black/30 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                        <span className={`w-3 h-3 rounded-full shrink-0 ${g.color}`} />
                                        <p className="text-sm font-bold text-white truncate flex-1">{g.nombre_empleado}</p>
                                        <span className="text-[10px] text-gray-500">{g.eventos.length} {g.eventos.length === 1 ? 'evento' : 'eventos'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        {g.eventos.map(ev => (
                                            <div key={ev.id} className="flex items-center gap-2 text-[11px] text-gray-300">
                                                <span className="text-gray-500">{sourceIcon(ev.source)}</span>
                                                <span className="font-medium text-gray-200">{sourceLabel(ev.source)}</span>
                                                <span className="text-gray-500">·</span>
                                                <span className="font-mono">{ev.detalle}</span>
                                                {ev.etiquetaName && <span className="text-amber-300 ml-1">· {ev.etiquetaName}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {(eventsByDay[selectedDay] || []).length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">Sin eventos</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
