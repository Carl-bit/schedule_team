import React, { useState, useEffect } from 'react';
import { Clock, Calendar, X, CheckCircle2, AlertCircle } from 'lucide-react';
import StatsDateRangePicker from './StatsDateRangePicker';

import { API_BASE } from '@/app/lib/api';

// Reusing interfaces from CalendarPanel for typings
type ShiftType = 'work' | 'replacement' | 'vacation' | 'unavailable' | 'pattern';

interface ShiftLabel {
    id: string;
    name: string;
    timeRange: string;
    color: string;
    type: ShiftType;
}

interface AssignedShift {
    id: string;
    dateStr: string;
    labelId: string;
    status: 'pending' | 'approved';
    hours: number;
    source: 'plan' | 'registro';
}

export default function StatsPanel({ empleado_id = 'USER_ANA', labels = [] }: { empleado_id?: string, labels?: ShiftLabel[] }) {
    const [assignments, setAssignments] = useState<AssignedShift[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDayDetails, setSelectedDayDetails] = useState<string | null>(null);

    const [filterStartDate, setFilterStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [filterEndDate, setFilterEndDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        d.setDate(0);
        return d.toISOString().split('T')[0];
    });

    // We should ideally pass assignments from the parent or a global state,
    // but if StatsPanel is independent, it fetches its own data.
    useEffect(() => {
        const fetchStatsData = async () => {
            setIsLoading(true);
            try {
                const timestamp = Date.now();
                const [planRes, horaRes] = await Promise.all([
                    fetch(`${API_BASE}/planificacion/${empleado_id}?t=${timestamp}`),
                    fetch(`${API_BASE}/hora/${empleado_id}?t=${timestamp}`)
                ]);

                let allMapped: AssignedShift[] = [];

                if (planRes.ok) {
                    const planData = await planRes.json();
                    const mappedPlan = planData.map((item: any) => {
                        const date = new Date(item.inicio_turno);
                        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

                        let baseDiffH = 0;
                        if (item.fin_turno) {
                            const fin = new Date(item.fin_turno);
                            const flatStart = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), 0));
                            const flatEnd = new Date(Date.UTC(fin.getFullYear(), fin.getMonth(), fin.getDate(), fin.getHours(), fin.getMinutes(), 0));
                            baseDiffH = (flatEnd.getTime() - flatStart.getTime()) / (1000 * 3600);
                        }

                        return {
                            id: item.plan_id,
                            dateStr: dateStr,
                            labelId: '1',
                            status: item.estado_id === 2 ? 'approved' : 'pending' as const,
                            hours: baseDiffH > 0 ? baseDiffH : 0,
                            source: 'plan' as const
                        };
                    });
                    allMapped = [...allMapped, ...mappedPlan];
                }

                if (horaRes.ok) {
                    const horaData = await horaRes.json();
                    const mappedHora = horaData.map((item: any) => {
                        const date = new Date(item.inicio_trabajo);
                        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

                        let baseDiffH = 0;
                        if (item.fin_trabajo) {
                            const fin = new Date(item.fin_trabajo);
                            const flatStart = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), 0));
                            const flatEnd = new Date(Date.UTC(fin.getFullYear(), fin.getMonth(), fin.getDate(), fin.getHours(), fin.getMinutes(), 0));
                            baseDiffH = (flatEnd.getTime() - flatStart.getTime()) / (1000 * 3600);
                        } else {
                            const now = new Date();
                            const flatStart = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), 0));
                            const flatEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0));
                            baseDiffH = (flatEnd.getTime() - flatStart.getTime()) / (1000 * 3600);
                        }

                        return {
                            id: item.registro_id,
                            dateStr: dateStr,
                            labelId: 'WORKED_HOUR',
                            status: item.estado_id === 1 ? 'pending' : 'approved' as const,
                            hours: baseDiffH > 0 ? baseDiffH : 0,
                            source: 'registro' as const
                        };
                    });
                    allMapped = [...allMapped, ...mappedHora];
                }

                setAssignments(allMapped);
            } catch (err) {
                console.error("Error cargando estadísticas", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatsData();

        window.addEventListener('scheduleUpdated', fetchStatsData);
        return () => {
            window.removeEventListener('scheduleUpdated', fetchStatsData);
        };
    }, [empleado_id]);

    // CÁLCULOS
    const filteredAssignments = assignments.filter(a => {
        if (!filterStartDate || !filterEndDate) return true;
        return a.dateStr >= filterStartDate && a.dateStr <= filterEndDate;
    });

    const plannedAssignments = filteredAssignments.filter(a => a.source === 'plan');
    const horasPlanificadas = plannedAssignments.filter(a => a.status === 'approved').reduce((acc, a) => acc + a.hours, 0);

    const workedAssignments = filteredAssignments.filter(a => a.source === 'registro' && a.status === 'approved');
    const horasTrabajadas = workedAssignments.reduce((acc, a) => acc + a.hours, 0);

    const horasPendientes = filteredAssignments.filter(a => a.status === 'pending').reduce((acc, a) => acc + a.hours, 0);

    // Helpers for Upcoming Shifts
    const formatDateStr = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    return (
        <div className="w-full h-full flex flex-col overflow-hidden"
            style={{ background: 'var(--pr-bg-deep)', borderRight: '1px solid var(--pr-bsub)' }}>
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">

                {/* ESTADÍSTICAS */}
                <div className="flex flex-col gap-2 relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center"
                            style={{ background: 'rgba(15,19,32,0.85)' }}>
                            <div className="w-6 h-6 border-2 rounded-full animate-spin"
                                style={{ borderColor: 'var(--pr-primary)', borderTopColor: 'transparent' }}></div>
                        </div>
                    )}

                    <p className="text-xs font-extrabold uppercase tracking-[0.1em] flex items-center gap-2 px-5 pt-6 pb-3"
                        style={{ color: 'var(--pr-fgs)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        <Clock className="w-4 h-4" />
                        Resumen del mes
                    </p>

                    <div className="mx-4 mb-3 p-3.5 rounded-xl"
                        style={{ background: 'var(--pr-bg-card)', border: '1px solid var(--pr-bsub)' }}>
                        <label className="text-[10px] font-bold uppercase block mb-2" style={{ color: 'var(--pr-fgs)' }}>
                            Rango de Filtro
                        </label>
                        <StatsDateRangePicker
                            startDate={filterStartDate}
                            endDate={filterEndDate}
                            onChange={(start, end) => {
                                setFilterStartDate(start);
                                setFilterEndDate(end);
                            }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 px-4 pb-3">
                        <div className="p-4 rounded-xl"
                            style={{ background: 'var(--pr-bg-card)', border: '1px solid var(--pr-bsub)' }}>
                            <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pr-fgs)' }}>
                                Planificadas
                            </div>
                            <div className="text-2xl font-extrabold" style={{ color: 'var(--pr-primary)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                                {Number(horasPlanificadas).toFixed(1).replace(/\.0$/, '')}h
                            </div>
                        </div>

                        <div className="p-4 rounded-xl"
                            style={{ background: 'var(--pr-bg-card)', border: '1px solid var(--pr-bsub)' }}>
                            <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pr-fgs)' }}>
                                Trabajadas
                            </div>
                            <div className="text-2xl font-extrabold" style={{ color: 'var(--pr-success)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                                {Number(horasTrabajadas).toFixed(1).replace(/\.0$/, '')}h
                            </div>
                        </div>
                    </div>

                    <div className="mx-4 mb-3 p-4 rounded-xl"
                        style={{ background: 'var(--pr-bg-card)', border: '1px solid var(--pr-bsub)' }}>
                        <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pr-fgs)' }}>
                            Por revisar (pendientes)
                        </div>
                        <div className="text-2xl font-extrabold" style={{ color: 'var(--pr-warn)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                            {Number(horasPendientes).toFixed(1).replace(/\.0$/, '')}h
                        </div>
                    </div>
                </div>

                <div className="h-px mx-4" style={{ background: 'var(--pr-bsub)' }}></div>

                {/* PRÓXIMOS EVENTOS */}
                <div className="flex flex-col">
                    <p className="text-xs font-extrabold uppercase tracking-[0.1em] flex items-center gap-2 px-5 pt-5 pb-3"
                        style={{ color: 'var(--pr-fgs)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        <Calendar className="w-4 h-4" />
                        Próximos turnos
                    </p>

                    {plannedAssignments
                        .filter(a => new Date(a.dateStr) >= new Date(new Date().setHours(0, 0, 0, 0)))
                        .sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime())
                        .slice(0, 5)
                        .map(a => {
                            const eventDate = new Date(a.dateStr + "T12:00:00");
                            const isToday = formatDateStr(eventDate) === formatDateStr(new Date());
                            const dotColor = isToday ? 'var(--pr-warn)' : 'var(--pr-success)';

                            return (
                                <div
                                    key={'upcoming-' + a.id}
                                    onClick={() => setSelectedDayDetails(a.dateStr)}
                                    className="px-5 py-3 cursor-pointer transition-colors hover:bg-white/5"
                                    style={{ borderTop: '1px solid var(--pr-bsub)' }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                                            style={{ background: dotColor }}></div>
                                        <div>
                                            <div className="text-sm font-bold" style={{ color: 'var(--pr-fg)' }}>
                                                Turno Planificado
                                            </div>
                                            <div className="text-xs mt-0.5" style={{ color: 'var(--pr-fgm)' }}>
                                                {isToday ? 'Hoy' : eventDate.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                                                {a.hours > 0 ? ` · ${a.hours.toFixed(1).replace(/\.0$/, '')}h` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    }

                    {plannedAssignments.filter(a => new Date(a.dateStr) >= new Date(new Date().setHours(0, 0, 0, 0))).length === 0 && !isLoading && (
                        <div className="px-5 pb-3 text-xs italic" style={{ color: 'var(--pr-fgs)' }}>
                            Sin turnos próximos.
                        </div>
                    )}
                </div>

                <div className="flex-1"></div>
            </div>

            {/* DETALLES DEL DÍA SELECCIONADO (Modal) */}
            {selectedDayDetails && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <div className="p-6 rounded-2xl max-w-md w-full mx-4 flex flex-col"
                        style={{ background: 'var(--pr-bg-card)', border: '1px solid var(--pr-border)', boxShadow: '0 24px 60px rgba(0,0,0,.6)' }}>
                        <div className="flex justify-between items-center mb-5 pb-4" style={{ borderBottom: '1px solid var(--pr-bsub)' }}>
                            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--pr-fg)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                                <Calendar className="w-5 h-5" style={{ color: 'var(--pr-primary)' }} />
                                Eventos del {new Date(selectedDayDetails + "T12:00:00").toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>
                            <button
                                onClick={() => setSelectedDayDetails(null)}
                                className="rounded-full p-1.5 transition-colors hover:text-white cursor-pointer"
                                style={{ background: 'var(--pr-bsub)', color: 'var(--pr-fgm)' }}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 pb-2">
                            {assignments.filter(a => a.dateStr === selectedDayDetails).map(assignment => {
                                const isWorked = assignment.labelId === 'WORKED_HOUR';
                                const accent = isWorked ? 'var(--pr-success)' : 'var(--pr-cyan)';
                                const name = isWorked ? 'Registro (BD)' : 'Planificado (BD)';
                                const timeStr = 'Visualizado según BD';

                                return (
                                    <div key={'detail-' + assignment.id} className="relative flex items-center gap-3 p-3 rounded-xl transition-colors"
                                        style={{ background: 'var(--pr-bg-deep)', border: '1px solid var(--pr-bsub)' }}>
                                        <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                                            style={{ background: accent }}></span>

                                        <div className="flex flex-col flex-1 pl-3">
                                            <span className="text-sm font-bold mb-0.5" style={{ color: 'var(--pr-fg)' }}>{name}</span>
                                            <span className="text-[11px] font-medium flex items-center gap-1.5" style={{ color: 'var(--pr-fgm)' }}>
                                                <Clock className="w-3.5 h-3.5" style={{ color: 'var(--pr-primary)' }} />
                                                {timeStr}
                                            </span>
                                        </div>

                                        <div className="flex shrink-0">
                                            {assignment.status === 'pending' ? (
                                                <div title="Pendiente" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                                                    style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--pr-warn)' }}>
                                                    <AlertCircle className="w-3 h-3" /> Pendiente
                                                </div>
                                            ) : (
                                                <div title="Aprobado" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                                                    style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--pr-success)' }}>
                                                    <CheckCircle2 className="w-3 h-3" /> Aprobado
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 pt-4 flex justify-end" style={{ borderTop: '1px solid var(--pr-bsub)' }}>
                            <button onClick={() => setSelectedDayDetails(null)} className="px-5 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer hover:text-white"
                                style={{ background: 'var(--pr-bsub)', color: 'var(--pr-fgm)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}