'use client';
import { useState, useEffect } from 'react';
import { Clock, CalendarClock, AlertCircle, CheckCircle2, Briefcase, Loader2, CalendarOff, XCircle } from 'lucide-react';

import { API_BASE } from '@/app/lib/api';
import { useUser } from '@/app/hooks/useUser';
import { getEstadoStyle } from '@/app/lib/constants';
import { formatearHora, formatearFechaCorta } from '@/app/lib/dates';

interface ProximoTurno {
    id: string;
    fecha: string;
    inicio: string;
    fin: string;
    horas: number;
    estadoId: number;
    esDelLider: boolean;
}

export default function ResumePanel() {
    const { user } = useUser();
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
                if (!user) return;
                const userId = user.empleado_id;
                setNombreUsuario(user.nombre_empleado?.split(' ')[0] || 'usuario');

                const timestamp = Date.now();
                const [planRes, horasRes, asignacionesRes, ausenciasRes] = await Promise.all([
                    fetch(`${API_BASE}/planificacion/${userId}?t=${timestamp}`),
                    fetch(`${API_BASE}/hora/${userId}?t=${timestamp}`),
                    fetch(`${API_BASE}/asignaciones`),
                    fetch(`${API_BASE}/ausencias/${userId}?t=${timestamp}`),
                ]);

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
                                esDelLider: esDelLider,
                            });
                        }
                    });
                }

                let horasPendientes = 0;
                if (horasRes.ok) {
                    const horasData = await horasRes.json();
                    horasData.forEach((item: any) => {
                        if (item.estado_id === 1) horasPendientes++;
                    });
                }

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

                let ausPendientes = 0;
                let ausTotal = 0;
                if (ausenciasRes.ok) {
                    const ausData = await ausenciasRes.json();
                    if (Array.isArray(ausData)) {
                        ausTotal = ausData.length;
                        ausPendientes = ausData.filter((a: any) => a.requiere_aprobacion && a.estado_id === 1).length;
                    }
                }

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
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--pr-primary)' }} />
            </div>
        );
    }

    const STATS = [
        {
            label: 'Horas Pend.', val: pendientesHoras, sub: pendientesHoras > 0 ? 'planificaciones y registros' : 'al día',
            color: 'var(--pr-warn)', bg: 'rgba(245,158,11,.06)', border: 'rgba(245,158,11,.3)', icon: '⏱',
        },
        {
            label: 'Ausencias', val: totalAusencias, sub: pendientesAusencias > 0 ? `${pendientesAusencias} pendiente${pendientesAusencias > 1 ? 's' : ''}` : 'registradas',
            color: 'var(--pr-red)', bg: 'rgba(239,68,68,.06)', border: 'rgba(239,68,68,.3)', icon: '🚫',
        },
        {
            label: 'Equipos', val: pendientesEquipos, sub: 'proyectos',
            color: 'var(--pr-primary)', bg: 'rgba(124,58,237,.06)', border: 'rgba(124,58,237,.3)', icon: '👥',
        },
        {
            label: 'Aprobadas', val: totalAprobadas, sub: 'confirmadas',
            color: 'var(--pr-success)', bg: 'rgba(16,185,129,.06)', border: 'rgba(16,185,129,.3)', icon: '✓',
        },
    ];

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-7" style={{ background: 'var(--pr-bg)' }}>
            {/* Welcome banner */}
            <div className="rounded-2xl p-6 mb-6 flex items-center gap-4"
                style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,.18) 0%, rgba(109,40,217,.08) 100%)',
                    border: '1px solid rgba(124,58,237,.3)',
                }}>
                <div className="text-3xl">👋</div>
                <div>
                    <h1 className="text-2xl font-extrabold mb-1"
                        style={{ color: 'var(--pr-fg)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        ¡Hola, {nombreUsuario}!
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--pr-fgm)' }}>Aquí tienes el resumen de tu actividad.</p>
                </div>
            </div>

            {/* Widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {STATS.map((s) => (
                    <div key={s.label} className="rounded-2xl p-5 relative overflow-hidden"
                        style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                        <div className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none"
                            style={{ background: `${s.color}20`, filter: 'blur(30px)' }}></div>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm mb-3"
                            style={{ background: `${s.color}20`, color: s.color }}>
                            {s.icon}
                        </div>
                        <div className="text-3xl font-extrabold mb-1"
                            style={{ color: s.color, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                            {s.val}
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-1"
                            style={{ color: 'var(--pr-fgs)' }}>{s.label}</p>
                        <p className="text-[11px]" style={{ color: 'var(--pr-fgm)' }}>{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Próximos Turnos */}
            <div className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--pr-bg-card)', border: '1px solid var(--pr-bsub)' }}>
                <div className="flex items-center gap-2 px-5 py-4"
                    style={{ borderBottom: '1px solid var(--pr-bsub)' }}>
                    <CalendarClock className="w-4 h-4" style={{ color: 'var(--pr-primary)' }} />
                    <h3 className="text-sm font-bold uppercase tracking-wider"
                        style={{ color: 'var(--pr-fg)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        Próximos Turnos
                    </h3>
                </div>

                <div>
                    {proximosTurnos.length > 0 ? (
                        proximosTurnos.map((turno, idx) => {
                            const esHoy = formatearFechaCorta(turno.fecha) === 'Hoy';
                            const ei = getEstadoStyle(turno.estadoId);
                            return (
                                <div
                                    key={turno.id}
                                    className="relative flex items-center gap-4 px-5 py-3.5 transition-colors"
                                    style={{ borderTop: idx > 0 ? '1px solid var(--pr-bsub)' : 'none' }}
                                >
                                    <span className={`absolute left-0 top-0 bottom-0 w-1 ${ei.barColor}`}></span>

                                    <div className="pl-2 text-center min-w-[55px]">
                                        <span className="text-[10px] font-bold uppercase"
                                            style={{ color: esHoy ? 'var(--pr-warn)' : 'var(--pr-fgs)' }}>
                                            {formatearFechaCorta(turno.fecha)}
                                        </span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5" style={{ color: 'var(--pr-fgm)' }} />
                                            <span className="text-sm font-medium" style={{ color: 'var(--pr-fg)' }}>
                                                {formatearHora(turno.inicio)}
                                                {turno.fin ? ` — ${formatearHora(turno.fin)}` : ''}
                                            </span>
                                            <span className="text-xs font-medium" style={{ color: 'var(--pr-primary)' }}>
                                                {turno.horas.toFixed(1).replace(/\.0$/, '')}h
                                            </span>
                                        </div>
                                        {turno.esDelLider && (
                                            <span className="text-[10px] mt-0.5 inline-block" style={{ color: 'var(--pr-pink)' }}>
                                                Asignado por líder
                                            </span>
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
                        <div className="text-center py-12 px-6">
                            <CalendarClock className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--pr-fgs)' }} />
                            <p className="text-sm" style={{ color: 'var(--pr-fgm)' }}>No tienes turnos próximos planificados.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
