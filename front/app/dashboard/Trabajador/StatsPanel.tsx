import React, { useState, useEffect } from 'react';
import { Clock, Calendar, X, CheckCircle2, AlertCircle } from 'lucide-react';
import StatsDateRangePicker from './StatsDateRangePicker';

const API_BASE = 'http://localhost:3000/api';

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
        <div className="w-full h-full flex flex-col bg-[#0f1115]/80 overflow-hidden rounded-xl border border-gray-800/60 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-6">

                {/* ESTADÍSTICAS */}
                <div className="flex flex-col gap-3 relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-[#0f1115]/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        Resumen del Mes
                    </h4>

                    <div className="flex flex-col gap-2 mb-1 bg-[#1a1c20] p-3 rounded-xl border border-gray-800/80">
                        <label className="text-[10px] text-gray-400 font-bold uppercase">Rango de Filtro</label>
                        <StatsDateRangePicker
                            startDate={filterStartDate}
                            endDate={filterEndDate}
                            onChange={(start, end) => {
                                setFilterStartDate(start);
                                setFilterEndDate(end);
                            }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#1a1c20] p-3 rounded-xl border border-gray-800/80 shadow-md flex flex-col items-center justify-center">
                            <span className="text-[10px] text-gray-400 font-bold uppercase mb-1 text-center">Planificadas</span>
                            <span className="text-xl font-black text-indigo-300">{Number(horasPlanificadas).toFixed(1).replace(/\.0$/, '')}h</span>
                        </div>

                        <div className="bg-[#1a1c20] p-3 rounded-xl border border-gray-800/80 shadow-md flex flex-col items-center justify-center">
                            <span className="text-[10px] text-gray-400 font-bold uppercase mb-1 text-center">Trabajadas</span>
                            <span className="text-xl font-black text-emerald-400">{Number(horasTrabajadas).toFixed(1).replace(/\.0$/, '')}h</span>
                        </div>

                        <div className="bg-[#1a1c20] p-3 rounded-xl border border-gray-800/80 shadow-md flex flex-col items-center justify-center col-span-2">
                            <span className="text-[10px] text-gray-400 font-bold uppercase mb-1 text-center">Por Revisar (Pendientes)</span>
                            <span className="text-xl font-black text-amber-500">{Number(horasPendientes).toFixed(1).replace(/\.0$/, '')}h</span>
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-gray-800/50"></div>

                {/* PRÓXIMOS EVENTOS */}
                <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        Próximos Turnos
                    </h4>

                    <div className="flex flex-col gap-2 relative">
                        <div className="absolute left-2.5 top-2 bottom-2 w-px bg-gray-800"></div>

                        {plannedAssignments
                            .filter(a => new Date(a.dateStr) >= new Date(new Date().setHours(0, 0, 0, 0)))
                            .sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime())
                            .slice(0, 5) // Mostrar los próximos 5
                            .map(a => {
                                const eventDate = new Date(a.dateStr + "T12:00:00");
                                const isToday = formatDateStr(eventDate) === formatDateStr(new Date());

                                return (
                                    <div
                                        key={'upcoming-' + a.id}
                                        onClick={() => setSelectedDayDetails(a.dateStr)}
                                        className="relative flex gap-3 pl-7 items-center group cursor-pointer"
                                    >
                                        <div className={`absolute left-1.5 w-2 h-2 rounded-full border-2 border-[#0f1115] shadow-sm z-10
                      ${isToday ? 'bg-amber-500 ring-2 ring-amber-500/30' : 'bg-indigo-500'}
                    `}></div>

                                        <div className={`flex-1 p-2.5 rounded-lg border flex flex-col gap-0.5 transition-colors
                       ${isToday ? 'bg-indigo-900/20 border-indigo-700/50' : 'bg-[#1a1c20] border-gray-800/60 group-hover:border-gray-500'}
                    `}>
                                            <span className={`text-[10px] uppercase font-bold tracking-wider ${isToday ? 'text-amber-400' : 'text-gray-400'}`}>
                                                {isToday ? 'HOY' : eventDate.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                                            </span>
                                            <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">Turno Planificado</span>
                                            <span className="text-[10px] text-gray-400 group-hover:text-white flex items-center gap-1 transition-colors">
                                                <Clock className="w-3 h-3" /> Ver Detalle
                                            </span>
                                        </div>
                                    </div>
                                )
                            })
                        }

                        {plannedAssignments.filter(a => new Date(a.dateStr) >= new Date(new Date().setHours(0, 0, 0, 0))).length === 0 && !isLoading && (
                            <div className="pl-7 text-xs text-gray-500 italic py-2">
                                No tienes turnos próximos planificados.
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* DETALLES DEL DÍA SELECCIONADO (Modal) */}
            {selectedDayDetails && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1e2024] border border-gray-700 p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 flex flex-col">
                        <div className="flex justify-between items-center mb-5 border-b border-gray-800 pb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-400" />
                                Eventos del {new Date(selectedDayDetails + "T12:00:00").toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>
                            <button
                                onClick={() => setSelectedDayDetails(null)}
                                className="text-gray-400 hover:text-white transition-colors cursor-pointer bg-gray-800 hover:bg-gray-700 rounded-full p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 pb-2">
                            {assignments.filter(a => a.dateStr === selectedDayDetails).map(assignment => {
                                const isWorked = assignment.labelId === 'WORKED_HOUR';
                                const color = isWorked ? 'bg-emerald-600' : 'bg-cyan-600';
                                const name = isWorked ? 'Registro (BD)' : 'Planificado (BD)';
                                const timeStr = isWorked ? 'Visualizado según BD' : 'Visualizado según BD';

                                return (
                                    <div key={'detail-' + assignment.id} className="relative flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-gray-700/50 group hover:border-gray-500 transition-colors">
                                        <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${color} opacity-90`}></span>

                                        <div className="flex flex-col flex-1 pl-4">
                                            <span className="text-sm font-bold text-white mb-0.5">{name}</span>
                                            <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-indigo-400/80" />
                                                {timeStr}
                                            </span>
                                        </div>

                                        <div className="flex shrink-0">
                                            {assignment.status === 'pending' ? (
                                                <div title="Pendiente de aprobación" className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-500/20">
                                                    <AlertCircle className="w-3 h-3" /> Pendiente
                                                </div>
                                            ) : (
                                                <div title="Aprobado" className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3 h-3" /> Aprobado
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-800 flex justify-end">
                            <button onClick={() => setSelectedDayDetails(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}