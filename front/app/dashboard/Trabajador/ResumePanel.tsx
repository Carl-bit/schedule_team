'use client';
import { useState, useEffect } from 'react';
import { Clock, CalendarClock, Users, AlertCircle, CheckCircle2, Briefcase, Loader2, CalendarOff, XCircle } from 'lucide-react';

import { API_BASE } from '@/app/lib/api';

interface ProximoTurno {
    id: string;
    fecha: string;
    inicio: string;
    fin: string;
    horas: number;
    estadoId: number;
    esDelLider: boolean;
}

const getEstadoTurno = (estadoId: number) => {
    switch (estadoId) {
        case 1: return { label: 'Pendiente', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', barColor: 'bg-amber-500' };
        case 2: return { label: 'Aprobado', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', barColor: 'bg-emerald-500' };
        case 3: return { label: 'Corrección', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', barColor: 'bg-orange-500' };
        case 4: return { label: 'En Revisión', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', barColor: 'bg-sky-500' };
        case 5: return { label: 'Rechazado', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', barColor: 'bg-red-500' };
        default: return { label: 'Desconocido', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', barColor: 'bg-gray-500' };
    }
};

export default function ResumePanel() {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [proximosTurnos, setProximosTurnos] = useState<ProximoTurno[]>([]);
    const [pendientesHoras, setPendientesHoras] = useState(0);
    const [pendientesEquipos, setPendientesEquipos] = useState(0);
    const [pendientesAusencias, setPendientesAusencias] = useState(0);
    const [totalAusencias, setTotalAusencias] = useState(0);
    const [totalAprobadas, setTotalAprobadas] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchResumen = async () => {
            try {
                setIsLoading(true);
                const storedData = localStorage.getItem('user_data');
                if (!storedData) return;
                const userData = JSON.parse(storedData);
                const userId = userData.empleado_id;
                setNombreUsuario(userData.nombre_empleado?.split(' ')[0] || 'usuario');

                const timestamp = Date.now();
                const [planRes, horasRes, asignacionesRes, ausenciasRes] = await Promise.all([
                    fetch(`${API_BASE}/planificacion/${userId}?t=${timestamp}`),
                    fetch(`${API_BASE}/hora/${userId}?t=${timestamp}`),
                    fetch(`${API_BASE}/asignaciones`),
                    fetch(`${API_BASE}/ausencias/${userId}?t=${timestamp}`)
                ]);

                // --- Planificaciones ---
                let plansPendientes = 0;
                let plansAprobadas = 0;
                const turnos: ProximoTurno[] = [];
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);

                if (planRes.ok) {
                    const planData = await planRes.json();
                    planData.forEach((item: any) => {
                        const inicio = new Date(item.inicio_turno);
                        const fin = item.fin_turno ? new Date(item.fin_turno) : null;
                        const horas = fin ? (fin.getTime() - inicio.getTime()) / (1000 * 3600) : 0;
                        const esDelLider = item.creado_por && item.creado_por !== userId;

                        if (item.estado_id === 1) plansPendientes++;
                        if (item.estado_id === 2) plansAprobadas++;

                        // Solo turnos futuros o de hoy
                        const fechaTurno = new Date(item.inicio_turno);
                        fechaTurno.setHours(0, 0, 0, 0);
                        if (fechaTurno >= hoy) {
                            turnos.push({
                                id: item.plan_id,
                                fecha: item.inicio_turno,
                                inicio: item.inicio_turno,
                                fin: item.fin_turno,
                                horas: Math.max(0, horas),
                                estadoId: item.estado_id || 1,
                                esDelLider: esDelLider
                            });
                        }
                    });
                }

                // --- Horas registradas pendientes ---
                let horasPendientes = 0;
                if (horasRes.ok) {
                    const horasData = await horasRes.json();
                    horasData.forEach((item: any) => {
                        if (item.estado_id === 1) horasPendientes++;
                    });
                }

                // --- Equipos del usuario ---
                let equiposCount = 0;
                if (asignacionesRes.ok) {
                    const asignaciones = await asignacionesRes.json();
                    const proyectosSet = new Set<string>();
                    asignaciones.forEach((item: any) => {
                        if (item.empleado_id === userId) {
                            proyectosSet.add(item.proyecto_id);
                        }
                    });
                    equiposCount = proyectosSet.size;
                }

                // --- Ausencias (separadas de horas) ---
                let ausPendientes = 0;
                let ausTotal = 0;
                if (ausenciasRes.ok) {
                    const ausData = await ausenciasRes.json();
                    if (Array.isArray(ausData)) {
                        ausTotal = ausData.length;
                        ausPendientes = ausData.filter((a: any) => a.requiere_aprobacion && a.estado_id === 1).length;
                    }
                }

                // Ordenar turnos por fecha
                turnos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

                setPendientesHoras(plansPendientes + horasPendientes);
                setPendientesEquipos(equiposCount);
                setTotalAprobadas(plansAprobadas);
                setPendientesAusencias(ausPendientes);
                setTotalAusencias(ausTotal);
                setProximosTurnos(turnos.slice(0, 5));
            } catch (err) {
                console.error('Error cargando resumen:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResumen();
    }, []);

    const formatearHora = (fechaStr: string) => {
        return new Date(fechaStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const formatearFechaCorta = (fechaStr: string) => {
        const date = new Date(fechaStr);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaTurno = new Date(date);
        fechaTurno.setHours(0, 0, 0, 0);

        if (fechaTurno.getTime() === hoy.getTime()) return 'Hoy';

        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        if (fechaTurno.getTime() === manana.getTime()) return 'Mañana';

        return date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
            {/* Bienvenida */}
            <div className="bg-gradient-to-r from-indigo-900/40 to-violet-900/40 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                <h1 className="text-2xl font-bold text-white mb-1">¡Hola, {nombreUsuario}! 👋</h1>
                <p className="text-gray-300 text-sm">Aquí tienes el resumen de tu actividad.</p>
            </div>

            {/* Widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Horas Pendientes */}
                <div className="bg-[#1e2336]/80 backdrop-blur-md p-5 rounded-2xl border border-[#3b4256]/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-amber-500/10 p-2 rounded-lg">
                            <Clock className="w-4 h-4 text-amber-400" />
                        </div>
                        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold">Horas Pend.</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-amber-400">{pendientesHoras}</span>
                        <span className="text-xs text-gray-500 mb-1">solicitudes</span>
                    </div>
                    {pendientesHoras > 0 && (
                        <p className="text-[10px] text-amber-500/60 mt-2">Planificaciones y registros pendientes</p>
                    )}
                </div>

                {/* Ausencias */}
                <div className="bg-[#1e2336]/80 backdrop-blur-md p-5 rounded-2xl border border-[#3b4256]/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-rose-500/10 p-2 rounded-lg">
                            <CalendarOff className="w-4 h-4 text-rose-400" />
                        </div>
                        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold">Ausencias</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-rose-400">{totalAusencias}</span>
                        <span className="text-xs text-gray-500 mb-1">registradas</span>
                    </div>
                    {pendientesAusencias > 0 && (
                        <p className="text-[10px] text-rose-500/60 mt-2">{pendientesAusencias} pendiente{pendientesAusencias > 1 ? 's' : ''} de aprobación</p>
                    )}
                </div>

                {/* Equipos Asignados */}
                <div className="bg-[#1e2336]/80 backdrop-blur-md p-5 rounded-2xl border border-[#3b4256]/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-indigo-500/10 p-2 rounded-lg">
                            <Briefcase className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold">Equipos</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-indigo-300">{pendientesEquipos}</span>
                        <span className="text-xs text-gray-500 mb-1">proyectos</span>
                    </div>
                </div>

                {/* Aprobadas */}
                <div className="bg-[#1e2336]/80 backdrop-blur-md p-5 rounded-2xl border border-[#3b4256]/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-emerald-500/10 p-2 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold">Aprobadas</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-emerald-400">{totalAprobadas}</span>
                        <span className="text-xs text-gray-500 mb-1">confirmadas</span>
                    </div>
                </div>
            </div>

            {/* Próximos Turnos */}
            <div className="bg-[#1e2336]/80 backdrop-blur-md rounded-2xl border border-[#3b4256]/50 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
                    <CalendarClock className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Próximos Turnos</h3>
                </div>

                <div className="p-4 flex flex-col gap-2">
                    {proximosTurnos.length > 0 ? (
                        proximosTurnos.map((turno) => {
                            const esHoy = formatearFechaCorta(turno.fecha) === 'Hoy';
                            const ei = getEstadoTurno(turno.estadoId);
                            return (
                                <div
                                    key={turno.id}
                                    className={`relative flex items-center gap-4 p-3 rounded-xl border transition-all ${
                                        esHoy
                                            ? 'bg-indigo-900/20 border-indigo-700/50'
                                            : 'bg-black/20 border-white/5 hover:border-white/10'
                                    }`}
                                >
                                    <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${ei.barColor}`}></span>

                                    <div className="pl-2 text-center min-w-[55px]">
                                        <span className={`text-[10px] font-bold uppercase ${esHoy ? 'text-amber-400' : 'text-gray-500'}`}>
                                            {formatearFechaCorta(turno.fecha)}
                                        </span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                                            <span className="text-sm text-white font-medium">
                                                {formatearHora(turno.inicio)}
                                                {turno.fin ? ` — ${formatearHora(turno.fin)}` : ''}
                                            </span>
                                            <span className="text-xs text-indigo-300 font-medium">
                                                {turno.horas.toFixed(1).replace(/\.0$/, '')}h
                                            </span>
                                        </div>
                                        {turno.esDelLider && (
                                            <span className="text-[10px] text-violet-400 mt-0.5 inline-block">Asignado por líder</span>
                                        )}
                                    </div>

                                    <div className={`flex items-center gap-1 ${ei.bg} ${ei.color} px-2 py-1 rounded-full text-[10px] font-bold border ${ei.border}`}>
                                        {turno.estadoId === 2 ? (
                                            <CheckCircle2 className="w-3 h-3" />
                                        ) : turno.estadoId === 5 ? (
                                            <XCircle className="w-3 h-3" />
                                        ) : (
                                            <AlertCircle className="w-3 h-3" />
                                        )}
                                        {ei.label}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8">
                            <CalendarClock className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No tienes turnos próximos planificados.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}