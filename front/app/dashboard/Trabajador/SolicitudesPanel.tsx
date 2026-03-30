'use client';
import { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle2, AlertCircle, XCircle, Briefcase, CalendarClock, Loader2, CalendarOff, ShieldCheck, ClipboardList, MessageSquare, Check, X } from 'lucide-react';

import { API_BASE } from '@/app/lib/api';
import { useUser } from '@/app/hooks/useUser';
import type { Asignacion, Ausencia, SolicitudCobertura } from '@/app/types';

interface ProyectoSolicitud {
    proyecto_id: string;
    nombre_proyecto: string;
    cliente: string | null;
    fecha_inicio: string | null;
    fecha_entrega: string | null;
    rol_usuario: string;
    totalMiembros: number;
}

interface SolicitudHora {
    id: string;
    tipo: 'planificacion' | 'registro';
    inicio: string;
    fin: string | null;
    estado_id: number;
    horas: number;
    esDelLider: boolean;
}


type TabActivo = 'coberturas' | 'equipos' | 'horas' | 'ausencias';
type FiltroHoras = 'todos' | 'pendientes' | 'aprobadas' | 'mis_solicitudes' | 'del_lider';
type FiltroAusencias = 'todas' | 'pendientes' | 'aprobadas' | 'registros';

export default function SolicitudesPanel() {
    const { user } = useUser();
    const [tabActivo, setTabActivo] = useState<TabActivo>('coberturas');
    const [proyectos, setProyectos] = useState<ProyectoSolicitud[]>([]);
    const [solicitudesHoras, setSolicitudesHoras] = useState<SolicitudHora[]>([]);
    const [ausencias, setAusencias] = useState<Ausencia[]>([]);
    const [coberturas, setCoberturas] = useState<SolicitudCobertura[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtroHoras, setFiltroHoras] = useState<FiltroHoras>('todos');
    const [filtroAusencias, setFiltroAusencias] = useState<FiltroAusencias>('todas');
    const [actualizandoId, setActualizandoId] = useState<string | null>(null);

    // Modal rechazo
    const [rechazarSolicitud, setRechazarSolicitud] = useState<SolicitudCobertura | null>(null);
    const [motivoRechazoText, setMotivoRechazoText] = useState('');

    const getUserId = (): string | null => {
        return user?.empleado_id || null;
    };

    // --- Fetch de datos ---
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError('');
                const userId = user.empleado_id;

                const timestamp = Date.now();

                const [asignacionesRes, planRes, horasRes, ausenciasRes, coberturasRes] = await Promise.all([
                    fetch(`${API_BASE}/asignaciones`),
                    fetch(`${API_BASE}/planificacion/${userId}?t=${timestamp}`),
                    fetch(`${API_BASE}/hora/${userId}?t=${timestamp}`),
                    fetch(`${API_BASE}/ausencias/${userId}?t=${timestamp}`),
                    fetch(`${API_BASE}/solicitudes/empleado/${userId}?t=${timestamp}`)
                ]);

                // --- Procesar Asignaciones (Equipos) ---
                if (asignacionesRes.ok) {
                    const data: Asignacion[] = await asignacionesRes.json();
                    const mapProyectos = new Map<string, ProyectoSolicitud>();

                    data.forEach((item) => {
                        if (!mapProyectos.has(item.proyecto_id)) {
                            mapProyectos.set(item.proyecto_id, {
                                proyecto_id: item.proyecto_id,
                                nombre_proyecto: item.nombre_proyecto,
                                cliente: item.cliente,
                                fecha_inicio: item.fecha_inicio,
                                fecha_entrega: item.fecha_entrega,
                                rol_usuario: '',
                                totalMiembros: 0
                            });
                        }
                        const proj = mapProyectos.get(item.proyecto_id)!;
                        proj.totalMiembros++;
                        if (item.empleado_id === userId) {
                            proj.rol_usuario = item.rol_trabajo;
                        }
                    });

                    const misProyectos = Array.from(mapProyectos.values()).filter(p => p.rol_usuario !== '');
                    setProyectos(misProyectos);
                }

                // --- Procesar Horas ---
                const allHoras: SolicitudHora[] = [];

                if (planRes.ok) {
                    const planData = await planRes.json();
                    planData.forEach((item: any) => {
                        const inicio = new Date(item.inicio_turno);
                        const fin = item.fin_turno ? new Date(item.fin_turno) : null;
                        let horas = 0;
                        if (fin) {
                            horas = (fin.getTime() - inicio.getTime()) / (1000 * 3600);
                        }
                        const esDelLider = item.creado_por && item.creado_por !== userId;
                        allHoras.push({
                            id: item.plan_id,
                            tipo: 'planificacion',
                            inicio: item.inicio_turno,
                            fin: item.fin_turno,
                            estado_id: item.estado_id,
                            horas: Math.max(0, horas),
                            esDelLider: !!esDelLider
                        });
                    });
                }

                if (horasRes.ok) {
                    const horasData = await horasRes.json();
                    horasData.forEach((item: any) => {
                        const inicio = new Date(item.inicio_trabajo);
                        const fin = item.fin_trabajo ? new Date(item.fin_trabajo) : null;
                        let horas = 0;
                        if (fin) {
                            horas = (fin.getTime() - inicio.getTime()) / (1000 * 3600);
                        } else {
                            horas = (Date.now() - inicio.getTime()) / (1000 * 3600);
                        }
                        allHoras.push({
                            id: item.registro_id,
                            tipo: 'registro',
                            inicio: item.inicio_trabajo,
                            fin: item.fin_trabajo,
                            estado_id: item.estado_id,
                            horas: Math.max(0, horas),
                            esDelLider: false
                        });
                    });
                }

                allHoras.sort((a, b) => {
                    if (a.estado_id !== b.estado_id) return a.estado_id - b.estado_id;
                    return new Date(b.inicio).getTime() - new Date(a.inicio).getTime();
                });

                setSolicitudesHoras(allHoras);

                // --- Procesar Ausencias ---
                if (ausenciasRes.ok) {
                    const ausData = await ausenciasRes.json();
                    if (Array.isArray(ausData)) {
                        setAusencias(ausData);
                    }
                }

                // --- Procesar Coberturas ---
                if (coberturasRes.ok) {
                    const cobData = await coberturasRes.json();
                    if (Array.isArray(cobData)) {
                        setCoberturas(cobData);
                    }
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Error al cargar solicitudes.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // --- Filtros ---
    const solicitudesFiltradas = solicitudesHoras.filter(s => {
        if (filtroHoras === 'pendientes') return s.estado_id === 1;
        if (filtroHoras === 'aprobadas') return s.estado_id === 2;
        if (filtroHoras === 'mis_solicitudes') return s.estado_id === 1 && !s.esDelLider;
        if (filtroHoras === 'del_lider') return s.estado_id === 1 && s.esDelLider;
        return true;
    });

    const ausenciasFiltradas = ausencias.filter(a => {
        if (filtroAusencias === 'pendientes') return a.requiere_aprobacion && a.estado_id === 1;
        if (filtroAusencias === 'aprobadas') return a.estado_id === 2;
        if (filtroAusencias === 'registros') return !a.requiere_aprobacion;
        return true;
    });

    const misSolicitudesCount = solicitudesHoras.filter(s => s.estado_id === 1 && !s.esDelLider).length;
    const delLiderCount = solicitudesHoras.filter(s => s.estado_id === 1 && s.esDelLider).length;

    const pendientesHoras = solicitudesHoras.filter(s => s.estado_id === 1).length;
    const pendientesEquipo = proyectos.length;
    const pendientesAusencias = ausencias.filter(a => a.requiere_aprobacion && a.estado_id === 1).length;
    const pendientesCoberturas = coberturas.filter(c => c.estado === 'pendiente').length;

    // --- Acciones Coberturas ---
    const aceptarCobertura = async (solicitudId: string) => {
        try {
            setActualizandoId(solicitudId);
            await fetch(`${API_BASE}/solicitudes/${solicitudId}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'aceptada' })
            });
            setCoberturas(prev => prev.map(c => c.solicitud_id === solicitudId ? { ...c, estado: 'aceptada' } : c));
        } catch (err) {
            console.error('Error aceptando cobertura:', err);
        } finally {
            setActualizandoId(null);
        }
    };

    const rechazarCobertura = async () => {
        if (!rechazarSolicitud) return;
        try {
            setActualizandoId(rechazarSolicitud.solicitud_id);
            await fetch(`${API_BASE}/solicitudes/${rechazarSolicitud.solicitud_id}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'rechazada', motivo_rechazo: motivoRechazoText || null })
            });
            setCoberturas(prev => prev.map(c => c.solicitud_id === rechazarSolicitud.solicitud_id ? { ...c, estado: 'rechazada', motivo_rechazo: motivoRechazoText } : c));
            setRechazarSolicitud(null);
            setMotivoRechazoText('');
        } catch (err) {
            console.error('Error rechazando cobertura:', err);
        } finally {
            setActualizandoId(null);
        }
    };

    // --- Acciones ---
    const actualizarEstadoPlan = async (planId: string, nuevoEstado: number) => {
        try {
            setActualizandoId(planId);
            const res = await fetch(`${API_BASE}/planificacion/${planId}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado_id: nuevoEstado })
            });
            if (!res.ok) throw new Error('Error al actualizar');
            setSolicitudesHoras(prev =>
                prev.map(s => s.id === planId ? { ...s, estado_id: nuevoEstado } : s)
            );
        } catch (err) {
            console.error('Error actualizando planificación:', err);
        } finally {
            setActualizandoId(null);
        }
    };

    // --- Helpers ---
    const formatearFecha = (fechaStr: string | null) => {
        if (!fechaStr) return 'No definida';
        const date = new Date(fechaStr);
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatearHora = (fechaStr: string) => {
        return new Date(fechaStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const formatearFechaCorta = (fechaStr: string) => {
        return new Date(fechaStr).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
    };

    const calcularDias = (inicio: string, fin: string) => {
        const diff = new Date(fin).getTime() - new Date(inicio).getTime();
        return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
    };

    // --- Render ---
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-gray-400 text-sm">Cargando solicitudes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="bg-red-500/10 border border-red-500/30 px-6 py-4 rounded-xl">
                    <p className="text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 text-white h-full flex flex-col gap-5 overflow-hidden">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">Solicitudes</h2>
                <p className="text-gray-400 text-sm mt-1">Gestiona tus asignaciones, horas y ausencias.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#1a1c24] p-1 rounded-xl border border-gray-800/50 shrink-0">
                {[
                    { key: 'coberturas' as TabActivo, label: 'Coberturas', icon: <ClipboardList className="w-4 h-4" />, count: pendientesCoberturas, color: 'bg-violet-500/20 text-violet-400' },
                    { key: 'equipos' as TabActivo, label: 'Equipos', icon: <Users className="w-4 h-4" />, count: pendientesEquipo, color: 'bg-indigo-500/20 text-indigo-400' },
                    { key: 'horas' as TabActivo, label: 'Horas', icon: <Clock className="w-4 h-4" />, count: pendientesHoras, color: 'bg-amber-500/20 text-amber-400' },
                    { key: 'ausencias' as TabActivo, label: 'Ausencias', icon: <CalendarOff className="w-4 h-4" />, count: pendientesAusencias, color: 'bg-rose-500/20 text-rose-400' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setTabActivo(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                            tabActivo === tab.key
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                tabActivo === tab.key ? 'bg-white/20 text-white' : tab.color
                            }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                {/* ============ TAB COBERTURAS ============ */}
                {tabActivo === 'coberturas' && (
                    <div className="flex flex-col gap-3">
                        {coberturas.length > 0 ? (
                            coberturas.map((cob) => {
                                const isPending = cob.estado === 'pendiente';
                                const isAccepted = cob.estado === 'aceptada';
                                const isRejected = cob.estado === 'rechazada';
                                const dias = Math.max(1, Math.ceil((new Date(cob.fecha_fin).getTime() - new Date(cob.fecha_inicio).getTime()) / 86400000) + 1);

                                return (
                                    <div key={cob.solicitud_id}
                                        className={`relative bg-[#1e2336]/80 backdrop-blur-md border p-4 rounded-2xl transition-all group overflow-hidden
                                            ${isPending ? 'border-violet-500/30 hover:border-violet-500/50' : isAccepted ? 'border-[#3b4256]/50 hover:border-[#4f5872]' : 'border-red-500/30 hover:border-red-500/50'}`}>
                                        <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl
                                            ${isPending ? 'bg-violet-500' : isAccepted ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                        <div className="flex items-center gap-4 pl-2">
                                            <div className={`p-2.5 rounded-xl shrink-0 ${isPending ? 'bg-violet-500/10 text-violet-400' : isAccepted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                <ClipboardList className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-sm text-white">{cob.motivo}</h4>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">COBERTURA</span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                                                    <span>Solicitado por <strong className="text-indigo-300">{cob.nombre_lider}</strong></span>
                                                    <span>{formatearFechaCorta(cob.fecha_inicio)} — {formatearFechaCorta(cob.fecha_fin)}</span>
                                                    <span className="text-indigo-300 font-medium">{dias} día{dias > 1 ? 's' : ''}</span>
                                                </div>
                                                {cob.descripcion && <p className="text-[10px] text-gray-500 mt-0.5">{cob.descripcion}</p>}
                                                {isRejected && cob.motivo_rechazo && (
                                                    <p className="text-[10px] text-red-400/70 mt-1 flex items-center gap-1">
                                                        <MessageSquare className="w-2.5 h-2.5" /> Tu motivo: "{cob.motivo_rechazo}"
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {isPending ? (
                                                    <>
                                                        <button onClick={() => aceptarCobertura(cob.solicitud_id)} disabled={actualizandoId === cob.solicitud_id}
                                                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50">
                                                            {actualizandoId === cob.solicitud_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                            Aceptar
                                                        </button>
                                                        <button onClick={() => { setRechazarSolicitud(cob); setMotivoRechazoText(''); }} disabled={actualizandoId === cob.solicitud_id}
                                                            className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50">
                                                            <X className="w-3 h-3" /> Rechazar
                                                        </button>
                                                    </>
                                                ) : isAccepted ? (
                                                    <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1.5 rounded-full text-[10px] font-bold border border-emerald-500/20">
                                                        <CheckCircle2 className="w-3 h-3" /> Aceptada
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 bg-red-500/10 text-red-400 px-2.5 py-1.5 rounded-full text-[10px] font-bold border border-red-500/20">
                                                        <XCircle className="w-3 h-3" /> Rechazada
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 rounded-2xl border border-white/10 border-dashed">
                                <ClipboardList className="w-12 h-12 text-gray-600 mb-3" />
                                <p className="text-gray-400 text-lg">No tienes solicitudes de cobertura.</p>
                                <p className="text-gray-500 text-sm mt-1">Aquí aparecerán las peticiones de tu líder para cubrir posiciones.</p>
                            </div>
                        )}
                    </div>
                )}

                {tabActivo === 'equipos' && (
                    /* ============ TAB EQUIPOS ============ */
                    <div className="flex flex-col gap-3">
                        {proyectos.length > 0 ? (
                            proyectos.map((proyecto) => (
                                <div
                                    key={proyecto.proyecto_id}
                                    className="bg-[#1e2336]/80 backdrop-blur-md border border-[#3b4256]/50 p-4 rounded-2xl hover:bg-[#252a40]/90 hover:border-[#4f5872] transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all pointer-events-none"></div>
                                    <div className="flex items-start gap-4">
                                        <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg text-white truncate">{proyecto.nombre_proyecto}</h3>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                                                <span className="text-gray-400">Cliente: <span className="text-gray-200 font-medium">{proyecto.cliente || 'Interno'}</span></span>
                                                <span className="text-gray-400">Rol: <span className="text-indigo-300 font-medium">{proyecto.rol_usuario}</span></span>
                                                <span className="text-gray-400">Equipo: <span className="text-gray-200 font-medium">{proyecto.totalMiembros} miembros</span></span>
                                            </div>
                                            <div className="flex gap-3 mt-3 text-xs">
                                                <div className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                                                    <span className="text-gray-500">Inicio: </span>
                                                    <span className="text-gray-300">{formatearFecha(proyecto.fecha_inicio)}</span>
                                                </div>
                                                <div className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                                                    <span className="text-gray-500">Entrega: </span>
                                                    <span className="text-gray-300">{formatearFecha(proyecto.fecha_entrega)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-500/20 shrink-0 self-center">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Asignado
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 rounded-2xl border border-white/10 border-dashed">
                                <Users className="w-12 h-12 text-gray-600 mb-3" />
                                <p className="text-gray-400 text-lg">No tienes asignaciones de equipo actualmente.</p>
                                <p className="text-gray-500 text-sm mt-1">Aquí aparecerán tus proyectos cuando seas asignado a uno.</p>
                            </div>
                        )}
                    </div>
                )}

                {tabActivo === 'horas' && (
                    /* ============ TAB HORAS ============ */
                    <div className="flex flex-col gap-3">
                        {/* Filtros rápidos */}
                        <div className="grid grid-cols-3 gap-3 mb-2">
                            <button onClick={() => setFiltroHoras('todos')} className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${filtroHoras === 'todos' ? 'bg-indigo-600/20 border-indigo-500/50 ring-1 ring-indigo-500/30' : 'bg-[#1a1c24] border-gray-800/50 hover:border-gray-600/50 hover:bg-[#1e2028]'}`}>
                                <p className={`text-[10px] font-bold uppercase mb-1 ${filtroHoras === 'todos' ? 'text-indigo-300' : 'text-gray-500'}`}>Total</p>
                                <p className={`text-lg font-black ${filtroHoras === 'todos' ? 'text-indigo-200' : 'text-white'}`}>{solicitudesHoras.length}</p>
                            </button>
                            <button onClick={() => setFiltroHoras('pendientes')} className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${filtroHoras === 'pendientes' ? 'bg-amber-600/20 border-amber-500/50 ring-1 ring-amber-500/30' : 'bg-[#1a1c24] border-gray-800/50 hover:border-gray-600/50 hover:bg-[#1e2028]'}`}>
                                <p className={`text-[10px] font-bold uppercase mb-1 ${filtroHoras === 'pendientes' ? 'text-amber-300' : 'text-amber-500/80'}`}>Pendientes</p>
                                <p className={`text-lg font-black ${filtroHoras === 'pendientes' ? 'text-amber-300' : 'text-amber-400'}`}>{pendientesHoras}</p>
                            </button>
                            <button onClick={() => setFiltroHoras('aprobadas')} className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${filtroHoras === 'aprobadas' ? 'bg-emerald-600/20 border-emerald-500/50 ring-1 ring-emerald-500/30' : 'bg-[#1a1c24] border-gray-800/50 hover:border-gray-600/50 hover:bg-[#1e2028]'}`}>
                                <p className={`text-[10px] font-bold uppercase mb-1 ${filtroHoras === 'aprobadas' ? 'text-emerald-300' : 'text-emerald-500/80'}`}>Aprobadas</p>
                                <p className={`text-lg font-black ${filtroHoras === 'aprobadas' ? 'text-emerald-300' : 'text-emerald-400'}`}>{solicitudesHoras.filter(s => s.estado_id === 2).length}</p>
                            </button>
                        </div>

                        {/* Filtros por origen */}
                        <div className="grid grid-cols-2 gap-3 mb-1">
                            <button onClick={() => setFiltroHoras('mis_solicitudes')} className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${filtroHoras === 'mis_solicitudes' ? 'bg-cyan-600/20 border-cyan-500/50 ring-1 ring-cyan-500/30' : 'bg-[#1a1c24] border-gray-800/50 hover:border-gray-600/50 hover:bg-[#1e2028]'}`}>
                                <p className={`text-[10px] font-bold uppercase mb-0.5 ${filtroHoras === 'mis_solicitudes' ? 'text-cyan-300' : 'text-gray-500'}`}>Mis solicitudes</p>
                                <p className={`text-xs text-gray-400 mb-1 ${filtroHoras === 'mis_solicitudes' ? 'text-cyan-400/70' : ''}`}>Pendiente del líder</p>
                                <p className={`text-lg font-black ${filtroHoras === 'mis_solicitudes' ? 'text-cyan-300' : 'text-cyan-400'}`}>{misSolicitudesCount}</p>
                            </button>
                            <button onClick={() => setFiltroHoras('del_lider')} className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${filtroHoras === 'del_lider' ? 'bg-violet-600/20 border-violet-500/50 ring-1 ring-violet-500/30' : 'bg-[#1a1c24] border-gray-800/50 hover:border-gray-600/50 hover:bg-[#1e2028]'}`}>
                                <p className={`text-[10px] font-bold uppercase mb-0.5 ${filtroHoras === 'del_lider' ? 'text-violet-300' : 'text-gray-500'}`}>Del líder</p>
                                <p className={`text-xs text-gray-400 mb-1 ${filtroHoras === 'del_lider' ? 'text-violet-400/70' : ''}`}>Pendiente mía</p>
                                <p className={`text-lg font-black ${filtroHoras === 'del_lider' ? 'text-violet-300' : 'text-violet-400'}`}>{delLiderCount}</p>
                            </button>
                        </div>

                        {solicitudesFiltradas.length > 0 ? (
                            solicitudesFiltradas.map((solicitud) => {
                                const isPending = solicitud.estado_id === 1;
                                const isPlan = solicitud.tipo === 'planificacion';

                                return (
                                    <div
                                        key={solicitud.id}
                                        className={`relative bg-[#1e2336]/80 backdrop-blur-md border p-4 rounded-2xl transition-all group overflow-hidden ${
                                            solicitud.estado_id === 1 ? 'border-amber-500/30 hover:border-amber-500/50'
                                            : solicitud.estado_id === 3 ? 'border-orange-500/30 hover:border-orange-500/50'
                                            : solicitud.estado_id === 4 ? 'border-sky-500/30 hover:border-sky-500/50'
                                            : solicitud.estado_id === 5 ? 'border-red-500/30 hover:border-red-500/50'
                                            : 'border-[#3b4256]/50 hover:border-[#4f5872]'
                                        }`}
                                    >
                                        <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                                            solicitud.estado_id === 1 ? 'bg-amber-500'
                                            : solicitud.estado_id === 2 ? 'bg-emerald-500'
                                            : solicitud.estado_id === 3 ? 'bg-orange-500'
                                            : solicitud.estado_id === 4 ? 'bg-sky-500'
                                            : solicitud.estado_id === 5 ? 'bg-red-500'
                                            : 'bg-gray-500'
                                        }`}></span>
                                        <div className="flex items-center gap-4 pl-2">
                                            <div className={`p-2.5 rounded-xl shrink-0 ${isPlan ? 'bg-cyan-500/10 text-cyan-400' : 'bg-violet-500/10 text-violet-400'}`}>
                                                {isPlan ? <CalendarClock className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-sm text-white">{isPlan ? 'Turno Planificado' : 'Registro de Horas'}</h4>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPlan ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'}`}>
                                                        {isPlan ? 'PLAN' : 'REGISTRO'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                                                    <span>{formatearFechaCorta(solicitud.inicio)}</span>
                                                    <span>{formatearHora(solicitud.inicio)}{solicitud.fin ? ` — ${formatearHora(solicitud.fin)}` : ' — En curso'}</span>
                                                    <span className="text-indigo-300 font-medium">{solicitud.horas.toFixed(1).replace(/\.0$/, '')}h</span>
                                                </div>
                                                {solicitud.esDelLider && (
                                                    <span className="text-[10px] text-violet-400 font-medium mt-0.5 inline-block">Asignado por líder</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {solicitud.estado_id === 1 ? (
                                                    <>
                                                        <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1.5 rounded-full text-[10px] font-bold border border-amber-500/20">
                                                            <AlertCircle className="w-3 h-3" />
                                                            Pendiente
                                                        </div>
                                                        {solicitud.esDelLider && (
                                                            <>
                                                                <button onClick={() => actualizarEstadoPlan(solicitud.id, 2)} disabled={actualizandoId === solicitud.id} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                                                    {actualizandoId === solicitud.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                                                    Aprobar
                                                                </button>
                                                                <button onClick={() => actualizarEstadoPlan(solicitud.id, 5)} disabled={actualizandoId === solicitud.id} className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                                                    <XCircle className="w-3 h-3" />
                                                                    Rechazar
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                ) : solicitud.estado_id === 2 ? (
                                                    <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1.5 rounded-full text-[10px] font-bold border border-emerald-500/20">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Aprobado
                                                    </div>
                                                ) : solicitud.estado_id === 3 ? (
                                                    <div className="flex items-center gap-1.5 bg-orange-500/10 text-orange-400 px-2.5 py-1.5 rounded-full text-[10px] font-bold border border-orange-500/20">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Corrección
                                                    </div>
                                                ) : solicitud.estado_id === 4 ? (
                                                    <div className="flex items-center gap-1.5 bg-sky-500/10 text-sky-400 px-2.5 py-1.5 rounded-full text-[10px] font-bold border border-sky-500/20">
                                                        <AlertCircle className="w-3 h-3" />
                                                        En Revisión
                                                    </div>
                                                ) : solicitud.estado_id === 5 ? (
                                                    <div className="flex items-center gap-1.5 bg-red-500/10 text-red-400 px-2.5 py-1.5 rounded-full text-[10px] font-bold border border-red-500/20">
                                                        <XCircle className="w-3 h-3" />
                                                        Rechazado
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 rounded-2xl border border-white/10 border-dashed">
                                <Clock className="w-12 h-12 text-gray-600 mb-3" />
                                <p className="text-gray-400 text-lg">No hay solicitudes de horas con este filtro.</p>
                            </div>
                        )}
                    </div>
                )}

                {tabActivo === 'ausencias' && (
                    /* ============ TAB AUSENCIAS ============ */
                    <div className="flex flex-col gap-3">
                        {/* Filtros */}
                        <div className="grid grid-cols-4 gap-2 mb-1">
                            <button onClick={() => setFiltroAusencias('todas')} className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${filtroAusencias === 'todas' ? 'bg-indigo-600/20 border-indigo-500/50 ring-1 ring-indigo-500/30' : 'bg-[#1a1c24] border-gray-800/50 hover:border-gray-600/50 hover:bg-[#1e2028]'}`}>
                                <p className={`text-[10px] font-bold uppercase mb-1 ${filtroAusencias === 'todas' ? 'text-indigo-300' : 'text-gray-500'}`}>Todas</p>
                                <p className={`text-lg font-black ${filtroAusencias === 'todas' ? 'text-indigo-200' : 'text-white'}`}>{ausencias.length}</p>
                            </button>
                            <button onClick={() => setFiltroAusencias('pendientes')} className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${filtroAusencias === 'pendientes' ? 'bg-amber-600/20 border-amber-500/50 ring-1 ring-amber-500/30' : 'bg-[#1a1c24] border-gray-800/50 hover:border-gray-600/50 hover:bg-[#1e2028]'}`}>
                                <p className={`text-[10px] font-bold uppercase mb-1 ${filtroAusencias === 'pendientes' ? 'text-amber-300' : 'text-amber-500/80'}`}>Pendientes</p>
                                <p className={`text-lg font-black ${filtroAusencias === 'pendientes' ? 'text-amber-300' : 'text-amber-400'}`}>{pendientesAusencias}</p>
                            </button>
                            <button onClick={() => setFiltroAusencias('aprobadas')} className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${filtroAusencias === 'aprobadas' ? 'bg-emerald-600/20 border-emerald-500/50 ring-1 ring-emerald-500/30' : 'bg-[#1a1c24] border-gray-800/50 hover:border-gray-600/50 hover:bg-[#1e2028]'}`}>
                                <p className={`text-[10px] font-bold uppercase mb-1 ${filtroAusencias === 'aprobadas' ? 'text-emerald-300' : 'text-emerald-500/80'}`}>Aprobadas</p>
                                <p className={`text-lg font-black ${filtroAusencias === 'aprobadas' ? 'text-emerald-300' : 'text-emerald-400'}`}>{ausencias.filter(a => a.estado_id === 2).length}</p>
                            </button>
                            <button onClick={() => setFiltroAusencias('registros')} className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${filtroAusencias === 'registros' ? 'bg-sky-600/20 border-sky-500/50 ring-1 ring-sky-500/30' : 'bg-[#1a1c24] border-gray-800/50 hover:border-gray-600/50 hover:bg-[#1e2028]'}`}>
                                <p className={`text-[10px] font-bold uppercase mb-1 ${filtroAusencias === 'registros' ? 'text-sky-300' : 'text-gray-500'}`}>Registros</p>
                                <p className={`text-lg font-black ${filtroAusencias === 'registros' ? 'text-sky-300' : 'text-sky-400'}`}>{ausencias.filter(a => !a.requiere_aprobacion).length}</p>
                            </button>
                        </div>

                        {ausenciasFiltradas.length > 0 ? (
                            ausenciasFiltradas.map((aus) => {
                                const isPending = aus.requiere_aprobacion && aus.estado_id === 1;
                                const isApproved = aus.estado_id === 2;
                                const isRegistro = !aus.requiere_aprobacion;
                                const dias = calcularDias(aus.inicio_ausencia, aus.fin_ausencia);

                                // Colores por tipo
                                let iconBg = 'bg-rose-500/10 text-rose-400';
                                let tipoBadgeStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                                if (isRegistro) {
                                    iconBg = 'bg-sky-500/10 text-sky-400';
                                    tipoBadgeStyle = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
                                }

                                return (
                                    <div
                                        key={aus.ausencia_id}
                                        className={`relative bg-[#1e2336]/80 backdrop-blur-md border p-4 rounded-2xl transition-all group overflow-hidden ${
                                            isPending
                                                ? 'border-amber-500/30 hover:border-amber-500/50'
                                                : aus.estado_id === 3 ? 'border-orange-500/30 hover:border-orange-500/50'
                                                : aus.estado_id === 4 ? 'border-sky-500/30 hover:border-sky-500/50'
                                                : aus.estado_id === 5 ? 'border-red-500/30 hover:border-red-500/50'
                                                : 'border-[#3b4256]/50 hover:border-[#4f5872]'
                                        }`}
                                    >
                                        <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                                            isPending ? 'bg-amber-500'
                                            : aus.estado_id === 2 ? (isRegistro ? 'bg-sky-500' : 'bg-emerald-500')
                                            : aus.estado_id === 3 ? 'bg-orange-500'
                                            : aus.estado_id === 4 ? 'bg-sky-500'
                                            : aus.estado_id === 5 ? 'bg-red-500'
                                            : 'bg-gray-500'
                                        }`}></span>

                                        <div className="flex items-center gap-4 pl-2">
                                            <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
                                                {isRegistro ? <ShieldCheck className="w-5 h-5" /> : <CalendarOff className="w-5 h-5" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-sm text-white">{aus.motivo}</h4>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tipoBadgeStyle}`}>
                                                        {isRegistro ? 'REGISTRO' : 'SOLICITUD'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                                                    <span>{formatearFechaCorta(aus.inicio_ausencia)} — {formatearFechaCorta(aus.fin_ausencia)}</span>
                                                    <span className="text-indigo-300 font-medium">{dias} día{dias > 1 ? 's' : ''}</span>
                                                </div>
                                                {isRegistro && (
                                                    <span className="text-[10px] text-sky-400/70 mt-0.5 inline-block">No requiere aprobación</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {isPending ? (
                                                    <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1.5 rounded-full text-[10px] font-bold border border-amber-500/20">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Pendiente
                                                    </div>
                                                ) : aus.estado_id === 2 ? (
                                                    <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1.5 rounded-full text-[10px] font-bold border border-emerald-500/20">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        {isRegistro ? 'Registrada' : 'Aprobada'}
                                                    </div>
                                                ) : aus.estado_id === 3 ? (
                                                    <div className="flex items-center gap-1.5 bg-orange-500/10 text-orange-400 px-2.5 py-1.5 rounded-full text-[10px] font-bold border border-orange-500/20">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Corrección
                                                    </div>
                                                ) : aus.estado_id === 4 ? (
                                                    <div className="flex items-center gap-1.5 bg-sky-500/10 text-sky-400 px-2.5 py-1.5 rounded-full text-[10px] font-bold border border-sky-500/20">
                                                        <AlertCircle className="w-3 h-3" />
                                                        En Revisión
                                                    </div>
                                                ) : aus.estado_id === 5 ? (
                                                    <div className="flex items-center gap-1.5 bg-red-500/10 text-red-400 px-2.5 py-1.5 rounded-full text-[10px] font-bold border border-red-500/20">
                                                        <XCircle className="w-3 h-3" />
                                                        Rechazada
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 rounded-2xl border border-white/10 border-dashed">
                                <CalendarOff className="w-12 h-12 text-gray-600 mb-3" />
                                <p className="text-gray-400 text-lg">No tienes ausencias registradas.</p>
                                <p className="text-gray-500 text-sm mt-1">Aquí aparecerán tus vacaciones, licencias y días administrativos.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de Rechazo de Cobertura */}
            {rechazarSolicitud && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setRechazarSolicitud(null)}>
                    <div className="bg-[#1e2336] rounded-2xl border border-[#3b4256] p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                            <MessageSquare className="w-5 h-5 text-red-400" />
                            Rechazar Solicitud
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Vas a rechazar la solicitud &quot;{rechazarSolicitud.motivo}&quot; de {rechazarSolicitud.nombre_lider}.
                            Indica el motivo para que pueda reasignarla a otra persona.
                        </p>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Motivo del rechazo</label>
                        <textarea value={motivoRechazoText} onChange={e => setMotivoRechazoText(e.target.value)}
                            placeholder="Ej: No puedo cubrir esas fechas por compromisos previos..."
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors resize-none h-20 mb-4" />
                        <div className="flex gap-2">
                            <button onClick={() => setRechazarSolicitud(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm cursor-pointer">
                                Cancelar
                            </button>
                            <button onClick={rechazarCobertura} disabled={actualizandoId === rechazarSolicitud.solicitud_id}
                                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50">
                                {actualizandoId === rechazarSolicitud.solicitud_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Confirmar Rechazo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}